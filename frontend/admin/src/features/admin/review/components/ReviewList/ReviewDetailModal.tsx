import type { AdminReviewHotelInfoDetail, RoomType } from '@/apis/hotel'
import type { ApiHotelTypes } from '@yisu/shared'
import { HotelReviewStatus, PriceMode } from '@yisu/shared'
import {
  Card,
  Descriptions,
  Form,
  Image,
  Modal,
  Space,
  Spin,
  Table,
  Tag,
} from 'antd'
import { useEffect } from 'react'
import {
  useReviewActions,
  useReviewInfoDetail,
} from '../../hooks/useReviewActions'
import { ReviewActionForm } from '../ReviewForm/ReviewActionForm'
import dayjs from 'dayjs'

function HotelInfoCard({
  info,
  loading,
}: {
  info?: AdminReviewHotelInfoDetail
  loading: boolean
}) {
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
        <Descriptions.Item label="信息昵称">
          {info.infoNickname}
        </Descriptions.Item>
        <Descriptions.Item label="酒店名">{info.name}</Descriptions.Item>
        <Descriptions.Item label="英文名">
          {info.enName ?? '-'}
        </Descriptions.Item>
        <Descriptions.Item label="星级">{info.starLevel}星</Descriptions.Item>
        <Descriptions.Item label="电话">{info.phone ?? '-'}</Descriptions.Item>
        <Descriptions.Item label="省">{info.province || '-'}</Descriptions.Item>
        <Descriptions.Item label="市">{info.city || '-'}</Descriptions.Item>
        <Descriptions.Item label="区">{info.district || '-'}</Descriptions.Item>
        <Descriptions.Item label="详细地址">{info.address}</Descriptions.Item>
        <Descriptions.Item label="简介" span={2}>
          {info.description ?? '-'}
        </Descriptions.Item>
        <Descriptions.Item label="标签" span={2}>
          {(info.tags ?? []).map((tag) => (
            <Tag key={tag}>{tag}</Tag>
          ))}
        </Descriptions.Item>
        <Descriptions.Item label="商家">
          {info.hotel.merchant.username}
        </Descriptions.Item>
        <Descriptions.Item label="开业时间">
          {info.openedAt ? dayjs(info.openedAt).format('YYYY-MM-DD') : '-'}
        </Descriptions.Item>
        <Descriptions.Item label="广告图" span={2}>
          {info.homeAdImage ? (
            <Image src={info.homeAdImage} width={200} />
          ) : (
            '-'
          )}
        </Descriptions.Item>
        <Descriptions.Item label="轮播图" span={2}>
          <Image.PreviewGroup>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
              {info.images.map((image) => (
                <Card
                  key={image.id}
                  hoverable
                  style={{ width: 150 }}
                  cover={<Image alt={image.caption} src={image.url} />}
                  bodyStyle={{ padding: '8px' }}
                >
                  {image.caption && (
                    <div
                      style={{
                        fontSize: '12px',
                        color: '#888',
                        textAlign: 'center',
                      }}
                    >
                      {image.caption}
                    </div>
                  )}
                </Card>
              ))}
            </div>
          </Image.PreviewGroup>
        </Descriptions.Item>
      </Descriptions>
      <Table
        size="small"
        className="mt-4"
        bordered
        pagination={false}
        rowKey="id"
        dataSource={info.roomTypes}
        expandable={{
          expandedRowRender: (record: RoomType) => {
            if (
              record.priceMode !== PriceMode.PER_HOUR ||
              !record.hourlySlots ||
              record.hourlySlots.length === 0
            ) {
              return null
            }
            return (
              <>
                <p style={{ color: 'grey', fontSize: '12px', margin: 0 }}>
                  结束时间将按 房型时长单位({record.duration}小时) 自动推导
                </p>
                <Space wrap>
                  <span>可预订时段:</span>
                  {record.hourlySlots.map((slot) => (
                    <Tag key={slot.id}>{slot.startTime}</Tag>
                  ))}
                </Space>
              </>
            )
          },
          rowExpandable: (record: RoomType) =>
            record.priceMode === PriceMode.PER_HOUR &&
            !!record.hourlySlots &&
            record.hourlySlots.length > 0,
        }}
        columns={[
          { title: '房型名', dataIndex: 'name' },
          { title: '数量', dataIndex: 'count' },
          { title: '价格', dataIndex: 'price' },
          {
            title: '房型',
            dataIndex: 'priceMode',
            render: (mode: PriceMode) => {
              if (mode === PriceMode.PER_NIGHT) {
                return '标准住宿'
              }
              if (mode === PriceMode.PER_HOUR) {
                return '钟点房'
              }
              return mode
            },
          },
          {
            title: '购买时长',
            dataIndex: 'duration',
            render: (duration: number, record: RoomType) => {
              if (record.priceMode === PriceMode.PER_NIGHT) {
                return `${duration}晚`
              }
              if (record.priceMode === PriceMode.PER_HOUR) {
                return `${duration}小时`
              }
              return duration
            },
          },
          {
            title: '床型说明',
            dataIndex: 'bedType',
            render: (bedType: string | null) => bedType || '-',
          },
          {
            title: '面积',
            dataIndex: 'area',
            render: (area: number | null) => (area ? `${area} m²` : '-'),
          },
          {
            title: '参考图',
            dataIndex: 'imageUrl',
            render: (url: string | null) =>
              url ? <Image src={url} width={80} /> : '-',
          },
          { title: '入住人数', dataIndex: 'maxGuests' },
        ]}
      />
    </Card>
  )
}

// ---- 主组件 ----

interface ReviewDetailModalProps {
  open: boolean
  infoId: number | null
  onClose: () => void
}

/**
 * 审核详情模态框
 * 展示酒店信息详情并提供审核操作
 */
export function ReviewDetailModal({
  open,
  infoId,
  onClose,
}: ReviewDetailModalProps) {
  const { info, loading } = useReviewInfoDetail(infoId)
  const { submit, submitting } = useReviewActions()
  const [form] = Form.useForm<ApiHotelTypes['AdminReviewAction']>()

  useEffect(() => {
    if (open && infoId) {
      form.setFieldsValue({
        action: HotelReviewStatus.APPROVED,
        rejectReason: undefined,
        rejectDetail: undefined,
      })
    }
  }, [open, infoId, form])

  const handleSubmit = async () => {
    if (!infoId) return
    try {
      const values = await form.validateFields()
      submit(
        { infoId, data: values },
        {
          onSuccess: () => {
            onClose()
            form.resetFields()
          },
        },
      )
    } catch {
      // 表单验证失败
    }
  }

  const handleCancel = () => {
    onClose()
    form.resetFields()
  }

  return (
    <Modal
      width={1000}
      title={infoId ? `酒店信息审核 #${infoId}` : '酒店信息审核'}
      open={open}
      onCancel={handleCancel}
      onOk={() => void handleSubmit()}
      confirmLoading={submitting}
    >
      <Space orientation="vertical" size={16} style={{ width: '100%' }}>
        <HotelInfoCard info={info} loading={loading} />
        <ReviewActionForm form={form} />
      </Space>
    </Modal>
  )
}
