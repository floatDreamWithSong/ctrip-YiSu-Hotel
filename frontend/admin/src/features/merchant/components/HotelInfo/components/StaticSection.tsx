import { AddressAutoComplete } from '@/components/address-input'
import { CosImageUpload } from '@/components/cos-image-upload'
import { TagInput } from '@/components/tag-input'
import type { ApiHotelTypes } from '@yisu/shared'
import {
  Button,
  Col,
  DatePicker,
  Divider,
  Form,
  Input,
  InputNumber,
  Row,
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

interface StaticSectionProps {
  readOnly: boolean
  form: FormInstance<HotelInfoFormValues>
  locating: boolean
  handleLocate: () => Promise<void>
}

/**
 * 静态信息区：基础信息、地址信息、标签
 * 使用 Form.Item 自动获取上下文，无需手动传 form（除 AddressAutoComplete 外）
 */
export function StaticSection({
  readOnly,
  form,
  locating,
  handleLocate,
}: StaticSectionProps) {
  return (
    <>
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
          <Form.Item name="name" label="酒店名称" rules={[{ required: true }]}>
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
        {/* <Col span={12}>
          <Form.Item name={['location', 'lng']} label="经度" noStyle>
            <InputNumber style={{ width: '100%' }} type='hidden' />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item name={['location', 'lat']} label="纬度" noStyle>
            <InputNumber style={{ width: '100%' }} type='hidden' />
          </Form.Item>
        </Col> */}
        <Col span={24}>
          <Form.Item name="homeAdImage" label="首页广告图" htmlFor={undefined}>
            <CosImageUpload dir="hotel-ad" />
          </Form.Item>
        </Col>
      </Row>

      {/* 标签 */}
      <Divider>标签</Divider>
      <Form.Item name="tags">
        <TagInput presets={HOTEL_TAG_PRESETS} />
      </Form.Item>
    </>
  )
}
