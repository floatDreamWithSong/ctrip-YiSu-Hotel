import { useState, useRef } from 'react';
import { Input, Button, Toast, type InputRef } from 'antd-mobile';
import { LocationOutline } from 'antd-mobile-icons';
import { useRequest } from 'ahooks';
import { LocationRequest } from '@yisu/front-utils/apis/location';
import { getCurrentPosition } from '@yisu/front-utils/geolocation';
import { useLocationStore } from '@/store/location';
import cn from '@yisu/front-utils/cn';

export const LocationInput = () => {
  const { city, address, updateLocation } = useLocationStore();
  const [isInputMode, setIsInputMode] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [showTips, setShowTips] = useState(false);
  const inputRef = useRef<InputRef>(null);
  const blurTimerRef = useRef<number | null>(null);

  // 定位请求
  const { run: handleLocate, loading: locating } = useRequest(
    async () => {
      const pos = await getCurrentPosition();
      const result = await LocationRequest.regeocode(`${pos.lng},${pos.lat}`);
      return result;
    },
    {
      manual: true,
      onSuccess: (data) => {
        updateLocation({
          city: data.city || data.province,
          address: data.formattedAddress,
          location: data.location,
        });
        Toast.show({
          icon: 'success',
          content: '定位成功',
        });
      },
      onError: (error: Error) => {
        Toast.show({
          icon: 'fail',
          content: error.message || '定位失败，请重试',
        });
      },
    },
  );

  // 处理输入变化
  const handleInputChange = (value: string) => {
    setInputValue(value);
  };

  // 进入输入模式
  const handleEnterInputMode = () => {
    setIsInputMode(true);
    setInputValue(address || '');
    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
  };

  // 退出输入模式
  const handleExitInputMode = () => {
    setIsInputMode(false);
    setInputValue('');
    setShowTips(false);
  };

  // 显示当前地址
  const displayText = address || city || '请选择位置';

  return (
    <div className="relative">
      <div className="flex items-center gap-2">
        {/* 定位按钮 */}
        <Button
          size="large"
          fill="outline"
          loading={locating}
          onClick={handleLocate}
          className="shrink-0"
        >
          <LocationOutline />
        </Button>

        {/* 地址显示/输入 */}
        {isInputMode ? (
          <div className="flex-1 relative">
            <Input
              ref={inputRef}
              value={inputValue}
              onChange={handleInputChange}
              placeholder="请输入地址"
              clearable
              onBlur={() => {
                // 延迟关闭，以便点击提示项
                blurTimerRef.current = window.setTimeout(() => {
                  // 只有在没有显示提示时才退出输入模式
                  if (!showTips) {
                    handleExitInputMode();
                  }
                }, 300);
              }}
              onFocus={() => {
                // 清除 blur 定时器，避免误关闭
                if (blurTimerRef.current) {
                  clearTimeout(blurTimerRef.current);
                  blurTimerRef.current = null;
                }
              }}
              className="flex-1"
            />
          </div>
        ) : (
          <div
            onClick={handleEnterInputMode}
            className={cn(
              'flex-1 px-3 py-2 rounded-lg border border-gray-200 bg-gray-50',
              'cursor-pointer hover:bg-gray-100 transition-colors',
            )}
          >
            <span className="text-gray-700">{displayText}</span>
          </div>
        )}
      </div>
    </div>
  );
};
