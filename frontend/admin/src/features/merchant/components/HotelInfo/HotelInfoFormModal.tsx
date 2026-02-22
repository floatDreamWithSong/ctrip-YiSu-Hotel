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
  form: FormInstance<HotelInfoFormValues>
  locating: boolean
  handleLocate: () => Promise<void>
  onSubmit: () => Promise<void>
  onClose: () => void
  submitting: boolean
}

/**
 * 酒店信息表单模态框
 * 支持「新建」和「编辑」两种模式，通过 editingInfoId 是否存在区分
 */
export function HotelInfoFormModal({
  open,
  editingInfoId,
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
      title={editingInfoId ? `编辑酒店信息 #${editingInfoId}` : '新建酒店信息'}
      open={open}
      onCancel={onClose}
      onOk={() => void onSubmit()}
      confirmLoading={submitting}
      destroyOnClose
    >
      <Form form={form} layout="vertical">
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
            <Button
              size="small"
              type="link"
              icon={<LocateFixed size={14} />}
              onClick={() => void handleLocate()}
              loading={locating}
            >
              自动定位
            </Button>
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
            <Space direction="vertical" style={{ width: '100%' }}>
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
                      <Button danger onClick={() => remove(field.name)}>
                        删除
                      </Button>
                    </Col>
                  </Row>
                </Card>
              ))}
              <Button onClick={() => add({ url: '', sortOrder: 0 })}>
                新增轮播图
              </Button>
            </Space>
          )}
        </Form.List>

        {/* 房型 */}
        <Divider>房型</Divider>
        <Form.List name="roomTypes">
          {(fields, { add, remove }) => (
            <Space direction="vertical" style={{ width: '100%' }}>
              {fields.map((field) => (
                <Card key={field.key} size="small">
                  <Row gutter={12}>
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
                            { label: '按晚', value: PriceMode.PER_NIGHT },
                            { label: '按小时', value: PriceMode.PER_HOUR },
                          ]}
                        />
                      </Form.Item>
                    </Col>
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
                      <Button danger onClick={() => remove(field.name)}>
                        删除
                      </Button>
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
                </Card>
              ))}
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
            </Space>
          )}
        </Form.List>
      </Form>
    </Modal>
  )
}
