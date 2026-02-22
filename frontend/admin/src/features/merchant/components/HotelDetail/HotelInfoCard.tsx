import { Button, Card, Descriptions, Space, Switch, Typography } from 'antd'
import { useNavigate } from '@tanstack/react-router'
import { useHotelDetail } from '../../hooks/useHotelDetail'

interface HotelInfoCardProps {
  hotelId: number
}

/**
 * 酒店基本信息卡片组件
 * 展示酒店的基本信息和首页广告开关
 */
export function HotelInfoCard({ hotelId }: HotelInfoCardProps) {
  const navigate = useNavigate()
  const { hotel, loading, updateHomeAd, updatingHomeAd } =
    useHotelDetail(hotelId)

  return (
    <Card loading={loading}>
      <Space orientation="vertical" size={8} style={{ width: '100%' }}>
        <Button onClick={() => navigate({ to: '/merchant/hotels' })}>
          返回酒店列表
        </Button>

        <Typography.Title level={3} className="m-0!">
          {hotel?.hotelNickname ?? `酒店 #${hotelId}`}
        </Typography.Title>

        <Descriptions bordered size="small" column={3}>
          <Descriptions.Item label="酒店ID">{hotel?.id}</Descriptions.Item>
          <Descriptions.Item label="信息总数">
            {hotel?.infoCount ?? 0}
          </Descriptions.Item>
          <Descriptions.Item label="当前发布信息ID">
            {hotel?.publishedInfoId ?? '暂无'}
          </Descriptions.Item>
        </Descriptions>

        <Space align="center">
          <Typography.Text>首页广告推送</Typography.Text>
          <Switch
            checked={hotel?.isHomeAdEnabled}
            loading={updatingHomeAd}
            onChange={updateHomeAd}
          />
        </Space>
      </Space>
    </Card>
  )
}
