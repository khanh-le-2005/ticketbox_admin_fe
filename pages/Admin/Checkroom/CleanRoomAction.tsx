import React, { useEffect, useState, Fragment } from "react";
import { Listbox, Transition } from "@headlessui/react";
import { toast } from "react-toastify";
import { Booking } from "./types";
import {
    CheckCircle2,
    Search,
    ChevronDown,
    RefreshCw,
    ClipboardList,
    Check,
    UserCircle,
    Calendar,
    AlertCircle,
    MousePointer2
} from "lucide-react";
import hotelApi from "@/apis/hotelApi";
import roomApi from "@/apis/roomApi";
import axiosClient from "@/axiosclient";
import { Hotel } from "@/type";

// --- CONFIG TRẠNG THÁI ---
const STATUS_MAP: Record<string, { label: string; color: string; bgColor: string; textColor: string }> = {
    VAC: { label: "VAC (Trống)", color: "bg-[#2ecc71]", bgColor: "bg-[#eafaf1]", textColor: "text-[#27ae60]" },
    ARR: { label: "ARR (Đến)", color: "bg-[#54e3d6]", bgColor: "bg-[#e8fdfc]", textColor: "text-[#008b8b]" },
    DEP: { label: "DEP (Đi)", color: "bg-[#f1c40f]", bgColor: "bg-[#fef9e7]", textColor: "text-[#b7950b]" },
    OCC: { label: "OCC (Ở)", color: "bg-[#e74c3c]", bgColor: "bg-[#fdedec]", textColor: "text-[#c0392b]" },
    "DAY-USE": { label: "DAY-USE", color: "bg-[#9b59b6]", bgColor: "bg-[#f4ecf7]", textColor: "text-[#8e44ad]" },
    OOO: { label: "OOO (Sửa)", color: "bg-[#7f8c8d]", bgColor: "bg-[#f2f4f4]", textColor: "text-[#7f8c8d]" },
};

interface HousekeepingTask {
    roomId: string;
    roomNumber: string;
    roomTypeName: string;
    currentStatus: string;
    guestStatus: string;
}

interface DailyStatus {
    date: string;
    state: string;
    bookingId: string | null;
    dirty: boolean;
}

interface RoomMatrix {
    roomId: string;
    roomNumber: string;
    roomType: string;
    dailyStatuses: DailyStatus[];
}

interface CleanRoomActionProps {
    booking?: Booking;
    onSuccess?: () => void;
}

