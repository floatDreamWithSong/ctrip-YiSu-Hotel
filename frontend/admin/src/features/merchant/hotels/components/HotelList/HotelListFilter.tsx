import { Button, Input, Space } from 'antd'

interface HotelListFilterProps {
  keyword?: string
  onSearch: (value: string) => void
  onOpenCreate: () => void
}

/**
 * 酒店列表筛选栏组件
 * 包含搜索框和创建按钮
 */
export function HotelListFilter({
  keyword,
  onSearch,
  onOpenCreate,
}: HotelListFilterProps) {
  return (
    <Space wrap>
      <Input.Search
        allowClear
        placeholder="按酒店昵称搜索"
        defaultValue={keyword}
        style={{ width: 320 }}
        onSearch={onSearch}
      />
      <Button type="primary" onClick={onOpenCreate}>
        创建酒店
      </Button>
    </Space>
  )
}
