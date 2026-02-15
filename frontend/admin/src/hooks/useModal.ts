import { useCallback, useState } from 'react'

/**
 * 通用模态框状态管理 Hook
 * 封装模态框的打开、关闭、数据传递等逻辑
 */
export function useModal<T = any>() {
  const [open, setOpen] = useState(false)
  const [data, setData] = useState<T | null>(null)

  const openModal = useCallback((modalData?: T) => {
    setOpen(true)
    if (modalData !== undefined) {
      setData(modalData)
    }
  }, [])

  const closeModal = useCallback(() => {
    setOpen(false)
    setData(null)
  }, [])

  const updateData = useCallback((newData: T | null) => {
    setData(newData)
  }, [])

  return {
    open,
    data,
    openModal,
    closeModal,
    updateData,
  }
}
