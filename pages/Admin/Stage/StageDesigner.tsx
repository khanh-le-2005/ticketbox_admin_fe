import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Move,
  Trash2,
  RotateCw,
  Save,
  ArrowLeft,
  Square,
  Grid3X3,
  MousePointer2,
  XCircle,
  Hand,
  ZoomIn,
  ZoomOut,
  Maximize,
  Undo,
  Redo,
  Copy,
  Clipboard,
  Loader2 // Import thêm icon loading
} from "lucide-react";
import { toast } from "react-toastify";
import { SeatType, Zone, StageData, Seat } from "@/type/Stage.type";
import axiosClient from "@/axiosclient";

// --- CONFIG API ---
// Thay đổi URL này thành địa chỉ backend thực tế của bạn
// const API_BASE_URL = "http://localhost:8080"; // Ví dụ: https://api.yoursite.com

const SEAT_SIZE = 40;
const GAP = 6;
const getGridBaseSize = (rows: number, cols: number) => ({
  w: cols * SEAT_SIZE + (cols - 1) * GAP + 24,
  h: rows * SEAT_SIZE + (rows - 1) * GAP + 24,
});

const PALETTE = [
  { color: "#ef4444", name: "Đỏ" },
  { color: "#f97316", name: "Cam" },
  { color: "#eab308", name: "Vàng" },
  { color: "#22c55e", name: "Xanh Lá" },
  { color: "#06b6d4", name: "Cyan" },
  { color: "#3b82f6", name: "Xanh Dương" },
  { color: "#a855f7", name: "Tím" },
  { color: "#ec4899", name: "Hồng" },
  { color: "#64748b", name: "Xám" },
  { color: "#0f172a", name: "Đen" },
];

// --- HELPER COMPONENT ---
const ToolButton = ({ active, icon: Icon, label, onClick, color, disabled }: any) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`w-full flex flex-col items-center justify-center p-3 rounded-xl transition-all duration-200 group 
      ${disabled ? "opacity-30 cursor-not-allowed bg-slate-100" : active ? "bg-blue-600 text-white shadow-lg shadow-blue-500/30" : "bg-white text-gray-500 hover:bg-gray-50 hover:text-blue-600"}
    `}
  >
    {color ? (
      <div
        className={`w-6 h-6 rounded-full border-2 mb-1 ${active ? "border-white" : "border-gray-200"}`}
        style={{ background: color }}
      ></div>
    ) : (
      <Icon size={24} className="mb-1" />
    )}
    <span className="text-[10px] font-bold uppercase tracking-wide">
      {label}
    </span>
  </button>
);

// --- MAIN COMPONENT ---
interface StageDesignerProps {
  initialData?: StageData | null;
  onSave: (d: StageData) => void;
  onBack: () => void;
}

