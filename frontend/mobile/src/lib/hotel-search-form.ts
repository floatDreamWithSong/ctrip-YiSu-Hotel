export const formatYmdDate = (date?: Date | null) => {
  if (!date) return undefined
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  return `${year}-${month}-${day}`
}

export const parseYmdDate = (value?: string) => {
  if (!value) return undefined
  const [year, month, day] = value.split('-').map((item) => Number(item))
  if (!year || !month || !day) return undefined
  return new Date(year, month - 1, day)
}

export const getStartOfToday = () => {
  const date = new Date()
  date.setHours(0, 0, 0, 0)
  return date
}

export const isOnOrAfterDate = (date: Date, target: Date) =>
  date.getTime() >= target.getTime()

export const normalizePositiveInt = (value?: number) =>
  Number.isInteger(value) && (value as number) >= 1 ? (value as number) : 1

export const calcNightsFromYmd = (checkIn?: string, checkOut?: string) => {
  if (!checkIn || !checkOut) return undefined
  const start = new Date(checkIn)
  const end = new Date(checkOut)
  const diff = Math.ceil(
    (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24),
  )
  if (!Number.isFinite(diff) || diff <= 0) return undefined
  return diff
}
