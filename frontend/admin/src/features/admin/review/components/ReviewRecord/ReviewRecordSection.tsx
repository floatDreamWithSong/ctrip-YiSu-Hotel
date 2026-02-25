import type { ReviewRecordItem } from '@/apis/hotel'
import { RejectReasonType } from '@yisu/shared'
import type { ApiHotelTypes } from '@yisu/shared'
import { Card, Col, Input, Row, Select, Space, Table, Typography } from 'antd'
import type { TablePaginationConfig } from 'antd'
import { useReviewRecords } from '../../hooks/useReviewRecords'

const rejectReasonOptions = [
  { value: RejectReasonType.INFO_INCOMPLETE, label: '信息不完整' },
  { value: RejectReasonType.INFO_INACCURATE, label: '信息不准确' },
  { value: RejectReasonType.IMAGE_QUALITY, label: '图片质量问题' },
  { value: RejectReasonType.PRICE_ABNORMAL, label: '价格异常' },
  { value: RejectReasonType.DUPLICATE, label: '重复酒店' },
  { value: RejectReasonType.POLICY_VIOLATION, label: '政策违反' },
  { value: RejectReasonType.OTHER, label: '其他' },
]

function RecordFilter({
  action,
  rejectReason,
  startAt,
  endAt,
  onActionChange,
  onRejectReasonChange,
  onStartAtChange,
  onEndAtChange,
}: {
  action?: ApiHotelTypes['ReviewRecordQuery']['action']
  rejectReason?: ApiHotelTypes['ReviewRecordQuery']['rejectReason']
  startAt?: string
  endAt?: string
  onActionChange: (v: ApiHotelTypes['ReviewRecordQuery']['action']) => void
  onRejectReasonChange: (
    v: ApiHotelTypes['ReviewRecordQuery']['rejectReason'],
  ) => void
  onStartAtChange: (v: string | undefined) => void
  onEndAtChange: (v: string | undefined) => void
}) {
  return (
    <Row gutter={[12, 12]}>
      <Col xs={24} md={6}>
        <Select
          allowClear
          placeholder="审核结果"
          value={action}
          style={{ width: '100%' }}
          options={[
            { label: '已通过', value: 'APPROVED' },
            { label: '已拒绝', value: 'REJECTED' },
          ]}
          onChange={onActionChange}
        />
      </Col>
      <Col xs={24} md={6}>
        <Select
          allowClear
          placeholder="拒绝原因"
          value={rejectReason}
          style={{ width: '100%' }}
          options={rejectReasonOptions}
          onChange={onRejectReasonChange}
        />
      </Col>
      <Col xs={24} md={6}>
        <Input
          placeholder="开始时间 ISO"
          value={startAt}
          onChange={(e) => onStartAtChange(e.target.value)}
        />
      </Col>
      <Col xs={24} md={6}>
        <Input
          placeholder="结束时间 ISO"
          value={endAt}
          onChange={(e) => onEndAtChange(e.target.value)}
        />
      </Col>
    </Row>
  )
}

const reviewStatusText: Record<string, string> = {
  PENDING: '待审核',
  APPROVED: '已通过',
  REJECTED: '已拒绝',
}

function RecordTable({
  dataSource,
  loading,
  pagination,
}: {
  dataSource: ReviewRecordItem[]
  loading: boolean
  pagination: TablePaginationConfig
}) {
  return (
    <Table
      rowKey="id"
      loading={loading}
      dataSource={dataSource}
      pagination={pagination}
      columns={[
        { title: '记录ID', dataIndex: 'id', width: 90 },
        { title: '酒店', dataIndex: ['hotel', 'hotelNickname'] },
        { title: '信息昵称', dataIndex: ['info', 'infoNickname'] },
        {
          title: '结果',
          dataIndex: 'action',
          render: (value: string) => reviewStatusText[value] ?? value,
        },
        {
          title: '原因',
          dataIndex: 'rejectReason',
          render: (value: string | null) => value ?? '-',
        },
        {
          title: '备注',
          dataIndex: 'rejectDetail',
          render: (value: string | null) => value ?? '-',
        },
        { title: '审核人', dataIndex: ['reviewer', 'username'] },
        { title: '时间', dataIndex: 'createdAt' },
      ]}
    />
  )
}

/**
 * 审核记录区域组件
 * 包含筛选器和记录表格
 */
export function ReviewRecordSection() {
  const { records, loading, pagination, filter } = useReviewRecords()

  return (
    <Card>
      <Space orientation="vertical" size={12} style={{ width: '100%' }}>
        <Typography.Title level={4} className="m-0!">
          审核记录
        </Typography.Title>

        <RecordFilter
          action={filter.action}
          rejectReason={filter.rejectReason}
          startAt={filter.startAt}
          endAt={filter.endAt}
          onActionChange={filter.setAction}
          onRejectReasonChange={filter.setRejectReason}
          onStartAtChange={filter.setStartAt}
          onEndAtChange={filter.setEndAt}
        />

        <RecordTable
          dataSource={records}
          loading={loading}
          pagination={pagination}
        />
      </Space>
    </Card>
  )
}
