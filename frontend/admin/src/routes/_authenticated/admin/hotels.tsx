import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { hotelApi } from '@yisu/front-utils/apis/hotel'
import {
  Table,
  Select,
  DatePicker,
  Tag,
  Pagination,
  Space,
  Divider,
  Typography,
} from 'antd'
import { useState } from 'react'
import type { GetReviewRecordsType } from '@yisu/shared'
import dayjs from 'dayjs'
import type { Dayjs } from 'dayjs'

export const Route = createFileRoute('/_authenticated/admin/hotels')({
  component: HotelsComponent,
})

function HotelsComponent() {
  const navigate = useNavigate()

  // State for Pending Hotels Table
  const [pendingPage, setPendingPage] = useState(1)
  const [pendingPageSize, setPendingPageSize] = useState(10)

  // State for Reviewed Hotels Table
  const [reviewedFilters, setReviewedFilters] = useState<
    Omit<GetReviewRecordsType, 'page' | 'pageSize'>
  >({
    sort: 'desc',
  })
  const [reviewedPage, setReviewedPage] = useState(1)
  const [reviewedPageSize, setReviewedPageSize] = useState(10)

  // Query for Pending Hotels
  const { data: pendingData, isLoading: isPendingLoading } = useQuery({
    queryKey: [
      'hotels',
      'pending',
      { page: pendingPage, pageSize: pendingPageSize },
    ],
    queryFn: () =>
      hotelApi.getHotels({
        status: 'PENDING',
        page: pendingPage,
        pageSize: pendingPageSize,
      }),
  })

  // Query for Reviewed Hotels
  const { data: reviewedData, isLoading: isReviewedLoading } = useQuery({
    queryKey: [
      'review-records',
      { ...reviewedFilters, page: reviewedPage, pageSize: reviewedPageSize },
    ],
    queryFn: () =>
      hotelApi.getReviewRecords({
        ...reviewedFilters,
        page: reviewedPage,
        pageSize: reviewedPageSize,
      }),
  })

  const pendingColumns = [
    { title: '酒店名称', dataIndex: 'name', key: 'name' },
    { title: '商家', dataIndex: 'merchantName', key: 'merchantName' },
    {
      title: '状态',
      dataIndex: 'reviewStatus',
      key: 'reviewStatus',
      render: (status: string) => <Tag color="gold">{status}</Tag>,
    },
    {
      title: '提交时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (text: string) =>
        text ? dayjs(text).format('YYYY-MM-DD HH:mm:ss') : '-',
    },
    {
      title: '审核时间',
      dataIndex: 'reviewedAt',
      key: 'reviewedAt',
      render: (text: string) =>
        text ? dayjs(text).format('YYYY-MM-DD HH:mm:ss') : '-',
    },
    {
      title: '类型',
      dataIndex: 'isNewHotel',
      key: 'isNewHotel',
      render: (isNew: boolean) => (isNew ? '新增' : '修改'),
    },
  ]

  const reviewedColumns = [
    { title: '酒店名称', dataIndex: 'hotelName', key: 'hotelName' },
    { title: '商家', dataIndex: 'merchantName', key: 'merchantName' },
    {
      title: '操作',
      dataIndex: 'action',
      key: 'action',
      render: (action: string) => (
        <Tag color={action === 'APPROVED' ? 'green' : 'red'}>{action}</Tag>
      ),
    },
    { title: '审核员', dataIndex: 'reviewerName', key: 'reviewerName' },
    {
      title: '审核时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (text: string) =>
        text ? dayjs(text).format('YYYY-MM-DD HH:mm:ss') : '-',
    },
  ]

  const handleDateChange = (dates: [Dayjs | null, Dayjs | null] | null) => {
    setReviewedPage(1)
    if (dates && dates[0] && dates[1]) {
      setReviewedFilters((prev) => ({
        ...prev,
        startTime: dates[0]?.startOf('day').toISOString(),
        endTime: dates[1]?.endOf('day').toISOString(),
      }))
    } else {
      setReviewedFilters((prev) => {
        const { startTime, endTime, ...rest } = prev
        return rest
      })
    }
  }

  const handleActionChange = (action?: 'APPROVED' | 'REJECTED') => {
    setReviewedPage(1)
    if (action) {
      setReviewedFilters((prev) => ({ ...prev, action }))
    } else {
      setReviewedFilters((prev) => {
        const { action, ...rest } = prev
        return rest
      })
    }
  }

  const onPendingRowClick = (record: { id: number }) => {
    navigate({
      to: '/admin/$versionId',
      params: { versionId: String(record.id) },
    })
  }

  const onReviewedRowClick = (record: { versionId: number }) => {
    navigate({
      to: '/admin/$versionId',
      params: { versionId: String(record.versionId) },
    })
  }

  return (
    <Space orientation="vertical" style={{ width: '100%' }} size="large">
      <Typography.Title level={4}>待审核酒店</Typography.Title>
      <Table
        rowKey="id"
        columns={pendingColumns}
        dataSource={pendingData?.items}
        loading={isPendingLoading}
        pagination={false}
        onRow={(record) => ({
          onClick: () => onPendingRowClick(record),
          style: { cursor: 'pointer' },
        })}
      />
      <Pagination
        current={pendingPage}
        pageSize={pendingPageSize}
        total={pendingData?.total}
        onChange={(page, pageSize) => {
          setPendingPage(page)
          setPendingPageSize(pageSize)
        }}
        showSizeChanger
        style={{ textAlign: 'right' }}
      />

      <Divider />

      <Typography.Title level={4}>审核记录</Typography.Title>
      <Space wrap>
        <Select
          style={{ width: 120 }}
          placeholder="状态"
          onChange={handleActionChange}
          allowClear
        >
          <Select.Option value="APPROVED">已通过</Select.Option>
          <Select.Option value="REJECTED">已拒绝</Select.Option>
        </Select>
        <DatePicker.RangePicker onChange={handleDateChange} />
      </Space>
      <Table
        rowKey="id"
        columns={reviewedColumns}
        dataSource={reviewedData?.items}
        loading={isReviewedLoading}
        pagination={false}
        onRow={(record) => ({
          onClick: () => onReviewedRowClick(record),
          style: { cursor: 'pointer' },
        })}
      />
      <Pagination
        current={reviewedPage}
        pageSize={reviewedPageSize}
        total={reviewedData?.total}
        onChange={(page, pageSize) => {
          setReviewedPage(page)
          setReviewedPageSize(pageSize)
        }}
        showSizeChanger
        style={{ textAlign: 'right' }}
      />
    </Space>
  )
}
