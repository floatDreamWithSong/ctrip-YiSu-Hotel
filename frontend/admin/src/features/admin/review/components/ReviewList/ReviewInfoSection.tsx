import { Card, Space, Typography } from 'antd'
import { useState } from 'react'
import { useReviewInfos } from '../../hooks/useReviewInfos'
import { ReviewListFilter } from './ReviewListFilter'
import { ReviewListTable } from './ReviewListTable'
import { ReviewDetailModal } from './ReviewDetailModal'

/**
 * 审核信息列表区域组件
 * 包含筛选器、表格和详情模态框
 */
export function ReviewInfoSection() {
  const { infos, loading, pagination, filter } = useReviewInfos()
  const [detailOpen, setDetailOpen] = useState(false)
  const [currentInfoId, setCurrentInfoId] = useState<number | null>(null)

  const handleView = (infoId: number) => {
    setCurrentInfoId(infoId)
    setDetailOpen(true)
  }

  const handleCloseDetail = () => {
    setDetailOpen(false)
    setCurrentInfoId(null)
  }

  return (
    <Card>
      <Space orientation="vertical" size={12} style={{ width: '100%' }}>
        <Typography.Title level={3} className="m-0!">
          审核列表
        </Typography.Title>

        <ReviewListFilter
          statusFilter={filter.statusFilter}
          onStatusChange={filter.setStatusFilter}
        />

        <ReviewListTable
          dataSource={infos}
          loading={loading}
          pagination={pagination}
          onView={handleView}
        />

        <ReviewDetailModal
          open={detailOpen}
          infoId={currentInfoId}
          onClose={handleCloseDetail}
        />
      </Space>
    </Card>
  )
}
