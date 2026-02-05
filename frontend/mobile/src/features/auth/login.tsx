import { Button, Form, Input, Toast } from 'antd-mobile'
import { useMutation } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { AuthRequest } from '@yisu/front-utils/apis/auth'
import { tokenStore } from '@/lib/request'
import { ApiUserSchemas } from '@yisu/shared'
import { PasswordInput } from '@/components/PasswordInput'

const Login = () => {
  const navigate = useNavigate()
  const [form] = Form.useForm()

  const loginMutation = useMutation({
    mutationFn: AuthRequest.login,
    onSuccess: (data) => {
      tokenStore.set(data.accessToken)
      Toast.show({
        icon: 'success',
        content: '登录成功',
      })
      navigate({ to: '/' })
    },
    onError: (error: Error) => {
      Toast.show({
        icon: 'fail',
        content: error?.message || '登录失败，请重试',
      })
    },
  })

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      const result = ApiUserSchemas.userLogin.safeParse(values)
      if (!result.success) {
        const firstError = result.error.issues[0]
        Toast.show({
          icon: 'fail',
          content: firstError.message,
        })
        return
      }
      loginMutation.mutate(result.data)
    } catch (error) {
      console.log('Form validation failed:', error)
    }
  }

  return (
    <div className="flex flex-col h-full bg-white p-8 justify-center">
      <div>
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-light text-gray-800 mb-2">欢迎回来</h1>
          <p className="text-gray-500">登录以继续您的旅程</p>
        </div>

        <Form
          form={form}
          layout="vertical"
          style={{
            '--border-top': 'none',
            '--border-bottom': 'none',
            '--border-inner': 'none',
          }}
        >
          <Form.Item
            name="username"
            label="用户名"
            className="rounded-xl bg-gray-50 w-full"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input placeholder="请输入用户名" clearable className="p-3" />
          </Form.Item>

          <Form.Item
            name="password"
            label="密码"
            className="rounded-xl bg-gray-50 w-full mt-4"
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <PasswordInput placeholder="请输入密码" />
          </Form.Item>
        </Form>
      </div>

      <div className="mt-8">
        <Button
          block
          type="submit"
          color="primary"
          size="large"
          shape="rounded"
          loading={loginMutation.isPending}
          onClick={handleSubmit}
          className="bg-gray-800 text-white font-bold text-lg py-3"
        >
          登 录
        </Button>
        <div className="flex justify-between text-sm mt-8">
          <a
            className="text-gray-600"
            onClick={() => navigate({ to: '/register' })}
          >
            注册账号
          </a>
          <a
            className="text-gray-600"
            onClick={() => navigate({ to: '/forgot-password' })}
          >
            忘记密码？
          </a>
        </div>
      </div>
    </div>
  )
}

export default Login
