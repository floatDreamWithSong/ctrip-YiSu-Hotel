import { useModal } from '@/hooks/useModal'
import { Card, Space, Typography } from 'antd'
import { CreateHotelModal } from '../components/HotelList/CreateHotelModal'
import { HotelListFilter } from '../components/HotelList/HotelListFilter'
import { HotelListTable } from '../components/HotelList/HotelListTable'
import { useHotels } from '../hooks/useHotels'

/**
 * 商家端 - 酒店列表页面
 * 重构后的版本：页面组件只负责布局和组合特性组件
 */
export default function HotelsListPage() {
  const {
    hotels,
    loading,
    pagination,
    keyword,
    handleSearch,
    handleDelete,
    deleting,
  } = useHotels()
  const createModal = useModal()

  return (
    <Space orientation="vertical" size={16} style={{ width: '100%' }}>
      {/* 标题卡片 */}
      <Card>
        <Space orientation="vertical" size={12} style={{ width: '100%' }}>
          <Typography.Title level={3} className="m-0!">
            酒店列表
          </Typography.Title>
          <HotelListFilter
            keyword={keyword}
            onSearch={handleSearch}
            onOpenCreate={createModal.openModal}
          />
        </Space>
      </Card>

      {/* 酒店列表表格 */}
      <HotelListTable
        dataSource={hotels}
        loading={loading}
        pagination={pagination}
        onDelete={handleDelete}
        deleting={deleting}
      />

      {/* 创建酒店模态框 */}
      <CreateHotelModal
        open={createModal.open}
        onClose={createModal.closeModal}
      />
    </Space>
  )
}
