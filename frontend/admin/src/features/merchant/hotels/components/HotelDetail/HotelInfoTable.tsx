import { ReviewStatusTag } from '@/components/ui/ReviewStatusTag'
import type { HotelInfoItem } from '@/apis/hotel'
import { Card, Table } from 'antd'
import type { TablePaginationConfig } from 'antd'
import { InfoActionButtons } from '../HotelInfo/InfoActionButtons'

interface HotelInfoTableProps {
  hotelId: number
  dataSource: HotelInfoItem[]
  loading: boolean
  pagination: TablePaginationConfig
  onEdit: (infoId: number) => void
  actions: {
    submit: (infoId: number) => void
    withdraw: (infoId: number) => void
    offline: (infoId: number) => void
    duplicate: (infoId: number) => void
    delete: (infoId: number) => void
    submitting?: boolean
    withdrawing?: boolean
    offlining?: boolean
    duplicating?: boolean
    deleting?: boolean
  }
}

/**
 * 酒店信息列表表格组件
 */
export function HotelInfoTable({
  dataSource,
  loading,
  pagination,
  onEdit,
  actions,
}: HotelInfoTableProps) {
  return (
    <Card>
      <Table
        rowKey="id"
        loading={loading}
        dataSource={dataSource}
        pagination={pagination}
        columns={[
          {
            title: '信息ID',
            dataIndex: 'id',
            width: 90,
          },
          {
            title: '信息昵称',
            dataIndex: 'infoNickname',
          },
          {
            title: '酒店名称',
            dataIndex: 'name',
          },
          {
            title: '状态',
            dataIndex: 'reviewStatus',
            render: (status) => <ReviewStatusTag status={status} perspective="merchant" />,
          },
          {
            title: '星级',
            dataIndex: 'starLevel',
            render: (level) => `${level}星`,
          },
          {
            title: '地址',
            dataIndex: 'address',
            ellipsis: true,
          },
          {
            title: '操作',
            key: 'actions',
            width: 360,
            render: (_, record) => (
              <InfoActionButtons
                info={record}
                onSubmit={() => actions.submit(record.id)}
                onWithdraw={() => actions.withdraw(record.id)}
                onOffline={() => actions.offline(record.id)}
                onEdit={() => onEdit(record.id)}
                onDuplicate={() => actions.duplicate(record.id)}
                onDelete={() => actions.delete(record.id)}
                submitting={actions.submitting}
                withdrawing={actions.withdrawing}
                offlining={actions.offlining}
                duplicating={actions.duplicating}
                deleting={actions.deleting}
              />
            ),
          },
        ]}
      />
    </Card>
  )
}
