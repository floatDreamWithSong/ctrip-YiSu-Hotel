import { LockOutlined, UserOutlined } from '@ant-design/icons'
import { Link } from '@tanstack/react-router'
import type { ApiUserTypes } from '@yisu/shared'
import { Button, Flex, Form } from 'antd'
import Input from 'antd/es/input/Input'

type FieldType = Partial<ApiUserTypes['UserLogin']>

const Login = () => {
  const onFinish = (values: unknown) => {
    console.log(values)
  }
  const onFinishFailed = (errorInfo: unknown) => {
    console.log(errorInfo)
  }
  return (
    <Flex vertical gap="small" style={{ width: '100%' }}>
      <Form
        name="login"
        style={{ maxWidth: 600 }}
        initialValues={{ remember: true }}
        colon={false}
        onFinish={onFinish}
        onFinishFailed={onFinishFailed}
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
      </Form>
      <Button type="primary" block htmlType="submit">
        登录
      </Button>
      <Flex justify="space-around">
        <Link to="/register">前往注册</Link>
        <Link to="/register">忘记密码</Link>
      </Flex>
    </Flex>
  )
}

export default Login
