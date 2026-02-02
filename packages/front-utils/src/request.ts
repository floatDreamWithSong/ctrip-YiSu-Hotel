import type { BaseResponse } from "@yisu/shared";
import type {
  AxiosError,
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  CreateAxiosDefaults,
  InternalAxiosRequestConfig,
} from "axios";
import axios from "axios";
import z from "zod";

// 通用响应数据格式
export interface ApiResponse<T = unknown> extends BaseResponse<T> {}

/**
 * AxiosClientOptions
 * @param baseURL - 基础URL
 * @param timeout - 请求超时时间
 * @param headers - 请求头
 * @param onTokenGet - 获取token的getter，请在getter中处理token的获取逻辑（比如从localStorage中获取）
 * @param onTokenRemove - token校验失败时移除token的回调，请在回调中处理自动登录失败的逻辑（比如跳转登录页面）
 * @param onRequest - 请求拦截器
 * @param onResponse - 响应拦截器
 * @param onError - 错误拦截器
 */
interface AxiosClientOptions  {
  baseURL: string;
  timeout: number;
  headers: CreateAxiosDefaults['headers'];
  onTokenGet: () => string | null;
  onTokenRemove: () => void;

  onRequest?: (config: InternalAxiosRequestConfig) => InternalAxiosRequestConfig;
  onResponse?: (response: AxiosResponse<ApiResponse>) => AxiosResponse<ApiResponse>;
  onError?: (error: AxiosError) => AxiosError;
}

export let axiosClientRef : AxiosInstance | undefined = void 0;

// 创建axios实例
export function createAxiosInstance(options: AxiosClientOptions): AxiosInstance {
  const { baseURL, timeout, headers, onRequest, onResponse, onError, onTokenGet, onTokenRemove } = options;
  const instance = axios.create({
    baseURL,
    timeout,
    headers,
  });
  
  // 请求拦截器 - 自动token装配
  instance.interceptors.request.use(
    async (config) => {
      const token = onTokenGet();
      if (token) {
        config.headers.Authorization = token;
      }
      onRequest?.(config);
      return config;
    },
    (error) => {
      onError?.(error);
      return Promise.reject(error);
    },
  );
  
  // 响应拦截器 - 全局错误拦截和数据格式验证
  instance.interceptors.response.use(
    (response: AxiosResponse<ApiResponse>) => {
      const { data: payload } = response;
      // 检查业务状态码
      if (payload.code !== 0) {
        const errmsg = payload.message || "请求失败";
        throw new Error(errmsg);
      }
      onResponse?.(response);
      return response;
    },
    (error: AxiosError) => {
      // 网络错误处理
      let errorMessage = "网络请求失败";
      
      if (error.response) {
        const status = error.response.status;
        switch (status) {
          case 400:
            errorMessage = "请求参数错误";
            break;
            case 401:
            errorMessage = "未授权，请重新登录";
            onTokenRemove();
            break;
          case 403:
            errorMessage = "拒绝访问";
            break;
          case 404:
            errorMessage = "请求资源不存在";
            break;
          case 500:
            errorMessage = "服务器内部错误";
            break;
          default:
            errorMessage = `请求失败 (${status})`;
        }
      } else if (error.request) {
        errorMessage = "网络连接失败";
      }
      if (
        error.response?.data &&
        typeof error.response.data === "object" &&
        "msg" in error.response.data
      ) {
        errorMessage += `: ${error.response.data.msg}`;
      }
      onError?.(error);
      return Promise.reject(new Error(errorMessage));
    },
  );

  axiosClientRef = instance;
  return instance;
}

/**
 * 基础请求方法，可直接传入泛型以获得接口类型提示。或者传入zod验证器进行更严格的数据校验
 * @param config - 请求配置
 * @returns 
 */
export async function request<DATA>(
  config: AxiosRequestConfig & {
    responseValidator?: z.ZodSchema<DATA>;
    dataValidator?: z.ZodSchema;
    paramsValidator?: z.ZodSchema;
  },
): Promise<DATA> {
  if(!axiosClientRef) {
    throw new Error("axiosClientRef is not defined");
  }
  const httpClient = axiosClientRef;
  try {
    if (config.dataValidator) {
      const result = config.dataValidator.safeParse(config.data);
      if (!result.success) {
        throw new Error(
          `请求${config.url}的body数据格式错误:${result.error.message}`,
        );
      }
    }
    if (config.paramsValidator) {
      const result = config.paramsValidator.safeParse(config.params);
      if (!result.success) {
        throw new Error(
          `请求${config.url}的params数据格式错误:${result.error.message}`,
        );
      }
    }
    const response = await httpClient.request<ApiResponse<DATA>>(config);
    if (!config.responseValidator) {
      return response.data.data;
    }
    const result = config.responseValidator.safeParse(response.data.data);
    if (!result.success) {
      throw new Error(
        `请求${config.url}的响应数据格式错误:${result.error.message}`,
      );
    }
    return result.data;
  } catch (error) {
    throw error instanceof Error ? error : new Error("未知错误");
  }
}
