import React, { useState, useRef, useCallback, useMemo, useEffect } from "react";
import { ArrowLeft, UserCheck, Check, Users, Maximize, UserPlus, ShieldAlert } from "lucide-react";
import { toast } from "react-toastify";
import { StageData, Zone, Seat, SeatStatus } from "@/type/Stage.type";
import axiosClient from "@/axiosclient";

// --- LOGIC KIỂM TRA QUYỀN (Helper) ---
const checkIsAdmin = () => {
  try {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    // Bạn hãy kiểm tra xem Backend của bạn trả về field nào: role, roles, hay position...
    // Ở đây tôi giả định là user.role === 'ADMIN'
    return user?.role === "ADMIN"; 
  } catch (e) {
    return false;
  }
};

const SEAT_SIZE = 40;
const GAP = 6;
const getGridBaseSize = (rows: number, cols: number) => ({
  w: cols * SEAT_SIZE + (cols - 1) * GAP + 24,
  h: rows * SEAT_SIZE + (rows - 1) * GAP + 24,
});

// --- TỐI ƯU 1: GHẾ COMPONENT ---
const SeatItem = React.memo(({ seat, zoneId, onToggle, onReset, onHover, onLeave, isAdmin }: any) => {
  const timerRef = useRef<any>(null);
  const isLongPress = useRef(false);

  if (seat.type === "blocked") return <div className="w-[40px] h-[40px] invisible" />;

  const handlePointerDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    // Nếu không phải Admin thì không chạy timer Long Press
    if (!isAdmin) return;

    isLongPress.current = false;
    timerRef.current = setTimeout(() => {
      isLongPress.current = true;
      onReset(zoneId, seat.row * 1000 + seat.col);
      if (navigator.vibrate) navigator.vibrate(50);
    }, 700);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    e.stopPropagation();
    if (timerRef.current) clearTimeout(timerRef.current);
    
    if (!isLongPress.current) {
      onToggle(zoneId, seat.row * 1000 + seat.col);
    }
  };

  const handlePointerLeave = (e: React.PointerEvent) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    onLeave();
  };

  const status = seat.status as SeatStatus;
  let bgClass = "";
  let displayBg = undefined;
  let showCheckmark = false;

  if (status === 'BOOKED' || status === 'RESERVED') {
    bgClass = "bg-[#FFD700] border-[#B8860B] text-slate-900";
  } else if (status === 'WAITING') {
    bgClass = "bg-[#A855F7] border-[#7E22CE] text-white";
  } else if (status === 'guest') {
    bgClass = "bg-[#808080] border-[#4B5563] text-white";
  } else if (status === 'CHECKED_IN') {
    bgClass = "bg-[#32CD32] border-[#228B22] text-white";
    showCheckmark = true;
  } else {
    if (seat.type === 'vip') bgClass = "bg-[#FF0000] border-[#B22222] text-white";
    else if (seat.type === 'standard') bgClass = "bg-[#3b82f6] border-[#2563eb] text-white";
    else if (seat.type === 'guest') bgClass = "bg-[#808080] border-[#696969] text-white";
    else bgClass = "bg-slate-400 border-slate-500 text-white";
    if (seat.customColor) displayBg = seat.customColor;
  }

  return (
    <div
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerLeave}
      onMouseEnter={(e) => onHover(e, seat)}
      onContextMenu={(e) => e.preventDefault()}
      style={{ backgroundColor: displayBg }}
      className={`w-[40px] h-[40px] rounded-lg flex items-center justify-center select-none relative border-b-4 transition-all active:scale-90 ${bgClass} touch-none ${!isAdmin ? 'cursor-default' : 'cursor-pointer'}`}
    >
      {showCheckmark ? <Check size={28} strokeWidth={4} /> : <span className="text-[11px] font-bold">{seat.label}</span>}
    </div>
  );
});

