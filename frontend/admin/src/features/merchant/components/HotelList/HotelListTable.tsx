import type { MerchantHotelItem } from '@/apis/hotel'
import { Button, Card, Popconfirm, Space, Table, Tag } from 'antd'
import type { TablePaginationConfig } from 'antd'
import { Link } from '@tanstack/react-router'

interface HotelListTableProps {
  dataSource: MerchantHotelItem[]
  loading: boolean
  pagination: TablePaginationConfig
  onDelete: (hotelId: number) => void
  deleting?: boolean
}

/**
 * 酒店列表表格组件
 * 负责展示酒店列表和基本操作
 */
export function HotelListTable({
  dataSource,
  loading,
  pagination,
  onDelete,
  deleting,
}: HotelListTableProps) {
  return (
    <Card>
      <Table
        rowKey="id"
        loading={loading}
        dataSource={dataSource}
        pagination={pagination}
        columns={[
          {
            title: '序号',
            width: 80,
            render: (_, __, index) => index + 1,
          },
          {
            title: '酒店昵称',
            dataIndex: 'hotelNickname',
          },
          {
            title: '已发布信息',
            key: 'publishedInfo',
            render: (_, record) =>
              record.publishedInfo ? (
                <Tag color="green">{record.publishedInfo.infoNickname}</Tag>
              ) : (
                <Tag>暂无</Tag>
              ),
          },
          {
            title: '广告推送',
            key: 'isHomeAdEnabled',
            render: (_, record) =>
              record.isHomeAdEnabled ? (
                <Tag color="blue">开启</Tag>
              ) : (
                <Tag>关闭</Tag>
              ),
          },
          {
            title: '信息数量',
            key: 'infos',
            render: (_, record) => record._count.infos,
          },
          {
            title: '操作',
            key: 'actions',
            width: 280,
            render: (_, record) => (
              <Space>
                {/*
                 * preload="intent"：鼠标悬停或触摸时触发路由 loader，
                 * 提前将酒店详情存入 Query 缓存，进入详情页后无需等待首屏请求。
                 */}
                <Link
                  to="/merchant/hotels/$hotelId"
                  params={{ hotelId: String(record.id) }}
                  preload="intent"
                >
                  <Button size="small" type="primary" ghost>
                    管理酒店
                  </Button>
                </Link>
                <Popconfirm
                  title="确认删除该酒店？"
                  description="删除后酒店及其信息将不再可查询"
                  onConfirm={() => onDelete(record.id)}
                >
                  <Button size="small" danger loading={deleting}>
                    删除
                  </Button>
                </Popconfirm>
              </Space>
            ),
          },
        ]}
      />
    </Card>
  )
}
