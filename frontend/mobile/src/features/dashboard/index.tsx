import { LocationInput } from '@/components/home/location-input';
import { Button } from 'antd-mobile';
import { useLocationStore } from '@/store/location';

const Dashboard = () => {
  const { city, address } = useLocationStore();

  const handleSearch = () => {
    // TODO: 跳转到酒店列表页
    console.log('搜索酒店', { city, address });
  };

  return (
    <div className="h-full bg-gray-50">
      {/* 顶部 Banner 区域 - 预留 */}
      <div className="h-48 bg-blue-500 flex items-center justify-center">
        <div className="text-white text-center">
          <h2 className="text-2xl font-bold mb-2">易宿酒店</h2>
          <p className="text-sm opacity-90">发现您的理想住宿</p>
        </div>
      </div>

      {/* 核心查询区域 */}
      <div className="p-4 -mt-8">
        <div className="bg-white rounded-xl shadow-lg p-4 space-y-4">
          {/* 位置输入 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              当前位置
            </label>
            <LocationInput />
          </div>

          {/* 关键字搜索 - 预留 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              酒店搜索
            </label>
            <input
              type="text"
              placeholder="搜索酒店名称、地址等"
              className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* 入住日期选择 - 预留 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              入住日期
            </label>
            <div className="px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 text-gray-500">
              请选择入住日期（待开发）
            </div>
          </div>

          {/* 查询按钮 */}
          <Button
            block
            color="primary"
            size="large"
            shape="rounded"
            onClick={handleSearch}
            disabled={!city && !address}
            className="mt-4"
          >
            搜索酒店
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
