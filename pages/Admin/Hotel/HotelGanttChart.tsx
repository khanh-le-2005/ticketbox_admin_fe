import React, { useState, useEffect, useMemo, useRef, Fragment } from "react";
import {
  ChevronDown,
  Plus,
  Search,
  Filter,
  Settings,
  MoreHorizontal,
  CheckCircle,
  Clock,
  User,
  Edit,
  LogOut,
  Trash2,
  Calendar,
  Building2,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  LayoutList,
  Grid3X3,
  Brush,
  Construction,
  BedDouble,
  ArrowRightLeft,
} from "lucide-react";
import { Listbox, Transition } from "@headlessui/react";
import {
  format,
  addDays,
  parseISO,
  isToday,
  differenceInDays,
  startOfDay,
  isWeekend,
  eachDayOfInterval,
} from "date-fns";
import { vi } from "date-fns/locale";
import axiosClient from "@/axiosclient";
import hotelApi from "@/apis/hotelApi";
import { useNavigate } from "react-router-dom";
// import qs from 'qs';

// --- TYPES ---
interface Hotel {
  id: string;
  name: string;
}
interface Room {
  id: string;
  name: string;
  status: "clean" | "dirty" | "fixing";
}
interface RoomGroup {
  id: string;
  name: string;
  rooms: Room[];
}
interface Booking {
  id: string;
  roomId: string;
  customerName: string;
  startDate: Date;
  endDate: Date;
  status: "checked-in" | "confirmed" | "checked-out";
  color?: string; // Sẽ tự động tính toán dựa trên status
}
interface APIHotelData {
  hotelId: string;
  hotelName: string;
  days: any[];
}
interface ContextMenuPosition {
  x: number;
  y: number;
  roomId?: string;
  date?: Date;
  bookingId?: string;
  start?: Date;
  end?: Date;
}


// --- CONSTANTS ---
const CELL_WIDTH = 64; // Rộng hơn xíu cho thoáng
const CELL_HEIGHT = 56; // Cao hơn để hiển thị thông tin rõ hơn
const HEADER_HEIGHT = 90;
const SIDEBAR_WIDTH = 240;

