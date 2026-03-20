// src/pages/SalesReport.tsx
import React, { useEffect, useState } from 'react';
import axiosClient from '@/axiosclient';
import {
    HiChevronDown,
    HiOutlineRefresh,
    HiOutlineTicket,
    HiOutlineCurrencyDollar,
    HiOutlineChartPie,
    HiOutlineCalendar,
    HiOutlineTicket as HiTicketIcon
} from 'react-icons/hi';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer
} from 'recharts';

// --- ĐỊNH NGHĨA TYPESCRIPT INTERFACES ---
interface ShowRevenue {
    showId: string;
    showName: string;
    revenue: string;      // "23.220.000 ₫"
    soldTickets: number;
    showStartTime: string; // "2026-03-07T20:00:00"
}

interface MonthlyRevenueData {
    year: number;
    month: number;
    totalPlatformRevenue: string; // "23.220.000 ₫"
    totalSoldTickets: number;
    showRevenues: ShowRevenue[];
}

interface ApiResponse {
    success: boolean;
    message: string;
    data: MonthlyRevenueData;
}

// --- COMPONENT CHÍNH ---
const SalesReport: React.FC = () => {
    const now = new Date();
    const [selectedYear, setSelectedYear] = useState<number>(now.getFullYear());
    const [selectedMonth, setSelectedMonth] = useState<number>(now.getMonth() + 1);
    
    const [reportData, setReportData] = useState<MonthlyRevenueData | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [refreshKey, setRefreshKey] = useState(0);

    // Danh sách năm (5 năm gần đây)
    const years = Array.from({ length: 5 }, (_, i) => now.getFullYear() - i);
    // Danh sách tháng
    const months = Array.from({ length: 12 }, (_, i) => i + 1);

    // 2. Lấy dữ liệu báo cáo
    useEffect(() => {
        const fetchSalesReport = async () => {
            try {
                setLoading(true);
                setError(null);
                const response = await axiosClient.get<ApiResponse>(`/shows/analytics/monthly-revenue`, {
                    params: {
                        year: selectedYear,
                        month: selectedMonth
                    }
                });

                const res: any = response;
                const finalData = res.data?.data || res.data || res;
                
                if (finalData && finalData.showRevenues) {
                    setReportData(finalData);
                } else {
                    setError('Dữ liệu không đúng định dạng');
                }
            } catch (err: any) {
                console.error("API Error:", err);
                setError(err.response?.data?.message || 'Có lỗi xảy ra khi gọi API');
            } finally {
                setLoading(false);
            }
        };

        fetchSalesReport();
    }, [selectedYear, selectedMonth, refreshKey]);

    // Helpers
    const formatDate = (dateString: string) => {
        if (!dateString) return "---";
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('vi-VN', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        }).format(date);
    };

    // Chuẩn bị dữ liệu cho biểu đồ (Top 5 show doanh thu cao nhất)
    const chartData = reportData ? reportData.showRevenues
        .map(s => ({
            name: s.showName.length > 20 ? s.showName.substring(0, 20) + '...' : s.showName,
            revenue: parseInt(s.revenue.replace(/[^0-9]/g, '')) || 0,
            originalName: s.showName
        }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5)
    : [];

    return (
        <div className="min-h-screen bg-slate-50/50 p-4 md:p-8 font-sans text-slate-800">
            <div className="max-w-7xl mx-auto space-y-6">

                {/* --- HEADER & BỘ LỌC --- */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm transition-all text-indigo-500">
                    <div>
                        <h1 className="text-2xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600 tracking-tight">
                            Báo Cáo Doanh Thu Tháng {selectedMonth}/{selectedYear}
                        </h1>
                        <p className="text-slate-500 text-sm mt-1 font-normal">
                            Tổng quan tình hình kinh doanh nền tảng theo từng tháng.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <div className="relative group">
                            <select
                                value={selectedYear}
                                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                                className="appearance-none pl-4 pr-10 py-2.5 bg-slate-50 border border-slate-200 text-slate-700 text-sm font-bold rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all cursor-pointer hover:bg-slate-100"
                            >
                                {years.map(y => <option key={y} value={y}>Năm {y}</option>)}
                            </select>
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                                <HiChevronDown size={18} />
                            </span>
                        </div>

                        <div className="relative group">
                          <select
                              value={selectedMonth}
                              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                              className="appearance-none pl-4 pr-10 py-2.5 bg-indigo-600 text-white border-transparent text-sm font-bold rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 transition-all cursor-pointer hover:bg-indigo-700 shadow-lg shadow-indigo-200"
                          >
                              {months.map(m => <option key={m} value={m}>Tháng {m}</option>)}
                          </select>
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-white pointer-events-none">
                            <HiChevronDown size={18} />
                          </span>
                        </div>

                        <button
                            onClick={() => setRefreshKey(prev => prev + 1)}
                            disabled={loading}
                            className="p-2.5 bg-white border border-slate-200 text-slate-700 rounded-2xl hover:bg-slate-50 hover:text-indigo-600 transition-all active:scale-95 disabled:opacity-50"
                        >
                            <span className={loading ? "animate-spin flex items-center" : "flex items-center"}>
                                <HiOutlineRefresh size={22} />
                            </span>
                        </button>
                    </div>
                </div>

                {/* --- TRẠNG THÁI HIỂN THỊ --- */}
                {loading && (
                    <div className="p-16 flex flex-col items-center justify-center bg-white rounded-3xl border border-slate-200 shadow-sm transition-all duration-300">
                        <div className="w-12 h-12 border-4 border-slate-100 border-t-indigo-500 rounded-full animate-spin mb-4"></div>
                        <p className="text-slate-500 font-medium">Đang chuẩn bị báo cáo tháng {selectedMonth}...</p>
                    </div>
                )}

                {error && (
                    <div className="p-12 flex flex-col items-center gap-4 bg-white rounded-3xl border border-rose-100 shadow-sm text-center">
                        <div className="p-5 bg-rose-50 text-rose-500 rounded-full">
                            <HiOutlineRefresh size={48} />
                        </div>
                        <div>
                            <p className="font-bold text-xl text-slate-800">Không tìm thấy dữ liệu</p>
                            <p className="text-sm text-slate-500 mt-1">{error}</p>
                        </div>
                    </div>
                )}

                {/* --- DỮ LIỆU BÁO CÁO CHÍNH --- */}
                {reportData && !loading && (
                    <div className="space-y-6">

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 flex items-center gap-6 hover:shadow-lg hover:shadow-indigo-500/5 transition-all group overflow-hidden relative">
                                <div className="p-5 bg-indigo-50 text-indigo-600 rounded-3xl group-hover:scale-110 transition-transform">
                                    <HiOutlineCurrencyDollar size={40} />
                                </div>
                                <div className="z-10">
                                    <p className="text-sm text-slate-400 font-bold uppercase tracking-wider mb-1">Tổng doanh thu nền tảng</p>
                                    <p className="text-4xl font-black text-slate-900 tracking-tight">{reportData.totalPlatformRevenue}</p>
                                </div>
                                <div className="absolute -right-4 -bottom-4 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity">
                                    <HiOutlineCurrencyDollar size={150} />
                                </div>
                            </div>

                            <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 flex items-center gap-6 hover:shadow-lg hover:shadow-emerald-500/5 transition-all group overflow-hidden relative">
                                <div className="p-5 bg-emerald-50 text-emerald-600 rounded-3xl group-hover:scale-110 transition-transform">
                                    <HiOutlineChartPie size={40} />
                                </div>
                                <div className="z-10">
                                    <p className="text-sm text-slate-400 font-bold uppercase tracking-wider mb-1">Tổng vé đã bán</p>
                                    <p className="text-4xl font-black text-slate-900 tracking-tight">{reportData.totalSoldTickets} <span className="text-lg font-bold text-slate-300">Vé</span></p>
                                </div>
                                <div className="absolute -right-4 -bottom-4 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity text-indigo-100">
                                    <HiOutlineTicket size={150} />
                                </div>
                            </div>
                        </div>

                        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col min-h-[400px]">
                            <div className="flex items-center justify-between mb-10">
                              <div className="flex items-center gap-3">
                                  <div className="w-2.5 h-8 bg-indigo-500 rounded-full"></div>
                                  <h2 className="text-xl font-black text-slate-800 tracking-tight">Top 5 Show có doanh thu cao nhất tháng</h2>
                              </div>
                            </div>
                            <div className="flex-1 w-full">
                                <ResponsiveContainer width="100%" height={300}>
                                    <BarChart data={chartData} margin={{ top: 20, right: 30, left: 40, bottom: 20 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                        <XAxis 
                                          dataKey="name" 
                                          axisLine={false} 
                                          tickLine={false} 
                                          tick={{ fill: '#94a3b8', fontSize: 13, fontWeight: 700 }}
                                          dy={10}
                                        />
                                        <YAxis 
                                          axisLine={false} 
                                          tickLine={false} 
                                          tick={{ fill: '#94a3b8', fontSize: 12 }} 
                                          tickFormatter={(val) => `${val / 1000000}tr`} 
                                        />
                                        <RechartsTooltip
                                            cursor={{ fill: '#f8fafc' }}
                                            contentStyle={{ 
                                              borderRadius: '20px', 
                                              border: 'none', 
                                              boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
                                              padding: '12px 16px'
                                            }}
                                            formatter={(value: number) => {
                                              const formatted = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
                                              return [formatted, 'Doanh thu'];
                                            }}
                                        />
                                        <Bar dataKey="revenue" fill="url(#barGradient)" radius={[10, 10, 10, 10]} barSize={50}>
                                          <defs>
                                            <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                                              <stop offset="0%" stopColor="#8b5cf6" />
                                              <stop offset="100%" stopColor="#6366f1" />
                                            </linearGradient>
                                          </defs>
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
                            <div className="px-8 py-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
                                <div className="flex items-center gap-3">
                                    <div className="w-2.5 h-8 bg-emerald-500 rounded-full"></div>
                                    <h2 className="text-xl font-black text-slate-800 tracking-tight text-emerald-600">Chi tiết doanh thu theo Show</h2>
                                </div>
                                <span className="bg-white px-4 py-1.5 rounded-full text-slate-500 text-xs font-bold border border-slate-200">
                                    {reportData.showRevenues.length} Show trong tháng
                                </span>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-white text-slate-400 text-xs uppercase font-black tracking-widest border-b border-slate-50 transition-all">
                                            <th className="px-8 py-6">Show diễn</th>
                                            <th className="px-6 py-6 text-center">Bắt đầu</th>
                                            <th className="px-6 py-6 text-center">Lượt vé</th>
                                            <th className="px-8 py-6 text-right">Doanh thu</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50 text-slate-700 bg-white">
                                        {reportData.showRevenues.map((show) => (
                                            <tr key={show.showId} className="group hover:bg-slate-50/50 transition-all duration-300">
                                                <td className="px-8 py-6">
                                                    <div className="flex flex-col">
                                                        <p className="font-bold text-slate-900 text-base group-hover:text-indigo-600 transition-colors line-clamp-1">{show.showName}</p>
                                                        <span className="text-[10px] text-slate-400 font-mono mt-0.5 opacity-60">ID: {show.showId}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-6 text-center">
                                                    <div className="inline-flex items-center gap-2 text-slate-500 text-xs font-semibold bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
                                                        <span className="text-slate-400"><HiOutlineCalendar size={14} /></span>
                                                        <span>{formatDate(show.showStartTime)}</span>
                                                    </div>
                                                  </td>
                                                <td className="px-6 py-6 text-center">
                                                    <div className="inline-flex items-center gap-1.5 font-bold text-slate-700">
                                                        <span className="bg-slate-100 text-slate-500 w-8 h-8 rounded-full flex items-center justify-center text-sm">{show.soldTickets}</span>
                                                        <span className="text-xs text-slate-400">vé</span>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6 text-right">
                                                    <span className="text-lg font-black bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 to-teal-600">
                                                        {show.revenue}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                        {reportData.showRevenues.length === 0 && (
                                            <tr>
                                                <td colSpan={4} className="px-8 py-20 text-center">
                                                    <div className="flex flex-col items-center gap-3">
                                                      <div className="p-4 bg-slate-50 rounded-full text-slate-300">
                                                        <HiTicketIcon size={40} />
                                                      </div>
                                                      <p className="text-slate-400 font-bold">Tháng này chưa có show nào phát sinh doanh thu.</p>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                    </div>
                )}
            </div>
            
            <style dangerouslySetInnerHTML={{ __html: `
                @keyframes fadeInUp {
                    from { opacity: 0; transform: translateY(15px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in-up {
                    animation: fadeInUp 0.4s ease-out forwards;
                }
            ` }} />
        </div>
    );
};

export default SalesReport;