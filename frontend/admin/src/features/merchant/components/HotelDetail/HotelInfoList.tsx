import { Button, Card, Select, Space, Typography } from 'antd'
import { HotelReviewStatus } from '@yisu/shared'
import { useQueryClient } from '@tanstack/react-query'
import { useHotelInfos } from '../../hooks/useHotelInfos'
import { useHotelInfoActions } from '../../hooks/useHotelInfoActions'
import { useHotelInfoForm } from '../../hooks/useHotelInfoForm'
import { hotelInfoDetailQueryOptions } from '../../queries/hotelQueries'
import { useQueryClient } from '@tanstack/react-query'
import { HotelInfoTable } from './HotelInfoTable'
import { HotelInfoFormModal } from '../HotelInfo/HotelInfoFormModal'

interface HotelInfoListProps {
  hotelId: number
}

/**
 * 酒店信息列表区域
 * 包含筛选器、表格和操作
 */
export function HotelInfoList({ hotelId }: HotelInfoListProps) {
  const { infos, loading, pagination, filter } = useHotelInfos(hotelId)
  const actions = useHotelInfoActions(hotelId)
  const formHook = useHotelInfoForm(hotelId)
  const queryClient = useQueryClient()

  /**
   * 鼠标悬停「编辑/查看」按钮时静默预取表单数据
   * prefetchQuery：缓存新鲜则跳过；否则后台请求，不阻塞任何 UI
   * 用户点击后 openEdit 调用 ensureQueryData 命中缓存，实现弹窗打开即填充
   */
  const handlePrefetchInfo = (infoId: number) => {
    void queryClient.prefetchQuery(hotelInfoDetailQueryOptions(hotelId, infoId))
  }

  // 当前打开编辑的酒店是否为只读（已发布/审核中）
  const editingInfo = infos.find((i) => i.id === formHook.editingInfoId)
  const isReadOnly =
    editingInfo?.reviewStatus === HotelReviewStatus.APPROVED ||
    editingInfo?.reviewStatus === HotelReviewStatus.PENDING

  return (
    <Card>
      <Space orientation="vertical" size={12} style={{ width: '100%' }}>
        <Typography.Title level={4} className="m-0!">
          酒店信息管理
        </Typography.Title>

        {/* 筛选和操作区 */}
        <Space wrap>
          <Select
            allowClear
            placeholder="筛选状态"
            style={{ width: 200 }}
            value={filter.statusFilter}
            options={[
              { value: HotelReviewStatus.DRAFT, label: '待发布' },
              { value: HotelReviewStatus.PENDING, label: '审核中' },
              { value: HotelReviewStatus.APPROVED, label: '已发布' },
              { value: HotelReviewStatus.REJECTED, label: '待更改' },
            ]}
            onChange={filter.setStatusFilter}
          />
          <Button type="primary" onClick={formHook.openCreate}>
            创建酒店信息
          </Button>
        </Space>

        {/* 酒店信息表格 */}
        <HotelInfoTable
          hotelId={hotelId}
          dataSource={infos}
          loading={loading}
          pagination={pagination}
          onEdit={(infoId) => void formHook.openEdit(infoId)}
          onPrefetch={handlePrefetchInfo}
          actions={{
            submit: actions.submit,
            withdraw: actions.withdraw,
            offline: actions.offline,
            duplicate: actions.duplicate,
            delete: actions.delete,
            submitting: actions.submitting,
            withdrawing: actions.withdrawing,
            offlining: actions.offlining,
            duplicating: actions.duplicating,
            deleting: actions.deleting,
          }}
        />

        {/* 酒店信息表单模态框 */}
        <HotelInfoFormModal
          open={formHook.open}
          editingInfoId={formHook.editingInfoId}
          readOnly={isReadOnly}
          form={formHook.form}
          locating={formHook.locating}
          handleLocate={formHook.handleLocate}
          onSubmit={formHook.onSubmit}
          onClose={async () => await formHook.onClose(isReadOnly)}
          submitting={formHook.submitting}
        />
      </Space>
    </Card>
  )
}
