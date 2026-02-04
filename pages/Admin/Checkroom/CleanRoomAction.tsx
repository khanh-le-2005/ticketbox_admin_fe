// import React, { useEffect, useState, Fragment } from "react";
// import { Listbox, Transition } from "@headlessui/react";
// import { toast } from "react-toastify";
// import { Booking } from "./types";
// import {
//     CheckCircle2,
//     Search,
//     ChevronDown,
//     RefreshCw,
//     ClipboardList,
//     Check,
//     UserCircle,
//     Calendar,
//     AlertCircle
// } from "lucide-react";
// import hotelApi from "@/apis/hotelApi";
// import roomApi from "@/apis/roomApi";
// import axiosClient from "@/axiosclient";
// import { Hotel } from "@/type";

// // --- INTERFACES ---
// interface HousekeepingTask {
//     roomId: string;
//     roomNumber: string;
//     roomTypeName: string;
//     currentStatus: string;
//     guestStatus: string;
// }

// interface DailyStatus {
//     date: string;
//     state: string;
//     bookingId: string | null;
//     dirty: boolean;
// }

// interface RoomMatrix {
//     roomId: string;
//     roomNumber: string;
//     roomType: string;
//     dailyStatuses: DailyStatus[];
// }

// interface CleanRoomActionProps {
//     booking?: Booking;
//     onSuccess?: () => void;
// }

// const CleanRoomAction: React.FC<CleanRoomActionProps> = ({ booking, onSuccess }) => {
//     // States cho dữ liệu
//     const [taskList, setTaskList] = useState<HousekeepingTask[]>([]);
//     const [matrixData, setMatrixData] = useState<RoomMatrix[]>([]);
//     const [hotels, setHotels] = useState<Hotel[]>([]);

//     // States cho UI
//     const [cleanRoomId, setCleanRoomId] = useState<string>("");
//     const [isLoading, setIsLoading] = useState(false);
//     const isStandalone = !booking;
//     const [selectedHotelId, setSelectedHotelId] = useState<string>(booking?.hotelId || "");

//     // Filter cho Matrix (Mặc định lấy từ JSON của bạn)
//     const [fromDate, setFromDate] = useState("2026-01-29");
//     const [toDate, setToDate] = useState("2026-02-05");

//     const selectedHotel = hotels.find(h => h.id === selectedHotelId);
//     const selectedTask = taskList.find(t => t.roomId === cleanRoomId);

//     // 1. Lấy danh sách khách sạn
//     useEffect(() => {
//         const fetchHotels = async () => {
//             if (!isStandalone && booking?.hotelId) {
//                 setSelectedHotelId(booking.hotelId);
//                 return;
//             }
//             try {
//                 const res: any = await hotelApi.getAll();
//                 const contentList = res?.data?.content || (Array.isArray(res?.data) ? res.data : res);
//                 const mappedData = Array.isArray(contentList) ? contentList : [];
//                 setHotels(mappedData);
//                 if (mappedData.length > 0 && !selectedHotelId) {
//                     setSelectedHotelId(mappedData[0].id);
//                 }
//             } catch (error) {
//                 toast.error("Không thể tải danh sách khách sạn");
//             }
//         };
//         fetchHotels();
//     }, [isStandalone, booking?.hotelId]);

//     // 2. Lấy danh sách nhiệm vụ dọn dẹp (Tasks)
//     const fetchHousekeepingTasks = async () => {
//         if (!selectedHotelId) return;
//         try {
//             const res: any = await axiosClient.get(`/housekeeping/tasks`, {
//                 params: { hotelId: selectedHotelId }
//             });
//             const data = Array.isArray(res) ? res : (res?.data || []);
//             setTaskList(data);
//         } catch (error) {
//             setTaskList([]);
//         }
//     };

//     // 3. Lấy dữ liệu Matrix (Lịch dọn phòng)
//     const fetchMatrixData = async () => {
//         if (!selectedHotelId) return;
//         setIsLoading(true);
//         try {
//             const res: any = await axiosClient.get(`/housekeeping/matrix`, {
//                 params: { 
//                     hotelId: selectedHotelId,
//                     from: fromDate,
//                     to: toDate
//                 }
//             });
//             const data = Array.isArray(res) ? res : (res?.data || []);
//             setMatrixData(data);
//         } catch (error) {
//             console.error("Lỗi gọi API Matrix:", error);
//             setMatrixData([]);
//         } finally {
//             setIsLoading(false);
//         }
//     };

//     // Refresh dữ liệu khi hotelId hoặc ngày thay đổi
//     useEffect(() => {
//         if (selectedHotelId) {
//             fetchHousekeepingTasks();
//             fetchMatrixData();
//         }
//     }, [selectedHotelId, fromDate, toDate]);

