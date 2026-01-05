// pages/CreateRoomPage.tsx
import React, { useState } from 'react';
import roomApi, { RoomInstancePayload } from '@/apis/roomApi';
import { useNavigate } from 'react-router-dom';

const CreateRoomPage: React.FC = () => {
  const navigate = useNavigate();
  
  // ID khách sạn cứng từ dữ liệu JSON bạn cung cấp
  const fixedHotelId = "6951f0b479a3a77b3676fe7d"; 

  // State quản lý form khớp với JSON yêu cầu
  const [formData, setFormData] = useState<RoomInstancePayload>({
    hotelId: fixedHotelId,
    roomTypeCode: '', // Người dùng cần nhập hoặc chọn mã loại phòng
    roomNumber: '',
    floor: 1,
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      // Nếu là floor thì convert sang number, còn lại giữ string
      [name]: name === 'floor' ? Number(value) : value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      // Validate cơ bản
      if (!formData.roomTypeCode || !formData.roomNumber || formData.floor < 0) {
        throw new Error("Vui lòng nhập đầy đủ thông tin: Mã loại phòng, số phòng và tầng.");
      }

      // Gọi API tạo phòng vật lý
      const res: any = await roomApi.createRoomInstance(formData);
      
      // Kiểm tra response dựa trên JSON bạn cung cấp
      if (res.success || (res.data && res.data.id)) {
        setMessage({ type: 'success', text: `Thêm phòng ${formData.roomNumber} thành công!` });
        
        // Reset form (giữ lại mã loại phòng để nhập tiếp phòng khác cùng loại cho nhanh)
        setFormData(prev => ({ 
            ...prev, 
            roomNumber: '', 
            floor: prev.floor // Giữ lại tầng để nhập tiếp
        }));
      }
    } catch (error: any) {
      console.error(error);
      const errorMsg = error.response?.data?.message || error.message || "Có lỗi xảy ra khi tạo phòng.";
      setMessage({ type: 'error', text: errorMsg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Thêm Phòng Mới</h2>
        <button 
            onClick={() => navigate('/rooms')}
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

        {/* Mã Loại Phòng (Room Type Code) */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Mã loại phòng (Room Type Code) <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="roomTypeCode"
            value={formData.roomTypeCode}
            onChange={handleChange}
            placeholder="Ví dụ: cbac3d8c-3ae0-4ac9..."
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            required
          />
          <p className="text-xs text-gray-500 mt-1">Nhập mã code của loại phòng (Ví dụ: Executive Suite code)</p>
        </div>

        {/* Số Phòng */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Số phòng (Room Number) <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="roomNumber"
            value={formData.roomNumber}
            onChange={handleChange}
            placeholder="Ví dụ: 307"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>

        {/* Tầng */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Tầng (Floor) <span className="text-red-500">*</span>
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

        <button
          type="submit"
          disabled={loading}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none disabled:bg-gray-400"
        >
          {loading ? 'Đang xử lý...' : 'Thêm phòng'}
        </button>
      </form>
    </div>
  );
};

export default CreateRoomPage;