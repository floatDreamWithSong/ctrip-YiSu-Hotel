import { JwtUtils } from '@/utils/jwt/jwt.service'
import { HttpAdapterHost } from '@nestjs/core'
import { Injectable, Logger, OnApplicationBootstrap, OnApplicationShutdown } from '@nestjs/common'
import { Realm } from 'prisma-generated'
import type { IncomingMessage } from 'http'
import type { Duplex } from 'stream'
import { WebSocketServer, WebSocket } from 'ws'
import { ClientMessage, ServerMessage } from '@yisu/shared'

interface ConnectionState {
  userId: number | null
  authed: boolean
  viewingHotelIds: Set<number>
}

@Injectable()
export class HotelRealtimeService
  implements OnApplicationBootstrap, OnApplicationShutdown
{
  private readonly logger = new Logger(HotelRealtimeService.name)
  private readonly wsPath = '/ws/hotel-detail'
  private readonly wss = new WebSocketServer({ noServer: true })
  private readonly connections = new Map<WebSocket, ConnectionState>()
  private upgradeBoundServer: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    on: (event: string, listener: (...args: any[]) => void) => void
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    off?: (event: string, listener: (...args: any[]) => void) => void
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    removeListener?: (event: string, listener: (...args: any[]) => void) => void
  } | null = null

  constructor(
    private readonly httpAdapterHost: HttpAdapterHost,
    private readonly jwtUtils: JwtUtils,
  ) {
    this.wss.on('connection', (socket, request) => {
      this.handleConnection(socket, request)
    })
  }

  onApplicationBootstrap() {
    const httpServer = this.httpAdapterHost.httpAdapter?.getHttpServer?.()
    if (!httpServer?.on) {
      this.logger.warn('HTTP server unavailable, hotel realtime websocket disabled')
      return
    }
    this.upgradeBoundServer = httpServer
    httpServer.on('upgrade', this.handleUpgrade)
  }

  onApplicationShutdown() {
    if (this.upgradeBoundServer) {
      this.upgradeBoundServer.off?.('upgrade', this.handleUpgrade)
      this.upgradeBoundServer.removeListener?.('upgrade', this.handleUpgrade)
      this.upgradeBoundServer = null
    }
    this.wss.close()
    this.connections.forEach((_state, socket) => {
      try {
        socket.close()
      } catch {
        // noop
      }
    })
    this.connections.clear()
  }

  notifyHotelInfoApproved(payload: { hotelId: number; infoId: number }) {
    let delivered = 0
    for (const [socket, state] of this.connections) {
      if (!state.authed || !state.viewingHotelIds.has(payload.hotelId)) {
        continue
      }
      if (socket.readyState !== WebSocket.OPEN) {
        continue
      }
      this.send(socket, {
        type: 'hotel_info_updated',
        hotelId: payload.hotelId,
        infoId: payload.infoId,
      })
      delivered += 1
    }
    this.logger.log(
      `hotel_info_updated pushed: hotelId=${payload.hotelId}, infoId=${payload.infoId}, delivered=${delivered}`,
    )
  }

  private readonly handleUpgrade = (
    request: IncomingMessage,
    socket: Duplex,
    head: Buffer,
  ) => {
    const pathname = this.getRequestPathname(request)
    if (pathname !== this.wsPath) {
      this.closeNonMatchingUpgradeSocket(socket)
      return
    }

    this.wss.handleUpgrade(request, socket, head, (ws) => {
      this.wss.emit('connection', ws, request)
    })
  }

  private handleConnection(socket: WebSocket, request: IncomingMessage) {
    this.connections.set(socket, {
      userId: null,
      authed: false,
      viewingHotelIds: new Set(),
    })
    this.logger.debug(`ws connected: ${request.socket.remoteAddress ?? 'unknown'}`)

    socket.on('message', (raw) => {
      this.handleMessage(socket, raw.toString())
    })

    socket.on('close', () => {
      this.connections.delete(socket)
    })

    socket.on('error', (error) => {
      this.logger.warn(`ws error: ${error.message}`)
    })
  }

  private handleMessage(socket: WebSocket, raw: string) {
    const state = this.connections.get(socket)
    if (!state) return

    let payload: ClientMessage | null = null
    try {
      payload = JSON.parse(raw) as ClientMessage
    } catch {
      this.send(socket, { type: 'error', message: 'Invalid JSON payload' })
      return
    }

    if (!payload || typeof payload !== 'object' || !('type' in payload)) {
      this.send(socket, { type: 'error', message: 'Invalid message payload' })
      return
    }

    if (payload.type === 'auth') {
      const token = this.normalizeToken(payload.token)
      if (!token) {
        this.send(socket, { type: 'error', message: 'Missing token' })
        socket.close(1008, 'Missing token')
        return
      }
      try {
        const jwtPayload = this.jwtUtils.verifyAccessToken(token)
        if (jwtPayload.userType !== Realm.MOBILE) {
          this.send(socket, { type: 'error', message: 'Forbidden user type' })
          socket.close(1008, 'Forbidden')
          return
        }
        state.userId = jwtPayload.sub
        state.authed = true
        this.send(socket, { type: 'authed' })
      } catch {
        this.send(socket, { type: 'error', message: 'Invalid access token' })
        socket.close(1008, 'Unauthorized')
      }
      return
    }

    if (!state.authed) {
      this.send(socket, { type: 'error', message: 'Unauthenticated' })
      return
    }

    if (payload.type === 'sync_viewing_hotels') {
      const hotelIds = Array.isArray(payload.hotelIds) ? payload.hotelIds : []
      state.viewingHotelIds = new Set(
        hotelIds
          .map((id) => Number(id))
          .filter((id) => Number.isInteger(id) && id > 0)
          .slice(0, 20),
      )
    }
  }

  private send(socket: WebSocket, message: ServerMessage) {
    if (socket.readyState !== WebSocket.OPEN) return
    socket.send(JSON.stringify(message))
  }

  private getRequestPathname(request: IncomingMessage) {
    const rawUrl = request.url ?? ''
    try {
      return new URL(rawUrl, 'http://localhost').pathname
    } catch {
      return rawUrl
    }
  }

  private normalizeToken(token?: string) {
    if (!token || typeof token !== 'string') return null
    return token.startsWith('Bearer ') ? token.slice(7) : token
  }

  private closeNonMatchingUpgradeSocket(socket: Duplex) {
    try {
      socket.destroy()
    } catch {
      // noop
    }
  }
}
