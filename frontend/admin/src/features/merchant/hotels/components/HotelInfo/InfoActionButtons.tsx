import { HotelReviewStatus } from '@yisu/shared'
import type { HotelInfoItem } from '@/apis/hotel'
import { Button, Popconfirm, Space } from 'antd'

interface InfoActionButtonsProps {
  info: HotelInfoItem
  onSubmit: () => void
  onWithdraw: () => void
  onOffline: () => void
  onEdit: () => void
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
  onDuplicate,
  onDelete,
  submitting,
  withdrawing,
  offlining,
  duplicating,
  deleting,
}: InfoActionButtonsProps) {
  const { reviewStatus } = info

  return (
    <Space>
      {/* 待发布状态：可发布、可编辑 */}
      {reviewStatus === HotelReviewStatus.DRAFT && (
        <>
          <Button type="primary" size="small" onClick={onSubmit} loading={submitting}>
            发布
          </Button>
          <Button size="small" onClick={onEdit}>
            编辑
          </Button>
        </>
      )}

      {/* 审核中状态：可撤回 */}
      {reviewStatus === HotelReviewStatus.PENDING && (
        <Button size="small" onClick={onWithdraw} loading={withdrawing}>
          撤回
        </Button>
      )}

      {/* 已发布状态：可下线 */}
      {reviewStatus === HotelReviewStatus.APPROVED && (
        <Popconfirm
          title="确认下线？"
          description="下线后将与酒店的已发布信息解除关联"
          onConfirm={onOffline}
        >
          <Button size="small" loading={offlining}>
            下线
          </Button>
        </Popconfirm>
      )}

      {/* 待更改状态：可重新发布、可编辑 */}
      {reviewStatus === HotelReviewStatus.REJECTED && (
        <>
          <Button type="primary" size="small" onClick={onSubmit} loading={submitting}>
            重新发布
          </Button>
          <Button size="small" onClick={onEdit}>
            编辑
          </Button>
        </>
      )}

      {/* 通用操作：创建副本、删除 */}
      <Button size="small" onClick={onDuplicate} loading={duplicating}>
        创建副本
      </Button>

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
