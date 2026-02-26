import { MerchantHotelRequest } from '@/apis/hotel'
import { useAddressLocate } from '@/components/address-input'
import { useModal } from '@/hooks/useModal'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { hotelInfoDetailQueryOptions } from '../queries/hotelQueries'
import type { ApiHotelTypes } from '@yisu/shared'
import { PriceMode } from '@yisu/shared'
import { Form, Modal, message } from 'antd'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import { useCallback, useState } from 'react'

// 扩展 dayjs 支持 UTC
dayjs.extend(utc)

/**
 * 商户端表单校验规则
 * 仅在商户端前端执行，不涉及后端与其他端
 */
const MERCHANT_VALIDATION_RULES = {
  /**
   * 酒店轮播图必填校验
   * @param images 轮播图数组
   * @returns { valid: boolean, message?: string } 校验结果
   */
  carouselImagesRequired: (
    images: unknown,
  ): { valid: boolean; message?: string } => {
    if (!Array.isArray(images) || images.length === 0) {
      return { valid: false, message: '请至少上传一张酒店轮播图' }
    }
    return { valid: true }
  },

  /**
   * 钟点房时段必填校验
   * @param roomTypes 房型数组
   * @returns { valid: boolean, message?: string } 校验结果
   */
  hourlySlotsRequired: (
    roomTypes: unknown,
  ): { valid: boolean; message?: string } => {
    if (!Array.isArray(roomTypes)) {
      return { valid: true }
    }

    // 查找所有钟点房
    const hourlyRooms = roomTypes.filter(
      (room) => room && room.priceMode === PriceMode.PER_HOUR,
    )

    // 检查每个钟点房是否至少有一个时段
    for (const room of hourlyRooms) {
      if (!room.hourlySlots || room.hourlySlots.length === 0) {
        return {
          valid: false,
          message: '钟点房至少需要设置一个可用时段',
        }
      }
    }

    return { valid: true }
  },
}

/**
 * 深度对比函数
 */
export const isFormDeepEqual = (
  initial: unknown,
  current: unknown,
  path = '',
): boolean => {
  // 1. 如果引用完全一致，直接返回 true
  if (initial === current) return true

  // 2. 处理 null 或 undefined 的情况
  if (
    initial === null ||
    initial === undefined ||
    current === null ||
    current === undefined
  ) {
    if (initial !== current) {
      return false
    }
    return true
  }

  // 4. 处理数组对比
  if (Array.isArray(initial) && Array.isArray(current)) {
    if (initial.length !== current.length) {
      return false
    }
    for (let i = 0; i < initial.length; i++) {
      if (!isFormDeepEqual(initial[i], current[i], `${path}[${i}]`)) {
        return false
      }
    }
    return true
  }

  // 5. 处理对象对比
  if (typeof initial === 'object' && typeof current === 'object') {
    const keys1 = Object.keys(initial)
    const keys2 = Object.keys(current)

    // 获取所有不重复的 key
    const allKeys = new Set([...keys1, ...keys2])

    for (const key of allKeys) {
      // 排除 AntD 内部可能注入的私有属性 (通常以 _ 开头)
      if (key.startsWith('_')) continue

      const val1 = initial[key]
      const val2 = current[key]

      if (!isFormDeepEqual(val1, val2, path ? `${path}.${key}` : key)) {
        return false
      }
    }
    return true
  }

  // 6. 最后的兜底：基本类型对比
  return initial === current
}

const HOTEL_DETAIL_QUERY_KEY = 'merchant-hotel-detail'
const HOTEL_INFOS_QUERY_KEY = 'merchant-hotel-infos'
const HOTEL_INFOS_ALL_QUERY_KEY = 'merchant-hotel-infos-all'

type HotelInfoFormValues = ApiHotelTypes['HotelInfoCreate']

