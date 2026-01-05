import React, { useEffect, useState } from 'react';
import { 
  HiOutlineUserGroup, 
  HiOutlineCurrencyDollar, 
  HiOutlineChartBar, 
  HiOutlineTicket,
  HiOutlineRefresh 
} from 'react-icons/hi';

// Import API và Interface đã tạo
import { getDashboardStats, DashboardStatResponse } from '../apis/api_stats';

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStatResponse | null>(null);
  const [loading, setLoading] = useState(true);

  // Hàm tải dữ liệu
  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const data = await getDashboardStats();
      setStats(data);
    } catch (error) {
      console.error("Lỗi tải dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Hàm định dạng tiền tệ VNĐ
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
  };

  // Cấu hình dữ liệu hiển thị lên các thẻ (Cards)
  // Lưu ý: Dữ liệu "Change" (+12.5%...) hiện tại Backend chưa tính (cần so sánh với tháng trước), 
  // nên tạm thời mình để hardcode hoặc ẩn đi.
  const statCards = [
    { 
      label: 'Tổng doanh thu vé', 
      value: stats ? formatCurrency(stats.totalRevenue) : '0 đ', 
      // change: '+12.5%', 
      icon: <HiOutlineCurrencyDollar className="text-emerald-500" size={24} />, 
      color: 'bg-emerald-50' 
    },
    { 
      label: 'Vé đã bán / Tổng sức chứa', 
      value: stats ? `${stats.totalTicketsSold.toLocaleString()} / ${stats.totalCapacity.toLocaleString()}` : '0 / 0', 
      // change: '+2', 
      icon: <HiOutlineTicket className="text-blue-500" size={24} />, 
      color: 'bg-blue-50' 
    },
    { 
      label: 'Đã Check-in (Soát vé)', 
      value: stats ? stats.totalTicketsCheckIn.toLocaleString() : '0', 
      // change: '+18.7%', 
      icon: <HiOutlineUserGroup className="text-purple-500" size={24} />, 
      color: 'bg-purple-50' 
    },
    { 
      label: 'Tỷ lệ lấp đầy (Occupancy)', 
      value: stats ? `${stats.occupancyRate.toFixed(1)}%` : '0%', 
      // change: '+5.1%', 
      icon: <HiOutlineChartBar className="text-orange-500" size={24} />, 
      color: 'bg-orange-50' 
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tổng quan hệ thống</h1>
          <p className="text-gray-500">Chào mừng trở lại! Dưới đây là số liệu thống kê thời gian thực.</p>
        </div>
        <button 
          onClick={fetchDashboardData}
          className="p-2 text-gray-500 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-all shadow-sm flex items-center gap-2"
        >
          <HiOutlineRefresh size={20} className={loading ? 'animate-spin' : ''} />
          <span className="text-sm font-medium">Làm mới</span>
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
            {loading && <div className="absolute inset-0 bg-white/80 z-10 animate-pulse" />}
            
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-xl ${stat.color}`}>
                {stat.icon}
              </div>
              {/* <span className={`text-sm font-bold ${stat.change?.startsWith('+') ? 'text-emerald-600' : 'text-rose-600'}`}>
                {stat.change}
              </span> */}
            </div>
            <h3 className="text-gray-500 text-sm font-medium">{stat.label}</h3>
            <p className="text-2xl font-bold text-gray-900 mt-1 truncate" title={stat.value}>
                {stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* Chart Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-3 bg-white rounded-2xl border border-gray-100 shadow-sm p-6 min-h-[400px]">
           <div className="flex items-center justify-between mb-6">
             <h3 className="text-lg font-bold text-gray-900">Hoạt động bán vé & Check-in</h3>
             <select className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-pink-500/20">
               <option>7 ngày qua</option>
               <option>30 ngày qua</option>
             </select>
           </div>
           
           {/* Placeholder cho Biểu đồ */}
           <div className="flex flex-col items-center justify-center h-[300px] text-gray-400 space-y-4 py-4 bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
             <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm">
               <HiOutlineChartBar size={32} className="text-gray-300" />
             </div>
             <div className="text-center">
               <p className="font-bold text-gray-600">Biểu đồ phân tích doanh thu</p>
               <p className="text-sm">Tính năng đang được tích hợp thư viện biểu đồ...</p>
             </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;