import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  HiOutlineArrowLeft,
  HiOutlineCheckCircle,
  HiOutlineUser,
  HiOutlineMail,
  HiOutlineShieldCheck,
  HiOutlineLockClosed,
  HiOutlinePhone,
  HiOutlineIdentification,
  HiOutlineChevronDown,
} from "react-icons/hi";
// Import từ file api đã cập nhật
import { createStaff, getStaffById, updateStaff } from "../apis/api_staff";

const AddStaff: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditMode = !!id;

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEditMode);

  const [formData, setFormData] = useState({
    fullName: "",
    username: "",
    email: "",
    phone: "",
    role: "VAN_HANH",
    password: "",
    confirmPassword: "",
  });

  // --- TẢI DỮ LIỆU KHI EDIT ---
  useEffect(() => {
    if (isEditMode && id) {
      const fetchStaff = async () => {
        try {
          const data = await getStaffById(id);
          // Map dữ liệu từ API vào Form
          setFormData({
            fullName: data.fullName || "",
            username: data.username || "",
            email: data.email || "",
            phone: data.phone ?? undefined, // Nếu null thì set thành rỗng
            role: data.role || "VAN_HANH",
            password: "",
            confirmPassword: "",
          });
        } catch (error) {
          console.error("Lỗi khi tải dữ liệu nhân viên:", error);
          alert(
            "Không thể tải thông tin nhân viên (ID không tồn tại hoặc lỗi mạng)."
          );
          navigate("/users/staff"); // Quay về danh sách nếu lỗi
        } finally {
          setFetching(false);
        }
      };
      fetchStaff();
    }
  }, [id, isEditMode, navigate]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    // 1. VALIDATION CƠ BẢN
    if (!formData.username || !formData.fullName) {
      alert("Vui lòng nhập đầy đủ: Tên đăng nhập và Họ tên.");
      return;
    }

    // 2. VALIDATION PHONE (Cho phép rỗng, nhưng nếu nhập phải đúng format)
    if (formData.phone && formData.phone.trim() !== "") {
      const phoneRegex = /(84|0[3|5|7|8|9])+([0-9]{8})\b/;
      if (!phoneRegex.test(formData.phone)) {
        alert("⚠️ Số điện thoại không hợp lệ! (VD: 0987654321)");
        return;
      }
    }

    // 3. CHECK PASSWORD
    if (formData.password && formData.password !== formData.confirmPassword) {
      alert("⚠️ Mật khẩu xác nhận không khớp!");
      return;
    }

    setLoading(true);
    try {
      const apiPayload = {
        fullName: formData.fullName,
        username: formData.username,
        email: formData.email,
        role: formData.role,
        phone: formData.phone, // API sẽ nhận chuỗi rỗng nếu user không nhập
        password: formData.password,
      };

      if (formData.phone && formData.phone.trim() !== "") {
        apiPayload.phone = formData.phone.trim();
      }

      // ✅ CHỈ GỬI PASSWORD KHI USER NHẬP
      if (formData.password) {
        apiPayload.password = formData.password;
      }

      if (isEditMode && id) {
        // Update: Bỏ password khỏi payload nếu user không nhập mới
        const updatePayload = { ...apiPayload };
        if (!updatePayload.password) delete (updatePayload as any).password;

        await updateStaff(id, updatePayload);
        alert(`✅ Cập nhật thành công: ${formData.fullName}`);
      } else {
        // Create
        await createStaff(apiPayload);
        alert(`✅ Tạo mới thành công: ${formData.fullName}`);
      }

      navigate("/users/staff");
    } catch (error: any) {
      console.error("Lỗi Submit:", error);

      const serverData = error.response?.data;
      const message =
        serverData?.message || error.message || "Lỗi không xác định";

      alert(`❌ Thất bại: ${message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  if (fetching) {
    return (
      <div className="flex flex-col items-center justify-center py-40 text-gray-400">
        <div className="w-12 h-12 border-4 border-pink-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="font-bold uppercase text-xs tracking-widest">
          Đang tải dữ liệu...
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* HEADER */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate("/users/staff")}
          className="p-2.5 bg-white hover:bg-gray-50 rounded-2xl text-gray-500 transition-all shadow-sm border border-gray-100"
        >
          <HiOutlineArrowLeft size={24} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            {isEditMode ? "Chỉnh sửa Thông tin" : "Tạo Tài khoản Mới"}
          </h1>
          <p className="text-sm text-gray-500">
            {isEditMode ? `ID: ${id}` : "Quản lý quyền truy cập hệ thống"}
          </p>
        </div>
      </div>

      {/* FORM CARD */}
      <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
        <form onSubmit={handleSave} className="space-y-6">
          {/* USERNAME & FULLNAME */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-bold text-gray-700 ml-1 flex items-center gap-2">
                <HiOutlineIdentification className="text-pink-500" />
                Username *
              </label>
              <input
                required
                name="username"
                className={`w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-4 focus:ring-pink-500/10 focus:border-pink-500 transition-all font-mono ${isEditMode ? "opacity-70 cursor-not-allowed" : ""}`}
                placeholder="username123"
                value={formData.username}
                onChange={handleInputChange}
                readOnly={isEditMode} // Thường username không cho sửa
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-bold text-gray-700 ml-1 flex items-center gap-2">
                <HiOutlineUser className="text-pink-500" />
                Họ và tên *
              </label>
              <input
                required
                name="fullName"
                className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-4 focus:ring-pink-500/10 focus:border-pink-500 transition-all font-medium"
                placeholder="Nguyễn Văn A"
                value={formData.fullName}
                onChange={handleInputChange}
              />
            </div>
          </div>

          {/* EMAIL & PHONE */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-bold text-gray-700 ml-1 flex items-center gap-2">
                <HiOutlineMail className="text-pink-500" />
                Email
              </label>
              <input
                required
                name="email"
                type="email"
                className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-4 focus:ring-pink-500/10 transition-all font-mono"
                placeholder="email@example.com"
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
                placeholder="0912 345 678"
                value={formData.phone}
                onChange={handleInputChange}
              />
            </div>
          </div>

          {/* ROLE SELECT */}
          <div className="space-y-1.5">
            <label className="text-sm font-bold text-gray-700 ml-1 flex items-center gap-2">
              <HiOutlineShieldCheck className="text-pink-500" />
              Phân quyền
            </label>
            <div className="relative">
              <select
                name="role"
                className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-4 focus:ring-pink-500/10 focus:border-pink-500 transition-all font-bold text-gray-700 appearance-none cursor-pointer"
                value={formData.role}
                onChange={handleInputChange}
              >
                <option value="VAN_HANH">Nhân viên Vận hành (VAN_HANH)</option>
                <option value="QUET_VE">Nhân viên Quét vé (QUET_VE)</option>
                {/* Đã thêm option TO_CHUC dựa trên JSON trả về */}
                {/* <option value="TO_CHUC">Ban Tổ Chức (TO_CHUC)</option> */}
              </select>
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
                Mật khẩu {isEditMode && "(Để trống nếu không đổi)"}
              </label>
              <input
                required={!isEditMode}
                name="password"
                type="password"
                className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-pink-500/20"
                placeholder="••••••"
                value={formData.password}
                onChange={handleInputChange}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-bold text-gray-700 ml-1">
                Nhập lại mật khẩu
              </label>
              <input
                required={!isEditMode || !!formData.password}
                name="confirmPassword"
                type="password"
                className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-pink-500/20"
                placeholder="••••••"
                value={formData.confirmPassword}
                onChange={handleInputChange}
              />
            </div>
          </div>

          {/* ACTION BUTTONS */}
          <div className="pt-6 flex gap-4">
            <button
              type="button"
              onClick={() => navigate("/users/staff")}
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
              {loading ? "Đang xử lý..." : "Lưu thay đổi"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddStaff;
