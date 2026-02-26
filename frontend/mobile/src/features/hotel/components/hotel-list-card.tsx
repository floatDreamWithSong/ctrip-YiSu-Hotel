import Stars from '@/components/common/starts'
import type { ApiMobileHotelTypes } from '@yisu/shared'

type HotelListItem =
  ApiMobileHotelTypes['MobileHotelSearchResponse']['items'][number]

interface HotelListCardProps {
  item: HotelListItem
  onClick?: () => void
  className?: string
}

const HotelListCard = ({ item, onClick, className }: HotelListCardProps) => {
  return (
    <div
      className={className ?? 'rounded-2xl bg-white p-3 shadow-sm'}
      onClick={onClick}
    >
      <div className="flex gap-3">
        <div className="w-28 shrink-0 self-stretch overflow-hidden rounded-xl">
          {item.coverImage && (
            <img
              src={item.coverImage}
              alt={item.name}
              className="h-full w-full object-cover"
            />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="mb-1 truncate text-base font-medium text-gray-800">
            {item.name}
          </div>
          {item.enName && (
            <div className="mt-1 truncate text-[11px] text-gray-400">
              {item.enName}
            </div>
          )}
          <Stars stars={item.starLevel} className="mb-1" />
          <div className="mb-2 line-clamp-1 text-xs text-gray-500 text-ellipsis overflow-hidden">
            {item.address}
          </div>
          <div className="flex items-center justify-between">
            <div className="text-orange-500">
              {item.minPrice === null
                ? '暂无报价'
                : `￥${item.minPrice.toFixed(0)} 起`}
            </div>
            <div className="text-xs text-gray-500">
              {item.distanceMeters === null
                ? '-'
                : `${(item.distanceMeters / 1000).toFixed(1)} km`}
            </div>
          </div>
          <div className="mt-2 flex flex-wrap gap-1">
            {item.tags.slice(0, 4).map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-gray-100 px-2 py-[2px] text-[11px] text-gray-600"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default HotelListCard
