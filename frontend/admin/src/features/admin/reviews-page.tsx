import { AdminReviewRequest } from '@/apis/hotel'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { HotelReviewStatus, RejectReasonType } from '@yisu/shared'
import type { ApiHotelTypes } from '@yisu/shared'
import {
  Button,
  Card,
  Col,
  Descriptions,
  Form,
  Input,
  Modal,
  Row,
  Select,
  Space,
  Table,
  Tag,
  Typography,
  message,
} from 'antd'
import { useMemo, useState } from 'react'

const ADMIN_REVIEW_INFOS_KEY = 'admin-review-infos'
const ADMIN_REVIEW_INFO_DETAIL_KEY = 'admin-review-info-detail'
const ADMIN_REVIEW_RECORDS_KEY = 'admin-review-records'

const reviewStatusText: Record<string, string> = {
  [HotelReviewStatus.PENDING]: '待审核',
  [HotelReviewStatus.APPROVED]: '已通过',
  [HotelReviewStatus.REJECTED]: '已拒绝',
}

const rejectReasonOptions = [
  { value: RejectReasonType.INFO_INCOMPLETE, label: '信息不完整' },
  { value: RejectReasonType.INFO_INACCURATE, label: '信息不准确' },
  { value: RejectReasonType.IMAGE_QUALITY, label: '图片质量问题' },
  { value: RejectReasonType.PRICE_ABNORMAL, label: '价格异常' },
  { value: RejectReasonType.DUPLICATE, label: '重复酒店' },
  { value: RejectReasonType.POLICY_VIOLATION, label: '政策违反' },
  { value: RejectReasonType.OTHER, label: '其他' },
]

const deriveEndTime = (startTime: string, duration: number) => {
  const [hours, minutes] = startTime.split(':').map(Number)
  const total = hours * 60 + minutes + duration * 60
  const endHours = Math.floor(total / 60)
  const endMinutes = total % 60
  return `${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}`
}

type ReviewActionForm = ApiHotelTypes['AdminReviewAction']

