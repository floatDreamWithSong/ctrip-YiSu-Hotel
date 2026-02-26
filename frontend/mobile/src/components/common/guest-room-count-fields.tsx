import cn from '@yisu/front-utils/cn'
import { LabeledNumberInputField } from './labeled-number-input-field'

type GuestRoomCountFieldsProps = {
  guestCount: number
  roomCount: number
  onGuestCountChange: (value: number) => void
  onRoomCountChange: (value: number) => void
  containerClassName?: string
  inputClassName: string
}

export const GuestRoomCountFields = ({
  guestCount,
  roomCount,
  onGuestCountChange,
  onRoomCountChange,
  containerClassName,
  inputClassName,
}: GuestRoomCountFieldsProps) => {
  return (
    <div
      className={cn(
        'flex flex-col gap-2 items-center w-full',
        containerClassName,
      )}
    >
      <LabeledNumberInputField
        label="入住人数"
        value={guestCount}
        onChange={onGuestCountChange}
        inputClassName={inputClassName}
      />
      <LabeledNumberInputField
        label="房间数量"
        value={roomCount}
        onChange={onRoomCountChange}
        inputClassName={inputClassName}
      />
    </div>
  )
}
