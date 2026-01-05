import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  HiOutlineArrowLeft, 
  HiOutlineCloudUpload, 
  HiOutlineLink,
  HiOutlineSortAscending
} from 'react-icons/hi';
// IMPORT API
import { createBanner, getBannerById, updateBanner, Banner } from '../apis/api_banner-new';
import { uploadImageFile, getImageUrl } from '../apis/api_image'; 

const AddBanner: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditMode = !!id;
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<Omit<Banner, 'id'>>({
    title: '',
    subtitle: '', // Khớp với Banner.java
    imageUrl: '',
    link: '',
    menu: 'homepage', // Khớp với logic xử lý menu của Backend
    displayOrder: 1,
    isActive: true
  });

  // Tải dữ liệu khi ở chế độ Edit
  useEffect(() => {
    if (isEditMode && id) {
      const fetchBanner = async () => {
        try {
          const data = await getBannerById(id);
          setFormData({
            title: data.title,
            subtitle: data.subtitle || '',
            imageUrl: data.imageUrl,
            link: data.link,
            menu: data.menu || 'homepage',
            displayOrder: data.displayOrder || 1,
            isActive: data.isActive
          });
        } catch (error) {
          alert('Lỗi khi tải thông tin banner.');
          navigate('/banners');
        }
      };
      fetchBanner();
    }
  }, [id, isEditMode, navigate]);

  // Xử lý upload ảnh
  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    try {
      // 1. Gọi API upload ảnh (Backend trả về ID ảnh)
      const imageId = await uploadImageFile(file);
      // 2. Sử dụng hàm getImageUrl từ api_image để tạo link chuẩn
      const fullImageUrl = getImageUrl(imageId);
      
      setFormData(prev => ({ ...prev, imageUrl: fullImageUrl }));
    } catch (error) {
      alert('Không thể tải ảnh lên máy chủ. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  // Xử lý lưu dữ liệu
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.imageUrl) return alert('Vui lòng tải ảnh banner!');

    setLoading(true);
    try {
      if (isEditMode && id) {
        await updateBanner(id, formData);
        alert('Cập nhật thành công!');
      } else {
        await createBanner(formData);
        alert('Thêm banner mới thành công!');
      }
      navigate('/banners');
    } catch (error) {
      alert('Lỗi khi lưu dữ liệu. Vui lòng kiểm tra lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      {/* Header & Back Button */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/banners')} className="p-2 hover:bg-gray-100 rounded-full transition-all">
          <HiOutlineArrowLeft size={24} className="text-gray-600" />
        </button>
        <h1 className="text-2xl font-bold text-gray-900">{isEditMode ? 'Chỉnh sửa Banner' : 'Thêm Banner mới'}</h1>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Cột trái: Upload Ảnh */}
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
          
          {/* Input Link */}
          <div>
            <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
              <HiOutlineLink className="text-gray-400" /> Link liên kết
            </label>
            <input 
              placeholder="https://..."
              className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl mt-1 outline-none focus:ring-2 focus:ring-pink-500/20"
              value={formData.link}
              onChange={e => setFormData({...formData, link: e.target.value})}
            />
          </div>
        </div>

        {/* Cột phải: Thông tin */}
        <div className="space-y-4">
          <div>
            <label className="text-sm font-bold text-gray-700">Tiêu đề Banner</label>
            <input 
              required
              placeholder="Nhập tiêu đề chính..."
              className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl mt-1 outline-none focus:ring-2 focus:ring-pink-500/20"
              value={formData.title}
              onChange={e => setFormData({...formData, title: e.target.value})}
            />
          </div>

          {/* Subtitle - Trường quan trọng khớp với Java */}
          <div>
            <label className="text-sm font-bold text-gray-700">Mô tả ngắn (Subtitle)</label>
            <input 
              placeholder="Nhập mô tả phụ hiển thị dưới tiêu đề..."
              className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl mt-1 outline-none focus:ring-2 focus:ring-pink-500/20"
              value={formData.subtitle}
              onChange={e => setFormData({...formData, subtitle: e.target.value})}
            />
          </div>

          <div>
            <label className="text-sm font-bold text-gray-700">Vị trí hiển thị (Menu)</label>
            <select 
              className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl mt-1 outline-none focus:ring-2 focus:ring-pink-500/20"
              value={formData.menu}
              onChange={e => setFormData({...formData, menu: e.target.value})}
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
                    onChange={e => setFormData({...formData, displayOrder: parseInt(e.target.value) || 0})}
                />
            </div>
            <div className="flex-1 flex items-end pb-3">
                <label className="flex items-center gap-2 cursor-pointer group">
                    <input 
                        type="checkbox" 
                        checked={formData.isActive}
                        onChange={e => setFormData({...formData, isActive: e.target.checked})}
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
                Đang lưu dữ liệu...
              </div>
            ) : (isEditMode ? 'Cập nhật Banner' : 'Công khai Banner')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddBanner;