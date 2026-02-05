import { useState } from 'react'
import { Button, Form, Input, Toast } from 'antd-mobile'
import { useMutation } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { AuthRequest } from '@yisu/front-utils/apis/auth'
import { ApiUserSchemas } from '@yisu/shared'
import { PasswordInput } from '@/components/PasswordInput'

const ForgotPassword = () => {
  const navigate = useNavigate()
  const [form] = Form.useForm()
  const [countdown, setCountdown] = useState(0)

  const sendCodeMutation = useMutation({
    mutationFn: AuthRequest.sendVerifyCode,
    onSuccess: () => {
      Toast.show({
        icon: 'success',
        content: '验证码已发送',
      })
      setCountdown(60)
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
      Toast.show({
        icon: 'fail',
        content: error?.message || '发送验证码失败',
      })
    },
  })

  const resetPasswordMutation = useMutation({
    mutationFn: AuthRequest.forgetPassword,
    onSuccess: () => {
      Toast.show({
        icon: 'success',
        content: '密码重置成功，请登录',
      })
      navigate({ to: '/login' })
    },
    onError: (error: Error) => {
      Toast.show({
        icon: 'fail',
        content: error?.message || '重置密码失败，请重试',
      })
    },
  })

  const handleSendCode = async () => {
    try {
      await form.validateFields(['email'])
      const email = form.getFieldValue('email')
      const result = ApiUserSchemas.userCode.safeParse({
        email,
        type: 'forget_password',
      })

      if (!result.success) {
        const firstError = result.error.issues[0]
        Toast.show({
          icon: 'fail',
          content: firstError.message,
        })
        return
      }

      sendCodeMutation.mutate(result.data)
    } catch (error) {
      console.log('Email validation failed:', error)
    }
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      const result = ApiUserSchemas.userForgetPassword.safeParse(values)
      if (!result.success) {
        const firstError = result.error.issues[0]
        Toast.show({
          icon: 'fail',
          content: firstError.message,
        })
        return
      }
      resetPasswordMutation.mutate(result.data)
    } catch (error) {
      console.log('Form validation failed:', error)
    }
  }

  return (
    <div className="flex flex-col h-full bg-white p-8 justify-center">
      <div>
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-light text-gray-800 mb-2">重置密码</h1>
          <p className="text-gray-500">别担心，我们帮你找回</p>
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
            name="email"
            label="邮箱"
            className="rounded-xl bg-gray-50 w-full"
            rules={[{ required: true, message: '请输入邮箱' }]}
          >
            <Input
              placeholder="请输入注册时使用的邮箱"
              type="email"
              clearable
              className="p-3"
            />
          </Form.Item>

          <Form.Item
            name="verifyCode"
            label="验证码"
            className="rounded-xl bg-gray-50 w-full mt-4"
            rules={[{ required: true, message: '请输入验证码' }]}
            extra={
              <Button
                size="small"
                color="primary"
                fill="none"
                disabled={countdown > 0}
                loading={sendCodeMutation.isPending}
                onClick={handleSendCode}
                className="text-gray-600"
              >
                {countdown > 0 ? `${countdown}秒` : '获取验证码'}
              </Button>
            }
          >
            <Input
              placeholder="请输入6位验证码"
              maxLength={6}
              clearable
              className="p-3"
            />
          </Form.Item>

          <Form.Item
            name="password"
            label="新密码"
            className="rounded-xl bg-gray-50 w-full mt-4"
            rules={[{ required: true, message: '请输入新密码' }]}
          >
            <PasswordInput placeholder="6-32个字符，需包含数字" />
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
          loading={resetPasswordMutation.isPending}
          onClick={handleSubmit}
          className="bg-gray-800 text-white font-bold text-lg py-3"
        >
          确认重置
        </Button>
        <div className="text-center text-sm mt-8">
          <span className="text-gray-500">想起密码了？</span>
          <a
            className="text-gray-800 font-semibold ml-1"
            onClick={() => navigate({ to: '/login' })}
          >
            返回登录
          </a>
        </div>
      </div>
    </div>
  )
}

export default ForgotPassword
