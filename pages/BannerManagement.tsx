import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  HiOutlinePlus,
  HiOutlinePencil,
  HiOutlineTrash,
  HiOutlineExternalLink,
  HiOutlinePhotograph,
  HiOutlineRefresh,
  HiOutlineCollection,
  HiCheckCircle,
  HiBan,
  HiChartBar
} from 'react-icons/hi';
import { toast } from 'react-toastify';
import Swal from "sweetalert2";

// Import API (Giữ nguyên logic của bạn)
import {
  getAllBanners,
  deleteBanner,
  toggleBannerStatus,
  Banner
} from '../apis/api_banner-new';

const BannerManagement: React.FC = () => {
  const navigate = useNavigate();
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);

  // --- 1. LOGIC FETCH DATA ---
  const fetchBanners = async () => {
    setLoading(true);
    try {
      const data = await getAllBanners();
      // Sắp xếp theo displayOrder
      const sortedData = Array.isArray(data)
        ? data.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0))
        : [];
      setBanners(sortedData);
    } catch (error) {
      // console.error('Lỗi khi tải banners:', error);
      toast.error('Không thể tải danh sách Banner.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  // --- 2. LOGIC THỐNG KÊ (Memoized) ---
  const stats = useMemo(() => {
    return {
      total: banners.length,
      active: banners.filter(b => b.isActive).length,
      inactive: banners.filter(b => !b.isActive).length
    };
  }, [banners]);

  // --- 3. ACTIONS ---
  const handleDeleteBanner = async (id: string) => {
    const result = await Swal.fire({
      title: "Xóa banner?",
      text: "Hành động này sẽ xóa vĩnh viễn hình ảnh quảng cáo này.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Xóa ngay",
      cancelButtonText: "Hủy",
      confirmButtonColor: "#f43f5e", // Rose-500
      cancelButtonColor: "#64748b", // Slate-500
      background: "#fff",
      customClass: {
        popup: 'rounded-3xl',
        confirmButton: 'rounded-xl',
        cancelButton: 'rounded-xl'
      }
    });

    if (!result.isConfirmed) return;

    try {
      await deleteBanner(id);
      setBanners(prev => prev.filter(b => b.id !== id));
      toast.success("Đã xóa banner thành công!");
    } catch (error) {
      console.error(error);
      toast.error("Không thể xóa banner lúc này.");
    }
  };

  const handleToggleStatus = async (banner: Banner) => {
    if (!banner.id) return;

    // SỬA: dùng .active
    const newStatus = !banner.active;

    // Cập nhật UI tạm thời
    setBanners(prev => prev.map(b =>
      b.id === banner.id ? { ...b, active: newStatus } : b
    ));

    try {
      // Gọi API (lưu ý hàm API phải nhận boolean active)
      await toggleBannerStatus(banner.id, newStatus);
      toast.success(`Đã cập nhật trạng thái thành công!`);
    } catch (error) {
      // Revert nếu lỗi
      setBanners(prev => prev.map(b =>
        b.id === banner.id ? { ...b, active: !newStatus } : b
      ));
      toast.error("Lỗi cập nhật server");
    }
  };

  // --- 4. RENDER UI ---
  // ... (Các phần logic giữ nguyên)

  // --- 4. RENDER UI (ĐÃ SỬA GIAO DIỆN MẶC ĐỊNH LÀ HIỂN THỊ) ---
  return (
    <div className="space-y-6 md:space-y-8 p-0 md:p-2 font-sans text-slate-800">

      {/* HEADER & ACTIONS */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-2">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight mb-2">
            Quản Lý Banner
          </h1>
          <p className="text-slate-500 text-sm md:text-base font-medium">
            Thiết lập hình ảnh quảng bá cho trang chủ và các menu.
          </p>
        </div>
        <div className="flex items-center gap-2 md:gap-3">
          <button
            onClick={fetchBanners}
            className="group p-2.5 md:p-3 bg-white border border-slate-200 text-slate-500 rounded-2xl hover:bg-slate-50 hover:text-blue-600 hover:border-blue-200 transition-all shadow-sm active:scale-95"
            title="Làm mới"
          >
            <div className={`transition-transform ${loading ? 'animate-spin' : 'group-hover:rotate-180'}`}>
              <HiOutlineRefresh size={20} />
            </div>
          </button>
          <button
            onClick={() => navigate('/banners/add')}
            className="flex-1 lg:flex-none flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-4 md:px-6 py-2.5 md:py-3 rounded-2xl font-bold shadow-xl shadow-slate-200 hover:shadow-2xl hover:shadow-slate-300 transition-all active:scale-95"
          >
            <HiOutlinePlus size={20} />
            <span>Thêm Banner</span>
          </button>
        </div>
      </div>

      {/* STATS CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          label="Tổng số Banner"
          value={stats.total}
          icon={HiChartBar}
          color="bg-blue-50 text-blue-600"
        />
        <StatCard
          label="Đang hiển thị"
          value={stats.active}
          icon={HiCheckCircle}
          color="bg-emerald-50 text-emerald-600"
        />
        <StatCard
          className="sm:col-span-2 lg:col-span-1"
          label="Đang ẩn"
          value={stats.inactive}
          icon={HiBan}
          color="bg-slate-100 text-slate-500"
        />
      </div>

      {/* BANNER GRID */}
      <div className="min-h-[400px]">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 space-y-4">
            <div className="w-12 h-12 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin"></div>
            <p className="text-slate-400 font-medium animate-pulse">Đang tải dữ liệu...</p>
          </div>
        ) : banners.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {banners.map((banner) => (
              <div
                key={banner.id}
                // 🟢 SỬA 1: Bỏ opacity và bg-slate-50, luôn dùng nền trắng sáng
                className="group relative flex flex-col bg-white rounded-3xl border border-slate-100 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl"
              >
                {/* Image Area */}
                <div className="relative w-full aspect-[2.5/1] bg-slate-100 rounded-t-3xl overflow-hidden border-b border-slate-50">
                  <img
                    src={banner.imageUrl}
                    alt={banner.title}
                    // 🟢 SỬA 2: Bỏ class 'grayscale', ảnh luôn có màu
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    onError={(e) => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/500x200?text=No+Image'; }}
                  />

                  {/* Overlay Badges */}
                  <div className="absolute top-3 left-3 flex gap-2">
                    <span className="px-3 py-1 bg-black/50 backdrop-blur-md text-white text-xs font-bold rounded-full border border-white/10">
                      #{banner.displayOrder}
                    </span>
                    <span className="px-3 py-1 bg-white/90 backdrop-blur-md text-slate-800 text-xs font-bold rounded-full shadow-sm flex items-center gap-1">
                      <HiOutlineCollection /> {banner.menu || 'All'}
                    </span>
                  </div>
                </div>

                {/* Content Area */}
                <div className="p-5 flex-1 flex flex-col">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-lg text-slate-800 line-clamp-1 pr-2" title={banner.title}>
                      {banner.title}
                    </h3>
                  </div>

                  <p className="text-sm text-slate-500 line-clamp-2 mb-4 h-10">
                    {banner.subtitle || <span className="italic opacity-50">Không có mô tả phụ</span>}
                  </p>

                  <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between gap-4">

                    {/* Link Preview */}
                    <a
                      href={banner.link}
                      target="_blank"
                      rel="noreferrer"
                      className="flex-1 flex items-center gap-2 text-xs font-medium text-blue-500 hover:text-blue-700 hover:underline truncate"
                    >
                      <HiOutlineExternalLink size={14} />
                      <span className="truncate">{banner.link || '#'}</span>
                    </a>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2">
                      {/* Toggle Switch */}
                      {/* Toggle Switch */}
                      <button
                        onClick={() => handleToggleStatus(banner)}
                        // SỬA: dùng banner.active
                        className={`relative w-11 h-6 rounded-full transition-colors duration-200 ...
    ${banner.active ? 'bg-emerald-500' : 'bg-slate-300'}
  `}
                      >
                        <span
                          className={`... transform bg-white ...
      ${banner.active ? 'translate-x-5' : 'translate-x-0'}
    `}
                        />
                      </button>

                      {/* Edit */}
                      <button
                        onClick={() => navigate(`/banners/edit/${banner.id}`)}
                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
                        title="Chỉnh sửa"
                      >
                        <HiOutlinePencil size={18} />
                      </button>

                      {/* Delete */}
                      <button
                        onClick={() => banner.id && handleDeleteBanner(banner.id)}
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                        title="Xóa"
                      >
                        <HiOutlineTrash size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Empty State */
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border-2 border-dashed border-slate-200 text-center">
            <div className="p-4 bg-slate-50 rounded-full mb-4 text-slate-300">
              <HiOutlinePhotograph size={40} />
            </div>
            <h3 className="text-lg font-bold text-slate-700">Chưa có banner nào</h3>
            <p className="text-slate-500 max-w-xs mx-auto mt-1 mb-6">
              Tạo banner mới để làm nổi bật các chương trình khuyến mãi hoặc sự kiện.
            </p>
            <button
              onClick={() => navigate('/banners/add')}
              className="px-6 py-2 bg-white border border-slate-300 rounded-xl font-bold text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
            >
              Thêm ngay
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// Component phụ để hiển thị thống kê
const StatCard = ({ label, value, icon: Icon, color, className }: any) => (
  <div className={`bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4 transition-transform hover:scale-[1.02] ${className || ''}`}>
    <div className={`p-3 rounded-xl ${color}`}>
      <Icon size={24} />
    </div>
    <div>
      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{label}</p>
      <p className="text-2xl font-black text-slate-800">{value}</p>
    </div>
  </div>
);

export default BannerManagement;