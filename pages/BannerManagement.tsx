import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  HiOutlinePlus,
  HiOutlinePencil,
  HiOutlineTrash,
  HiOutlineExternalLink,
  HiOutlinePhotograph,
  HiOutlineEye,
  HiOutlineEyeOff,
  HiOutlineRefresh,
  HiOutlineCollection
} from 'react-icons/hi';
import { toast } from 'react-toastify'; // 👈 Import Toastify

// SỬA: Import từ file api_banner-new.ts
import {
  getAllBanners,
  deleteBanner,
  toggleBannerStatus, // Đảm bảo đã export hàm này bên api_banner-new
  Banner
} from '../apis/api_banner-new'; 

const BannerManagement: React.FC = () => {
  const navigate = useNavigate();
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBanners = async () => {
    setLoading(true);
    try {
      const data = await getAllBanners();
      setBanners(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Lỗi khi tải banners:', error);
      toast.error('Không thể tải danh sách Banner.'); // Toast error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  const handleDeleteBanner = async (id: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa banner này?')) {
      try {
        await deleteBanner(id);
        setBanners(banners.filter(b => b.id !== id));
        toast.success('Đã xóa banner thành công!'); // Toast Success
      } catch (error) {
        console.error(error);
        toast.error('Không thể xóa banner lúc này.'); // Toast Error
      }
    }
  };

  // Cập nhật trạng thái Ẩn/Hiện nhanh
  const handleToggleStatus = async (banner: Banner) => {
    if (!banner.id) return;
    try {
        // Gọi API cập nhật trạng thái
        // Lưu ý: Đảm bảo api toggleBannerStatus được viết đúng bên file api
        await toggleBannerStatus(banner.id, banner);
        
        // Cập nhật State
        setBanners(prev => prev.map(b => b.id === banner.id ? { ...b, isActive: !b.isActive } : b));
        
        toast.success(`Đã ${!banner.isActive ? 'hiện' : 'ẩn'} banner thành công!`); // Toast
    } catch (error) {
        console.error(error);
        toast.error('Lỗi: Không thể cập nhật trạng thái.'); // Toast
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Quản lý Banner</h1>
          <p className="text-gray-500">Thiết lập hình ảnh quảng bá (tỷ lệ chuẩn 2.5:1).</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchBanners}
            className="p-3 text-gray-500 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-all shadow-sm"
          >
            <HiOutlineRefresh size={22} className={loading ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={() => navigate('/banners/add')}
            className="flex items-center gap-2 bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-pink-500/30 active:scale-95"
          >
            <HiOutlinePlus size={22} />
            <span>Thêm Banner Mới</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden min-h-[400px]">
        {loading ? (
          <div className="py-32 flex flex-col items-center justify-center text-gray-400">
            <div className="w-10 h-10 border-4 border-pink-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="font-medium tracking-wide">Đang tải danh sách banner...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50/50 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest">Xem trước (2.5:1)</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest">Thông tin & Link</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest">Vị trí (Menu)</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest">Thứ tự</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest">Trạng thái</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {banners.length > 0 ? banners.map((banner) => (
                  <tr key={banner.id} className="hover:bg-gray-50/30 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="w-48 aspect-[2.5/1] rounded-xl bg-gray-100 overflow-hidden border border-gray-200 shadow-sm relative">
                        <img 
                            src={banner.imageUrl} 
                            alt={banner.title} 
                            className="w-full h-full object-cover"
                            onError={(e) => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x160?text=No+Image'; }} 
                        />
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-bold text-gray-900">{banner.title}</p>
                      <p className="text-[11px] text-gray-400 line-clamp-1 mb-1">{banner.subtitle}</p>
                      <a 
                        href={banner.link} 
                        target="_blank" 
                        rel="noreferrer"
                        className="flex items-center gap-1 text-[11px] text-pink-400 hover:text-pink-600 transition-colors"
                      >
                        <HiOutlineExternalLink size={12} />
                        <span className="truncate max-w-[150px]">{banner.link}</span>
                      </a>
                    </td>
                    <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 text-gray-600">
                            <HiOutlineCollection size={16} className="text-gray-400" />
                            <span className="text-xs font-bold">{banner.menu || 'N/A'}</span>
                        </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center font-mono font-bold text-gray-600 text-sm">
                        {banner.displayOrder}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleToggleStatus(banner)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all ${banner.isActive
                            ? 'bg-emerald-50 text-emerald-600 shadow-sm shadow-emerald-100'
                            : 'bg-gray-100 text-gray-400'
                          }`}
                      >
                        {banner.isActive ? <HiOutlineEye size={14} /> : <HiOutlineEyeOff size={14} />}
                        {banner.isActive ? 'Đang hiển thị' : 'Đang ẩn'}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => navigate(`/banners/edit/${banner.id}`)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Sửa"
                        >
                          <HiOutlinePencil size={18} />
                        </button>
                        <button
                          onClick={() => banner.id && handleDeleteBanner(banner.id)}
                          className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Xóa"
                        >
                          <HiOutlineTrash size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-20 text-center">
                      <HiOutlinePhotograph size={48} className="mx-auto text-gray-200 mb-3" />
                      <p className="text-gray-400">Chưa có banner nào được tạo.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default BannerManagement;