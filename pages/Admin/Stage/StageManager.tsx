import React, { useState, useEffect, useCallback } from "react";
import { Plus, Trash2, Monitor, Users, PencilRuler, UserCheck, Loader2, RefreshCw, Copy, Eye, BarChart2 } from "lucide-react";
import { Link } from "react-router-dom";
import Swal from "sweetalert2";
import { toast } from "react-toastify";
import { StageData, Zone, Seat, SeatStatus } from "@/type/Stage.type";

// Import 2 file con
import StageDesigner from "./StageDesigner";
import StageCheckIn from "./StageCheckIn";

import axiosClient from "@/axiosclient";

// --- HÀM CHUẨN HÓA DỮ LIỆU (QUAN TRỌNG) ---
// Giúp map dữ liệu từ Backend (có thể bị lệch) về đúng chuẩn Frontend
const normalizeStageData = (beData: any): StageData => {
  if (!beData) return { id: "", name: "", zones: [], lastModified: "" };

  return {
    ...beData,
    zones: (beData.zones || []).map((zone: any) => ({
      ...zone,
      // Nếu width/height = 0 thì tính tạm để hiển thị được
      width: zone.width > 0 ? zone.width : (zone.isBox ? 150 : (zone.cols * 40 + (zone.cols - 1) * 6 + 24)),
      height: zone.height > 0 ? zone.height : (zone.isBox ? 150 : (zone.rows * 40 + (zone.rows - 1) * 6 + 24)),

      seats: (zone.seats || []).map((seat: any) => ({
        ...seat,
        // Map status từ BE. Nếu không có status nhưng có isOccupied=true, giả định là BOOKED
        status: seat.status || (seat.isOccupied ? 'BOOKED' : 'AVAILABLE'),
        // Chuyển Type về chữ thường (Backend trả về VIP -> frontend cần vip)
        type: seat.type ? seat.type.toLowerCase() : 'standard',
        // Map status từ BE sang boolean isOccupied cho tương thích code cũ
        isOccupied: seat.isOccupied === true || ['OCCUPIED', 'BOOKED', 'WAITING', 'CHECKED_IN', 'RESERVED'].includes(seat.status),
        // Đảm bảo row/col bắt đầu từ 0
        row: seat.row,
        col: seat.col
      }))
    }))
  };
};