//     const handleClean = async (roomId: string) => {
//         try {
//             await roomApi.markRoomAsClean(selectedHotelId, roomId);
//             toast.success("Đã cập nhật trạng thái phòng: Sạch");
//             fetchHousekeepingTasks();
//             fetchMatrixData();
//             if (onSuccess) onSuccess();
//         } catch (error: any) {
//             toast.error(error?.response?.data?.message || "Lỗi cập nhật");
//         }
//     };

//     // Tạo Header ngày cho bảng Matrix
//     const getMatrixDates = () => {
//         if (matrixData.length === 0) return [];
//         return matrixData[0].dailyStatuses.map(s => s.date);
//     };

//     if (isStandalone) {
//         return (
//             <div className="min-h-screen bg-[#f4f7f6] font-sans text-[#444] flex flex-col">
//                 {/* HEADER */}
//                 <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-6 shadow-sm z-[50] sticky top-0">
//                     <div className="flex items-center gap-4 flex-1">
//                         <div className="relative w-96">
//                             <input type="text" placeholder="Tìm mã đặt phòng, tên khách" className="w-full pl-3 pr-10 py-1.5 border border-gray-200 rounded text-sm focus:outline-none focus:border-[#005baa]" />
//                             <Search className="absolute right-3 top-2 text-gray-400" size={16} />
//                         </div>
//                     </div>

//                     <div className="flex items-center gap-6 justify-end">
//                         <div className="min-w-[250px] relative">
//                             <Listbox value={selectedHotelId} onChange={setSelectedHotelId}>
//                                 <div className="relative">
//                                     <Listbox.Button className="relative w-full cursor-pointer rounded border border-gray-300 bg-white py-1.5 pl-3 pr-10 text-left text-sm focus:outline-none focus:border-[#005baa]">
//                                         <span className="block truncate font-bold text-[#005baa] uppercase">{selectedHotel?.name || "Chọn khách sạn..."}</span>
//                                         <span className="absolute inset-y-0 right-0 flex items-center pr-2"><ChevronDown className="h-4 w-4 text-gray-400" /></span>
//                                     </Listbox.Button>
//                                     <Transition as={Fragment} leave="transition duration-100" leaveFrom="opacity-100" leaveTo="opacity-0">
//                                         <Listbox.Options className="absolute mt-1 max-h-60 w-full overflow-auto rounded bg-white py-1 text-sm shadow-xl z-[100] border border-gray-200">
//                                             {hotels.map((h) => (
//                                                 <Listbox.Option key={h.id} value={h.id} className={({ active }) => `cursor-pointer py-2.5 pl-10 pr-4 border-b border-gray-50 last:border-0 uppercase font-bold ${active ? 'bg-gray-100 text-[#005baa]' : 'text-gray-900'}`}>
//                                                     {h.name}
//                                                 </Listbox.Option>
//                                             ))}
//                                         </Listbox.Options>
//                                     </Transition>
//                                 </div>
//                             </Listbox>
//                         </div>
//                     </div>
//                 </header>

//                 {/* TOOLBAR */}
//                 <div className="bg-white p-4 flex items-center gap-4 border-b border-gray-200 z-[40]">
//                     <div className="flex gap-2">
//                         <span className="bg-[#54e3d6] text-white px-3 py-1 rounded text-[11px] font-bold uppercase shadow-sm">Nhận phòng</span>
//                         <span className="bg-[#f1c40f] text-white px-3 py-1 rounded text-[11px] font-bold uppercase shadow-sm">Đã đặt</span>
//                         <span className="bg-[#7f8c8d] text-white px-3 py-1 rounded text-[11px] font-bold uppercase shadow-sm">ĐANG SỬA</span>
//                     </div>
//                     <div className="flex-1"></div>
//                     <div className="flex items-center gap-2">
//                         <Calendar size={16} className="text-gray-400" />
//                         <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="border rounded px-2 py-1 text-xs outline-none focus:border-[#005baa]" />
//                         <span className="text-gray-400">-</span>
//                         <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="border rounded px-2 py-1 text-xs outline-none focus:border-[#005baa]" />
//                     </div>
//                     <button onClick={() => { fetchHousekeepingTasks(); fetchMatrixData(); }} className="p-2 hover:bg-gray-50 rounded-full transition-colors text-gray-400">
//                         <RefreshCw size={18} className={isLoading ? "animate-spin" : ""} />
//                     </button>
//                 </div>

