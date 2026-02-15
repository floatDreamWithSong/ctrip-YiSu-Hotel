import type { ApiHotelTypes } from '@yisu/shared'
import { Form, Modal, Space } from 'antd'
import { useEffect } from 'react'
import { HotelReviewStatus } from '@yisu/shared'
import { useReviewActions, useReviewInfoDetail } from '../../hooks/useReviewActions'
import { ReviewActionForm } from '../ReviewForm/ReviewActionForm'
import { HotelInfoDetailCard } from '../ReviewForm/HotelInfoDetailCard'

interface ReviewDetailModalProps {
  open: boolean
  infoId: number | null
  onClose: () => void
}

/**
 * 审核详情模态框
 * 展示酒店信息详情并提供审核操作
 */
export function ReviewDetailModal({ open, infoId, onClose }: ReviewDetailModalProps) {
  const { info, loading } = useReviewInfoDetail(infoId)
  const { submit, submitting } = useReviewActions()
  const [form] = Form.useForm<ApiHotelTypes['AdminReviewAction']>()

  // 重置表单
  useEffect(() => {
    if (open && infoId) {
      form.setFieldsValue({
        action: HotelReviewStatus.APPROVED,
        rejectReason: undefined,
        rejectDetail: undefined,
      })
    }
  }, [open, infoId, form])

  const handleSubmit = async () => {
    if (!infoId) return

    try {
      const values = await form.validateFields()
      submit(
        { infoId, data: values },
        {
          onSuccess: () => {
            onClose()
            form.resetFields()
          },
        }
      )
    } catch (error) {
      // 表单验证失败
    }
  }

  const handleCancel = () => {
    onClose()
    form.resetFields()
  }

  return (
    <Modal
      width={1000}
      title={infoId ? `酒店信息审核 #${infoId}` : '酒店信息审核'}
      open={open}
      onCancel={handleCancel}
      onOk={handleSubmit}
      confirmLoading={submitting}
    >
      <Space orientation="vertical" size={16} style={{ width: '100%' }}>
        <HotelInfoDetailCard info={info} loading={loading} />
        <ReviewActionForm form={form} />
      </Space>
    </Modal>
  )
}