const StageManagerApp = () => {
  // 1. Khởi tạo stages rỗng, sẽ fetch từ API sau
  const [stages, setStages] = useState<StageData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const [view, setView] = useState<"list" | "design" | "checkin">("list");
  const [currentId, setCurrentId] = useState<string | null>(null);

  // --- 2. HÀM GỌI API LẤY DANH SÁCH ---
  const fetchStages = useCallback(async () => {
    setLoading(true);
    try {
      // Dùng axiosClient tự động đính token
      const response = await axiosClient.get('/stages');
      const data = response || []; // axiosClient trả về data trực tiếp

      // Kiểm tra cấu trúc trả về (Array trực tiếp hoặc nằm trong .data)
      const listRaw = Array.isArray(data) ? data : ((data as any).data || []);

      // Chuẩn hóa dữ liệu trước khi lưu vào State
      const cleanList = listRaw.map(normalizeStageData);

      setStages(cleanList);
    } catch (error) {
      console.error("Fetch error:", error);
      // Không cần toast lỗi ở đây nếu axiosClient đã toast, hoặc toast nhẹ
      // toast.error("Không thể tải dữ liệu sân khấu");
    } finally {
      setLoading(false);
    }
  }, []);

  // Gọi API khi component mount
  useEffect(() => {
    fetchStages();
  }, [fetchStages]);

  // --- XỬ LÝ UPDATE LOCAL STATE (Sau khi Save/Checkin xong) ---
  const handleUpdateDataOnly = (d: StageData) => {
    const i = stages.findIndex((s) => s.id === d.id);
    if (i >= 0) {
      const u = [...stages];
      u[i] = d;
      setStages(u);
    }
  };

  const handleSaveAndExit = (d: StageData) => {
    // Khi lưu xong, ta cập nhật state local và chuyển về list
    // (Thực tế StageDesigner đã gọi API save rồi, ở đây chỉ update UI list để đỡ phải fetch lại)
    const i = stages.findIndex((s) => s.id === d.id);
    if (i >= 0) {
      const u = [...stages];
      u[i] = d;
      setStages(u);
    } else {
      setStages([...stages, d]);
    }
    // Hoặc an toàn hơn: fetchStages(); để lấy data mới nhất từ server
  };

  // --- XỬ LÝ XÓA API ---
  const handleDeleteStage = async (id: string, name: string) => {
    const result = await Swal.fire({
      title: "Xóa sân khấu?",
      text: `Bạn có chắc chắn muốn xóa "${name}"?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Xóa",
      cancelButtonText: "Hủy",
      confirmButtonColor: "#d33",
    });

    if (!result.isConfirmed) return;

    try {
      await axiosClient.delete(`/stages/${id}`);

      // Xóa thành công -> Cập nhật UI
      setStages(stages.filter((x) => x.id !== id));
      toast.success("Đã xóa sân khấu");
    } catch (error) {
      console.error("Delete Error", error);
      // toast.error("Lỗi khi xóa sân khấu"); // axiosClient có thể đã handle
    }
  };

  // --- HÀM SAO CHÉP SÂN KHẤU ---
  const handleDuplicateStage = async (originalStage: StageData) => {
    const { value: newName } = await Swal.fire({
      title: "Sao chép sân khấu",
      input: "text",
      inputLabel: "Nhập tên cho sân khấu mới",
      inputValue: `${originalStage.name} (Bản sao)`,
      showCancelButton: true,
      confirmButtonText: "Sao chép",
      cancelButtonText: "Hủy",
      inputValidator: (value) => {
        if (!value) return "Bạn phải nhập tên sân khấu!";
      },
    });

    if (!newName) return;

    try {
      setLoading(true);

      // 1. Tạo bản sao dữ liệu (Deep Copy)
      // Reset trạng thái check-in (isOccupied) về false cho bản sao mới
      const duplicatedZones = originalStage.zones.map(zone => ({
        ...zone,
        id: crypto.randomUUID(), // ID Zone mới
        seats: zone.seats.map(seat => ({
          ...seat,
          id: crypto.randomUUID(), // ID Ghế mới
          isOccupied: false        // Bản sao mới thì ghế phải trống
        }))
      }));

      const newStagePayload: StageData = {
        id: crypto.randomUUID(), // Tạo ID Sân khấu mới
        name: newName,
        zones: duplicatedZones,
        lastModified: new Date().toISOString(),
      };

      // 2. Gọi API POST để lưu bản sao vào Database
      await axiosClient.post('/stages', newStagePayload);

      // 3. Thông báo và cập nhật danh sách
      toast.success("Đã sao chép sân khấu thành công!");
      fetchStages(); // Tải lại danh sách từ Server

    } catch (error) {
      console.error("Duplicate Error", error);
      toast.error("Lỗi khi sao chép sân khấu");
    } finally {
      setLoading(false);
    }
  };

  const targetStage = stages.find((s) => s.id === currentId);

  // --- RENDER MÀN HÌNH CON ---
  if (view === "design")
    return (
      <StageDesigner
        initialData={targetStage}
        onSave={handleSaveAndExit}
        onBack={() => {
          setView("list");
          fetchStages(); // Refresh lại data khi quay về để chắc chắn đồng bộ
        }}
      />
    );

  if (view === "checkin" && targetStage)
    return (
      <StageCheckIn
        data={targetStage}
        onUpdate={handleUpdateDataOnly}
        onBack={() => {
          setView("list");
          fetchStages(); // Refresh lại data checkin mới nhất
        }}
      />
    );

  // --- HELPER TÍNH TOÁN ---
  const calculateTotalZones = () => stages.reduce((acc, s) => acc + (s.zones ? s.zones.length : 0), 0);

  const calculateTotalSeats = () => stages.reduce((acc, s) => {
    const types = s.seatTypeCounts || {};
    const total = (types.standard || 0) + (types.vip || 0) + (types.guest || 0);
    if (Object.keys(types).length > 0) return acc + total;
    const safeZones = s.zones || [];
    return acc + safeZones.reduce((zAcc, z) => zAcc + (z.seats || []).filter(st => st.type !== "blocked" && !z.isBox).length, 0);
  }, 0);

  const calculateTotalCheckedIn = () => stages.reduce((acc, s) => {
    const stats = s.seatStatusCounts || {};
    const checked = (stats.CHECKED_IN || 0) + (stats.BOOKED || 0) + (stats.WAITING || 0) + (stats.guest || 0) + (stats.RESERVED || 0);
    if (Object.keys(stats).length > 0) return acc + checked;
    const safeZones = s.zones || [];
    return acc + safeZones.reduce((zAcc, z) => zAcc + (z.seats || []).filter(st => st.isOccupied).length, 0);
  }, 0);

  // --- DASHBOARD RENDER ---
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight flex items-center gap-3">
              <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Quản Lý Sân Khấu
              </span>
            </h1>
            <p className="text-gray-500 mt-2 flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              <span className="font-medium">Hệ thống Online</span>
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={fetchStages}
              className="bg-white text-indigo-600 px-4 py-3 rounded-2xl font-bold shadow hover:shadow-md transition-all flex items-center gap-2"
              title="Tải lại dữ liệu"
            >
              <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
            </button>
            <button
              onClick={() => {
                setCurrentId(null);
                setView("design");
              }}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 shadow-lg hover:shadow-indigo-200 active:scale-95 transition-all group"
            >
              <div className="bg-white/20 p-1 rounded-lg group-hover:bg-white/30 transition-colors">
                <Plus className="w-5 h-5" />
              </div>
              Tạo Sân Khấu Mới
            </button>
          </div>
        </div>

        {/* LOADING STATE */}
        {loading ? (
          <div className="flex flex-col items-center justify-center h-64">
            <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mb-4" />
            <p className="text-gray-500 font-medium">Đang tải dữ liệu từ server...</p>
          </div>
        ) : (
          <>
            {/* Stats Overview */}
            {stages.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                {[
                  { label: 'Tổng Sân Khấu', value: stages.length, icon: Monitor, bgColor: 'bg-indigo-50', textColor: 'text-indigo-600' },
                  { label: 'Khu Vực', value: calculateTotalZones(), icon: Monitor, bgColor: 'bg-purple-50', textColor: 'text-purple-600' },
                  { label: 'Tổng Ghế (Mở Bán)', value: calculateTotalSeats(), icon: Users, bgColor: 'bg-blue-50', textColor: 'text-blue-600' },
                  { label: 'Khách Check-in/Đặt', value: calculateTotalCheckedIn(), icon: UserCheck, bgColor: 'bg-green-50', textColor: 'text-green-600' }
                ].map((item, i) => (
                  <div key={i} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all">
                    <div className={`p-3 rounded-xl ${item.bgColor} ${item.textColor} w-fit mb-3`}>
                      <item.icon className="w-6 h-6" />
                    </div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{item.label}</p>
                    <h4 className="text-2xl font-bold text-gray-800 mt-1">{item.value}</h4>
                  </div>
                ))}
              </div>
            )}

            {/* Stage Cards Grid */}
            {stages.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-3xl border-2 border-dashed border-gray-200">
                <div className="w-24 h-24 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-full flex items-center justify-center mb-6">
                  <Monitor className="w-12 h-12 text-indigo-400" />
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-2">Chưa có sân khấu nào</h3>
                <p className="text-gray-500 max-w-sm mb-8">
                  Dữ liệu trống hoặc không tải được. Hãy thử tạo mới.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {stages.map((s) => {
                  const safeZones = s.zones || [];
                  const stats = s.seatStatusCounts || {};
                  const types = s.seatTypeCounts || {};
                  
                  const hasStatsData = Object.keys(stats).length > 0;
                  const hasTypesData = Object.keys(types).length > 0;

                  const totalCountFromApi = (types.standard || 0) + (types.vip || 0) + (types.guest || 0);
                  const checkedCountFromApi = (stats.BOOKED || 0) + (stats.WAITING || 0) + (stats.CHECKED_IN || 0) + (stats.guest || 0) + (stats.RESERVED || 0);

                  const total = hasTypesData ? totalCountFromApi : safeZones.reduce((acc, z) => {
                    const seats = z.seats || [];
                    return acc + seats.filter((st) => st.type !== "blocked" && !z.isBox).length;
                  }, 0);

                  const checked = hasStatsData ? checkedCountFromApi : safeZones.reduce((acc, z) => {
                    const seats = z.seats || [];
                    return acc + seats.filter((st) => st.isOccupied).length;
                  }, 0);

                  const percentage = total > 0 ? Math.round((checked / total) * 100) : 0;

                  return (
                    <div
                      key={s.id}
                      className="group bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col active:scale-[0.98]"
                    >
                      {/* Card Header with Gradient */}
                      <div className="relative h-32 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-6">
                        <div className="absolute top-4 right-4 flex gap-2">
                          {/* NÚT SAO CHÉP MỚI THÊM */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDuplicateStage(s);
                            }}
                            className="p-2 bg-white/20 hover:bg-white/40 rounded-lg text-white transition-colors backdrop-blur-sm"
                            title="Sao chép sân khấu"
                          >
                            <Copy size={18} />
                          </button>

                          
                          {/* NÚT XÓA */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteStage(s.id, s.name);
                            }}
                            className="p-2 bg-red-500/20 hover:bg-red-500/40 rounded-lg text-white transition-colors backdrop-blur-sm"
                            title="Xóa"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                            <Monitor size={28} className="text-white" />
                          </div>
                          <div className="text-white">
                            <div className="text-xs font-bold uppercase tracking-wider opacity-90">Sân Khấu</div>
                            <div className="text-sm font-medium opacity-75">{safeZones.length} khu vực</div>
                          </div>
                        </div>
                      </div>

                      {/* Card Content */}
                      <div className="p-6 flex-1 flex flex-col">
                        <h3 className="text-xl font-bold text-gray-800 mb-2 line-clamp-1 group-hover:text-indigo-600 transition-colors">
                          {s.name}
                        </h3>
                        <div className="text-xs text-gray-400 mb-4 flex items-center gap-1">
                          <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                          Cập nhật: {s.lastModified ? new Date(s.lastModified).toLocaleDateString() : 'N/A'}
                        </div>

                        {/* Progress Bar */}
                        <div className="mb-4">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Tỷ lệ check-in</span>
                            <span className="text-sm font-bold text-indigo-600">{percentage}%</span>
                          </div>
                          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-green-400 to-emerald-500 rounded-full transition-all duration-500"
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                          <div className="flex items-center gap-2 mt-2 text-sm">
                            <Users size={14} className="text-gray-400" />
                            <span className="font-bold text-green-600">{checked}</span>
                            <span className="text-gray-400">/</span>
                            <span className="font-medium text-gray-600">{total}</span>
                            <span className="text-gray-400 text-xs">khách</span>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="grid grid-cols-3 gap-2 mt-auto pt-4 border-t border-gray-50">
                          <Link
                            to={`/stage/dashboard/${s.id}`}
                            className="flex items-center justify-center py-2.5 rounded-xl bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-bold transition-all text-xs"
                          >
                            <BarChart2 size={16} className="mr-1" />
                            Thống kê
                          </Link>
                          <button
                            onClick={() => {
                              setCurrentId(s.id);
                              setView("design");
                            }}
                            className="flex items-center justify-center py-2.5 rounded-xl bg-gray-50 text-gray-700 hover:bg-gray-100 font-bold transition-all group/btn text-xs"
                          >
                            <PencilRuler size={16} className="mr-1 group-hover/btn:rotate-12 transition-transform" />
                            Thiết Kế
                          </button>
                          <button
                            onClick={() => {
                              setCurrentId(s.id);
                              setView("checkin");
                            }}
                            className="flex items-center justify-center py-2.5 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:from-green-600 hover:to-emerald-600 font-bold shadow-md hover:shadow-lg transition-all text-xs"
                          >
                            <UserCheck size={16} className="mr-1" />
                            Check-in
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default StageManagerApp;

// import React, { useState, useEffect, useCallback, useMemo } from "react";
// import { Plus, Trash2, Monitor, Users, PencilRuler, UserCheck, Loader2, RefreshCw, Copy, Eye, ShieldAlert } from "lucide-react";
// import Swal from "sweetalert2";
// import { toast } from "react-toastify";
// import { StageData } from "@/type/Stage.type";

// // Import 2 file con
// import StageDesigner from "./StageDesigner";
// import StageCheckIn from "./StageCheckIn";

// import axiosClient from "@/axiosclient";

// const normalizeStageData = (beData: any): StageData => {
//   if (!beData) return { id: "", name: "", zones: [], lastModified: "" };

//   return {
//     ...beData,
//     zones: (beData.zones || []).map((zone: any) => ({
//       ...zone,
//       width: zone.width > 0 ? zone.width : (zone.isBox ? 150 : (zone.cols * 40 + (zone.cols - 1) * 6 + 24)),
//       height: zone.height > 0 ? zone.height : (zone.isBox ? 150 : (zone.rows * 40 + (zone.rows - 1) * 6 + 24)),
//       seats: (zone.seats || []).map((seat: any) => ({
//         ...seat,
//         status: seat.status || (seat.isOccupied ? 'BOOKED' : 'AVAILABLE'),
//         type: seat.type ? seat.type.toLowerCase() : 'standard',
//         isOccupied: seat.isOccupied === true || ['OCCUPIED', 'BOOKED', 'WAITING', 'CHECKED_IN', 'RESERVED'].includes(seat.status),
//         row: seat.row,
//         col: seat.col
//       }))
//     }))
//   };
// };

// const StageManagerApp = () => {
//   const [stages, setStages] = useState<StageData[]>([]);
//   const [loading, setLoading] = useState<boolean>(true);
//   const [view, setView] = useState<"list" | "design" | "checkin" | "view">("list");
//   const [currentId, setCurrentId] = useState<string | null>(null);

//   // --- LOGIC PHÂN QUYỀN ---
//   const isAdmin = useMemo(() => {
//     try {
//       const user = JSON.parse(localStorage.getItem("user") || "{}");
//       return user?.role === "ADMIN";
//     } catch {
//       return false;
//     }
//   }, []);

//   const fetchStages = useCallback(async () => {
//     setLoading(true);
//     try {
//       const response = await axiosClient.get('/stages');
//       const data = response || [];
//       const listRaw = Array.isArray(data) ? data : ((data as any).data || []);
//       const cleanList = listRaw.map(normalizeStageData);
//       setStages(cleanList);
//     } catch (error) {
//       console.error("Fetch error:", error);
//     } finally {
//       setLoading(false);
//     }
//   }, []);

//   useEffect(() => {
//     fetchStages();
//   }, [fetchStages]);

//   const handleUpdateDataOnly = (d: StageData) => {
//     const i = stages.findIndex((s) => s.id === d.id);
//     if (i >= 0) {
//       const u = [...stages];
//       u[i] = d;
//       setStages(u);
//     }
//   };

//   const handleSaveAndExit = (d: StageData) => {
//     const i = stages.findIndex((s) => s.id === d.id);
//     if (i >= 0) {
//       const u = [...stages];
//       u[i] = d;
//       setStages(u);
//     } else {
//       setStages([...stages, d]);
//     }
//   };

//   const handleDeleteStage = async (id: string, name: string) => {
//     if (!isAdmin) return;
//     const result = await Swal.fire({
//       title: "Xóa sân khấu?",
//       text: `Bạn có chắc chắn muốn xóa "${name}"?`,
//       icon: "warning",
//       showCancelButton: true,
//       confirmButtonText: "Xóa",
//       cancelButtonText: "Hủy",
//       confirmButtonColor: "#d33",
//     });

//     if (!result.isConfirmed) return;
//     try {
//       await axiosClient.delete(`/stages/${id}`);
//       setStages(stages.filter((x) => x.id !== id));
//       toast.success("Đã xóa sân khấu");
//     } catch (error) {
//       console.error("Delete Error", error);
//     }
//   };

//   const handleDuplicateStage = async (originalStage: StageData) => {
//     if (!isAdmin) return;
//     const { value: newName } = await Swal.fire({
//       title: "Sao chép sân khấu",
//       input: "text",
//       inputLabel: "Nhập tên cho sân khấu mới",
//       inputValue: `${originalStage.name} (Bản sao)`,
//       showCancelButton: true,
//       confirmButtonText: "Sao chép",
//       cancelButtonText: "Hủy",
//       inputValidator: (value) => {
//         if (!value) return "Bạn phải nhập tên sân khấu!";
//       },
//     });

//     if (!newName) return;

//     try {
//       setLoading(true);
//       const duplicatedZones = originalStage.zones.map(zone => ({
//         ...zone,
//         id: crypto.randomUUID(),
//         seats: zone.seats.map(seat => ({
//           ...seat,
//           id: crypto.randomUUID(),
//           isOccupied: false
//         }))
//       }));

//       const newStagePayload: StageData = {
//         id: crypto.randomUUID(),
//         name: newName,
//         zones: duplicatedZones,
//         lastModified: new Date().toISOString(),
//       };

//       await axiosClient.post('/stages', newStagePayload);
//       toast.success("Đã sao chép sân khấu thành công!");
//       fetchStages();
//     } catch (error) {
//       toast.error("Lỗi khi sao chép sân khấu");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const targetStage = stages.find((s) => s.id === currentId);

//   if (view === "design")
//     return <StageDesigner initialData={targetStage} onSave={handleSaveAndExit} onBack={() => setView("list")} />;

//   if (view === "checkin" && targetStage)
//     return <StageCheckIn data={targetStage} onUpdate={handleUpdateDataOnly} onBack={() => setView("list")} isReadOnly={false} />;

//   if (view === "view" && targetStage)
//     return <StageCheckIn data={targetStage} onUpdate={() => {}} onBack={() => setView("list")} isReadOnly={true} />;

//   const calculateTotalZones = () => stages.reduce((acc, s) => acc + (s.zones ? s.zones.length : 0), 0);

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6 md:p-8 font-sans">
//       <div className="max-w-7xl mx-auto">
//         <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
//           <div>
//             <h1 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight flex items-center gap-3">
//               <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
//                 Quản Lý Sân Khấu
//               </span>
//             </h1>
//             <p className="text-gray-500 mt-2 flex items-center gap-2">
//               <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
//               <span className="font-medium">{isAdmin ? "Chế độ Quản trị viên" : "Chế độ Nhân viên"}</span>
//             </p>
//           </div>
//           <div className="flex gap-3">
//             <button onClick={fetchStages} className="bg-white text-indigo-600 px-4 py-3 rounded-2xl font-bold shadow hover:shadow-md transition-all flex items-center gap-2">
//               <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
//             </button>
            
//             {/* ẨN NÚT TẠO MỚI NẾU KHÔNG PHẢI ADMIN */}
//             {isAdmin && (
//               <button
//                 onClick={() => { setCurrentId(null); setView("design"); }}
//                 className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 shadow-lg active:scale-95 transition-all group"
//               >
//                 <Plus className="w-5 h-5" /> Tạo Sân Khấu Mới
//               </button>
//             )}
//           </div>
//         </div>

//         {loading ? (
//           <div className="flex flex-col items-center justify-center h-64">
//             <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mb-4" />
//           </div>
//         ) : (
//           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
//             {stages.map((s) => {
//               const safeZones = s.zones || [];
//               const total = safeZones.reduce((acc, z) => acc + (z.seats || []).filter((st) => st.type !== "blocked" && !z.isBox).length, 0);
//               const checked = safeZones.reduce((acc, z) => acc + (z.seats || []).filter((st) => st.isOccupied).length, 0);
//               const percentage = total > 0 ? Math.round((checked / total) * 100) : 0;

//               return (
//                 <div key={s.id} className="group bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col">
//                   <div className="relative h-32 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-6">
//                     <div className="absolute top-4 right-4 flex gap-2">
//                       {/* CHỈ ADMIN MỚI THẤY NÚT SAO CHÉP VÀ XÓA */}
//                       {isAdmin ? (
//                         <>
//                           <button onClick={(e) => { e.stopPropagation(); handleDuplicateStage(s); }} className="p-2 bg-white/20 hover:bg-white/30 rounded-lg text-white backdrop-blur-sm transition-colors" title="Sao chép">
//                             <Copy size={18} />
//                           </button>
//                           <button onClick={(e) => { e.stopPropagation(); handleDeleteStage(s.id, s.name); }} className="p-2 bg-red-500/20 hover:bg-red-500/40 rounded-lg text-white backdrop-blur-sm transition-colors" title="Xóa">
//                             <Trash2 size={18} />
//                           </button>
//                         </>
//                       ) : (
//                         /* NHÂN VIÊN THẤY NÚT XEM CHI TIẾT Ở ĐÂY */
//                         <button onClick={(e) => { e.stopPropagation(); setCurrentId(s.id); setView("view"); }} className="p-2 bg-white/20 hover:bg-white/30 rounded-lg text-white backdrop-blur-sm transition-colors" title="Xem sơ đồ">
//                           <Eye size={18} />
//                         </button>
//                       )}
//                     </div>
//                     <div className="flex items-center gap-3">
//                       <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
//                         <Monitor size={28} className="text-white" />
//                       </div>
//                       <div className="text-white">
//                         <div className="text-xs font-bold uppercase tracking-wider opacity-90">Sân Khấu</div>
//                         <div className="text-sm font-medium opacity-75">{safeZones.length} khu vực</div>
//                       </div>
//                     </div>
//                   </div>

//                   <div className="p-6 flex-1 flex flex-col">
//                     <h3 className="text-xl font-bold text-gray-800 mb-2 line-clamp-1 group-hover:text-indigo-600 transition-colors">{s.name}</h3>
//                     <div className="text-xs text-gray-400 mb-4">Cập nhật: {s.lastModified ? new Date(s.lastModified).toLocaleDateString() : 'N/A'}</div>

//                     <div className="mb-6">
//                       <div className="flex justify-between text-xs font-bold text-gray-500 mb-2">
//                         <span>Check-in</span>
//                         <span>{percentage}%</span>
//                       </div>
//                       <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
//                         <div className="h-full bg-green-500 transition-all duration-500" style={{ width: `${percentage}%` }}></div>
//                       </div>
//                       <div className="mt-2 text-xs text-slate-500 font-medium">{checked} / {total} ghế đã ngồi</div>
//                     </div>

//                     <div className="mt-auto pt-4 border-t border-gray-50">
//                       {isAdmin ? (
//                         <div className="grid grid-cols-2 gap-3">
//                           <button onClick={() => { setCurrentId(s.id); setView("design"); }} className="flex items-center justify-center py-2.5 rounded-xl bg-gray-50 text-gray-700 hover:bg-gray-100 font-bold text-sm transition-all">
//                             <PencilRuler size={16} className="mr-2" /> Thiết Kế
//                           </button>
//                           <button onClick={() => { setCurrentId(s.id); setView("checkin"); }} className="flex items-center justify-center py-2.5 rounded-xl bg-green-500 text-white hover:bg-green-600 font-bold text-sm shadow-md transition-all">
//                             <UserCheck size={16} className="mr-2" /> Check-in
//                           </button>
//                         </div>
//                       ) : (
//                         <button onClick={() => { setCurrentId(s.id); setView("view"); }} className="w-full flex items-center justify-center py-2.5 rounded-xl bg-blue-600 text-white hover:bg-blue-700 font-bold text-sm shadow-md transition-all">
//                           <Eye size={16} className="mr-2" /> Xem Sơ Đồ Ghế
//                         </button>
//                       )}
//                     </div>
//                   </div>
//                 </div>
//               );
//             })}
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };

// export default StageManagerApp;