// // import React, { useEffect, useState } from 'react';
// // import {
// //   HiOutlineUserGroup,
// //   HiOutlineCurrencyDollar,
// //   HiOutlineChartBar,
// //   HiOutlineTicket,
// //   HiOutlineRefresh,
// //   HiOutlineTrendingUp,
// //   HiOutlineTrendingDown,
// //   HiOutlineCalendar,
// //   HiOutlineCollection
// // } from 'react-icons/hi';

// // // Import API và Interface
// // import {
// //   getDashboardStats,
// //   getRevenueChart,
// //   DashboardStatResponse,
// //   RevenueChartResponse
// // } from '../apis/api_stats';

// // const Dashboard: React.FC = () => {
// //   const [stats, setStats] = useState<DashboardStatResponse | null>(null);
// //   const [chartData, setChartData] = useState<RevenueChartResponse[]>([]);
// //   const [loading, setLoading] = useState(true);
// //   const [refreshKey, setRefreshKey] = useState(0);

// //   const fetchDashboardData = async () => {
// //     setLoading(true);
// //     try {
// //       const [statsData, chartRes] = await Promise.all([
// //         getDashboardStats(),
// //         getRevenueChart()
// //       ]);
// //       setStats(statsData);
// //       setChartData(chartRes || []);
// //     } catch (error) {
// //       console.error("Lỗi tải dashboard:", error);
// //     } finally {
// //       setLoading(false);
// //     }
// //   };

// //   useEffect(() => {
// //     fetchDashboardData();
// //   }, [refreshKey]);

// //   const formatCurrency = (value: number) => {
// //     return new Intl.NumberFormat('vi-VN', {
// //       style: 'currency',
// //       currency: 'VND',
// //       maximumFractionDigits: 0
// //     }).format(value);
// //   };

// //   const maxRevenue = Math.max(...chartData.map(d => d.revenue), 1);

// //   const statCards = [
// //     {
// //       label: 'Tổng doanh thu',
// //       value: stats ? formatCurrency(stats.totalRevenue) : '0 đ',
// //       trend: '+12.5%',
// //       isUp: true,
// //       icon: <HiOutlineCurrencyDollar size={24} />,
// //       color: 'from-emerald-500 to-teal-600',
// //       bgLight: 'bg-emerald-50',
// //       iconColor: 'text-emerald-600'
// //     },
// //     {
// //       label: 'Vé đã bán',
// //       value: stats ? stats.totalTicketsSold.toLocaleString() : '0',
// //       subValue: stats ? `/ ${stats.totalCapacity.toLocaleString()}` : '',
// //       trend: '+2.4%',
// //       isUp: true,
// //       icon: <HiOutlineTicket size={24} />,
// //       color: 'from-blue-500 to-indigo-600',
// //       bgLight: 'bg-blue-50',
// //       iconColor: 'text-blue-600'
// //     },
// //     {
// //       label: 'Đã Check-in',
// //       value: stats ? stats.totalTicketsCheckIn.toLocaleString() : '0',
// //       trend: '+18.7%',
// //       isUp: true,
// //       icon: <HiOutlineUserGroup size={24} />,
// //       color: 'from-purple-500 to-pink-600',
// //       bgLight: 'bg-purple-50',
// //       iconColor: 'text-purple-600'
// //     },
// //     {
// //       label: 'Tỷ lệ lấp đầy',
// //       value: stats ? `${stats.occupancyRate.toFixed(1)}%` : '0%',
// //       trend: '-1.2%',
// //       isUp: false,
// //       icon: <HiOutlineChartBar size={24} />,
// //       color: 'from-orange-400 to-red-500',
// //       bgLight: 'bg-orange-50',
// //       iconColor: 'text-orange-600'
// //     },
// //   ];

// //   return (
// //     <div className="space-y-8 animate-in fade-in duration-500">
// //       {/* Header Section */}
// //       <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-100">
// //         <div>
// //           <div className="flex items-center gap-3 mb-2">
// //             <span className="px-3 py-1 bg-orange-100 text-orange-600 text-[10px] md:text-xs font-bold rounded-full uppercase tracking-wider">
// //               Real-time Insights
// //             </span>
// //           </div>
// //           <h1 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight">
// //             Dashboard Tổng Quan
// //           </h1>
// //           <p className="text-slate-500 mt-1 text-sm md:text-base font-medium italic">
// //             Theo dõi hiệu suất hệ thống.
// //           </p>
// //         </div>

// //         <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
// //           <div className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-xl border border-slate-100 text-slate-500 text-[12px] md:text-sm font-semibold">
// //             <HiOutlineCalendar size={18} />
// //             <span>{new Date().toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
// //           </div>
// //           <button
// //             onClick={() => setRefreshKey(prev => prev + 1)}
// //             disabled={loading}
// //             className="flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-all shadow-lg shadow-slate-200 active:scale-95 disabled:opacity-50"
// //           >
// //             <div className={loading ? 'animate-spin' : ''}>
// //               <HiOutlineRefresh size={20} />
// //             </div>
// //             <span className="font-bold text-sm">Làm mới</span>
// //           </button>
// //         </div>
// //       </div>

