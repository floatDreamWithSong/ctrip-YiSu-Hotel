import { useState } from 'react'
import { Input } from 'antd-mobile'
import { EyeInvisibleOutline, EyeOutline } from 'antd-mobile-icons'

// Custom Password Input Component for better UI control
export const PasswordInput = (props: {
  value?: string
  onChange?: (value: string) => void
  placeholder?: string
}) => {
  const [visible, setVisible] = useState(false)
  return (
    <div className="relative w-full">
      <Input {...props} type={visible ? 'text' : 'password'} className="p-3" />
      <div className="absolute inset-y-0 right-0 pr-4 flex items-center text-lg text-gray-400">
        <div onClick={() => setVisible(!visible)} className="cursor-pointer">
          {visible ? <EyeOutline /> : <EyeInvisibleOutline />}
        </div>
      </div>
    </div>
  )
}
