import { AddressAutoComplete } from '@/components/address-input'
import { CosImageUpload } from '@/components/cos-image-upload'
import { TagInput } from '@/components/tag-input'
import { PriceMode } from '@yisu/shared'
import type { ApiHotelTypes } from '@yisu/shared'
import {
  Button,
  Card,
  Col,
  DatePicker,
  Divider,
  Form,
  Input,
  InputNumber,
  Modal,
  Row,
  Select,
  Space,
  TimePicker,
  Typography,
} from 'antd'
import type { FormInstance } from 'antd'
import dayjs from 'dayjs'
import { LocateFixed } from 'lucide-react'

type HotelInfoFormValues = ApiHotelTypes['HotelInfoCreate']

const HOTEL_TAG_PRESETS = [
  '免费WiFi',
  '停车场',
  '游泳池',
  '健身房',
  '餐厅',
  '会议室',
  '接送服务',
  '行李寄存',
  '24小时前台',
  '无烟房',
  '空调',
  '洗衣服务',
  '商务中心',
  '儿童设施',
  '宠物友好',
]

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
        {/* 基本信息 */}
        <Row gutter={12}>
          <Col span={8}>
            <Form.Item
              name="infoNickname"
              label="信息昵称"
              rules={[{ required: true }]}
            >
              <Input placeholder="仅商家可见" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              name="name"
              label="酒店名称"
              rules={[{ required: true }]}
            >
              <Input />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="enName" label="酒店英文名称">
              <Input />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item
              name="starLevel"
              label="酒店星级"
              rules={[{ required: true }]}
            >
              <InputNumber min={1} max={5} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item name="phone" label="酒店电话">
              <Input />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="openedAt"
              label="开业时间"
              getValueProps={(val) => ({ value: val ? dayjs(val) : undefined })}
              getValueFromEvent={(date: dayjs.Dayjs | null) =>
                date ? date.toISOString() : undefined
              }
            >
              <DatePicker
                style={{ width: '100%' }}
                placeholder="请选择开业时间"
              />
            </Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item name="description" label="酒店简介">
              <Input.TextArea rows={3} />
            </Form.Item>
          </Col>
        </Row>

        {/* 地址信息 */}
        <Divider>
          <Space>
            地址信息
            {/* 只读模式隐藏自动定位按钮 */}
            {!readOnly && (
              <Button
                size="small"
                type="link"
                icon={<LocateFixed size={14} />}
                onClick={() => void handleLocate()}
                loading={locating}
              >
                自动定位
              </Button>
            )}
          </Space>
        </Divider>
        <Row gutter={12}>
          <Col span={6}>
            <Form.Item name="province" label="省">
              <Input />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item name="city" label="市">
              <Input />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item name="district" label="区">
              <Input />
            </Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item
              name="address"
              label="详细地址"
              rules={[{ required: true }]}
            >
              <AddressAutoComplete form={form} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name={['location', 'lng']} label="经度">
              <InputNumber style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name={['location', 'lat']} label="纬度">
              <InputNumber style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item name="homeAdImage" label="首页广告图">
              <CosImageUpload dir="hotel-ad" />
            </Form.Item>
          </Col>
        </Row>

        {/* 标签 */}
        <Divider>标签</Divider>
        <Form.Item name="tags">
          <TagInput presets={HOTEL_TAG_PRESETS} />
        </Form.Item>

        {/* 轮播图 */}
        <Divider>轮播图</Divider>
        <Form.List name="images">
          {(fields, { add, remove }) => (
            <Space orientation="vertical" style={{ width: '100%' }}>
              {fields.map((field) => (
                <Card key={field.key} size="small">
                  <Row gutter={12}>
                    <Col span={10}>
                      <Form.Item
                        name={[field.name, 'url']}
                        label="图片"
                        rules={[{ required: true }]}
                      >
                        <CosImageUpload dir="hotel-carousel" />
                      </Form.Item>
                    </Col>
                    <Col span={6}>
                      <Form.Item
                        name={[field.name, 'sortOrder']}
                        label="排序"
                        rules={[{ required: true }]}
                      >
                        <InputNumber min={0} style={{ width: '100%' }} />
                      </Form.Item>
                    </Col>
                    <Col span={6}>
                      <Form.Item name={[field.name, 'caption']} label="描述">
                        <Input />
                      </Form.Item>
                    </Col>
                    <Col span={2}>
                      {/* 只读模式隐藏轮播图删除按钮 */}
                      {!readOnly && (
                        <Button danger onClick={() => remove(field.name)}>
                          删除
                        </Button>
                      )}
                    </Col>
                  </Row>
                </Card>
              ))}
              {/* 只读模式隐藏新增轮播图按钮 */}
              {!readOnly && (
                <Button onClick={() => add({ url: '', sortOrder: 0 })}>
                  新增轮播图
                </Button>
              )}
            </Space>
          )}
        </Form.List>

        {/* 房型 */}
        <Divider>房型</Divider>
        <Form.List name="roomTypes">
          {(fields, { add, remove }) => (
            <Space orientation="vertical" style={{ width: '100%' }}>
              {fields.map((field) => (
                <Card key={field.key} size="small">
                  {/* 第一行：房型名 | 数量 | 价格 | 计价方式 | 购买时长（钟点房专属） */}
                  <Row gutter={12} align="bottom">
                    <Col span={6}>
                      <Form.Item
                        name={[field.name, 'name']}
                        label="房型名"
                        rules={[{ required: true }]}
                      >
                        <Input />
                      </Form.Item>
                    </Col>
                    <Col span={4}>
                      <Form.Item
                        name={[field.name, 'count']}
                        label="数量"
                        rules={[{ required: true }]}
                      >
                        <InputNumber min={0} style={{ width: '100%' }} />
                      </Form.Item>
                    </Col>
                    <Col span={4}>
                      <Form.Item
                        name={[field.name, 'price']}
                        label="价格"
                        rules={[{ required: true }]}
                      >
                        <InputNumber min={0} style={{ width: '100%' }} />
                      </Form.Item>
                    </Col>
                    <Col span={4}>
                      <Form.Item
                        name={[field.name, 'priceMode']}
                        label="计价方式"
                        initialValue={PriceMode.PER_NIGHT}
                        rules={[{ required: true }]}
                      >
                        <Select
                          options={[
                            { label: '标准住宿', value: PriceMode.PER_NIGHT },
                            { label: '钟点房', value: PriceMode.PER_HOUR },
                          ]}
                        />
                      </Form.Item>
                    </Col>
                    {/* 购买时长：钟点房和标准住宿 */}
                    <Form.Item
                      noStyle
                      shouldUpdate={(prev, cur) =>
                        prev.roomTypes?.[field.name]?.priceMode !==
                        cur.roomTypes?.[field.name]?.priceMode
                      }
                    >
                      {({ getFieldValue }) => {
                        const priceMode = getFieldValue([
                          'roomTypes',
                          field.name,
                          'priceMode',
                        ])
                        if (priceMode === PriceMode.PER_NIGHT) {
                          return (
                            <Col span={6}>
                              <Form.Item
                                name={[field.name, 'duration']}
                                label="购买时长：夜晚"
                                rules={[
                                  { required: true, message: '请输入购买时长' },
                                  {
                                    type: 'integer',
                                    min: 1,
                                    message: '请输入正整数',
                                  },
                                ]}
                              >
                                <InputNumber
                                  min={1}
                                  max={30}
                                  precision={0}
                                  style={{ width: '100%' }}
                                  placeholder="如：1"
                                />
                              </Form.Item>
                            </Col>
                          )
                        }
                        if (priceMode === PriceMode.PER_HOUR) {
                          return (
                            <Col span={6}>
                              <Form.Item
                                name={[field.name, 'duration']}
                                label="购买时长：小时"
                                rules={[
                                  { required: true, message: '请输入购买时长' },
                                  {
                                    type: 'integer',
                                    min: 1,
                                    message: '请输入正整数',
                                  },
                                ]}
                              >
                                <InputNumber
                                  min={1}
                                  max={24}
                                  precision={0}
                                  style={{ width: '100%' }}
                                  placeholder="如：4"
                                />
                              </Form.Item>
                            </Col>
                          )
                        }
                        return null
                      }}
                    </Form.Item>
                  </Row>

                  {/* 第二行：入住人数 | 删除按钮 | 床型说明 | 房间面积 | 参考图 */}
                  <Row gutter={12}>
                    <Col span={4}>
                      <Form.Item
                        name={[field.name, 'maxGuests']}
                        label="入住人数"
                        rules={[{ required: true }]}
                      >
                        <InputNumber min={1} style={{ width: '100%' }} />
                      </Form.Item>
                    </Col>
                    <Col span={2}>
                      <Form.Item label=" ">
                        {/* 只读模式隐藏房型删除按钮 */}
                        {!readOnly && (
                          <Button danger onClick={() => remove(field.name)}>
                            删除
                          </Button>
                        )}
                      </Form.Item>
                    </Col>
                    <Col span={6}>
                      <Form.Item
                        name={[field.name, 'bedType']}
                        label="床型说明"
                      >
                        <Input />
                      </Form.Item>
                    </Col>
                    <Col span={6}>
                      <Form.Item name={[field.name, 'area']} label="房间面积">
                        <InputNumber min={0} style={{ width: '100%' }} />
                      </Form.Item>
                    </Col>
                    <Col span={6}>
                      <Form.Item name={[field.name, 'imageUrl']} label="参考图">
                        <CosImageUpload dir="hotel-room" />
                      </Form.Item>
                    </Col>
                  </Row>

                  {/* 第三行：排序 */}
                  <Row gutter={12}>
                    <Col span={6}>
                      <Form.Item
                        name={[field.name, 'sortOrder']}
                        label="排序"
                        rules={[{ required: true }]}
                      >
                        <InputNumber min={0} style={{ width: '100%' }} />
                      </Form.Item>
                    </Col>
                  </Row>

                  {/* 钟点时段：仅钟点房显示 */}
                  <Form.Item
                    noStyle
                    shouldUpdate={(prev, cur) =>
                      prev.roomTypes?.[field.name]?.priceMode !==
                        cur.roomTypes?.[field.name]?.priceMode ||
                      prev.roomTypes?.[field.name]?.duration !==
                        cur.roomTypes?.[field.name]?.duration
                    }
                  >
                    {({ getFieldValue }) => {
                      const priceMode = getFieldValue([
                        'roomTypes',
                        field.name,
                        'priceMode',
                      ])
                      const duration: number =
                        getFieldValue(['roomTypes', field.name, 'duration']) ??
                        0
                      if (priceMode !== PriceMode.PER_HOUR) return null
                      return (
                        <>
                          <Divider style={{ margin: '12px 0' }}>
                            钟点时段
                          </Divider>
                          <Form.List name={[field.name, 'hourlySlots']}>
                            {(
                              slotFields,
                              { add: addSlot, remove: removeSlot },
                            ) => (
                              <Space
                                orientation="vertical"
                                style={{ width: '100%' }}
                              >
                                {slotFields.map((slotField) => (
                                  <Row
                                    key={slotField.key}
                                    gutter={12}
                                    align="middle"
                                  >
                                    <Col span={6}>
                                      <Form.Item
                                        name={[slotField.name, 'startTime']}
                                        label="开始时间"
                                        style={{ marginBottom: 0 }}
                                        getValueProps={(val) => ({
                                          value: val
                                            ? dayjs(val, 'HH:mm')
                                            : undefined,
                                        })}
                                        getValueFromEvent={(
                                          time: dayjs.Dayjs | null,
                                        ) =>
                                          time
                                            ? time.format('HH:mm')
                                            : undefined
                                        }
                                        rules={[
                                          {
                                            required: true,
                                            message: '请选择开始时间',
                                          },
                                          {
                                            validator: (_, value: string) => {
                                              if (!value || !duration)
                                                return Promise.resolve()
                                              const [h, m] = value
                                                .split(':')
                                                .map(Number)
                                              const endMinutes =
                                                h * 60 + m + duration * 60
                                              if (endMinutes > 24 * 60) {
                                                return Promise.reject(
                                                  new Error(
                                                    '时段结束时间不能超过24:00',
                                                  ),
                                                )
                                              }
                                              return Promise.resolve()
                                            },
                                          },
                                        ]}
                                      >
                                        <TimePicker
                                          format="HH:mm"
                                          minuteStep={30}
                                          style={{ width: '100%' }}
                                        />
                                      </Form.Item>
                                    </Col>
                                    <Col span={14}>
                                      <Typography.Text type="secondary">
                                        结束时间将按 房型时长单位(duration)
                                        自动推导
                                      </Typography.Text>
                                    </Col>
                                    <Col
                                      span={4}
                                      style={{ textAlign: 'right' }}
                                    >
                                      {/* 只读模式隐藏时段删除按钮 */}
                                      {!readOnly && (
                                        <Button
                                          danger
                                          size="small"
                                          disabled={slotFields.length <= 1}
                                          onClick={() =>
                                            removeSlot(slotField.name)
                                          }
                                        >
                                          删
                                        </Button>
                                      )}
                                    </Col>
                                  </Row>
                                ))}
                                {/* 只读模式隐藏新增时段按钮 */}
                                {!readOnly && (
                                  <Button
                                    size="small"
                                    style={{ marginTop: 8 }}
                                    onClick={() => addSlot({ startTime: '' })}
                                  >
                                    新增时段
                                  </Button>
                                )}
                              </Space>
                            )}
                          </Form.List>
                        </>
                      )
                    }}
                  </Form.Item>
                </Card>
              ))}
              {/* 只读模式隐藏新增房型按钮 */}
              {!readOnly && (
                <Button
                  onClick={() =>
                    add({
                      name: '',
                      count: 0,
                      price: 0,
                      priceMode: PriceMode.PER_NIGHT,
                      maxGuests: 1,
                      sortOrder: 0,
                    })
                  }
                >
                  新增房型
                </Button>
              )}
            </Space>
          )}
        </Form.List>
      </Form>
    </Modal>
  )
}
