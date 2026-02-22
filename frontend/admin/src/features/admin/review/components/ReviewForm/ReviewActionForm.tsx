import { HotelReviewStatus, RejectReasonType } from '@yisu/shared'
import type { ApiHotelTypes } from '@yisu/shared'
import { Form, Input, Select } from 'antd'
import type { FormInstance } from 'antd'

interface ReviewActionFormProps {
  form: FormInstance<ApiHotelTypes['AdminReviewAction']>
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

/**
 * 审核操作表单组件
 * 用于选择审核结果（通过/拒绝）和填写拒绝原因
 */
export function ReviewActionForm({ form }: ReviewActionFormProps) {
  return (
    <Form form={form} layout="vertical">
      <Form.Item
        name="action"
        label="审核结果"
        rules={[{ required: true, message: '请选择审核结果' }]}
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
          const action = form.getFieldValue('action') as string | undefined
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
                  const reason = form.getFieldValue('rejectReason') as
                    | string
                    | undefined
                  const isOther = reason === RejectReasonType.OTHER
                  if (!isOther) {
                    return null
                  }
                  return (
                    <Form.Item
                      name="rejectDetail"
                      label="审核备注"
                      rules={[{ required: true, message: '请填写详细说明' }]}
                    >
                      <Input.TextArea
                        rows={3}
                        maxLength={1000}
                        placeholder="请详细说明拒绝原因"
                      />
                    </Form.Item>
                  )
                }}
              </Form.Item>
            </>
          )
        }}
      </Form.Item>
    </Form>
  )
}
