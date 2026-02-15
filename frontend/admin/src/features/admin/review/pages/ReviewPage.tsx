import { Space } from 'antd'
import { ReviewInfoSection } from '../components/ReviewList/ReviewInfoSection'
import { ReviewRecordSection } from '../components/ReviewRecord/ReviewRecordSection'

/**
 * 管理员端 - 审核页面
 * 重构后的版本：页面组件只负责布局
 */
export default function ReviewPage() {
  return (
    <Space orientation="vertical" size={16} style={{ width: '100%' }}>
      <ReviewInfoSection />
      <ReviewRecordSection />
    </Space>
  )
}