// //       {/* Stats Cards Grid */}
// //       <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
// //         {statCards.map((stat, i) => (
// //           <div
// //             key={i}
// //             className="group relative bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden"
// //           >
// //             {loading && <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] z-10 animate-pulse" />}

// //             <div className="flex items-center justify-between mb-5">
// //               <div className={`p-4 rounded-2xl ${stat.bgLight} ${stat.iconColor} group-hover:scale-110 transition-transform`}>
// //                 {stat.icon}
// //               </div>
// //               <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black ${stat.isUp ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
// //                 {stat.isUp ? <HiOutlineTrendingUp /> : <HiOutlineTrendingDown />}
// //                 {stat.trend}
// //               </div>
// //             </div>

// //             <h3 className="text-slate-400 text-sm font-bold uppercase tracking-widest mb-1">{stat.label}</h3>
// //             <div className="flex items-baseline gap-1">
// //               <p className="text-2xl font-black text-slate-800 tracking-tighter">
// //                 {stat.value}
// //               </p>
// //               {stat.subValue && <span className="text-xs font-bold text-slate-400">{stat.subValue}</span>}
// //             </div>

// //             {/* Subtle background decoration */}
// //             <div className={`absolute -right-4 -bottom-4 w-24 h-24 rounded-full bg-gradient-to-br ${stat.color} opacity-5 group-hover:opacity-10 transition-opacity`} />
// //           </div>
// //         ))}
// //       </div>

// //       {/* Main Analysis Section */}
// //       <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
// //         {/* Revenue Chart - Custom Tailwind implementation */}
// //         <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-100 shadow-sm p-8 flex flex-col">
// //           <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 md:mb-10 gap-4">
// //             <div>
// //               <h3 className="text-xl font-black text-slate-800 flex items-center gap-2">
// //                 <span className="w-2 h-6 bg-orange-500 rounded-full inline-block"></span>
// //                 Phân Tích Doanh Thu
// //               </h3>
// //               <p className="text-slate-400 text-[10px] md:text-xs font-bold mt-1 uppercase tracking-tight">Theo dõi biến động dòng tiền</p>
// //             </div>
// //             <select className="w-full sm:w-auto bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold text-slate-600 outline-none focus:ring-4 focus:ring-orange-500/10">
// //               <option>7 ngày gần nhất</option>
// //               <option>30 ngày gần nhất</option>
// //             </select>
// //           </div>

// //           <div className="flex-1 overflow-x-auto no-scrollbar pb-2">
// //             <div className="flex items-end gap-3 sm:gap-6 min-h-[300px] min-w-[600px] md:min-w-0 px-2 lg:px-4">
// //               {chartData.length > 0 ? (
// //                 chartData.map((item, idx) => (
// //                   <div key={idx} className="flex-1 flex flex-col items-center gap-3 group">
// //                     <div className="relative w-full flex flex-col items-center justify-end h-[240px]">
// //                       {/* Tooltip on hover */}
// //                       <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 text-white text-[10px] py-1 px-2 rounded-lg font-bold z-20 whitespace-nowrap">
// //                         {formatCurrency(item.revenue)}
// //                       </div>

// //                       {/* The Bar */}
// //                       <div
// //                         className="w-full max-w-[40px] bg-gradient-to-t from-orange-400 to-orange-600 rounded-t-xl hover:from-orange-500 hover:to-orange-700 transition-all duration-500 relative group-hover:shadow-lg group-hover:shadow-orange-200"
// //                         style={{ height: `${(item.revenue / maxRevenue) * 100}%`, minHeight: '4px' }}
// //                       >
// //                         <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity rounded-t-xl" />
// //                       </div>
// //                     </div>
// //                     <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter truncate w-full text-center">
// //                       {item.timeLabel}
// //                     </span>
// //                   </div>
// //                 ))
// //               ) : (
// //                 <div className="w-full flex flex-col items-center justify-center text-slate-300 py-12 bg-slate-50 border border-dashed border-slate-200 rounded-3xl">
// //                   <div className="mb-4 opacity-50">
// //                     <HiOutlineCollection size={48} />
// //                   </div>
// //                   <p className="font-bold">Chưa có dữ liệu biểu đồ</p>
// //                   <p className="text-xs">Dòng tiền sẽ hiển thị khi có giao dịch mới.</p>
// //                 </div>
// //               )}
// //             </div>
// //           </div>
// //         </div>

// //         {/* Action Widgets */}
// //         <div className="space-y-8">
// //           {/* Quick Stats Widget */}
// //           <div className="bg-slate-900 rounded-3xl p-8 text-white relative overflow-hidden shadow-xl shadow-slate-200">
// //             <h3 className="text-lg font-black mb-6 flex items-center gap-2">
// //               <div className="p-2 bg-white/10 rounded-lg text-orange-400">
// //                 <HiOutlineTrendingUp />
// //               </div>
// //               Hiệu Suất
// //             </h3>

