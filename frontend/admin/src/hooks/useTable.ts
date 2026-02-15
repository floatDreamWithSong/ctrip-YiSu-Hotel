import { useCallback, useMemo, useState } from 'react'

/**
 * 通用表格状态管理 Hook
 * 封装分页、筛选、排序等常见表格逻辑
 */
export function useTable<F extends Record<string, unknown> = Record<string, unknown>>(
  initialPageSize = 10
) {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(initialPageSize)
  const [filters, setFilters] = useState<F>({} as F)

  const pagination = useMemo(
    () => ({
      current: page,
      pageSize,
      onChange: (nextPage: number, nextPageSize: number) => {
        setPage(nextPage)
        if (nextPageSize !== pageSize) {
          setPageSize(nextPageSize)
          setPage(1) // 改变页大小时重置到第一页
        }
      },
    }),
    [page, pageSize]
  )

  const updateFilter = useCallback(<K extends keyof F>(key: K, value: F[K]) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
    setPage(1) // 筛选时重置到第一页
  }, [])

  const updateFilters = useCallback((newFilters: Partial<F>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }))
    setPage(1)
  }, [])

  const resetFilters = useCallback(() => {
    setFilters({} as F)
    setPage(1)
  }, [])

  const resetPage = useCallback(() => {
    setPage(1)
  }, [])

  return {
    page,
    pageSize,
    filters,
    pagination,
    updateFilter,
    updateFilters,
    resetFilters,
    resetPage,
    setPage,
    setPageSize,
  }
}
