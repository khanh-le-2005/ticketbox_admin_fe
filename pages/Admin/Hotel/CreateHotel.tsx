import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import hotelApi from "@/apis/hotelApi";
import { CreateHotelRequest } from "@/type";
import { toast } from 'react-toastify'; // 👈 IMPORT TOAST

interface RoomTypeState {
  name: string;
  totalRooms: number;
  standardCapacity: number;
  maxCapacity: number;
  priceMonToThu: number;
  priceFriday: number;
  priceSaturday: number;
  priceSunday: number;
  surchargeSunToThu: number;
  surchargeFriSat: number;
}

const CreateHotel: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  // 1. Thông tin chung
  const [info, setInfo] = useState({
    name: "",
    address: "",
    description: "",
  });

  // 2. File ảnh
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);

  // 3. Cấu hình loại phòng
  const [roomTypes, setRoomTypes] = useState<RoomTypeState[]>([
    {
      name: "",
      totalRooms: 1,
      standardCapacity: 2,
      maxCapacity: 4,
      priceMonToThu: 0,
      priceFriday: 0,
      priceSaturday: 0,
      priceSunday: 0,
      surchargeSunToThu: 0,
      surchargeFriSat: 0,
    },
  ]);

  const numberInputClass =
    "border border-gray-300 p-2.5 rounded w-full focus:ring-2 focus:ring-blue-500 outline-none";

  // --- HANDLER: CHỌN ẢNH ---
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      setSelectedFiles((prev) => [...prev, ...newFiles]);
      const newPreviews = newFiles.map((file) => URL.createObjectURL(file));
      setPreviewUrls((prev) => [...prev, ...newPreviews]);
      e.target.value = "";
    }
  };

  // --- HANDLER: XÓA ẢNH ---
  const handleRemoveImage = (index: number) => {
    URL.revokeObjectURL(previewUrls[index]);
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviewUrls((prev) => prev.filter((_, i) => i !== index));
  };

  // --- HANDLER: NHẬP TEXT ---
  const handleInfoChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setInfo({ ...info, [e.target.name]: e.target.value });
  };

  // --- HANDLER: NHẬP ROOM TYPE ---
  const handleRoomTypeChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    index: number
  ) => {
    const { name, value } = e.target;
    
    const numberFields = [
      "totalRooms",
      "standardCapacity",
      "maxCapacity",
      "priceMonToThu",
      "priceFriday",
      "priceSaturday",
      "priceSunday",
      "surchargeSunToThu",
      "surchargeFriSat",
    ];

    const isNumberField = numberFields.includes(name);

    if (isNumberField) {
      if (!/^\d*$/.test(value)) return;
    }

    const newRoomTypes = [...roomTypes];
    
    (newRoomTypes[index] as any)[name] = isNumberField 
      ? (value === "" ? 0 : Number(value)) 
      : value;

    setRoomTypes(newRoomTypes);
  };

  // --- SUBMIT ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!info.name || selectedFiles.length === 0) {
      // 👇 THAY ALERT BẰNG TOAST
      toast.error("Vui lòng nhập tên khách sạn và chọn ảnh.");
      return;
    }

    if (roomTypes[0].priceMonToThu <= 0) {
      // 👇 THAY ALERT BẰNG TOAST
      toast.error("Vui lòng nhập giá phòng ngày thường (T2-T5).");
      return;
    }

    setLoading(true);

    try {
      const hotelData: CreateHotelRequest = {
        name: info.name,
        address: info.address,
        description: info.description,
        roomTypes: roomTypes,
      };

      await hotelApi.create(selectedFiles, hotelData);

      // 👇 THAY ALERT BẰNG TOAST
      toast.success("Tạo khách sạn thành công!");
      navigate("/hotels");
    } catch (error: any) {
      console.error("Lỗi:", error);
      const msg = error.response?.data?.message || "Có lỗi xảy ra!";
      
      // 👇 THAY ALERT BẰNG TOAST
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white shadow-md rounded-lg mt-10 mb-20">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">
        Thêm Khách Sạn Mới
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 1. THÔNG TIN CHUNG */}
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
            rows={3}
          />
        </div>

        {/* 2. HÌNH ẢNH */}
        <div>
          <label className="block font-semibold mb-2">
            Hình ảnh ({selectedFiles.length}):
          </label>
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />

          <div className="flex gap-4 mt-4 flex-wrap">
            {previewUrls.map((url, idx) => (
              <div
                key={idx}
                className="relative group w-24 h-24 border rounded overflow-hidden shadow-sm"
              >
                <img
                  src={url}
                  alt="preview"
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveImage(idx)}
                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs shadow-md hover:bg-red-600 transition-colors"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* 3. CẤU HÌNH LOẠI PHÒNG */}
        <div className="border p-5 rounded-lg bg-gray-50 border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-lg text-gray-800">
              Cấu hình Loại phòng
            </h3>
            <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded border">
              Room 1
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Tên & Số lượng */}
            <div className="md:col-span-2 grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tên loại phòng *
                </label>
                <input
                  name="name"
                  placeholder="VD: Deluxe View Biển"
                  value={roomTypes[0].name}
                  onChange={(e) => handleRoomTypeChange(e, 0)}
                  className="border border-gray-300 p-2.5 rounded w-full focus:ring-2 focus:ring-blue-500 outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tổng số phòng *
                </label>
                <input
                  name="totalRooms"
                  type="text" 
                  inputMode="numeric"
                  value={roomTypes[0].totalRooms}
                  onChange={(e) => handleRoomTypeChange(e, 0)}
                  className={numberInputClass}
                  required
                />
              </div>
            </div>

            {/* Sức chứa & Phụ thu */}
            <div className="md:col-span-2 p-4 bg-white rounded border border-gray-200">
              <h4 className="font-semibold text-gray-600 mb-3 text-sm border-b pb-1">
                Sức chứa & Phụ thu (VNĐ)
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Sức chứa */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      Tiêu chuẩn (người)
                    </label>
                    <input
                      name="standardCapacity"
                      type="text"
                      inputMode="numeric"
                      value={roomTypes[0].standardCapacity}
                      onChange={(e) => handleRoomTypeChange(e, 0)}
                      className={numberInputClass}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      Tối đa (người)
                    </label>
                    <input
                      name="maxCapacity"
                      type="text"
                      inputMode="numeric"
                      value={roomTypes[0].maxCapacity}
                      onChange={(e) => handleRoomTypeChange(e, 0)}
                      className={numberInputClass}
                    />
                  </div>
                </div>

                {/* Phụ thu */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      Phụ thu (CN - T5)
                    </label>
                    <input
                      name="surchargeSunToThu"
                      type="text"
                      inputMode="numeric"
                      value={roomTypes[0].surchargeSunToThu}
                      onChange={(e) => handleRoomTypeChange(e, 0)}
                      className={numberInputClass}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      Phụ thu (T6, T7)
                    </label>
                    <input
                      name="surchargeFriSat"
                      type="text"
                      inputMode="numeric"
                      value={roomTypes[0].surchargeFriSat}
                      onChange={(e) => handleRoomTypeChange(e, 0)}
                      className={numberInputClass}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Bảng giá chi tiết */}
            <div className="md:col-span-2 p-4 bg-white rounded border border-gray-200">
              <h4 className="font-semibold text-green-600 mb-3 text-sm border-b pb-1">
                Cấu hình giá phòng (VNĐ)
              </h4>
              <div className="grid grid-cols-2 gap-4">
                {/* Giá Ngày Thường */}
                <div className="col-span-2 md:col-span-1">
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Giá Thứ 2 - Thứ 5
                  </label>
                  <input
                    name="priceMonToThu"
                    type="text"
                    inputMode="numeric"
                    value={roomTypes[0].priceMonToThu}
                    onChange={(e) => handleRoomTypeChange(e, 0)}
                    className={`${numberInputClass} font-medium text-gray-800 bg-gray-50 focus:bg-white`}
                  />
                </div>

                {/* Giá Thứ 6 */}
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Giá Thứ 6
                  </label>
                  <input
                    name="priceFriday"
                    type="text"
                    inputMode="numeric"
                    value={roomTypes[0].priceFriday}
                    onChange={(e) => handleRoomTypeChange(e, 0)}
                    className={numberInputClass}
                  />
                </div>

                {/* Giá Thứ 7 */}
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Giá Thứ 7 (Cao điểm)
                  </label>
                  <input
                    name="priceSaturday"
                    type="text"
                    inputMode="numeric"
                    value={roomTypes[0].priceSaturday}
                    onChange={(e) => handleRoomTypeChange(e, 0)}
                    className={`${numberInputClass} text-red-600 font-semibold`}
                  />
                </div>

                {/* Giá Chủ Nhật */}
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Giá Chủ Nhật
                  </label>
                  <input
                    name="priceSunday"
                    type="text"
                    inputMode="numeric"
                    value={roomTypes[0].priceSunday}
                    onChange={(e) => handleRoomTypeChange(e, 0)}
                    className={numberInputClass}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* NÚT SUBMIT */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-3 rounded hover:bg-blue-700 disabled:bg-gray-400 font-bold transition-all"
        >
          {loading ? "Đang xử lý..." : "Tạo Khách Sạn"}
        </button>
      </form>
    </div>
  );
};

export default CreateHotel;