// //             <div className="space-y-6">
// //               <div>
// //                 <div className="flex justify-between text-xs font-bold mb-2 uppercase tracking-widest text-slate-400">
// //                   <span>Tỷ lệ Check-in</span>
// //                   <span>{stats ? stats.checkInRate.toFixed(1) : 0}%</span>
// //                 </div>
// //                 <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
// //                   <div
// //                     className="h-full bg-gradient-to-r from-orange-500 to-red-500 transition-all duration-1000"
// //                     style={{ width: `${stats ? stats.checkInRate : 0}%` }}
// //                   />
// //                 </div>
// //               </div>

// //               <div>
// //                 <div className="flex justify-between text-xs font-bold mb-2 uppercase tracking-widest text-slate-400">
// //                   <span>Vé đã thanh toán</span>
// //                   <span>84%</span>
// //                 </div>
// //                 <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
// //                   <div className="h-full bg-gradient-to-r from-blue-400 to-indigo-500 w-[84%]" />
// //                 </div>
// //               </div>

// //               <div className="pt-4 border-t border-white/5 flex items-center justify-between">
// //                 <div>
// //                   <p className="text-[10px] font-bold text-slate-400 uppercase">Trạng thái</p>
// //                   <div className="flex items-center gap-1.5 mt-1">
// //                     <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
// //                     <span className="text-sm font-bold">Ổn định</span>
// //                   </div>
// //                 </div>
// //                 <button className="text-[10px] font-black underline uppercase hover:text-orange-400 transition-colors">Chi tiết</button>
// //               </div>
// //             </div>

// //             {/* Decoration */}
// //             <div className="absolute top-0 right-0 p-4 opacity-10">
// //               <HiOutlineChartBar size={120} />
// //             </div>
// //           </div>
// //         </div>
// //       </div>
// //     </div>
// //   );
// // };

// // export default Dashboard;

// import React, { useEffect, useState } from 'react';
// import {
//   HiOutlineUserGroup,
//   HiOutlineCurrencyDollar,
//   HiOutlineChartBar,
//   HiOutlineTicket,
//   HiOutlineRefresh,
//   HiOutlineTrendingUp,
//   HiOutlineTrendingDown,
//   HiOutlineCalendar,
//   HiOutlineSelector,
//   HiOutlineCollection
// } from 'react-icons/hi';

// import axiosClient from '@/axiosclient'; 

// // --- 1. ĐỊNH NGHĨA TYPE ---

// interface ShowItem {
//   _id: string; 
//   id?: string; 
//   name: string; 
// }

// // Type cho State hiển thị lên UI
// interface DashboardUIState {
//   title: string;
//   totalRevenue: number;
//   ticketsSold: number;
//   totalCapacity: number;
//   ticketsCheckedIn: number;
//   occupancyRate: number;
// }

// interface RevenueChartResponse {
//   timeLabel: string;
//   revenue: number;
// }

// const Dashboard: React.FC = () => {
//   const [showList, setShowList] = useState<ShowItem[]>([]);
//   const [selectedShowId, setSelectedShowId] = useState<string>('ALL');

//   const [stats, setStats] = useState<DashboardUIState | null>(null);
//   const [chartData, setChartData] = useState<RevenueChartResponse[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [refreshKey, setRefreshKey] = useState(0);

//   // --- 2. HÀM LẤY DANH SÁCH SHOW ---
//   useEffect(() => {
//     const fetchShowList = async () => {
//       try {
//         // GET {{base_url}}/api/shows
//         const response = await axiosClient.get('/shows');
//         const resData = response.data; 

//         let finalArray: ShowItem[] = [];
//         if (resData?.content && Array.isArray(resData.content)) {
//            finalArray = resData.content;
//         } else if (resData?.data && Array.isArray(resData.data)) {
//            finalArray = resData.data;
//         } else if (Array.isArray(resData)) {
//            finalArray = resData;
//         } 
//         setShowList(finalArray);
//       } catch (error) {
//         console.error("Lỗi tải danh sách show:", error);
//       }
//     };
//     fetchShowList();
//   }, []);

//   // --- 3. HÀM LẤY DỮ LIỆU THỐNG KÊ (QUAN TRỌNG) ---
//   const fetchDashboardData = async () => {
//     setLoading(true);
//     try {
//       let uiData: DashboardUIState = {
//         title: '', totalRevenue: 0, ticketsSold: 0, totalCapacity: 0, ticketsCheckedIn: 0, occupancyRate: 0
//       };

//       if (selectedShowId === 'ALL') {
//         // === TRƯỜNG HỢP 1: TẤT CẢ (Giữ nguyên logic cũ) ===
//         // API: {{base_url}}/api/stats/dashboard
//         const response = await axiosClient.get('/stats/dashboard');
//         const d = response.data;

//         uiData = {
//           title: 'Toàn Hệ Thống',
//           totalRevenue: d.totalRevenue || 0,
//           ticketsSold: d.totalTicketsSold || 0,
//           totalCapacity: d.totalCapacity || 0,
//           ticketsCheckedIn: d.totalTicketsCheckIn || 0,
//           occupancyRate: d.occupancyRate || 0
//         };

