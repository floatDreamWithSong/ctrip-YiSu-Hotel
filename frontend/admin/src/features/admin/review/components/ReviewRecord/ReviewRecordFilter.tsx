import { RejectReasonType } from '@yisu/shared'
import type { ApiHotelTypes } from '@yisu/shared'
import { Col, Input, Row, Select } from 'antd'

interface ReviewRecordFilterProps {
  action?: ApiHotelTypes['ReviewRecordQuery']['action']
  rejectReason?: ApiHotelTypes['ReviewRecordQuery']['rejectReason']
  startAt?: string
  endAt?: string
  onActionChange: (value: ApiHotelTypes['ReviewRecordQuery']['action']) => void
  onRejectReasonChange: (value: ApiHotelTypes['ReviewRecordQuery']['rejectReason']) => void
  onStartAtChange: (value: string | undefined) => void
  onEndAtChange: (value: string | undefined) => void
}

const rejectReasonOptions = [
  { value: RejectReasonType.INFO_INCOMPLETE, label: '信息不完整' },
  { value: RejectReasonType.INFO_INACCURATE, label: '信息不准确' },
  { value: RejectReasonType.IMAGE_QUALITY, label: '图片质量问题' },
  { value: RejectReasonType.PRICE_ABNORMAL, label: '价格异常' },
  { value: RejectReasonType.DUPLICATE, label: '重复酒店' },
  { value: RejectReasonType.POLICY_VIOLATION, label: '政策违反' },
  { value: RejectReasonType.OTHER, label: '其他' },
]

/**
 * 审核记录筛选器组件
 */
export function ReviewRecordFilter({
  action,
  rejectReason,
  startAt,
  endAt,
  onActionChange,
  onRejectReasonChange,
  onStartAtChange,
  onEndAtChange,
}: ReviewRecordFilterProps) {
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
          onChange={(e) => onStartAtChange(e.target.value || undefined)}
        />
      </Col>
      <Col xs={24} md={6}>
        <Input
          placeholder="结束时间 ISO"
          value={endAt}
          onChange={(e) => onEndAtChange(e.target.value || undefined)}
        />
      </Col>
    </Row>
  )
}