export default function HotelGanttChart() {
  // --- STATE ---
  const navigate = useNavigate();
  const [roomGroups, setRoomGroups] = useState<RoomGroup[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false); // Default false để tránh flash
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [selectedHotel, setSelectedHotel] = useState<Hotel | null>(null);

  const [startDate, setStartDate] = useState(
    startOfDay(new Date("2026-01-28")),
  ); // Mock date theo data của bạn
  const [endDate, setEndDate] = useState(addDays(startDate, 30));

  const daysToShow = useMemo(
    () => differenceInDays(endDate, startDate) + 1,
    [startDate, endDate],
  );

  // UI States
  const [isDragging, setIsDragging] = useState(false);
  const [selection, setSelection] = useState<{
    roomId: string;
    start: Date;
    end: Date;
  } | null>(null);
  const [contextMenu, setContextMenu] = useState<ContextMenuPosition | null>(
    null,
  );
  const [viewMode, setViewMode] = useState<"day" | "week" | "month">("day");
  const startDateInputRef = useRef<HTMLInputElement>(null);
  const endDateInputRef = useRef<HTMLInputElement>(null);

  // --- HELPER: COLOR BY STATUS ---
  const getStatusColor = (status: string) => {
    switch (status) {
      case "checked-in":
        return "bg-blue-100 border-blue-500 text-blue-700 hover:bg-blue-200";
      case "confirmed":
        return "bg-emerald-100 border-emerald-500 text-emerald-700 hover:bg-emerald-200";
      case "checked-out":
        return "bg-slate-200 border-slate-500 text-slate-600 hover:bg-slate-300";
      default:
        return "bg-gray-100 border-gray-400 text-gray-700";
    }
  };

  // --- DATA PROCESSING ---
  const processCalendarData = (apiHotels: APIHotelData[]) => {
    const newRoomGroups: RoomGroup[] = [];
    const newBookings: Booking[] = [];

    apiHotels.forEach((hotel) => {
      // Logic tạo phòng (giữ nguyên logic của bạn, chỉ clean code)
      const sampleDay = hotel.days.find((d) => d.physicalRooms.length > 0);
      const physicalRooms = sampleDay ? sampleDay.physicalRooms : [];

      const group: RoomGroup = {
        id: hotel.hotelId,
        name: hotel.hotelName,
        rooms: physicalRooms.map((r: any) => ({
          id: r.roomId,
          name: r.roomNumber,
          status: r.status === "CLEANING" ? "dirty" : "clean",
        })),
      };
      newRoomGroups.push(group);

      // Logic tạo Booking Bars (giữ nguyên)
      const roomIds = physicalRooms.map((r: any) => r.roomId);
      roomIds.forEach((rId: string) => {
        let currentBooking: Booking | null = null;
        // Sort ngày để đảm bảo liền mạch
        const sortedDays = [...hotel.days].sort(
          (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
        );

        sortedDays.forEach((day) => {
          const currentDate = parseISO(day.date);
          const roomInDay = day.physicalRooms.find(
            (r: any) => r.roomId === rId,
          );

          if (roomInDay && roomInDay.currentBookingId) {
            if (
              currentBooking &&
              currentBooking.id === roomInDay.currentBookingId
            ) {
              currentBooking.endDate = addDays(currentDate, 1);
            } else {
              if (currentBooking) newBookings.push(currentBooking);
              currentBooking = {
                id: roomInDay.currentBookingId,
                roomId: rId,
                customerName: roomInDay.guestName || "Khách ẩn danh",
                startDate: currentDate,
                endDate: addDays(currentDate, 1),
                status: "checked-in", // Mock status, thực tế lấy từ API
              };
            }
          } else {
            if (currentBooking) {
              newBookings.push(currentBooking);
              currentBooking = null;
            }
          }
        });
        if (currentBooking) newBookings.push(currentBooking);
      });
    });

    setRoomGroups(newRoomGroups);
    setBookings(newBookings);
  };

  // --- FETCHING ---
  const fetchData = async () => {
    if (!selectedHotel?.id) return;

    setLoading(true);
    console.log("🚀 Bắt đầu gọi API cho Hotel:", selectedHotel.name);

    try {
      // 1. Chuẩn bị params
      // Lưu ý: Backend của bạn nhận 'hotelIds' là chuỗi "id1,id2" hay mảng?
      // Nếu chọn 1 khách sạn, ta truyền thẳng ID dạng string cho an toàn.
      const params = {
        hotelIds: selectedHotel.id, // Truyền string trực tiếp thay vì array để tránh lỗi format
        startDate: format(startDate, "yyyy-MM-dd"),
        endDate: format(endDate, "yyyy-MM-dd"),
      };

      const res = await axiosClient.get("/hotel-calendar", { params });

      console.log("📡 Kết quả API trả về:", res);

      // 2. Xử lý dữ liệu linh hoạt (Handle mọi trường hợp wrapper của Axios)
      // Trường hợp 1: Axios Interceptor đã trả về data gốc -> res.hotels
      // Trường hợp 2: Axios chuẩn -> res.data.hotels
      // Trường hợp 3: Backend bọc trong data -> res.data.data.hotels

      let hotelData: APIHotelData[] = [];
      const data = res.data || res; // Lấy body response

      if (data?.hotels) {
        // Khớp với JSON bạn gửi: { startDate: "...", hotels: [...] }
        hotelData = data.hotels;
      } else if (data?.data?.hotels) {
        // Khớp với bọc data: { success: true, data: { hotels: [...] } }
        hotelData = data.data.hotels;
      } else if (Array.isArray(data)) {
        // Khớp với trả về mảng trực tiếp
        hotelData = data;
      }

      console.log("✅ Dữ liệu sau khi bóc tách:", hotelData);

      if (hotelData.length > 0) {
        processCalendarData(hotelData);
      } else {
        // Nếu mảng rỗng, xóa dữ liệu cũ trên màn hình
        setRoomGroups([]);
        setBookings([]);
      }
    } catch (error) {
      console.error("❌ Lỗi gọi API:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const initHotels = async () => {
      try {
        const res = await hotelApi.getAll();
        const content = (res as any)?.data?.content || [];
        const list = content.map((h: any) => ({ id: h.id, name: h.name }));
        setHotels(list);
        if (list.length > 0 && !selectedHotel) setSelectedHotel(list[0]);
      } catch (e) {
        console.error(e);
      }
    };
    initHotels();
  }, []);

  useEffect(() => {
    fetchData();
  }, [selectedHotel, startDate, endDate]);

  // --- INTERACTION ---
  // --- UI LOGIC ---
  const dates = useMemo(() => {
    // Kiểm tra an toàn: nếu ngày kết thúc nhỏ hơn ngày bắt đầu thì trả về mảng rỗng hoặc chỉ ngày bắt đầu
    if (endDate < startDate) return [startDate];

    return eachDayOfInterval({
      start: startDate,
      end: endDate,
    });
  }, [startDate, endDate]);

  const handleContextMenu = (
    e: React.MouseEvent,
    roomId?: string,
    date?: Date,
    bookingId?: string
  ) => {
    e.preventDefault();

    if (selection && roomId === selection.roomId) {
      // 👉 mở menu cho vùng kéo
      setContextMenu({
        x: e.clientX,
        y: e.clientY,
        roomId,
        start: selection.start,
        end: selection.end,
      });
    } else {
      // 👉 click chuột phải 1 ô
      setContextMenu({
        x: e.clientX,
        y: e.clientY,
        roomId,
        date,
        bookingId,
      });
    }
  };


  useEffect(() => {
    const closeMenu = () => setContextMenu(null);
    window.addEventListener("click", closeMenu);
    return () => window.removeEventListener("click", closeMenu);
  }, []);

  const handleMouseDown = (roomId: string, date: Date) => {
    if (contextMenu) return;
    setIsDragging(true);
    setSelection({ roomId, start: date, end: date });
  };

  const handleMouseEnter = (roomId: string, date: Date) => {
    if (isDragging && selection && roomId === selection.roomId) {
      setSelection((prev) => (prev ? { ...prev, end: date } : null));
    }
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (!isDragging || !selection) return;

    setContextMenu({
      x: e.clientX,
      y: e.clientY,

      // 🔥 BẮT BUỘC CÓ
      roomId: selection.roomId,
      start: selection.start,
      end: selection.end,
      date: selection.start,

      bookingId: null,
    });

    setIsDragging(false);
  };
  console.log("🟡 CONTEXT MENU DATA:", contextMenu);




  // --- STYLES ---
  const getBookingStyle = (booking: Booking) => {
    const startDiff = differenceInDays(booking.startDate, startDate);
    const duration = differenceInDays(booking.endDate, booking.startDate);
    if (startDiff + duration < 0) return { display: "none" };
    // Clip start if it's before current view
    const visibleStart = Math.max(0, startDiff);
    const visibleDuration = startDiff < 0 ? duration + startDiff : duration;

    return {
      left: `${visibleStart * CELL_WIDTH + 4}px`, // +4 padding
      width: `${visibleDuration * CELL_WIDTH - 8}px`, // -8 margin right
      height: `${CELL_HEIGHT - 16}px`, // Smaller height for sleek look
      top: "8px",
    };
  };

  const getSelectionStyle = () => {
    if (!selection) return {};
    const start =
      selection.start < selection.end ? selection.start : selection.end;
    const end =
      selection.start < selection.end ? selection.end : selection.start;
    const startDiff = differenceInDays(start, startDate);
    const duration = differenceInDays(end, start) + 1;
    return {
      left: `${startDiff * CELL_WIDTH}px`,
      width: `${duration * CELL_WIDTH}px`,
      height: `${CELL_HEIGHT}px`,
      top: 0,
    };
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50 text-sm font-sans text-slate-700 selection:bg-indigo-100">
      {/* === HEADER SECTION === */}
      <div className="flex flex-col z-40 bg-white border-b border-slate-200 shadow-sm relative">
        {/* TOP BAR: HOTEL SELECTOR & ACTIONS */}
        <div className="h-16 px-6 flex items-center justify-between">
          <div className="flex items-center gap-6">
            {/* Logo / Brand Placeholder */}
            <div className="flex items-center gap-2 text-indigo-600 font-black text-lg tracking-tight">
              <Building2 className="w-6 h-6" />
              <span>
                PMS<span className="text-slate-400">.booking</span>
              </span>
            </div>

            {/* Hotel Selector */}
            <div className="w-72 relative z-50">
              <Listbox value={selectedHotel} onChange={setSelectedHotel}>
                <div className="relative">
                  <Listbox.Button className="relative w-full cursor-pointer rounded-xl bg-slate-50 py-2.5 pl-4 pr-10 text-left border border-slate-200 hover:border-indigo-300 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500/20">
                    <span className="block truncate font-bold text-slate-700">
                      {selectedHotel ? selectedHotel.name : "Chọn khách sạn..."}
                    </span>
                    <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                      <ChevronDown
                        className="h-4 w-4 text-slate-400"
                        aria-hidden="true"
                      />
                    </span>
                  </Listbox.Button>
                  <Transition
                    as={Fragment}
                    leave="transition ease-in duration-100"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                  >
                    <Listbox.Options className="absolute mt-1 max-h-60 w-full overflow-auto rounded-xl bg-white py-1 text-base shadow-lg ring-1 ring-black/5 focus:outline-none sm:text-sm">
                      {hotels.map((h) => (
                        <Listbox.Option
                          key={h.id}
                          value={h}
                          className={({ active }) =>
                            `relative cursor-default select-none py-3 pl-10 pr-4 ${active ? "bg-indigo-50 text-indigo-700" : "text-slate-900"}`
                          }
                        >
                          {({ selected }) => (
                            <>
                              <span
                                className={`block truncate ${selected ? "font-bold" : "font-normal"}`}
                              >
                                {h.name}
                              </span>
                              {selected && (
                                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-indigo-600">
                                  <CheckCircle className="h-4 w-4" />
                                </span>
                              )}
                            </>
                          )}
                        </Listbox.Option>
                      ))}
                    </Listbox.Options>
                  </Transition>
                </div>
              </Listbox>
            </div>
          </div>

          {/* Primary Actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setContextMenu(null);
                navigate("../hotels/manual-booking", {
                  state: {
                    // Với nút trên Header, ta không có ngày/phòng cụ thể
                    // Nên truyền ngày hiện tại hoặc để trống
                    date: new Date(),
                    roomId: null,
                    hotelId: selectedHotel?.id,
                  },
                });
              }}
              className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-md shadow-indigo-200 transition-all active:scale-95"
            >
              <Plus size={18} /> Đặt phòng mới
            </button>
          </div>
        </div>

        {/* CONTROL BAR: DATE & FILTERS */}
        <div className="h-14 px-6 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-4">
            {/* Date Navigation: Start Date & End Date */}
            <div className="flex items-center bg-white rounded-lg border border-slate-200 shadow-sm px-1 py-1.5">
              <button
                onClick={() => {
                  setStartDate((prev) => addDays(prev, -1));
                  setEndDate((prev) => addDays(prev, -1));
                }}
                className="p-1.5 hover:bg-slate-100 rounded-md text-slate-500 transition"
              >
                <ChevronLeft size={16} />
              </button>

              {/* Start date */}
              <div
                className="relative px-3 py-0.5 cursor-pointer hover:bg-slate-50 rounded-l-md transition group"
                onClick={() => startDateInputRef.current?.showPicker()}
              >
                <div className="flex items-center gap-2 font-bold text-slate-700 text-xs">
                  <Calendar size={14} className="text-indigo-500" />
                  <span>{format(startDate, "dd/MM/yyyy")}</span>
                </div>
                <input
                  ref={startDateInputRef}
                  type="date"
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  value={format(startDate, "yyyy-MM-dd")}
                  onChange={(e) => {
                    if (!e.target.value) return;
                    const newStart = startOfDay(new Date(e.target.value));
                    const currentRange = differenceInDays(endDate, startDate);
                    setStartDate(newStart);
                    if (newStart > endDate) {
                      setEndDate(addDays(newStart, Math.max(currentRange, 0)));
                    }
                  }}
                />
              </div>

              <span className="px-1 text-xs font-semibold text-slate-400">
                →
              </span>

              {/* End date */}
              <div
                className="relative px-3 py-0.5 cursor-pointer hover:bg-slate-50 rounded-r-md transition group"
                onClick={() => endDateInputRef.current?.showPicker()}
              >
                <div className="flex items-center gap-2 font-bold text-slate-700 text-xs">
                  <Calendar size={14} className="text-indigo-500" />
                  <span>{format(endDate, "dd/MM/yyyy")}</span>
                </div>
                <input
                  ref={endDateInputRef}
                  type="date"
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  value={format(endDate, "yyyy-MM-dd")}
                  onChange={(e) => {
                    if (!e.target.value) return;
                    const newEnd = startOfDay(new Date(e.target.value));
                    if (newEnd < startDate) {
                      setStartDate(newEnd);
                    }
                    setEndDate(newEnd);
                  }}
                />
              </div>

              <button
                onClick={() => {
                  setStartDate((prev) => addDays(prev, 1));
                  setEndDate((prev) => addDays(prev, 1));
                }}
                className="p-1.5 hover:bg-slate-100 rounded-md text-slate-500 transition"
              >
                <ChevronRight size={16} />
              </button>
            </div>

            <button
              onClick={() => {
                const today = startOfDay(new Date());
                const range = differenceInDays(endDate, startDate);
                setStartDate(today);
                setEndDate(addDays(today, Math.max(range, 0)));
              }}
              className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:text-indigo-600 hover:border-indigo-200 transition shadow-sm"
            >
              Hôm nay
            </button>

            <div className="w-px h-6 bg-slate-200 mx-2"></div>

            {/* Status Legend (Simplified) */}
            <div className="flex items-center gap-4 text-xs font-medium text-slate-500">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>{" "}
                Đã xác nhận
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-blue-500"></div> Đã
                Check-in
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-slate-400"></div> Đã
                trả
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-500"></div>{" "}
                Dọn phòng
              </div>
            </div>
          </div>

          {/* View Controls */}
          <div className="flex items-center gap-2">
            <div className="flex bg-white p-1 rounded-lg border border-slate-200 shadow-sm">
              {["day", "week", "month"].map((m) => (
                <button
                  key={m}
                  onClick={() => setViewMode(m as any)}
                  className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${viewMode === m ? "bg-indigo-50 text-indigo-700" : "text-slate-500 hover:bg-slate-50"}`}
                >
                  {m === "day" ? "Ngày" : m === "week" ? "Tuần" : "Tháng"}
                </button>
              ))}
            </div>
            <button className="p-2 bg-white border border-slate-200 rounded-lg text-slate-500 hover:text-indigo-600 shadow-sm transition">
              <Settings size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* === GANTT CHART AREA === */}
      <div
        className="flex-1 overflow-hidden relative flex bg-white"
        onMouseUp={handleMouseUp}
      >
        <div className="overflow-auto w-full h-full relative scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
          {/* --- HEADER (DATES) --- */}
          <div
            className="sticky top-0 z-30 flex bg-white border-b border-slate-400 shadow-sm"
            style={{ height: HEADER_HEIGHT, minWidth: "fit-content" }}
          >
            {/* Corner Cell */}
            <div
              className="sticky left-0 z-40 bg-white border-r border-slate-400 flex flex-col items-center justify-center shadow-[4px_0_12px_-4px_rgba(0,0,0,0.05)]"
              style={{ width: SIDEBAR_WIDTH, height: HEADER_HEIGHT }}
            >
              <span className="text-xs font-black text-slate-400 uppercase tracking-widest">
                DANH SÁCH PHÒNG
              </span>
              <div className="mt-2 flex gap-2">
                <span className="px-2 py-0.5 bg-slate-100 rounded text-[10px] font-bold text-slate-500">
                  {hotels.length} Phòng
                </span>
              </div>
            </div>
            {/* Date Cells */}
            <div className="flex">
              {dates.map((date, index) => {
                const isT = isToday(date);
                const isW = isWeekend(date);
                return (
                  <div
                    key={index}
                    // Mới: border-slate-300
                    className={`flex-shrink-0 border-r border-slate-300 flex flex-col items-center justify-center group relative ${isW ? "bg-slate-50/50" : ""} ${isT ? "bg-indigo-50/30" : ""}`}
                    style={{ width: CELL_WIDTH, height: HEADER_HEIGHT }}
                  >
                    {isT && (
                      <div className="absolute top-0 inset-x-0 h-1 bg-indigo-500"></div>
                    )}
                    <span
                      className={`text-[10px] font-bold uppercase mb-1 ${isT ? "text-indigo-600" : "text-slate-400"}`}
                    >
                      {format(date, "EEE", { locale: vi })}
                    </span>
                    <div
                      className={`w-9 h-9 flex items-center justify-center rounded-full text-lg font-bold transition-all ${isT ? "bg-indigo-600 text-white shadow-md shadow-indigo-200" : "text-slate-700 group-hover:bg-slate-200"}`}
                    >
                      {format(date, "dd")}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* --- BODY (ROOMS & GRID) --- */}
          <div className="relative min-w-fit pb-20">
            {/* Loading State */}
            {loading && (
              <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] z-50 flex items-center justify-center">
                <div className="flex flex-col items-center">
                  <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-2"></div>
                  <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">
                    Đang tải dữ liệu...
                  </span>
                </div>
              </div>
            )}

            {roomGroups.map((group) => (
              <div key={group.id} className="">
                {/* Group Header */}
                <div
                  className="sticky left-0 z-20 bg-slate-50/95 border-b border-r border-slate-200 px-4 py-2 flex items-center justify-between backdrop-blur-sm"
                  style={{ width: SIDEBAR_WIDTH }}
                >
                  <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest truncate">
                    {group.name}
                  </span>
                  <span className="text-[10px] font-bold bg-white border border-slate-200 px-1.5 rounded text-slate-400">
                    {group.rooms.length}
                  </span>
                </div>

                {group.rooms.map((room) => (
                  <div
                    key={room.id}
                    className="flex relative hover:bg-slate-50/50 transition-colors group/row"
                  >
                    {/* Sidebar Room Cell */}
                    <div
                      className="sticky left-0 z-20 bg-white border-r border-b border-slate-300 px-4 flex items-center justify-between group-hover/row:bg-slate-50 transition-colors shadow-[2px_0_10px_-4px_rgba(0,0,0,0.05)]"
                      style={{ width: SIDEBAR_WIDTH, height: CELL_HEIGHT }}
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div
                          className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${room.status === "clean" ? "bg-emerald-400" : "bg-rose-400"}`}
                        ></div>
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-700 text-sm truncate">
                            {room.name}
                          </span>
                          <span className="text-[10px] text-slate-400 capitalize">
                            {room.status === "clean" ? "Sạch" : "Chưa dọn"}
                          </span>
                        </div>
                      </div>
                      <button className="p-1.5 rounded hover:bg-slate-200 text-slate-300 hover:text-slate-600 transition opacity-0 group-hover/row:opacity-100">
                        <MoreHorizontal size={14} />
                      </button>
                    </div>

                    {/* Grid Cells */}
                    <div className="flex relative">
                      {dates.map((date, index) => {
                        const isW = isWeekend(date);
                        const isT = isToday(date);
                        return (
                          <div
                            key={index}
                            className={`border-r border-b border-slate-300 flex-shrink-0 transition-colors 
        ${isW ? "bg-slate-50/40" : ""} 
        ${isT ? "bg-indigo-50/20" : ""}
        hover:bg-indigo-50/30
    `}
                            style={{ width: CELL_WIDTH, height: CELL_HEIGHT }}
                            onContextMenu={(e) =>
                              handleContextMenu(e, room.id, date)
                            }
                            onMouseDown={() => handleMouseDown(room.id, date)}
                            onMouseEnter={() => handleMouseEnter(room.id, date)}
                          />
                        );
                      })}

                      {/* Selection Box */}
                      {isDragging &&
                        selection &&
                        selection.roomId === room.id && (
                          <div
                            className="absolute bg-indigo-500/20 border-2 border-indigo-500 z-10 pointer-events-none rounded-lg"
                            style={getSelectionStyle()}
                          >
                            <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-[10px] font-bold px-2 py-1 rounded shadow-lg whitespace-nowrap z-50">
                              {format(
                                selection.start < selection.end
                                  ? selection.start
                                  : selection.end,
                                "dd/MM",
                              )}{" "}
                              -{" "}
                              {format(
                                selection.start < selection.end
                                  ? selection.end
                                  : selection.start,
                                "dd/MM",
                              )}
                            </div>
                          </div>
                        )}

                      {/* Bookings */}
                      {bookings
                        .filter((b) => b.roomId === room.id)
                        .map((booking) => {
                          const style = getBookingStyle(booking);
                          const colorClass = getStatusColor(booking.status);
                          return (
                            <div
                              key={booking.id}
                              className={`absolute z-10 rounded-lg shadow-sm border-l-[4px] px-2.5 flex flex-col justify-center cursor-pointer transition-all hover:brightness-95 hover:shadow-md hover:scale-[1.01] group/item ${colorClass}`}
                              style={style}
                              onContextMenu={(e) => {
                                e.stopPropagation();
                                handleContextMenu(
                                  e,
                                  undefined,
                                  undefined,
                                  booking.id,
                                );
                              }}
                            >
                              <div className="flex items-center gap-1.5 overflow-hidden">
                                <span className="font-bold text-xs truncate leading-tight">
                                  {booking.customerName}
                                </span>
                              </div>
                              {parseInt(style.width) > 60 && (
                                <div className="text-[9px] opacity-80 truncate mt-0.5 font-medium flex items-center gap-1">
                                  <ArrowRightLeft size={8} />
                                  {format(booking.startDate, "dd/MM")} -{" "}
                                  {format(booking.endDate, "dd/MM")}
                                </div>
                              )}
                            </div>
                          );
                        })}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* === CONTEXT MENU === */}
      {contextMenu && (
        <>
          <div
            className="fixed inset-0 z-[90]"
            onClick={() => setContextMenu(null)}
          ></div>
          <div
            className="fixed bg-white rounded-xl shadow-2xl border border-slate-100 z-[100] w-64 py-1.5 animate-in fade-in zoom-in-95 duration-100 -translate-x-full mt-2"
            style={{ top: contextMenu.y, left: contextMenu.x }}
          >
            {contextMenu.bookingId ? (
              <div className="flex flex-col">
                <div className="px-4 py-3 bg-slate-50 border-b border-slate-100 mb-1">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                    Booking ID
                  </span>
                  <span className="font-mono text-xs font-bold text-slate-700">
                    #{contextMenu.bookingId.slice(0, 8)}
                  </span>
                </div>
                <button className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center gap-3 text-slate-700 font-medium text-sm transition-colors">
                  <Edit size={16} className="text-indigo-500" /> Xem chi tiết
                </button>
                <button className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center gap-3 text-slate-700 font-medium text-sm transition-colors">
                  <LogOut size={16} className="text-orange-500" /> Check-out
                </button>
                <div className="h-px bg-slate-100 my-1 mx-3"></div>
                <button className="w-full text-left px-4 py-2 hover:bg-rose-50 flex items-center gap-3 text-rose-600 font-medium text-sm transition-colors">
                  <Trash2 size={16} /> Hủy đặt phòng
                </button>
              </div>
            ) : (
              <div className="flex flex-col">
                <div className="px-4 py-3 bg-indigo-50 border-b border-indigo-100 mb-1">
                  <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest block">
                    Ngày đã chọn
                  </span>
                  <span className="font-bold text-indigo-900 text-sm">
                    {contextMenu.date &&
                      format(contextMenu.date, "EEEE, dd/MM/yyyy", {
                        locale: vi,
                      })}
                  </span>
                </div>
                <button
                  onClick={() => {
                    navigate("/hotels/manual-booking", {
                      state: {
                        hotelId: selectedHotel?.id,
                        roomId: contextMenu.roomId,
                        start: contextMenu.start,
                        end: contextMenu.end,
                        date: contextMenu.date,
                      },
                      
                    });
                    

                    setContextMenu(null);
                  }}
                  className="w-full text-left px-4 py-2.5 hover:bg-indigo-600 hover:text-white flex items-center gap-3 text-slate-700 font-bold text-sm transition-all group"
                >
                  <Plus
                    size={18}
                    className="text-indigo-500 group-hover:text-white transition-colors"
                  />
                  Đặt phòng mới
                </button>
                <button className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center gap-3 text-slate-600 font-medium text-sm transition-colors">
                  <Brush size={16} /> Đánh dấu đã dọn
                </button>
                <button className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center gap-3 text-slate-600 font-medium text-sm transition-colors">
                  <Construction size={16} /> Báo bảo trì
                </button>
              </div>
            )}
          </div>
        </>
      )}

    </div>
  );
}
