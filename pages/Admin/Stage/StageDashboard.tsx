import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, UserCheck, Users, Lock, Grid, Crown, Loader2, BarChart2, Activity } from 'lucide-react';
import axiosClient from '@/axiosclient';
import { StageData } from '@/type/Stage.type';

const StageDashboardPage = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [allStages, setAllStages] = useState<StageData[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        axiosClient.get(`/stages`)
            .then((response: any) => {
                const list = Array.isArray(response) ? response : (response.data || []);
                setAllStages(list);
            })
            .catch(error => console.error(error))
            .finally(() => setLoading(false));
    }, []);

    const stageData = React.useMemo(() => {
        if (!allStages.length) return null;
        if (id && id !== "ALL") {
            return allStages.find(s => s.id === id) || null;
        }

        const aggStats: Record<string, number> = { AVAILABLE: 0, BOOKED: 0, WAITING: 0, CHECKED_IN: 0, guest: 0, RESERVED: 0 };
        const aggTypes: Record<string, number> = { standard: 0, vip: 0, custom: 0, guest: 0, blocked: 0 };
        const aggDetails: Record<string, Record<string, number>> = {};
        
        allStages.forEach((s: any) => {
            const sStats = s.seatStatusCounts || {};
            const sTypes = s.seatTypeCounts || {};
            const sDetails = s.seatDetailedStats || {};

            Object.keys(sStats).forEach(k => { aggStats[k] = (aggStats[k] || 0) + (sStats[k] || 0); });
            Object.keys(sTypes).forEach(k => { aggTypes[k] = (aggTypes[k] || 0) + (sTypes[k] || 0); });

            Object.keys(sDetails).forEach(type => {
                if (!aggDetails[type]) aggDetails[type] = {};
                Object.keys(sDetails[type]).forEach(status => {
                    aggDetails[type][status] = (aggDetails[type][status] || 0) + (sDetails[type][status] || 0);
                });
            });
        });

        const aggregateData: any = {
            id: "ALL",
            name: `Hệ thống (${allStages.length} sơ đồ)`,
            zones: [],
            lastModified: new Date().toISOString(),
            seatStatusCounts: aggStats,
            seatTypeCounts: aggTypes,
            seatDetailedStats: aggDetails
        };
        return aggregateData as StageData;
    }, [id, allStages]);

    if (loading) {
        return (
            <div className="flex flex-col h-full min-h-[500px] items-center justify-center text-indigo-500">
                <Loader2 className="w-10 h-10 animate-spin mb-4" />
                <p className="font-semibold">Đang tải dữ liệu thống kê...</p>
            </div>
        );
    }

    if (!stageData) {
        return (
            <div className="flex flex-col h-full min-h-[500px] items-center justify-center gap-4">
                <p className="text-gray-500 text-lg">Không tìm thấy dữ liệu sơ đồ.</p>
                <button onClick={() => navigate('/stage')} className="px-5 py-2 bg-indigo-600 text-white rounded-xl font-bold">Về trang Quản lý</button>
            </div>
        );
    }

    const stats = stageData.seatStatusCounts || {};
    const types = stageData.seatTypeCounts || {};
    const details = stageData.seatDetailedStats || {};

    const totalSeats = (types.vip || 0) + (types.standard || 0) + (types.guest || 0);
    const bookedSeats = (stats.BOOKED || 0) + (stats.WAITING || 0) + (stats.CHECKED_IN || 0) + (stats.guest || 0);
    const percentage = totalSeats > 0 ? Math.round((bookedSeats / totalSeats) * 100) : 0;

    return (
        <div className="p-6 md:p-8 max-w-7xl mx-auto font-sans">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/stage')} className="p-3 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors shadow-sm focus:outline-none">
                        <ArrowLeft size={20} className="text-gray-600" />
                    </button>
                    <div>
                        <h1 className="text-2xl md:text-3xl font-black text-gray-800 flex items-center gap-3">
                            <BarChart2 className="text-indigo-600" /> Dashboard Phân Tích
                        </h1>
                        <p className="text-sm text-gray-500 font-medium mt-1">Sơ đồ sân khấu: <span className="text-indigo-600 font-bold">{stageData.name}</span></p>
                    </div>
                </div>

                <div className="bg-white px-4 py-3 border border-gray-200 rounded-xl shadow-sm flex items-center gap-3">
                    <label className="text-sm font-bold text-gray-600">Chọn sân khấu:</label>
                    <select 
                        className="bg-gray-50 border border-gray-200 text-gray-800 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-2.5 outline-none font-semibold cursor-pointer w-full md:w-auto"
                        value={id || "ALL"}
                        onChange={(e) => {
                            if (e.target.value === "ALL") {
                                navigate('/stage/dashboard');
                            } else {
                                navigate(`/stage/dashboard/${e.target.value}`);
                            }
                        }}
                    >
                        {/* <option value="ALL">Tổng hợp tất cả hệ thống</option> */}
                        {allStages.map(s => (
                            <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Overview */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 mb-8 flex flex-col md:flex-row items-center gap-8">
                <div className="flex-1 w-full">
                    <h2 className="text-lg font-bold text-gray-700 mb-2">Tỷ lệ lấp đầy</h2>
                    <div className="flex items-end gap-2 mb-4">
                        <span className="text-5xl font-black text-indigo-600">{percentage}%</span>
                        <span className="text-sm font-medium text-gray-500 mb-1">({bookedSeats}/{totalSeats} ghế mở bán)</span>
                    </div>
                    <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                        <div 
                            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-1000"
                            style={{ width: `${percentage}%` }}
                        />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Stats Card */}
                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 md:p-8">
                    <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                        <span>📊</span> Trạng thái hiện tại
                    </h3>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center"><Grid size={18} className="text-slate-600" /></div>
                                <span className="font-semibold text-slate-700">🟢 Ghế trống (AVAILABLE)</span>
                            </div>
                            <span className="text-xl font-black text-slate-800">{stats.AVAILABLE || 0}</span>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-yellow-50 border border-yellow-100 rounded-2xl">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-yellow-200 flex items-center justify-center"><UserCheck size={18} className="text-yellow-700" /></div>
                                <span className="font-semibold text-yellow-800">🟡 Đã đặt (BOOKED)</span>
                            </div>
                            <span className="text-xl font-black text-yellow-800">{stats.BOOKED || 0}</span>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-purple-50 border border-purple-100 rounded-2xl">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-purple-200 flex items-center justify-center"><Activity size={18} className="text-purple-700" /></div>
                                <span className="font-semibold text-purple-800">🔵 Đang chờ (WAITING)</span>
                            </div>
                            <span className="text-xl font-black text-purple-800">{stats.WAITING || 0}</span>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-green-50 border border-green-100 rounded-2xl">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-green-200 flex items-center justify-center"><UserCheck size={18} className="text-green-700" /></div>
                                <span className="font-semibold text-green-800"> Đã Check-in</span>
                            </div>
                            <span className="text-xl font-black text-green-800">{stats.CHECKED_IN || 0}</span>
                        </div>
                    </div>
                </div>

                {/* Types Card */}
                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 md:p-8">
                    <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                        <span>💎</span> Chi tiết từng hạng vé
                    </h3>
                    <div className="grid grid-cols-1 gap-5">
                        <div className="flex flex-col p-5 border-2 border-red-100 bg-white rounded-2xl shadow-sm hover:border-red-300 transition-colors">
                            <div className="flex items-center justify-between mb-4 border-b border-red-50 pb-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-red-100 rounded-lg"><Crown size={20} className="text-red-600" /></div>
                                    <div>
                                        <h4 className="font-bold text-gray-800">Hạng VIP</h4>
                                        <p className="text-xs text-gray-500 font-medium mt-1">Ghế thương gia / đặc biệt</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className="text-[10px] text-gray-400 font-black uppercase tracking-wider mr-1">Tổng</span>
                                    <span className="text-2xl font-black text-gray-800">{types.vip || 0}</span>
                                </div>
                            </div>
                            <ul className="space-y-3 text-sm font-semibold">
                                <li className="flex justify-between items-center text-slate-500"><span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-slate-300"></div> Đang trống:</span> <span className="font-bold text-slate-700">{details.vip?.AVAILABLE || 0} vé</span></li>
                                <li className="flex justify-between items-center text-yellow-600"><span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-yellow-400"></div> Đã đặt / Giữ:</span> <span className="font-bold">{(details.vip?.BOOKED || 0) + (details.vip?.WAITING || 0)} vé</span></li>
                                <li className="flex justify-between items-center text-green-600"><span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-green-500"></div> Đã Check-in:</span> <span className="font-bold">{details.vip?.CHECKED_IN || 0} vé</span></li>
                            </ul>
                        </div>

                        <div className="flex flex-col p-5 border-2 border-blue-100 bg-white rounded-2xl shadow-sm hover:border-blue-300 transition-colors">
                            <div className="flex items-center justify-between mb-4 border-b border-blue-50 pb-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-blue-100 rounded-lg"><Users size={20} className="text-blue-600" /></div>
                                    <div>
                                        <h4 className="font-bold text-gray-800">Hạng Standard</h4>
                                        <p className="text-xs text-gray-500 font-medium mt-1">Ghế tiêu chuẩn phổ thông</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className="text-[10px] text-gray-400 font-black uppercase tracking-wider mr-1">Tổng</span>
                                    <span className="text-2xl font-black text-gray-800">{types.standard || 0}</span>
                                </div>
                            </div>
                            <ul className="space-y-3 text-sm font-semibold">
                                <li className="flex justify-between items-center text-slate-500"><span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-slate-300"></div> Đang trống:</span> <span className="font-bold text-slate-700">{details.standard?.AVAILABLE || 0} vé</span></li>
                                <li className="flex justify-between items-center text-yellow-600"><span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-yellow-400"></div> Đã đặt / Giữ:</span> <span className="font-bold">{(details.standard?.BOOKED || 0) + (details.standard?.WAITING || 0)} vé</span></li>
                                <li className="flex justify-between items-center text-green-600"><span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-green-500"></div> Đã Check-in:</span> <span className="font-bold">{details.standard?.CHECKED_IN || 0} vé</span></li>
                            </ul>
                        </div>

                        <div className="flex items-center justify-between p-5 border-2 border-gray-100 bg-gray-50 rounded-2xl">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-gray-200 rounded-lg"><Lock size={20} className="text-gray-600" /></div>
                                <div>
                                    <h4 className="font-bold text-gray-700">Ghế Blocked</h4>
                                    <p className="text-xs text-gray-500 font-medium mt-1">Không kinh doanh / Đã khóa</p>
                                </div>
                            </div>
                            <span className="text-2xl font-black text-gray-600">{types.blocked || 0}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StageDashboardPage;
