import { ReviewStatusTag } from '@/components/ui/ReviewStatusTag'
import type { AdminReviewHotelInfoItem } from '@/apis/hotel'
import { HotelReviewStatus } from '@yisu/shared'
import type { ApiHotelTypes } from '@yisu/shared'
import { Button, Card, Select, Space, Table, Typography } from 'antd'
import type { TablePaginationConfig } from 'antd'
import { useState } from 'react'
import { useReviewInfos } from '../../hooks/useReviewInfos'
import { ReviewDetailModal } from './ReviewDetailModal'

function ListFilter({
  value,
  onChange,
}: {
  value?: ApiHotelTypes['AdminReviewQuery']['reviewStatus']
  onChange: (v: ApiHotelTypes['AdminReviewQuery']['reviewStatus']) => void
}) {
  return (
    <Space wrap>
      <Select
        allowClear
        placeholder="按状态筛选"
        style={{ width: 180 }}
        value={value}
        options={[
          { label: '待审核', value: HotelReviewStatus.PENDING },
          { label: '已通过', value: HotelReviewStatus.APPROVED },
          { label: '已拒绝', value: HotelReviewStatus.REJECTED },
        ]}
        onChange={onChange}
      />
    </Space>
  )
}

function ListTable({
  dataSource,
  loading,
  pagination,
  onView,
}: {
  dataSource: AdminReviewHotelInfoItem[]
  loading: boolean
  pagination: TablePaginationConfig
  onView: (infoId: number) => void
}) {
  return (
    <Table
      rowKey="id"
      loading={loading}
      dataSource={dataSource}
      pagination={pagination}
      columns={[
        { title: '信息ID', dataIndex: 'id', width: 90 },
        { title: '酒店昵称', dataIndex: ['hotel', 'hotelNickname'] },
        { title: '信息昵称', dataIndex: 'infoNickname' },
        { title: '酒店名', dataIndex: 'name' },
        {
          title: '状态',
          dataIndex: 'reviewStatus',
          render: (status) => (
            <ReviewStatusTag status={status} perspective="admin" />
          ),
        },
        {
          title: '商家',
          key: 'merchant',
          render: (_, record) => record.hotel.merchant.user.username,
        },
        {
          title: '操作',
          key: 'actions',
          width: 150,
          render: (_, record) => (
            <Button type="primary" ghost onClick={() => onView(record.id)}>
              查看并审核
            </Button>
          ),
        },
      ]}
    />
  )
}

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

        <ListFilter
          value={filter.statusFilter}
          onChange={filter.setStatusFilter}
        />

        <ListTable
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
