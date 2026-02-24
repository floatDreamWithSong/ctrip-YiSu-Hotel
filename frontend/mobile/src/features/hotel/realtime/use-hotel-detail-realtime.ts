import { useEffect, useEffectEvent } from 'react'
import {
  hotelDetailRealtimeClient,
  type HotelDetailRealtimeEvent,
} from './hotel-detail-realtime-client'

export const useHotelDetailRealtime = (
  hotelId: number,
  onEvent: (event: HotelDetailRealtimeEvent) => void,
) => {
  const handleEvent = useEffectEvent(onEvent)

  useEffect(() => {
    if (!Number.isInteger(hotelId) || hotelId <= 0) return

    const unsubscribe = hotelDetailRealtimeClient.subscribe((event) => {
      if (event.hotelId !== hotelId) return
      handleEvent(event)
    })

    hotelDetailRealtimeClient.enterHotel(hotelId)

    return () => {
      unsubscribe()
      hotelDetailRealtimeClient.leaveHotel(hotelId)
    }
  }, [hotelId])
}
