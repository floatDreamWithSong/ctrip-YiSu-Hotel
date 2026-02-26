import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { LocationRequest } from '@yisu/front-utils/apis/location'
import { useLocationStore } from '@/store/location'
import { SpinLoading } from 'antd-mobile'

const AddressSearchPage = () => {
  const navigate = useNavigate()
  const { city, updateLocation } = useLocationStore()
  const [keyword, setKeyword] = useState('')
  const [submittedKeyword, setSubmittedKeyword] = useState('')

  useEffect(() => {
    const trimmedKeyword = keyword.trim()
    const timer = window.setTimeout(() => {
      setSubmittedKeyword(trimmedKeyword)
    }, 300)

    return () => window.clearTimeout(timer)
  }, [keyword])

  const tipsQuery = useQuery({
    queryKey: ['mobile-address-tips', city, submittedKeyword],
    queryFn: async () => {
      if (!submittedKeyword) return []
      return LocationRequest.inputTips(submittedKeyword, city)
    },
    enabled: Boolean(submittedKeyword),
  })

  return (
    <div className="h-full overflow-y-auto bg-white px-3 py-3">
      <div className="mb-3 flex items-center justify-between">
        <div className="text-base font-medium">地址搜索</div>
        <button
          className="text-sm text-blue-600"
          onClick={() => navigate({ to: '/' })}
        >
          返回
        </button>
      </div>
      <div className="mb-3 flex gap-2">
        <input
          value={keyword}
          onChange={(event) => setKeyword(event.target.value)}
          placeholder="输入城市、商圈、地标"
          className="w-full rounded-xl px-3 py-2 text-sm outline-2 outline-primary"
        />
        <button
          className="min-w-fit rounded-lg bg-blue-600 px-4 py-2 text-sm text-white"
          onClick={() => {
            // Re-run address lookup when clicking search with same term
            const trimmedKeyword = keyword.trim()
            if (trimmedKeyword === submittedKeyword && trimmedKeyword) {
              void tipsQuery.refetch()
              return
            }
            setSubmittedKeyword(trimmedKeyword)
          }}
          disabled={tipsQuery.isFetching}
        >
          搜索
        </button>
      </div>
      <div className="space-y-2">
        {tipsQuery.isFetching ? (
          <div className="flex justify-center">
            <SpinLoading />
          </div>
        ) : null}
        {(tipsQuery.data ?? []).map((item) => (
          <div
            key={`${item.name}-${item.location}`}
            className="rounded-xl border border-gray-100 p-3"
            onClick={async () => {
              if (!item.location) return
              const regeocode = await LocationRequest.regeocode(item.location)
              updateLocation({
                city: regeocode.city || regeocode.province,
                address: regeocode.formattedAddress,
                location: regeocode.location,
              })
              navigate({ to: '/' })
            }}
          >
            <div className="text-sm font-medium">{item.name}</div>
            <div className="mt-1 text-xs text-gray-500">
              {item.address ?? '-'}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default AddressSearchPage
