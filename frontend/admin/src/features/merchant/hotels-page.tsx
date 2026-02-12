import { MerchantHotelRequest } from '@/apis/hotel'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { Button, Card, Form, Input, Modal, Popconfirm, Space, Table, Tag, Typography, message } from 'antd'
import { useMemo, useState } from 'react'

const HOTELS_QUERY_KEY = 'merchant-hotels'

const HotelsPage = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [keyword, setKeyword] = useState('')
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [createOpen, setCreateOpen] = useState(false)
  const [createForm] = Form.useForm<{ hotelNickname: string }>()

  const hotelsQuery = useQuery({
    queryKey: [HOTELS_QUERY_KEY, page, limit, keyword],
    queryFn: () =>
      MerchantHotelRequest.getHotels({
        page,
        limit,
        keyword: keyword.trim() || undefined,
      }),
  })

  const createHotelMutation = useMutation({
    mutationFn: MerchantHotelRequest.createHotel,
    onSuccess: () => {
      message.success('酒店创建成功')
      setCreateOpen(false)
      createForm.resetFields()
      void queryClient.invalidateQueries({ queryKey: [HOTELS_QUERY_KEY] })
    },
    onError: (error: Error) => message.error(error.message),
  })

  const deleteHotelMutation = useMutation({
    mutationFn: MerchantHotelRequest.deleteHotel,
    onSuccess: () => {
      message.success('酒店已删除')
      void queryClient.invalidateQueries({ queryKey: [HOTELS_QUERY_KEY] })
    },
    onError: (error: Error) => message.error(error.message),
  })

  const onCreateHotel = async () => {
    const values = await createForm.validateFields()
    createHotelMutation.mutate(values)
  }

  const rows = useMemo(() => hotelsQuery.data?.items ?? [], [hotelsQuery.data])

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <Card>
        <Space direction="vertical" size={12} style={{ width: '100%' }}>
          <Typography.Title level={3} className="m-0!">
            酒店列表
          </Typography.Title>
          <Space wrap>
            <Input.Search
              allowClear
              placeholder="按酒店昵称搜索"
              style={{ width: 320 }}
              onSearch={(value) => {
                setPage(1)
                setKeyword(value)
              }}
            />
            <Button type="primary" onClick={() => setCreateOpen(true)}>
              创建酒店
            </Button>
          </Space>
        </Space>
      </Card>

      <Card>
        <Table
          rowKey="id"
          loading={hotelsQuery.isLoading}
          dataSource={rows}
          pagination={{
            current: page,
            pageSize: limit,
            total: hotelsQuery.data?.total ?? 0,
            showSizeChanger: true,
            onChange: (nextPage, nextPageSize) => {
              setPage(nextPage)
              setLimit(nextPageSize)
            },
          }}
          columns={[
            {
              title: '酒店ID',
              dataIndex: 'id',
              width: 100,
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
                record.isHomeAdEnabled ? <Tag color="blue">开启</Tag> : <Tag>关闭</Tag>,
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
                  <Button
                    size="small"
                    type="primary"
                    ghost
                    onClick={() =>
                      navigate({
                        to: '/merchant/hotels/$hotelId',
                        params: { hotelId: String(record.id) },
                      })
                    }
                  >
                    管理酒店
                  </Button>
                  <Popconfirm
                    title="确认删除该酒店？"
                    description="删除后酒店及其信息将不再可查询"
                    onConfirm={() => deleteHotelMutation.mutate(record.id)}
                  >
                    <Button size="small" danger loading={deleteHotelMutation.isPending}>
                      删除
                    </Button>
                  </Popconfirm>
                </Space>
              ),
            },
          ]}
        />
      </Card>

      <Modal
        title="创建酒店"
        open={createOpen}
        onCancel={() => setCreateOpen(false)}
        onOk={onCreateHotel}
        confirmLoading={createHotelMutation.isPending}
      >
        <Form form={createForm} layout="vertical">
          <Form.Item
            label="酒店昵称"
            name="hotelNickname"
            rules={[{ required: true, message: '请输入酒店昵称' }]}
          >
            <Input maxLength={64} placeholder="例如：上海虹桥门店" />
          </Form.Item>
        </Form>
      </Modal>
    </Space>
  )
}

export default HotelsPage
