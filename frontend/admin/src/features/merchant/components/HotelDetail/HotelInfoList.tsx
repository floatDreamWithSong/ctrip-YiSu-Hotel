import { Button, Card, Select, Space, Typography } from 'antd'
import { HotelReviewStatus } from '@yisu/shared'
import { useHotelInfos } from '../../hooks/useHotelInfos'
import { useHotelInfoActions } from '../../hooks/useHotelInfoActions'
import { useHotelInfoForm } from '../../hooks/useHotelInfoForm'
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
          form={formHook.form}
          locating={formHook.locating}
          handleLocate={formHook.handleLocate}
          onSubmit={formHook.onSubmit}
          onClose={formHook.onClose}
          submitting={formHook.submitting}
        />
      </Space>
    </Card>
  )
}
