import { Space } from 'antd'
import { HotelInfoCard } from '../components/HotelDetail/HotelInfoCard'
import { HotelInfoList } from '../components/HotelDetail/HotelInfoList'

interface HotelDetailPageProps {
  hotelId: number
}

/**
 * 商家端 - 酒店详情页面
 * 重构后的版本：页面组件只负责布局
 */
export default function HotelDetailPage({ hotelId }: HotelDetailPageProps) {
  return (
    <Space orientation="vertical" size={16} style={{ width: '100%' }}>
      <HotelInfoCard hotelId={hotelId} />
      <HotelInfoList hotelId={hotelId} />
    </Space>
  )
}