const ReviewsPage = () => {
  const queryClient = useQueryClient()
  const [infoPage, setInfoPage] = useState(1)
  const [infoLimit, setInfoLimit] = useState(10)
  const [statusFilter, setStatusFilter] =
    useState<ApiHotelTypes['AdminReviewQuery']['reviewStatus']>()
  const [detailOpen, setDetailOpen] = useState(false)
  const [currentInfoId, setCurrentInfoId] = useState<number | null>(null)
  const [actionForm] = Form.useForm<ReviewActionForm>()

  const [recordPage, setRecordPage] = useState(1)
  const [recordLimit, setRecordLimit] = useState(10)
  const [recordAction, setRecordAction] =
    useState<ApiHotelTypes['ReviewRecordQuery']['action']>()
  const [recordReason, setRecordReason] =
    useState<ApiHotelTypes['ReviewRecordQuery']['rejectReason']>()
  const [recordStartAt, setRecordStartAt] = useState<string>()
  const [recordEndAt, setRecordEndAt] = useState<string>()

  const reviewInfosQuery = useQuery({
    queryKey: [ADMIN_REVIEW_INFOS_KEY, infoPage, infoLimit, statusFilter],
    queryFn: () =>
      AdminReviewRequest.getReviewHotelInfos({
        page: infoPage,
        limit: infoLimit,
        reviewStatus: statusFilter,
      }),
  })

  const detailQuery = useQuery({
    queryKey: [ADMIN_REVIEW_INFO_DETAIL_KEY, currentInfoId],
    queryFn: () =>
      AdminReviewRequest.getReviewHotelInfoDetail(currentInfoId as number),
    enabled: detailOpen && currentInfoId !== null,
  })

  const reviewRecordsQuery = useQuery({
    queryKey: [
      ADMIN_REVIEW_RECORDS_KEY,
      recordPage,
      recordLimit,
      recordAction,
      recordReason,
      recordStartAt,
      recordEndAt,
    ],
    queryFn: () =>
      AdminReviewRequest.getReviewRecords({
        page: recordPage,
        limit: recordLimit,
        action: recordAction,
        rejectReason: recordReason,
        startAt: recordStartAt,
        endAt: recordEndAt,
        order: 'desc',
      }),
  })

  const reviewActionMutation = useMutation({
    mutationFn: (params: { infoId: number; data: ReviewActionForm }) =>
      AdminReviewRequest.reviewHotelInfo(params.infoId, params.data),
    onSuccess: () => {
      message.success('审核提交成功')
      setDetailOpen(false)
      setCurrentInfoId(null)
      actionForm.resetFields()
      void Promise.all([
        queryClient.invalidateQueries({ queryKey: [ADMIN_REVIEW_INFOS_KEY] }),
        queryClient.invalidateQueries({ queryKey: [ADMIN_REVIEW_RECORDS_KEY] }),
      ])
    },
    onError: (error: Error) => {
      message.error(error.message)
    },
  })

  const openDetail = (infoId: number) => {
    setCurrentInfoId(infoId)
    actionForm.setFieldsValue({
      action: HotelReviewStatus.APPROVED,
      rejectReason: undefined,
      rejectDetail: undefined,
    })
    setDetailOpen(true)
  }

  const submitAction = async () => {
    if (!currentInfoId) {
      return
    }
    const values = await actionForm.validateFields()
    reviewActionMutation.mutate({
      infoId: currentInfoId,
      data: values,
    })
  }

  const infoRows = useMemo(
    () => reviewInfosQuery.data?.items ?? [],
    [reviewInfosQuery.data],
  )
  const recordRows = useMemo(
    () => reviewRecordsQuery.data?.items ?? [],
    [reviewRecordsQuery.data],
  )

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <Card>
        <Space direction="vertical" size={12} style={{ width: '100%' }}>
          <Typography.Title level={3} className="m-0!">
            审核列表
          </Typography.Title>
          <Space wrap>
            <Select
              allowClear
              placeholder="按状态筛选"
              style={{ width: 180 }}
              value={statusFilter}
              options={[
                { label: '待审核', value: HotelReviewStatus.PENDING },
                { label: '已通过', value: HotelReviewStatus.APPROVED },
                { label: '已拒绝', value: HotelReviewStatus.REJECTED },
              ]}
              onChange={(value) => {
                setInfoPage(1)
                setStatusFilter(value)
              }}
            />
          </Space>
          <Table
            rowKey="id"
            loading={reviewInfosQuery.isLoading}
            dataSource={infoRows}
            pagination={{
              current: infoPage,
              pageSize: infoLimit,
              total: reviewInfosQuery.data?.total ?? 0,
              showSizeChanger: true,
              onChange: (nextPage, nextLimit) => {
                setInfoPage(nextPage)
                setInfoLimit(nextLimit)
              },
            }}
            columns={[
              { title: '信息ID', dataIndex: 'id', width: 90 },
              { title: '酒店昵称', dataIndex: ['hotel', 'hotelNickname'] },
              { title: '信息昵称', dataIndex: 'infoNickname' },
              { title: '酒店名', dataIndex: 'name' },
              {
                title: '状态',
                dataIndex: 'reviewStatus',
                render: (value: string) => (
                  <Tag
                    color={
                      value === HotelReviewStatus.APPROVED
                        ? 'success'
                        : value === HotelReviewStatus.REJECTED
                          ? 'error'
                          : 'processing'
                    }
                  >
                    {reviewStatusText[value] ?? value}
                  </Tag>
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
                render: (_, record) => (
                  <Button
                    type="primary"
                    ghost
                    onClick={() => openDetail(record.id)}
                  >
                    查看并审核
                  </Button>
                ),
              },
            ]}
          />
        </Space>
      </Card>

      <Card>
        <Space direction="vertical" size={12} style={{ width: '100%' }}>
          <Typography.Title level={4} className="m-0!">
            审核记录
          </Typography.Title>
          <Row gutter={[12, 12]}>
            <Col xs={24} md={6}>
              <Select
                allowClear
                placeholder="审核结果"
                value={recordAction}
                style={{ width: '100%' }}
                options={[
                  { label: '待审核', value: HotelReviewStatus.PENDING },
                  { label: '已通过', value: HotelReviewStatus.APPROVED },
                  { label: '已拒绝', value: HotelReviewStatus.REJECTED },
                ]}
                onChange={(value) => {
                  setRecordPage(1)
                  setRecordAction(value)
                }}
              />
            </Col>
            <Col xs={24} md={6}>
              <Select
                allowClear
                placeholder="拒绝原因"
                value={recordReason}
                style={{ width: '100%' }}
                options={rejectReasonOptions}
                onChange={(value) => {
                  setRecordPage(1)
                  setRecordReason(value)
                }}
              />
            </Col>
            <Col xs={24} md={6}>
              <Input
                placeholder="开始时间 ISO"
                value={recordStartAt}
                onChange={(event) => {
                  setRecordPage(1)
                  setRecordStartAt(event.target.value)
                }}
              />
            </Col>
            <Col xs={24} md={6}>
              <Input
                placeholder="结束时间 ISO"
                value={recordEndAt}
                onChange={(event) => {
                  setRecordPage(1)
                  setRecordEndAt(event.target.value)
                }}
              />
            </Col>
          </Row>
          <Table
            rowKey="id"
            loading={reviewRecordsQuery.isLoading}
            dataSource={recordRows}
            pagination={{
              current: recordPage,
              pageSize: recordLimit,
              total: reviewRecordsQuery.data?.total ?? 0,
              showSizeChanger: true,
              onChange: (nextPage, nextLimit) => {
                setRecordPage(nextPage)
                setRecordLimit(nextLimit)
              },
            }}
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
        </Space>
      </Card>

      <Modal
        width={1000}
        title={
          currentInfoId ? `酒店信息审核 #${currentInfoId}` : '酒店信息审核'
        }
        open={detailOpen}
        onCancel={() => setDetailOpen(false)}
        onOk={() => void submitAction()}
        confirmLoading={reviewActionMutation.isPending}
      >
        <Space direction="vertical" size={16} style={{ width: '100%' }}>
          <Card loading={detailQuery.isLoading}>
            <Descriptions bordered size="small" column={2}>
              <Descriptions.Item label="酒店昵称">
                {detailQuery.data?.hotel.hotelNickname}
              </Descriptions.Item>
              <Descriptions.Item label="信息昵称">
                {detailQuery.data?.infoNickname}
              </Descriptions.Item>
              <Descriptions.Item label="酒店名">
                {detailQuery.data?.name}
              </Descriptions.Item>
              <Descriptions.Item label="当前状态">
                {reviewStatusText[detailQuery.data?.reviewStatus ?? ''] ??
                  detailQuery.data?.reviewStatus}
              </Descriptions.Item>
              <Descriptions.Item label="地址" span={2}>
                {detailQuery.data?.address}
              </Descriptions.Item>
              <Descriptions.Item label="简介" span={2}>
                {detailQuery.data?.description ?? '-'}
              </Descriptions.Item>
              <Descriptions.Item label="房型数量">
                {detailQuery.data?.roomTypes.length ?? 0}
              </Descriptions.Item>
              <Descriptions.Item label="钟点时段数">
                {(detailQuery.data?.roomTypes ?? []).reduce(
                  (total, room) => total + (room.hourlySlots?.length ?? 0),
                  0,
                )}
              </Descriptions.Item>
              <Descriptions.Item label="轮播图数量">
                {detailQuery.data?.images.length ?? 0}
              </Descriptions.Item>
            </Descriptions>
          </Card>
          <Card title="房型与时段">
            <Space direction="vertical" style={{ width: '100%' }}>
              {(detailQuery.data?.roomTypes ?? []).map((room) => (
                <Card key={room.id} size="small">
                  <Space
                    direction="vertical"
                    size={4}
                    style={{ width: '100%' }}
                  >
                    <Typography.Text strong>{room.name}</Typography.Text>
                    <Typography.Text type="secondary">
                      计价：{room.priceMode}，基础价：{room.price}，时长单位：
                      {room.duration}
                    </Typography.Text>
                    {(room.hourlySlots ?? []).map((slot) => (
                      <Typography.Text key={slot.id} type="secondary">
                        {slot.startTime}-
                        {deriveEndTime(slot.startTime, room.duration)}
                      </Typography.Text>
                    ))}
                  </Space>
                </Card>
              ))}
            </Space>
          </Card>
          <Card>
            <Form form={actionForm} layout="vertical">
              <Form.Item
                name="action"
                label="审核结果"
                rules={[{ required: true }]}
              >
                <Select
                  options={[
                    { label: '通过', value: HotelReviewStatus.APPROVED },
                    { label: '拒绝', value: HotelReviewStatus.REJECTED },
                  ]}
                />
              </Form.Item>
              <Form.Item
                shouldUpdate={(prev, cur) => prev.action !== cur.action}
                noStyle
              >
                {() => {
                  const action = actionForm.getFieldValue('action') as
                    | string
                    | undefined
                  const isReject = action === HotelReviewStatus.REJECTED
                  if (!isReject) {
                    return null
                  }
                  return (
                    <>
                      <Form.Item
                        name="rejectReason"
                        label="拒绝原因"
                        rules={[{ required: true, message: '请选择拒绝原因' }]}
                      >
                        <Select options={rejectReasonOptions} />
                      </Form.Item>
                      <Form.Item
                        shouldUpdate={(prev, cur) =>
                          prev.rejectReason !== cur.rejectReason
                        }
                        noStyle
                      >
                        {() => {
                          const reason = actionForm.getFieldValue(
                            'rejectReason',
                          ) as string | undefined
                          if (reason !== RejectReasonType.OTHER) {
                            return null
                          }
                          return (
                            <Form.Item
                              name="rejectDetail"
                              label="审核备注(可选)"
                            >
                              <Input.TextArea rows={3} maxLength={1000} />
                            </Form.Item>
                          )
                        }}
                      </Form.Item>
                    </>
                  )
                }}
              </Form.Item>
            </Form>
          </Card>
        </Space>
      </Modal>
    </Space>
  )
}

export default ReviewsPage
