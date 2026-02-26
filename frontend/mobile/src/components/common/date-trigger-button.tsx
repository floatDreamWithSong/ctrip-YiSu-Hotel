import type { ReactNode } from 'react'
import cn from '@yisu/front-utils/cn'
import { CalendarIcon } from 'lucide-react'
import dayjs from 'dayjs'

type DateTriggerButtonProps = {
  onClick: () => void
  from?: string
  to?: string
  icon?: ReactNode
  className?: string
  disabled?: boolean
}

export const DateTriggerButton = ({
  onClick,
  icon = <CalendarIcon size={18} />,
  from,
  to,
  className,
  disabled,
}: DateTriggerButtonProps) => {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn('flex w-full items-center gap-2 py-2 text-left', className)}
    >
      {icon}
      {!from ? (
        '选择入住/离店日期'
      ) : (
        <span className="[&>span]:font-bold [&>span>span]:text-xs">
          <span>
            {dayjs(from).format('YYYY/MM/DD')}{' '}
            <span>
              {dayjs(from)
                .toDate()
                .toLocaleDateString('zh-CN', { weekday: 'short' })}
            </span>
          </span>
          {to && (
            <span>
              {' '}
              - {dayjs(to).format('YYYY/MM/DD')}{' '}
              <span>
                {dayjs(to)
                  .toDate()
                  .toLocaleDateString('zh-CN', { weekday: 'short' })}
              </span>
            </span>
          )}
          {to && (
            <span className="text-xs">
              ，共 {dayjs(to).diff(dayjs(from), 'day')} 晚
            </span>
          )}
        </span>
      )}
    </button>
  )
}
