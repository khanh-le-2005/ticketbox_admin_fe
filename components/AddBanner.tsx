import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  HiOutlineArrowLeft,
  HiOutlineCloudUpload,
  HiOutlineLink,
  HiOutlineSortAscending,
  HiOutlineTicket
} from 'react-icons/hi';
import { toast } from 'react-toastify';

// 1. IMPORT API BANNER & IMAGE
import { createBanner, getBannerById, updateBanner } from '../apis/api_banner-new';
// Lưu ý: Đảm bảo file type này tồn tại, hoặc dùng interface Banner bên dưới nếu lỗi
import { Banner } from '@/type/new.type';
import { uploadImageFile, getImageUrl } from '../apis/api_image';

// 2. IMPORT API SHOW
import { showApi } from '../apis/api_show';

// Interface phụ cho Show (để tránh lỗi TypeScript khi map dữ liệu)
interface IShow {
  id: string;
  slug?: string;
  title?: string;
  name?: string;
}

const AddBanner: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditMode = !!id;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(false);

  // Khởi tạo state form
  const [formData, setFormData] = useState<Omit<Banner, 'id'>>({
    title: '',
    subtitle: '',
    imageUrl: '',
    link: '',
    menu: 'homepage',
    displayOrder: 1,
    isActive: true
  });

  // State lưu danh sách Show cho Dropdown
  const [shows, setShows] = useState<IShow[]>([]);
  const [selectedShowId, setSelectedShowId] = useState<string>('');

  // --------------------------------------------------------
  // LOAD DỮ LIỆU
  // --------------------------------------------------------
  useEffect(() => {
    // 1. Hàm tải danh sách Show
    const fetchShows = async () => {
      try {
        // Gọi API lấy danh sách show (lấy 100 cái mới nhất)
        const response: any = await showApi.getAllShows({ size: 100 });
        console.log("Dữ liệu show trả về:", response);

        // Xử lý các trường hợp response khác nhau của API
        let showList: IShow[] = [];
        if (Array.isArray(response)) {
          showList = response;
        } else if (response && Array.isArray(response.content)) {
          showList = response.content;
        } else if (response && Array.isArray(response.data)) {
          showList = response.data;
        }

        setShows(showList);
      } catch (error) {
        console.error("Lỗi tải danh sách show:", error);
      }
    };

    fetchShows();

    // 2. Hàm tải Banner (Nếu đang ở chế độ Chỉnh sửa)
    if (isEditMode && id) {
      const fetchBanner = async () => {
        try {
          const data = await getBannerById(id);
          setFormData({
            title: data.title || '',
            subtitle: data.subtitle || '',
            imageUrl: data.imageUrl,
            link: data.link,
            menu: data.menu || 'homepage',
            displayOrder: data.displayOrder || 1,
            isActive: data.isActive
          });

          // ✅ LOGIC MỚI: Tự động chọn dropdown nếu link cũ có dạng /event/...
          if (data.link && data.link.includes('/event/')) {
            const pathSegments = data.link.split('/');
            const lastSegment = pathSegments.pop();

            if (lastSegment) {
              // Thử tìm show theo slug trước, nếu không tìm thấy thì thử theo ID
              // Vì link bây giờ có thể là /event/slug hoặc /event/id
              setSelectedShowId(lastSegment);
            }
          }
        } catch (error) {
          toast.error('Lỗi khi tải thông tin banner.');
          navigate('/banners');
        }
      };
      fetchBanner();
    }
  }, [id, isEditMode, navigate]);

  // --------------------------------------------------------
  // CÁC HÀM XỬ LÝ (HANDLERS)
  // --------------------------------------------------------

  // Xử lý upload ảnh
  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    try {
      const imageId = await uploadImageFile(file);
      const fullImageUrl = getImageUrl(imageId);
      setFormData(prev => ({ ...prev, imageUrl: fullImageUrl }));
    } catch (error) {
      toast.error('Không thể tải ảnh.');
    } finally {
      setLoading(false);
    }
  };

  // ✅ LOGIC QUAN TRỌNG NHẤT: CHỌN SHOW -> TẠO LINK CHUẨN
  const handleShowSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const showId = e.target.value;
    setSelectedShowId(showId);

    if (showId) {
      // Tìm show trong danh sách để lấy slug
      const selectedShow = shows.find(s => s.id === showId);
      const identifier = selectedShow?.slug || showId;

      // ✅ SỬA ĐÚNG LINK: /event/{slug}
      // Ưu tiên dùng slug, nếu không có thì dùng id
      const clientLink = `/event/${identifier}`;

      setFormData(prev => ({ ...prev, link: clientLink }));
    } else {
      // Nếu bỏ chọn thì xóa link
      setFormData(prev => ({ ...prev, link: '' }));
    }
  };

  // Submit form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // --- VALIDATION ---
    if (!formData.title?.trim()) {
      return toast.warn('Vui lòng nhập tiêu đề Banner!');
    }
    if (!formData.imageUrl) {
      return toast.warn('Vui lòng tải ảnh banner!');
    }
    if (!formData.menu) {
      return toast.warn('Vui lòng chọn vị trí hiển thị!');
    }
    if (!formData.link?.trim()) {
      return toast.warn('Vui lòng nhập hoặc chọn Show để tạo link!');
    }

    setLoading(true);
    try {
      if (isEditMode && id) {
        await updateBanner(id, formData);
        toast.success('Cập nhật thành công!');
      } else {
        await createBanner(formData);
        toast.success('Thêm banner mới thành công!');
      }
      navigate('/banners');
    } catch (error) {
      toast.error('Lỗi khi lưu dữ liệu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/banners')} className="p-2 hover:bg-gray-100 rounded-full transition-all">
          <HiOutlineArrowLeft size={24} className="text-gray-600" />
        </button>
        <h1 className="text-2xl font-bold text-gray-900">{isEditMode ? 'Chỉnh sửa Banner' : 'Thêm Banner mới'}</h1>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-8">

        {/* === CỘT TRÁI: ẢNH & LINK === */}
        <div className="space-y-4">
          <label className="text-sm font-bold text-gray-700">Hình ảnh Banner</label>
          <div
            onClick={() => fileInputRef.current?.click()}
            className="aspect-[2.5/1] border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-pink-300 transition-all overflow-hidden bg-gray-50 relative group"
          >
            {formData.imageUrl ? (
              <>
                <img src={formData.imageUrl} className="w-full h-full object-cover" alt="Banner" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                  <span className="text-white text-sm font-bold">Thay đổi ảnh</span>
                </div>
              </>
            ) : (
              <div className="text-center">
                <HiOutlineCloudUpload size={40} className="mx-auto text-gray-300 mb-2" />
                <p className="text-xs text-gray-400 font-medium">Tải ảnh lên (Tỷ lệ 2.5:1)</p>
              </div>
            )}
            <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={handleImageChange} />
          </div>

          {/* 👇 DROPDOWN CHỌN SHOW */}
          <div className="p-4 bg-purple-50 rounded-xl border border-purple-100 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-bold text-purple-900 flex items-center gap-2">
                <HiOutlineTicket className="text-purple-600" /> Chọn Show sự kiện
              </label>
            </div>

            <select
              className="w-full px-4 py-3 bg-white border border-purple-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-purple-500/20 shadow-sm"
              onChange={handleShowSelect}
              value={selectedShowId}
            >
              <option value="">-- Chọn show để tự động điền Link --</option>
              {shows.length > 0 ? (
                shows.map((show) => (
                  <option key={show.id} value={show.id}>
                    {show.title || show.name || "Show không tên"}
                  </option>
                ))
              ) : (
                <option disabled>Không tải được danh sách show</option>
              )}
            </select>
          </div>

          {/* INPUT LINK (Cho phép sửa tay) */}
          <div>
            <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
              <HiOutlineLink className="text-gray-400" /> Link đích (URL)
            </label>
            <input
              placeholder="https://... hoặc /event/..."
              className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl mt-1 outline-none focus:ring-2 focus:ring-pink-500/20"
              value={formData.link}
              onChange={e => {
                setFormData({ ...formData, link: e.target.value });
                // Nếu người dùng sửa tay, bỏ highlight ở dropdown
                if (selectedShowId) setSelectedShowId('');
              }}
            />
            <p className="text-[10px] text-gray-400 mt-1 italic">
              * Link nội bộ nên để dạng: /event/SLUG-HOAC-ID-CUA-SHOW
            </p>
          </div>
        </div>

        {/* === CỘT PHẢI: THÔNG TIN === */}
        <div className="space-y-4">
          <div>
            <label className="text-sm font-bold text-gray-700">Tiêu đề Banner</label>
            <input
              placeholder="Nhập tiêu đề..."
              className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl mt-1 outline-none focus:ring-2 focus:ring-pink-500/20"
              value={formData.title}
              onChange={e => setFormData({ ...formData, title: e.target.value })}
            />
          </div>

          <div>
            <label className="text-sm font-bold text-gray-700">Mô tả ngắn</label>
            <input
              placeholder="Nhập mô tả phụ..."
              className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl mt-1 outline-none focus:ring-2 focus:ring-pink-500/20"
              value={formData.subtitle}
              onChange={e => setFormData({ ...formData, subtitle: e.target.value })}
            />
          </div>

          <div>
            <label className="text-sm font-bold text-gray-700">Vị trí hiển thị</label>
            <select
              className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl mt-1 outline-none focus:ring-2 focus:ring-pink-500/20"
              value={formData.menu}
              onChange={e => setFormData({ ...formData, menu: e.target.value })}
            >
              <option value="homepage">Trang chủ (Main Hero)</option>
              <option value="news">Trang Tin tức</option>
              <option value="shows">Trang Sự kiện</option>
            </select>
          </div>

          <div className="flex gap-4">
            <div className="flex-1">
              <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                <HiOutlineSortAscending className="text-gray-400" /> Thứ tự
              </label>
              <input
                type="number"
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl mt-1 outline-none focus:ring-2 focus:ring-pink-500/20"
                value={formData.displayOrder}
                onChange={e => setFormData({ ...formData, displayOrder: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div className="flex-1 flex items-end pb-3">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={e => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-5 h-5 accent-pink-500 rounded-lg"
                />
                <span className="text-sm font-bold text-gray-700 group-hover:text-pink-600 transition-colors">Hoạt động</span>
              </label>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-gradient-to-r from-pink-500 to-rose-600 text-white rounded-2xl font-bold shadow-lg shadow-pink-200 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Đang lưu...
              </div>
            ) : (isEditMode ? 'Cập nhật Banner' : 'Công khai Banner')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddBanner;