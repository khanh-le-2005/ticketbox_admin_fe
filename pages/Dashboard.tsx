import React, { useEffect, useState } from 'react';
import {
  HiOutlineUserGroup,
  HiOutlineCurrencyDollar,
  HiOutlineChartBar,
  HiOutlineTicket,
  HiOutlineRefresh,
  HiOutlineTrendingUp,
  HiOutlineTrendingDown,
  HiOutlineCalendar,
  HiOutlineCollection
} from 'react-icons/hi';

// Import API và Interface
import {
  getDashboardStats,
  getRevenueChart,
  DashboardStatResponse,
  RevenueChartResponse
} from '../apis/api_stats';

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStatResponse | null>(null);
  const [chartData, setChartData] = useState<RevenueChartResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [statsData, chartRes] = await Promise.all([
        getDashboardStats(),
        getRevenueChart()
      ]);
      setStats(statsData);
      setChartData(chartRes || []);
    } catch (error) {
      console.error("Lỗi tải dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [refreshKey]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0
    }).format(value);
  };

  const maxRevenue = Math.max(...chartData.map(d => d.revenue), 1);

  const statCards = [
    {
      label: 'Tổng doanh thu',
      value: stats ? formatCurrency(stats.totalRevenue) : '0 đ',
      trend: '+12.5%',
      isUp: true,
      icon: <HiOutlineCurrencyDollar size={24} />,
      color: 'from-emerald-500 to-teal-600',
      bgLight: 'bg-emerald-50',
      iconColor: 'text-emerald-600'
    },
    {
      label: 'Vé đã bán',
      value: stats ? stats.totalTicketsSold.toLocaleString() : '0',
      subValue: stats ? `/ ${stats.totalCapacity.toLocaleString()}` : '',
      trend: '+2.4%',
      isUp: true,
      icon: <HiOutlineTicket size={24} />,
      color: 'from-blue-500 to-indigo-600',
      bgLight: 'bg-blue-50',
      iconColor: 'text-blue-600'
    },
    {
      label: 'Đã Check-in',
      value: stats ? stats.totalTicketsCheckIn.toLocaleString() : '0',
      trend: '+18.7%',
      isUp: true,
      icon: <HiOutlineUserGroup size={24} />,
      color: 'from-purple-500 to-pink-600',
      bgLight: 'bg-purple-50',
      iconColor: 'text-purple-600'
    },
    {
      label: 'Tỷ lệ lấp đầy',
      value: stats ? `${stats.occupancyRate.toFixed(1)}%` : '0%',
      trend: '-1.2%',
      isUp: false,
      icon: <HiOutlineChartBar size={24} />,
      color: 'from-orange-400 to-red-500',
      bgLight: 'bg-orange-50',
      iconColor: 'text-orange-600'
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-100">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="px-3 py-1 bg-orange-100 text-orange-600 text-[10px] md:text-xs font-bold rounded-full uppercase tracking-wider">
              Real-time Insights
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight">
            Dashboard Tổng Quan
          </h1>
          <p className="text-slate-500 mt-1 text-sm md:text-base font-medium italic">
            Theo dõi hiệu suất hệ thống.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-xl border border-slate-100 text-slate-500 text-[12px] md:text-sm font-semibold">
            <HiOutlineCalendar size={18} />
            <span>{new Date().toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
          </div>
          <button
            onClick={() => setRefreshKey(prev => prev + 1)}
            disabled={loading}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-all shadow-lg shadow-slate-200 active:scale-95 disabled:opacity-50"
          >
            <div className={loading ? 'animate-spin' : ''}>
              <HiOutlineRefresh size={20} />
            </div>
            <span className="font-bold text-sm">Làm mới</span>
          </button>
        </div>
      </div>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, i) => (
          <div
            key={i}
            className="group relative bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden"
          >
            {loading && <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] z-10 animate-pulse" />}

            <div className="flex items-center justify-between mb-5">
              <div className={`p-4 rounded-2xl ${stat.bgLight} ${stat.iconColor} group-hover:scale-110 transition-transform`}>
                {stat.icon}
              </div>
              <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black ${stat.isUp ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                {stat.isUp ? <HiOutlineTrendingUp /> : <HiOutlineTrendingDown />}
                {stat.trend}
              </div>
            </div>

            <h3 className="text-slate-400 text-sm font-bold uppercase tracking-widest mb-1">{stat.label}</h3>
            <div className="flex items-baseline gap-1">
              <p className="text-2xl font-black text-slate-800 tracking-tighter">
                {stat.value}
              </p>
              {stat.subValue && <span className="text-xs font-bold text-slate-400">{stat.subValue}</span>}
            </div>

            {/* Subtle background decoration */}
            <div className={`absolute -right-4 -bottom-4 w-24 h-24 rounded-full bg-gradient-to-br ${stat.color} opacity-5 group-hover:opacity-10 transition-opacity`} />
          </div>
        ))}
      </div>

      {/* Main Analysis Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Revenue Chart - Custom Tailwind implementation */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-100 shadow-sm p-8 flex flex-col">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 md:mb-10 gap-4">
            <div>
              <h3 className="text-xl font-black text-slate-800 flex items-center gap-2">
                <span className="w-2 h-6 bg-orange-500 rounded-full inline-block"></span>
                Phân Tích Doanh Thu
              </h3>
              <p className="text-slate-400 text-[10px] md:text-xs font-bold mt-1 uppercase tracking-tight">Theo dõi biến động dòng tiền</p>
            </div>
            <select className="w-full sm:w-auto bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold text-slate-600 outline-none focus:ring-4 focus:ring-orange-500/10">
              <option>7 ngày gần nhất</option>
              <option>30 ngày gần nhất</option>
            </select>
          </div>

          <div className="flex-1 overflow-x-auto no-scrollbar pb-2">
            <div className="flex items-end gap-3 sm:gap-6 min-h-[300px] min-w-[600px] md:min-w-0 px-2 lg:px-4">
              {chartData.length > 0 ? (
                chartData.map((item, idx) => (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-3 group">
                    <div className="relative w-full flex flex-col items-center justify-end h-[240px]">
                      {/* Tooltip on hover */}
                      <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 text-white text-[10px] py-1 px-2 rounded-lg font-bold z-20 whitespace-nowrap">
                        {formatCurrency(item.revenue)}
                      </div>

                      {/* The Bar */}
                      <div
                        className="w-full max-w-[40px] bg-gradient-to-t from-orange-400 to-orange-600 rounded-t-xl hover:from-orange-500 hover:to-orange-700 transition-all duration-500 relative group-hover:shadow-lg group-hover:shadow-orange-200"
                        style={{ height: `${(item.revenue / maxRevenue) * 100}%`, minHeight: '4px' }}
                      >
                        <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity rounded-t-xl" />
                      </div>
                    </div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter truncate w-full text-center">
                      {item.timeLabel}
                    </span>
                  </div>
                ))
              ) : (
                <div className="w-full flex flex-col items-center justify-center text-slate-300 py-12 bg-slate-50 border border-dashed border-slate-200 rounded-3xl">
                  <div className="mb-4 opacity-50">
                    <HiOutlineCollection size={48} />
                  </div>
                  <p className="font-bold">Chưa có dữ liệu biểu đồ</p>
                  <p className="text-xs">Dòng tiền sẽ hiển thị khi có giao dịch mới.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action Widgets */}
        <div className="space-y-8">
          {/* Quick Stats Widget */}
          <div className="bg-slate-900 rounded-3xl p-8 text-white relative overflow-hidden shadow-xl shadow-slate-200">
            <h3 className="text-lg font-black mb-6 flex items-center gap-2">
              <div className="p-2 bg-white/10 rounded-lg text-orange-400">
                <HiOutlineTrendingUp />
              </div>
              Hiệu Suất
            </h3>

            <div className="space-y-6">
              <div>
                <div className="flex justify-between text-xs font-bold mb-2 uppercase tracking-widest text-slate-400">
                  <span>Tỷ lệ Check-in</span>
                  <span>{stats ? stats.checkInRate.toFixed(1) : 0}%</span>
                </div>
                <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-orange-500 to-red-500 transition-all duration-1000"
                    style={{ width: `${stats ? stats.checkInRate : 0}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-bold mb-2 uppercase tracking-widest text-slate-400">
                  <span>Vé đã thanh toán</span>
                  <span>84%</span>
                </div>
                <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-blue-400 to-indigo-500 w-[84%]" />
                </div>
              </div>

              <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Trạng thái</p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                    <span className="text-sm font-bold">Ổn định</span>
                  </div>
                </div>
                <button className="text-[10px] font-black underline uppercase hover:text-orange-400 transition-colors">Chi tiết</button>
              </div>
            </div>

            {/* Decoration */}
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <HiOutlineChartBar size={120} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;