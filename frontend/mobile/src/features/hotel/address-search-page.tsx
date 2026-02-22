import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useRequest } from 'ahooks'
import { LocationRequest } from '@yisu/front-utils/apis/location'
import { useLocationStore } from '@/store/location'

const AddressSearchPage = () => {
  const navigate = useNavigate()
  const { city, updateLocation } = useLocationStore()
  const [keyword, setKeyword] = useState('')
  const { data, run, loading } = useRequest(
    async (value: string) => {
      if (!value.trim()) return []
      return LocationRequest.inputTips(value, city)
    },
    { manual: true },
  )

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
          className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
        />
        <button
          className="min-w-fit rounded-lg bg-blue-600 px-4 py-2 text-sm text-white"
          onClick={() => run(keyword)}
          disabled={loading}
        >
          搜索
        </button>
      </div>
      <div className="space-y-2">
        {(data ?? []).map((item) => (
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
