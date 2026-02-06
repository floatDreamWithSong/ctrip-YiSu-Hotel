import { LockOutlined, MailOutlined, SendOutlined, UserOutlined } from '@ant-design/icons'
import { useNavigate } from '@tanstack/react-router'
import type { ApiUserTypes } from '@yisu/shared'
import { verifyCodeType } from '@yisu/shared'
import { Button, Flex, Form, message } from 'antd'
import Input from 'antd/es/input/Input'
import Password from 'antd/es/input/Password'
import { useMutation } from '@tanstack/react-query'
import { AuthRequest } from '@yisu/front-utils/apis/auth'
import { tokenStore } from '@/lib/request'
import { useState } from 'react'

type FieldType = Partial<ApiUserTypes['UserRegister']> & {
  confirmPassword?: string
}

const COUNTDOWN_SECONDS = 60

const Register = () => {
  const [form] = Form.useForm<FieldType>()
  const navigate = useNavigate()
  const [countdown, setCountdown] = useState(0)

  // 注册请求
  const registerMutation = useMutation({
    mutationFn: AuthRequest.register,
    onSuccess: (data) => {
      tokenStore.set(data.accessToken)
      message.success('注册成功，正在跳转...')
      navigate({ to: '/' })
    },
    onError: (error: Error) => {
      message.error(error.message || '注册失败，请重试')
    },
  })

  // 发送验证码请求
  const sendCodeMutation = useMutation({
    mutationFn: (email: string) => {
      return AuthRequest.sendVerifyCode({
        email,
        type: verifyCodeType.REGISTER,
      })
    },
    onSuccess: () => {
      message.success('验证码已发送，请注意查收邮箱')
      setCountdown(COUNTDOWN_SECONDS)
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    },
    onError: (error: Error) => {
      message.error(error.message || '验证码发送失败，请重试')
    },
  })

  const handleSendCode = async () => {
    const email = form.getFieldValue('email')
    if (!email) {
      message.warning('请先输入邮箱地址')
      form.setFields([
        { name: 'email', errors: ['请输入邮箱地址'] }
      ])
      return
    }
    try {
      await form.validateFields(['email'])
      sendCodeMutation.mutate(email)
    } catch {
      // 验证失败，不发送
    }
  }

  const onFinish = (values: FieldType) => {
    const { confirmPassword, ...registerData } = values

    if (registerData.password !== confirmPassword) {
      message.error('两次输入的密码不一致')
      return
    }

    if (!registerData.email || !registerData.username || !registerData.password || !registerData.verifyCode) {
      message.error('请填写所有必填项')
      return
    }

    registerMutation.mutate({
      email: registerData.email,
      username: registerData.username,
      password: registerData.password,
      verifyCode: registerData.verifyCode,
      isMerchant: false,
    })
  }

  return (
    <Flex vertical gap="small" style={{ width: '100%' }}>
      <Form
        form={form}
        name="register"
        style={{ maxWidth: 600 }}
        initialValues={{ remember: true }}
        colon={false}
        onFinish={onFinish}
        autoComplete="off"
      >
        <Form.Item<FieldType>
          name="email"
          rules={[
            { required: true, message: '请输入邮箱' },
            { type: 'email', message: '请输入有效的邮箱地址' },
          ]}
        >
          <Input
            placeholder="请输入邮箱"
            type="email"
            prefix={<MailOutlined />}
          />
        </Form.Item>

        <Form.Item<FieldType>
          name="username"
          rules={[
            { required: true, message: '请输入用户名' },
            { min: 3, message: '用户名至少需要3个字符' },
            { max: 18, message: '用户名最多18个字符' },
          ]}
        >
          <Input
            placeholder="请输入用户名"
            type="text"
            prefix={<UserOutlined />}
          />
        </Form.Item>

        <Form.Item<FieldType>
          name="password"
          rules={[
            { required: true, message: '请输入密码' },
            { min: 6, message: '密码至少需要6个字符' },
            { max: 32, message: '密码最多32个字符' },
            {
              pattern: /[0-9]/,
              message: '密码必须包含至少一个数字',
            },
          ]}
        >
          <Password
            placeholder="请输入密码"
            type="password"
          />
        </Form.Item>

        <Form.Item<FieldType>
          name="confirmPassword"
          dependencies={['password']}
          rules={[
            { required: true, message: '请确认密码' },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue('password') === value) {
                  return Promise.resolve()
                }
                return Promise.reject(new Error('两次输入的密码不一致'))
              },
            }),
          ]}
        >
          <Password
            placeholder="请确认密码"
            type="password"
          />
        </Form.Item>

        <Form.Item<FieldType>
          name="verifyCode"
          rules={[
            { required: true, message: '请输入验证码' },
            { len: 6, message: '验证码必须是6位字符' },
          ]}
        >
          <Flex gap="small">
            <Input
              placeholder="请输入验证码"
              type="text"
              maxLength={6}
              disabled={registerMutation.isPending}
            />
            <Button
              type="default"
              className="w-fit!"
              block
              icon={<SendOutlined />}
              onClick={handleSendCode}
              loading={sendCodeMutation.isPending}
              disabled={countdown > 0 || registerMutation.isPending}
            >
              {countdown > 0 ? `${countdown}s 后重发` : '发送验证码'}
            </Button>
          </Flex>
        </Form.Item>

        <Form.Item>
          <Button
            type="primary"
            block
            htmlType="submit"
            loading={registerMutation.isPending}
          >
            注册
          </Button>
        </Form.Item>
      </Form>
      <Flex justify="space-around">
        <a onClick={() => navigate({ to: '/login' })}>前往登录</a>
      </Flex>
    </Flex>
  )
}

export default Register
