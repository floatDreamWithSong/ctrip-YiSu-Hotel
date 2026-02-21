import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { Configurations } from '@/config';
import { firstValueFrom } from 'rxjs';
import type { ApiLocationTypes } from '@yisu/shared';

interface AmapApiResponse<T> {
  status: string;
  info: string;
  infocode: string;
  count?: string;
  [key: string]: unknown; // 允许其他字段
}

// 逆地理编码响应直接包含 regeocode，不在 data 中
interface AmapRegeocodeResponse extends AmapApiResponse<never> {
  regeocode?: AmapRegeocodeData['regeocode'];
}

interface AmapRegeocodeData {
  regeocode: {
    formatted_address: string;
    addressComponent: {
      province: string | string[];
      city: string | string[];
      district: string | string[];
      street: string | string[];
      adcode: string | string[];
    };
  };
}

// 输入提示响应直接包含 tips，不在 data 中
interface AmapInputTipsResponse extends AmapApiResponse<never> {
  tips?: AmapInputTipsData['tips'];
}

// IP定位响应直接包含字段，不在 data 中
interface AmapIpLocateResponse extends AmapApiResponse<never> {
  province?: string;
  city?: string;
  adcode?: string;
  rectangle?: string;
}

// 地理编码响应直接包含 geocodes，不在 data 中
interface AmapGeocodeResponse extends AmapApiResponse<never> {
  geocodes?: AmapGeocodeData['geocodes'];
}

interface AmapInputTipsData {
  tips: Array<{
    name: string;
    address?: string | string[];
    location?: string | string[];
    adcode?: string | string[];
    district?: string | string[];
    city?: string | string[];
    type?: string;
  }>;
}

interface AmapIpLocateData {
  province?: string;
  city?: string;
  adcode?: string;
  rectangle?: string;
}

interface AmapGeocodeData {
  geocodes: Array<{
    location: string;
    formatted_address: string;
    level?: string;
  }>;
}

@Injectable()
export class LocationService {
  private readonly logger = new Logger(LocationService.name);
  private readonly baseUrl = 'https://restapi.amap.com/v3';
  private get key() {
    return Configurations.AMAP_WEB_KEY;
  }

  constructor(private readonly httpService: HttpService) { }

  /**
   * 逆地理编码 - 根据经纬度获取地址
   */
  async regeocode(location: string): Promise<ApiLocationTypes['RegeocodeResponse']> {
    try {
      const response = await firstValueFrom(
        this.httpService.get<AmapRegeocodeResponse>(
          `${this.baseUrl}/geocode/regeo`,
          {
            params: {
              key: this.key,
              location,
              output: 'JSON',
            },
          },
        ),
      );

      const { status, info, regeocode } = response.data;

      // 高德 API status 可能是字符串 "1" 或数字 1
      const statusStr = String(status);
      this.logger.debug(
        `逆地理编码响应: status=${status} (type: ${typeof status}), info=${info}, hasRegeocode=${!!regeocode}`,
      );

      if (statusStr !== '1') {
        this.logger.error(`逆地理编码失败: status=${status}, info=${info}`);
        throw new Error(`逆地理编码失败: ${info || '未知错误'}`);
      }

      if (!regeocode) {
        this.logger.error(
          `逆地理编码失败: 响应数据为空, status=${status}, info=${info}`,
        );
        throw new Error(`逆地理编码失败: 响应数据为空`);
      }

      const { formatted_address, addressComponent } = regeocode;
      const [lng, lat] = location.split(',').map(Number);

      // 高德地图在直辖市场景下会将 city/province/district 返回为空数组 []
      const normalizeStr = (v: string | string[] | undefined): string | undefined => {
        if (!v) return undefined;
        if (Array.isArray(v)) return v.length > 0 ? v[0] : undefined;
        return v;
      };

      const province = normalizeStr(addressComponent.province);
      const city = normalizeStr(addressComponent.city) || province;

      return {
        formattedAddress: formatted_address,
        province,
        city,
        district: normalizeStr(addressComponent.district),
        street: normalizeStr(addressComponent.street),
        adcode: normalizeStr(addressComponent.adcode),
        location: { lng, lat },
      };
    } catch (error) {
      this.logger.error('逆地理编码异常', error);
      throw error;
    }
  }

  /**
   * 输入提示 - 根据关键词获取地点建议
   */
  async inputTips(
    keywords: string,
    city?: string,
  ): Promise<ApiLocationTypes['InputTipsResponse']> {
    try {
      const params: Record<string, string> = {
        key: this.key,
        keywords,
        output: 'JSON',
      };

      if (city) {
        params.city = city;
      }

      const response = await firstValueFrom(
        this.httpService.get<AmapInputTipsResponse>(
          `${this.baseUrl}/assistant/inputtips`,
          { params },
        ),
      );

      const { status, info, tips: responseTips } = response.data;

      if (status !== '1') {
        this.logger.error(`输入提示失败: status=${status}, info=${info}`);
        throw new Error(`输入提示失败: ${info}`);
      }

      const tips = responseTips || [];

      // 辅助函数：将字符串或数组转换为字符串
      const normalizeField = (value: string | string[] | undefined): string | undefined => {
        if (!value) return undefined;
        if (Array.isArray(value)) {
          return value.length > 0 ? value[0] : undefined;
        }
        return value;
      };

      return tips.map((tip) => ({
        name: tip.name,
        address: normalizeField(tip.address),
        location: normalizeField(tip.location),
        adcode: normalizeField(tip.adcode),
        district: normalizeField(tip.district),
        city: normalizeField(tip.city),
        type: tip.type,
      }));
    } catch (error) {
      this.logger.error('输入提示异常', error);
      throw error;
    }
  }

  /**
   * 地理编码 - 根据地址获取经纬度
   */
  async geocode(
    address: string,
    city?: string,
  ): Promise<ApiLocationTypes['GeocodeResponse']> {
    try {
      const params: Record<string, string> = {
        key: this.key,
        address,
        output: 'JSON',
      };

      if (city) {
        params.city = city;
      }

      const response = await firstValueFrom(
        this.httpService.get<AmapGeocodeResponse>(
          `${this.baseUrl}/geocode/geo`,
          { params },
        ),
      );

      const { status, info, geocodes } = response.data;

      if (status !== '1') {
        this.logger.error(`地理编码失败: status=${status}, info=${info}`);
        throw new Error(`地理编码失败: ${info}`);
      }

      if (!geocodes || geocodes.length === 0) {
        this.logger.error(`地理编码失败: 无结果, status=${status}, info=${info}`);
        throw new Error(`地理编码失败: 无结果`);
      }

      const geocode = geocodes[0];
      const [lng, lat] = geocode.location.split(',').map(Number);

      return {
        location: { lng, lat },
        formattedAddress: geocode.formatted_address,
        level: geocode.level,
      };
    } catch (error) {
      this.logger.error('地理编码异常', error);
      throw error;
    }
  }
}
