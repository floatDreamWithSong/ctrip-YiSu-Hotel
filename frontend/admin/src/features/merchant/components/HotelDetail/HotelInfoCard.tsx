import {
  Button,
  Card,
  Col,
  Row,
  Space,
  Statistic,
  Switch,
  Typography,
} from 'antd'
import { useNavigate } from '@tanstack/react-router'
import { useHotelDetail } from '../../hooks/useHotelDetail'
import { FileText, Tag } from 'lucide-react'
import { MerchantHotelRequest } from '@/apis/hotel'
import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'

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

  // 获取所有酒店信息，用于根据 publishedInfoId 查找对应昵称
  const infosQuery = useQuery({
    queryKey: ['merchant-hotel-infos-all', hotelId],
    queryFn: () =>
      MerchantHotelRequest.getHotelInfos(hotelId, { page: 1, limit: 1000 }),
  })

  // 根据 publishedInfoId 查找对应的信息昵称
  const publishedInfoNickname = useMemo(() => {
    if (!hotel?.publishedInfoId) return null
    const infos = infosQuery.data?.items ?? []
    const publishedInfo = infos.find(
      (info) => info.id === hotel.publishedInfoId,
    )
    return publishedInfo?.infoNickname ?? null
  }, [hotel, infosQuery.data])

  return (
    <Card loading={loading}>
      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        <Button onClick={() => navigate({ to: '/merchant/hotels' })}>
          返回酒店列表
        </Button>

        <Typography.Title level={3} style={{ margin: 0 }}>
          {hotel?.hotelNickname ?? `酒店 #${hotelId}`}
        </Typography.Title>

        {/* 数据卡片区域 */}
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={16} md={8}>
            <Card>
              <Statistic
                title="信息总数"
                value={hotel?.infoCount ?? 0}
                prefix={<FileText />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={16} md={8}>
            <Card>
              <Statistic
                title="当前发布的信息昵称"
                value={publishedInfoNickname ?? '暂无'}
                prefix={<Tag />}
              />
            </Card>
          </Col>
        </Row>

        {/* 首页广告推送开关 */}
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
