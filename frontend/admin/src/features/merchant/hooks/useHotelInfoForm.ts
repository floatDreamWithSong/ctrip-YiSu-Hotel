import { MerchantHotelRequest } from '@/apis/hotel'
import { useAddressLocate } from '@/components/address-input'
import { useModal } from '@/hooks/useModal'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { ApiHotelTypes } from '@yisu/shared'
import { Form, message } from 'antd'
import { useCallback } from 'react'

const HOTEL_DETAIL_QUERY_KEY = 'merchant-hotel-detail'
const HOTEL_INFOS_QUERY_KEY = 'merchant-hotel-infos'

type HotelInfoFormValues = ApiHotelTypes['HotelInfoCreate']

/**
 * 酒店信息表单 Hook
 * 封装表单状态、打开/关闭、提交以及创建/更新 mutation
 */
export function useHotelInfoForm(hotelId: number) {
  const queryClient = useQueryClient()
  const {
    open,
    data: editingInfoId,
    openModal,
    closeModal,
  } = useModal<number>()
  const [form] = Form.useForm<HotelInfoFormValues>()
  const { locating, handleLocate } = useAddressLocate(form)

  const refresh = useCallback(() => {
    void Promise.all([
      queryClient.invalidateQueries({
        queryKey: [HOTEL_DETAIL_QUERY_KEY, hotelId],
      }),
      queryClient.invalidateQueries({
        queryKey: [HOTEL_INFOS_QUERY_KEY, hotelId],
      }),
    ])
  }, [queryClient, hotelId])

  const createInfoMutation = useMutation({
    mutationFn: (data: HotelInfoFormValues) =>
      MerchantHotelRequest.createHotelInfo(hotelId, data),
    onSuccess: () => {
      message.success('酒店信息创建成功')
      closeModal()
      form.resetFields()
      refresh()
    },
    onError: (error: Error) => message.error(error.message),
  })

  const updateInfoMutation = useMutation({
    mutationFn: (params: { infoId: number; data: HotelInfoFormValues }) =>
      MerchantHotelRequest.updateHotelInfo(hotelId, params.infoId, params.data),
    onSuccess: () => {
      message.success('酒店信息更新成功')
      closeModal()
      form.resetFields()
      refresh()
    },
    onError: (error: Error) => message.error(error.message),
  })

  /** 打开「新建」弹窗并重置表单 */
  const openCreate = () => {
    form.setFieldsValue({
      infoNickname: '',
      name: '',
      enName: '',
      starLevel: 3,
      phone: '',
      description: '',
      province: '',
      city: '',
      district: '',
      address: '',
      openedAt: undefined,
      homeAdImage: undefined,
      location: undefined,
      tags: [],
      images: [],
      roomTypes: [],
    })
    openModal()
  }

  /** 打开「编辑」弹窗并加载已有数据 */
  const openEdit = async (infoId: number) => {
    const data = await MerchantHotelRequest.getHotelInfoDetail(hotelId, infoId)
    form.setFieldsValue({
      infoNickname: data.infoNickname,
      name: data.name,
      enName: data.enName ?? undefined,
      starLevel: data.starLevel,
      phone: data.phone ?? undefined,
      description: data.description ?? undefined,
      province: data.province ?? undefined,
      city: data.city ?? undefined,
      district: data.district ?? undefined,
      address: data.address,
      openedAt: data.openedAt ?? undefined,
      homeAdImage: data.homeAdImage ?? undefined,
      location: data.location ?? undefined,
      tags: data.tags ?? [],
      images: data.images ?? [],
      roomTypes: data.roomTypes ?? [],
    })
    openModal(infoId)
  }

  /** 校验表单并提交（创建或更新） */
  const onSubmit = async () => {
    const values = await form.validateFields()
    const payload: HotelInfoFormValues = {
      ...values,
      tags: (values.tags ?? []).filter(Boolean),
      images: values.images ?? [],
      roomTypes: values.roomTypes ?? [],
      location:
        values.location &&
        typeof values.location.lng === 'number' &&
        typeof values.location.lat === 'number'
          ? values.location
          : undefined,
    }
    if (editingInfoId) {
      updateInfoMutation.mutate({ infoId: editingInfoId, data: payload })
      return
    }
    createInfoMutation.mutate(payload)
  }

  /** 关闭弹窗并重置表单状态 */
  const onClose = () => {
    closeModal()
    form.resetFields()
  }

  return {
    form,
    open,
    editingInfoId,
    locating,
    handleLocate,
    openCreate,
    openEdit,
    onSubmit,
    onClose,
    submitting: createInfoMutation.isPending || updateInfoMutation.isPending,
  }
}
