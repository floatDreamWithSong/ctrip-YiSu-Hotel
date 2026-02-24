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
    const position = await Geolocation.getCurrentPosition({
      timeout: options.timeout,
      maximumAge: options.maximumAge,
      enableHighAccuracy: options.enableHighAccuracy,
    })

    return {
      lng: position.coords.longitude,
      lat: position.coords.latitude,
    }
  } catch (error) {
    if (error instanceof Error && error.message) {
      throw error
    }
    throw new Error('定位失败，请检查定位权限')
  }
}
