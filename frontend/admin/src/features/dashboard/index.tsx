import { AdminReviewRequest } from '@/apis/hotel'
import { getCurrentUserPayload } from '@/lib/auth'
import { HotelReviewStatus } from '@yisu/shared'
import { Link } from '@tanstack/react-router'
import { Card, Col, Row, Statistic, Typography } from 'antd'
import { useEffect, useState } from 'react'
import { FileScan, CheckCircle, XCircle } from 'lucide-react'

const Dashboard = () => {
  const [stats, setStats] = useState({
    pending: 0,
    approved: 0,
    rejected: 0,
  })
  const currentUser = getCurrentUserPayload()
  const isAdmin = currentUser?.userType === 'ADMIN'

  useEffect(() => {
    if (!isAdmin) return

    const fetchStats = async () => {
      try {
        const [pendingRes, approvedRes, rejectedRes] = await Promise.all([
          AdminReviewRequest.getReviewHotelInfos({
            reviewStatus: HotelReviewStatus.PENDING,
            page: 1,
            limit: 1,
          }),
          AdminReviewRequest.getReviewHotelInfos({
            reviewStatus: HotelReviewStatus.APPROVED,
            page: 1,
            limit: 1,
          }),
          AdminReviewRequest.getReviewHotelInfos({
            reviewStatus: HotelReviewStatus.REJECTED,
            page: 1,
            limit: 1,
          }),
        ])
        setStats({
          pending: pendingRes.total,
          approved: approvedRes.total,
          rejected: rejectedRes.total,
        })
      } catch (error) {
        console.error('Failed to fetch dashboard stats:', error)
      }
    }
    void fetchStats()
  }, [isAdmin])

  return (
    <div className="space-y-4">
      <Typography.Title level={3} className="m-0!">
        {isAdmin ? '管理后台总览' : '商户控制台'}
      </Typography.Title>
      <Typography.Paragraph type="secondary" className="m-0!">
        {isAdmin
          ? '在这里查看关键指标和进行快速导航。'
          : '从这里快速进入酒店管理流程，创建酒店并提交信息审核。'}
      </Typography.Paragraph>

      {isAdmin && (
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={8}>
            <Card>
              <Statistic
                title="待审核"
                value={stats.pending}
                prefix={<FileScan />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Card>
              <Statistic
                title="已通过"
                value={stats.approved}
                prefix={<CheckCircle />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Card>
              <Statistic
                title="已拒绝"
                value={stats.rejected}
                prefix={<XCircle />}
              />
            </Card>
          </Col>
        </Row>
      )}

      <Row gutter={[16, 16]}>
        {currentUser?.userType === 'MERCHANT' && (
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
        )}
        {isAdmin && (
          <Col xs={24} md={12}>
            <Card title="审核列表" className="shadow-sm">
              <Typography.Paragraph className="mb-4!">
                查看并处理所有待审核、已通过或已拒绝的酒店信息。
              </Typography.Paragraph>
              <Link to="/admin/reviews" className="text-blue-600">
                进入审核列表
              </Link>
            </Card>
          </Col>
        )}
      </Row>
    </div>
  )
}

export default Dashboard
