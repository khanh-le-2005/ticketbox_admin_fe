import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import hotelApi from "@/apis/hotelApi";
import { RoomTypePayload, CreateHotelRequest } from "@/type";

const CreateHotel: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  // 1. State lưu thông tin cơ bản
  const [info, setInfo] = useState({
    name: "",
    address: "",
    description: "",
  });

  // 2. State lưu danh sách FILE ẢNH (Raw File) thay vì URL
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]); // Để hiển thị xem trước

  // 3. State lưu thông tin loại phòng (Mặc định 1 phòng để test)
  const [roomTypes, setRoomTypes] = useState<RoomTypePayload[]>([
    {
      name: "",
      totalRooms: 1,
      standardCapacity: 2,
      maxCapacity: 4,
      surchargePerPerson: 50000,
      priceWeekday: 0,
      priceFriday: 0,
      priceSaturday: 0,
      priceSunday: 0,
    },
  ]);

  // --- HANDLER CHỌN ẢNH ---
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);

      // Lưu file gốc để gửi API
      setSelectedFiles((prev) => [...prev, ...newFiles]);

      // Tạo URL preview để hiển thị trên UI
      const newPreviews = newFiles.map((file) => URL.createObjectURL(file));
      setPreviewUrls((prev) => [...prev, ...newPreviews]);
    }
  };

  // --- HANDLER NHẬP TEXT ---
  const handleInfoChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setInfo({ ...info, [e.target.name]: e.target.value });
  };

  // --- HANDLER NHẬP ROOM TYPE (Ví dụ chỉnh sửa phòng đầu tiên) ---
  const handleRoomTypeChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    index: number
  ) => {
    const { name, value } = e.target;
    const newRoomTypes = [...roomTypes];

    // Nếu là trường số thì ép kiểu
    const isNumberField = [
      "totalRooms",
      "standardCapacity",
      "maxCapacity",
      "surchargePerPerson",
      "priceWeekday",
      "priceFriday",
      "priceSaturday",
      "priceSunday",
    ].includes(name);

    (newRoomTypes[index] as any)[name] = isNumberField ? Number(value) : value;
    setRoomTypes(newRoomTypes);
  };

  // --- SUBMIT FORM ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!info.name || selectedFiles.length === 0) {
      alert("Vui lòng nhập tên khách sạn và chọn ít nhất 1 ảnh.");
      return;
    }

    setLoading(true);

    try {
      // Chuẩn bị cục Data JSON
      const hotelData: CreateHotelRequest = {
        name: info.name,
        address: info.address,
        description: info.description,
        roomTypes: roomTypes, // Mảng loại phòng đầy đủ trường
      };

      console.log("Dữ liệu gửi đi:", { files: selectedFiles, data: hotelData });

      // Gọi API create mới (gửi FormData)
      await hotelApi.create(selectedFiles, hotelData);

      alert("Tạo khách sạn thành công!");
      navigate("/hotels");
    } catch (error: any) {
      console.error("Lỗi tạo khách sạn:", error);
      const msg = error.response?.data?.message || "Có lỗi xảy ra!";
      alert(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white shadow-md rounded-lg mt-10">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">
        Thêm Khách Sạn Mới
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* --- THÔNG TIN CHUNG --- */}
        <div className="grid grid-cols-1 gap-4">
          <input
            name="name"
            placeholder="Tên khách sạn"
            value={info.name}
            onChange={handleInfoChange}
            className="border p-2 rounded w-full"
            required
          />
          <input
            name="address"
            placeholder="Địa chỉ"
            value={info.address}
            onChange={handleInfoChange}
            className="border p-2 rounded w-full"
            required
          />
          <textarea
            name="description"
            placeholder="Mô tả"
            value={info.description}
            onChange={handleInfoChange}
            className="border p-2 rounded w-full"
          />
        </div>

        {/* --- UPLOAD ẢNH (Giao diện mới) --- */}
        <div>
          <label className="block font-semibold mb-2">Hình ảnh:</label>
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
          {/* Preview ảnh */}
          <div className="flex gap-2 mt-4 flex-wrap">
            {previewUrls.map((url, idx) => (
              <img
                key={idx}
                src={url}
                alt="preview"
                className="w-20 h-20 object-cover rounded border"
              />
            ))}
          </div>
        </div>

        {/* --- LOẠI PHÒNG (Demo 1 phòng để nhập giá) --- */}
        {/* --- CẤU HÌNH LOẠI PHÒNG (CHI TIẾT) --- */}
        <div className="border p-5 rounded-lg bg-gray-50 border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-lg text-gray-800">
              Cấu hình Loại phòng (Mẫu)
            </h3>
            <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded border">
              Room 1
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* 1. Tên & Tổng số phòng */}
            <div className="md:col-span-2 grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tên loại phòng <span className="text-red-500">*</span>
                </label>
                <input
                  name="name"
                  placeholder="VD: Deluxe View Biển"
                  value={roomTypes[0].name}
                  onChange={(e) => handleRoomTypeChange(e, 0)}
                  className="border border-gray-300 p-2.5 rounded w-full focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tổng số phòng <span className="text-red-500">*</span>
                </label>
                <input
                  name="totalRooms"
                  type="number"
                  min="1"
                  placeholder="VD: 5"
                  value={roomTypes[0].totalRooms}
                  onChange={(e) => handleRoomTypeChange(e, 0)}
                  className="border border-gray-300 p-2.5 rounded w-full focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>

            {/* 2. Sức chứa */}
            <div className="p-4 bg-white rounded border border-gray-200">
              <h4 className="font-semibold text-gray-600 mb-3 text-sm border-b pb-1">
                Sức chứa & Phụ thu
              </h4>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      Tiêu chuẩn (người)
                    </label>
                    <input
                      name="standardCapacity"
                      type="number"
                      value={roomTypes[0].standardCapacity}
                      onChange={(e) => handleRoomTypeChange(e, 0)}
                      className="border p-2 rounded w-full text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      Tối đa (người)
                    </label>
                    <input
                      name="maxCapacity"
                      type="number"
                      value={roomTypes[0].maxCapacity}
                      onChange={(e) => handleRoomTypeChange(e, 0)}
                      className="border p-2 rounded w-full text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Phụ thu quá người (VNĐ)
                  </label>
                  <input
                    name="surchargePerPerson"
                    type="number"
                    placeholder="VD: 50000"
                    value={roomTypes[0].surchargePerPerson}
                    onChange={(e) => handleRoomTypeChange(e, 0)}
                    className="border p-2 rounded w-full text-sm"
                  />
                </div>
              </div>
            </div>

            {/* 3. Cấu hình Giá tiền */}
            <div className="p-4 bg-white rounded border border-gray-200">
              <h4 className="font-semibold text-green-600 mb-3 text-sm border-b pb-1">
                Bảng giá theo ngày (VNĐ)
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Giá ngày thường (T2 - T5)
                  </label>
                  <input
                    name="priceWeekday"
                    type="number"
                    placeholder="VD: 200000"
                    value={roomTypes[0].priceWeekday}
                    onChange={(e) => handleRoomTypeChange(e, 0)}
                    className="border p-2 rounded w-full font-medium text-gray-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Giá Thứ 6
                  </label>
                  <input
                    name="priceFriday"
                    type="number"
                    value={roomTypes[0].priceFriday}
                    onChange={(e) => handleRoomTypeChange(e, 0)}
                    className="border p-2 rounded w-full text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Giá Thứ 7
                  </label>
                  <input
                    name="priceSaturday"
                    type="number"
                    value={roomTypes[0].priceSaturday}
                    onChange={(e) => handleRoomTypeChange(e, 0)}
                    className="border p-2 rounded w-full text-sm"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Giá Chủ Nhật
                  </label>
                  <input
                    name="priceSunday"
                    type="number"
                    value={roomTypes[0].priceSunday}
                    onChange={(e) => handleRoomTypeChange(e, 0)}
                    className="border p-2 rounded w-full text-sm"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-3 rounded hover:bg-blue-700 disabled:bg-gray-400 font-bold"
        >
          {loading ? "Đang xử lý..." : "Tạo Khách Sạn"}
        </button>
      </form>
    </div>
  );
};

export default CreateHotel;
