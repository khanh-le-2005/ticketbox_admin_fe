import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  HiOutlineArrowLeft,
  HiOutlineCheckCircle,
  HiOutlineUser,
  HiOutlineMail,
  HiOutlineShieldCheck,
  HiOutlineLockClosed,
  HiOutlinePhone,
  HiOutlineIdentification,
  HiOutlineChevronDown // Thêm icon mũi tên cho dropdown
} from 'react-icons/hi';
// Import từ file api mới
import { createStaff, getStaffById, updateStaff } from '../apis/api_user';

const AddStaff: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditMode = !!id;

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEditMode);

  const [formData, setFormData] = useState({
    fullName: '',
    username: '',
    email: '',
    phone: '',
    role: 'VAN_HANH', // Mặc định vẫn là Vận hành
    password: '',
    confirmPassword: ''
  });

  useEffect(() => {
    if (isEditMode && id) {
      const fetchStaff = async () => {
        try {
          const data = await getStaffById(id);
          setFormData({
            fullName: data.fullName || '',
            username: data.username || '',
            email: data.email || '',
            phone: data.phone || '',
            role: data.role || 'VAN_HANH',
            password: '',
            confirmPassword: ''
          });
        } catch (error) {
          console.error("Lỗi khi tải dữ liệu nhân viên:", error);
          alert("Không thể tải dữ liệu nhân viên.");
        } finally {
          setFetching(false);
        }
      };
      fetchStaff();
    }
  }, [id, isEditMode]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.username || !formData.fullName) {
      alert("Vui lòng nhập Tên đăng nhập và Họ tên");
      return;
    }

    if (formData.password && formData.password !== formData.confirmPassword) {
      alert('Mật khẩu xác nhận không khớp!');
      return;
    }

    setLoading(true);
    try {
      const apiPayload = {
        fullName: formData.fullName,
        username: formData.username,
        email: formData.email,
        role: formData.role, 
        phone: formData.phone,
        password: formData.password
      };

      if (isEditMode && id) {
        const updatePayload = { ...apiPayload };
        if (!updatePayload.password) delete (updatePayload as any).password;

        await updateStaff(id, updatePayload);
        alert('Đã cập nhật tài khoản nhân viên thành công!');
      } else {
        await createStaff(apiPayload);
        alert('Đã tạo tài khoản nhân viên thành công!');
      }

      navigate('/users/staff');
    } catch (error: any) {
      console.error('Error saving staff:', error);
      const serverMsg = error.response?.data?.message || '';
      if (serverMsg.includes('username') || serverMsg.includes('exists')) {
        alert('Tên đăng nhập hoặc Email đã tồn tại!');
      } else {
        alert('Có lỗi xảy ra. Vui lòng thử lại.');
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
        <p className="font-bold uppercase text-xs tracking-widest">Đang tải dữ liệu nhân viên...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/users/staff')} className="p-2.5 bg-white hover:bg-gray-50 rounded-2xl text-gray-500 transition-all shadow-sm border border-gray-100">
          <HiOutlineArrowLeft size={24} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            {isEditMode ? 'Chỉnh sửa Tài khoản' : 'Tạo Tài khoản Nhân viên'}
          </h1>
          <p className="text-sm text-gray-500">
            {isEditMode ? `Đang cập nhật: ${formData.fullName}` : 'Thiết lập truy cập cho đội ngũ vận hành & soát vé'}
          </p>
        </div>
      </div>

      <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
        <form onSubmit={handleSave} className="space-y-6">

          {/* HỌ TÊN & USERNAME */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-bold text-gray-700 ml-1 flex items-center gap-2">
                <HiOutlineUser className="text-pink-500" />
                Họ và tên (Full Name) *
              </label>
              <input
                required
                name="fullName"
                className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-4 focus:ring-pink-500/10 focus:border-pink-500 transition-all font-medium"
                placeholder="VD: Ban Tổ Chức ABC"
                value={formData.fullName}
                onChange={handleInputChange}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-bold text-gray-700 ml-1 flex items-center gap-2">
                <HiOutlineIdentification className="text-pink-500" />
                Tên đăng nhập (Username) *
              </label>
              <input
                required
                name="username"
                className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-4 focus:ring-pink-500/10 focus:border-pink-500 transition-all font-mono"
                placeholder="VD: btc_event_abc"
                value={formData.username}
                onChange={handleInputChange}
                readOnly={isEditMode}
              />
            </div>
          </div>

          {/* EMAIL & PHONE */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-bold text-gray-700 ml-1 flex items-center gap-2">
                <HiOutlineMail className="text-pink-500" />
                Địa chỉ Email
              </label>
              <input
                required
                name="email"
                type="email"
                className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-4 focus:ring-pink-500/10 transition-all font-mono"
                placeholder="nv@hlgtech.com"
                value={formData.email}
                onChange={handleInputChange}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-bold text-gray-700 ml-1 flex items-center gap-2">
                <HiOutlinePhone className="text-pink-500" />
                Số điện thoại
              </label>
              <input
                name="phone"
                type="tel"
                className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-4 focus:ring-pink-500/10 transition-all"
                placeholder="09xx xxx xxx"
                value={formData.phone}
                onChange={handleInputChange}
              />
            </div>
          </div>

          {/* ROLE - ĐÃ CẬP NHẬT */}
          <div className="space-y-1.5">
            <label className="text-sm font-bold text-gray-700 ml-1 flex items-center gap-2">
              <HiOutlineShieldCheck className="text-pink-500" />
              Vai trò tài khoản
            </label>
            <div className="relative">
              <select
                name="role"
                // Đã đổi style từ bg-gray-100 (disabled) sang bg-gray-50 (active)
                className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-4 focus:ring-pink-500/10 focus:border-pink-500 transition-all font-bold text-gray-700 appearance-none cursor-pointer"
                value={formData.role}
                onChange={handleInputChange}
                // Đã bỏ thuộc tính disabled
              >
                <option value="VAN_HANH">Nhân viên Vận hành (VAN_HANH)</option>
                {/* Thêm option mới - Kiểm tra Backend xem value là QUET_VE hay SCANNER */}
                <option value="QUET_VE">Nhân viên Quét vé (QUET_VE)</option>
              </select>
              
              {/* Đổi icon thành mũi tên xuống */}
              <div className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                <HiOutlineChevronDown size={20} />
              </div>
            </div>
          </div>

          {/* PASSWORD */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-50">
            <div className="space-y-1.5">
              <label className="text-sm font-bold text-gray-700 ml-1 flex items-center gap-2">
                <HiOutlineLockClosed className="text-gray-400" />
                Mật khẩu {isEditMode && '(Để trống nếu không đổi)'}
              </label>
              <input
                required={!isEditMode}
                name="password"
                type="password"
                className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-pink-500/20"
                placeholder="Example: MatKhauManh122!"
                value={formData.password}
                onChange={handleInputChange}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-bold text-gray-700 ml-1">Xác nhận mật khẩu</label>
              <input
                required={!isEditMode || !!formData.password}
                name="confirmPassword"
                type="password"
                className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-pink-500/20"
                placeholder="Nhập lại mật khẩu"
                value={formData.confirmPassword}
                onChange={handleInputChange}
              />
            </div>
          </div>

          <div className="pt-6 flex gap-4">
            <button
              type="button"
              onClick={() => navigate('/users/staff')}
              className="flex-1 py-4 rounded-2xl font-bold text-gray-500 hover:bg-gray-100 transition-all"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-[2] py-4 rounded-2xl font-bold text-white bg-gradient-to-r from-pink-500 to-rose-600 shadow-lg shadow-pink-500/30 flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-70"
            >
              <HiOutlineCheckCircle size={22} />
              {loading ? 'Đang lưu...' : (isEditMode ? 'Cập nhật Tài khoản' : 'Lưu thông tin')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddStaff;