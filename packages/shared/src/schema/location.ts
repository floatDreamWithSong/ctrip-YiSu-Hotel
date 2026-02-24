import z from "zod";

// 逆地理编码请求参数
export const regeocodeRequestSchema = z.object({
  location: z.string().regex(/^\d+\.\d+,\d+\.\d+$/, "格式应为: 经度,纬度"),
});

// 逆地理编码响应数据
export const regeocodeResponseSchema = z.object({
  formattedAddress: z.string(), // 格式化地址
  province: z.string().optional(), // 省份
  city: z.string().optional(), // 城市
  district: z.string().optional(), // 区县
  street: z.string().optional(), // 街道
  adcode: z.string().optional(), // 区域编码
  location: z.object({
    lng: z.number(), // 经度
    lat: z.number(), // 纬度
  }),
});

// 输入提示请求参数
export const inputTipsRequestSchema = z.object({
  keywords: z.string().min(1, "关键词不能为空"),
  city: z.string().optional(), // 城市限制（可选）
});

// 输入提示项
export const inputTipItemSchema = z.object({
  name: z.string(), // 名称
  address: z.string().optional(), // 地址
  location: z.string().optional(), // 经纬度 "lng,lat"
  adcode: z.string().optional(), // 区域编码
  district: z.string().optional(), // 区县
  city: z.string().optional(), // 城市
  type: z.string().optional(), // POI类型
});

// 输入提示响应数据
export const inputTipsResponseSchema = z.array(inputTipItemSchema);

// 地理编码请求参数
export const geocodeRequestSchema = z.object({
  address: z.string().min(1, "地址不能为空"),
  city: z.string().optional(), // 城市限制（可选）
});

// 地理编码响应数据
export const geocodeResponseSchema = z.object({
  location: z.object({
    lng: z.number(),
    lat: z.number(),
  }),
  formattedAddress: z.string(),
  level: z.string().optional(),
});
