import { Link } from '@tanstack/react-router'
import { Card, Col, Row, Typography } from 'antd'

const Dashboard = () => {
  return (
    <div className="flex flex-col gap-4">
      <Typography.Title level={3} className="m-0!">
        商户控制台
      </Typography.Title>
      <Typography.Paragraph type="secondary" className="m-0!">
        从这里快速进入酒店管理流程，创建酒店并提交信息审核。
      </Typography.Paragraph>
      <Row gutter={[16, 16]}>
        <Col xs={24} md={12}>
          <Card title="酒店管理" className="shadow-sm">
            <Typography.Paragraph className="mb-4!">
              管理酒店主档、酒店信息版本、发布与下线流程。
            </Typography.Paragraph>
            <Link to="/merchant/hotels" className="text-blue-600">
              进入酒店管理
            </Link>
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default Dashboard
