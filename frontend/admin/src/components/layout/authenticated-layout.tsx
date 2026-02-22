import { tokenStore } from '@/lib/request'
import { Link, Outlet, useLocation, useNavigate } from '@tanstack/react-router'
import { Button, Layout, Menu, Space, Typography } from 'antd'
import {
  Building2,
  ClipboardCheck,
  LayoutDashboard,
  LogOut,
} from 'lucide-react'
import { getCurrentUserPayload } from '@/lib/auth'

const { Header, Sider, Content } = Layout

export const AuthenticatedLayout = ({
  children,
  ...props
}: React.ComponentProps<'div'>) => {
  const navigate = useNavigate()
  const location = useLocation()
  const currentUser = getCurrentUserPayload()

  const menuItems = [
    {
      key: '/',
      icon: <LayoutDashboard size={16} />,
      label: <Link to="/">总览</Link>,
    },
    ...(currentUser?.userType === 'MERCHANT'
      ? [
          {
            key: '/merchant/hotels',
            icon: <Building2 size={16} />,
            label: <Link to="/merchant/hotels">酒店管理</Link>,
          },
        ]
      : []),
    ...(currentUser?.userType === 'ADMIN'
      ? [
          {
            key: '/admin/reviews',
            icon: <ClipboardCheck size={16} />,
            label: <Link to="/admin/reviews">审核管理</Link>,
          },
        ]
      : []),
  ]

  const selectedKey = location.pathname.startsWith('/merchant/hotels')
    ? '/merchant/hotels'
    : location.pathname.startsWith('/admin/reviews')
      ? '/admin/reviews'
      : '/'

  const logout = () => {
    tokenStore.remove()
    navigate({ to: '/login' })
  }

  return (
    <div {...props} className="min-h-screen bg-slate-50">
      <Layout className="min-h-screen! bg-slate-50!">
        <Sider
          width={220}
          className="border-r border-slate-200 bg-white"
          theme="light"
        >
          <div className="px-4 py-5 border-b border-slate-200">
            <Typography.Title level={4} className="m-0!">
              易宿商户台
            </Typography.Title>
            <Typography.Text type="secondary">Hotel Merchant</Typography.Text>
          </div>
          <Menu
            mode="inline"
            selectedKeys={[selectedKey]}
            className="border-r-0 py-3"
            items={menuItems}
          />
        </Sider>
        <Layout>
          <Header className="bg-white! px-6! border-b border-slate-200 h-16! leading-[64px] flex items-center justify-between">
            <Typography.Text strong>商户端酒店管理</Typography.Text>
            <Space>
              <Typography.Text type="secondary">
                {currentUser?.username ?? '未登录'}
              </Typography.Text>
              <Button icon={<LogOut size={14} />} onClick={logout}>
                退出
              </Button>
            </Space>
          </Header>
          <Content className="p-6">
            <div className="max-w-[1320px] mx-auto">
              {children ?? <Outlet />}
            </div>
          </Content>
        </Layout>
      </Layout>
    </div>
  )
}