//                 {/* MATRIX VIEW */}
//                 <main className="flex-1 overflow-auto bg-white">
//                     <table className="w-full border-collapse text-[11px]">
//                         <thead className="sticky top-0 z-[20] shadow-sm">
//                             <tr className="bg-[#f8f9fa]">
//                                 <th className="border border-gray-200 p-2 text-left w-24 bg-[#f8f9fa] sticky left-0 z-30 font-bold text-gray-600">Phòng</th>
//                                 {getMatrixDates().map((date, idx) => (
//                                     <th key={idx} className="border border-gray-200 p-2 text-center font-bold text-gray-600 min-w-[80px]">
//                                         {date.split('-').slice(1).reverse().join('/')}
//                                     </th>
//                                 ))}
//                             </tr>
//                         </thead>
//                         <tbody>
//                             {isLoading && matrixData.length === 0 ? (
//                                 <tr><td colSpan={10} className="p-10 text-center text-gray-400 italic">Đang tải dữ liệu Matrix...</td></tr>
//                             ) : matrixData.length === 0 ? (
//                                 <tr><td colSpan={10} className="p-10 text-center text-gray-400 italic">Không có dữ liệu hiển thị</td></tr>
//                             ) : (
//                                 matrixData.map((room) => (
//                                     <tr key={room.roomId} className="hover:bg-gray-50 h-10 transition-colors">
//                                         <td className="border border-gray-200 p-2 font-bold text-[#005baa] sticky left-0 bg-white z-10 shadow-[1px_0_0_0_#eee]">
//                                             {room.roomNumber}
//                                         </td>
//                                         {room.dailyStatuses.map((status, idx) => (
//                                             <td 
//                                                 key={idx} 
//                                                 className={`border border-gray-200 p-1 text-center relative group ${status.dirty ? 'bg-red-50' : ''}`}
//                                             >
//                                                 {status.dirty ? (
//                                                     <button 
//                                                         onClick={() => handleClean(room.roomId)}
//                                                         className="flex flex-col items-center justify-center w-full h-full text-red-600"
//                                                         title="Bấm để xác nhận dọn xong"
//                                                     >
//                                                         <AlertCircle size={14} className="mb-0.5 animate-pulse" />
//                                                         <span className="font-bold uppercase text-[9px]">Dirty</span>
//                                                     </button>
//                                                 ) : (
//                                                     <span className="text-gray-300 font-medium">{status.state}</span>
//                                                 )}
//                                             </td>
//                                         ))}
//                                     </tr>
//                                 ))
//                             )}
//                         </tbody>
//                     </table>
//                 </main>
//             </div>
//         );
//     }

//     // WIDGET DỌN PHÒNG NHANH (Dùng cho Booking Sidebar)
//     return (
//         <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 shadow-sm mt-4">
//             <h3 className="text-amber-800 font-bold text-sm mb-3 flex items-center gap-2 uppercase tracking-wide">
//                 <ClipboardList size={16} /> Dọn phòng nhanh
//             </h3>
//             <div className="mb-3 space-y-1">
//                 <label className="text-[10px] font-bold text-amber-900 uppercase">Phòng cần dọn</label>
//                 <Listbox value={cleanRoomId} onChange={setCleanRoomId}>
//                     <div className="relative">
//                         <Listbox.Button className="w-full text-left p-2.5 border border-amber-300 rounded bg-white text-sm shadow-sm font-medium">
//                             <span className="block truncate">{selectedTask ? `P.${selectedTask.roomNumber}` : "--- Trống ---"}</span>
//                             <span className="absolute inset-y-0 right-0 flex items-center pr-2"><ChevronDown className="h-4 w-4 text-amber-500" /></span>
//                         </Listbox.Button>
//                         <Transition as={Fragment} leave="transition duration-100 ease-in" leaveFrom="opacity-100" leaveTo="opacity-0">
//                             <Listbox.Options className="absolute z-[100] w-full mt-1 bg-white border border-gray-200 rounded shadow-xl max-h-48 overflow-auto text-sm font-medium">
//                                 {taskList.length === 0 ? <div className="p-3 text-center text-gray-400 italic">Không có phòng bẩn</div> :
//                                 taskList.map((t) => (
//                                     <Listbox.Option key={t.roomId} value={t.roomId} className={({ active }) => `p-2.5 cursor-pointer border-b border-gray-50 last:border-0 ${active ? 'bg-amber-100 text-amber-900' : 'text-gray-900'}`}>
//                                         P.{t.roomNumber} ({t.currentStatus})
//                                     </Listbox.Option>
//                                 ))}
//                             </Listbox.Options>
//                         </Transition>
//                     </div>
//                 </Listbox>
//             </div>
//             <button
//                 onClick={() => handleClean(cleanRoomId)}
//                 disabled={!cleanRoomId || isLoading || taskList.length === 0}
//                 className="w-full bg-amber-500 hover:bg-amber-600 text-white py-2.5 rounded font-bold transition-all text-xs disabled:opacity-50 uppercase tracking-widest shadow-sm"
//             >
//                 XÁC NHẬN DỌN XONG
//             </button>
//         </div>
//     );
// };

// export default CleanRoomAction;

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
                        <span className="text-[10px] font-bold text-gray-400 uppercase mr-1 flex items-center gap-1"><MousePointer2 size={10}/> Chuột phải để đổi:</span>
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