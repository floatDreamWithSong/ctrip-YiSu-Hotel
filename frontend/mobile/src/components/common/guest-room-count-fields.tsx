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
  containerClassName = 'mt-2 grid grid-cols-2 gap-2',
  inputClassName,
}: GuestRoomCountFieldsProps) => {
  return (
    <div className={containerClassName}>
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
