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
  Loader2,
  Monitor,
  Users,
  PencilRuler,
  UserCheck,
  Check
} from "lucide-react";
import { toast } from "react-toastify";
import { SeatType, Zone, StageData, Seat } from "@/type/Stage.type";
import axiosClient from "@/axiosclient";
import { colorEnum, PALETTE } from "./constant";

// --- CONFIG API ---
const SEAT_SIZE = 40;
const GAP = 6;
const getGridBaseSize = (rows: number, cols: number) => ({
  w: cols * SEAT_SIZE + (cols - 1) * GAP + 24,
  h: rows * SEAT_SIZE + (rows - 1) * GAP + 24,
});



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
  const [isSaving, setIsSaving] = useState(false);
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
  const [selectedColor, setSelectedColor] = useState<string>(colorEnum.gray);
  const [isPainting, setIsPainting] = useState(false);
  const [clipboard, setClipboard] = useState<Zone | null>(null);

  const draggingRef = useRef<any>(null);
  const resizingRef = useRef<any>(null);
  const [showModal, setShowModal] = useState(false);
  const [newZoneConfig, setNewZoneConfig] = useState({ name: "", rows: 5, cols: 8 });

  // --- DRAFT PERSISTENCE LOGIC ---
  const draftKey = `stage_draft_${initialData?.id || "new"}`;

  // 1. Recover Draft on Mount
  useEffect(() => {
    const savedDraft = localStorage.getItem(draftKey);
    if (savedDraft) {
      try {
        const { zones: dZones, name: dName } = JSON.parse(savedDraft);
        const confirmRecover = window.confirm("Bạn có một bản nháp chưa lưu từ lần trước. Bạn có muốn phục hồi không?");
        if (confirmRecover) {
          setZones(dZones);
          setStageName(dName);
          toast.info("Đã khôi phục bản nháp!");
        } else {
          localStorage.removeItem(draftKey);
        }
      } catch (e) {
        console.error("Lỗi khi đọc bản nháp:", e);
      }
    }
  }, []); // Run once on mount

  // 2. Auto-Save Draft to LocalStorage
  useEffect(() => {
    // Không lưu nháp nếu zones trống (trường hợp mới khởi tạo hoặc chưa có dữ liệu)
    if (zones.length === 0 && !initialData) return;

    const timer = setTimeout(() => {
      const draftData = {
        zones,
        name: stageName,
        updatedAt: new Date().toISOString()
      };
      localStorage.setItem(draftKey, JSON.stringify(draftData));
    }, 1000); // Lưu sau 1 giây ngừng thao tác

    return () => clearTimeout(timer);
  }, [zones, stageName, draftKey]);

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

    for (let i = 0; i < r; i++) {
      for (let j = 0; j < c; j++) {
        let seatLabel = "";

        if (isBox) {
          seatLabel = name;
        } else {
          const isHorizontal = cols > rows;

          if (isHorizontal) {
            // --- HÀNG NGANG: Đánh số kiểu ZIC-ZĂC (SNAKE) ---
            const rowOffset = i * cols;
            if (i % 2 === 0) {
              // Hàng chẵn: Trái sang Phải (1 -> C)
              seatLabel = `${rowOffset + j + 1}`;
            } else {
              // Hàng lẻ: Phải sang Trái (2C -> C+1)
              seatLabel = `${rowOffset + (cols - j)}`;
            }
          } else {
            // --- HÀNG DỌC: Đánh số THẲNG CỘT từ PHẢI -> TRÁI, DƯỚI -> TRÊN ---
            const reverseCol = cols - 1 - j;
            const reverseRow = rows - 1 - i;
            seatLabel = `${reverseCol * rows + reverseRow + 1}`;
          }
        }

        seatList.push({
          id: `${Date.now()}-${i}-${j}`,
          label: seatLabel,
          type: isBox ? "custom" : "standard",
          status: "AVAILABLE",
          row: i,
          col: j,
          customColor: isBox ? colorEnum.gray : undefined,
          isOccupied: false,
        });
      }
    }

    const baseSize = getGridBaseSize(rows, cols);
    // Tính toán tọa độ xuất hiện ở giữa màn hình view hiện tại
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
    const newZone = createZoneData(newZoneConfig.name || `Khu ${zones.length + 1}`, newZoneConfig.rows, newZoneConfig.cols, false);
    setZones([...zones, newZone]);
    setSelectedZoneId(newZone.id);
    setActiveTool("move");
    setShowModal(false);
  };

  const handleAddBox = () => {
    recordHistory();
    const newBox = createZoneData(`KHỐI`, 1, 1, true); // Bỏ số đuôi cho đỡ rối
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

  const handleSaveBtn = async () => {
    if (!stageName.trim()) {
      toast.error("Vui lòng nhập tên sân khấu");
      return;
    }

    setIsSaving(true);

    try {
      const finalData: StageData = {
        id: initialData?.id || crypto.randomUUID(),
        name: stageName,
        zones,
        lastModified: new Date().toISOString(),
      };

      const response: any = await axiosClient.post("/stages", finalData);

      if (response.success === false) {
        throw new Error(response.message || "Lỗi khi lưu dữ liệu");
      }

      toast.success("Đã lưu thiết kế thành công!");
      localStorage.removeItem(draftKey);

      onSave(finalData);
      onBack();

    } catch (error: any) {
      console.error("API Error:", error);
      toast.error(`Lưu thất bại: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleBackWithAutoSave = () => {
    // Nếu có sự thay đổi (kiểm tra past.length hoặc logic khác) 
    // Ở đây ta cứ lưu cho chắc chắn theo yêu cầu người dùng
    handleSaveBtn();
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
          <button onClick={handleBackWithAutoSave} className="p-2 hover:bg-slate-200 rounded-lg text-slate-500">
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
          <ToolButton active={activeTool === "standard"} onClick={() => setActiveTool("standard")} icon={Square} label="Thường" color={colorEnum.blue} />
          <ToolButton active={activeTool === "vip"} onClick={() => setActiveTool("vip")} icon={Square} label="VIP" color={colorEnum.red} />
          {/* <ToolButton active={activeTool === "guest"} onClick={() => setActiveTool("guest")} icon={Square} label="Khách" color={colorEnum.gray} /> */}
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
                      {/* Resize Handles */}
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

                  {/* Zone Name - Tự động đổi vị trí theo hướng lưới */}
                  {!zone.isBox && (
                    <div
                      className={`absolute z-50 pointer-events-none flex ${zone.rows > zone.cols
                        ? "top-full left-0 w-full pt-2 justify-center" // Hàng dọc: Nằm dưới, căn giữa
                        : "right-full top-1/2 -translate-y-1/2 pr-3 justify-end items-center" // Hàng ngang: Nằm trái, căn giữa dọc
                        }`}
                    >
                      <span
                        className="bg-white/90 px-2 py-0.5 rounded text-[10px] font-bold shadow-sm border border-slate-200 text-slate-700 whitespace-nowrap pointer-events-auto transition-colors hover:text-blue-600"
                        style={{
                          transform: `scale(${Math.max(1, 1 / view.scale)})`,
                          transformOrigin: zone.rows > zone.cols ? "top center" : "right center"
                        }}
                        onMouseDown={(e) => e.stopPropagation()}
                        onDoubleClick={(e) => {
                          e.stopPropagation();
                          const newName = prompt("Nhập tên mới cho khu vực:", zone.name);
                          if (newName !== null && newName.trim() !== "") {
                            recordHistory();
                            setZones(
                              zones.map((z) =>
                                z.id === zone.id ? { ...z, name: newName } : z
                              )
                            );
                          }
                        }}
                      >
                        {zone.name}
                      </span>
                    </div>
                  )}
                  {/* Zone Content */}
                  <div className="w-full h-full overflow-hidden rounded-lg"
                    style={zone.isBox ? {} : { transform: `scale(${scaleX}, ${scaleY})`, transformOrigin: "top left", width: baseSize.w, height: baseSize.h }}>
                    {zone.isBox ? (
                      <div
                        onMouseDown={(e) => { if (activeTool === "move" || activeTool === "hand") return; if (e.button === 2) return; e.stopPropagation(); recordHistory(); setIsPainting(true); handleSeatInteraction(zone.id, 0); }}
                        onDoubleClick={(e) => { e.stopPropagation(); if (activeTool === "hand") return; const n = prompt("Nhập tên hiển thị trong Khối:", zone.seats[0].label); if (n !== null) { recordHistory(); setZones(zones.map((z) => z.id === zone.id ? { ...z, seats: [{ ...z.seats[0], label: n }] } : z)); } }}
                        style={{ backgroundColor: zone.seats[0].customColor || colorEnum.gray }}
                        className={`w-full h-full flex items-center justify-center text-white font-bold text-center p-2 ${activeTool === "move" ? "cursor-move" : activeTool === "hand" ? "" : "cursor-crosshair"}`}
                      >
                        <span className="text-xl">{zone.seats[0].label}</span>
                      </div>
                    ) : (
                      <div className="bg-slate-900/5 p-3 rounded-xl" style={{ display: "grid", gridTemplateColumns: `repeat(${zone.cols}, ${SEAT_SIZE}px)`, gap: GAP, width: "fit-content" }}>
                        {zone.seats.map((seat, index) => {
                          let bgClass = seat.type === "blocked" ? "bg-transparent text-transparent border-dashed border-2 border-slate-300" : seat.type === "vip" ? `bg-[${colorEnum.red}] border-b-4 border-red-600` : seat.type === "standard" ? "bg-[#3b82f6] border-b-4 border-[#2563eb]" : seat.type === "guest" ? `bg-[${colorEnum.gray}] border-b-4 border-slate-600` : seat.type === "custom" && seat.customColor ? `border-b-4 border-black/20 text-white` : "bg-slate-400 border-b-4 border-slate-500";
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
              <div className="w-1/2">
                <span className="text-[10px] text-slate-500 uppercase font-bold mb-1 block">Số hàng</span>
                <input type="number" min="1" className="w-full border p-2 rounded" value={newZoneConfig.rows} onChange={(e) => handleDimensionChange("rows", e.target.value)} />
              </div>
              <div className="w-1/2">
                <span className="text-[10px] text-slate-500 uppercase font-bold mb-1 block">Số cột</span>
                <input type="number" min="1" className="w-full border p-2 rounded" value={newZoneConfig.cols} onChange={(e) => handleDimensionChange("cols", e.target.value)} />
              </div>
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