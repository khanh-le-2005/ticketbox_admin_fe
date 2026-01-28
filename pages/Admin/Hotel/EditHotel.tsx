import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import hotelApi from "@/apis/hotelApi"; // Đảm bảo đường dẫn import đúng
import { UpdateHotelRequest, RoomTypePayload } from "@/type"; // Import type
import { toast } from 'react-toastify';
import {
  FaHotel, FaMapMarkerAlt, FaInfoCircle, FaImage, FaCloudUploadAlt,
  FaTrash, FaBed, FaUserFriends, FaMoneyBillWave, FaSave, FaTimes, FaArrowLeft
} from "react-icons/fa";

const IMAGE_BASE_URL = "https://api.momangshow.vn/api/images";

// Interface state nội bộ cho form (để xử lý linh hoạt hơn)
interface RoomTypeState extends RoomTypePayload {
  // Kế thừa các trường từ type gốc
}

const EditHotel: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);

  // 1. Thông tin chung
  const [info, setInfo] = useState({
    name: "",
    address: "",
    description: "",
  });

  // 2. File ảnh
  const [existingImages, setExistingImages] = useState<number[]>([]); // ID ảnh cũ
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);     // File ảnh mới
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);       // Preview ảnh mới

  // 3. Cấu hình loại phòng
  const [roomTypes, setRoomTypes] = useState<RoomTypeState[]>([]);

  // CSS Classes dùng chung
  const inputClass = "w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all font-medium text-slate-700 placeholder-slate-400";
  const labelClass = "block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2";

  // --- LẤY DỮ LIỆU TỪ API ---
  useEffect(() => {
    if (!id) return;

    const fetchHotelDetail = async () => {
      try {
        const res: any = await hotelApi.getById(id);
        const data = res.data || res; // Tùy vào wrapper response của bạn

        // 1. Map Info
        setInfo({
          name: data.name || "",
          address: data.address || "",
          description: data.description || "",
        });

        // 2. Map Images
        if (data.galleryImageIds && Array.isArray(data.galleryImageIds)) {
          setExistingImages(data.galleryImageIds);
        }

        // 3. Map Room Types (QUAN TRỌNG: Sửa lỗi 0 đồng)
        if (data.roomTypes && data.roomTypes.length > 0) {
          const mappedRooms = data.roomTypes.map((rt: any) => ({
            code: rt.code, // Giữ code để update
            name: rt.name,
            totalRooms: rt.totalRooms,
            standardCapacity: rt.standardCapacity,
            maxCapacity: rt.maxCapacity,

            // --- FIX LỖI Ở ĐÂY ---
            // Ưu tiên lấy priceMonToThu, nếu không có thì thử priceWeekday, cuối cùng là 0
            priceMonToThu: rt.priceMonToThu || rt.priceWeekday || 0,
            // --------------------

            priceFriday: rt.priceFriday || 0,
            priceSaturday: rt.priceSaturday || 0,
            priceSunday: rt.priceSunday || 0,
            surchargeSunToThu: rt.surchargeSunToThu || 0,
            surchargeFriSat: rt.surchargeFriSat || 0,
            surchargePerPerson: rt.surchargePerPerson || 0,
          }));
          setRoomTypes(mappedRooms);
        } else {
          // Fallback nếu chưa có phòng
          setRoomTypes([{
            name: "", totalRooms: 1, standardCapacity: 2, maxCapacity: 4,
            priceMonToThu: 0, priceFriday: 0, priceSaturday: 0, priceSunday: 0,
            surchargeSunToThu: 0, surchargeFriSat: 0, surchargePerPerson: 0
          }]);
        }

      } catch (error) {
        console.error("Fetch Error:", error);
        toast.error("Không tải được dữ liệu khách sạn!");
      } finally {
        setDataLoading(false);
      }
    };

    fetchHotelDetail();
  }, [id]);

  // --- HANDLERS ---
  const handleInfoChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setInfo({ ...info, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files) as File[];
      setSelectedFiles((prev) => [...prev, ...newFiles]);
      const newPreviews = newFiles.map((file) => URL.createObjectURL(file));
      setPreviewUrls((prev) => [...prev, ...newPreviews]);
      e.target.value = ""; // Reset input
    }
  };

  const handleRemoveExistingImage = (imageId: number) => {
    // Chỉ xóa khỏi giao diện (khi submit sẽ gửi list còn lại hoặc API xử lý riêng)
    setExistingImages((prev) => prev.filter(id => id !== imageId));
  };

  const handleRemoveNewImage = (index: number) => {
    URL.revokeObjectURL(previewUrls[index]);
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviewUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const handleRoomTypeChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const { name, value } = e.target;

    // Validate số
    const numberFields = ["totalRooms", "standardCapacity", "maxCapacity", "priceMonToThu", "priceFriday", "priceSaturday", "priceSunday", "surchargeSunToThu", "surchargeFriSat"];
    if (numberFields.includes(name) && !/^\d*$/.test(value)) return;

    const newRoomTypes = [...roomTypes];
    (newRoomTypes[index] as any)[name] = numberFields.includes(name) ? (value === "" ? 0 : Number(value)) : value;
    setRoomTypes(newRoomTypes);
  };

  // --- SUBMIT ---
  // Tìm đến hàm handleUpdate và sửa lại đoạn này:

  // --- SUBMIT ---
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setLoading(true);

    // [LOG 1] Kiểm tra đầu vào
    // console.log("🚀 [1] Bắt đầu Update Hotel ID:", id);
    // console.log("📸 Ảnh cũ đang giữ (Existing):", existingImages);
    // console.log("📂 Ảnh mới đã chọn (Files):", selectedFiles);

    try {
      // 1. Upload ảnh mới trước (nếu có)
      let newImageIds: number[] = [];

      if (selectedFiles.length > 0) {
        toast.info(`Đang tải lên ${selectedFiles.length} ảnh mới...`);

        // Upload song song
        const uploadPromises = selectedFiles.map(file => hotelApi.uploadImage(file));
        const uploadResults = await Promise.all(uploadPromises);

        newImageIds = uploadResults.map(res => Number(res.id));
      }

      // 2. Chuẩn bị dữ liệu Payload
      // Backend chỉ nhận keptImageIds (gộp cả ảnh cũ và mới)
      const allImageIds = [...existingImages, ...newImageIds];
      // console.log("🖼️ [2.5] Tổng hợp tất cả ID ảnh (cũ + mới):", allImageIds);

      const updateData: UpdateHotelRequest = {
        name: info.name,
        address: info.address,
        description: info.description,
        keptImageIds: allImageIds, // Gộp cả ảnh cũ và mới vào đây


        roomTypes: roomTypes.map(rt => ({
          code: rt.code,
          name: rt.name,
          totalRooms: Number(rt.totalRooms) || 0,
          standardCapacity: Number(rt.standardCapacity) || 0,
          maxCapacity: Number(rt.maxCapacity) || 0,
          priceMonToThu: Number(rt.priceMonToThu) || 0,
          priceFriday: Number(rt.priceFriday) || 0,
          priceSaturday: Number(rt.priceSaturday) || 0,
          priceSunday: Number(rt.priceSunday) || 0,
          surchargeSunToThu: Number(rt.surchargeSunToThu) || 0,
          surchargeFriSat: Number(rt.surchargeFriSat) || 0,
          surchargePerPerson: 0
        }))
      };

      // [LOG 3] In ra cục dữ liệu cuối cùng trước khi gửi
      // console.log("📦 [3] Payload gửi đi (Update Data):", JSON.stringify(updateData, null, 2));

      // 3. Gọi API Update
      const res = await hotelApi.update(id, updateData);

      // [LOG 4] Kết quả trả về từ server
      console.log("[4] Response từ Server:", res);

      toast.success("Cập nhật thành công!");
      navigate("/hotels");

    } catch (error: any) {
      const errorMessage = error.response?.data?.message || "Có lỗi xảy ra khi cập nhật!";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (dataLoading) return <div className="min-h-screen flex items-center justify-center">Đang tải dữ liệu...</div>;

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-8 font-sans">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button onClick={() => navigate('/hotels')} className="p-2 bg-white border border-slate-200 rounded-xl text-slate-500 hover:text-orange-600 transition-all shadow-sm">
            <FaArrowLeft />
          </button>
          <h1 className="text-2xl font-extrabold text-slate-800 flex items-center gap-2">
            <FaHotel className="text-orange-500" /> Chỉnh Sửa Khách Sạn
          </h1>
        </div>

        <form onSubmit={handleUpdate} className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

            {/* --- CỘT TRÁI: THÔNG TIN & ẢNH --- */}
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
                    <input name="name" value={info.name} onChange={handleInfoChange} className={inputClass} required />
                  </div>
                  <div>
                    <label className={labelClass}><FaMapMarkerAlt className="text-slate-400" /> Địa chỉ <span className="text-red-500">*</span></label>
                    <input name="address" value={info.address} onChange={handleInfoChange} className={inputClass} required />
                  </div>
                  <div>
                    <label className={labelClass}>Mô tả chi tiết</label>
                    <textarea name="description" value={info.description} onChange={handleInfoChange} className={inputClass} rows={4} />
                  </div>
                </div>
              </div>

              {/* 2. HÌNH ẢNH */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2 border-b border-slate-100 pb-4">
                  <span className="bg-purple-100 p-2 rounded-lg text-purple-600"><FaImage /></span>
                  Thư Viện Ảnh
                </h3>

                {/* Ảnh cũ */}
                {existingImages.length > 0 && (
                  <div className="mb-6">
                    <p className="text-sm font-bold text-slate-700 mb-3">Ảnh đã có:</p>
                    <div className="grid grid-cols-4 sm:grid-cols-5 gap-4">
                      {existingImages.map((imgId) => (
                        <div key={imgId} className="relative group aspect-square rounded-xl overflow-hidden border border-slate-200">
                          <img src={`${IMAGE_BASE_URL}/${imgId}`} alt="old" className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => handleRemoveExistingImage(imgId)}
                            className="absolute top-1 right-1 bg-red-500 text-white p-1.5 rounded-full opacity-80 hover:opacity-100 transition-opacity"
                            title="Xóa ảnh này"
                          >
                            <FaTrash size={10} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Upload ảnh mới */}
                <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:bg-slate-50 transition-colors cursor-pointer relative group">
                  <input type="file" multiple accept="image/*" onChange={handleFileChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                  <div className="flex flex-col items-center justify-center text-slate-400 group-hover:text-orange-500 transition-colors">
                    <FaCloudUploadAlt size={48} className="mb-3" />
                    <p className="font-bold">Thêm ảnh mới</p>
                  </div>
                </div>

                {/* Preview ảnh mới */}
                {previewUrls.length > 0 && (
                  <div className="grid grid-cols-4 sm:grid-cols-5 gap-4 mt-4">
                    {previewUrls.map((url, idx) => (
                      <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border border-green-300 shadow-sm">
                        <img src={url} alt="new" className="w-full h-full object-cover" />
                        <button type="button" onClick={() => handleRemoveNewImage(idx)} className="absolute top-1 right-1 bg-red-500 text-white p-1.5 rounded-full">
                          <FaTrash size={10} />
                        </button>
                        <span className="absolute bottom-0 left-0 bg-green-500 text-white text-[10px] font-bold px-2 py-0.5">Mới</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* --- CỘT PHẢI: CẤU HÌNH PHÒNG --- */}
            <div className="lg:col-span-1 space-y-8">
              {roomTypes.map((room, index) => (
                <div key={index} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                  <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2 border-b border-slate-100 pb-4">
                    <span className="bg-orange-100 p-2 rounded-lg text-orange-600"><FaBed /></span>
                    Cấu Hình Phòng
                  </h3>

                  <div className="space-y-6">
                    {/* Basic */}
                    <div className="space-y-4">
                      <div>
                        <label className={labelClass}>Tên loại phòng</label>
                        <input name="name" value={room.name} onChange={(e) => handleRoomTypeChange(e, index)} className={inputClass} />
                      </div>
                      <div>
                        <label className={labelClass}>Tổng số phòng</label>
                        <input name="totalRooms" value={room.totalRooms} onChange={(e) => handleRoomTypeChange(e, index)} className={inputClass} />
                      </div>
                    </div>

                    {/* Sức chứa */}
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                      <h4 className="font-bold text-slate-700 text-sm mb-3 flex items-center gap-2"><FaUserFriends /> Sức Chứa</h4>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs text-slate-500 mb-1 block">Tiêu chuẩn</label>
                          <input name="standardCapacity" value={room.standardCapacity} onChange={(e) => handleRoomTypeChange(e, index)} className="w-full p-2 rounded-lg border text-center font-bold" />
                        </div>
                        <div>
                          <label className="text-xs text-slate-500 mb-1 block">Tối đa</label>
                          <input name="maxCapacity" value={room.maxCapacity} onChange={(e) => handleRoomTypeChange(e, index)} className="w-full p-2 rounded-lg border text-center font-bold" />
                        </div>
                      </div>
                    </div>

                    {/* Giá tiền */}
                    <div className="p-4 bg-orange-50 rounded-xl border border-orange-100 space-y-3">
                      <h4 className="font-bold text-orange-800 text-sm flex items-center gap-2"><FaMoneyBillWave /> Giá Phòng</h4>

                      <div>
                        <label className="text-xs font-bold text-orange-700 mb-1 block">Thứ 2 - Thứ 5</label>
                        <input name="priceMonToThu" value={room.priceMonToThu} onChange={(e) => handleRoomTypeChange(e, index)} className="w-full p-2 rounded-lg border border-orange-200 font-bold text-orange-600" />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs text-orange-700/70 mb-1 block">Thứ 6</label>
                          <input name="priceFriday" value={room.priceFriday} onChange={(e) => handleRoomTypeChange(e, index)} className="w-full p-2 rounded-lg border border-orange-200 text-sm" />
                        </div>
                        <div>
                          <label className="text-xs text-orange-700/70 mb-1 block">Thứ 7</label>
                          <input name="priceSaturday" value={room.priceSaturday} onChange={(e) => handleRoomTypeChange(e, index)} className="w-full p-2 rounded-lg border border-orange-200 text-sm text-red-500 font-bold" />
                        </div>
                        <div className="col-span-2">
                          <label className="text-xs text-orange-700/70 mb-1 block">Chủ Nhật</label>
                          <input name="priceSunday" value={room.priceSunday} onChange={(e) => handleRoomTypeChange(e, index)} className="w-full p-2 rounded-lg border border-orange-200 text-sm" />
                        </div>
                      </div>
                    </div>

                    {/* Phụ thu */}
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                      <h4 className="font-bold text-slate-700 text-sm mb-3">Phụ Thu</h4>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs text-slate-500 mb-1 block">CN-T5</label>
                          <input name="surchargeSunToThu" value={room.surchargeSunToThu} onChange={(e) => handleRoomTypeChange(e, index)} className="w-full p-2 rounded-lg border text-sm" />
                        </div>
                        <div>
                          <label className="text-xs text-slate-500 mb-1 block">T6-T7</label>
                          <input name="surchargeFriSat" value={room.surchargeFriSat} onChange={(e) => handleRoomTypeChange(e, index)} className="w-full p-2 rounded-lg border text-sm" />
                        </div>
                      </div>
                    </div>

                  </div>
                </div>
              ))}

              {/* Action Buttons */}
              <div className="flex flex-col gap-3 pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white py-4 rounded-xl font-bold shadow-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                >
                  {loading ? "Đang xử lý..." : "Lưu Thay Đổi"} <FaSave />
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/hotels')}
                  className="w-full bg-white text-slate-600 border border-slate-200 py-3 rounded-xl font-bold hover:bg-slate-50 flex items-center justify-center gap-2"
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

export default EditHotel;