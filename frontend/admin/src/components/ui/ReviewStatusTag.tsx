import { HotelReviewStatus } from '@yisu/shared'
import { Tag } from 'antd'

interface ReviewStatusTagProps {
  status: HotelReviewStatus
  perspective?: 'merchant' | 'admin'
}

/**
 * 商家视角的状态文本
 */
const merchantStatusText: Record<HotelReviewStatus, string> = {
  [HotelReviewStatus.DRAFT]: '待发布',
  [HotelReviewStatus.PENDING]: '审核中',
  [HotelReviewStatus.APPROVED]: '已发布',
  [HotelReviewStatus.REJECTED]: '待更改',
  [HotelReviewStatus.DEPRECATED]: '已删除',
}

/**
 * 管理员视角的状态文本
 */
const adminStatusText: Record<HotelReviewStatus, string> = {
  [HotelReviewStatus.DRAFT]: '草稿',
  [HotelReviewStatus.PENDING]: '待审核',
  [HotelReviewStatus.APPROVED]: '已通过',
  [HotelReviewStatus.REJECTED]: '已拒绝',
  [HotelReviewStatus.DEPRECATED]: '已删除',
}

/**
 * 状态对应的颜色
 */
const statusColor: Record<HotelReviewStatus, string> = {
  [HotelReviewStatus.DRAFT]: 'default',
  [HotelReviewStatus.PENDING]: 'processing',
  [HotelReviewStatus.APPROVED]: 'success',
  [HotelReviewStatus.REJECTED]: 'error',
  [HotelReviewStatus.DEPRECATED]: 'default',
}

/**
 * 审核状态标签组件
 * 根据不同视角（商家/管理员）显示不同的文本
 */
export function ReviewStatusTag({
  status,
  perspective = 'merchant',
}: ReviewStatusTagProps) {
  const text =
    perspective === 'admin'
      ? adminStatusText[status]
      : merchantStatusText[status]

  return <Tag color={statusColor[status]}>{text ?? status}</Tag>
}
