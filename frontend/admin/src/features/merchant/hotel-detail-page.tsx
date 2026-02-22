import { MerchantHotelRequest } from '@/apis/hotel'
import { AddressAutoComplete, useAddressLocate } from '@/components/address-input'
import { CosImageUpload } from '@/components/cos-image-upload'
import { TagInput } from '@/components/tag-input'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { HotelReviewStatus, PriceMode } from '@yisu/shared'
import type { ApiHotelTypes } from '@yisu/shared'
import {
  Button,
  Card,
  Col,
  DatePicker,
  Descriptions,
  Divider,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Row,
  Select,
  Space,
  Switch,
  Table,
  Tag,
  Typography,
  message,
} from 'antd'
import dayjs from 'dayjs'
import { LocateFixed } from 'lucide-react'
import { useMemo, useState } from 'react'

const HOTEL_TAG_PRESETS = [
  '免费WiFi', '停车场', '游泳池', '健身房', '餐厅',
  '会议室', '接送服务', '行李寄存', '24小时前台', '无烟房',
  '空调', '洗衣服务', '商务中心', '儿童设施', '宠物友好',
]

const HOTEL_DETAIL_QUERY_KEY = 'merchant-hotel-detail'
const HOTEL_INFOS_QUERY_KEY = 'merchant-hotel-infos'

type HotelInfoFormValues = ApiHotelTypes['HotelInfoCreate']