// --- COMPONENT CHÍNH ---
const StageCheckIn: React.FC<any> = ({ data, onUpdate, onBack, isReadOnly }) => {
  const [zones, setZones] = useState<Zone[]>(data.zones);
  
  // KIỂM TRA QUYỀN ADMIN TẠI ĐÂY
  const isAdmin = useMemo(() => checkIsAdmin(), []);

  // --- TỐI ƯU 2: KHÔNG DÙNG VÒNG LẶP ĐỂ ĐẾM COUNT NỮA ---
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>(() => {
    if (data.seatStatusCounts && Object.keys(data.seatStatusCounts).length > 0) return data.seatStatusCounts;
    const initial: Record<string, number> = {};
    data.zones?.forEach((z: Zone) => z.seats?.forEach((s: any) => {
      if (s.type !== "blocked" && !z.isBox) {
        initial[s.status || "AVAILABLE"] = (initial[s.status || "AVAILABLE"] || 0) + 1;
      }
    }));
    return initial;
  });

  const typeCounts = useMemo(() => {
    if (data.seatTypeCounts && Object.keys(data.seatTypeCounts).length > 0) return data.seatTypeCounts;
    const initial: Record<string, number> = {};
    data.zones?.forEach((z: Zone) => z.seats?.forEach((s: any) => {
      if (s.type !== "blocked" && !z.isBox) {
        initial[s.type || "standard"] = (initial[s.type || "standard"] || 0) + 1;
      }
    }));
    return initial;
  }, [data]);

  const stats = useMemo(() => {
    const totalCount = Object.values(typeCounts).reduce((a: number, b: number) => a + (b || 0), 0) as number;
    return {
      total: totalCount - (typeCounts.blocked || 0),
      booked: (statusCounts.BOOKED || 0) + (statusCounts.RESERVED || 0),
      waiting: statusCounts.WAITING || 0,
      checked: statusCounts.CHECKED_IN || 0,
      guest: statusCounts.guest || 0,
      available: statusCounts.AVAILABLE || 0,
    };
  }, [statusCounts, typeCounts]);

  const transform = useRef({ x: 50, y: 50, scale: 0.5 });
  const contentRef = useRef<HTMLDivElement>(null);
  const activePointers = useRef<Map<number, { x: number; y: number }>>(new Map());
  const lastPinchDistance = useRef<number | null>(null);
  const zonesRef = useRef<Zone[]>(zones);

  useEffect(() => { zonesRef.current = zones; }, [zones]);

  const applyTransform = () => {
    if (contentRef.current) {
      contentRef.current.style.transform = `translate3d(${transform.current.x}px, ${transform.current.y}px, 0) scale(${transform.current.scale})`;
    }
  };

  // --- HÀM RESET (CHỈ CHO ADMIN) ---
  const resetToAvailable = useCallback(async (zoneId: string, combinedIdx: number) => {
    if (isReadOnly || !isAdmin) {
      toast.error("Chỉ Admin mới có quyền giải phóng ghế!");
      return;
    }
    
    const currentZones = [...zonesRef.current];
    const zIdx = currentZones.findIndex(z => z.id === zoneId);
    const sIdx = currentZones[zIdx].seats.findIndex(s => (s.row * 1000 + s.col) === combinedIdx);
    const targetSeat = { ...currentZones[zIdx].seats[sIdx] } as any;

    const currentStatus = targetSeat.status || "AVAILABLE";

    targetSeat.status = "AVAILABLE";
    targetSeat.isOccupied = false;
    targetSeat.customColor = null;

    currentZones[zIdx].seats[sIdx] = targetSeat;
    setZones(currentZones);
    
    // CẬP NHẬT TRẠNG THÁI STATUS COUNTS (O(1))
    const nextCounts = { ...statusCounts };
    if (nextCounts[currentStatus]) nextCounts[currentStatus]--;
    if (!nextCounts["AVAILABLE"]) nextCounts["AVAILABLE"] = 0;
    nextCounts["AVAILABLE"]++;
    setStatusCounts(nextCounts);

    onUpdate({ ...data, zones: currentZones, seatStatusCounts: nextCounts });

    try {
      await axiosClient.patch(`/stages/${data.id}/seats/${targetSeat.id}/status`, { status: "AVAILABLE" });
      toast.info(`Đã giải phóng ghế ${targetSeat.label}`);
    } catch (error) {
      toast.error("Lỗi cập nhật server");
    }
  }, [data.id, isReadOnly, isAdmin, onUpdate]);

  // --- HÀM TOGGLE (CHỈ CHO ADMIN) ---
  const toggleCheckIn = useCallback(async (zoneId: string, combinedIdx: number) => {
    if (isReadOnly || !isAdmin) {
      toast.error("Bạn không có quyền check-in. Vui lòng dùng tài khoản Admin!");
      return;
    }
    
    const currentZones = [...zonesRef.current];
    const zIdx = currentZones.findIndex(z => z.id === zoneId);
    const sIdx = currentZones[zIdx].seats.findIndex(s => (s.row * 1000 + s.col) === combinedIdx);
    const targetSeat = { ...currentZones[zIdx].seats[sIdx] } as any;

    const currentStatus = targetSeat.status || "AVAILABLE";
    let nextStatus: SeatStatus;
    
    if (currentStatus === "AVAILABLE") nextStatus = "BOOKED";
    else if (currentStatus === "BOOKED") nextStatus = "WAITING";
    else if (currentStatus === "WAITING") nextStatus = "guest";
    else if (currentStatus === "guest") nextStatus = "CHECKED_IN";
    else nextStatus = "AVAILABLE";

    targetSeat.status = nextStatus;
    targetSeat.isOccupied = (nextStatus === "CHECKED_IN" || nextStatus === "guest");

    currentZones[zIdx].seats[sIdx] = targetSeat;
    setZones(currentZones);
    
    // CẬP NHẬT TRẠNG THÁI STATUS COUNTS (O(1))
    const nextCounts = { ...statusCounts };
    if (nextCounts[currentStatus]) nextCounts[currentStatus]--;
    if (!nextCounts[nextStatus]) nextCounts[nextStatus] = 0;
    nextCounts[nextStatus]++;
    setStatusCounts(nextCounts);

    onUpdate({ ...data, zones: currentZones, seatStatusCounts: nextCounts });

    try {
      await axiosClient.patch(`/stages/${data.id}/seats/${targetSeat.id}/status`, { status: nextStatus });
    } catch (error) {
      toast.error("Lỗi cập nhật trạng thái");
    }
  }, [data.id, isReadOnly, isAdmin, onUpdate]);

  // --- HỆ THỐNG ĐIỀU HƯỚNG ---
  const handlePointerMove = (e: React.PointerEvent) => {
    if (activePointers.current.size === 0) return;
    const prevPos = activePointers.current.get(e.pointerId);
    activePointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (activePointers.current.size === 1 && prevPos) {
      transform.current.x += e.clientX - prevPos.x;
      transform.current.y += e.clientY - prevPos.y;
      requestAnimationFrame(applyTransform);
    } else if (activePointers.current.size === 2) {
      const points = Array.from(activePointers.current.values());
      const dist = Math.sqrt(Math.pow(points[1].x - points[0].x, 2) + Math.pow(points[1].y - points[0].y, 2));
      if (lastPinchDistance.current) {
        const diff = dist - lastPinchDistance.current;
        transform.current.scale = Math.min(Math.max(0.05, transform.current.scale + diff * 0.003), 3);
        requestAnimationFrame(applyTransform);
      }
      lastPinchDistance.current = dist;
    }
  };

  useEffect(() => { applyTransform(); }, []);

  const [tooltip, setTooltip] = useState<any>(null);

  return (
    <div className="flex flex-col h-screen bg-slate-50 font-sans relative overflow-hidden select-none touch-none">
      {/* HEADER */}
      <div className="bg-white border-b border-slate-200 h-16 px-4 flex items-center justify-between shadow-sm z-50">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors"><ArrowLeft size={24} /></button>
          <div>
            <h1 className="text-sm font-bold text-slate-800 line-clamp-1">{data.name}</h1>
            {!isAdmin && (
              <div className="flex items-center gap-1 text-[9px] text-red-500 font-bold uppercase">
                <ShieldAlert size={10} /> Chỉ xem (Nhân viên)
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1 md:gap-2 overflow-x-auto no-scrollbar py-1">
          <div className="flex items-center gap-1 px-2 py-1 bg-white border border-slate-200 rounded-lg font-black text-slate-600 text-[9px] shadow-sm"><Users size={12} /> {stats.total}</div>
          <div className="flex items-center gap-1 px-2 py-1 bg-[#FFFBEB] border border-[#FEF3C7] rounded-lg font-black text-[#B45309] text-[9px] shadow-sm"><div className="w-2 h-2 rounded-full bg-[#FFD700]" /> {stats.booked}</div>
          <div className="flex items-center gap-1 px-2 py-1 bg-[#F5F3FF] border border-[#EDE9FE] rounded-lg font-black text-[#7E22CE] text-[9px] shadow-sm"><div className="w-2 h-2 rounded-full bg-[#A855F7]" /> {stats.waiting}</div>
          <div className="flex items-center gap-1 px-2 py-1 bg-[#F9FAFB] border border-[#F3F4F6] rounded-lg font-black text-[#4B5563] text-[9px] shadow-sm"><div className="w-2 h-2 rounded-full bg-[#808080]" /> {stats.guest}</div>
          <div className="flex items-center gap-1 px-2 py-1 bg-[#F0FDF4] border border-[#DCFCE7] rounded-lg font-black text-[#15803D] text-[9px] shadow-sm"><UserCheck size={12} /> {stats.checked}</div>
        </div>
      </div>

      {/* VIEWPORT */}
      <div 
        className="flex-1 relative bg-slate-200 overflow-hidden"
        onPointerDown={(e) => { activePointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY }); e.currentTarget.setPointerCapture(e.pointerId); }}
        onPointerMove={handlePointerMove}
        onPointerUp={(e) => { activePointers.current.delete(e.pointerId); if (activePointers.current.size < 2) lastPinchDistance.current = null; }}
        onWheel={(e) => { transform.current.scale = Math.min(Math.max(0.05, transform.current.scale + (-e.deltaY * 0.0005)), 3); applyTransform(); }}
      >
        <div ref={contentRef} style={{ transformOrigin: "0 0", willChange: "transform" }} className="absolute inset-0">
          {zones.map((zone) => {
            const baseSize = getGridBaseSize(zone.rows, zone.cols);
            const scaleX = zone.isBox ? 1 : zone.width / baseSize.w;
            const scaleY = zone.isBox ? 1 : zone.height / baseSize.h;
            return (
              <div key={zone.id} style={{ position: "absolute", left: zone.x, top: zone.y, width: zone.width, height: zone.height, transform: `rotate(${zone.rotation}deg)` }}>
                {!zone.isBox && (
                  <div className={`absolute flex ${zone.rows > zone.cols ? "top-full left-0 w-full pt-1 justify-center" : "right-full top-1/2 -translate-y-1/2 pr-4 justify-end items-center"}`}>
                    <span className="bg-white px-3 py-1.5 rounded-lg text-[22px] font-black border-2 border-slate-300 text-slate-800 shadow-xl whitespace-nowrap uppercase tracking-wider">{zone.name}</span>
                  </div>
                )}
                <div className="w-full h-full overflow-hidden rounded-lg shadow-sm" style={zone.isBox ? {} : { transform: `scale(${scaleX}, ${scaleY})`, transformOrigin: "top left", width: baseSize.w, height: baseSize.h }}>
                  {zone.isBox ? (
                    <div onPointerDown={(e)=>e.stopPropagation()} onDoubleClick={()=>{if(isAdmin) resetToAvailable(zone.id, 0)}} style={{ backgroundColor: zone.seats[0].customColor || "#ef4444" }} className="w-full h-full flex items-center justify-center text-white font-bold text-center p-2"><span className="text-xl">{zone.seats[0].label}</span></div>
                  ) : (
                    <div className="bg-slate-300/10 p-3 rounded-xl border border-slate-300/20" style={{ display: "grid", gridTemplateColumns: `repeat(${zone.cols}, ${SEAT_SIZE}px)`, gap: GAP, width: "fit-content" }}>
                      {zone.seats.map((seat) => (
                        <SeatItem 
                          key={seat.id} 
                          seat={seat} 
                          zoneId={zone.id} 
                          onToggle={toggleCheckIn} 
                          onReset={resetToAvailable} 
                          onHover={(e:any, s:any)=>setTooltip({x:e.clientX, y:e.clientY, seat:s})} 
                          onLeave={()=>setTooltip(null)} 
                          isAdmin={isAdmin}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* TOOLTIP */}
      {tooltip && (
        <div className="fixed z-[100] pointer-events-none bg-slate-900/95 backdrop-blur text-white px-3 py-2 rounded-lg shadow-2xl border border-slate-700 text-xs flex flex-col gap-1" style={{ top: tooltip.y + 15, left: tooltip.x + 15 }}>
          <div className="flex items-center justify-between gap-4">
            <span className="font-black text-yellow-400 text-sm">{tooltip.seat.label}</span>
            <span className="bg-white/10 px-1.5 py-0.5 rounded text-[8px] uppercase font-bold">{tooltip.seat.type}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-1.5 h-1.5 rounded-full ${tooltip.seat.status === 'AVAILABLE' ? 'bg-slate-400' : 'bg-green-400 animate-pulse'}`}></div>
            <span className="font-medium text-slate-300 uppercase">{tooltip.seat.status}</span>
          </div>
          {isAdmin && <div className="text-[9px] text-slate-500 mt-1 italic uppercase">Giữ lâu để giải phóng</div>}
        </div>
      )}

      <button onClick={() => { transform.current = { x: 50, y: 50, scale: 0.5 }; applyTransform(); }} className="absolute bottom-6 right-6 p-4 bg-white rounded-full shadow-2xl z-50 active:scale-90 transition-transform text-slate-600"><Maximize size={24} /></button>
    </div>
  );
};

export default StageCheckIn;