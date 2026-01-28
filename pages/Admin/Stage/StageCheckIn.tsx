import React, { useState } from "react";
import { ArrowLeft, UserCheck, Check, Users } from "lucide-react";
import { StageData, Zone } from "@/type/Stage.type";

// --- CONSTANTS ---
const SEAT_SIZE = 40;
const GAP = 6;
const getGridBaseSize = (rows: number, cols: number) => ({
  w: cols * SEAT_SIZE + (cols - 1) * GAP + 24,
  h: rows * SEAT_SIZE + (rows - 1) * GAP + 24,
});

interface StageCheckInProps {
  data: StageData;
  onUpdate: (d: StageData) => void;
  onBack: () => void;
}

const StageCheckIn: React.FC<StageCheckInProps> = ({ data, onUpdate, onBack }) => {
  const [zones, setZones] = useState<Zone[]>(data.zones);

  // STATE CHO TOOLTIP
  const [tooltip, setTooltip] = useState<{
    x: number;
    y: number;
    label: string;
    type: string;
    status: string;
  } | null>(null);

  const toggleCheckIn = (zoneId: string, seatIndex: number) => {
    const newZones = zones.map((z) => {
      if (z.id !== zoneId) return z;
      const newSeats = [...z.seats];
      if (newSeats[seatIndex].type === "blocked") return z;
      newSeats[seatIndex] = {
        ...newSeats[seatIndex],
        isOccupied: !newSeats[seatIndex].isOccupied,
      };
      return { ...z, seats: newSeats };
    });
    setZones(newZones);
    onUpdate({ ...data, zones: newZones });
  };

  // --- TÍNH TOÁN CHỈ SỐ ---
  const totalSeats = zones.reduce(
    (acc, z) => acc + z.seats.filter((s) => s.type !== "blocked" && !z.isBox).length,
    0
  );
  const checkedInCount = zones.reduce(
    (acc, z) => acc + z.seats.filter((s) => s.isOccupied).length,
    0
  );

  return (
    <div className="flex flex-col h-screen bg-slate-50 font-sans relative overflow-hidden">
      {/* HEADER MỚI: CHỈ HIỂN THỊ 2 THẺ QUAN TRỌNG */}
      <div className="bg-white border-b border-slate-200 h-20 px-6 flex items-center justify-between shadow-sm z-50">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors">
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-800">{data.name}</h1>
            <p className="text-xs text-slate-500 flex items-center gap-1">
               <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
               Đang hoạt động
            </p>
          </div>
        </div>

        {/* --- KHU VỰC THỐNG KÊ (2 THẺ NHƯ HÌNH) --- */}
        <div className="flex items-center gap-4">
            
            {/* Thẻ 1: TỔNG GHẾ */}
            <div className="flex items-center gap-3 px-5 py-2 bg-white border border-blue-100 rounded-xl shadow-sm">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                    <Users size={20} />
                </div>
                <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tổng ghế</div>
                    <div className="text-xl font-black text-slate-800 leading-none">{totalSeats}</div>
                </div>
            </div>

            {/* Thẻ 2: ĐÃ CHECK-IN */}
            <div className="flex items-center gap-3 px-5 py-2 bg-white border border-green-100 rounded-xl shadow-sm">
                <div className="p-2 bg-green-50 text-green-600 rounded-lg">
                    <UserCheck size={20} />
                </div>
                <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Đã Check-in</div>
                    <div className="text-xl font-black text-green-600 leading-none">{checkedInCount}</div>
                </div>
            </div>

        </div>
      </div>

      {/* MAP VIEW */}
      <div className="flex-1 relative bg-slate-100 overflow-auto cursor-default">
         {/* ... Phần Map giữ nguyên ... */}
        <div className="absolute inset-0 min-w-full min-h-full">
          {zones.map((zone) => {
            const baseSize = getGridBaseSize(zone.rows, zone.cols);
            const scaleX = zone.isBox ? 1 : zone.width / baseSize.w;
            const scaleY = zone.isBox ? 1 : zone.height / baseSize.h;
            return (
              <div
                key={zone.id}
                style={{
                  position: "absolute",
                  left: zone.x,
                  top: zone.y,
                  width: zone.width,
                  height: zone.height,
                  transform: `rotate(${zone.rotation}deg)`,
                }}
              >
                <div className="absolute -top-8 left-0 w-full flex justify-center">
                  <span className="bg-white/80 px-2 py-0.5 rounded text-xs font-bold shadow-sm border border-slate-200">
                    {zone.name}
                  </span>
                </div>
                <div
                  className="w-full h-full overflow-hidden rounded-lg shadow-sm"
                  style={zone.isBox ? {} : { transform: `scale(${scaleX}, ${scaleY})`, transformOrigin: "top left", width: baseSize.w, height: baseSize.h }}
                >
                  {zone.isBox ? (
                    <div
                      style={{ backgroundColor: zone.seats[0].customColor || "#64748b" }}
                      className="w-full h-full flex items-center justify-center text-white font-bold text-center p-2"
                    >
                      <span className="text-xl">{zone.seats[0].label}</span>
                    </div>
                  ) : (
                    <div
                      className="bg-slate-300/20 p-3 rounded-xl border border-slate-300/30"
                      style={{ display: "grid", gridTemplateColumns: `repeat(${zone.cols}, ${SEAT_SIZE}px)`, gap: GAP, width: "fit-content" }}
                    >
                      {zone.seats.map((seat, index) => {
                        let className = `h-[${SEAT_SIZE}px] rounded-lg flex items-center justify-center text-[11px] font-bold shadow-sm transition-all border-b-4 relative `;
                        if (seat.type === "blocked") className += " invisible";
                        else {
                          className += " cursor-pointer active:scale-95 select-none hover:brightness-110";
                          if (seat.isOccupied)
                            className += " bg-green-500 border-green-700 text-white shadow-green-200";
                          else {
                            if (seat.type === "vip")
                              className += " bg-amber-400 border-amber-600 text-amber-950";
                            else if (seat.type === "standard")
                              className += " bg-blue-500 border-blue-700 text-white";
                            else if (seat.type === "custom" && seat.customColor)
                              className += " text-white border-black/10";
                            else
                              className += " bg-slate-400 border-slate-500 text-white";
                          }
                        }
                        return (
                          <div
                            key={seat.id}
                            onClick={() => toggleCheckIn(zone.id, index)}
                            style={!seat.isOccupied && seat.type === "custom" ? { backgroundColor: seat.customColor } : {}}
                            className={className}
                            onMouseEnter={(e) => {
                              if (seat.type === "blocked") return;
                              setTooltip({
                                x: e.clientX,
                                y: e.clientY,
                                label: seat.label,
                                type: seat.type === "vip" ? "Ghế VIP" : seat.type === "standard" ? "Ghế Thường" : "Khác",
                                status: seat.isOccupied ? "Đã check-in" : "Chưa check-in",
                              });
                            }}
                            onMouseMove={(e) => {
                              if (tooltip) setTooltip((prev) => (prev ? { ...prev, x: e.clientX, y: e.clientY } : null));
                            }}
                            onMouseLeave={() => setTooltip(null)}
                          >
                            {seat.isOccupied ? <Check size={24} strokeWidth={3} /> : seat.label}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* --- TOOLTIP RENDER --- */}
      {tooltip && (
        <div
          className="fixed z-[100] pointer-events-none bg-slate-900/95 backdrop-blur text-white px-3 py-2 rounded-lg shadow-2xl border border-slate-700 text-sm flex flex-col gap-1 min-w-[120px]"
          style={{ top: tooltip.y + 15, left: tooltip.x + 15 }}
        >
          <div className="font-bold text-base text-yellow-400">{tooltip.label}</div>
          <div className="text-xs text-slate-300 border-b border-slate-600 pb-1 mb-1">{tooltip.type}</div>
          <div className={`text-xs font-bold uppercase tracking-wider ${tooltip.status === "Đã check-in" ? "text-green-400" : "text-slate-400"}`}>
            {tooltip.status}
          </div>
        </div>
      )}
    </div>
  );
};

export default StageCheckIn;