import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import roomApi from '@/apis/roomApi';

const EditRoomPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>(); // Lấy ID phòng từ URL

  // State form
  const [formData, setFormData] = useState({
    hotelId: '',
    roomTypeCode: '',
    roomNumber: '',
    floor: 1,
    status: 'AVAILABLE' // Thêm trạng thái
  });

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true); // Loading khi tải dữ liệu ban đầu
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // --- 1. LẤY DỮ LIỆU PHÒNG CŨ ---
  useEffect(() => {
    if (!id) return;

    const fetchRoomData = async () => {
      try {
        const res: any = await roomApi.getRoomById(id);
        const data = res.data?.data || res.data; // Xử lý response

        if (data) {
          setFormData({
            hotelId: data.hotelId || '',
            roomTypeCode: data.roomTypeCode || '',
            roomNumber: data.roomNumber || '',
            floor: data.floor || 1,
            status: data.status || 'AVAILABLE'
          });
        }
      } catch (error) {
        console.error("Lỗi tải phòng:", error);
        setMessage({ type: 'error', text: "Không thể tải thông tin phòng này." });
      } finally {
        setFetching(false);
      }
    };

    fetchRoomData();
  }, [id]);

  // --- 2. XỬ LÝ NHẬP LIỆU ---
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'floor' ? Number(value) : value,
    });
  };

  // --- 3. GỬI API CẬP NHẬT ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    setLoading(true);
    setMessage(null);

    try {
      // Validate
      if (!formData.roomNumber || formData.floor < 0) {
        throw new Error("Vui lòng nhập số phòng và tầng hợp lệ.");
      }

      // Gọi API Update
      await roomApi.updateRoom(id, formData);
      
      setMessage({ type: 'success', text: 'Cập nhật phòng thành công!' });
      
      // Delay chút rồi quay lại danh sách
      setTimeout(() => {
         navigate(-1); // Quay lại trang trước
      }, 1500);

    } catch (error: any) {
      console.error(error);
      const errorMsg = error.response?.data?.message || error.message || "Lỗi cập nhật.";
      setMessage({ type: 'error', text: errorMsg });
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return <div className="text-center p-10">Đang tải dữ liệu...</div>;

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Chỉnh Sửa Phòng</h2>
        <button 
            onClick={() => navigate(-1)}
            className="text-sm text-gray-500 hover:text-gray-700 underline"
        >
            Quay lại
        </button>
      </div>

      {message && (
        <div className={`p-3 mb-4 rounded ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Hotel ID (Readonly) */}
        <div>
          <label className="block text-sm font-medium text-gray-700">ID Khách sạn</label>
          <input
            type="text"
            value={formData.hotelId}
            disabled
            className="mt-1 block w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md text-gray-500 cursor-not-allowed"
          />
        </div>

        {/* Mã Loại Phòng (Readonly - Thường không nên sửa loại phòng khi edit, nếu cần thì bỏ disabled) */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Mã loại phòng</label>
          <input
            type="text"
            name="roomTypeCode"
            value={formData.roomTypeCode}
            disabled // Khuyên dùng: Không cho sửa loại phòng, muốn đổi loại thì xóa đi tạo lại
            className="mt-1 block w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md text-gray-500 cursor-not-allowed"
          />
        </div>

        {/* Số Phòng */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Số phòng <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="roomNumber"
            value={formData.roomNumber}
            onChange={handleChange}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>

        {/* Tầng */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Tầng <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            name="floor"
            value={formData.floor}
            onChange={handleChange}
            min="0"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>

        {/* Trạng thái (Mới thêm cho Edit) */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Trạng thái</label>
          <select
            name="status"
            value={formData.status}
            onChange={handleChange}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="AVAILABLE">Sẵn sàng (Available)</option>
            <option value="OCCUPIED">Đang ở (Occupied)</option>
            <option value="DIRTY">Chưa dọn (Dirty)</option>
            <option value="MAINTENANCE">Bảo trì (Maintenance)</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none disabled:bg-gray-400"
        >
          {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
        </button>
      </form>
    </div>
  );
};

export default EditRoomPage;