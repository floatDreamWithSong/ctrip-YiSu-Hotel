import { Capacitor } from '@capacitor/core'
import {
  getCurrentPosition as getWebCurrentPosition,
  type GeolocationOptions,
  type GeolocationPosition,
} from '@yisu/front-utils/geolocation'

const isNativeCapacitor = () => {
  if (typeof window === 'undefined') return false
  return Capacitor.isNativePlatform()
}

const isTimeoutError = (error: unknown) => {
  if (!(error instanceof Error)) return false
  const message = error.message.toLowerCase()
  return message.includes('timeout') || message.includes('in time')
}

export async function getCurrentPosition(
  options: GeolocationOptions = {},
): Promise<GeolocationPosition> {
  if (!isNativeCapacitor()) {
    return getWebCurrentPosition(options)
  }

  const { Geolocation } = await import('@capacitor/geolocation')

  try {
    await Geolocation.requestPermissions()
  } catch {
    // Permission request may fail on some WebView/device states; getCurrentPosition will surface the final error.
  }

  try {
    const primaryOptions = {
      timeout: options.timeout ?? 30_000,
      maximumAge: options.maximumAge ?? 60_000,
      enableHighAccuracy: options.enableHighAccuracy ?? true,
    }
    const position = await Geolocation.getCurrentPosition(primaryOptions)

    return {
      lng: position.coords.longitude,
      lat: position.coords.latitude,
    }
  } catch (error) {
    if (isTimeoutError(error)) {
      try {
        // Fallback to a faster/less strict request and allow recent cached location.
        const fallbackPosition = await Geolocation.getCurrentPosition({
          timeout: Math.max(options.timeout ?? 30_000, 45_000),
          maximumAge: Math.max(options.maximumAge ?? 60_000, 300_000),
          enableHighAccuracy: false,
        })

        return {
          lng: fallbackPosition.coords.longitude,
          lat: fallbackPosition.coords.latitude,
        }
      } catch {
        throw new Error(
          '定位超时，请确认系统定位已开启，并为应用授予“精确位置”权限后重试',
        )
      }
    }

    if (error instanceof Error && error.message) {
      throw error
    }
    throw new Error('定位失败，请检查定位权限')
  }
}