//         // Giả lập chart cho tổng
//         setChartData([
//             { timeLabel: 'T2', revenue: 0 }, { timeLabel: 'T3', revenue: 0 },
//             { timeLabel: 'T4', revenue: 0 }, { timeLabel: 'T5', revenue: 0 },
//             { timeLabel: 'T6', revenue: (d.totalRevenue || 0) * 0.2 },
//             { timeLabel: 'T7', revenue: (d.totalRevenue || 0) * 0.5 }, 
//             { timeLabel: 'CN', revenue: (d.totalRevenue || 0) * 0.3 },
//         ]);

//       } else {
//         // === TRƯỜNG HỢP 2: SHOW CỤ THỂ (API BẠN YÊU CẦU) ===
//         // API: {{base_url}}/api/shows/{{show id}}/stats
//         // Lưu ý: axiosClient đã có base_url/api nên chỉ cần truyền /shows/...

//         console.log(`Đang gọi API chi tiết cho show: ${selectedShowId}`);
//         const response = await axiosClient.get(`/shows/${selectedShowId}/stats`);

//         // Dữ liệu nằm trong response.data.data theo JSON bạn cung cấp
//         const d = response.data.data;

//         // Map dữ liệu từ JSON vào State UI
//         uiData = {
//           title: d.showName,           // "LIVESHOW 05/02..."
//           totalRevenue: d.totalRevenue,// 0.0
//           ticketsSold: d.ticketsSold,  // 0
//           totalCapacity: d.totalCapacity, // 679
//           ticketsCheckedIn: d.ticketsScanned, // 0 (Map ticketsScanned -> ticketsCheckedIn)
//           occupancyRate: d.occupancyRate // 0.0
//         };

//         // Với show cụ thể, nếu chưa có API chart, ta set rỗng hoặc giả lập
//         setChartData([]); 
//       }

//       setStats(uiData);

//     } catch (error) {
//       console.error("Lỗi tải thống kê:", error);
//       setStats({ title: 'Không có dữ liệu', totalRevenue: 0, ticketsSold: 0, totalCapacity: 0, ticketsCheckedIn: 0, occupancyRate: 0 });
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchDashboardData();
//   }, [selectedShowId, refreshKey]);

//   // --- HELPER FORMAT ---
//   const formatCurrency = (value: number) => {
//     return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(value);
//   };

//   const maxRevenue = chartData.length > 0 ? Math.max(...chartData.map(d => d.revenue), 1) : 1;

//   // --- 4. CẤU HÌNH THẺ STATS ---
//   const statCards = [
//     {
//       label: 'Tổng doanh thu',
//       value: stats ? formatCurrency(stats.totalRevenue) : '0 đ',
//       trend: stats?.title || '...',
//       isUp: true,
//       icon: <HiOutlineCurrencyDollar size={24} />,
//       color: 'from-emerald-500 to-teal-600',
//       bgLight: 'bg-emerald-50',
//       iconColor: 'text-emerald-600'
//     },
//     {
//       label: 'Vé đã bán',
//       value: stats ? stats.ticketsSold.toLocaleString() : '0',
//       subValue: stats ? `/ ${stats.totalCapacity.toLocaleString()}` : '',
//       trend: stats && stats.totalCapacity > 0 ? `${((stats.ticketsSold / stats.totalCapacity) * 100).toFixed(1)}% Tổng` : '0%',
//       isUp: true,
//       icon: <HiOutlineTicket size={24} />,
//       color: 'from-blue-500 to-indigo-600',
//       bgLight: 'bg-blue-50',
//       iconColor: 'text-blue-600'
//     },
//     {
//       label: 'Đã Check-in',
//       value: stats ? stats.ticketsCheckedIn.toLocaleString() : '0', // Đây là ticketsScanned từ API
//       trend: 'Thực tế',
//       isUp: true,
//       icon: <HiOutlineUserGroup size={24} />,
//       color: 'from-purple-500 to-pink-600',
//       bgLight: 'bg-purple-50',
//       iconColor: 'text-purple-600'
//     },
//     {
//       label: 'Tỷ lệ lấp đầy',
//       value: stats ? `${stats.occupancyRate.toFixed(1)}%` : '0%',
//       trend: 'Công suất',
//       isUp: (stats?.occupancyRate || 0) > 50,
//       icon: <HiOutlineChartBar size={24} />,
//       color: 'from-orange-400 to-red-500',
//       bgLight: 'bg-orange-50',
//       iconColor: 'text-orange-600'
//     },
//   ];

//   const checkInRate = stats && stats.ticketsSold > 0 ? (stats.ticketsCheckedIn / stats.ticketsSold) * 100 : 0;

//   return (
//     <div className="space-y-8 animate-in fade-in duration-500">
//       {/* Header Section */}
//       <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-100">
//         <div className="w-full lg:w-1/2">
//           <div className="flex items-center gap-3 mb-2">
//             <span className="px-3 py-1 bg-orange-100 text-orange-600 text-[10px] md:text-xs font-bold rounded-full uppercase tracking-wider">
//               Real-time Insights
//             </span>
//           </div>
//           <h1 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight">
//             Dashboard Tổng Quan
//           </h1>

