import cn from '@yisu/front-utils/cn'
import { NumberKeyboardInput } from './number-keyboard-input'

type LabeledNumberInputFieldProps = {
  label: string
  value: number
  onChange: (value: number) => void
  min?: number
  disabled?: boolean
  wrapperClassName?: string
  labelClassName?: string
  inputClassName?: string
}

export const LabeledNumberInputField = ({
  label,
  value,
  onChange,
  min,
  disabled,
  wrapperClassName,
  labelClassName,
  inputClassName,
}: LabeledNumberInputFieldProps) => {
  return (
    <div
      className={cn(
        'flex justify-between gap-1 items-center w-full',
        wrapperClassName,
      )}
    >
      <div
        className={cn('mb-1 text-xs text-gray-500 text-nowrap', labelClassName)}
      >
        {label}
      </div>
      <NumberKeyboardInput
        value={value}
        onChange={onChange}
        min={min}
        disabled={disabled}
        className={cn(inputClassName, 'w-12')}
      />
    </div>
  )
}