const parseTimeToMinutes = (time: string) => {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

const reviewStatusText: Record<string, string> = {
  [HotelReviewStatus.DRAFT]: '待发布',
  [HotelReviewStatus.PENDING]: '审核中',
  [HotelReviewStatus.APPROVED]: '已发布',
  [HotelReviewStatus.REJECTED]: '待更改',
  [HotelReviewStatus.DEPRECATED]: '已删除',
}

const reviewStatusColor: Record<string, string> = {
  [HotelReviewStatus.DRAFT]: 'default',
  [HotelReviewStatus.PENDING]: 'processing',
  [HotelReviewStatus.APPROVED]: 'success',
  [HotelReviewStatus.REJECTED]: 'error',
  [HotelReviewStatus.DEPRECATED]: 'default',
}

interface Props {
  hotelId: number
}

const HotelDetailPage = ({ hotelId }: Props) => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [infoPage, setInfoPage] = useState(1)
  const [infoLimit, setInfoLimit] = useState(10)
  const [statusFilter, setStatusFilter] = useState<ApiHotelTypes['HotelInfoQuery']['reviewStatus']>()
  const [formOpen, setFormOpen] = useState(false)
  const [editingInfoId, setEditingInfoId] = useState<number | null>(null)
  const [form] = Form.useForm<HotelInfoFormValues>()
  const { locating, handleLocate } = useAddressLocate(form)

  const hotelDetailQuery = useQuery({
    queryKey: [HOTEL_DETAIL_QUERY_KEY, hotelId],
    queryFn: () => MerchantHotelRequest.getHotelDetail(hotelId),
  })

  const hotelInfosQuery = useQuery({
    queryKey: [HOTEL_INFOS_QUERY_KEY, hotelId, infoPage, infoLimit, statusFilter],
    queryFn: () =>
      MerchantHotelRequest.getHotelInfos(hotelId, {
        page: infoPage,
        limit: infoLimit,
        reviewStatus: statusFilter,
      }),
  })

  const refresh = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: [HOTEL_DETAIL_QUERY_KEY, hotelId] }),
      queryClient.invalidateQueries({ queryKey: [HOTEL_INFOS_QUERY_KEY, hotelId] }),
    ])
  }

  const updateHomeAdMutation = useMutation({
    mutationFn: (params: { hotelId: number; data: ApiHotelTypes['HotelUpdateHomeAd'] }) =>
      MerchantHotelRequest.updateHomeAdEnabled(params.hotelId, params.data),
    onSuccess: () => {
      message.success('首页广告推送设置已更新')
      void refresh()
    },
    onError: (error: Error) => message.error(error.message),
  })

  const createInfoMutation = useMutation({
    mutationFn: (data: HotelInfoFormValues) =>
      MerchantHotelRequest.createHotelInfo(hotelId, data),
    onSuccess: () => {
      message.success('酒店信息创建成功')
      setFormOpen(false)
      setEditingInfoId(null)
      form.resetFields()
      void refresh()
    },
    onError: (error: Error) => message.error(error.message),
  })

  const updateInfoMutation = useMutation({
    mutationFn: (params: { infoId: number; data: HotelInfoFormValues }) =>
      MerchantHotelRequest.updateHotelInfo(hotelId, params.infoId, params.data),
    onSuccess: () => {
      message.success('酒店信息更新成功')
      setFormOpen(false)
      setEditingInfoId(null)
      form.resetFields()
      void refresh()
    },
    onError: (error: Error) => message.error(error.message),
  })

  const deleteInfoMutation = useMutation({
    mutationFn: (infoId: number) => MerchantHotelRequest.deleteHotelInfo(hotelId, infoId),
    onSuccess: () => {
      message.success('酒店信息已删除')
      void refresh()
    },
    onError: (error: Error) => message.error(error.message),
  })

  const duplicateInfoMutation = useMutation({
    mutationFn: (infoId: number) => MerchantHotelRequest.duplicateHotelInfo(hotelId, infoId),
    onSuccess: () => {
      message.success('酒店信息副本创建成功')
      void refresh()
    },
    onError: (error: Error) => message.error(error.message),
  })

  const submitInfoMutation = useMutation({
    mutationFn: (infoId: number) => MerchantHotelRequest.submitHotelInfo(hotelId, infoId),
    onSuccess: () => {
      message.success('已提交审核')
      void refresh()
    },
    onError: (error: Error) => message.error(error.message),
  })

  const withdrawInfoMutation = useMutation({
    mutationFn: (infoId: number) => MerchantHotelRequest.withdrawHotelInfo(hotelId, infoId),
    onSuccess: () => {
      message.success('已撤回到待发布状态')
      void refresh()
    },
    onError: (error: Error) => message.error(error.message),
  })

  const offlineInfoMutation = useMutation({
    mutationFn: (infoId: number) => MerchantHotelRequest.offlineHotelInfo(hotelId, infoId),
    onSuccess: () => {
      message.success('已下线')
      void refresh()
    },
    onError: (error: Error) => message.error(error.message),
  })

  const openCreateModal = () => {
    setEditingInfoId(null)
    form.setFieldsValue({
      infoNickname: '',
      name: '',
      enName: '',
      starLevel: 3,
      phone: '',
      description: '',
      province: '',
      city: '',
      district: '',
      address: '',
      openedAt: undefined,
      homeAdImage: undefined,
      location: undefined,
      tags: [],
      images: [],
      roomTypes: [],
    })
    setFormOpen(true)
  }

  const openEditModal = async (infoId: number) => {
    const data = await MerchantHotelRequest.getHotelInfoDetail(hotelId, infoId)
    form.setFieldsValue({
      infoNickname: data.infoNickname,
      name: data.name,
      enName: data.enName ?? undefined,
      starLevel: data.starLevel,
      phone: data.phone ?? undefined,
      description: data.description ?? undefined,
      province: data.province ?? undefined,
      city: data.city ?? undefined,
      district: data.district ?? undefined,
      address: data.address,
      openedAt: data.openedAt ?? undefined,
      homeAdImage: data.homeAdImage ?? undefined,
      location: data.location ?? undefined,
      tags: data.tags ?? [],
      images: data.images ?? [],
      roomTypes: data.roomTypes ?? [],
    })
    setEditingInfoId(infoId)
    setFormOpen(true)
  }

  const onSubmitInfoForm = async () => {
    const values = await form.validateFields()
    const payload: HotelInfoFormValues = {
      ...values,
      tags: (values.tags ?? []).filter(Boolean),
      images: values.images ?? [],
      roomTypes: values.roomTypes ?? [],
      location:
        values.location &&
        typeof values.location.lng === 'number' &&
        typeof values.location.lat === 'number'
          ? values.location
          : undefined,
    }
    if (editingInfoId) {
      updateInfoMutation.mutate({ infoId: editingInfoId, data: payload })
      return
    }
    createInfoMutation.mutate(payload)
  }

  const loading = hotelDetailQuery.isLoading || hotelInfosQuery.isLoading
  const infoItems = useMemo(() => hotelInfosQuery.data?.items ?? [], [hotelInfosQuery.data])

  return (
    <Space orientation="vertical" size={16} style={{ width: '100%' }}>
      <Card loading={loading}>
        <Space orientation="vertical" size={8} style={{ width: '100%' }}>
          <Button onClick={() => navigate({ to: '/merchant/hotels' })}>返回酒店列表</Button>
          <Typography.Title level={3} className="m-0!">
            {hotelDetailQuery.data?.hotelNickname ?? `酒店 #${hotelId}`}
          </Typography.Title>
          <Descriptions bordered size="small" column={3}>
            <Descriptions.Item label="酒店ID">{hotelDetailQuery.data?.id}</Descriptions.Item>
            <Descriptions.Item label="信息总数">{hotelDetailQuery.data?.infoCount ?? 0}</Descriptions.Item>
            <Descriptions.Item label="当前发布信息ID">
              {hotelDetailQuery.data?.publishedInfoId ?? '暂无'}
            </Descriptions.Item>
          </Descriptions>
          <Space align="center">
            <Typography.Text>首页广告推送</Typography.Text>
            <Switch
              checked={hotelDetailQuery.data?.isHomeAdEnabled}
              loading={updateHomeAdMutation.isPending}
              onChange={(checked) =>
                updateHomeAdMutation.mutate({
                  hotelId,
                  data: {
                    isHomeAdEnabled: checked,
                  },
                })
              }
            />
          </Space>
        </Space>
      </Card>

      <Card>
        <Space orientation="vertical" size={12} style={{ width: '100%' }}>
          <Space wrap>
            <Select
              allowClear
              placeholder="筛选状态"
              style={{ width: 200 }}
              value={statusFilter}
              options={[
                { value: HotelReviewStatus.DRAFT, label: '待发布' },
                { value: HotelReviewStatus.PENDING, label: '审核中' },
                { value: HotelReviewStatus.APPROVED, label: '已发布' },
                { value: HotelReviewStatus.REJECTED, label: '待更改' },
              ]}
              onChange={(value) => {
                setInfoPage(1)
                setStatusFilter(value)
              }}
            />
            <Button type="primary" onClick={openCreateModal}>
              新建酒店信息
            </Button>
          </Space>

          <Table
            rowKey="id"
            loading={hotelInfosQuery.isLoading}
            dataSource={infoItems}
            pagination={{
              current: infoPage,
              pageSize: infoLimit,
              total: hotelInfosQuery.data?.total ?? 0,
              showSizeChanger: true,
              onChange: (nextPage, nextLimit) => {
                setInfoPage(nextPage)
                setInfoLimit(nextLimit)
              },
            }}
            columns={[
              { title: 'ID', dataIndex: 'id', width: 80 },
              { title: '信息昵称', dataIndex: 'infoNickname' },
              { title: '酒店名称', dataIndex: 'name' },
              {
                title: '状态',
                dataIndex: 'reviewStatus',
                render: (status: string) => (
                  <Tag color={reviewStatusColor[status] ?? 'default'}>
                    {reviewStatusText[status] ?? status}
                  </Tag>
                ),
              },
              {
                title: '更新时间',
                dataIndex: 'updatedAt',
              },
              {
                title: '操作',
                key: 'actions',
                width: 520,
                render: (_, record) => (
                  <Space wrap>
                    <Button
                      size="small"
                      onClick={() => void openEditModal(record.id)}
                      disabled={[
                        HotelReviewStatus.PENDING,
                        HotelReviewStatus.APPROVED,
                      ].includes(record.reviewStatus as 'PENDING' | 'APPROVED')}
                    >
                      编辑
                    </Button>
                    <Button
                      size="small"
                      onClick={() => duplicateInfoMutation.mutate(record.id)}
                      loading={duplicateInfoMutation.isPending && duplicateInfoMutation.variables === record.id}
                    >
                      创建副本
                    </Button>
                    <Button
                      size="small"
                      type="primary"
                      ghost
                      disabled={
                        record.reviewStatus !== HotelReviewStatus.DRAFT &&
                        record.reviewStatus !== HotelReviewStatus.REJECTED
                      }
                      onClick={() => submitInfoMutation.mutate(record.id)}
                      loading={submitInfoMutation.isPending && submitInfoMutation.variables === record.id}
                    >
                      发布
                    </Button>
                    <Button
                      size="small"
                      disabled={record.reviewStatus !== HotelReviewStatus.PENDING}
                      onClick={() => withdrawInfoMutation.mutate(record.id)}
                      loading={withdrawInfoMutation.isPending && withdrawInfoMutation.variables === record.id}
                    >
                      撤回
                    </Button>
                    <Button
                      size="small"
                      disabled={record.reviewStatus !== HotelReviewStatus.APPROVED}
                      onClick={() => offlineInfoMutation.mutate(record.id)}
                      loading={offlineInfoMutation.isPending && offlineInfoMutation.variables === record.id}
                    >
                      下线
                    </Button>
                    <Popconfirm
                      title="确认删除该酒店信息？"
                      onConfirm={() => deleteInfoMutation.mutate(record.id)}
                    >
                      <Button
                        danger
                        size="small"
                        loading={deleteInfoMutation.isPending && deleteInfoMutation.variables === record.id}
                      >
                        删除
                      </Button>
                    </Popconfirm>
                  </Space>
                ),
              },
            ]}
          />
        </Space>
      </Card>

      <Modal
        width={1000}
        title={editingInfoId ? `编辑酒店信息 #${editingInfoId}` : '创建酒店信息'}
        open={formOpen}
        onCancel={() => setFormOpen(false)}
        onOk={() => void onSubmitInfoForm()}
        confirmLoading={createInfoMutation.isPending || updateInfoMutation.isPending}
      >
        <Form form={form} layout="vertical">
          <Row gutter={12}>
            <Col span={8}>
              <Form.Item name="infoNickname" label="信息昵称" rules={[{ required: true }]}>
                <Input placeholder="仅商家可见" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="name" label="酒店名称" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="enName" label="酒店英文名称">
                <Input />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="starLevel" label="酒店星级" rules={[{ required: true }]}>
                <InputNumber min={1} max={5} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="phone" label="酒店电话">
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="openedAt"
                label="开业时间"
                getValueProps={(val) => ({ value: val ? dayjs(val) : undefined })}
                getValueFromEvent={(date: dayjs.Dayjs | null) =>
                  date ? date.toISOString() : undefined
                }
              >
                <DatePicker style={{ width: '100%' }} placeholder="请选择开业时间" />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item name="description" label="酒店简介">
                <Input.TextArea rows={3} />
              </Form.Item>
            </Col>
          </Row>

          <Divider>
            <Space>
              地址信息
              <Button
                size="small"
                type="link"
                icon={<LocateFixed size={14} />}
                onClick={() => void handleLocate()}
                loading={locating}
              >
                自动定位
              </Button>
            </Space>
          </Divider>
          <Row gutter={12}>
            <Col span={6}>
              <Form.Item name="province" label="省">
                <Input />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="city" label="市">
                <Input />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="district" label="区">
                <Input />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item name="address" label="详细地址" rules={[{ required: true }]}>
                <AddressAutoComplete form={form} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name={['location', 'lng']} label="经度">
                <InputNumber style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name={['location', 'lat']} label="纬度">
                <InputNumber style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item name="homeAdImage" label="首页广告图">
                <CosImageUpload dir="hotel-ad" />
              </Form.Item>
            </Col>
          </Row>

          <Divider>标签</Divider>
          <Form.Item name="tags">
            <TagInput presets={HOTEL_TAG_PRESETS} />
          </Form.Item>

          <Divider>轮播图</Divider>
          <Form.List name="images">
            {(fields, { add, remove }) => (
              <Space orientation="vertical" style={{ width: '100%' }}>
                {fields.map((field) => (
                  <Card key={field.key} size="small">
                    <Row gutter={12}>
                      <Col span={10}>
                        <Form.Item
                          name={[field.name, 'url']}
                          label="图片"
                          rules={[{ required: true }]}
                        >
                          <CosImageUpload dir="hotel-carousel" />
                        </Form.Item>
                      </Col>
                      <Col span={6}>
                        <Form.Item
                          name={[field.name, 'sortOrder']}
                          label="排序"
                          rules={[{ required: true }]}
                        >
                          <InputNumber min={0} style={{ width: '100%' }} />
                        </Form.Item>
                      </Col>
                      <Col span={6}>
                        <Form.Item name={[field.name, 'caption']} label="描述">
                          <Input />
                        </Form.Item>
                      </Col>
                      <Col span={2}>
                        <Button danger onClick={() => remove(field.name)}>
                          删除
                        </Button>
                      </Col>
                    </Row>
                  </Card>
                ))}
                <Button onClick={() => add({ url: '', sortOrder: 0 })}>新增轮播图</Button>
              </Space>
            )}
          </Form.List>

          <Divider>房型</Divider>
          <Form.List name="roomTypes">
            {(fields, { add, remove }) => (
              <Space orientation="vertical" style={{ width: '100%' }}>
                {fields.map((field) => (
                  <Card key={field.key} size="small">
                    <Row gutter={12}>
                      <Col span={6}>
                        <Form.Item
                          name={[field.name, 'name']}
                          label="房型名"
                          rules={[{ required: true }]}
                        >
                          <Input />
                        </Form.Item>
                      </Col>
                      <Col span={4}>
                        <Form.Item
                          name={[field.name, 'count']}
                          label="数量"
                          rules={[{ required: true }]}
                        >
                          <InputNumber min={0} style={{ width: '100%' }} />
                        </Form.Item>
                      </Col>
                      <Col span={4}>
                        <Form.Item
                          name={[field.name, 'price']}
                          label="价格"
                          rules={[{ required: true }]}
                        >
                          <InputNumber min={0} style={{ width: '100%' }} />
                        </Form.Item>
                      </Col>
                      <Col span={4}>
                        <Form.Item
                          name={[field.name, 'priceMode']}
                          label="计价方式"
                          initialValue={PriceMode.PER_NIGHT}
                          rules={[{ required: true }]}
                        >
                          <Select
                            options={[
                              { label: '标准住宿', value: PriceMode.PER_NIGHT },
                              { label: '钟点房', value: PriceMode.PER_HOUR },
                            ]}
                          />
                        </Form.Item>
                      </Col>
                      <Col span={4}>
                        <Form.Item
                          name={[field.name, 'duration']}
                          label={`购买时长： ${form.getFieldValue(['roomTypes', field.name, 'priceMode']) === PriceMode.PER_HOUR ? '小时' : '夜晚'}`}
                          rules={[{ required: true }]}
                        >
                          <InputNumber min={1} style={{ width: '100%' }} />
                        </Form.Item>
                      </Col>
                      <Col span={4}>
                        <Form.Item
                          name={[field.name, 'maxGuests']}
                          label="入住人数"
                          rules={[{ required: true }]}
                        >
                          <InputNumber min={1} style={{ width: '100%' }} />
                        </Form.Item>
                      </Col>
                      <Col span={2}>
                        <Button danger onClick={() => remove(field.name)}>
                          删除
                        </Button>
                      </Col>
                      <Col span={6}>
                        <Form.Item name={[field.name, 'bedType']} label="床型说明">
                          <Input />
                        </Form.Item>
                      </Col>
                      <Col span={6}>
                        <Form.Item name={[field.name, 'area']} label="房间面积">
                          <InputNumber min={0} style={{ width: '100%' }} />
                        </Form.Item>
                      </Col>
                      <Col span={6}>
                        <Form.Item name={[field.name, 'imageUrl']} label="参考图">
                          <CosImageUpload dir="hotel-room" />
                        </Form.Item>
                      </Col>
                      <Col span={6}>
                        <Form.Item
                          name={[field.name, 'sortOrder']}
                          label="排序"
                          rules={[{ required: true }]}
                        >
                          <InputNumber min={0} style={{ width: '100%' }} />
                        </Form.Item>
                      </Col>
                    </Row>
                    <Form.Item shouldUpdate noStyle>
                      {() => {
                        const mode = form.getFieldValue(['roomTypes', field.name, 'priceMode']) as string | undefined
                        if (mode !== PriceMode.PER_HOUR) {
                          return null
                        }
                        return (
                          <>
                            <Divider>钟点时段</Divider>
                            <Form.List name={[field.name, 'hourlySlots']}>
                              {(slotFields, { add: addSlot, remove: removeSlot }) => (
                                <Space direction="vertical" style={{ width: '100%' }}>
                                  {slotFields.map((slotField) => (
                                    <Row gutter={12} key={slotField.key}>
                                      <Col span={6}>
                                        <Form.Item
                                          name={[slotField.name, 'startTime']}
                                          label="开始时间"
                                          rules={[
                                            { required: true },
                                            {
                                              validator: async (_, value: string) => {
                                                if (!value) return
                                                const duration = Number(form.getFieldValue(['roomTypes', field.name, 'duration']) ?? 0)
                                                if (!duration || duration < 1) return
                                                const endMinutes = parseTimeToMinutes(value) + duration * 60
                                                if (endMinutes > 24 * 60) {
                                                  throw new Error('时段结束时间不能超过24:00')
                                                }
                                              },
                                            },
                                          ]}
                                        >
                                          <Input placeholder="12:00" />
                                        </Form.Item>
                                      </Col>
                                      <Col span={14}>
                                        <div className="pt-8 text-xs text-gray-500">
                                          结束时间将按 房型时长单位(duration) 自动推导
                                        </div>
                                      </Col>
                                      <Col span={4}>
                                        <Button danger onClick={() => removeSlot(slotField.name)}>
                                          删
                                        </Button>
                                      </Col>
                                    </Row>
                                  ))}
                                  <Button
                                    onClick={() =>
                                      addSlot({
                                        startTime: '12:00',
                                      })
                                    }
                                  >
                                    新增时段
                                  </Button>
                                </Space>
                              )}
                            </Form.List>
                          </>
                        )
                      }}
                    </Form.Item>
                  </Card>
                ))}
                <Button
                  onClick={() =>
                    add({
                      name: '',
                      count: 0,
                      price: 0,
                      priceMode: PriceMode.PER_NIGHT,
                      duration: 1,
                      maxGuests: 1,
                      sortOrder: 0,
                      hourlySlots: [],
                    })
                  }
                >
                  新增房型
                </Button>
              </Space>
            )}
          </Form.List>
        </Form>
      </Modal>
    </Space>
  )
}

export default HotelDetailPage
