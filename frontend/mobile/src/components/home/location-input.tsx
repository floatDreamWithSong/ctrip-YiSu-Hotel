import { Button, Toast } from 'antd-mobile'
import { LocationFill } from 'antd-mobile-icons'
import { useMutation } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { LocationRequest } from '@yisu/front-utils/apis/location'
import { getCurrentPosition } from '@yisu/front-utils/geolocation'
import { useLocationStore } from '@/store/location'
import cn from '@yisu/front-utils/cn'
import { LoadingOutlined } from '@ant-design/icons'

export const LocationInput = () => {
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
    <div className="relative">
      <div className="flex items-center gap-2">
        <Button
          size="middle"
          fill="outline"
          color="primary"
          loadingIcon={<LoadingOutlined />}
          loading={locateMutation.isPending}
          onClick={() => locateMutation.mutate()}
          className="shrink-0"
        >
          <LocationFill />
        </Button>

        <div
          onClick={() => navigate({ to: '/address-search' })}
          className={cn(
            'flex-1 px-3 py-2 rounded-lg border border-gray-200 bg-gray-50',
            'cursor-pointer hover:bg-gray-100 transition-colors',
          )}
        >
          <span className="text-gray-700">{displayText}</span>
        </div>
      </div>
    </div>
  )
}