//           <div className="mt-4">
//             <label className="text-slate-500 text-sm font-bold mb-1 block">Chọn phạm vi thống kê:</label>

//             <div className="relative">
//                 <HiOutlineSelector className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
//                 <select
//                     value={selectedShowId}
//                     onChange={(e) => setSelectedShowId(e.target.value)}
//                     className="w-full md:max-w-md appearance-none bg-slate-50 border border-slate-200 text-slate-700 text-sm font-bold py-3 pl-4 pr-10 rounded-xl outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all cursor-pointer shadow-sm"
//                 >
//                     <option value="ALL">📊 Tất cả Show (Toàn hệ thống)</option>
//                     <optgroup label="Danh sách Show">
//                         {Array.isArray(showList) && showList.length > 0 ? (
//                             showList.map((show: any) => (
//                                 <option key={show.id || show._id} value={show.id || show._id}>
//                                     🎵 {show.name}
//                                 </option>
//                             ))
//                         ) : (
//                             <option disabled>Đang tải danh sách...</option>
//                         )}
//                     </optgroup>
//                 </select>
//             </div>
//           </div>
//         </div>

//         <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
//           <div className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-xl border border-slate-100 text-slate-500 text-[12px] md:text-sm font-semibold">
//             <HiOutlineCalendar size={18} />
//             <span>{new Date().toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
//           </div>
//           <button onClick={() => setRefreshKey(prev => prev + 1)} disabled={loading} className="flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-all shadow-lg shadow-slate-200 active:scale-95 disabled:opacity-50">
//             <div className={loading ? 'animate-spin' : ''}><HiOutlineRefresh size={20} /></div>
//             <span className="font-bold text-sm">Làm mới</span>
//           </button>
//         </div>
//       </div>

//       {/* Stats Cards Grid */}
//       <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
//         {statCards.map((stat, i) => (
//           <div key={i} className="group relative bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden">
//             {loading && <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] z-10 animate-pulse" />}
//             <div className="flex items-center justify-between mb-5">
//               <div className={`p-4 rounded-2xl ${stat.bgLight} ${stat.iconColor} group-hover:scale-110 transition-transform`}>{stat.icon}</div>
//               <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black ${stat.isUp ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
//                 {stat.isUp ? <HiOutlineTrendingUp /> : <HiOutlineTrendingDown />}
//                 <span className="max-w-[100px] truncate">{stat.trend}</span>
//               </div>
//             </div>
//             <h3 className="text-slate-400 text-sm font-bold uppercase tracking-widest mb-1">{stat.label}</h3>
//             <div className="flex items-baseline gap-1">
//               <p className="text-2xl font-black text-slate-800 tracking-tighter">{stat.value}</p>
//               {stat.subValue && <span className="text-xs font-bold text-slate-400">{stat.subValue}</span>}
//             </div>
//             <div className={`absolute -right-4 -bottom-4 w-24 h-24 rounded-full bg-gradient-to-br ${stat.color} opacity-5 group-hover:opacity-10 transition-opacity`} />
//           </div>
//         ))}
//       </div>

//       {/* Main Analysis Section */}
//       <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
//         <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-100 shadow-sm p-8 flex flex-col">
//           <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 md:mb-10 gap-4">
//             <div>
//               <h3 className="text-xl font-black text-slate-800 flex items-center gap-2">
//                 <span className="w-2 h-6 bg-orange-500 rounded-full inline-block"></span>
//                 Biểu đồ Doanh Thu
//               </h3>
//               <p className="text-slate-400 text-[10px] md:text-xs font-bold mt-1 uppercase tracking-tight">
//                 Phạm vi: {selectedShowId === 'ALL' ? 'Toàn bộ hệ thống' : stats?.title}
//               </p>
//             </div>
//           </div>

//           <div className="flex-1 overflow-x-auto no-scrollbar pb-2">
//             {/* Logic hiển thị biểu đồ */}
//             {chartData.length > 0 ? (
//                 <div className="flex items-end gap-3 sm:gap-6 min-h-[300px] min-w-[600px] md:min-w-0 px-2 lg:px-4">
//                 {chartData.map((item, idx) => (
//                     <div key={idx} className="flex-1 flex flex-col items-center gap-3 group">
//                     <div className="relative w-full flex flex-col items-center justify-end h-[240px]">
//                         <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 text-white text-[10px] py-1 px-2 rounded-lg font-bold z-20 whitespace-nowrap">
//                         {formatCurrency(item.revenue)}
//                         </div>
//                         <div className="w-full max-w-[40px] bg-gradient-to-t from-orange-400 to-orange-600 rounded-t-xl hover:from-orange-500 hover:to-orange-700 transition-all duration-500 relative group-hover:shadow-lg group-hover:shadow-orange-200" style={{ height: `${(item.revenue / maxRevenue) * 100}%`, minHeight: '4px' }}>
//                         <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity rounded-t-xl" />
//                         </div>
//                     </div>
//                     <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter truncate w-full text-center">{item.timeLabel}</span>
//                     </div>
//                 ))}
//                 </div>
//             ) : (
//                 <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 py-12 bg-slate-50 border border-dashed border-slate-200 rounded-3xl">
//                   <HiOutlineCollection size={48} className="mb-4 opacity-50" />
//                   <p className="font-bold">Chưa có dữ liệu biểu đồ cho show này</p>
//                 </div>
//             )}
//           </div>
//         </div>

