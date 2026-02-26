import { PriceMode } from '@yisu/shared'
import type { ApiHotelTypes } from '@yisu/shared'
import { Card, Descriptions, Divider, Image, Space, Table, Tag } from 'antd'
import dayjs from 'dayjs'

type HotelInfoFormValues = ApiHotelTypes['HotelInfoCreate']

type RoomTypeValue = HotelInfoFormValues['roomTypes'][number]

interface HotelInfoViewCardProps {
  values: HotelInfoFormValues
}

/**
 * 酒店信息只读展示卡片
 * 在「查看」模态框（readOnly=true）时替代 disabled Form 进行展示。
 * 格式与管理端「审核查看酒店信息」表单保持一致：Descriptions + 图片区 + Table 房型。
 */
export function HotelInfoViewCard({ values }: HotelInfoViewCardProps) {
  if (!values) return null

  const {
    infoNickname,
    name,
    enName,
    starLevel,
    phone,
    description,
    province,
    city,
    district,
    address,
    openedAt,
    homeAdImage,
    tags,
    images,
    roomTypes,
  } = values

  return (
    <Card>
      {/* ===== 基本信息 ===== */}
      <Descriptions bordered size="small" column={2}>
        <Descriptions.Item label="信息昵称">
          {infoNickname || '-'}
        </Descriptions.Item>
        <Descriptions.Item label="酒店名称">{name || '-'}</Descriptions.Item>
        <Descriptions.Item label="酒店英文名称">
          {enName || '-'}
        </Descriptions.Item>
        <Descriptions.Item label="星级">
          {starLevel ? `${starLevel} 星` : '-'}
        </Descriptions.Item>
        <Descriptions.Item label="电话">{phone || '-'}</Descriptions.Item>
        <Descriptions.Item label="开业时间">
          {openedAt ? dayjs(openedAt).format('YYYY-MM-DD') : '-'}
        </Descriptions.Item>
        <Descriptions.Item label="省">{province || '-'}</Descriptions.Item>
        <Descriptions.Item label="市">{city || '-'}</Descriptions.Item>
        <Descriptions.Item label="区" span={2}>
          {district || '-'}
        </Descriptions.Item>
        <Descriptions.Item label="详细地址" span={2}>
          {address || '-'}
        </Descriptions.Item>
        <Descriptions.Item label="酒店简介" span={2}>
          {description || '-'}
        </Descriptions.Item>
        <Descriptions.Item label="标签" span={2}>
          {(tags ?? []).length > 0
            ? (tags ?? []).map((tag) => <Tag key={tag}>{tag}</Tag>)
            : '-'}
        </Descriptions.Item>
        <Descriptions.Item label="首页广告图" span={2}>
          {homeAdImage && typeof homeAdImage === 'string' ? (
            <Image src={homeAdImage} width={200} />
          ) : (
            '-'
          )}
        </Descriptions.Item>
      </Descriptions>

      {/* ===== 轮播图 ===== */}
      {(images ?? []).length > 0 && (
        <>
          <Divider>轮播图</Divider>
          <Image.PreviewGroup>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
              {(images ?? []).map((image, idx) => {
                const url =
                  typeof image.url === 'string' ? image.url : undefined
                if (!url) return null
                return (
                  <Card
                    key={idx}
                    hoverable
                    style={{ width: 150 }}
                    cover={<Image alt={image.caption} src={url} />}
                    styles={{ body: { padding: 8 } }}
                  >
                    {image.caption && (
                      <div
                        style={{
                          fontSize: 12,
                          color: '#888',
                          textAlign: 'center',
                        }}
                      >
                        {image.caption}
                      </div>
                    )}
                  </Card>
                )
              })}
            </div>
          </Image.PreviewGroup>
        </>
      )}

      {/* ===== 房型 ===== */}
      {(roomTypes ?? []).length > 0 && (
        <>
          <Divider>房型</Divider>
          <Table<RoomTypeValue>
            size="small"
            bordered
            pagination={false}
            rowKey={(record) => record.name}
            dataSource={roomTypes ?? []}
            expandable={{
              expandedRowRender: (record) => {
                if (
                  record.priceMode !== PriceMode.PER_HOUR ||
                  !record.hourlySlots ||
                  record.hourlySlots.length === 0
                ) {
                  return null
                }
                return (
                  <>
                    <p style={{ color: 'grey', fontSize: 12, margin: 0 }}>
                      结束时间将按房型时长单位（{record.duration} 小时）自动推导
                    </p>
                    <Space wrap>
                      <span>可预订时段：</span>
                      {record.hourlySlots.map((slot, i) => (
                        <Tag key={i}>{slot.startTime}</Tag>
                      ))}
                    </Space>
                  </>
                )
              },
              rowExpandable: (record) =>
                record.priceMode === PriceMode.PER_HOUR &&
                !!record.hourlySlots &&
                record.hourlySlots.length > 0,
            }}
            columns={[
              { title: '房型名', dataIndex: 'name' },
              { title: '数量', dataIndex: 'count' },
              {
                title: '价格',
                dataIndex: 'price',
                render: (price: number) => (price != null ? `¥${price}` : '-'),
              },
              {
                title: '计价方式',
                dataIndex: 'priceMode',
                render: (mode: PriceMode) =>
                  mode === PriceMode.PER_NIGHT
                    ? '标准住宿'
                    : mode === PriceMode.PER_HOUR
                      ? '钟点房'
                      : mode,
              },
              {
                title: '购买时长',
                dataIndex: 'duration',
                render: (duration: number, record: RoomTypeValue) => {
                  if (!duration) return '-'
                  if (record.priceMode === PriceMode.PER_NIGHT)
                    return `${duration} 晚`
                  if (record.priceMode === PriceMode.PER_HOUR)
                    return `${duration} 小时`
                  return duration
                },
              },
              {
                title: '床型说明',
                dataIndex: 'bedType',
                render: (v: string | null) => v || '-',
              },
              {
                title: '面积',
                dataIndex: 'area',
                render: (v: number | null) => (v ? `${v} m²` : '-'),
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
        </>
      )}
    </Card>
  )
}
