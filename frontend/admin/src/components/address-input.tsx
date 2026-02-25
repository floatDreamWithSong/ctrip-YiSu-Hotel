import { LocationRequest } from '@yisu/front-utils/apis/location'
import { getCurrentPosition } from '@yisu/front-utils/geolocation'
import { useDebounceFn } from 'ahooks'
import { AutoComplete, message } from 'antd'
import type { AutoCompleteProps, FormInstance } from 'antd'
import { useState } from 'react'

interface TipOption {
  name: string
  address?: string
  location?: string
  district?: string
  city?: string
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAddressLocate(form: FormInstance) {
  const [locating, setLocating] = useState(false)

  const handleLocate = async () => {
    setLocating(true)
    try {
      const pos = await getCurrentPosition()
      const result = await LocationRequest.regeocode(`${pos.lng},${pos.lat}`)
      form.setFieldsValue({
        province: result.province,
        city: result.city,
        district: result.district,
        address: result.formattedAddress,
        location: result.location,
      })
      void message.success('定位成功')
    } catch (err) {
      void message.error(err instanceof Error ? err.message : '定位失败')
    } finally {
      setLocating(false)
    }
  }

  return { locating, handleLocate }
}

interface AddressAutoCompleteProps extends Omit<
  AutoCompleteProps,
  'options' | 'onSelect' | 'onSearch'
> {
  form: FormInstance
}

export function AddressAutoComplete({
  form,
  ...rest
}: AddressAutoCompleteProps) {
  const [options, setOptions] = useState<AutoCompleteProps['options']>([])
  const [tipsMap, setTipsMap] = useState<Map<string, TipOption>>(new Map())

  const { run: debouncedSearch } = useDebounceFn(
    async (keywords: string) => {
      if (!keywords || keywords.length < 2) {
        setOptions([])
        return
      }
      try {
        const city = form.getFieldValue('city') as string | undefined
        console.log('搜索参数:', { keywords, city })
        const tips = await LocationRequest.inputTips(keywords, city)
        console.log('搜索结果:', tips)
        const map = new Map<string, TipOption>()
        const opts = tips
          .filter((tip) => tip.location)
          .map((tip) => {
            const key =
              `${tip.name} ${tip.district} ${tip.address || ''}`.trim()
            map.set(key, tip)
            return {
              value: key,
              label: key,
            }
          })
        console.log('选项列表:', opts)
        setTipsMap(map)
        setOptions(opts)
      } catch (error) {
        console.error('地址搜索失败:', error)
        void message.error(
          error instanceof Error ? error.message : '地址搜索失败',
        )
        setOptions([])
      }
    },
    { wait: 300 },
  )

  const onSelect = async (key: string) => {
    const tip = tipsMap.get(key)
    if (!tip) return

    const address = tip.address || tip.name

    if (tip.location) {
      const [lngStr, latStr] = tip.location.split(',')
      const lng = parseFloat(lngStr)
      const lat = parseFloat(latStr)

      if (!isNaN(lng) && !isNaN(lat)) {
        // 用逆地理编码补全省市区信息
        try {
          const result = await LocationRequest.regeocode(tip.location)
          form.setFieldsValue({
            province: result.province,
            city: result.city,
            district: result.district,
            address: result.formattedAddress || address,
            location: { lng, lat },
          })
          return
        } catch (error) {
          console.error('逆地理编码失败:', error)
          // 降级：仅填充部分信息
        }

        form.setFieldsValue({
          address,
          location: { lng, lat },
          ...(tip.city ? { city: tip.city } : {}),
          ...(tip.district ? { district: tip.district } : {}),
        })
        return
      }
    }

    form.setFieldsValue({ address })
  }

  return (
    <AutoComplete
      {...rest}
      options={options}
      showSearch={{
        filterOption: false,
        onSearch: (text) => void debouncedSearch(text),
      }}
      onSelect={(key) => void onSelect(key as string)}
      placeholder="输入地址搜索"
    />
  )
}
