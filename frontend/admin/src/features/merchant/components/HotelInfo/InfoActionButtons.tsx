import { HotelReviewStatus } from '@yisu/shared'
import type { HotelInfoItem } from '@/apis/hotel'
import { Button, Popconfirm, Space } from 'antd'

interface InfoActionButtonsProps {
  info: HotelInfoItem
  onSubmit: () => void
  onWithdraw: () => void
  onOffline: () => void
  onEdit: () => void
  /** 鼠标悬停「编辑/查看」按钮时触发，用于预取详情数据 */
  onPrefetch?: () => void
  onDuplicate: () => void
  onDelete: () => void
  submitting?: boolean
  withdrawing?: boolean
  offlining?: boolean
  duplicating?: boolean
  deleting?: boolean
}

/**
 * 酒店信息操作按钮组
 * 根据酒店信息的不同状态显示对应的操作按钮
 */
export function InfoActionButtons({
  info,
  onSubmit,
  onWithdraw,
  onOffline,
  onEdit,
  onPrefetch,
  onDuplicate,
  onDelete,
  submitting,
  withdrawing,
  offlining,
  duplicating,
  deleting,
}: InfoActionButtonsProps) {
  const { reviewStatus } = info

  const isDraft = reviewStatus === HotelReviewStatus.DRAFT
  const isPending = reviewStatus === HotelReviewStatus.PENDING
  const isApproved = reviewStatus === HotelReviewStatus.APPROVED
  const isRejected = reviewStatus === HotelReviewStatus.REJECTED
  const canSubmit = isDraft || isRejected
  // 已发布/审核中：可查看但不可编辑，按钮文字改为「查看」
  const isReadOnly = isPending || isApproved

  return (
    <Space>
      {/* 草稿/驳回：「编辑」；已发布/审核中：「查看」（始终可点击） */}
      {/* onMouseEnter：悬停时静默预取表单数据，点击时命中缓存实现零等待 */}
      <Button size="small" onClick={onEdit} onMouseEnter={onPrefetch}>
        {isReadOnly ? '查看' : '编辑'}
      </Button>

      {/* 创建副本：始终可用 */}
      <Button size="small" onClick={onDuplicate} loading={duplicating}>
        创建副本
      </Button>

      {/* 发布：待发布/待更改时高亮可用 */}
      <Button
        size="small"
        type={canSubmit ? 'primary' : 'default'}
        disabled={!canSubmit}
        onClick={onSubmit}
        loading={submitting}
      >
        发布
      </Button>

      {/* 撤回：审核中时可用 */}
      <Button
        size="small"
        disabled={!isPending}
        onClick={onWithdraw}
        loading={withdrawing}
      >
        撤回
      </Button>

      {/* 下线：已发布时可用 */}
      {isApproved ? (
        <Popconfirm
          title="确认下线？"
          description="下线后将与酒店的已发布信息解除关联"
          onConfirm={onOffline}
        >
          <Button size="small" loading={offlining}>
            下线
          </Button>
        </Popconfirm>
      ) : (
        <Button size="small" disabled>
          下线
        </Button>
      )}

      {/* 删除：始终可用 */}
      <Popconfirm
        title="确认删除？"
        description="删除后将不能被查询到"
        onConfirm={onDelete}
      >
        <Button size="small" danger loading={deleting}>
          删除
        </Button>
      </Popconfirm>
    </Space>
  )
}
