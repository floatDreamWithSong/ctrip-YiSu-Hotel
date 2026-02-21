import type { ReviewRecordItem } from '@/apis/hotel'
import { Card, Table } from 'antd'
import type { TablePaginationConfig } from 'antd'

interface ReviewRecordTableProps {
  dataSource: ReviewRecordItem[]
  loading: boolean
  pagination: TablePaginationConfig
}

const reviewStatusText: Record<string, string> = {
  PENDING: '待审核',
  APPROVED: '已通过',
  REJECTED: '已拒绝',
}

/**
 * 审核记录列表表格组件
 */
export function ReviewRecordTable({ dataSource, loading, pagination }: ReviewRecordTableProps) {
  return (
    <Card>
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
    </Card>
  )
}
