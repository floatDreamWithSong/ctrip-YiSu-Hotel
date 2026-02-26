import type {
  ApiLocationTypes,
} from "@yisu/shared";
import { request } from "../request";
import { ApiLocationSchemas } from "@yisu/shared";

export const LocationRequest = {
  /**
   * 逆地理编码 - 根据经纬度获取地址
   */
  regeocode: (location: string) => {
    return request<ApiLocationTypes['RegeocodeResponse']>({
      url: '/location/regeocode',
      method: 'POST',
      data: { location },
      dataValidator: ApiLocationSchemas.regeocodeRequest,
      responseValidator: ApiLocationSchemas.regeocodeResponse,
    });
  },

  /**
   * 输入提示 - 根据关键词获取地点建议
   */
  inputTips: (keywords: string, city?: string) => {
    return request<ApiLocationTypes['InputTipsResponse']>({
      url: '/location/input-tips',
      method: 'GET',
      params: { keywords, ...(city ? { city } : {}) },
      paramsValidator: ApiLocationSchemas.inputTipsRequest,
      responseValidator: ApiLocationSchemas.inputTipsResponse,
    });
  },

  /**
   * 地理编码 - 根据地址获取经纬度
   */
  geocode: (address: string, city?: string) => {
    return request<ApiLocationTypes['GeocodeResponse']>({
      url: '/location/geocode',
      method: 'GET',
      params: { address, ...(city ? { city } : {}) },
      paramsValidator: ApiLocationSchemas.geocodeRequest,
      responseValidator: ApiLocationSchemas.geocodeResponse,
    });
  },

  /**
   * 国内城市行政区索引（用于地址搜索空状态）
   */
  chinaCityIndex: () => {
    return request<ApiLocationTypes['ChinaCityIndexResponse']>({
      url: '/location/china-city-index',
      method: 'GET',
      responseValidator: ApiLocationSchemas.chinaCityIndexResponse,
    });
  },
};
