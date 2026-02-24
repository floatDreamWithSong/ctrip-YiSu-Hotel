import type { ApiHotelTypes } from '@yisu/shared'
import { Button, Divider, Form, Modal } from 'antd'
import type { FormInstance } from 'antd'
import { CarouselList, RoomTypeList, StaticSection } from './components'

type HotelInfoFormValues = ApiHotelTypes['HotelInfoCreate']

interface HotelInfoFormModalProps {
  open: boolean
  editingInfoId: number | null
  /** 只读模式：已发布/审核中状态时为 true，隐藏保存按钮，仅供查看 */
  readOnly?: boolean
  form: FormInstance<HotelInfoFormValues>
  locating: boolean
  handleLocate: () => Promise<void>
  onSubmit: () => Promise<void>
  /** 关闭弹窗，支持脏表单检查（传入 readOnly 参数） */
  onClose: (readOnly: boolean) => Promise<void>
  submitting: boolean
}

/**
 * 酒店信息表单模态框
 * 支持「新建」和「编辑」两种模式，通过 editingInfoId 是否存在区分
 */
export function HotelInfoFormModal({
  open,
  editingInfoId,
  readOnly = false,
  form,
  locating,
  handleLocate,
  onSubmit,
  onClose,
  submitting,
}: HotelInfoFormModalProps) {
  return (
    <Modal
      width={1000}
      title={
        editingInfoId
          ? readOnly
            ? `查看酒店信息 #${editingInfoId}`
            : `编辑酒店信息 #${editingInfoId}`
          : '新建酒店信息'
      }
      open={open}
      onCancel={() => void onClose(readOnly)}
      // 只读模式隐藏保存按钮，仅显示关闭按钮
      footer={
        readOnly
          ? [
              <Button key="close" onClick={() => void onClose(readOnly)}>
                关闭
              </Button>,
            ]
          : undefined
      }
      onOk={() => void onSubmit()}
      confirmLoading={submitting}
      destroyOnHidden
    >
      {readOnly && (
        <style>{`
          .ant-input-disabled,
          .ant-input-number-disabled,
          .ant-input-number-disabled input,
          .ant-select-disabled .ant-select-selector,
          .ant-picker-disabled,
          .ant-picker-disabled input,
          .ant-input-affix-wrapper-disabled,
          .ant-input-affix-wrapper-disabled input,
          .ant-input-textarea-disabled,
          .ant-input-textarea-disabled textarea,
          .ant-form-item-disabled .ant-form-item-label > label,
          .ant-form-item-disabled .ant-form-item-control-input input,
          .ant-form-item-disabled .ant-form-item-control-input textarea,
          .ant-form-item-disabled .ant-form-item-control-input .ant-input-number-input {
            color: rgba(0, 0, 0, 0.88) !important;
          }
        `}</style>
      )}
      {/* readOnly 时：disabled 禁用所有交互，variant borderless 去掉输入框边框呈现纯文本效果 */}
      <Form
        form={form}
        layout="vertical"
        disabled={readOnly}
        variant={readOnly ? 'borderless' : undefined}
        style={
          readOnly
            ? ({
                '--ant-color-text': 'rgba(0, 0, 0, 0.88)',
                '--ant-color-text-disabled': 'rgba(0, 0, 0, 0.88) !important',
              } as React.CSSProperties)
            : undefined
        }
      >
        <StaticSection
          readOnly={readOnly}
          form={form}
          locating={locating}
          handleLocate={handleLocate}
        />

        {/* 轮播图 */}
        <Divider>轮播图</Divider>
        <CarouselList readOnly={readOnly} />

        {/* 房型 */}
        <Divider>房型</Divider>
        <RoomTypeList readOnly={readOnly} />
      </Form>
    </Modal>
  )
}
