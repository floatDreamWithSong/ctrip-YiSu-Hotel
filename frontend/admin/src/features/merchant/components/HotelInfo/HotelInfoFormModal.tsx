import type { ApiHotelTypes } from '@yisu/shared'
import { Button, Divider, Form, Modal } from 'antd'
import type { FormInstance } from 'antd'
import { CarouselList, RoomTypeList, StaticSection } from './components'
import { HotelInfoViewCard } from './HotelInfoViewCard'

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
      {readOnly ? (
        // 查看模式：使用与管理端审核页一致的 Descriptions + Image + Table 布局
        // 注意：必须使用 getFieldsValue(true) 而非 getFieldsValue()
        // readOnly 模式下不渲染 <Form>，没有 Form.Item 注册字段
        // getFieldsValue() 只返回已注册字段的值，会得到空对象
        // getFieldsValue(true) 返回 store 中所有值（含未注册字段）
        <HotelInfoViewCard values={form.getFieldsValue(true)} />
      ) : (
        // 编辑 / 新建模式：完整表单
        <Form form={form} layout="vertical">
          <StaticSection
            readOnly={false}
            form={form}
            locating={locating}
            handleLocate={handleLocate}
          />

          {/* 轮播图 */}
          <Divider>轮播图</Divider>
          <CarouselList readOnly={false} />

          {/* 房型 */}
          <Divider>房型</Divider>
          <RoomTypeList readOnly={false} />
        </Form>
      )}
    </Modal>
  )
}