//         {/* Efficiency Widget */}
//         <div className="space-y-8">
//           <div className="bg-slate-900 rounded-3xl p-8 text-white relative overflow-hidden shadow-xl shadow-slate-200">
//             <h3 className="text-lg font-black mb-6 flex items-center gap-2">
//               <div className="p-2 bg-white/10 rounded-lg text-orange-400"><HiOutlineTrendingUp /></div>
//               Hiệu Suất
//             </h3>
//             <div className="space-y-6">
//               <div>
//                 <div className="flex justify-between text-xs font-bold mb-2 uppercase tracking-widest text-slate-400">
//                   <span>Tỷ lệ Check-in</span>
//                   <span>{checkInRate.toFixed(1)}%</span>
//                 </div>
//                 <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
//                   <div className="h-full bg-gradient-to-r from-orange-500 to-red-500 transition-all duration-1000" style={{ width: `${checkInRate}%` }} />
//                 </div>
//               </div>
//               <div>
//                 <div className="flex justify-between text-xs font-bold mb-2 uppercase tracking-widest text-slate-400">
//                   <span>Công suất (Lấp đầy)</span>
//                   <span>{stats ? stats.occupancyRate.toFixed(1) : 0}%</span>
//                 </div>
//                 <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
//                   <div className="h-full bg-gradient-to-r from-blue-400 to-indigo-500 transition-all duration-1000" style={{ width: `${stats?.occupancyRate || 0}%` }} />
//                 </div>
//               </div>
//             </div>
//             <div className="absolute top-0 right-0 p-4 opacity-10"><HiOutlineChartBar size={120} /></div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default Dashboard;


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
  HiChevronDown,
  HiOutlineCollection,
  HiOutlinePresentationChartLine
} from 'react-icons/hi';

import axiosClient from '@/axiosclient';

// --- 1. ĐỊNH NGHĨA TYPE (GIỮ NGUYÊN) ---
interface ShowItem {
  _id: string;
  id?: string;
  name: string;
}

interface DashboardUIState {
  title: string;
  totalRevenue: number;
  ticketsSold: number;
  totalCapacity: number;
  ticketsCheckedIn: number;
  occupancyRate: number;
}

interface RevenueChartResponse {
  timeLabel: string;
  revenue: number;
}

