import { CosImageUpload } from '@/components/cos-image-upload'
import { Button, Card, Col, Form, Input, InputNumber, Row, Space } from 'antd'

interface CarouselListProps {
  readOnly: boolean
}

/**
 * 轮播图列表区：封装 images Form.List
 */
export function CarouselList({ readOnly }: CarouselListProps) {
  return (
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
                    htmlFor={undefined}
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
                  <Form.Item
                    name={[field.name, 'caption']}
                    label="描述"
                    rules={[{ required: true, message: '请输入描述' }]}
                    validateTrigger="onSubmit"
                  >
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
  )
}
