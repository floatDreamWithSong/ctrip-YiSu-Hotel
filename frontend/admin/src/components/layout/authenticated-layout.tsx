import { useState } from 'react'
import {
  Outlet,
  Link,
  useNavigate,
  useRouterState,
} from '@tanstack/react-router'
import {
  PieChartOutlined,
  AuditOutlined,
  UserOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
} from '@ant-design/icons'
import type { MenuProps } from 'antd'
import {
  Breadcrumb,
  Layout,
  Menu,
  theme,
  Dropdown,
  Avatar,
  Space,
  Button,
} from 'antd'
import { tokenStore } from '@/lib/request'

const { Header, Content, Footer, Sider } = Layout

type MenuItem = Required<MenuProps>['items'][number]

// Helper function to create menu items
function getItem(
  label: React.ReactNode,
  key: React.Key,
  icon?: React.ReactNode,
  children?: MenuItem[],
): MenuItem {
  return {
    key,
    icon,
    children,
    label,
  } as MenuItem
}

// Define menu items, including the new Hotel Review section
const items: MenuItem[] = [
  getItem(<Link to="/">总览</Link>, '/', <PieChartOutlined />),
  getItem(
    <Link to="/admin/hotels">酒店审核</Link>,
    '/admin/hotels',
    <AuditOutlined />,
  ),
]

export const AuthenticatedLayout = () => {
  const [collapsed, setCollapsed] = useState(false)
  const {
    token: { colorBgContainer, borderRadiusLG, colorPrimary },
  } = theme.useToken()
  const navigate = useNavigate()
  const routerState = useRouterState()

  const handleLogout = () => {
    tokenStore.remove()
    navigate({ to: '/login' })
  }

  const userMenu: MenuProps['items'] = [
    {
      key: 'profile',
      label: '个人中心',
      icon: <UserOutlined />,
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      label: '退出登录',
      icon: <LogoutOutlined />,
      danger: true,
      onClick: handleLogout,
    },
  ]

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        theme="light"
        collapsible
        collapsed={collapsed}
        onCollapse={(value) => setCollapsed(value)}
        trigger={null}
        width={240}
        style={{
          overflow: 'auto',
          height: '100vh',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
          zIndex: 10,
          boxShadow: '1px 0 0 0 rgba(0, 0, 0, 0.05)',
        }}
      >
        <div className="flex h-16 items-center justify-center border-b border-gray-100">
          <div className="flex items-center gap-2 font-bold text-gray-800 text-xl overflow-hidden px-4 transition-all duration-300">
            <div
              className="text-white rounded-md p-1 min-w-[32px] min-h-[32px] flex items-center justify-center shadow-sm"
              style={{ backgroundColor: colorPrimary }}
            >
              Y
            </div>
            {!collapsed && (
              <span className="whitespace-nowrap tracking-tight">
                YiSu Admin
              </span>
            )}
          </div>
        </div>
        <Menu
          theme="light"
          selectedKeys={[routerState.location.pathname]}
          mode="inline"
          items={items}
          className="border-none pt-2"
        />
      </Sider>
      <Layout
        style={{
          marginLeft: collapsed ? 80 : 240,
          transition: 'all 0.2s',
          minHeight: '100vh',
        }}
      >
        <Header
          style={{
            padding: '0 24px',
            background: colorBgContainer,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            position: 'sticky',
            top: 0,
            zIndex: 9,
            boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.03)',
          }}
        >
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            style={{
              fontSize: '16px',
              width: 64,
              height: 64,
              marginLeft: -24,
            }}
          />
          <Space>
            <Dropdown menu={{ items: userMenu }}>
              <Space className="cursor-pointer hover:bg-gray-50 px-3 py-2 rounded-lg transition-colors">
                <Avatar
                  style={{ backgroundColor: colorPrimary }}
                  icon={<UserOutlined />}
                />
                <span className="font-medium text-gray-700">管理员</span>
              </Space>
            </Dropdown>
          </Space>
        </Header>
        <Content style={{ margin: '24px 24px 0', overflow: 'initial' }}>
          <div
            style={{
              padding: 24,
              minHeight: 360,
              background: colorBgContainer,
              borderRadius: borderRadiusLG,
            }}
          >
            <Outlet />
          </div>
        </Content>
        <Footer style={{ textAlign: 'center', color: '#888' }}>
          YiSu Hotel Admin ©{new Date().getFullYear()} created by
          FloatDreamWithSong
        </Footer>
      </Layout>
    </Layout>
  )
}