const CleanRoomAction: React.FC<CleanRoomActionProps> = ({ booking, onSuccess }) => {
    const [taskList, setTaskList] = useState<HousekeepingTask[]>([]);
    const [matrixData, setMatrixData] = useState<RoomMatrix[]>([]);
    const [hotels, setHotels] = useState<Hotel[]>([]);
    const [cleanRoomId, setCleanRoomId] = useState<string>("");
    const [isLoading, setIsLoading] = useState(false);
    const isStandalone = !booking;
    const [selectedHotelId, setSelectedHotelId] = useState<string>(booking?.hotelId || "");
    const [fromDate, setFromDate] = useState("2026-01-29");
    const [toDate, setToDate] = useState("2026-02-05");

    // --- STATE CHO CONTEXT MENU (CHUỘT PHẢI) ---
    const [menuConfig, setMenuConfig] = useState<{
        roomId: string;
        roomNumber: string;
        date: string;
        x: number;
        y: number;
    } | null>(null);

    const selectedHotel = hotels.find(h => h.id === selectedHotelId);

    // Đóng menu khi click chuột trái bất kỳ đâu
    useEffect(() => {
        const closeMenu = () => setMenuConfig(null);
        window.addEventListener("click", closeMenu);
        window.addEventListener("contextmenu", (e) => {
            // Nếu click chuột phải vào vùng không phải ô matrix, cũng đóng menu cũ
            if (!(e.target as HTMLElement).closest('.matrix-cell')) closeMenu();
        });
        return () => {
            window.removeEventListener("click", closeMenu);
            window.removeEventListener("contextmenu", closeMenu);
        };
    }, []);

    // 1. Fetch Hotels & 2. Fetch Data (Giữ nguyên logic cũ của bạn)
    useEffect(() => {
        const fetchHotels = async () => {
            try {
                const res: any = await hotelApi.getAll();
                const content = res?.data?.content || (Array.isArray(res?.data) ? res.data : res);
                setHotels(Array.isArray(content) ? content : []);
                if (content.length > 0 && !selectedHotelId) setSelectedHotelId(content[0].id);
            } catch (e) { toast.error("Lỗi tải KS"); }
        };
        if (isStandalone) fetchHotels();
    }, [isStandalone]);

    const fetchData = async () => {
        if (!selectedHotelId) return;
        setIsLoading(true);
        try {
            const [resTasks, resMatrix]: any = await Promise.all([
                axiosClient.get(`/housekeeping/tasks`, { params: { hotelId: selectedHotelId } }),
                axiosClient.get(`/housekeeping/matrix`, { params: { hotelId: selectedHotelId, from: fromDate, to: toDate } })
            ]);
            setTaskList(Array.isArray(resTasks) ? resTasks : (resTasks?.data || []));
            setMatrixData(Array.isArray(resMatrix) ? resMatrix : (resMatrix?.data || []));
        } catch (e) { console.error(e); }
        finally { setIsLoading(false); }
    };

    useEffect(() => { if (selectedHotelId) fetchData(); }, [selectedHotelId, fromDate, toDate]);

    // --- XỬ LÝ CHUỘT PHẢI (CONTEXT MENU) ---
    const handleContextMenu = (e: React.MouseEvent, room: RoomMatrix, status: DailyStatus) => {
        e.preventDefault(); // CHẶN MENU TRÌNH DUYỆT
        setMenuConfig({
            roomId: room.roomId,
            roomNumber: room.roomNumber,
            date: status.date,
            x: e.clientX,
            y: e.clientY
        });
    };

    // Cập nhật trạng thái qua API
    const handleUpdateStatus = async (newState: string) => {
        if (!menuConfig) return;
        try {
            await axiosClient.put(`/housekeeping/matrix/status`, {
                hotelId: selectedHotelId,
                roomId: menuConfig.roomId,
                date: menuConfig.date,
                status: newState
            });
            toast.success(`Đã đổi P.${menuConfig.roomNumber} sang ${newState}`);
            fetchData();
        } catch (e) { toast.error("Lỗi cập nhật trạng thái"); }
        setMenuConfig(null);
    };

    const handleQuickClean = async (roomId: string) => {
        try {
            await roomApi.markRoomAsClean(selectedHotelId, roomId);
            toast.success("Phòng đã sạch!");
            fetchData();
        } catch (e) { toast.error("Lỗi"); }
    };

    if (isStandalone) {
        return (
            <div className="min-h-screen bg-[#f4f7f6] font-sans text-[#444] flex flex-col relative">

                {/* MENU CHUỘT PHẢI */}
                {menuConfig && (
                    <div
                        className="fixed z-[999] bg-white shadow-[0_10px_38px_rgba(0,0,0,0.15),0_10px_20px_rgba(0,0,0,0.1)] border border-gray-200 rounded-lg py-1.5 w-52 animate-in fade-in zoom-in-95 duration-100"
                        style={{ top: menuConfig.y, left: menuConfig.x }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="px-4 py-2 border-b border-gray-100 mb-1 bg-gray-50/50 rounded-t-lg">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Cập nhật trạng thái</p>
                            <p className="text-[12px] font-black text-[#005baa]">P.{menuConfig.roomNumber} • {menuConfig.date}</p>
                        </div>
                        {Object.entries(STATUS_MAP).map(([key, val]) => (
                            <button
                                key={key}
                                onClick={() => handleUpdateStatus(key)}
                                className="w-full text-left px-4 py-2.5 text-[11px] font-bold hover:bg-[#005baa] hover:text-white flex items-center gap-3 transition-all group"
                            >
                                <div className={`w-2.5 h-2.5 rounded-full ${val.color} group-hover:ring-2 group-hover:ring-white transition-all`}></div>
                                {val.label}
                            </button>
                        ))}
                    </div>
                )}

                {/* HEADER & TOOLBAR (Giữ nguyên giao diện ezCloud của bạn) */}
                <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-6 shadow-sm z-[50] sticky top-0">
                    <div className="flex-1"><div className="relative w-80"><input type="text" placeholder="Tìm kiếm..." className="w-full pl-3 pr-10 py-1.5 border border-gray-200 rounded text-sm outline-none focus:border-[#005baa]" /><Search className="absolute right-3 top-2 text-gray-400" size={16} /></div></div>
                    <div className="flex items-center gap-4">
                        <Listbox value={selectedHotelId} onChange={setSelectedHotelId}>
                            <div className="relative min-w-[250px]">
                                <Listbox.Button className="w-full text-left border border-gray-300 rounded px-3 py-1.5 font-bold text-[#005baa] uppercase text-xs">{selectedHotel?.name || "Chọn khách sạn"}</Listbox.Button>
                                <Transition as={Fragment} leave="transition duration-100" leaveFrom="opacity-100" leaveTo="opacity-0">
                                    <Listbox.Options className="absolute w-full mt-1 bg-white border border-gray-200 rounded shadow-xl z-[100] max-h-60 overflow-auto font-bold uppercase text-[10px] py-1">
                                        {hotels.map(h => <Listbox.Option key={h.id} value={h.id} className={({ active }) => `p-2.5 cursor-pointer ${active ? 'bg-gray-100 text-[#005baa]' : ''}`}>{h.name}</Listbox.Option>)}
                                    </Listbox.Options>
                                </Transition>
                            </div>
                        </Listbox>
                        <UserCircle size={28} className="text-gray-400" />
                    </div>
                </header>

                <div className="bg-white p-4 flex flex-wrap items-center gap-3 border-b border-gray-200 z-[40]">
                    <div className="flex flex-wrap gap-2 items-center">
                        <span className="text-[10px] font-bold text-gray-400 uppercase mr-1 flex items-center gap-1"><MousePointer2 size={10} /> Chuột phải để đổi:</span>
                        {Object.entries(STATUS_MAP).map(([key, val]) => (
                            <div key={key} className="flex items-center gap-1.5 bg-white px-2 py-1 rounded border border-gray-200 shadow-sm">
                                <div className={`w-2.5 h-2.5 rounded-sm ${val.color}`}></div>
                                <span className="text-[9px] font-bold text-gray-600 uppercase">{val.label}</span>
                            </div>
                        ))}
                    </div>
                    <div className="flex-1"></div>
                    <div className="flex items-center gap-2">
                        <Calendar size={14} className="text-gray-400" />
                        <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="border rounded px-2 py-1 text-[10px] font-bold text-[#005baa] outline-none" />
                        <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="border rounded px-2 py-1 text-[10px] font-bold text-[#005baa] outline-none" />
                        <button onClick={fetchData} className="p-2 hover:bg-gray-50 rounded-full text-gray-400"><RefreshCw size={18} className={isLoading ? "animate-spin" : ""} /></button>
                    </div>
                </div>

                {/* MATRIX VIEW */}
                <main className="flex-1 overflow-auto bg-white border-t border-gray-200">
                    <table className="w-full border-collapse text-[11px] table-fixed min-w-[1100px]">
                        <thead className="sticky top-0 z-[20] shadow-sm">
                            <tr className="bg-[#f8f9fa] border-b border-gray-200 uppercase font-bold text-gray-500">
                                <th className="p-3 text-left w-24 bg-[#f8f9fa] sticky left-0 z-30 border-r border-gray-200">PHÒNG</th>
                                {matrixData[0]?.dailyStatuses.map((s, i) => (
                                    <th key={i} className="border-r border-gray-200 p-2 text-center">{s.date.split('-').slice(1).reverse().join('/')}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {matrixData.map((room) => (
                                <tr key={room.roomId} className="hover:bg-gray-50/50 h-11 transition-colors group">
                                    <td className="p-2 border-r border-b border-gray-200 font-bold text-[#005baa] sticky left-0 bg-white z-10 shadow-[1px_0_0_0_#eee]">{room.roomNumber}</td>
                                    {room.dailyStatuses.map((status, idx) => {
                                        const config = STATUS_MAP[status.state] || { bgColor: "bg-white", textColor: "text-gray-400" };
                                        return (
                                            <td
                                                key={idx}
                                                onContextMenu={(e) => handleContextMenu(e, room, status)}
                                                onClick={() => status.dirty && handleQuickClean(room.roomId)}
                                                className={`matrix-cell border-r border-b border-gray-100 p-1 text-center relative cursor-pointer hover:bg-[#f0f7ff] transition-all ${status.dirty ? 'bg-red-50' : config.bgColor}`}
                                            >
                                                {status.dirty ? (
                                                    <div className="flex flex-col items-center justify-center h-full text-red-600">
                                                        <AlertCircle size={11} className="mb-0.5 animate-pulse" />
                                                        <span className="font-black uppercase text-[7px]">DIRTY</span>
                                                    </div>
                                                ) : (
                                                    <span className={`font-black text-[9px] uppercase tracking-tighter ${config.textColor}`}>
                                                        {status.state}
                                                    </span>
                                                )}
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </main>
            </div>
        );
    }

    return null;
};

export default CleanRoomAction;