import type { ReactNode } from 'react'
import cn from '@yisu/front-utils/cn'

type DateTriggerButtonProps = {
  onClick: () => void
  text: ReactNode
  icon?: ReactNode
  className?: string
  disabled?: boolean
}

export const DateTriggerButton = ({
  onClick,
  text,
  icon,
  className,
  disabled,
}: DateTriggerButtonProps) => {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-2 border border-gray-200 px-3 py-2 text-left',
        className,
      )}
    >
      {icon}
      <span>{text}</span>
    </button>
  )
}
