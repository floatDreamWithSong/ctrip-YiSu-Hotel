import { Toast } from 'antd-mobile'
import { LocationFill } from 'antd-mobile-icons'
import { useMutation } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { LocationRequest } from '@yisu/front-utils/apis/location'
import { getCurrentPosition } from '@/lib/mobile-geolocation'
import { useLocationStore } from '@/store/location'
import cn from '@yisu/front-utils/cn'
import { ChevronRight, Loader2Icon } from 'lucide-react'

export const LocationInput = ({
  className,
  ...props
}: React.ComponentProps<'div'>) => {
  const navigate = useNavigate()
  const { city, address, updateLocation } = useLocationStore()

  const locateMutation = useMutation({
    mutationFn: async () => {
      const pos = await getCurrentPosition()
      const result = await LocationRequest.regeocode(`${pos.lng},${pos.lat}`)
      return result
    },
    onSuccess: (data) => {
      updateLocation({
        city: data.city || data.province,
        address: data.formattedAddress,
        location: data.location,
      })
      Toast.show({
        icon: 'success',
        content: '定位成功',
      })
    },
    onError: (error: Error) => {
      Toast.show({
        icon: 'fail',
        content: error.message || '定位失败，请重试',
      })
    },
  })

  const displayText = address || city || '请选择位置'

  return (
    <div className={cn('relative', className)} {...props}>
      <div className="flex items-center gap-4">
        <div className="min-w-0 flex-1 gap-1 flex flex-nowrap items-center">
          <div
            onClick={() => navigate({ to: '/address-search' })}
            className={cn(
              'min-w-0 flex-1 text-nowrap overflow-hidden text-ellipsis',
              'cursor-pointer font-bold',
            )}
          >
            {displayText}
          </div>
          <ChevronRight className="shrink-0 text-gray-300" size={20} />
        </div>
        <button
          type="button"
          disabled={locateMutation.isPending}
          onClick={() => locateMutation.mutate()}
          className="shrink-0 flex flex-nowrap items-center gap-2 text-primary font-bold disabled:opacity-50"
        >
          当前位置
          {locateMutation.isPending ? (
            <Loader2Icon className="animate-spin" size={16} />
          ) : (
            <LocationFill className="size-4" />
          )}
        </button>
      </div>
    </div>
  )
}
