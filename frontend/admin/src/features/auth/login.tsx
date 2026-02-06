import { LockOutlined, UserOutlined } from '@ant-design/icons'
import { useNavigate } from '@tanstack/react-router'
import type { ApiUserTypes } from '@yisu/shared'
import { Button, Flex, Form, message } from 'antd'
import Input from 'antd/es/input/Input'
import { useMutation } from '@tanstack/react-query'
import { AuthRequest } from '@yisu/front-utils/apis/auth'
import { tokenStore } from '@/lib/request'

type FieldType = Partial<ApiUserTypes['UserLogin']>

const Login = () => {
  const [form] = Form.useForm<FieldType>()
  const navigate = useNavigate()

  // 登录请求
  const loginMutation = useMutation({
    mutationFn: AuthRequest.login,
    onSuccess: (data) => {
      tokenStore.set(data.accessToken)
      message.success('登录成功，正在跳转...')
      navigate({ to: '/' })
    },
    onError: (error: Error) => {
      message.error(error.message || '登录失败，请重试')
    },
  })

  const onFinish = (data: FieldType) => {
    if (!data.username || !data.password) {
      message.warning('请填写用户名和密码')
      return
    }
    loginMutation.mutate({
      username: data.username,
      password: data.password,
    })
  }

  return (
    <Flex vertical gap="small" style={{ width: '100%' }}>
      <Form
        form={form}
        name="login"
        style={{ maxWidth: 600 }}
        initialValues={{ remember: true }}
        colon={false}
        onFinish={onFinish}
        autoComplete="off"
      >
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
            disabled={loginMutation.isPending}
          />
        </Form.Item>
        <Form.Item<FieldType>
          name="password"
          rules={[
            { required: true, message: '请输入密码' },
            { min: 6, message: '密码至少需要6个字符' },
            { max: 32, message: '密码最多32个字符' },
          ]}
        >
          <Input
            placeholder="请输入密码"
            type="password"
            prefix={<LockOutlined />}
            disabled={loginMutation.isPending}
          />
        </Form.Item>
        <Form.Item>
          <Button
            type="primary"
            block
            htmlType="submit"
            loading={loginMutation.isPending}
          >
            登录
          </Button>
        </Form.Item>
      </Form>
      <Flex justify="space-around">
        <a onClick={() => navigate({ to: '/register' })}>前往注册</a>
        {/* <a onClick={() => navigate({ to: '/forget-password' })}>忘记密码</a> */}
      </Flex>
    </Flex>
  )
}

export default Login
