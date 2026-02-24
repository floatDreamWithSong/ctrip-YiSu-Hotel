import { MerchantHotelRequest } from '@/apis/hotel'
import { useAddressLocate } from '@/components/address-input'
import { useModal } from '@/hooks/useModal'
import { useMutation, useQueryClient } from '@tanstack/react-query'
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
 * 深度比较函数：支持嵌套对象、数组，并自动过滤 AntD 干扰字段
 */
export const isFormDeepEqual = (obj1: unknown, obj2: unknown): boolean => {
  // 1. 基本类型判断（如果引用相同，或者都是 string/number 等且值相等）
  if (obj1 === obj2) return true
  // 2. 如果其中有一个不是对象（或者是 null），既然引用不等，值肯定不等
  if (
    typeof obj1 !== 'object' ||
    obj1 === null ||
    typeof obj2 !== 'object' ||
    obj2 === null
  ) {
    return obj1 === obj2
  }
  // 3. 数组处理：如果是数组，必须逐个元素递归比较
  if (Array.isArray(obj1) && Array.isArray(obj2)) {
    if (obj1.length !== obj2.length) return false
    // 每一个元素都得过一遍 isFormDeepEqual
    return obj1.every((item, index) => isFormDeepEqual(item, obj2[index]))
  }
  // 如果一个是数组一个不是，直接返回 false
  if (Array.isArray(obj1) !== Array.isArray(obj2)) return false
  // 4. 对象处理
  // 定义干扰项黑名单（AntD Upload 产生的动态字段）
  const ignoreKeys = [
    'uid',
    'status',
    'percent',
    'originFileObj',
    'response',
    'xhr',
  ]
  const keys1 = Object.keys(obj1).filter((key) => !ignoreKeys.includes(key))
  const keys2 = Object.keys(obj2).filter((key) => !ignoreKeys.includes(key))
  // 有效字段数量不一致，说明内容变了
  if (keys1.length !== keys2.length) return false
  // 递归比较每一个有效 Key 的内容
  for (const key of keys1) {
    // 只要有一个 Key 的内容深度比较不一致，整体就是不等的
    if (
      !Object.prototype.hasOwnProperty.call(obj2, key) ||
      !isFormDeepEqual(obj1[key], obj2[key])
    ) {
      return false
    }
  }

  return true
}

const HOTEL_DETAIL_QUERY_KEY = 'merchant-hotel-detail'
const HOTEL_INFOS_QUERY_KEY = 'merchant-hotel-infos'

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
      roomTypes: values.roomTypes ?? [],
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
      // 显示警告弹窗
      Modal.confirm({
        title: '提示',
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
    }
    form.setFieldsValue(defaultValues)
    // 保存初始值作为基准
    setInitialValues(defaultValues)
    openModal()
  }

  /** 打开「编辑」弹窗并加载已有数据 */
  const openEdit = async (infoId: number) => {
    const data = await MerchantHotelRequest.getHotelInfoDetail(hotelId, infoId)

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
