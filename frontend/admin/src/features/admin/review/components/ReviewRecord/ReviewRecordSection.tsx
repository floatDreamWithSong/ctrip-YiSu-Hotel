import { Card, Space, Typography } from 'antd'
import { useReviewRecords } from '../../hooks/useReviewRecords'
import { ReviewRecordFilter } from './ReviewRecordFilter'
import { ReviewRecordTable } from './ReviewRecordTable'

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

        <ReviewRecordFilter
          action={filter.action}
          rejectReason={filter.rejectReason}
          startAt={filter.startAt}
          endAt={filter.endAt}
          onActionChange={filter.setAction}
          onRejectReasonChange={filter.setRejectReason}
          onStartAtChange={filter.setStartAt}
          onEndAtChange={filter.setEndAt}
        />

        <ReviewRecordTable dataSource={records} loading={loading} pagination={pagination} />
      </Space>
    </Card>
  )
}