const StageDesigner: React.FC<StageDesignerProps> = ({ initialData, onSave, onBack }) => {
  const [stageName, setStageName] = useState(initialData?.name || "Sân Khấu Mới");
  const [view, setView] = useState({ x: 0, y: 0, scale: 1 });
  const [isPanning, setIsPanning] = useState(false);
  const [isRightZooming, setIsRightZooming] = useState(false);
  const [isSaving, setIsSaving] = useState(false); // State loading khi gọi API
  const lastMousePos = useRef<{ x: number; y: number } | null>(null);

  const [zones, setZones] = useState<Zone[]>(initialData?.zones || []);
  const [past, setPast] = useState<Zone[][]>([]);
  const [future, setFuture] = useState<Zone[][]>([]);

  // History Logic
  const recordHistory = useCallback(() => {
    setPast((prev) => [...prev, zones]);
    setFuture([]);
  }, [zones]);

  const handleUndo = useCallback(() => {
    if (past.length === 0) return;
    const previous = past[past.length - 1];
    const newPast = past.slice(0, past.length - 1);
    setFuture((prev) => [zones, ...prev]);
    setZones(previous);
    setPast(newPast);
  }, [zones, past]);

  const handleRedo = useCallback(() => {
    if (future.length === 0) return;
    const next = future[0];
    const newFuture = future.slice(1);
    setPast((prev) => [...prev, zones]);
    setZones(next);
    setFuture(newFuture);
  }, [zones, future]);

  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);
  const [activeTool, setActiveTool] = useState<"move" | "hand" | SeatType>("move");
  const [selectedColor, setSelectedColor] = useState<string>("#64748b");
  const [isPainting, setIsPainting] = useState(false);
  const [clipboard, setClipboard] = useState<Zone | null>(null);

  const draggingRef = useRef<any>(null);
  const resizingRef = useRef<any>(null);
  const [showModal, setShowModal] = useState(false);
  const [newZoneConfig, setNewZoneConfig] = useState({ name: "", rows: 5, cols: 8 });

  // Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (showModal) return;
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z" && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      }
      if (((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "y") || ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === "z")) {
        e.preventDefault();
        handleRedo();
      }
      if (e.key === "Delete" || e.key === "Backspace") {
        if (selectedZoneId) {
          recordHistory();
          deleteZone(selectedZoneId);
        }
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "c") {
        if (selectedZoneId) {
          const z = zones.find((z) => z.id === selectedZoneId);
          if (z) setClipboard(z);
        }
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "v") {
        if (clipboard) handlePasteZone(clipboard);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [zones, selectedZoneId, clipboard, showModal, activeTool, past, future, handleUndo, handleRedo, recordHistory]);

  // View Controls
  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const zoomSensitivity = 0.001;
      const delta = -e.deltaY * zoomSensitivity;
      const newScale = Math.min(Math.max(0.1, view.scale + delta), 5);
      setView((prev) => ({ ...prev, scale: newScale }));
    } else {
      setView((prev) => ({ ...prev, x: prev.x - e.deltaX, y: prev.y - e.deltaY }));
    }
  };

  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if ((e.button === 0 && activeTool === "hand") || e.button === 1) {
      setIsPanning(true);
      lastMousePos.current = { x: e.clientX, y: e.clientY };
    }
    if (e.button === 2) {
      setIsRightZooming(true);
      lastMousePos.current = { x: e.clientX, y: e.clientY };
    }
  };

  const updateZoom = (delta: number) => {
    setView((prev) => ({ ...prev, scale: Math.min(Math.max(0.1, prev.scale + delta), 5) }));
  };

  // Logic Functions
  const handlePasteZone = (temp: Zone) => {
    recordHistory();
    const newSeats = temp.seats.map((s) => ({ ...s, id: `${Date.now()}-${Math.random()}`, isOccupied: false }));
    const centerX = (-view.x + window.innerWidth / 2) / view.scale;
    const centerY = (-view.y + window.innerHeight / 2) / view.scale;
    const newZone: Zone = {
      ...temp,
      id: Date.now().toString(),
      name: `${temp.name} (Copy)`,
      x: centerX,
      y: centerY,
      seats: newSeats,
    };
    setZones((prev) => [...prev, newZone]);
    setSelectedZoneId(newZone.id);
  };

  const createZoneData = (name: string, rows: number, cols: number, isBox: boolean) => {
    const seatList: Seat[] = [];
    const r = isBox ? 1 : rows;
    const c = isBox ? 1 : cols;
    for (let i = 0; i < r; i++)
      for (let j = 0; j < c; j++)
        seatList.push({
          id: `${Date.now()}-${i}-${j}`,
          label: isBox ? name : `${i + 1}-${j + 1}`,
          type: isBox ? "custom" : "standard",
          row: i,
          col: j,
          customColor: isBox ? "#64748b" : undefined,
          isOccupied: false,
        });
    const baseSize = getGridBaseSize(rows, cols);
    const viewportCenterX = (-view.x + window.innerWidth / 2 - (isBox ? 150 : baseSize.w) / 2) / view.scale;
    const viewportCenterY = (-view.y + window.innerHeight / 2 - (isBox ? 150 : baseSize.h) / 2) / view.scale;
    return {
      id: Date.now().toString(),
      name,
      rows,
      cols,
      x: viewportCenterX,
      y: viewportCenterY,
      rotation: 0,
      width: isBox ? 150 : baseSize.w,
      height: isBox ? 150 : baseSize.h,
      seats: seatList,
      isBox,
    };
  };

  const handleCreateZone = () => {
    recordHistory();
    const newZone = createZoneData(newZoneConfig.name || `Zone ${zones.length + 1}`, newZoneConfig.rows, newZoneConfig.cols, false);
    setZones([...zones, newZone]);
    setSelectedZoneId(newZone.id);
    setActiveTool("move");
    setShowModal(false);
  };

  const handleAddBox = () => {
    recordHistory();
    const newBox = createZoneData(`KHỐI ${zones.length + 1}`, 1, 1, true);
    setZones([...zones, newBox]);
    setSelectedZoneId(newBox.id);
    setActiveTool("move");
  };

  const handleDimensionChange = (key: "rows" | "cols", value: string | number) => {
    const parsed = typeof value === "string" ? parseInt(value || "0", 10) : Number(value);
    const normalized = Math.max(1, isNaN(parsed) ? 1 : parsed);
    setNewZoneConfig((prev) => ({ ...prev, [key]: normalized }));
  };

  const handleZoneMouseDown = (e: React.MouseEvent, id: string, zone: Zone) => {
    if (activeTool !== "move") return;
    if (e.button === 2) return;
    e.stopPropagation();
    setSelectedZoneId(id);
    recordHistory();
    draggingRef.current = { id, startX: e.clientX, startY: e.clientY, initX: zone.x, initY: zone.y };
  };

  const handleResizeStart = (e: React.MouseEvent, zone: Zone, direction: any) => {
    e.stopPropagation();
    e.preventDefault();
    recordHistory();
    resizingRef.current = { id: zone.id, startX: e.clientX, startY: e.clientY, startW: zone.width, startH: zone.height, direction };
  };

  const handleGlobalMouseMove = (e: React.MouseEvent) => {
    if (isPanning && lastMousePos.current) {
      const dx = e.clientX - lastMousePos.current.x;
      const dy = e.clientY - lastMousePos.current.y;
      setView((prev) => ({ ...prev, x: prev.x + dx, y: prev.y + dy }));
      lastMousePos.current = { x: e.clientX, y: e.clientY };
      return;
    }
    if (isRightZooming && lastMousePos.current) {
      const dy = e.clientY - lastMousePos.current.y;
      const zoomFactor = -dy * 0.005;
      const newScale = Math.min(Math.max(0.1, view.scale + zoomFactor), 5);
      setView((prev) => ({ ...prev, scale: newScale }));
      lastMousePos.current = { x: e.clientX, y: e.clientY };
      return;
    }
    if (resizingRef.current) {
      const { id, startX, startY, startW, startH, direction } = resizingRef.current;
      const deltaX = (e.clientX - startX) / view.scale;
      const deltaY = (e.clientY - startY) / view.scale;
      setZones((prev) =>
        prev.map((z) => {
          if (z.id !== id) return z;
          let newW = startW + deltaX;
          let newH = startH + deltaY;
          if (direction === "right") newH = startH;
          if (direction === "bottom") newW = startW;
          return { ...z, width: Math.max(50, newW), height: Math.max(50, newH) };
        })
      );
      return;
    }
    if (draggingRef.current && activeTool === "move") {
      const { id, startX, startY, initX, initY } = draggingRef.current;
      const deltaX = (e.clientX - startX) / view.scale;
      const deltaY = (e.clientY - startY) / view.scale;
      setZones((prev) => prev.map((z) => (z.id === id ? { ...z, x: initX + deltaX, y: initY + deltaY } : z)));
    }
  };

  const handleSeatInteraction = (zoneId: string, seatIndex: number) => {
    if (activeTool === "move" || activeTool === "hand") return;
    setZones((prev) =>
      prev.map((z) => {
        if (z.id !== zoneId) return z;
        const newSeats = [...z.seats];
        const target = newSeats[seatIndex];
        let newType = activeTool as SeatType;
        if (activeTool === "custom") newType = "custom";
        if (z.isBox) {
          if (activeTool === "custom") newSeats[0] = { ...target, customColor: selectedColor };
        } else {
          if (activeTool === "custom")
            newSeats[seatIndex] = { ...target, type: "custom", customColor: selectedColor };
          else
            newSeats[seatIndex] = { ...target, type: newType, customColor: undefined };
        }
        return { ...z, seats: newSeats };
      })
    );
  };

  const deleteZone = (id: string) => {
    setZones((prev) => prev.filter((z) => z.id !== id));
    setSelectedZoneId(null);
  };

  // --- API INTEGRATION ---
  const handleSaveBtn = async () => {
    if (!stageName.trim()) {
      toast.error("Vui lòng nhập tên sân khấu");
      return;
    }

    setIsSaving(true); // Bắt đầu loading

    try {
      // 1. Chuẩn bị dữ liệu
      const finalData: StageData = {
        id: initialData?.id || crypto.randomUUID(),
        name: stageName,
        zones,
        lastModified: new Date().toISOString(),
      };

      // 2. Lấy Token từ LocalStorage (Sửa key nếu bạn dùng key khác)
      const token = localStorage.getItem("accessToken"); 
      
      if (!token) {
        toast.warn("Cảnh báo: Không tìm thấy Token đăng nhập");
      }

      const response = await fetch(`${axiosClient.defaults.baseURL}/stages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(finalData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Lỗi khi lưu dữ liệu");
      }

      // 4. Thành công
      const result = await response.json();
      toast.success("Đã lưu thiết kế thành công!");
      
      onSave(finalData); // Cập nhật state cha
      onBack(); // Quay lại trang danh sách
      
    } catch (error: any) {
      console.error("API Error:", error);
      toast.error(`Lưu thất bại: ${error.message}`);
    } finally {
      setIsSaving(false); // Kết thúc loading
    }
  };

  return (
    <div
      className="flex flex-col h-screen bg-slate-50 overflow-hidden font-sans text-slate-900"
      onMouseMove={handleGlobalMouseMove}
      onMouseUp={() => {
        draggingRef.current = null;
        resizingRef.current = null;
        setIsPainting(false);
        setIsPanning(false);
        setIsRightZooming(false);
        lastMousePos.current = null;
      }}
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* HEADER */}
      <div className="bg-white border-b border-slate-200 h-16 px-6 flex items-center justify-between shadow-sm z-50">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-slate-200 rounded-lg text-slate-500">
            <ArrowLeft size={20} />
          </button>
          <div className="h-6 w-px bg-slate-200"></div>
          <input
            value={stageName}
            onChange={(e) => setStageName(e.target.value)}
            className="text-lg font-bold text-slate-800 outline-none"
            placeholder="Tên sân khấu..."
          />
          <div className="flex gap-4 ml-4">
            <div className="flex flex-col items-center text-xs">
              <button
                onClick={handleUndo}
                disabled={past.length === 0}
                className={`p-2 rounded hover:bg-slate-100 ${past.length === 0 ? "text-slate-300" : "text-slate-600"}`}
                title="Hoàn tác (Ctrl+Z)"
              >
                <Undo size={18} />
              </button>
              <span className="text-slate-500">Hoàn tác</span>
            </div>
            <div className="flex flex-col items-center text-xs">
              <button
                onClick={handleRedo}
                disabled={future.length === 0}
                className={`p-2 rounded hover:bg-slate-100 ${future.length === 0 ? "text-slate-300" : "text-slate-600"}`}
                title="Làm lại (Ctrl+Y)"
              >
                <Redo size={18} />
              </button>
              <span className="text-slate-500">Làm lại</span>
            </div>
          </div>
        </div>
        <button
          onClick={handleSaveBtn}
          disabled={isSaving}
          className="bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white px-5 py-2.5 rounded-lg font-semibold flex items-center"
        >
          {isSaving ? <Loader2 className="animate-spin mr-2" size={18} /> : <Save size={18} className="mr-2" />} 
          {isSaving ? "Đang lưu..." : "Lưu Lại"}
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden relative">
        {/* TOOLBAR */}
        <div className="w-24 bg-white border-r border-slate-200 flex flex-col items-center py-4 gap-3 z-40 shadow-sm overflow-y-auto">
          <ToolButton active={activeTool === "move"} onClick={() => setActiveTool("move")} icon={MousePointer2} label="Chọn" />
          <ToolButton active={activeTool === "hand"} onClick={() => setActiveTool("hand")} icon={Hand} label="Di chuyển" />
          <div className="w-full h-px bg-slate-200 my-1"></div>
          <ToolButton active={false} onClick={handleAddBox} icon={Square} label="Khối" />
          <ToolButton active={false} onClick={() => setShowModal(true)} icon={Grid3X3} label="Lưới" />
          <div className="w-full h-px bg-slate-200 my-1"></div>
          <ToolButton active={activeTool === "standard"} onClick={() => setActiveTool("standard")} icon={Square} label="Thường" color="#3b82f6" />
          <ToolButton active={activeTool === "vip"} onClick={() => setActiveTool("vip")} icon={Square} label="VIP" color="#eab308" />
          <ToolButton active={activeTool === "blocked"} onClick={() => setActiveTool("blocked")} icon={XCircle} label="Xóa" />
          <div className="grid grid-cols-2 gap-2 mt-2">
            {PALETTE.map((p) => (
              <button
                key={p.color}
                onClick={() => { setSelectedColor(p.color); setActiveTool("custom"); }}
                className={`w-6 h-6 rounded-full border-2 ${activeTool === "custom" && selectedColor === p.color ? "border-black" : "border-transparent"}`}
                style={{ background: p.color }}
              />
            ))}
          </div>
        </div>

        {/* CANVAS */}
        <div
          className={`flex-1 relative bg-slate-100 overflow-hidden ${activeTool === "hand" || isPanning ? "cursor-grab active:cursor-grabbing" : isRightZooming ? "cursor-ns-resize" : "cursor-default"}`}
          onWheel={handleWheel}
          onMouseDown={handleCanvasMouseDown}
        >
          {/* Zoom Controls */}
          <div className="absolute bottom-6 left-6 z-[60] flex gap-1 bg-white p-1.5 rounded-lg shadow-xl border border-slate-200">
            <button onClick={() => updateZoom(-0.1)} className="p-2 hover:bg-slate-100 rounded text-slate-600"><ZoomOut size={18} /></button>
            <span className="w-12 flex items-center justify-center font-bold text-xs text-slate-700">{Math.round(view.scale * 100)}%</span>
            <button onClick={() => updateZoom(0.1)} className="p-2 hover:bg-slate-100 rounded text-slate-600"><ZoomIn size={18} /></button>
            <div className="w-px bg-slate-200 mx-1"></div>
            <button onClick={() => setView({ x: 0, y: 0, scale: 1 })} className="p-2 hover:bg-slate-100 rounded text-slate-600"><Maximize size={18} /></button>
          </div>

          <div
            style={{
              transform: `translate(${view.x}px, ${view.y}px) scale(${view.scale})`,
              transformOrigin: "0 0",
              width: "100%",
              height: "100%",
              transition: isPanning || isRightZooming ? "none" : "transform 0.1s ease-out",
            }}
            className="absolute inset-0"
          >
            <div className="absolute -top-[10000px] -left-[10000px] w-[20000px] h-[20000px] pointer-events-none opacity-20" style={{ backgroundImage: "radial-gradient(#94a3b8 1px, transparent 1px)", backgroundSize: "20px 20px" }}></div>

            {zones.map((zone) => {
              const baseSize = getGridBaseSize(zone.rows, zone.cols);
              const scaleX = zone.isBox ? 1 : zone.width / baseSize.w;
              const scaleY = zone.isBox ? 1 : zone.height / baseSize.h;
              const isSelected = selectedZoneId === zone.id && activeTool === "move";

              return (
                <div
                  key={zone.id}
                  onMouseDown={(e) => handleZoneMouseDown(e, zone.id, zone)}
                  style={{
                    position: "absolute", left: zone.x, top: zone.y,
                    width: zone.width, height: zone.height,
                    transform: `rotate(${zone.rotation}deg)`,
                    zIndex: isSelected ? 20 : 10,
                  }}
                  className={`absolute group select-none ${activeTool === "move" ? "cursor-move" : ""}`}
                >
                  {isSelected && (
                    <div className="absolute -inset-1 border-2 border-blue-500 rounded-lg pointer-events-none z-0">
                      {/* Resize Handles - Simplified for brevity */}
                      <div onMouseDown={(e) => handleResizeStart(e, zone, "right")} className="absolute -right-2 top-1/2 -translate-y-1/2 w-4 h-8 bg-white border border-slate-300 cursor-ew-resize pointer-events-auto shadow-sm rounded-full" style={{ transform: `scale(${1 / view.scale})` }} />
                      <div onMouseDown={(e) => handleResizeStart(e, zone, "bottom")} className="absolute -bottom-2 left-1/2 -translate-x-1/2 h-4 w-8 bg-white border border-slate-300 cursor-ns-resize pointer-events-auto shadow-sm rounded-full" style={{ transform: `scale(${1 / view.scale})` }} />
                      <div onMouseDown={(e) => handleResizeStart(e, zone, "corner")} className="absolute -bottom-2 -right-2 w-5 h-5 bg-white border-2 border-blue-500 cursor-nwse-resize pointer-events-auto shadow-md rounded-full" style={{ transform: `scale(${1 / view.scale})` }} />
                      
                      {/* Context Menu */}
                      <div className="absolute -top-16 right-0 flex bg-slate-900 text-white rounded p-1 pointer-events-auto gap-1 shadow-lg cursor-default" style={{ transform: `scale(${1 / view.scale})`, transformOrigin: "bottom right" }} onMouseDown={(e) => e.stopPropagation()}>
                        <button className="p-1 hover:bg-slate-700 rounded cursor-pointer" onClick={(e) => { e.stopPropagation(); setClipboard(zone); }} title="Copy"><Copy size={14} /></button>
                        <button className="p-1 hover:bg-slate-700 rounded cursor-pointer" onClick={(e) => { e.stopPropagation(); handlePasteZone(zone); }} title="Paste"><Clipboard size={14} /></button>
                        <div className="w-px bg-slate-700"></div>
                        <button className="p-1 hover:bg-slate-700 rounded cursor-pointer" onClick={(e) => { e.stopPropagation(); recordHistory(); setZones(zones.map((z) => z.id === zone.id ? { ...z, rotation: z.rotation + 45 } : z)); }} title="Xoay"><RotateCw size={14} /></button>
                        <button className="p-1 hover:bg-red-600 rounded text-red-200 hover:text-white cursor-pointer" onClick={(e) => { e.stopPropagation(); recordHistory(); deleteZone(zone.id); }} title="Xóa"><Trash2 size={14} /></button>
                      </div>
                    </div>
                  )}
                  {/* Zone Name */}
                  <div className="absolute -top-7 left-0 w-full flex justify-center z-50">
                    <span className="bg-white/90 px-2 py-0.5 rounded text-xs font-bold shadow-sm border border-slate-200 cursor-text pointer-events-auto hover:bg-blue-50 hover:text-blue-600 transition-colors"
                      style={{ transform: `scale(${Math.max(1, 1 / view.scale)})` }}
                      onMouseDown={(e) => e.stopPropagation()}
                      onDoubleClick={(e) => {
                        e.stopPropagation();
                        const newName = prompt("Nhập tên mới cho khu vực:", zone.name);
                        if (newName !== null && newName.trim() !== "") {
                          recordHistory();
                          setZones(zones.map((z) => (z.id === zone.id ? { ...z, name: newName } : z)));
                        }
                      }}
                    >
                      {zone.name}
                    </span>
                  </div>
                  {/* Zone Content */}
                  <div className="w-full h-full overflow-hidden rounded-lg"
                    style={zone.isBox ? {} : { transform: `scale(${scaleX}, ${scaleY})`, transformOrigin: "top left", width: baseSize.w, height: baseSize.h }}>
                    {zone.isBox ? (
                      <div
                        onMouseDown={(e) => { if (activeTool === "move" || activeTool === "hand") return; if (e.button === 2) return; e.stopPropagation(); recordHistory(); setIsPainting(true); handleSeatInteraction(zone.id, 0); }}
                        onDoubleClick={(e) => { e.stopPropagation(); if (activeTool === "hand") return; const n = prompt("Nhập tên hiển thị trong Khối:", zone.seats[0].label); if (n !== null) { recordHistory(); setZones(zones.map((z) => z.id === zone.id ? { ...z, seats: [{ ...z.seats[0], label: n }] } : z)); } }}
                        style={{ backgroundColor: zone.seats[0].customColor || "#64748b" }}
                        className={`w-full h-full flex items-center justify-center text-white font-bold text-center p-2 ${activeTool === "move" ? "cursor-move" : activeTool === "hand" ? "" : "cursor-crosshair"}`}
                      >
                        <span className="text-xl">{zone.seats[0].label}</span>
                      </div>
                    ) : (
                      <div className="bg-slate-900/5 p-3 rounded-xl" style={{ display: "grid", gridTemplateColumns: `repeat(${zone.cols}, ${SEAT_SIZE}px)`, gap: GAP, width: "fit-content" }}>
                        {zone.seats.map((seat, index) => {
                          let bgClass = seat.type === "blocked" ? "bg-transparent text-transparent border-dashed border-2 border-slate-300" : seat.type === "vip" ? "bg-amber-400 border-b-4 border-amber-600" : seat.type === "standard" ? "bg-blue-500 border-b-4 border-blue-700" : seat.type === "custom" && seat.customColor ? `border-b-4 border-black/20 text-white` : "bg-slate-400 border-b-4 border-slate-500";
                          return (
                            <div key={seat.id} style={{ height: SEAT_SIZE, backgroundColor: seat.customColor }}
                              onMouseDown={(e) => { if (activeTool === "move" || activeTool === "hand") return; if (e.button === 2) return; e.stopPropagation(); recordHistory(); setIsPainting(true); handleSeatInteraction(zone.id, index); }}
                              onMouseEnter={() => isPainting && handleSeatInteraction(zone.id, index)}
                              className={`rounded-t-lg rounded-b-md flex items-center justify-center text-[11px] font-bold text-white shadow-sm transition-all hover:-translate-y-1 ${bgClass} ${activeTool === "move" ? "cursor-move" : activeTool === "hand" ? "" : "cursor-crosshair"}`}
                            >
                              {seat.type !== "blocked" && seat.label}
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
      </div>
      
      {/* ADD ZONE MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center">
          <div className="bg-white p-6 rounded-xl w-80">
            <h3 className="font-bold mb-4">Thêm Lưới</h3>
            <input className="w-full border p-2 rounded mb-2" placeholder="Tên" value={newZoneConfig.name} onChange={(e) => setNewZoneConfig({ ...newZoneConfig, name: e.target.value })} />
            <div className="flex gap-2">
              <input type="number" min="1" className="w-1/2 border p-2" value={newZoneConfig.rows} onChange={(e) => handleDimensionChange("rows", e.target.value)} />
              <input type="number" min="1" className="w-1/2 border p-2" value={newZoneConfig.cols} onChange={(e) => handleDimensionChange("cols", e.target.value)} />
            </div>
            <div className="flex justify-end mt-4 gap-2">
              <button onClick={() => setShowModal(false)}>Hủy</button>
              <button onClick={handleCreateZone} className="bg-blue-600 text-white px-4 py-2 rounded">Tạo</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StageDesigner;

// import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
// import {
//   MousePointer2, Hand, Square, Eraser, Move,
//   ZoomIn, ZoomOut, Maximize, Save, ArrowLeft,
//   Undo, Redo, Layers, Grid3X3, DollarSign, Tag, Eye, EyeOff
// } from "lucide-react";
// import { toast } from "react-toastify";

// // --- 1. TYPES & CONSTANTS ---

// type CellType = "empty" | "seat" | "aisle" | "stage";
// type SeatType = "standard" | "vip" | "disabled";
// type SeatStatus = "available" | "booked" | "locked";

// interface Zone {
//   id: string;
//   name: string;
//   color: string;
//   price: number;
// }

// interface CellData {
//   id: string; // key format: "row-col"
//   row: number;
//   col: number;
//   type: CellType;
//   seatType?: SeatType;
//   label?: string; // e.g. "A1"
//   zoneId?: string;
//   status?: SeatStatus;
// }

// interface StageData {
//   id: string;
//   name: string;
//   rows: number;
//   cols: number;
//   cells: Record<string, CellData>; // Dictionary for O(1) access
//   zones: Zone[];
// }

// const CELL_SIZE = 40;
// const GAP = 4;
// const DEFAULT_ROWS = 20;
// const DEFAULT_COLS = 30;

// const DEFAULT_ZONES: Zone[] = [
//   { id: "z1", name: "Standard", color: "#3b82f6", price: 100000 },
//   { id: "z2", name: "VIP", color: "#eab308", price: 250000 },
//   { id: "z3", name: "Sweetbox", color: "#ec4899", price: 300000 },
// ];

// // --- 2. SUB-COMPONENTS ---

// const ToolBtn = ({ active, icon: Icon, label, onClick, shortcut }: any) => (
//   <button
//     onClick={onClick}
//     title={shortcut}
//     className={`w-full p-3 rounded-xl flex flex-col items-center justify-center transition-all ${
//       active 
//         ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200" 
//         : "bg-white text-slate-500 hover:bg-slate-50 hover:text-indigo-600"
//     }`}
//   >
//     <Icon size={20} className="mb-1" />
//     <span className="text-[10px] font-bold uppercase">{label}</span>
//   </button>
// );

// // --- 3. MAIN COMPONENT ---

// const GridStageDesigner: React.FC<{
//   initialData?: StageData | null;
//   onSave: (data: StageData) => void;
//   onBack: () => void;
// }> = ({ initialData, onSave, onBack }) => {
//   // --- STATE ---
//   const [config, setConfig] = useState({
//     name: initialData?.name || "Sân Khấu Lưới",
//     rows: initialData?.rows || DEFAULT_ROWS,
//     cols: initialData?.cols || DEFAULT_COLS,
//   });

//   const [zones, setZones] = useState<Zone[]>(initialData?.zones || DEFAULT_ZONES);
  
//   // Grid Data: stored as a Record "row-col" -> CellData
//   const [cells, setCells] = useState<Record<string, CellData>>(initialData?.cells || {});

//   // Viewport State
//   const [view, setView] = useState({ x: 0, y: 0, scale: 1 });
//   const [isPreviewMode, setIsPreviewMode] = useState(false);

//   // Interaction State
//   const [activeTool, setActiveTool] = useState<"select" | "hand" | "seat" | "aisle" | "eraser">("select");
//   const [selectedCells, setSelectedCells] = useState<string[]>([]); // Array of cell IDs
//   const [isDragging, setIsDragging] = useState(false);
  
//   // Refs
//   const canvasRef = useRef<HTMLDivElement>(null);
//   const lastMousePos = useRef<{ x: number, y: number } | null>(null);

//   // --- HISTORY (UNDO/REDO) ---
//   const [history, setHistory] = useState<Record<string, CellData>[]>([]);
//   const [future, setFuture] = useState<Record<string, CellData>[]>([]);

//   const saveToHistory = () => {
//     setHistory(prev => [...prev.slice(-20), cells]); // Keep last 20 steps
//     setFuture([]);
//   };

//   const handleUndo = () => {
//     if (history.length === 0) return;
//     const previous = history[history.length - 1];
//     setFuture(prev => [cells, ...prev]);
//     setCells(previous);
//     setHistory(prev => prev.slice(0, -1));
//   };

//   const handleRedo = () => {
//     if (future.length === 0) return;
//     const next = future[0];
//     setHistory(prev => [...prev, cells]);
//     setCells(next);
//     setFuture(prev => prev.slice(1));
//   };

//   // --- VIEWPORT CONTROLS ---
//   const handleWheel = (e: React.WheelEvent) => {
//     if (e.ctrlKey) {
//       e.preventDefault();
//       const delta = -e.deltaY * 0.001;
//       setView(prev => ({ ...prev, scale: Math.min(Math.max(0.2, prev.scale + delta), 3) }));
//     } else {
//       if(activeTool === 'hand' || e.shiftKey) {
//           setView(prev => ({ ...prev, x: prev.x - e.deltaX, y: prev.y - e.deltaY }));
//       }
//     }
//   };

//   const startPan = (e: React.MouseEvent) => {
//     if (activeTool === "hand" || e.button === 1) {
//       setIsDragging(true);
//       lastMousePos.current = { x: e.clientX, y: e.clientY };
//     }
//   };

//   const movePan = (e: React.MouseEvent) => {
//     if (isDragging && lastMousePos.current) {
//       const dx = e.clientX - lastMousePos.current.x;
//       const dy = e.clientY - lastMousePos.current.y;
      
//       if (activeTool === "hand") {
//         setView(prev => ({ ...prev, x: prev.x + dx, y: prev.y + dy }));
//         lastMousePos.current = { x: e.clientX, y: e.clientY };
//       }
//     }
//   };

//   const endPan = () => {
//     setIsDragging(false);
//     lastMousePos.current = null;
//   };

//   // --- GRID INTERACTION ---
//   const handleCellClick = (r: number, c: number, e: React.MouseEvent) => {
//     if (activeTool === "hand" || isPreviewMode) return;
    
//     const id = `${r}-${c}`;
    
//     // 1. SELECT TOOL
//     if (activeTool === "select") {
//       if (e.shiftKey) {
//         // Multi-select toggle
//         setSelectedCells(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
//       } else {
//         // Single select
//         setSelectedCells([id]);
//       }
//       return;
//     }

//     // 2. PAINT TOOLS (Seat, Aisle, Eraser)
//     saveToHistory();
//     const newCells = { ...cells };

//     if (activeTool === "eraser") {
//       delete newCells[id];
//     } else {
//       const type = activeTool === "aisle" ? "aisle" : "seat";
//       const existing = newCells[id];
      
//       newCells[id] = {
//         id, row: r, col: c,
//         type,
//         seatType: type === "seat" ? "standard" : undefined,
//         zoneId: type === "seat" ? (existing?.zoneId || zones[0].id) : undefined,
//         label: type === "seat" ? (existing?.label || `${String.fromCharCode(65 + r)}${c + 1}`) : undefined,
//         status: "available",
//       };
//     }
//     setCells(newCells);
//   };

//   // Support "Painting" by dragging (Simple version)
//   const handleCellEnter = (e: React.MouseEvent, r: number, c: number) => {
//     if (e.buttons !== 1 || activeTool === "select" || activeTool === "hand") return;
//     handleCellClick(r, c, e); // Re-use click logic for painting
//   };

//   // --- BATCH UPDATES ---
//   const updateSelectedCells = (key: keyof CellData, value: any) => {
//     saveToHistory();
//     setCells(prev => {
//       const next = { ...prev };
//       selectedCells.forEach(id => {
//         if (next[id]) {
//           next[id] = { ...next[id], [key]: value };
//         }
//       });
//       return next;
//     });
//   };

//   const fillRow = () => {
//       if(selectedCells.length === 0) return;
//       saveToHistory();
//       const firstId = selectedCells[0];
//       const targetRow = cells[firstId]?.row;
//       if (targetRow === undefined) return;

//       const newCells = {...cells};
//       for(let c = 0; c < config.cols; c++) {
//           const id = `${targetRow}-${c}`;
//           if(!newCells[id]) {
//              newCells[id] = {
//                  id, row: targetRow, col: c, type: 'seat',
//                  seatType: 'standard', zoneId: zones[0].id,
//                  label: `${String.fromCharCode(65 + targetRow)}${c + 1}`,
//                  status: 'available'
//              };
//           }
//       }
//       setCells(newCells);
//       toast.success(`Đã lấp đầy hàng ${targetRow + 1}`);
//   };

//   // --- RENDER HELPERS ---
//   const getCellColor = (id: string, r: number, c: number) => {
//     const cell = cells[id];
//     if (!cell) return "transparent";
//     if (cell.type === "aisle") return "#e2e8f0"; // slate-200
//     if (cell.type === "seat") {
//       const zone = zones.find(z => z.id === cell.zoneId);
//       return zone ? zone.color : "#94a3b8";
//     }
//     return "transparent";
//   };

//   const getCellContent = (id: string) => {
//       const cell = cells[id];
//       if(!cell) return null;
//       if(cell.type === 'seat') return <span className="text-[10px] font-bold text-white drop-shadow-md select-none">{cell.label}</span>;
//       return null;
//   }

//   // --- UI RENDER ---
//   return (
//     <div className="flex flex-col h-screen bg-slate-100 overflow-hidden font-sans text-slate-800">
      
//       {/* 1. HEADER */}
//       <div className="h-16 bg-white border-b flex items-center justify-between px-6 z-50 shadow-sm">
//         <div className="flex items-center gap-4">
//           <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-full"><ArrowLeft size={20}/></button>
//           <div>
//             <input 
//               value={config.name} 
//               onChange={e => setConfig({...config, name: e.target.value})}
//               className="font-bold text-xl outline-none bg-transparent placeholder-slate-400"
//               placeholder="Tên sơ đồ..."
//             />
//             <div className="text-xs text-slate-500">Grid: {config.rows} x {config.cols}</div>
//           </div>
//         </div>

//         <div className="flex items-center gap-2">
//             <button onClick={handleUndo} disabled={history.length===0} className="p-2 hover:bg-slate-100 rounded disabled:opacity-30"><Undo size={18}/></button>
//             <button onClick={handleRedo} disabled={future.length===0} className="p-2 hover:bg-slate-100 rounded disabled:opacity-30"><Redo size={18}/></button>
//             <div className="h-6 w-px bg-slate-300 mx-2"></div>
//             <button 
//                 onClick={() => setIsPreviewMode(!isPreviewMode)}
//                 className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${isPreviewMode ? 'bg-indigo-100 text-indigo-700' : 'hover:bg-slate-100'}`}
//             >
//                 {isPreviewMode ? <Eye size={18}/> : <EyeOff size={18}/>}
//                 <span>Preview</span>
//             </button>
//             <button 
//                 onClick={() => onSave({ id: initialData?.id || Date.now().toString(), ...config, cells, zones })}
//                 className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-bold flex items-center gap-2 shadow-lg shadow-indigo-200"
//             >
//                 <Save size={18} /> Lưu Layout
//             </button>
//         </div>
//       </div>

//       <div className="flex flex-1 overflow-hidden relative">
        
//         {/* 2. TOOLBAR */}
//         {!isPreviewMode && (
//           <div className="w-20 bg-white border-r flex flex-col items-center py-4 gap-3 z-40 shadow-sm">
//             <ToolBtn active={activeTool === "select"} onClick={() => setActiveTool("select")} icon={MousePointer2} label="Chọn" shortcut="V" />
//             <ToolBtn active={activeTool === "hand"} onClick={() => setActiveTool("hand")} icon={Hand} label="Pan" shortcut="H" />
//             <div className="w-10 h-px bg-slate-200 my-1" />
//             <ToolBtn active={activeTool === "seat"} onClick={() => setActiveTool("seat")} icon={Square} label="Ghế" shortcut="S" />
//             <ToolBtn active={activeTool === "aisle"} onClick={() => setActiveTool("aisle")} icon={Grid3X3} label="Lối đi" shortcut="A" />
//             <ToolBtn active={activeTool === "eraser"} onClick={() => setActiveTool("eraser")} icon={Eraser} label="Xóa" shortcut="E" />
//           </div>
//         )}

//         {/* 3. CANVAS AREA */}
//         <div 
//             className={`flex-1 relative bg-slate-200 overflow-hidden ${activeTool === 'hand' ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'}`}
//             onWheel={handleWheel}
//             onMouseDown={startPan}
//             onMouseMove={movePan}
//             onMouseUp={endPan}
//             onMouseLeave={endPan}
//             ref={canvasRef}
//         >
//             {/* Grid Background Pattern */}
//             <div 
//                 className="absolute inset-0 pointer-events-none opacity-10"
//                 style={{
//                     backgroundImage: `linear-gradient(#94a3b8 1px, transparent 1px), linear-gradient(90deg, #94a3b8 1px, transparent 1px)`,
//                     backgroundSize: `${CELL_SIZE * view.scale}px ${CELL_SIZE * view.scale}px`,
//                     backgroundPosition: `${view.x}px ${view.y}px`
//                 }}
//             />

//             {/* Transform Container */}
//             <div 
//                 style={{ 
//                     transform: `translate(${view.x}px, ${view.y}px) scale(${view.scale})`,
//                     transformOrigin: "0 0",
//                     width: config.cols * (CELL_SIZE + GAP),
//                     height: config.rows * (CELL_SIZE + GAP) + 100, // +100 for stage area
//                 }}
//                 className="relative mx-auto mt-10 transition-transform duration-75"
//             >
//                 {/* STAGE AREA (Visual Block) */}
//                 <div className="w-full h-20 bg-slate-800 rounded-b-[50%] mb-10 flex items-center justify-center shadow-xl text-slate-200 font-black text-2xl tracking-[0.5em] select-none uppercase">
//                     Sân Khấu
//                 </div>

//                 {/* CELLS LAYER */}
//                 <div 
//                     style={{
//                         display: 'grid',
//                         gridTemplateColumns: `repeat(${config.cols}, ${CELL_SIZE}px)`,
//                         gap: `${GAP}px`,
//                         padding: '0 20px'
//                     }}
//                 >
//                     {Array.from({ length: config.rows * config.cols }).map((_, idx) => {
//                         const r = Math.floor(idx / config.cols);
//                         const c = idx % config.cols;
//                         const id = `${r}-${c}`;
//                         const cellData = cells[id];
//                         const isSelected = selectedCells.includes(id);

//                         return (
//                             <div
//                                 key={id}
//                                 onMouseDown={(e) => { e.stopPropagation(); handleCellClick(r, c, e); }}
//                                 onMouseEnter={(e) => handleCellEnter(e, r, c)}
//                                 className={`
//                                     rounded-md transition-all flex items-center justify-center border
//                                     ${!cellData ? 'border-slate-200 hover:bg-slate-100' : 'border-black/10'}
//                                     ${isSelected ? 'ring-2 ring-indigo-500 ring-offset-1 z-10' : ''}
//                                     ${cellData?.type === 'seat' ? 'shadow-sm hover:-translate-y-1' : ''}
//                                 `}
//                                 style={{
//                                     width: CELL_SIZE,
//                                     height: CELL_SIZE,
//                                     backgroundColor: getCellColor(id, r, c),
//                                 }}
//                             >
//                                 {getCellContent(id)}
//                             </div>
//                         );
//                     })}
//                 </div>
//             </div>

//             {/* Zoom Controls */}
//             <div className="absolute bottom-6 left-6 flex gap-1 bg-white p-1 rounded-lg shadow-xl border z-50">
//                 <button onClick={() => setView(prev => ({...prev, scale: prev.scale - 0.1}))} className="p-2 hover:bg-slate-100 rounded"><ZoomOut size={16}/></button>
//                 <span className="px-2 flex items-center text-xs font-bold w-12 justify-center">{Math.round(view.scale * 100)}%</span>
//                 <button onClick={() => setView(prev => ({...prev, scale: prev.scale + 0.1}))} className="p-2 hover:bg-slate-100 rounded"><ZoomIn size={16}/></button>
//                 <button onClick={() => setView({x:0, y:0, scale: 1})} className="p-2 hover:bg-slate-100 rounded border-l ml-1"><Maximize size={16}/></button>
//             </div>
//         </div>

//         {/* 4. PROPERTIES PANEL (Right Sidebar) */}
//         {!isPreviewMode && (
//           <div className="w-80 bg-white border-l z-40 flex flex-col overflow-y-auto shadow-xl">
             
//              {/* Section: Selected Info */}
//              <div className="p-5 border-b bg-slate-50">
//                 <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Đang chọn</h3>
//                 {selectedCells.length === 0 ? (
//                     <div className="text-sm text-slate-500 italic">Chưa chọn đối tượng nào</div>
//                 ) : (
//                     <div>
//                         <div className="text-2xl font-black text-indigo-600 mb-1">{selectedCells.length} <span className="text-base font-normal text-slate-800">ô</span></div>
//                         <div className="text-xs text-slate-500 mb-4">
//                             {selectedCells.length === 1 ? `ID: ${selectedCells[0]}` : "Đang chọn nhiều"}
//                         </div>

//                         {/* Actions */}
//                         {selectedCells.some(id => cells[id]?.type === 'seat') && (
//                              <div className="space-y-4">
//                                 <div>
//                                     <label className="text-xs font-bold block mb-1">Gán Zone (Khu vực)</label>
//                                     <div className="grid grid-cols-2 gap-2">
//                                         {zones.map(z => (
//                                             <button 
//                                                 key={z.id}
//                                                 onClick={() => updateSelectedCells('zoneId', z.id)}
//                                                 className="flex items-center gap-2 p-2 border rounded hover:bg-slate-50 text-xs text-left"
//                                             >
//                                                 <div className="w-3 h-3 rounded-full" style={{background: z.color}}></div>
//                                                 <div className="truncate font-medium">{z.name}</div>
//                                             </button>
//                                         ))}
//                                     </div>
//                                 </div>
                                
//                                 <div className="grid grid-cols-2 gap-2">
//                                     <div>
//                                         <label className="text-xs font-bold block mb-1">Nhãn (Label)</label>
//                                         <input 
//                                             disabled={selectedCells.length > 1}
//                                             value={selectedCells.length === 1 ? cells[selectedCells[0]]?.label || "" : "..."}
//                                             onChange={(e) => updateSelectedCells('label', e.target.value)}
//                                             className="w-full border p-2 rounded text-sm disabled:bg-slate-100"
//                                         />
//                                     </div>
//                                     <div>
//                                         <label className="text-xs font-bold block mb-1">Trạng thái</label>
//                                         <select 
//                                             onChange={(e) => updateSelectedCells('status', e.target.value)}
//                                             className="w-full border p-2 rounded text-sm"
//                                         >
//                                             <option value="available">Mở bán</option>
//                                             <option value="booked">Đã đặt</option>
//                                             <option value="locked">Khóa</option>
//                                         </select>
//                                     </div>
//                                 </div>

//                                 <button onClick={fillRow} className="w-full py-2 bg-slate-200 text-slate-700 font-bold rounded hover:bg-slate-300 text-sm">
//                                     Lấp đầy hàng ngang
//                                 </button>
//                              </div>
//                         )}
//                     </div>
//                 )}
//              </div>

//              {/* Section: Zone Management */}
//              <div className="p-5 flex-1">
//                 <div className="flex justify-between items-center mb-4">
//                      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Quản lý Zones</h3>
//                      <button 
//                         onClick={() => {
//                             const newId = `z${Date.now()}`;
//                             setZones([...zones, {id: newId, name: "New Zone", color: "#000000", price: 0}]);
//                         }}
//                         className="text-xs bg-slate-900 text-white px-2 py-1 rounded"
//                      >+ Thêm</button>
//                 </div>
                
//                 <div className="space-y-3">
//                     {zones.map((z, idx) => (
//                         <div key={z.id} className="p-3 border rounded-lg bg-white shadow-sm group">
//                             <div className="flex gap-2 mb-2">
//                                 <input 
//                                     type="color" 
//                                     value={z.color}
//                                     onChange={(e) => {
//                                         const newZones = [...zones];
//                                         newZones[idx].color = e.target.value;
//                                         setZones(newZones);
//                                     }}
//                                     className="w-8 h-8 rounded cursor-pointer border-0 p-0 overflow-hidden"
//                                 />
//                                 <input 
//                                     className="flex-1 border-b border-transparent focus:border-indigo-500 outline-none font-bold text-sm"
//                                     value={z.name}
//                                     onChange={(e) => {
//                                         const newZones = [...zones];
//                                         newZones[idx].name = e.target.value;
//                                         setZones(newZones);
//                                     }}
//                                 />
//                             </div>
//                             <div className="flex items-center gap-2 text-slate-500 text-xs">
//                                 <DollarSign size={12}/>
//                                 <input 
//                                     type="number"
//                                     className="w-20 border-b border-slate-200 outline-none"
//                                     value={z.price}
//                                     onChange={(e) => {
//                                         const newZones = [...zones];
//                                         newZones[idx].price = Number(e.target.value);
//                                         setZones(newZones);
//                                     }}
//                                 /> VNĐ
//                             </div>
//                         </div>
//                     ))}
//                 </div>
//              </div>

//              {/* Section: Grid Config */}
//              <div className="p-5 border-t bg-slate-50">
//                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Cấu trúc Lưới</h3>
//                  <div className="grid grid-cols-2 gap-4">
//                      <div>
//                          <label className="text-[10px] uppercase font-bold text-slate-500">Hàng (Rows)</label>
//                          <input type="number" className="w-full border p-1 rounded" value={config.rows} onChange={(e) => setConfig({...config, rows: Number(e.target.value)})} />
//                      </div>
//                      <div>
//                          <label className="text-[10px] uppercase font-bold text-slate-500">Cột (Cols)</label>
//                          <input type="number" className="w-full border p-1 rounded" value={config.cols} onChange={(e) => setConfig({...config, cols: Number(e.target.value)})} />
//                      </div>
//                  </div>
//                  <p className="text-[10px] text-red-500 mt-2">* Thay đổi kích thước có thể làm mất dữ liệu ngoài vùng lưới.</p>
//              </div>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };

// export default GridStageDesigner;