/**
 * 酒店信息表单 Hook
 * 封装表单状态、打开/关闭、提交以及创建/更新 mutation
 * 新增：脏表单警告功能
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

  // 脏表单相关状态
  const [initialValues, setInitialValues] =
    useState<HotelInfoFormValues | null>(null) // 初始值（基准值）

  // 监听表单所有字段变化
  const watchedValues = Form.useWatch([], form)

  // 判断表单是否为脏数据（与初始值不一致）
  // 添加 open && 条件：确保只在模态框打开时才进行脏数据判断
  // 避免 watchedValues 延迟更新导致的误判（form.resetFields 后 watchedValues 可能还未清空）
  const normalizedInitial = initialValues
    ? normalizeValues(initialValues)
    : null
  const normalizedWatched = watchedValues
    ? normalizeValues(watchedValues)
    : null
  const isDirty =
    open &&
    initialValues &&
    watchedValues &&
    !isFormDeepEqual(normalizedInitial, normalizedWatched)

  /**
   * 数据规范化：处理 undefined/空值，确保对比一致性
   * 将空数组、空字符串等统一规范化
   */
  function normalizeValues(
    values: HotelInfoFormValues,
  ): Partial<HotelInfoFormValues> {
    // 使用 dayjs.utc() 解析 UTC 时间字符串，避免时区偏移导致的日期错误
    const openedAtNormalized = values.openedAt
      ? dayjs.utc(values.openedAt).format('YYYY-MM-DD')
      : undefined

    return {
      ...values,
      tags: values.tags ?? [],
      // 处理轮播图：移除 id 字段（后端返回，但表单不跟踪）
      images: (values.images ?? []).map(({ url, sortOrder, caption }) => ({
        url,
        sortOrder,
        caption,
      })),
      // 处理房型：移除后端返回的 id 字段，仅保留表单实际绑定的字段
      roomTypes: (values.roomTypes ?? []).map(
        ({
          name,
          count,
          price,
          priceMode,
          duration,
          bedType,
          maxGuests,
          area,
          imageUrl,
          sortOrder,
          hourlySlots,
        }) => ({
          name,
          count,
          price,
          priceMode,
          duration,
          bedType,
          maxGuests,
          area,
          imageUrl,
          sortOrder,
          // hourlySlots 同样只保留 startTime，移除后端的 id
          hourlySlots: (hourlySlots ?? []).map(({ startTime }) => ({
            startTime,
          })),
        }),
      ),
      homeAdImage: values.homeAdImage ?? undefined,
      location: values.location ?? undefined,
      // 统一截取 YYYY-MM-DD 日期部分再比较，避免时区差异导致的误判
      openedAt: openedAtNormalized,
      enName: values.enName ?? undefined,
      phone: values.phone ?? undefined,
      description: values.description ?? undefined,
      province: values.province ?? undefined,
      city: values.city ?? undefined,
      district: values.district ?? undefined,
    }
  }

  /**
   * 关闭前检查：显示脏表单警告
   * @param readOnly 是否为只读模式
   * @returns Promise<boolean> 返回 true 表示允许关闭，false 表示拦截关闭
   */
  const handleBeforeClose = (readOnly: boolean): Promise<boolean> => {
    return new Promise((resolve) => {
      // 只读模式或非脏数据：直接允许关闭
      if (readOnly || !isDirty) {
        resolve(true)
        return
      }
      // // 添加调试信息，逐个检查对比字段
      // console.log('open:', open);
      // console.log('initialValues:', initialValues);
      // console.log('watchedValues:', watchedValues);
      // console.log('normalizedInitial:', normalizedInitial);
      // console.log('normalizedWatched:', normalizedWatched);
      // if (normalizedInitial && normalizedWatched) {
      //   Object.keys(normalizedInitial).forEach((key) => {
      //     const initialValue = normalizedInitial[key];
      //     const watchedValue = normalizedWatched[key];

      //     if (initialValue !== watchedValue) {
      //       console.log(`Difference found at key: ${key}`);
      //       console.log(`  Initial Value:`, initialValue);
      //       console.log(`  Watched Value:`, watchedValue);
      //     }
      //   });
      // }
      // 显示警告弹窗（水平垂直居中）
      Modal.confirm({
        title: '提示',
        centered: true,
        content:
          '当前酒店信息内容未保存，确认退出将丢失已编辑内容，是否确认退出？',
        okText: '确认退出',
        cancelText: '取消',
        onOk: () => resolve(true), // 确认退出：允许关闭
        onCancel: () => resolve(false), // 取消：拦截关闭
      })
    })
  }

  const refresh = useCallback(() => {
    void Promise.all([
      queryClient.invalidateQueries({
        queryKey: [HOTEL_DETAIL_QUERY_KEY, hotelId],
      }),
      queryClient.invalidateQueries({
        queryKey: [HOTEL_INFOS_QUERY_KEY, hotelId],
      }),
      queryClient.invalidateQueries({
        queryKey: [HOTEL_INFOS_ALL_QUERY_KEY, hotelId],
      }),
    ])
  }, [queryClient, hotelId])

  const createInfoMutation = useMutation({
    mutationFn: (data: HotelInfoFormValues) =>
      MerchantHotelRequest.createHotelInfo(hotelId, data),
    onSuccess: () => {
      message.success('酒店信息创建成功')
      // 保存成功后：重置脏数据状态
      setInitialValues(null)
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
      // 保存成功后：重置脏数据状态
      setInitialValues(null)
      closeModal()
      form.resetFields()
      refresh()
    },
    onError: (error: Error) => message.error(error.message),
  })

  /** 打开「新建」弹窗并重置表单 */
  const openCreate = () => {
    const defaultValues: HotelInfoFormValues = {
      infoNickname: '',
      name: '',
      enName: '',
      starLevel: undefined as unknown as number,
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
    }
    form.setFieldsValue(defaultValues)
    // 保存初始值作为基准
    setInitialValues(defaultValues)
    openModal()
  }

  /** 打开「编辑」弹窗并加载已有数据。
   * 优先命中 prefetchQuery 写入的缓存（staleTime 30 秒内），避免重复请求。 */
  const openEdit = async (infoId: number) => {
    // ensureQueryData：悬停预取已命中缓存时立即返回，否则等待请求完成
    // 与 InfoActionButtons.onMouseEnter → prefetchQuery 共享同一 queryKey
    const data = await queryClient.ensureQueryData(
      hotelInfoDetailQueryOptions(hotelId, infoId),
    )

    const formValues: HotelInfoFormValues = {
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
      // data.openedAt 可能为 null/undefined，必须判断后再转换
      // 否则 dayjs(null/undefined).toISOString() 会返回当前时间，导致脏检测误判
      openedAt: data.openedAt ? dayjs(data.openedAt).toISOString() : undefined,
      homeAdImage: data.homeAdImage ?? undefined,
      location: data.location ?? undefined,
      tags: data.tags ?? [],
      images: data.images ?? [],
      roomTypes: data.roomTypes ?? [],
    }

    form.setFieldsValue(formValues)
    // 保存初始值作为基准
    setInitialValues(formValues)
    openModal(infoId)
  }

  /** 校验表单并提交（创建或更新） */
  const onSubmit = async () => {
    const values = await form.validateFields()

    // === 商户端前置校验 ===
    // 1. 酒店轮播图必填校验
    const carouselValidation = MERCHANT_VALIDATION_RULES.carouselImagesRequired(
      values.images,
    )
    if (!carouselValidation.valid) {
      message.warning(carouselValidation.message)
      return // 阻止提交
    }

    // 2. 钟点房时段必填校验
    const hourlyValidation = MERCHANT_VALIDATION_RULES.hourlySlotsRequired(
      values.roomTypes,
    )
    if (!hourlyValidation.valid) {
      message.warning(hourlyValidation.message)
      return // 阻止提交
    }

    // 校验通过，准备提交数据
    const payload: HotelInfoFormValues = {
      ...values,
      tags: (values.tags ?? []).filter(Boolean),
      images: values.images ?? [],
      // 处理房型数据：过滤掉可选字段的 null/undefined 值
      roomTypes: (values.roomTypes ?? []).map((room) => ({
        ...room,
        bedType: room.bedType ?? undefined,
        area: room.area ?? undefined,
        imageUrl: room.imageUrl ?? undefined,
      })),
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

  /**
   * 关闭弹窗并重置表单状态（带脏数据检查）
   * @param readOnly 是否为只读模式
   */
  const onClose = async (readOnly: boolean = false) => {
    // 先检查是否允许关闭
    const shouldClose = await handleBeforeClose(readOnly)

    if (shouldClose) {
      closeModal()
      form.resetFields()
      // 关闭后清空脏数据状态
      setInitialValues(null)
    }
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
