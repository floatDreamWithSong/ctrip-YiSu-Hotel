import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { hotelApi } from '@yisu/front-utils/apis/hotel'
import { Descriptions, Spin, Button, Space, message, Tag, Modal } from 'antd'
import type { RejectHotelType } from '@yisu/shared'
import { useState } from 'react'
import { RejectModal } from './components/RejectModal'
import dayjs from 'dayjs'

export const Route = createFileRoute('/_authenticated/admin/$versionId')({
  component: HotelDetailComponent,
})

function HotelDetailComponent() {
  const { versionId } = Route.useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [isRejectModalVisible, setRejectModalVisible] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['hotelDetail', versionId],
    queryFn: () => hotelApi.getHotelDetail(Number(versionId)),
  })

  const approveMutation = useMutation({
    mutationFn: () => hotelApi.approveHotel(Number(versionId)),
    onSuccess: () => {
      message.success('审核通过成功')
      queryClient.invalidateQueries({ queryKey: ['hotels', 'pending'] })
      queryClient.invalidateQueries({ queryKey: ['review-records'] })
      navigate({ to: '/admin/hotels' })
    },
    onError: (error) => {
      message.error(`操作失败: ${error.message}`)
    },
  })

  const rejectMutation = useMutation({
    mutationFn: (rejectionData: RejectHotelType) =>
      hotelApi.rejectHotel(Number(versionId), rejectionData),
    onSuccess: () => {
      message.success('拒绝操作成功')
      setRejectModalVisible(false)
      queryClient.invalidateQueries({ queryKey: ['hotels', 'pending'] })
      queryClient.invalidateQueries({ queryKey: ['review-records'] })
      navigate({ to: '/admin/hotels' })
    },
    onError: (error) => {
      message.error(`操作失败: ${error.message}`)
    },
  })

  const handleApprove = () => {
    Modal.confirm({
      title: '确认通过审核吗？',
      content: '此操作将使该酒店版本上线发布。',
      onOk: () => approveMutation.mutate(),
    })
  }

  if (isLoading) return <Spin size="large" />
  if (!data) return <div>加载失败或未找到数据</div>

  const { currentVersion, merchant } = data

  return (
    <Space orientation="vertical" style={{ width: '100%' }} size="large">
      <h2>酒店审核详情</h2>
      <Descriptions title="商家信息" bordered>
        <Descriptions.Item label="ID">{merchant.id}</Descriptions.Item>
        <Descriptions.Item label="名称">
          {merchant.displayName}
        </Descriptions.Item>
      </Descriptions>

      <Descriptions title="酒店信息" bordered column={2}>
        <Descriptions.Item label="酒店名称">
          {currentVersion.name}
        </Descriptions.Item>
        <Descriptions.Item label="酒店英文名称">
          {currentVersion.enName || '-'}
        </Descriptions.Item>
        <Descriptions.Item label="星级">
          {currentVersion.starLevel} 星
        </Descriptions.Item>
        <Descriptions.Item label="联系电话">
          {currentVersion.phone || '-'}
        </Descriptions.Item>
        <Descriptions.Item label="地址" span={2}>
          {`${currentVersion.province || ''} ${currentVersion.city || ''} ${currentVersion.district || ''} ${currentVersion.address || ''}`}
        </Descriptions.Item>
        <Descriptions.Item label="开业时间">
          {currentVersion.openedAt
            ? dayjs(currentVersion.openedAt).format('YYYY-MM-DD')
            : '-'}
        </Descriptions.Item>
        <Descriptions.Item label="简介" span={2}>
          {currentVersion.description || '-'}
        </Descriptions.Item>
      </Descriptions>

      <Space>
        <Button
          type="primary"
          onClick={handleApprove}
          loading={approveMutation.isPending}
        >
          审核通过
        </Button>
        <Button
          danger
          onClick={() => setRejectModalVisible(true)}
          loading={rejectMutation.isPending}
        >
          拒绝
        </Button>
      </Space>

      <RejectModal
        open={isRejectModalVisible}
        onCancel={() => setRejectModalVisible(false)}
        onSubmit={(values) => rejectMutation.mutate(values)}
        loading={rejectMutation.isPending}
      />
    </Space>
  )
}
