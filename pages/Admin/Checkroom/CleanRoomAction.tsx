import React, { useEffect, useState } from "react";
// import axiosClient from "@/axiosclient";
import { toast } from "react-toastify";
import { Booking } from "./types";
import { Sparkles, CheckCircle2, AlertCircle, Building2, Search } from "lucide-react";
import hotelApi from "@/apis/hotelApi";
import roomApi from "@/apis/roomApi";
import { Hotel } from "@/type";

interface DirtyRoomData {
    id: string;
    roomNumber: string;
    roomTypeCode: string;
    roomTypeName: string;
    floor?: number;
    status: string;
    becameDirtyAt?: string;
}

interface CleanRoomActionProps {
    booking?: Booking;
    onSuccess?: () => void;
}

const CleanRoomAction: React.FC<CleanRoomActionProps> = ({ booking, onSuccess }) => {
    // State chung
    const [roomList, setRoomList] = useState<DirtyRoomData[]>([]);
    const [cleanRoomId, setCleanRoomId] = useState<string>("");
    const [isLoading, setIsLoading] = useState(false);

    // State cho mode Standalone (không có booking)
    const isStandalone = !booking;
    const [hotels, setHotels] = useState<Hotel[]>([]);
    const [selectedHotelId, setSelectedHotelId] = useState<string>(booking?.hotelId || "");

    // 1. Fetch danh sách khách sạn nếu là Standalone Page
    useEffect(() => {
        if (isStandalone) {
            const fetchHotels = async () => {
                try {
                    const res: any = await hotelApi.getAll();
                    // Xử lý response tương tự HotelManagement
                    let contentList = [];

                    if (res?.data?.content) contentList = res.data.content;
                    else if (res?.data?.data?.content) contentList = res.data.data.content;
                    else if (res?.content) contentList = res.content;
                    else if (Array.isArray(res?.data)) contentList = res.data;

                    const mappedData = Array.isArray(contentList) ? contentList : [];
                    setHotels(mappedData);

                    // Auto select hotel đầu tiên nếu chưa chọn
                    if (mappedData.length > 0 && !selectedHotelId) {
                        setSelectedHotelId(mappedData[0].id);
                    }
                } catch (error) {
                    console.error("Lỗi tải danh sách khách sạn:", error);
                    toast.error("Không thể tải danh sách khách sạn");
                }
            };
            fetchHotels();
        } else {
            // Nếu có booking, auto set selectedHotelId
            if (booking?.hotelId) setSelectedHotelId(booking.hotelId);
        }
    }, [isStandalone, booking?.hotelId]); // Removed selectedHotelId dependency to avoid loop if used wrongly, though here it is fine.

    // 2. Fetch danh sách phòng bẩn khi có Hotel ID
    useEffect(() => {
        const fetchDirtyRooms = async () => {
            if (!selectedHotelId) return;

            setIsLoading(true);
            try {
                // Use roomApi
                const res = await roomApi.getDirtyRooms(selectedHotelId);
                // Check structure
                const dirtyRooms: DirtyRoomData[] = res.data?.data || (Array.isArray(res.data) ? res.data : []) || [];
                setRoomList(dirtyRooms);

                // Logic chọn phòng mặc định
                if (booking && booking.assignedRoomIds) {
                    // Mode Booking: Chọn đúng phòng khách vừa trả
                    const match = dirtyRooms.find((r) => r.id === booking.assignedRoomIds);
                    if (match) {
                        setCleanRoomId(match.id);
                    } else if (dirtyRooms.length > 0) {
                        setCleanRoomId(dirtyRooms[0].id);
                    }
                } else {
                    // Mode Standalone: Reset cleanRoomId hoặc chọn cái đầu
                    // Nếu đang chọn một phòng không còn trong list thì reset
                    setCleanRoomId((prev) => {
                        const exists = dirtyRooms.find(r => r.id === prev);
                        if (exists) return prev;
                        if (dirtyRooms.length > 0) return dirtyRooms[0].id;
                        return "";
                    });
                }

            } catch (error) {
                console.error("Lỗi tải danh sách phòng bẩn:", error);
                toast.error("Không thể tải danh sách phòng cần dọn");
                setRoomList([]);
            } finally {
                setIsLoading(false);
            }
        };

        fetchDirtyRooms();
    }, [selectedHotelId, booking]);

    // 3. Xử lý dọn phòng
    const handleClean = async () => {
        if (!cleanRoomId) {
            toast.error("Vui lòng chọn phòng cần dọn");
            return;
        }

        try {
            await roomApi.markRoomAsClean(selectedHotelId, cleanRoomId);
            toast.success("Đã cập nhật trạng thái phòng: Sạch");

            // Refresh list
            const res = await roomApi.getDirtyRooms(selectedHotelId);
            const dirtyRooms: DirtyRoomData[] = res.data?.data || (Array.isArray(res.data) ? res.data : []) || [];
            setRoomList(dirtyRooms);

            // Reset selection logic
            if (dirtyRooms.length > 0) setCleanRoomId(dirtyRooms[0].id);
            else setCleanRoomId("");

            if (onSuccess) onSuccess();
        } catch (error: any) {
            toast.error(error?.response?.data?.message || "Lỗi cập nhật dọn phòng");
        }
    };

    // RENDER CHO STANDALONE PAGE
    if (isStandalone) {
        return (
            <div className="p-4 md:p-6 bg-slate-50 min-h-screen">
                <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-sm border border-slate-200 p-4 md:p-6">
                    <h1 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                        <Sparkles className="text-amber-500" /> Quản Lý Dọn Phòng
                    </h1>

                    {/* Chọn Khách Sạn */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                            <Building2 size={16} /> Chọn Khách Sạn
                        </label>
                        <div className="relative">
                            <select
                                className="w-full p-3 border border-slate-300 rounded-lg bg-slate-50 focus:ring-2 focus:ring-amber-500 outline-none font-medium text-slate-700"
                                value={selectedHotelId}
                                onChange={(e) => setSelectedHotelId(e.target.value)}
                            >
                                <option value="">-- Chọn khách sạn --</option>
                                {hotels.map((h: any) => (
                                    <option key={h.id} value={h.id}>{h.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* List Phòng Bẩn */}
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-amber-800 font-bold text-lg">Danh sách phòng bẩn / Cần dọn</h3>
                            <span className="bg-amber-100 text-amber-800 text-xs font-bold px-2 py-1 rounded-full">
                                {roomList.length} phòng
                            </span>
                        </div>

                        {isLoading ? (
                            <div className="p-8 text-center text-amber-600">Đang tải dữ liệu...</div>
                        ) : (
                            <div className="space-y-4">
                                <div className="relative">
                                    {roomList.length === 0 ? (
                                        <div className="text-center p-4 text-green-600 font-medium">
                                            <CheckCircle2 className="mx-auto mb-2" size={24} />
                                            Tất cả các phòng đều sạch sẽ!
                                        </div>
                                    ) : (
                                        <select
                                            className="w-full p-3 border border-amber-300 rounded-lg bg-white focus:ring-2 focus:ring-amber-500 outline-none text-slate-800 font-medium cursor-pointer"
                                            value={cleanRoomId}
                                            onChange={(e) => setCleanRoomId(e.target.value)}
                                            size={Math.min(10, Math.max(3, roomList.length))} // Dynamic size (max 10)
                                        >
                                            {roomList.map((room) => (
                                                <option key={room.id} value={room.id} className="p-2 border-b border-gray-50 hover:bg-amber-100">
                                                    Phòng {room.roomNumber} - {room.roomTypeName} {room.floor ? `(Tầng ${room.floor})` : ""}
                                                </option>
                                            ))}
                                        </select>
                                    )}
                                </div>

                                <button
                                    onClick={handleClean}
                                    disabled={!cleanRoomId || roomList.length === 0}
                                    className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white py-3 rounded-lg font-bold shadow-md hover:shadow-lg transition-all flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <CheckCircle2 size={18} />
                                    XÁC NHẬN ĐÃ DỌN XONG
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        )
    }

    // RENDER CHO SUB-COMPONENT (Giữ nguyên giao diện cũ nhưng dùng state mới)
    return (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 shadow-sm mt-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <h3 className="text-amber-800 font-bold text-base mb-3 flex items-center gap-2">
                <Sparkles className="w-4 h-4" /> Dọn phòng
            </h3>

            <div className="mb-3">
                <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-bold text-amber-900 uppercase">
                        Chọn phòng (Dirty List)
                    </label>

                    {booking?.assignedRoomNumbers && (
                        <span className="text-[10px] text-amber-700 bg-amber-100 border border-amber-200 px-2 py-0.5 rounded flex items-center gap-1">
                            Khách vừa trả: <strong>{booking.assignedRoomNumbers}</strong>
                        </span>
                    )}
                </div>

                {isLoading ? (
                    <div className="p-2 text-xs text-amber-600 animate-pulse bg-white border border-amber-200 rounded">
                        Đang tải...
                    </div>
                ) : (
                    <div className="relative">
                        <select
                            className="w-full p-2 border border-amber-300 rounded bg-white focus:ring-1 focus:ring-amber-500 outline-none text-slate-800 text-sm cursor-pointer"
                            value={cleanRoomId}
                            onChange={(e) => setCleanRoomId(e.target.value)}
                        >
                            {roomList.length === 0 ? (
                                <option value="">Tất cả phòng đều sạch</option>
                            ) : (
                                roomList.map((room) => (
                                    <option key={room.id} value={room.id}>
                                        P.{room.roomNumber} - {room.roomTypeName}
                                    </option>
                                ))
                            )}
                        </select>
                    </div>
                )}
            </div>

            <button
                onClick={handleClean}
                disabled={!cleanRoomId || isLoading || roomList.length === 0}
                className="w-full bg-amber-500 hover:bg-amber-600 text-white py-2 rounded font-bold shadow-sm transition-all flex justify-center items-center gap-2 disabled:opacity-50 text-sm"
            >
                <CheckCircle2 size={16} />
                XÁC NHẬN DỌN XONG
            </button>
        </div>
    );
};

export default CleanRoomAction;