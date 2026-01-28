import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import hotelApi from "@/apis/hotelApi";
import { CreateHotelRequest } from "@/type";
import { toast } from 'react-toastify';
import {
  FaHotel, FaMapMarkerAlt, FaInfoCircle, FaImage, FaCloudUploadAlt,
  FaTrash, FaBed, FaUserFriends, FaMoneyBillWave, FaSave, FaTimes, FaArrowLeft
} from "react-icons/fa";
import { RoomTypeState } from "@/type/hotel.type";

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

  const inputClass = "w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all font-medium text-slate-700 placeholder-slate-400";
  const labelClass = "block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2";

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

  // --- HANDLER: KÉO THẢ ẢNH ---
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault(); // Cho phép drop
  };

  const handleDrop = (dropIndex: number) => {
    if (draggedIndex === null || draggedIndex === dropIndex) return;

    // Sắp xếp lại selectedFiles
    const newFiles = [...selectedFiles];
    const [draggedFile] = newFiles.splice(draggedIndex, 1);
    newFiles.splice(dropIndex, 0, draggedFile);
    setSelectedFiles(newFiles);

    // Sắp xếp lại previewUrls
    const newUrls = [...previewUrls];
    const [draggedUrl] = newUrls.splice(draggedIndex, 1);
    newUrls.splice(dropIndex, 0, draggedUrl);
    setPreviewUrls(newUrls);

    setDraggedIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
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

    // --- VALIDATION ---
    if (!info.name?.trim()) {
      return toast.warn("Vui lòng nhập tên khách sạn.");
    }
    if (!info.address?.trim()) {
      return toast.warn("Vui lòng nhập địa chỉ khách sạn.");
    }
    if (selectedFiles.length === 0) {
      return toast.warn("Vui lòng chọn ít nhất một ảnh cho thư viện.");
    }

    const rt = roomTypes[0];
    if (!rt.name?.trim()) {
      return toast.warn("Vui lòng nhập tên loại phòng đầu tiên.");
    }
    if (rt.totalRooms <= 0) {
      return toast.warn("Số lượng phòng phải lớn hơn 0.");
    }
    if (rt.priceMonToThu <= 0) {
      return toast.warn("Giá phòng ngày thường phải lớn hơn 0.");
    }

    setLoading(true);

    try {
      const hotelData: CreateHotelRequest = {
        name: info.name,
        address: info.address,
        description: info.description,
        galleryImageIds: [], // Empty array for new hotel creation; images uploaded as files
        roomTypes: roomTypes.map((rt) => ({
          name: rt.name,
          totalRooms: rt.totalRooms,
          standardCapacity: rt.standardCapacity,
          maxCapacity: rt.maxCapacity,
          priceMonToThu: rt.priceMonToThu,
          priceFriday: rt.priceFriday > 0 ? rt.priceFriday : rt.priceMonToThu,
          priceSaturday: rt.priceSaturday > 0 ? rt.priceSaturday : rt.priceMonToThu,
          priceSunday: rt.priceSunday > 0 ? rt.priceSunday : rt.priceMonToThu,
          surchargeSunToThu: rt.surchargeSunToThu,
          surchargeFriSat: rt.surchargeFriSat,
          surchargePerPerson: 0, // Default value as UI doesn't have this field yet
        })),
      };

      await hotelApi.create(selectedFiles, hotelData);

      toast.success("Tạo khách sạn thành công!");
      navigate("/hotels");
    } catch (error: any) {
      console.error("Lỗi:", error);
      const msg = error.response?.data?.message || "Có lỗi xảy ra!";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-8 font-sans">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/hotels')}
              className="p-2 bg-white border border-slate-200 rounded-xl text-slate-500 hover:text-orange-600 hover:border-orange-200 transition-all shadow-sm"
            >
              <FaArrowLeft />
            </button>
            <div>
              <h1 className="text-2xl font-extrabold text-slate-800 flex items-center gap-2">
                <FaHotel className="text-orange-500" />
                Thêm Khách Sạn Mới
              </h1>
              <p className="text-slate-500 text-sm font-medium">Điền thông tin chi tiết để tạo mới khách sạn vào hệ thống.</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column: General Info & Images */}
            <div className="lg:col-span-2 space-y-8">

              {/* 1. THÔNG TIN CHUNG */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2 border-b border-slate-100 pb-4">
                  <span className="bg-blue-100 p-2 rounded-lg text-blue-600"><FaInfoCircle /></span>
                  Thông Tin Chung
                </h3>

                <div className="space-y-5">
                  <div>
                    <label className={labelClass}>Tên khách sạn <span className="text-red-500">*</span></label>
                    <input
                      name="name"
                      placeholder="VD: Khách sạn Mơ Màng Đà Lạt"
                      value={info.name}
                      onChange={handleInfoChange}
                      className={inputClass}
                      required
                    />
                  </div>

                  <div>
                    <label className={labelClass}><FaMapMarkerAlt className="text-slate-400" /> Địa chỉ <span className="text-red-500">*</span></label>
                    <input
                      name="address"
                      placeholder="VD: 123 Đường Hoa Hồng, Phường 4..."
                      value={info.address}
                      onChange={handleInfoChange}
                      className={inputClass}
                      required
                    />
                  </div>

                  <div>
                    <label className={labelClass}>Mô tả chi tiết</label>
                    <textarea
                      name="description"
                      placeholder="Mô tả về không gian, tiện ích, phong cách..."
                      value={info.description}
                      onChange={handleInfoChange}
                      className={inputClass}
                      rows={4}
                    />
                  </div>
                </div>
              </div>

              {/* 2. HÌNH ẢNH */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2 border-b border-slate-100 pb-4">
                  <span className="bg-purple-100 p-2 rounded-lg text-purple-600"><FaImage /></span>
                  Thư Viện Ảnh (Kéo thả để sắp xếp)
                </h3>

                <div className="space-y-4">
                  <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:bg-slate-50 transition-colors cursor-pointer relative group">
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleFileChange}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                    <div className="flex flex-col items-center justify-center text-slate-400 group-hover:text-orange-500 transition-colors">
                      <FaCloudUploadAlt size={48} className="mb-3" />
                      <p className="font-bold text-lg">Kéo thả hoặc click để tải ảnh lên</p>
                      <p className="text-sm mt-1">Hỗ trợ JPG, PNG, WEBP (Tối đa 5MB/ảnh)</p>
                    </div>
                  </div>

                  {previewUrls.length > 0 && (
                    <div className="grid grid-cols-4 sm:grid-cols-5 gap-4 mt-4">
                      {previewUrls.map((url, idx) => (
                        <div
                          key={idx}
                          draggable
                          onDragStart={() => handleDragStart(idx)}
                          onDragOver={handleDragOver}
                          onDrop={() => handleDrop(idx)}
                          onDragEnd={handleDragEnd}
                          className={`relative group aspect-square rounded-xl overflow-hidden border border-slate-200 shadow-sm cursor-move transition-all ${draggedIndex === idx ? 'opacity-50 scale-95 border-orange-400' : 'hover:shadow-md'
                            }`}
                        >
                          <img src={url} alt="preview" className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(idx)}
                            className="absolute top-1 right-1 bg-red-500/80 hover:bg-red-600 text-white p-1.5 rounded-full backdrop-blur-sm transition-all opacity-0 group-hover:opacity-100 transform scale-90 group-hover:scale-100"
                          >
                            <FaTrash size={10} />
                          </button>
                          <div className="absolute top-1 left-1 bg-black/50 text-white text-[10px] px-1.5 py-0.5 rounded backdrop-blur-sm">
                            {idx + 1}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column: Room Config & Actions */}
            <div className="lg:col-span-1 space-y-8">

              {/* 3. CẤU HÌNH LOẠI PHÒNG */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2 border-b border-slate-100 pb-4">
                  <span className="bg-orange-100 p-2 rounded-lg text-orange-600"><FaBed /></span>
                  Cấu Hình Phòng
                </h3>

                <div className="space-y-6">
                  {/* Basic Room Info */}
                  <div className="space-y-4">
                    <div>
                      <label className={labelClass}>Tên loại phòng <span className="text-red-500">*</span></label>
                      <input
                        name="name"
                        placeholder="VD: Deluxe View Biển"
                        value={roomTypes[0].name}
                        onChange={(e) => handleRoomTypeChange(e, 0)}
                        className={inputClass}
                        required
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Tổng số phòng <span className="text-red-500">*</span></label>
                      <input
                        name="totalRooms"
                        type="text"
                        inputMode="numeric"
                        value={roomTypes[0].totalRooms}
                        onChange={(e) => handleRoomTypeChange(e, 0)}
                        className={inputClass}
                        required
                      />
                    </div>
                  </div>

                  {/* Capacity */}
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-4">
                    <h4 className="font-bold text-slate-700 text-sm flex items-center gap-2">
                      <FaUserFriends className="text-slate-400" /> Sức Chứa
                    </h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-semibold text-slate-500 mb-1 block">Tiêu chuẩn</label>
                        <input
                          name="standardCapacity"
                          type="text"
                          inputMode="numeric"
                          value={roomTypes[0].standardCapacity}
                          onChange={(e) => handleRoomTypeChange(e, 0)}
                          className="w-full p-2 bg-white border border-slate-200 rounded-lg text-center font-bold text-slate-700 focus:ring-2 focus:ring-orange-500/20 outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-slate-500 mb-1 block">Tối đa</label>
                        <input
                          name="maxCapacity"
                          type="text"
                          inputMode="numeric"
                          value={roomTypes[0].maxCapacity}
                          onChange={(e) => handleRoomTypeChange(e, 0)}
                          className="w-full p-2 bg-white border border-slate-200 rounded-lg text-center font-bold text-slate-700 focus:ring-2 focus:ring-orange-500/20 outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Pricing */}
                  <div className="p-4 bg-orange-50 rounded-xl border border-orange-100 space-y-4">
                    <h4 className="font-bold text-orange-800 text-sm flex items-center gap-2">
                      <FaMoneyBillWave className="text-orange-500" /> Giá Phòng (VNĐ)
                    </h4>

                    <div>
                      <label className="text-xs font-bold text-orange-700 mb-1 block">Giá Thứ 2 - Thứ 5 <span className="text-red-500">*</span></label>
                      <input
                        name="priceMonToThu"
                        type="text"
                        inputMode="numeric"
                        value={roomTypes[0].priceMonToThu}
                        onChange={(e) => handleRoomTypeChange(e, 0)}
                        className="w-full p-2 bg-white border border-orange-200 rounded-lg font-bold text-orange-600 focus:ring-2 focus:ring-orange-500/20 outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-semibold text-orange-700/70 mb-1 block">Thứ 6</label>
                        <input
                          name="priceFriday"
                          type="text"
                          inputMode="numeric"
                          value={roomTypes[0].priceFriday}
                          onChange={(e) => handleRoomTypeChange(e, 0)}
                          className="w-full p-2 bg-white border border-orange-200 rounded-lg text-sm font-medium text-slate-700 focus:ring-2 focus:ring-orange-500/20 outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-orange-700/70 mb-1 block">Thứ 7</label>
                        <input
                          name="priceSaturday"
                          type="text"
                          inputMode="numeric"
                          value={roomTypes[0].priceSaturday}
                          onChange={(e) => handleRoomTypeChange(e, 0)}
                          className="w-full p-2 bg-white border border-orange-200 rounded-lg text-sm font-medium text-red-500 focus:ring-2 focus:ring-orange-500/20 outline-none"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="text-xs font-semibold text-orange-700/70 mb-1 block">Chủ Nhật</label>
                        <input
                          name="priceSunday"
                          type="text"
                          inputMode="numeric"
                          value={roomTypes[0].priceSunday}
                          onChange={(e) => handleRoomTypeChange(e, 0)}
                          className="w-full p-2 bg-white border border-orange-200 rounded-lg text-sm font-medium text-slate-700 focus:ring-2 focus:ring-orange-500/20 outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Surcharges */}
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-4">
                    <h4 className="font-bold text-slate-700 text-sm flex items-center gap-2">
                      Phụ Thu (VNĐ)
                    </h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-semibold text-slate-500 mb-1 block">CN - T5</label>
                        <input
                          name="surchargeSunToThu"
                          type="text"
                          inputMode="numeric"
                          value={roomTypes[0].surchargeSunToThu}
                          onChange={(e) => handleRoomTypeChange(e, 0)}
                          className="w-full p-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 focus:ring-2 focus:ring-orange-500/20 outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-slate-500 mb-1 block">T6, T7</label>
                        <input
                          name="surchargeFriSat"
                          type="text"
                          inputMode="numeric"
                          value={roomTypes[0].surchargeFriSat}
                          onChange={(e) => handleRoomTypeChange(e, 0)}
                          className="w-full p-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 focus:ring-2 focus:ring-orange-500/20 outline-none"
                        />
                      </div>
                    </div>
                  </div>

                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-3 pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white py-4 rounded-xl font-bold shadow-lg shadow-orange-500/30 flex items-center justify-center gap-2 transition-all transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div> : <FaSave size={20} />}
                  {loading ? "Đang xử lý..." : "Tạo Khách Sạn"}
                </button>

                <button
                  type="button"
                  onClick={() => navigate('/hotels')}
                  disabled={loading}
                  className="w-full bg-white text-slate-600 border border-slate-200 py-3 rounded-xl font-bold hover:bg-slate-50 flex items-center justify-center gap-2 transition-all"
                >
                  <FaTimes /> Hủy Bỏ
                </button>
              </div>

            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateHotel;