import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { NumberKeyboard } from 'antd-mobile'

type NumberKeyboardInputProps = {
  value: number
  onChange: (value: number) => void
  min?: number
  className?: string
  disabled?: boolean
}

const toPositiveInt = (value: number, min: number) => {
  if (!Number.isInteger(value) || value < min) return min
  return value
}

let activeKeyboardId: number | null = null
let keyboardIdSeed = 0
const activeKeyboardListeners = new Set<(id: number | null) => void>()

const setActiveKeyboardId = (id: number | null) => {
  activeKeyboardId = id
  activeKeyboardListeners.forEach((listener) => listener(id))
}

export const NumberKeyboardInput = ({
  value,
  onChange,
  min = 1,
  className,
  disabled,
}: NumberKeyboardInputProps) => {
  const inputIdRef = useRef<number>(++keyboardIdSeed)
  const safeValue = useMemo(() => toPositiveInt(value, min), [value, min])
  const [visible, setVisible] = useState(false)
  const [draft, setDraft] = useState(String(safeValue))

  useEffect(() => {
    if (!visible) {
      setDraft(String(safeValue))
    }
  }, [safeValue, visible])

  useEffect(() => {
    const inputId = inputIdRef.current
    const listener = (id: number | null) => {
      if (id !== inputId) {
        setVisible(false)
      }
    }
    activeKeyboardListeners.add(listener)
    return () => {
      activeKeyboardListeners.delete(listener)
      if (activeKeyboardId === inputId) {
        setActiveKeyboardId(null)
      }
    }
  }, [])

  const closeKeyboard = useCallback(() => {
    if (!draft) {
      const fallback = String(min)
      setDraft(fallback)
      onChange(min)
    }
    setVisible(false)
    if (activeKeyboardId === inputIdRef.current) {
      setActiveKeyboardId(null)
    }
  }, [draft, min, onChange])

  const openKeyboard = useCallback(() => {
    if (disabled) return
    setDraft(String(safeValue))
    setActiveKeyboardId(inputIdRef.current)
    setVisible(true)
  }, [disabled, safeValue])

  const handleInput = (key: string) => {
    if (!/^\d$/.test(key)) return
    const raw = `${draft}${key}`.replace(/\D/g, '')
    const nextDraft = raw.replace(/^0+/, '')
    setDraft(nextDraft)
    if (nextDraft) {
      onChange(toPositiveInt(Number(nextDraft), min))
    }
  }

  const handleDelete = () => {
    if (!draft) return
    const nextDraft = draft.slice(0, -1)
    setDraft(nextDraft)
    if (nextDraft) {
      onChange(toPositiveInt(Number(nextDraft), min))
    }
  }

  return (
    <>
      <input
        type="text"
        inputMode="none"
        readOnly
        disabled={disabled}
        value={visible ? draft : String(safeValue)}
        onClick={openKeyboard}
        onFocus={openKeyboard}
        className={className}
      />
      <NumberKeyboard
        visible={visible}
        onClose={closeKeyboard}
        onInput={handleInput}
        onDelete={handleDelete}
      />
    </>
  )
}
