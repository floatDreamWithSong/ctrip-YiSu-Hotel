import {
  EyeInvisibleOutlined,
  EyeTwoTone,
  LockOutlined,
  MailOutlined,
  SendOutlined,
  UserOutlined,
} from '@ant-design/icons'
import { Link } from '@tanstack/react-router'
import type { ApiUserTypes } from '@yisu/shared'
import { Button, Flex, Form } from 'antd'
import Input from 'antd/es/input/Input'
import Password from 'antd/es/input/Password'

type FieldType = Partial<ApiUserTypes['UserRegister']>

const Register = () => {
  const passwordIconRender = (visible: boolean) => {
    return visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />
  }
  const onFinish = (values: unknown) => {
    console.log(values)
  }
  const onFinishFailed = (errorInfo: unknown) => {
    console.log(errorInfo)
  }
  return (
    <Flex vertical gap="small" style={{ width: '100%' }}>
      <Form
        name="register"
        style={{ maxWidth: 600 }}
        initialValues={{ remember: true }}
        colon={false}
        onFinish={onFinish}
        onFinishFailed={onFinishFailed}
      >
        <Form.Item<FieldType>
          name="email"
          rules={[{ required: true, message: '请输入邮箱' }]}
        >
          <Input
            placeholder="请输入邮箱"
            type="email"
            prefix={<MailOutlined />}
          />
        </Form.Item>
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
          <Password
            placeholder="请输入密码"
            type="password"
            prefix={<LockOutlined />}
            iconRender={passwordIconRender}
          />
        </Form.Item>
        <Form.Item<FieldType>
          name="password"
          rules={[{ required: true, message: '请确认密码' }]}
        >
          <Password
            placeholder="请确认密码"
            type="password"
            prefix={<LockOutlined />}
            iconRender={passwordIconRender}
          />
        </Form.Item>
        <Form.Item<FieldType>
          name="verifyCode"
          rules={[{ required: true, message: '请输入验证码' }]}
        >
          <Flex gap="small">
            <Input placeholder="请输入验证码" type="text" maxLength={6} />
            <Button
              type="default"
              className="w-fit!"
              block
              icon={<SendOutlined />}
            >
              发送验证码
            </Button>
          </Flex>
        </Form.Item>
        <Form.Item>
          <Button type="primary" block htmlType="submit">
            注册
          </Button>
        </Form.Item>
      </Form>
      <Flex justify="space-around">
        <Link to="/login">前往登录</Link>
      </Flex>
    </Flex>
  )
}

export default Register