const Dashboard: React.FC = () => {
  const [showList, setShowList] = useState<ShowItem[]>([]);
  const [selectedShowId, setSelectedShowId] = useState<string>('ALL');

  const [stats, setStats] = useState<DashboardUIState | null>(null);
  const [chartData, setChartData] = useState<RevenueChartResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  // --- 2. LOGIC API (GIỮ NGUYÊN) ---
  useEffect(() => {
    const fetchShowList = async () => {
      try {
        const response = await axiosClient.get('/shows');
        const resData = response.data;
        let finalArray: ShowItem[] = [];
        if (resData?.content && Array.isArray(resData.content)) {
          finalArray = resData.content;
        } else if (resData?.data && Array.isArray(resData.data)) {
          finalArray = resData.data;
        } else if (Array.isArray(resData)) {
          finalArray = resData;
        }
        setShowList(finalArray);
      } catch (error) {
        console.error("Lỗi tải danh sách show:", error);
      }
    };
    fetchShowList();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      let uiData: DashboardUIState = {
        title: '', totalRevenue: 0, ticketsSold: 0, totalCapacity: 0, ticketsCheckedIn: 0, occupancyRate: 0
      };

      if (selectedShowId === 'ALL') {
        const response = await axiosClient.get('/stats/dashboard');
        const d = response.data;
        uiData = {
          title: 'Toàn Hệ Thống',
          totalRevenue: d.totalRevenue || 0,
          ticketsSold: d.totalTicketsSold || 0,
          totalCapacity: d.totalCapacity || 0,
          ticketsCheckedIn: d.totalTicketsCheckIn || 0,
          occupancyRate: d.occupancyRate || 0
        };
        setChartData([
          { timeLabel: 'T2', revenue: 0 }, { timeLabel: 'T3', revenue: 0 },
          { timeLabel: 'T4', revenue: 0 }, { timeLabel: 'T5', revenue: 0 },
          { timeLabel: 'T6', revenue: (d.totalRevenue || 0) * 0.2 },
          { timeLabel: 'T7', revenue: (d.totalRevenue || 0) * 0.5 },
          { timeLabel: 'CN', revenue: (d.totalRevenue || 0) * 0.3 },
        ]);
      } else {
        const response = await axiosClient.get(`/shows/${selectedShowId}/stats`);
        const d = response.data.data;
        uiData = {
          title: d.showName,
          totalRevenue: d.totalRevenue,
          ticketsSold: d.ticketsSold,
          totalCapacity: d.totalCapacity,
          ticketsCheckedIn: d.ticketsScanned,
          occupancyRate: d.occupancyRate
        };
        setChartData([]);
      }
      setStats(uiData);
    } catch (error) {
      console.error("Lỗi tải thống kê:", error);
      setStats({ title: 'Không có dữ liệu', totalRevenue: 0, ticketsSold: 0, totalCapacity: 0, ticketsCheckedIn: 0, occupancyRate: 0 });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [selectedShowId, refreshKey]);

  // --- HELPER ---
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(value);
  };

  const maxRevenue = chartData.length > 0 ? Math.max(...chartData.map(d => d.revenue), 1) : 1;
  const checkInRate = stats && stats.ticketsSold > 0 ? (stats.ticketsCheckedIn / stats.ticketsSold) * 100 : 0;

  // --- CẤU HÌNH UI CARDS ---
  const statCards = [
    {
      label: 'Tổng Doanh Thu',
      value: stats ? formatCurrency(stats.totalRevenue) : '0 ₫',
      subText: 'Doanh thu thực tế',
      trend: '+12.5%', // Giả lập trend
      isUp: true,
      icon: <HiOutlineCurrencyDollar size={22} />,
      colorClass: 'text-emerald-600 bg-emerald-100/50',
      borderClass: 'border-emerald-200'
    },
    {
      label: 'Vé Đã Bán',
      value: stats ? stats.ticketsSold.toLocaleString() : '0',
      subText: stats ? `Tổng sức chứa: ${stats.totalCapacity.toLocaleString()}` : '',
      trend: stats && stats.totalCapacity > 0 ? `${((stats.ticketsSold / stats.totalCapacity) * 100).toFixed(1)}%` : '0%',
      isUp: true,
      icon: <HiOutlineTicket size={22} />,
      colorClass: 'text-blue-600 bg-blue-100/50',
      borderClass: 'border-blue-200'
    },
    {
      label: 'Check-in',
      value: stats ? stats.ticketsCheckedIn.toLocaleString() : '0',
      subText: 'Khách đã vào cổng',
      trend: 'Real-time',
      isUp: true,
      icon: <HiOutlineUserGroup size={22} />,
      colorClass: 'text-violet-600 bg-violet-100/50',
      borderClass: 'border-violet-200'
    },
    {
      label: 'Công Suất',
      value: stats ? `${stats.occupancyRate.toFixed(1)}%` : '0%',
      subText: 'Tỷ lệ lấp đầy',
      trend: '-1.2%',
      isUp: false,
      icon: <HiOutlineChartBar size={22} />,
      colorClass: 'text-rose-600 bg-rose-100/50',
      borderClass: 'border-rose-200'
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50/50 p-6 space-y-6 animate-in fade-in duration-500 font-sans text-slate-800">

      {/* 1. TOP CONTROL BAR */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Dashboard Overview</h1>
          <p className="text-slate-500 text-sm mt-1">
            Xin chào, dưới đây là tổng quan tình hình kinh doanh hôm nay.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          {/* Custom Select Dropdown */}
          <div className="relative group min-w-[280px]">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
              <HiOutlinePresentationChartLine size={18} />
            </div>
            <select
              value={selectedShowId}
              onChange={(e) => setSelectedShowId(e.target.value)}
              className="appearance-none w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 text-slate-700 text-sm font-semibold rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer hover:bg-slate-100"
            >
              <option value="ALL">Toàn bộ hệ thống</option>
              {Array.isArray(showList) && showList.length > 0 && (
                <optgroup label="Chọn Show cụ thể">
                  {showList.map((show: any) => (
                    <option key={show.id || show._id} value={show.id || show._id}>
                      {show.name}
                    </option>
                  ))}
                </optgroup>
              )}
            </select>
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
              <HiChevronDown size={16} />
            </div>
          </div>

          <button
            onClick={() => setRefreshKey(prev => prev + 1)}
            disabled={loading}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 hover:text-slate-900 transition-all active:scale-95 disabled:opacity-50 font-semibold text-sm shadow-sm"
          >
            <HiOutlineRefresh size={18} className={loading ? 'animate-spin' : ''} />
            <span>Làm mới</span>
          </button>
        </div>
      </div>

      {/* 2. STATS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {statCards.map((stat, index) => (
          <div key={index} className="relative bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-slate-200 transition-all duration-300">
            {loading && (
              <div className="absolute inset-0 bg-white/80 backdrop-blur-[1px] z-10 rounded-2xl animate-pulse flex items-center justify-center">
                <div className="h-2 w-1/3 bg-slate-200 rounded"></div>
              </div>
            )}
            <div className="flex justify-between items-start mb-4">
              <div className={`p-3 rounded-xl ${stat.colorClass}`}>
                {stat.icon}
              </div>
              <div className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full ${stat.isUp ? 'text-emerald-600 bg-emerald-50' : 'text-rose-600 bg-rose-50'}`}>
                {stat.isUp ? <HiOutlineTrendingUp /> : <HiOutlineTrendingDown />}
                {stat.trend}
              </div>
            </div>

            <div className="space-y-1">
              <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider">{stat.label}</p>
              <h3 className="text-2xl font-extrabold text-slate-800 tracking-tight">{stat.value}</h3>
              <p className="text-xs text-slate-400 font-medium truncate">{stat.subText}</p>
            </div>
          </div>
        ))}
      </div>

      {/* 3. CHART & WIDGET SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Main Chart Area */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col h-[420px]">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="text-lg font-bold text-slate-800">Biểu đồ Doanh Thu</h3>
              <p className="text-xs text-slate-500 mt-1">
                Dữ liệu hiển thị cho: <span className="font-semibold text-indigo-600">{selectedShowId === 'ALL' ? 'Toàn bộ hệ thống' : stats?.title}</span>
              </p>
            </div>
            <div className="flex items-center gap-2 px-3 py-1 bg-slate-50 rounded-lg border border-slate-100">
              <HiOutlineCalendar size={14} className="text-slate-400" />
              <span className="text-xs font-medium text-slate-600">7 ngày gần nhất</span>
            </div>
          </div>

          <div className="flex-1 w-full overflow-hidden relative">
            {chartData.length > 0 ? (
              <div className="flex items-end justify-between h-full w-full gap-2 sm:gap-4 pb-2 px-2">
                {chartData.map((item, idx) => {
                  const heightPercent = (item.revenue / maxRevenue) * 100;
                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end group cursor-pointer">
                      {/* Tooltip */}
                      <div className="mb-2 opacity-0 group-hover:opacity-100 transition-all duration-200 transform translate-y-2 group-hover:translate-y-0">
                        <span className="bg-slate-800 text-white text-[10px] font-bold py-1 px-2 rounded shadow-lg whitespace-nowrap">
                          {formatCurrency(item.revenue)}
                        </span>
                      </div>
                      {/* Bar Track */}
                      <div className="w-full max-w-[40px] h-[85%] bg-slate-50 rounded-t-lg relative flex items-end overflow-hidden">
                        {/* Actual Bar */}
                        <div
                          className="w-full bg-indigo-500 hover:bg-indigo-600 transition-all duration-500 ease-out rounded-t-lg relative"
                          style={{ height: `${heightPercent}%`, minHeight: '4px' }}
                        >
                          {/* Shine effect */}
                          <div className="absolute top-0 left-0 right-0 h-[1px] bg-white/30"></div>
                        </div>
                      </div>
                      <span className="mt-3 text-[11px] font-semibold text-slate-400 group-hover:text-indigo-600 transition-colors">
                        {item.timeLabel}
                      </span>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 bg-slate-50/30 rounded-xl border border-dashed border-slate-200">
                <div className="p-4 bg-slate-100 rounded-full mb-3">
                  <HiOutlineCollection size={32} className="text-slate-300" />
                </div>
                <p className="text-sm font-semibold">Chưa có dữ liệu biểu đồ</p>
                <p className="text-xs mt-1 text-slate-400">Vui lòng chọn show khác hoặc thử lại sau</p>
              </div>
            )}
          </div>
        </div>

        {/* Side Widget: Performance */}
        <div className="bg-slate-900 rounded-2xl p-6 text-white flex flex-col shadow-xl shadow-slate-200 relative overflow-hidden h-[420px]">
          {/* Background decoration */}
          <div className="absolute top-0 right-0 p-8 opacity-5 transform translate-x-10 -translate-y-10">
            <HiOutlineChartBar size={180} />
          </div>

          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-8">
              <div className="p-2 bg-indigo-500 rounded-lg shadow-lg shadow-indigo-500/30">
                <HiOutlinePresentationChartLine size={20} className="text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold">Hiệu Suất</h3>
                <p className="text-xs text-slate-400">Theo dõi tỷ lệ chuyển đổi</p>
              </div>
            </div>

            <div className="space-y-8">
              {/* Stat 1 */}
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-slate-300 font-medium">Tỷ lệ Check-in</span>
                  <span className="font-bold text-white">{checkInRate.toFixed(1)}%</span>
                </div>
                <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-400 to-teal-500 shadow-[0_0_10px_rgba(52,211,153,0.5)] transition-all duration-1000"
                    style={{ width: `${checkInRate}%` }}
                  />
                </div>
                <p className="text-[10px] text-slate-500 mt-2 text-right">Dựa trên vé đã bán</p>
              </div>

              {/* Stat 2 */}
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-slate-300 font-medium">Lấp đầy rạp (Occupancy)</span>
                  <span className="font-bold text-white">{stats ? stats.occupancyRate.toFixed(1) : 0}%</span>
                </div>
                <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-400 to-purple-500 shadow-[0_0_10px_rgba(129,140,248,0.5)] transition-all duration-1000"
                    style={{ width: `${stats?.occupancyRate || 0}%` }}
                  />
                </div>
                <p className="text-[10px] text-slate-500 mt-2 text-right">Dựa trên tổng ghế</p>
              </div>
            </div>

            <div className="mt-auto pt-8">
              <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700/50 backdrop-blur-sm">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                  <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Hệ thống ổn định</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Dữ liệu được cập nhật theo thời gian thực. Báo cáo chi tiết sẽ được gửi vào cuối ngày.
                </p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;