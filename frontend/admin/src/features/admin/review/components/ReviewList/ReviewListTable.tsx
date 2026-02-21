import { ReviewStatusTag } from '@/components/ui/ReviewStatusTag'
import type { AdminReviewHotelInfoItem } from '@/apis/hotel'
import { Button, Card, Table } from 'antd'
import type { TablePaginationConfig } from 'antd'

interface ReviewListTableProps {
  dataSource: AdminReviewHotelInfoItem[]
  loading: boolean
  pagination: TablePaginationConfig
  onView: (infoId: number) => void
}

/**
 * 审核信息列表表格组件
 */
export function ReviewListTable({
  dataSource,
  loading,
  pagination,
  onView,
}: ReviewListTableProps) {
  return (
    <Card>
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
            render: (status) => <ReviewStatusTag status={status} perspective="admin" />,
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
    </Card>
  )
}
