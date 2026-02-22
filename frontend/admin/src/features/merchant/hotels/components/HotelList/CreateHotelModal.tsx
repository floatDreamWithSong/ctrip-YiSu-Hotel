import { MerchantHotelRequest } from '@/apis/hotel'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Form, Input, Modal, message } from 'antd'

interface CreateHotelModalProps {
  open: boolean
  onClose: () => void
  onSuccess?: () => void
}

interface CreateHotelFormValues {
  hotelNickname: string
}

const HOTELS_QUERY_KEY = 'merchant-hotels'

/**
 * 创建酒店模态框组件
 */
export function CreateHotelModal({
  open,
  onClose,
  onSuccess,
}: CreateHotelModalProps) {
  const queryClient = useQueryClient()
  const [form] = Form.useForm<CreateHotelFormValues>()

  const createHotelMutation = useMutation({
    mutationFn: MerchantHotelRequest.createHotel,
    onSuccess: () => {
      message.success('酒店创建成功')
      form.resetFields()
      onClose()
      void queryClient.invalidateQueries({ queryKey: [HOTELS_QUERY_KEY] })
      onSuccess?.()
    },
    onError: (error: Error) => message.error(error.message),
  })

  const handleOk = async () => {
    const values = await form.validateFields()
    createHotelMutation.mutate(values)
  }

  const handleCancel = () => {
    form.resetFields()
    onClose()
  }

  return (
    <Modal
      title="创建酒店"
      open={open}
      onCancel={handleCancel}
      onOk={handleOk}
      confirmLoading={createHotelMutation.isPending}
    >
      <Form form={form} layout="vertical">
        <Form.Item
          label="酒店昵称"
          name="hotelNickname"
          rules={[{ required: true, message: '请输入酒店昵称' }]}
        >
          <Input maxLength={64} placeholder="例如：上海虹桥门店" />
        </Form.Item>
      </Form>
    </Modal>
  )
}
