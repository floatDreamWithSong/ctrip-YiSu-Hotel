import { LockOutlined, UserOutlined } from '@ant-design/icons'
import { Link } from '@tanstack/react-router'
import type { ApiUserTypes } from '@yisu/shared'
import { Button, Flex, Form } from 'antd'
import Input from 'antd/es/input/Input'
import { AuthRequest } from '@yisu/front-utils/apis/auth'

type FieldType = Partial<ApiUserTypes['UserLogin']>

const Login = () => {
  const [form] = Form.useForm<FieldType>()
  return (
    <Flex vertical gap="small" style={{ width: '100%' }}>
      <Form
        form={form}
        name="login"
        style={{ maxWidth: 600 }}
        initialValues={{ remember: true }}
        colon={false}
        onFinish={(data) => {
          if (!data.username || !data.password) {
            return
          }
          AuthRequest.login({
            username: data.username,
            password: data.password,
          })
        }}
      >
        <Form.Item<FieldType>
          name="username"
          rules={[{ required: true, message: '请输入用户名' }]}
        >
          <Input
            placeholder="请输入用户名"
            type="text"
            prefix={<UserOutlined />}
          />
        </Form.Item>
        <Form.Item<FieldType>
          name="password"
          rules={[{ required: true, message: '请输入密码' }]}
        >
          <Input
            placeholder="请输入密码"
            type="password"
            prefix={<LockOutlined />}
          />
        </Form.Item>
        <Button type="primary" block htmlType="submit">
          登录
        </Button>
      </Form>
      <Flex justify="space-around">
        <Link to="/register">前往注册</Link>
        <Link to="/register">忘记密码</Link>
      </Flex>
    </Flex>
  )
}

export default Login
