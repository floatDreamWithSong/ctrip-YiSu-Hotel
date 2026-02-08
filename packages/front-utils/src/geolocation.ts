/**
 * 浏览器定位工具函数
 */

export interface GeolocationPosition {
  lng: number;
  lat: number;
}

export interface GeolocationOptions {
  timeout?: number;
  maximumAge?: number;
  enableHighAccuracy?: boolean;
}

/**
 * 获取当前位置
 * @param options 定位选项
 * @returns Promise<GeolocationPosition>
 */
export function getCurrentPosition(
  options: GeolocationOptions = {},
): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('浏览器不支持定位功能'));
      return;
    }

    const defaultOptions: PositionOptions = {
      timeout: options.timeout ?? 10000,
      maximumAge: options.maximumAge ?? 60000,
      enableHighAccuracy: options.enableHighAccuracy ?? true,
    };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lng: position.coords.longitude,
          lat: position.coords.latitude,
        });
      },
      (error) => {
        let errorMessage = '定位失败';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = '用户拒绝了定位请求';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = '位置信息不可用';
            break;
          case error.TIMEOUT:
            errorMessage = '定位请求超时';
            break;
          default:
            errorMessage = `定位失败: ${error.message}`;
        }
        reject(new Error(errorMessage));
      },
      defaultOptions,
    );
  });
}
