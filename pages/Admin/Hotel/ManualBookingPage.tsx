import React, { useState, useEffect } from 'react';
import {
    FaUser, FaPhone, FaCalendarAlt, FaHotel, FaBed,
    FaMoneyBillWave, FaStickyNote, FaSave, FaSpinner, FaUsers
} from 'react-icons/fa';
import { toast } from 'react-toastify';
import axiosClient from '@/axiosclient'; // Đảm bảo đường dẫn đúng tới file axios của bạn
import hotelApi from '@/apis/hotelApi';
import { Hotel } from '@/type';

interface ManualBookingForm {
    hotelId: string;
    roomTypeCode: string;
    quantity: number;
    numberOfGuests: number;
    checkInDate: string;
    checkOutDate: string;
    customerName: string;
    customerPhone: string;
    customPrice: number;
    note: string;
}

const ManualBookingPage: React.FC = () => {
    const [loading, setLoading] = useState(false);
    const [hotels, setHotels] = useState<Hotel[]>([]);
    const [loadingHotels, setLoadingHotels] = useState(true);

    // Initial State
    const [formData, setFormData] = useState<ManualBookingForm>({
        hotelId: '',
        roomTypeCode: '',
        quantity: 1,
        numberOfGuests: 2,
        checkInDate: '',
        checkOutDate: '',
        customerName: '',
        customerPhone: '',
        customPrice: 0,
        note: ''
    });

    // Fetch Hotels
    useEffect(() => {
        const fetchHotels = async () => {
            setLoadingHotels(true);
            try {
                const res: any = await hotelApi.getAll();
                let contentList = [];
                if (res?.data?.content) {
                    contentList = res.data.content;
                } else if (res?.data?.data?.content) {
                    contentList = res.data.data.content;
                } else if (res?.content) {
                    contentList = res.content;
                }
                setHotels(Array.isArray(contentList) ? contentList : []);
            } catch (error) {
                console.error("Lỗi tải danh sách khách sạn:", error);
            } finally {
                setLoadingHotels(false);
            }
        };
        fetchHotels();
    }, []);

    // Handle Input Change
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => {
            const newData = {
                ...prev,
                [name]: (name === 'quantity' || name === 'numberOfGuests' || name === 'customPrice')
                    ? Number(value)
                    : value
            };

            // Reset roomTypeCode if hotelId changes
            if (name === 'hotelId') {
                newData.roomTypeCode = '';
            }

            return newData;
        });
    };

    // Handle Submit
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validation cơ bản
        if (!formData.hotelId || !formData.roomTypeCode || !formData.customerName || !formData.checkInDate || !formData.checkOutDate) {
            toast.warn("Vui lòng điền đầy đủ các thông tin bắt buộc (*)");
            return;
        }

        try {
            setLoading(true);

            // Payload chuẩn theo yêu cầu
            const payload = {
                ...formData,
                // Đảm bảo số lượng là number (dù input type number trả về string trong một số case hiếm)
                quantity: Number(formData.quantity),
                numberOfGuests: Number(formData.numberOfGuests),
                customPrice: Number(formData.customPrice)
            };

            console.log("🔥 Payload Manual Booking:", payload);

            // Gọi API (axiosClient đã có interceptor gắn Bearer token)
            const res = await axiosClient.post('/hotel-bookings/manual', payload);

            toast.success("✅ Tạo đơn đặt phòng thủ công thành công!");
            console.log("Response:", res);

            // Reset form sau khi thành công (Tuỳ chọn)
            setFormData(prev => ({
                ...prev,
                customerName: '',
                customerPhone: '',
                note: '',
                customPrice: 0
            }));

        } catch (error: any) {
            console.error(error);
            const msg = error?.response?.data?.message || error?.message || "Lỗi khi tạo đơn hàng";

            if (msg.includes("Hết phòng") || msg.includes("không còn trống")) {
                toast.error(`Rất tiếc, phòng này vừa hết chỗ! Vui lòng chọn lại hoặc đổi ngày.`);
            } else {
                toast.error(`${msg}`);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-6 flex justify-center">
            <div className="w-full max-w-4xl bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">

                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 text-white">
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <FaHotel /> Đặt Phòng Thủ Công (Nội Bộ)
                    </h1>
                    <p className="text-blue-100 text-sm mt-1">
                        Dành cho khách lẻ, khách người quen hoặc trường hợp đặc biệt.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-8">

                    {/* SECTION 1: THÔNG TIN PHÒNG */}
                    <div>
                        <h3 className="text-gray-800 font-bold text-lg border-b pb-2 mb-4 flex items-center gap-2">
                            <span className="text-blue-500"><FaBed /></span> Thông tin lưu trú
                        </h3>
                        {(() => {
                            const currentHotel = hotels.find(h => h.id === formData.hotelId);
                            const availableRoomTypes = currentHotel?.roomTypes || [];

                            return (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {/* Hotel ID */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Chọn Khách sạn <span className="text-red-500">*</span></label>
                                        <select
                                            name="hotelId"
                                            value={formData.hotelId}
                                            onChange={handleChange}
                                            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                                            disabled={loadingHotels}
                                        >
                                            <option value="">-- Chọn khách sạn --</option>
                                            {hotels.map(hotel => (
                                                <option key={hotel.id} value={hotel.id}>
                                                    {hotel.name}
                                                </option>
                                            ))}
                                        </select>
                                        {loadingHotels && <p className="text-xs text-gray-400 mt-1 italic">Đang tải danh sách...</p>}
                                    </div>

                                    {/* Room Type Code */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Mã loại phòng <span className="text-red-500">*</span></label>
                                        <select
                                            name="roomTypeCode"
                                            value={formData.roomTypeCode}
                                            onChange={handleChange}
                                            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white font-semibold"
                                            disabled={!formData.hotelId}
                                        >
                                            <option value="">-- Chọn loại phòng --</option>
                                            {availableRoomTypes.map(rt => (
                                                <option key={rt.code} value={rt.code}>
                                                    {rt.name} ({rt.code})
                                                </option>
                                            ))}
                                        </select>
                                        {!formData.hotelId && <p className="text-xs text-orange-500 mt-1 italic">Vui lòng chọn khách sạn trước</p>}
                                    </div>

                                    {/* Quantity */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Số lượng phòng</label>
                                        <input
                                            type="number"
                                            name="quantity"
                                            min={1}
                                            value={formData.quantity}
                                            onChange={handleChange}
                                            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                        />
                                    </div>

                                    {/* Guests */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Số khách</label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-3.5 text-gray-400"><FaUsers /></span>
                                            <input
                                                type="number"
                                                name="numberOfGuests"
                                                min={1}
                                                value={formData.numberOfGuests}
                                                onChange={handleChange}
                                                className="w-full pl-10 pr-3 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                            />
                                        </div>
                                    </div>

                                    {/* Check In */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Ngày Check-in <span className="text-red-500">*</span></label>
                                        <input
                                            type="date"
                                            name="checkInDate"
                                            value={formData.checkInDate}
                                            onChange={handleChange}
                                            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                        />
                                    </div>

                                    {/* Check Out */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Ngày Check-out <span className="text-red-500">*</span></label>
                                        <input
                                            type="date"
                                            name="checkOutDate"
                                            value={formData.checkOutDate}
                                            onChange={handleChange}
                                            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                        />
                                    </div>
                                </div>
                            );
                        })()}
                    </div>

                    {/* SECTION 2: KHÁCH HÀNG & GIÁ */}
                    <div>
                        <h3 className="text-gray-800 font-bold text-lg border-b pb-2 mb-4 flex items-center gap-2">
                            <span className="text-blue-500"><FaUser /></span> Khách hàng & Thanh toán
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                            {/* Tên Khách */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Tên khách hàng <span className="text-red-500">*</span></label>
                                <div className="relative">
                                    <span className="absolute left-3 top-3.5 text-gray-400"><FaUser /></span>
                                    <input
                                        type="text"
                                        name="customerName"
                                        value={formData.customerName}
                                        onChange={handleChange}
                                        placeholder="VD: Anh Sáu (Người nhà sếp)"
                                        className="w-full pl-10 pr-3 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                </div>
                            </div>

                            {/* SĐT */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Số điện thoại</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-3.5 text-gray-400"><FaPhone /></span>
                                    <input
                                        type="text"
                                        name="customerPhone"
                                        value={formData.customerPhone}
                                        onChange={handleChange}
                                        placeholder="0909xxxxxx"
                                        className="w-full pl-10 pr-3 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                </div>
                            </div>

                            {/* Giá đặc biệt */}
                            <div className="col-span-1 md:col-span-2 bg-yellow-50 p-4 rounded-xl border border-yellow-200">
                                <label className="block text-sm font-bold text-yellow-800 mb-1 flex items-center gap-2">
                                    <span className="text-yellow-600"><FaMoneyBillWave /></span> Giá đặc biệt (Custom Price)
                                </label>
                                <input
                                    type="number"
                                    name="customPrice"
                                    value={formData.customPrice}
                                    onChange={handleChange}
                                    className="w-full p-3 border border-yellow-300 rounded-lg text-lg font-bold text-gray-800 focus:ring-2 focus:ring-yellow-500 outline-none"
                                    placeholder="Nhập số tiền (VNĐ)"
                                />
                                <p className="text-xs text-yellow-600 mt-1">
                                    * Để 0 nếu muốn lấy giá mặc định của hệ thống. Nhập số tiền cụ thể để override giá.
                                </p>
                            </div>

                            {/* Ghi chú */}
                            <div className="col-span-1 md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                                    <span className="text-gray-600"><FaStickyNote /></span> Ghi chú nội bộ
                                </label>
                                <textarea
                                    name="note"
                                    rows={3}
                                    value={formData.note}
                                    onChange={handleChange}
                                    placeholder="VD: Giá đặc biệt do sếp duyệt..."
                                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="flex justify-end gap-4 pt-4 border-t">
                        <button
                            type="button"
                            className="px-6 py-3 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-100 transition"
                            onClick={() => window.history.back()}
                        >
                            Hủy bỏ
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-8 py-3 rounded-lg bg-blue-600 text-white font-bold hover:bg-blue-700 shadow-lg hover:shadow-xl transition flex items-center gap-2 disabled:bg-gray-400"
                        >
                            {loading ? <FaSpinner className="animate-spin" /> : <FaSave />}
                            Tạo Đơn Ngay
                        </button>
                    </div>

                </form>
            </div>
        </div>
    );
};

export default ManualBookingPage;