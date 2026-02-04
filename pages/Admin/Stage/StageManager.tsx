import React, { useState, useEffect, useCallback } from "react";
import { Plus, Trash2, Monitor, Users, PencilRuler, UserCheck, Loader2, RefreshCw } from "lucide-react";
import Swal from "sweetalert2";
import { toast } from "react-toastify";
import { StageData, Zone, Seat } from "@/type/Stage.type";

// Import 2 file con
import StageDesigner from "./StageDesigner";
import StageCheckIn from "./StageCheckIn";

// --- CẤU HÌNH API ---
const API_BASE_URL = "https://api.momangshow.vn/api";

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
        // Chuyển Type về chữ thường (Backend trả về VIP -> frontend cần vip)
        type: seat.type ? seat.type.toLowerCase() : 'standard',
        // Map status từ BE sang boolean isOccupied
        isOccupied: seat.isOccupied === true || seat.status === 'OCCUPIED',
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
      const token = localStorage.getItem("accessToken");
      if (!token) {
        toast.error("Bạn chưa đăng nhập!");
        setLoading(false);
        return;
      }

      const response = await fetch(`${API_BASE_URL}/stages`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error("Lỗi khi tải danh sách sân khấu");

      const data = await response.json();
      
      // Kiểm tra cấu trúc trả về (Array trực tiếp hoặc nằm trong .data)
      const listRaw = Array.isArray(data) ? data : (data.data || []);
      
      // Chuẩn hóa dữ liệu trước khi lưu vào State
      const cleanList = listRaw.map(normalizeStageData);
      
      setStages(cleanList);
    } catch (error) {
      console.error("Fetch error:", error);
      toast.error("Không thể tải dữ liệu sân khấu");
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
      const token = localStorage.getItem("accessToken");
      const response = await fetch(`${API_BASE_URL}/stages/${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });

      if (!response.ok) throw new Error("Không thể xóa");

      // Xóa thành công -> Cập nhật UI
      setStages(stages.filter((x) => x.id !== id));
      toast.success("Đã xóa sân khấu");
    } catch (error) {
      toast.error("Lỗi khi xóa sân khấu");
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
                  { label: 'Khu Vực', value: calculateTotalZones(), icon: Monitor, bgColor: 'bg-purple-50', textColor: 'text-purple-600' }
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
                  const total = safeZones.reduce((acc, z) => {
                      const seats = z.seats || [];
                      return acc + seats.filter((st) => st.type !== "blocked" && !z.isBox).length;
                  }, 0);
                  
                  const checked = safeZones.reduce((acc, z) => {
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
                        <div className="absolute top-4 right-4">
                          <button
                            onClick={() => handleDeleteStage(s.id, s.name)}
                            className="p-2 bg-white/20 hover:bg-white/30 rounded-lg text-white transition-colors backdrop-blur-sm"
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
                        <div className="grid grid-cols-2 gap-3 mt-auto pt-4 border-t border-gray-50">
                          <button
                            onClick={() => {
                              setCurrentId(s.id);
                              setView("design");
                            }}
                            className="flex items-center justify-center py-2.5 rounded-xl bg-gray-50 text-gray-700 hover:bg-gray-100 font-bold transition-all group/btn"
                          >
                            <PencilRuler size={16} className="mr-2 group-hover/btn:rotate-12 transition-transform" />
                            Thiết Kế
                          </button>
                          <button
                            onClick={() => {
                              setCurrentId(s.id);
                              setView("checkin");
                            }}
                            className="flex items-center justify-center py-2.5 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:from-green-600 hover:to-emerald-600 font-bold shadow-md hover:shadow-lg transition-all"
                          >
                            <UserCheck size={16} className="mr-2" />
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