import type { AdminReviewHotelInfoDetail } from '@/apis/hotel'
import { Card, Descriptions, Spin } from 'antd'

interface HotelInfoDetailCardProps {
  info?: AdminReviewHotelInfoDetail
  loading: boolean
}

/**
 * 酒店信息详情卡片
 * 只负责展示，不包含业务逻辑
 */
export function HotelInfoDetailCard({ info, loading }: HotelInfoDetailCardProps) {
  if (loading) {
    return (
      <Card>
        <Spin />
      </Card>
    )
  }

  if (!info) {
    return <Card>暂无数据</Card>
  }

  return (
    <Card>
      <Descriptions bordered size="small" column={2}>
        <Descriptions.Item label="酒店昵称">
          {info.hotel.hotelNickname}
        </Descriptions.Item>
        <Descriptions.Item label="信息昵称">{info.infoNickname}</Descriptions.Item>
        <Descriptions.Item label="酒店名">{info.name}</Descriptions.Item>
        <Descriptions.Item label="英文名">{info.enName ?? '-'}</Descriptions.Item>
        <Descriptions.Item label="星级">{info.starLevel}星</Descriptions.Item>
        <Descriptions.Item label="电话">{info.phone ?? '-'}</Descriptions.Item>
        <Descriptions.Item label="地址" span={2}>
          {info.address}
        </Descriptions.Item>
        <Descriptions.Item label="简介" span={2}>
          {info.description ?? '-'}
        </Descriptions.Item>
        <Descriptions.Item label="房型数量">{info.roomTypes.length ?? 0}</Descriptions.Item>
        <Descriptions.Item label="轮播图数量">{info.images.length ?? 0}</Descriptions.Item>
        <Descriptions.Item label="商家">
          {info.hotel.merchant.username}
        </Descriptions.Item>
        <Descriptions.Item label="开业时间">
          {info.openedAt ?? '-'}
        </Descriptions.Item>
      </Descriptions>
    </Card>
  )
}
