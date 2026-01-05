import React, { useState, useRef, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  HiOutlinePlus,
  HiOutlineTrash,
  HiOutlineX,
  HiOutlineLocationMarker,
  HiOutlineTicket,
  HiOutlineUserGroup,
  HiOutlineCalendar,
  HiOutlineCloudUpload,
  HiOutlinePhotograph,
  HiOutlineArrowLeft,
  HiOutlineCheckCircle,
  HiOutlineClock,
  HiOutlineMap
} from "react-icons/hi";
import { IShow, IShowRequest } from "@/type";
import { showApi } from "@/apis";
import { toast } from 'react-toastify';

// Interface cho API Địa chính
interface LocationOption {
  code: number;
  name: string;
  districts?: LocationOption[];
  wards?: LocationOption[];
}

const AddShow: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditMode = !!id;

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEditMode);

  // --- 1. QUẢN LÝ ẢNH BÌA (BANNER - CHỈ 1 ẢNH) ---
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const [bannerId, setBannerId] = useState<number | null>(null); // ID nếu là ảnh cũ
  const [bannerFile, setBannerFile] = useState<File | null>(null); // File nếu là ảnh mới
  const [bannerPreview, setBannerPreview] = useState<string>(""); // URL hiển thị

  // --- 2. QUẢN LÝ GALLERY (NHIỀU ẢNH) ---
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const [existingGalleryIds, setExistingGalleryIds] = useState<number[]>([]); // ID ảnh cũ
  const [newGalleryFiles, setNewGalleryFiles] = useState<File[]>([]); // File ảnh mới
  const [galleryPreviews, setGalleryPreviews] = useState<string[]>([]); // URL hiển thị (cả cũ và mới)

  // --- STATE ĐỊA CHÍNH ---
  const [provinces, setProvinces] = useState<LocationOption[]>([]);
  const [districts, setDistricts] = useState<LocationOption[]>([]);
  const [wards, setWards] = useState<LocationOption[]>([]);

  const [formData, setFormData] = useState<IShow>({
    name: "",
    description: "",
    genre: "",
    images: [],
    startTime: "",
    endTime: "",
    address: {
      specificAddress: "",
      province: "",
      district: "",
      ward: "",
      latitude: 0,
      longitude: 0,
    },
    performers: [""],
    ticketTypes: [
      {
        code: "STD",
        name: "Vé thường",
        description: "",
        price: 0,
        totalQuantity: 0,
      },
    ],
    companyId: "",
  });

  // --- LOAD TỈNH THÀNH ---
  useEffect(() => {
    const fetchProvinces = async () => {
      try {
        const response = await fetch("https://provinces.open-api.vn/api/?depth=1");
        const data = await response.json();
        setProvinces(data);
      } catch (error) {
        console.error("Lỗi tải tỉnh thành:", error);
      }
    };
    fetchProvinces();
  }, []);

  // --- LOAD DỮ LIỆU KHI EDIT ---
  useEffect(() => {
    if (isEditMode && id) {
      const fetchShowData = async () => {
        try {
          const res: any = await showApi.getById(id);
          const data = res?.data || res;

          if (data) {
            // A. Tách Banner
            if (data.bannerImageId) {
                setBannerId(data.bannerImageId);
                setBannerPreview(showApi.getImageUrl(data.bannerImageId));
            }

            // B. Tách Gallery
            const oldGalleryIds = data.galleryImageIds || [];
            const oldGalleryUrls = oldGalleryIds.map((imgId: number) => showApi.getImageUrl(imgId));
            setExistingGalleryIds(oldGalleryIds);
            setGalleryPreviews(oldGalleryUrls);

            // C. Các dữ liệu khác
            const toInputDate = (dateStr: any) => {
               if (!dateStr) return "";
               if (Array.isArray(dateStr)) {
                   const [y, m, d, h, min] = dateStr;
                   return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}T${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
               }
               return String(dateStr).replace(" ", "T").substring(0, 16);
            };

            setFormData({
              name: data.name || "",
              description: data.description || "",
              genre: data.genre || "", 
              images: [], 
              startTime: toInputDate(data.startTime),
              endTime: toInputDate(data.endTime),
              address: {
                specificAddress: data.address?.specificAddress || "",
                province: data.address?.province || "",
                district: data.address?.district || "",
                ward: data.address?.ward || "",
                latitude: Number(data.address?.latitude) || 0,
                longitude: Number(data.address?.longitude) || 0,
              },
              performers: data.performers && data.performers.length > 0 ? data.performers : [""],
              ticketTypes: data.ticketTypes && data.ticketTypes.length > 0
                  ? data.ticketTypes.map((t: any) => ({
                      code: t.code || "",
                      name: t.name || "",
                      description: t.description || "",
                      price: Number(t.price),
                      totalQuantity: Number(t.totalQuantity),
                    }))
                  : [{ code: "STD", name: "Vé thường", description: "", price: 0, totalQuantity: 0 }],
              companyId: data.companyId || (data.organizer ? data.organizer.id : ""), 
            });
          }
        } catch (error) {
          console.error("Lỗi tải dữ liệu:", error);
        } finally {
          setFetching(false);
        }
      };
      fetchShowData();
    }
  }, [id, isEditMode]);

  // --- HANDLER: BANNER (1 ẢNH) ---
  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          setBannerFile(file);
          setBannerId(null); // Reset ID cũ vì đã chọn file mới
          setBannerPreview(URL.createObjectURL(file));
      }
  };

  const removeBanner = () => {
      setBannerFile(null);
      setBannerId(null);
      setBannerPreview("");
      if (bannerInputRef.current) bannerInputRef.current.value = "";
  };

  // --- HANDLER: GALLERY (NHIỀU ẢNH) ---
  const handleGalleryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const fileArray = Array.from(files) as File[];
      setNewGalleryFiles((prev) => [...prev, ...fileArray]);

      const newUrls: string[] = [];
      fileArray.forEach((file) => newUrls.push(URL.createObjectURL(file)));
      setGalleryPreviews((prev) => [...prev, ...newUrls]);
    }
  };

  const removeGalleryImage = (index: number) => {
    const numberOfOldImages = existingGalleryIds.length;
    if (index < numberOfOldImages) {
        // Xóa ảnh cũ
        const newIds = existingGalleryIds.filter((_, i) => i !== index);
        setExistingGalleryIds(newIds);
    } else {
        // Xóa ảnh mới
        const fileIndex = index - numberOfOldImages;
        const newFiles = newImageFiles.filter((_, i) => i !== fileIndex);
        setNewGalleryFiles(newFiles);
    }
    const newPreviews = galleryPreviews.filter((_, i) => i !== index);
    setGalleryPreviews(newPreviews);
  };

  // --- HANDLERS ĐỊA CHÍNH (Giữ nguyên) ---
  const handleProvinceChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const provinceName = e.target.value;
    const province = provinces.find(p => p.name === provinceName);
    setFormData(prev => ({ ...prev, address: { ...prev.address, province: provinceName, district: "", ward: "" } }));
    setDistricts([]); setWards([]);
    if (province) {
      const res = await fetch(`https://provinces.open-api.vn/api/p/${province.code}?depth=2`);
      const data = await res.json();
      setDistricts(data.districts);
    }
  };

  const handleDistrictChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFormData(prev => ({ ...prev, address: { ...prev.address, district: value, ward: "" } }));
    setWards([]);
    const district = districts.find(d => d.name === value);
    if (district) {
      const res = await fetch(`https://provinces.open-api.vn/api/d/${district.code}?depth=2`);
      const data = await res.json();
      setWards(data.wards);
    }
  };

  const handleWardChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, address: { ...prev.address, ward: e.target.value } }));
  };

  // --- HANDLERS VÉ & NGHỆ SĨ (Giữ nguyên) ---
  const handleTicketNumberChange = (e: React.ChangeEvent<HTMLInputElement>, index: number, field: "price" | "totalQuantity") => {
    const value = e.target.value;
    const newTickets = [...formData.ticketTypes];
    newTickets[index] = { ...newTickets[index], [field]: value === "" ? 0 : parseFloat(value) };
    setFormData({ ...formData, ticketTypes: newTickets });
  };
  const handleTicketTextChange = (e: React.ChangeEvent<HTMLInputElement>, index: number, field: "code" | "name") => {
    const newTickets = [...formData.ticketTypes];
    newTickets[index] = { ...newTickets[index], [field]: e.target.value };
    setFormData({ ...formData, ticketTypes: newTickets });
  };
  const addTicketType = () => setFormData({ ...formData, ticketTypes: [...formData.ticketTypes, { code: "", name: "", description: "", price: 0, totalQuantity: 0 }] });
  const removeTicketType = (index: number) => {
    const newTickets = formData.ticketTypes.filter((_, i) => i !== index);
    setFormData({ ...formData, ticketTypes: newTickets.length ? newTickets : [] });
  };
  const addPerformer = () => setFormData({ ...formData, performers: [...formData.performers, ""] });
  const updatePerformer = (index: number, value: string) => {
    const newPerformers = [...formData.performers];
    newPerformers[index] = value;
    setFormData({ ...formData, performers: newPerformers });
  };
  const removePerformer = (index: number) => {
    const newPerformers = formData.performers.filter((_, i) => i !== index);
    setFormData({ ...formData, performers: newPerformers.length ? newPerformers : [""] });
  };

  // --- SUBMIT ---
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.companyId) return toast.error("Vui lòng điền tên Show và ID công ty.");
    if (!formData.startTime || !formData.endTime) return toast.error("Vui lòng chọn thời gian.");

    setLoading(true);
    try {
      const formatToBackendDate = (dateStr: string) => {
        if (!dateStr) return "";
        let formatted = dateStr;
        if (formatted.length === 16) formatted += ":00";
        return formatted;
      };

      const fullAddr = [formData.address.specificAddress, formData.address.ward, formData.address.district, formData.address.province].filter(Boolean).join(", ");
      
      const apiPayload: IShowRequest = {
        name: formData.name,
        description: formData.description || "",
        genre: formData.genre || "Nhạc Pop",
        startTime: formatToBackendDate(formData.startTime),
        endTime: formatToBackendDate(formData.endTime),
        companyId: formData.companyId,
        address: {
          specificAddress: formData.address.specificAddress || "",
          province: formData.address.province || "",
          district: formData.address.district || "",
          ward: formData.address.ward || "",
          fullAddress: fullAddr,
          latitude: 0, longitude: 0,
        },
        
        // ⚠️ LOGIC GỬI ẢNH:
        // 1. keepGalleryImageIds: Chỉ chứa ID của Gallery cũ. (Banner cũ nếu giữ nguyên thì Backend tự hiểu hoặc gửi riêng nếu cần, nhưng logic hiện tại backend thường ưu tiên mảng này cho gallery)
        keepGalleryImageIds: existingGalleryIds, 
        
        // Nếu Backend có trường bannerImageId trong Request thì tốt nhất. 
        // Nhưng nếu chỉ có `keepGalleryImageIds` và `images` (file), ta sẽ gửi kèm.
        // Tạm thời logic này giữ nguyên ID gallery. 
        // Với Banner: Nếu là ID cũ -> Backend thường không đổi nếu không gửi file mới.
        
        performers: formData.performers.filter((p) => p && p.trim() !== ""),
        ticketTypes: formData.ticketTypes.map((t) => ({
          code: t.code || "", 
          name: t.name,
          description: t.description || "",
          price: Number(t.price),
          totalQuantity: Number(t.totalQuantity),
        })),
      };

      // ⚠️ GỘP FILE: Banner (nếu có) sẽ đứng đầu danh sách
      const filesToSend = [];
      if (bannerFile) filesToSend.push(bannerFile);
      if (newGalleryFiles.length > 0) filesToSend.push(...newGalleryFiles);

      console.log("📦 Payload:", apiPayload);
      console.log("📂 Files:", filesToSend.length);

      if (isEditMode && id) {
        await showApi.update(id, apiPayload, filesToSend);
        toast.success("Cập nhật thành công!");
      } else {
        await showApi.create(apiPayload, filesToSend);
        toast.success("Tạo mới thành công!");
      }
      navigate("/shows");
    } catch (error: any) {
      console.error("Lỗi:", error);
      const msg = error.response?.data?.message || "Lỗi không xác định";
      alert(`Lỗi từ Server: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return <div className="text-center py-20">Đang tải dữ liệu...</div>;

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20 animate-in fade-in duration-500">
      {/* HEADER GIỮ NGUYÊN */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate("/shows")} className="p-2.5 bg-white hover:bg-gray-50 rounded-2xl text-gray-500 shadow-sm border border-gray-100"><HiOutlineArrowLeft size={24} /></button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{isEditMode ? "Chỉnh sửa Show" : "Tạo Show Mới"}</h1>
          </div>
        </div>
        <button onClick={handleSave} disabled={loading} className="px-8 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-pink-500 to-rose-600 hover:to-rose-700 shadow-lg flex items-center gap-2 disabled:opacity-70">
          <HiOutlineCheckCircle size={22} /> {loading ? "Đang lưu..." : "Hoàn tất & Lưu"}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* THÔNG TIN CƠ BẢN (Giữ nguyên) */}
          <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-6">
            <div className="flex items-center gap-2 text-pink-500 font-bold uppercase text-xs tracking-widest border-b border-gray-50 pb-3"><HiOutlineCalendar size={18} /> Thông tin Cơ bản</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-sm font-bold text-gray-700 ml-1">Tên Show diễn *</label>
                <input required className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl font-bold" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="VD: Sky Tour Live Concert" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-gray-700 ml-1">Bắt đầu *</label>
                <input required type="datetime-local" className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-xl" value={formData.startTime} onChange={(e) => setFormData({ ...formData, startTime: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-gray-700 ml-1">Kết thúc *</label>
                <input required type="datetime-local" className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-xl" value={formData.endTime} onChange={(e) => setFormData({ ...formData, endTime: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-gray-700 ml-1">Thể loại</label>
                <input className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-xl" value={formData.genre} onChange={(e) => setFormData({ ...formData, genre: e.target.value })} placeholder="Pop, Rock..." />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-gray-700 ml-1">ID Công ty *</label>
                <input required className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-xl font-mono text-xs" value={formData.companyId} onChange={(e) => setFormData({ ...formData, companyId: e.target.value })} />
              </div>
              <div className="md:col-span-2 space-y-1.5">
                <label className="text-sm font-bold text-gray-700 ml-1">Mô tả</label>
                <textarea rows={4} className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl resize-none" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
              </div>
            </div>
          </div>

          {/* VÉ (Giữ nguyên) */}
          <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-gray-50 pb-3">
               <div className="flex items-center gap-2 text-pink-500 font-bold uppercase text-xs tracking-widest"><HiOutlineTicket size={18} /> Hạng vé & Giá</div>
               <button type="button" onClick={addTicketType} className="text-[10px] font-bold text-pink-600 bg-pink-50 px-3 py-1.5 rounded-lg uppercase"><HiOutlinePlus className="inline"/> Thêm hạng</button>
            </div>
            <div className="overflow-hidden border border-gray-100 rounded-2xl">
              <table className="w-full text-left">
                <thead className="bg-gray-50 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  <tr><th className="px-4 py-3">Mã</th><th className="px-4 py-3">Tên</th><th className="px-4 py-3">Giá</th><th className="px-4 py-3">SL</th><th></th></tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {formData.ticketTypes.map((ticket, idx) => (
                    <tr key={idx} className="hover:bg-gray-50/50">
                      <td className="p-3"><input className="w-full border rounded p-2 text-xs font-mono" value={ticket.code} onChange={(e) => handleTicketTextChange(e, idx, "code")} placeholder="(Tự sinh)" /></td>
                      <td className="p-3"><input className="w-full border rounded p-2 text-xs font-bold" value={ticket.name} onChange={(e) => handleTicketTextChange(e, idx, "name")} /></td>
                      <td className="p-3"><input type="number" className="w-full border rounded p-2 text-xs" value={ticket.price} onChange={(e) => handleTicketNumberChange(e, idx, "price")} /></td>
                      <td className="p-3"><input type="number" className="w-full border rounded p-2 text-xs" value={ticket.totalQuantity} onChange={(e) => handleTicketNumberChange(e, idx, "totalQuantity")} /></td>
                      <td className="p-3"><button type="button" onClick={() => removeTicketType(idx)} className="text-rose-500"><HiOutlineTrash /></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="space-y-8">
            {/* --- PHẦN ẢNH ĐÃ TÁCH --- */}
            
            {/* 1. ẢNH BÌA (BANNER) */}
            <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm space-y-4">
                <h3 className="font-bold text-gray-900 border-b border-gray-50 pb-3 text-sm flex gap-2"><HiOutlinePhotograph className="text-pink-500"/> Ảnh bìa (Banner)</h3>
                <div className="flex flex-col items-center gap-4">
                    {/* Preview Banner */}
                    <div className="relative w-full aspect-video rounded-xl overflow-hidden border border-gray-200 bg-gray-50">
                        {bannerPreview ? (
                            <img src={bannerPreview} className="w-full h-full object-cover" alt="Banner" />
                        ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center text-gray-300">
                                <HiOutlinePhotograph size={40} />
                                <span className="text-xs mt-2">Chưa có ảnh bìa</span>
                            </div>
                        )}
                        {bannerPreview && (
                             <button type="button" onClick={removeBanner} className="absolute top-2 right-2 bg-white/80 p-1.5 rounded-full text-rose-500 hover:bg-white shadow-sm"><HiOutlineTrash size={16}/></button>
                        )}
                    </div>

                    <button type="button" onClick={() => bannerInputRef.current?.click()} className="flex items-center gap-2 px-4 py-2 bg-pink-50 text-pink-600 rounded-lg text-xs font-bold hover:bg-pink-100 transition-colors">
                        <HiOutlineCloudUpload size={18} /> {bannerPreview ? "Thay ảnh bìa" : "Tải ảnh bìa"}
                    </button>
                    <input type="file" hidden ref={bannerInputRef} accept="image/*" onChange={handleBannerChange} />
                </div>
            </div>

            {/* 2. THƯ VIỆN ẢNH (GALLERY) */}
            <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm space-y-4">
                <div className="flex justify-between items-center border-b border-gray-50 pb-3">
                    <h3 className="font-bold text-gray-900 text-sm flex gap-2"><HiOutlinePhotograph className="text-blue-500"/> Thư viện ảnh</h3>
                    <button type="button" onClick={() => galleryInputRef.current?.click()} className="text-[10px] font-bold text-blue-500 uppercase hover:underline">+ Thêm ảnh</button>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                    {galleryPreviews.map((img, idx) => (
                        <div key={idx} className="relative aspect-square rounded-xl overflow-hidden group border border-gray-100">
                          <img src={img} className="w-full h-full object-cover" alt={`Gallery ${idx}`}/>
                          <button type="button" onClick={() => removeGalleryImage(idx)} className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1 hover:bg-rose-500"><HiOutlineX size={12}/></button>
                        </div>
                    ))}
                    {/* Nút upload thêm */}
                    <button type="button" onClick={() => galleryInputRef.current?.click()} className="aspect-square rounded-xl border-2 border-dashed flex flex-col items-center justify-center text-gray-400 hover:border-blue-500 hover:text-blue-500">
                        <HiOutlinePlus size={24}/>
                    </button>
                    <input type="file" hidden ref={galleryInputRef} accept="image/*" multiple onChange={handleGalleryChange} />
                </div>
            </div>

            {/* ĐỊA ĐIỂM (Giữ nguyên) */}
            <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm space-y-4">
                <h3 className="font-bold text-gray-900 flex items-center gap-2 border-b border-gray-50 pb-3 text-sm">
                <HiOutlineLocationMarker size={20} className="text-pink-500" /> Địa điểm
                </h3>
                <div className="space-y-4">
                    <div>
                        <label className="text-sm font-bold text-gray-700 ml-1">Địa chỉ cụ thể</label>
                        <input className="w-full px-4 py-2.5 bg-gray-50 border rounded-xl text-sm" value={formData.address.specificAddress} onChange={(e) => setFormData({ ...formData, address: { ...formData.address, specificAddress: e.target.value } })} />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-gray-500 ml-1">Tỉnh / Thành phố</label>
                        <select className="w-full px-3 py-2.5 bg-gray-50 border rounded-xl text-sm outline-none" value={formData.address.province} onChange={handleProvinceChange}>
                            <option value="">-- Chọn Tỉnh --</option>
                            {provinces.map((p) => <option key={p.code} value={p.name}>{p.name}</option>)}
                        </select>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-xs font-bold text-gray-500 ml-1">Quận / Huyện</label>
                            <input list="districts-list" className="w-full px-3 py-2.5 bg-gray-50 border rounded-xl text-sm outline-none" value={formData.address.district} onChange={handleDistrictChange} placeholder="Nhập..." disabled={!formData.address.province} />
                            <datalist id="districts-list">{districts.map((d) => <option key={d.code} value={d.name} />)}</datalist>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-500 ml-1">Phường / Xã</label>
                            <input list="wards-list" className="w-full px-3 py-2.5 bg-gray-50 border rounded-xl text-sm outline-none" value={formData.address.ward} onChange={handleWardChange} placeholder="Nhập..." disabled={!formData.address.district} />
                            <datalist id="wards-list">{wards.map((w) => <option key={w.code} value={w.name} />)}</datalist>
                        </div>
                    </div>
                </div>
            </div>

            {/* NGHỆ SĨ */}
             <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm space-y-4">
                <div className="flex justify-between border-b pb-3"><h3 className="font-bold text-sm flex gap-2"><HiOutlineUserGroup className="text-pink-500"/> Nghệ sĩ</h3><button type="button" onClick={addPerformer} className="text-pink-500 text-xs font-bold">+ Thêm</button></div>
                <div className="space-y-2">
                    {formData.performers.map((p, idx) => (
                        <div key={idx} className="flex gap-2"><input className="flex-1 border rounded p-2 text-sm" value={p} onChange={(e) => updatePerformer(idx, e.target.value)} /><button type="button" onClick={() => removePerformer(idx)} className="text-gray-300"><HiOutlineX/></button></div>
                    ))}
                </div>
             </div>
        </div>
      </div>
    </div>
  );
};

export default AddShow;