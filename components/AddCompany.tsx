import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  HiOutlineArrowLeft,
  HiOutlineCheckCircle,
  HiOutlineUser,
  HiOutlineMail,
  HiOutlineShieldCheck,
  HiOutlineLockClosed,
  HiOutlineIdentification,
  HiOutlinePhone
} from 'react-icons/hi';
import { createCompany, getCompanyById, updateCompany } from '../apis/api_company';
import { toast } from 'react-toastify'; // 👈 Import Toast

const AddCompany: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditMode = !!id;
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEditMode);

  const [formData, setFormData] = useState({
    fullName: '',
    username: '',
    email: '',
    phone: '', // Thêm trường phone
    password: '',
    role: 'TO_CHUC'
  });

  useEffect(() => {
    if (isEditMode && id) {
      const fetchCompany = async () => {
        try {
          const data = await getCompanyById(id);
          setFormData({
            fullName: data.fullName || '',
            username: data.username || '',
            email: data.email || '',
            phone: data.phone || '', // Thêm phone
            password: '', // Không tải mật khẩu vì lý do bảo mật
            role: data.role || 'TO_CHUC'
          });
        } catch (error) {
          console.error('Lỗi khi tải dữ liệu đối tác:', error);
          toast.error('Không thể tải dữ liệu đối tác.'); // Thay alert
        } finally {
          setFetching(false);
        }
      };
      fetchCompany();
    }
  }, [id, isEditMode]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    // --- VALIDATION ---
    if (!formData.fullName?.trim()) {
      return toast.warn('Vui lòng nhập tên đầy đủ của Đối tác.');
    }
    if (!formData.username?.trim()) {
      return toast.warn('Vui lòng nhập tên đăng nhập.');
    }
    if (!formData.email?.trim()) {
      return toast.warn('Vui lòng nhập email liên hệ.');
    }
    if (!formData.phone?.trim()) {
      return toast.warn('Vui lòng nhập số điện thoại.');
    }
    if (!isEditMode && !formData.password) {
      return toast.warn('Vui lòng nhập mật khẩu cho tài khoản mới.');
    }

    setLoading(true);
    try {
      // Tạo payload theo cấu trúc API mới
      const payload = {
        name: formData.fullName,
        username: formData.username,
        email: formData.email,
        phone: formData.phone,
        password: formData.password || undefined,
        role: formData.role
      };

      if (isEditMode && id) {
        await updateCompany(id, payload);
        toast.success('Cập nhật thông tin đối tác thành công!'); // Thay alert
      } else {
        await createCompany(payload);
        toast.success('Đã thêm đối tác công ty thành công!'); // Thay alert
      }

      // Quay lại tab đối tác
      navigate('/admin/companies');
    } catch (error: any) {
      console.error('Lỗi khi lưu đối tác:', error);

      // Xử lý thông báo lỗi chi tiết
      const serverMessage = error.response?.data?.message || "";

      if (serverMessage.includes("Email") && serverMessage.includes("đã được sử dụng")) {
        toast.error("⚠️ CẢNH BÁO: Email này đã tồn tại trong hệ thống! Vui lòng sử dụng một địa chỉ Email khác.");
      } else if (serverMessage.includes("Username") || serverMessage.includes("Tên đăng nhập")) {
        toast.error("⚠️ CẢNH BÁO: Tên đăng nhập đã có người dùng. Vui lòng chọn tên đăng nhập khác.");
      } else if (serverMessage.includes("Phone") || serverMessage.includes("Số điện thoại")) {
        toast.error("⚠️ CẢNH BÁO: Số điện thoại đã được sử dụng. Vui lòng sử dụng số điện thoại khác.");
      } else {
        toast.error(`Lỗi hệ thống: ${serverMessage || 'Không thể lưu thông tin. Vui lòng thử lại.'}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  if (fetching) {
    return (
      <div className="flex flex-col items-center justify-center py-40 text-gray-400">
        <div className="w-12 h-12 border-4 border-pink-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="font-bold uppercase text-xs tracking-widest">Đang tải dữ liệu đối tác...</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="p-2.5 bg-white hover:bg-gray-50 rounded-2xl text-gray-500 transition-all shadow-sm border border-gray-100"
        >
          <HiOutlineArrowLeft size={24} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            {isEditMode ? 'Chỉnh sửa Đối tác' : 'Thêm Đối tác Công ty'}
          </h1>
          <p className="text-sm text-gray-500 italic">
            {isEditMode ? `Đang cập nhật: ${formData.fullName}` : 'Đăng ký thông tin ban tổ chức và tài khoản hệ thống'}
          </p>
        </div>
      </div>

      <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
        <form onSubmit={handleSave} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2 space-y-2">
              <label className="text-sm font-bold text-gray-700 flex items-center gap-2 ml-1">
                <HiOutlineUser className="text-pink-500" />
                Tên đầy đủ (Full Name) *
              </label>
              <input
                required
                name="fullName"
                className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-4 focus:ring-pink-500/10 focus:border-pink-500 transition-all text-lg font-bold"
                placeholder="VD: Ban Tổ Chức Sự Kiện ABC"
                value={formData.fullName}
                onChange={handleInputChange}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700 flex items-center gap-2 ml-1">
                <HiOutlineIdentification className="text-pink-500" />
                Tên đăng nhập (Username) *
              </label>
              <input
                required
                name="username"
                className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-4 focus:ring-pink-500/10 transition-all font-mono"
                placeholder="btc_event_abc"
                value={formData.username}
                onChange={handleInputChange}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700 flex items-center gap-2 ml-1">
                <HiOutlineMail className="text-pink-500" />
                Email liên hệ *
              </label>
              <input
                required
                type="email"
                name="email"
                className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-4 focus:ring-pink-500/10 transition-all"
                placeholder="btc@wodtech.com"
                value={formData.email}
                onChange={handleInputChange}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700 flex items-center gap-2 ml-1">
                <HiOutlinePhone className="text-pink-500" />
                Số điện thoại *
              </label>
              <input
                required
                type="tel"
                name="phone"
                className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-4 focus:ring-pink-500/10 transition-all"
                placeholder="09xx xxx xxx"
                value={formData.phone}
                onChange={handleInputChange}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700 flex items-center gap-2 ml-1">
                <HiOutlineLockClosed className="text-pink-500" />
                Mật khẩu {isEditMode && '(Để trống nếu không đổi)'}
              </label>
              <input
                required={!isEditMode}
                type="password"
                name="password"
                className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-4 focus:ring-pink-500/10 transition-all"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleInputChange}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700 flex items-center gap-2 ml-1">
                <HiOutlineShieldCheck className="text-pink-500" />
                Vai trò mặc định
              </label>
              <select
                name="role"
                value={formData.role}
                disabled
                className="w-full px-5 py-3.5 bg-gray-100 border border-gray-200 rounded-xl outline-none cursor-not-allowed font-bold text-gray-500 appearance-none"
              >
                <option value="TO_CHUC">Đối tác (TO_CHUC)</option>
              </select>
            </div>
          </div>

          <div className="pt-8 flex gap-4">
            <button
              type="button"
              onClick={() => navigate('/users?tab=companies')}
              className="flex-1 py-4 rounded-2xl font-bold text-gray-500 hover:bg-gray-100 transition-all"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-[2] py-4 rounded-2xl font-bold text-white bg-gradient-to-r from-pink-500 to-rose-600 shadow-lg shadow-pink-500/30 flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-70"
            >
              <HiOutlineCheckCircle size={22} />
              {loading ? 'Đang xử lý...' : (isEditMode ? 'Cập nhật Đối tác' : 'Kích hoạt Đối tác')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddCompany;