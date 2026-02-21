import { HotelReviewStatus } from '@yisu/shared'
import type { ApiHotelTypes } from '@yisu/shared'
import { Select, Space } from 'antd'

interface ReviewListFilterProps {
  statusFilter?: ApiHotelTypes['AdminReviewQuery']['reviewStatus']
  onStatusChange: (value: ApiHotelTypes['AdminReviewQuery']['reviewStatus']) => void
}

/**
 * 审核列表筛选器组件
 */
export function ReviewListFilter({ statusFilter, onStatusChange }: ReviewListFilterProps) {
  return (
    <Space wrap>
      <Select
        allowClear
        placeholder="按状态筛选"
        style={{ width: 180 }}
        value={statusFilter}
        options={[
          { label: '待审核', value: HotelReviewStatus.PENDING },
          { label: '已通过', value: HotelReviewStatus.APPROVED },
          { label: '已拒绝', value: HotelReviewStatus.REJECTED },
        ]}
        onChange={onStatusChange}
      />
    </Space>
  )
}
