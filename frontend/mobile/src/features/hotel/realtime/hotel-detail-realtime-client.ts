import { env } from '@/env'
import { tokenStore } from '@/lib/request'
import type {
  ClientMessage,
  HotelDetailRealtimeEvent,
  ServerMessage,
} from '@yisu/shared'

type Listener = (event: HotelDetailRealtimeEvent) => void

const DISCONNECT_GRACE_MS = 30_000
const RECONNECT_DELAY_MS = 2_000

class HotelDetailRealtimeClient {
  private socket: WebSocket | null = null
  private listeners = new Set<Listener>()
  private viewingHotelRefCounts = new Map<number, number>()
  private disconnectTimer: number | null = null
  private reconnectTimer: number | null = null
  private isAuthed = false
  private isManualClose = false
  private shouldReconnect = false

  enterHotel(hotelId: number) {
    if (!Number.isInteger(hotelId) || hotelId <= 0) return

    this.clearDisconnectTimer()
    this.shouldReconnect = true

    const currentCount = this.viewingHotelRefCounts.get(hotelId) ?? 0
    this.viewingHotelRefCounts.set(hotelId, currentCount + 1)

    this.ensureConnected()
    this.syncViewingHotels()
  }

  leaveHotel(hotelId: number) {
    if (!Number.isInteger(hotelId) || hotelId <= 0) return

    const currentCount = this.viewingHotelRefCounts.get(hotelId) ?? 0
    if (currentCount <= 1) {
      this.viewingHotelRefCounts.delete(hotelId)
    } else {
      this.viewingHotelRefCounts.set(hotelId, currentCount - 1)
    }

    this.syncViewingHotels()

    if (this.viewingHotelRefCounts.size === 0) {
      this.shouldReconnect = false
      this.scheduleDisconnect()
    }
  }

  subscribe(listener: Listener) {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  private ensureConnected() {
    if (typeof window === 'undefined') return
    if (!tokenStore.get()) return

    if (
      this.socket &&
      (this.socket.readyState === WebSocket.OPEN ||
        this.socket.readyState === WebSocket.CONNECTING)
    ) {
      return
    }

    this.clearReconnectTimer()
    this.isManualClose = false
    this.isAuthed = false

    const wsUrl = this.createWebSocketUrl()
    const socket = new WebSocket(wsUrl)
    this.socket = socket

    socket.addEventListener('open', () => {
      const token = tokenStore.get()
      if (!token) {
        this.closeSocket()
        return
      }
      socket.send(
        JSON.stringify({ type: 'auth', token } satisfies ClientMessage),
      )
    })

    socket.addEventListener('message', (event) => {
      this.handleServerMessage(event.data)
    })

    socket.addEventListener('close', (event) => {
      const wasAuthed = this.isAuthed
      if (this.socket === socket) {
        this.socket = null
      }
      this.isAuthed = false

      if (
        !this.isManualClose &&
        this.shouldReconnect &&
        this.viewingHotelRefCounts.size > 0 &&
        this.shouldReconnectAfterClose(event, wasAuthed)
      ) {
        this.reconnectTimer = window.setTimeout(() => {
          this.ensureConnected()
        }, RECONNECT_DELAY_MS)
      }
    })

    socket.addEventListener('error', () => {
      // close event will handle reconnect
    })
  }

  private handleServerMessage(raw: unknown) {
    if (typeof raw !== 'string') return

    let payload: ServerMessage | null = null
    try {
      payload = JSON.parse(raw) as ServerMessage
    } catch {
      return
    }

    if (!payload || typeof payload !== 'object' || !('type' in payload)) {
      return
    }

    if (payload.type === 'authed') {
      this.isAuthed = true
      this.syncViewingHotels()
      return
    }

    if (payload.type === 'hotel_info_updated') {
      this.listeners.forEach((listener) => {
        listener(payload)
      })
      return
    }
  }

  private syncViewingHotels() {
    if (
      !this.socket ||
      this.socket.readyState !== WebSocket.OPEN ||
      !this.isAuthed
    ) {
      return
    }

    const hotelIds = Array.from(this.viewingHotelRefCounts.keys())
    this.socket.send(
      JSON.stringify({
        type: 'sync_viewing_hotels',
        hotelIds,
      } satisfies ClientMessage),
    )
  }

  private scheduleDisconnect() {
    this.clearDisconnectTimer()
    this.disconnectTimer = window.setTimeout(() => {
      if (this.viewingHotelRefCounts.size > 0) return
      this.closeSocket()
    }, DISCONNECT_GRACE_MS)
  }

  private closeSocket() {
    this.clearReconnectTimer()
    this.clearDisconnectTimer()
    this.isManualClose = true
    this.isAuthed = false

    if (!this.socket) return
    const socket = this.socket
    this.socket = null
    if (
      socket.readyState === WebSocket.OPEN ||
      socket.readyState === WebSocket.CONNECTING
    ) {
      socket.close()
    }
  }

  private clearDisconnectTimer() {
    if (this.disconnectTimer !== null) {
      window.clearTimeout(this.disconnectTimer)
      this.disconnectTimer = null
    }
  }

  private clearReconnectTimer() {
    if (this.reconnectTimer !== null) {
      window.clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
  }

  private shouldReconnectAfterClose(event: CloseEvent, wasAuthed: boolean) {
    // Policy-violation during pre-auth indicates token/auth failure (invalid, missing, forbidden).
    if (!wasAuthed && event.code === 1008) {
      return false
    }

    return true
  }

  private createWebSocketUrl() {
    const url = new URL(env.VITE_API_BASE_URL)
    url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:'
    url.pathname = '/ws/hotel-detail'
    url.search = ''
    url.hash = ''
    return url.toString()
  }
}

export const hotelDetailRealtimeClient = new HotelDetailRealtimeClient()
export type { HotelDetailRealtimeEvent }
