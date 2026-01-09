import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Move,
  Plus,
  Trash2,
  RotateCw,
  Save,
  ArrowLeft,
  Square,
  X,
  Grid3X3,
  MousePointer2,
  Check,
  UserCheck,
  PencilRuler,
  Users,
  Copy,
  Clipboard,
  Monitor,
  XCircle,
  Hand,
  ZoomIn,
  ZoomOut,
  Maximize,
  Undo,
  Redo,
} from "lucide-react";

// --- 1. CONFIG & TYPES ---

type SeatType = "standard" | "vip" | "blocked" | "custom";

interface Seat {
  id: string;
  label: string;
  type: SeatType;
  row: number;
  col: number;
  customColor?: string;
  isOccupied?: boolean;
}

interface Zone {
  id: string;
  name: string;
  rows: number;
  cols: number;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  seats: Seat[];
  isBox: boolean;
}

interface StageData {
  id: string;
  name: string;
  zones: Zone[];
  lastModified: string;
}

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

// --- 2. COMPONENTS ---

const ToolButton = ({
  active,
  icon: Icon,
  label,
  onClick,
  color,
  disabled,
}: any) => (
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

const StageDesigner: React.FC<{
  initialData?: StageData | null;
  onSave: (d: StageData) => void;
  onBack: () => void;
}> = ({ initialData, onSave, onBack }) => {
  const [stageName, setStageName] = useState(
    initialData?.name || "Sân Khấu Mới"
  );
  const [view, setView] = useState({ x: 0, y: 0, scale: 1 });
  const [isPanning, setIsPanning] = useState(false);
  const [isRightZooming, setIsRightZooming] = useState(false);
  const lastMousePos = useRef<{ x: number; y: number } | null>(null);

  const [zones, setZones] = useState<Zone[]>(initialData?.zones || []);
  const [past, setPast] = useState<Zone[][]>([]);
  const [future, setFuture] = useState<Zone[][]>([]);

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
  const [activeTool, setActiveTool] = useState<"move" | "hand" | SeatType>(
    "move"
  );
  const [selectedColor, setSelectedColor] = useState<string>("#64748b");
  const [isPainting, setIsPainting] = useState(false);
  const [clipboard, setClipboard] = useState<Zone | null>(null);

  const draggingRef = useRef<any>(null);
  const resizingRef = useRef<any>(null);
  const [showModal, setShowModal] = useState(false);
  const [newZoneConfig, setNewZoneConfig] = useState({
    name: "",
    rows: 5,
    cols: 8,
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (showModal) return;
      if (
        (e.ctrlKey || e.metaKey) &&
        e.key.toLowerCase() === "z" &&
        !e.shiftKey
      ) {
        e.preventDefault();
        handleUndo();
      }
      if (
        ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "y") ||
        ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === "z")
      ) {
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
  }, [
    zones,
    selectedZoneId,
    clipboard,
    showModal,
    activeTool,
    past,
    future,
    handleUndo,
    handleRedo,
    recordHistory,
  ]);

  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const zoomSensitivity = 0.001;
      const delta = -e.deltaY * zoomSensitivity;
      const newScale = Math.min(Math.max(0.1, view.scale + delta), 5);
      setView((prev) => ({ ...prev, scale: newScale }));
    } else {
      setView((prev) => ({
        ...prev,
        x: prev.x - e.deltaX,
        y: prev.y - e.deltaY,
      }));
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
    setView((prev) => ({
      ...prev,
      scale: Math.min(Math.max(0.1, prev.scale + delta), 5),
    }));
  };

  const handlePasteZone = (temp: Zone) => {
    recordHistory();
    const newSeats = temp.seats.map((s) => ({
      ...s,
      id: `${Date.now()}-${Math.random()}`,
      isOccupied: false,
    }));
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

  const createZoneData = (
    name: string,
    rows: number,
    cols: number,
    isBox: boolean
  ) => {
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
    const viewportCenterX =
      (-view.x + window.innerWidth / 2 - (isBox ? 150 : baseSize.w) / 2) /
      view.scale;
    const viewportCenterY =
      (-view.y + window.innerHeight / 2 - (isBox ? 150 : baseSize.h) / 2) /
      view.scale;
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
    const newZone = createZoneData(
      newZoneConfig.name || `Zone ${zones.length + 1}`,
      newZoneConfig.rows,
      newZoneConfig.cols,
      false
    );
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

  // Update rows/cols inputs in the "Add Grid" modal safely
  const handleDimensionChange = (
    key: "rows" | "cols",
    value: string | number
  ) => {
    const parsed =
      typeof value === "string" ? parseInt(value || "0", 10) : Number(value);
    const normalized = Math.max(1, isNaN(parsed) ? 1 : parsed);
    setNewZoneConfig((prev) => ({ ...prev, [key]: normalized }));
  };

  const handleZoneMouseDown = (e: React.MouseEvent, id: string, zone: Zone) => {
    if (activeTool !== "move") return;
    if (e.button === 2) return;
    e.stopPropagation();
    setSelectedZoneId(id);
    recordHistory();
    draggingRef.current = {
      id,
      startX: e.clientX,
      startY: e.clientY,
      initX: zone.x,
      initY: zone.y,
    };
  };

  const handleResizeStart = (
    e: React.MouseEvent,
    zone: Zone,
    direction: any
  ) => {
    e.stopPropagation();
    e.preventDefault();
    recordHistory();
    resizingRef.current = {
      id: zone.id,
      startX: e.clientX,
      startY: e.clientY,
      startW: zone.width,
      startH: zone.height,
      direction,
    };
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
      const { id, startX, startY, startW, startH, direction } =
        resizingRef.current;
      const deltaX = (e.clientX - startX) / view.scale;
      const deltaY = (e.clientY - startY) / view.scale;
      setZones((prev) =>
        prev.map((z) => {
          if (z.id !== id) return z;
          let newW = startW + deltaX;
          let newH = startH + deltaY;
          if (direction === "right") newH = startH;
          if (direction === "bottom") newW = startW;
          return {
            ...z,
            width: Math.max(50, newW),
            height: Math.max(50, newH),
          };
        })
      );
      return;
    }
    if (draggingRef.current && activeTool === "move") {
      const { id, startX, startY, initX, initY } = draggingRef.current;
      const deltaX = (e.clientX - startX) / view.scale;
      const deltaY = (e.clientY - startY) / view.scale;
      setZones((prev) =>
        prev.map((z) =>
          z.id === id ? { ...z, x: initX + deltaX, y: initY + deltaY } : z
        )
      );
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
          if (activeTool === "custom")
            newSeats[0] = { ...target, customColor: selectedColor };
        } else {
          if (activeTool === "custom")
            newSeats[seatIndex] = {
              ...target,
              type: "custom",
              customColor: selectedColor,
            };
          else
            newSeats[seatIndex] = {
              ...target,
              type: newType,
              customColor: undefined,
            };
        }
        return { ...z, seats: newSeats };
      })
    );
  };

  const deleteZone = (id: string) => {
    setZones((prev) => prev.filter((z) => z.id !== id));
    setSelectedZoneId(null);
  };

  const handleSaveBtn = () => {
    onSave({
      id: initialData?.id || Date.now().toString(),
      name: stageName,
      zones,
      lastModified: new Date().toLocaleString(),
    });
    alert("Đã lưu thiết kế thành công!");
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
          <button
            onClick={onBack}
            className="p-2 hover:bg-slate-100 rounded-lg text-slate-500"
          >
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
          className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-lg font-semibold flex items-center"
        >
          <Save size={18} className="mr-2" /> Lưu Lại
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden relative">
        <div className="w-24 bg-white border-r border-slate-200 flex flex-col items-center py-4 gap-3 z-40 shadow-sm overflow-y-auto">
          <ToolButton
            active={activeTool === "move"}
            onClick={() => setActiveTool("move")}
            icon={MousePointer2}
            label="Chọn"
          />
          <ToolButton
            active={activeTool === "hand"}
            onClick={() => setActiveTool("hand")}
            icon={Hand}
            label="Di chuyển"
          />
          <div className="w-full h-px bg-slate-200 my-1"></div>
          <ToolButton
            active={false}
            onClick={handleAddBox}
            icon={Square}
            label="Khối"
          />
          <ToolButton
            active={false}
            onClick={() => setShowModal(true)}
            icon={Grid3X3}
            label="Lưới"
          />
          <div className="w-full h-px bg-slate-200 my-1"></div>
          <ToolButton
            active={activeTool === "standard"}
            onClick={() => setActiveTool("standard")}
            icon={Square}
            label="Thường"
            color="#3b82f6"
          />
          <ToolButton
            active={activeTool === "vip"}
            onClick={() => setActiveTool("vip")}
            icon={Square}
            label="VIP"
            color="#eab308"
          />
          <ToolButton
            active={activeTool === "blocked"}
            onClick={() => setActiveTool("blocked")}
            icon={XCircle}
            label="Xóa"
          />
          <div className="grid grid-cols-2 gap-2 mt-2">
            {PALETTE.map((p) => (
              <button
                key={p.color}
                onClick={() => {
                  setSelectedColor(p.color);
                  setActiveTool("custom");
                }}
                className={`w-6 h-6 rounded-full border-2 ${activeTool === "custom" && selectedColor === p.color ? "border-black" : "border-transparent"}`}
                style={{ background: p.color }}
              />
            ))}
          </div>
        </div>

        <div
          className={`flex-1 relative bg-slate-100 overflow-hidden ${activeTool === "hand" || isPanning ? "cursor-grab active:cursor-grabbing" : isRightZooming ? "cursor-ns-resize" : "cursor-default"}`}
          onWheel={handleWheel}
          onMouseDown={handleCanvasMouseDown}
        >
          <div className="absolute bottom-6 left-6 z-[60] flex gap-1 bg-white p-1.5 rounded-lg shadow-xl border border-slate-200">
            <button
              onClick={() => updateZoom(-0.1)}
              className="p-2 hover:bg-slate-100 rounded text-slate-600"
              title="Thu nhỏ"
            >
              <ZoomOut size={18} />
            </button>
            <span className="w-12 flex items-center justify-center font-bold text-xs text-slate-700">
              {Math.round(view.scale * 100)}%
            </span>
            <button
              onClick={() => updateZoom(0.1)}
              className="p-2 hover:bg-slate-100 rounded text-slate-600"
              title="Phóng to"
            >
              <ZoomIn size={18} />
            </button>
            <div className="w-px bg-slate-200 mx-1"></div>
            <button
              onClick={() => setView({ x: 0, y: 0, scale: 1 })}
              className="p-2 hover:bg-slate-100 rounded text-slate-600"
              title="Mặc định"
            >
              <Maximize size={18} />
            </button>
          </div>

          <div
            style={{
              transform: `translate(${view.x}px, ${view.y}px) scale(${view.scale})`,
              transformOrigin: "0 0",
              width: "100%",
              height: "100%",
              transition:
                isPanning || isRightZooming
                  ? "none"
                  : "transform 0.1s ease-out",
            }}
            className="absolute inset-0"
          >
            <div
              className="absolute -top-[10000px] -left-[10000px] w-[20000px] h-[20000px] pointer-events-none opacity-20"
              style={{
                backgroundImage:
                  "radial-gradient(#94a3b8 1px, transparent 1px)",
                backgroundSize: "20px 20px",
              }}
            ></div>

            {zones.map((zone) => {
              const baseSize = getGridBaseSize(zone.rows, zone.cols);
              const scaleX = zone.isBox ? 1 : zone.width / baseSize.w;
              const scaleY = zone.isBox ? 1 : zone.height / baseSize.h;
              const isSelected =
                selectedZoneId === zone.id && activeTool === "move";

              return (
                <div
                  key={zone.id}
                  onMouseDown={(e) => handleZoneMouseDown(e, zone.id, zone)}
                  style={{
                    position: "absolute",
                    left: zone.x,
                    top: zone.y,
                    width: zone.width,
                    height: zone.height,
                    transform: `rotate(${zone.rotation}deg)`,
                    zIndex: isSelected ? 20 : 10,
                  }}
                  className={`absolute group select-none ${activeTool === "move" ? "cursor-move" : ""}`}
                >
                  {isSelected && (
                    <div className="absolute -inset-1 border-2 border-blue-500 rounded-lg pointer-events-none z-0">
                      <div
                        onMouseDown={(e) => handleResizeStart(e, zone, "right")}
                        className="absolute -right-2 top-1/2 -translate-y-1/2 w-4 h-8 bg-white border border-slate-300 cursor-ew-resize pointer-events-auto shadow-sm rounded-full"
                        style={{ transform: `scale(${1 / view.scale})` }}
                      />
                      <div
                        onMouseDown={(e) =>
                          handleResizeStart(e, zone, "bottom")
                        }
                        className="absolute -bottom-2 left-1/2 -translate-x-1/2 h-4 w-8 bg-white border border-slate-300 cursor-ns-resize pointer-events-auto shadow-sm rounded-full"
                        style={{ transform: `scale(${1 / view.scale})` }}
                      />
                      <div
                        onMouseDown={(e) =>
                          handleResizeStart(e, zone, "corner")
                        }
                        className="absolute -bottom-2 -right-2 w-5 h-5 bg-white border-2 border-blue-500 cursor-nwse-resize pointer-events-auto shadow-md rounded-full"
                        style={{ transform: `scale(${1 / view.scale})` }}
                      />
                      <div
                        className="absolute -top-16 right-0 flex bg-slate-900 text-white rounded p-1 pointer-events-auto gap-1 shadow-lg cursor-default"
                        style={{
                          transform: `scale(${1 / view.scale})`,
                          transformOrigin: "bottom right",
                        }}
                        onMouseDown={(e) => e.stopPropagation()}
                      >
                        <button
                          className="p-1 hover:bg-slate-700 rounded cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            setClipboard(zone);
                          }}
                          title="Copy"
                        >
                          <Copy size={14} />
                        </button>
                        <button
                          className="p-1 hover:bg-slate-700 rounded cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePasteZone(zone);
                          }}
                          title="Paste"
                        >
                          <Clipboard size={14} />
                        </button>
                        <div className="w-px bg-slate-700"></div>
                        <button
                          className="p-1 hover:bg-slate-700 rounded cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            recordHistory();
                            setZones(
                              zones.map((z) =>
                                z.id === zone.id
                                  ? { ...z, rotation: z.rotation + 45 }
                                  : z
                              )
                            );
                          }}
                          title="Xoay"
                        >
                          <RotateCw size={14} />
                        </button>
                        <button
                          className="p-1 hover:bg-red-600 rounded text-red-200 hover:text-white cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            recordHistory();
                            deleteZone(zone.id);
                          }}
                          title="Xóa"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  )}
                  <div className="absolute -top-7 left-0 w-full flex justify-center z-50">
                    <span
                      className="bg-white/90 px-2 py-0.5 rounded text-xs font-bold shadow-sm border border-slate-200 cursor-text pointer-events-auto hover:bg-blue-50 hover:text-blue-600 transition-colors"
                      style={{
                        transform: `scale(${Math.max(1, 1 / view.scale)})`,
                      }}
                      onMouseDown={(e) => e.stopPropagation()}
                      onDoubleClick={(e) => {
                        e.stopPropagation();
                        const newName = prompt(
                          "Nhập tên mới cho khu vực:",
                          zone.name
                        );
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
                  <div
                    className="w-full h-full overflow-hidden rounded-lg"
                    style={
                      zone.isBox
                        ? {}
                        : {
                            transform: `scale(${scaleX}, ${scaleY})`,
                            transformOrigin: "top left",
                            width: baseSize.w,
                            height: baseSize.h,
                          }
                    }
                  >
                    {zone.isBox ? (
                      <div
                        onMouseDown={(e) => {
                          if (activeTool === "move" || activeTool === "hand")
                            return;
                          if (e.button === 2) return;
                          e.stopPropagation();
                          recordHistory();
                          setIsPainting(true);
                          handleSeatInteraction(zone.id, 0);
                        }}
                        onDoubleClick={(e) => {
                          e.stopPropagation();
                          if (activeTool === "hand") return;
                          const n = prompt(
                            "Nhập tên hiển thị trong Khối:",
                            zone.seats[0].label
                          );
                          if (n !== null) {
                            recordHistory();
                            setZones(
                              zones.map((z) =>
                                z.id === zone.id
                                  ? {
                                      ...z,
                                      seats: [{ ...z.seats[0], label: n }],
                                    }
                                  : z
                              )
                            );
                          }
                        }}
                        style={{
                          backgroundColor:
                            zone.seats[0].customColor || "#64748b",
                        }}
                        className={`w-full h-full flex items-center justify-center text-white font-bold text-center p-2 ${activeTool === "move" ? "cursor-move" : activeTool === "hand" ? "" : "cursor-crosshair"}`}
                      >
                        <span className="text-xl">{zone.seats[0].label}</span>
                      </div>
                    ) : (
                      <div
                        className="bg-slate-900/5 p-3 rounded-xl"
                        style={{
                          display: "grid",
                          gridTemplateColumns: `repeat(${zone.cols}, ${SEAT_SIZE}px)`,
                          gap: GAP,
                          width: "fit-content",
                        }}
                      >
                        {zone.seats.map((seat, index) => {
                          let bgClass =
                            seat.type === "blocked"
                              ? "bg-transparent text-transparent border-dashed border-2 border-slate-300"
                              : seat.type === "vip"
                                ? "bg-amber-400 border-b-4 border-amber-600"
                                : seat.type === "standard"
                                  ? "bg-blue-500 border-b-4 border-blue-700"
                                  : seat.type === "custom" && seat.customColor
                                    ? `border-b-4 border-black/20 text-white`
                                    : "bg-slate-400 border-b-4 border-slate-500";
                          return (
                            <div
                              key={seat.id}
                              style={{
                                height: SEAT_SIZE,
                                backgroundColor: seat.customColor,
                              }}
                              onMouseDown={(e) => {
                                if (
                                  activeTool === "move" ||
                                  activeTool === "hand"
                                )
                                  return;
                                if (e.button === 2) return;
                                e.stopPropagation();
                                recordHistory();
                                setIsPainting(true);
                                handleSeatInteraction(zone.id, index);
                              }}
                              onMouseEnter={() =>
                                isPainting &&
                                handleSeatInteraction(zone.id, index)
                              }
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
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center">
          <div className="bg-white p-6 rounded-xl w-80">
            <h3 className="font-bold mb-4">Thêm Lưới</h3>
            <input
              className="w-full border p-2 rounded mb-2"
              placeholder="Tên"
              value={newZoneConfig.name}
              onChange={(e) =>
                setNewZoneConfig({ ...newZoneConfig, name: e.target.value })
              }
            />
            <div className="flex gap-2">
              <input
                type="number"
                min="1"
                className="w-1/2 border p-2"
                value={newZoneConfig.rows}
                onChange={(e) => handleDimensionChange("rows", e.target.value)}
              />
              <input
                type="number"
                min="1"
                className="w-1/2 border p-2"
                value={newZoneConfig.cols}
                onChange={(e) => handleDimensionChange("cols", e.target.value)}
              />
            </div>
            <div className="flex justify-end mt-4 gap-2">
              <button onClick={() => setShowModal(false)}>Hủy</button>
              <button
                onClick={handleCreateZone}
                className="bg-blue-600 text-white px-4 py-2 rounded"
              >
                Tạo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// --- 3. CHECK-IN COMPONENT (Đã sửa lỗi hiển thị màu) ---

// --- 3. CHECK-IN COMPONENT (CÓ TOOLTIP NỔI) ---

const StageCheckIn: React.FC<{
  data: StageData;
  onUpdate: (d: StageData) => void;
  onBack: () => void;
}> = ({ data, onUpdate, onBack }) => {
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

  const totalSeats = zones.reduce(
    (acc, z) =>
      acc + z.seats.filter((s) => s.type !== "blocked" && !z.isBox).length,
    0
  );
  const checkedInCount = zones.reduce(
    (acc, z) => acc + z.seats.filter((s) => s.isOccupied).length,
    0
  );

  return (
    <div className="flex flex-col h-screen bg-slate-100 font-sans relative">
      {/* HEADER */}
      <div className="bg-white border-b border-slate-200 h-16 px-6 flex items-center justify-between shadow-sm z-50">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-slate-100 rounded-lg text-slate-500"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-xl font-bold text-slate-800">{data.name}</h1>
          <span className="px-3 py-1 bg-green-100 text-green-700 text-sm font-bold rounded-full flex items-center">
            <UserCheck size={16} className="mr-1" /> CHẾ ĐỘ CHECK-IN
          </span>
        </div>
        <div className="flex items-center gap-6">
          <div className="text-right">
            <div className="text-xs text-slate-500 font-bold uppercase">
              Đã vào cửa
            </div>
            <div className="text-2xl font-black text-green-600">
              {checkedInCount}{" "}
              <span className="text-lg text-slate-400 font-medium">
                / {totalSeats}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* MAP VIEW */}
      <div className="flex-1 relative bg-slate-100 overflow-auto cursor-default">
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
                  className="w-full h-full overflow-hidden rounded-lg"
                  style={
                    zone.isBox
                      ? {}
                      : {
                          transform: `scale(${scaleX}, ${scaleY})`,
                          transformOrigin: "top left",
                          width: baseSize.w,
                          height: baseSize.h,
                        }
                  }
                >
                  {zone.isBox ? (
                    <div
                      style={{
                        backgroundColor: zone.seats[0].customColor || "#64748b",
                      }}
                      className="w-full h-full flex items-center justify-center text-white font-bold text-center p-2"
                    >
                      <span className="text-xl">{zone.seats[0].label}</span>
                    </div>
                  ) : (
                    <div
                      className="bg-slate-300/20 p-3 rounded-xl"
                      style={{
                        display: "grid",
                        gridTemplateColumns: `repeat(${zone.cols}, ${SEAT_SIZE}px)`,
                        gap: GAP,
                        width: "fit-content",
                      }}
                    >
                      {zone.seats.map((seat, index) => {
                        let className = `h-[${SEAT_SIZE}px] rounded-lg flex items-center justify-center text-[11px] font-bold shadow-sm transition-all border-b-4 relative `;
                        if (seat.type === "blocked") className += " invisible";
                        else {
                          className +=
                            " cursor-pointer active:scale-95 select-none";
                          if (seat.isOccupied)
                            className +=
                              " bg-green-500 border-green-700 text-white";
                          else {
                            if (seat.type === "vip")
                              className +=
                                " bg-amber-400 border-amber-600 text-amber-950";
                            else if (seat.type === "standard")
                              className +=
                                " bg-blue-500 border-blue-700 text-white";
                            else if (seat.type === "custom" && seat.customColor)
                              className += " text-white border-black/10";
                            else
                              className +=
                                " bg-slate-400 border-slate-500 text-white";
                          }
                        }
                        return (
                          <div
                            key={seat.id}
                            onClick={() => toggleCheckIn(zone.id, index)}
                            style={
                              !seat.isOccupied && seat.type === "custom"
                                ? { backgroundColor: seat.customColor }
                                : {}
                            }
                            className={className}
                            // --- EVENT CHO TOOLTIP ---
                            onMouseEnter={(e) => {
                              if (seat.type === "blocked") return;
                              setTooltip({
                                x: e.clientX,
                                y: e.clientY,
                                label: seat.label,
                                type:
                                  seat.type === "vip"
                                    ? "Ghế VIP"
                                    : seat.type === "standard"
                                      ? "Ghế Thường"
                                      : "Khác",
                                status: seat.isOccupied
                                  ? "Đã check-in"
                                  : "Chưa check-in",
                              });
                            }}
                            onMouseMove={(e) => {
                              if (tooltip)
                                setTooltip((prev) =>
                                  prev
                                    ? { ...prev, x: e.clientX, y: e.clientY }
                                    : null
                                );
                            }}
                            onMouseLeave={() => setTooltip(null)}
                          >
                            {seat.isOccupied ? (
                              <Check size={24} strokeWidth={3} />
                            ) : (
                              seat.label
                            )}
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
          className="fixed z-[100] pointer-events-none bg-slate-900/90 backdrop-blur text-white px-3 py-2 rounded-lg shadow-xl border border-slate-700 text-sm flex flex-col gap-1 min-w-[120px]"
          style={{
            top: tooltip.y + 15, // Cách con trỏ 15px xuống dưới
            left: tooltip.x + 15, // Cách con trỏ 15px sang phải
          }}
        >
          <div className="font-bold text-base text-yellow-400">
            {tooltip.label}
          </div>
          <div className="text-xs text-slate-300 border-b border-slate-600 pb-1 mb-1">
            {tooltip.type}
          </div>
          <div
            className={`text-xs font-bold ${tooltip.status === "Đã check-in" ? "text-green-400" : "text-slate-400"}`}
          >
            {tooltip.status}
          </div>
        </div>
      )}
    </div>
  );
};

// --- 4. APP ROUTER ---

const StageManagerApp = () => {
  const [stages, setStages] = useState<StageData[]>(() => {
    try {
      const d = localStorage.getItem("my_stage_data");
      return d ? JSON.parse(d) : [];
    } catch {
      return [];
    }
  });
  const [view, setView] = useState<"list" | "design" | "checkin">("list");
  const [currentId, setCurrentId] = useState<string | null>(null);

  useEffect(
    () => localStorage.setItem("my_stage_data", JSON.stringify(stages)),
    [stages]
  );

  const handleUpdateDataOnly = (d: StageData) => {
    const i = stages.findIndex((s) => s.id === d.id);
    if (i >= 0) {
      const u = [...stages];
      u[i] = d;
      setStages(u);
    }
  };
  const handleSaveAndExit = (d: StageData) => {
    const i = stages.findIndex((s) => s.id === d.id);
    if (i >= 0) {
      const u = [...stages];
      u[i] = d;
      setStages(u);
    } else setStages([...stages, d]);
  };
  const targetStage = stages.find((s) => s.id === currentId);

  if (view === "design")
    return (
      <StageDesigner
        initialData={targetStage}
        onSave={handleSaveAndExit}
        onBack={() => setView("list")}
      />
    );
  if (view === "checkin" && targetStage)
    return (
      <StageCheckIn
        data={targetStage}
        onUpdate={handleUpdateDataOnly}
        onBack={() => setView("list")}
      />
    );

  return (
    <div className="min-h-screen bg-slate-50 p-8 font-sans">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-end mb-10">
          <div>
            <h1 className="text-4xl font-extrabold text-slate-900">Sân Khấu</h1>
            <p className="text-slate-500 mt-2">Hệ thống quản lý</p>
          </div>
          <button
            onClick={() => {
              setCurrentId(null);
              setView("design");
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold shadow-xl flex items-center transition-transform hover:-translate-y-1"
          >
            <Plus className="mr-2" /> Tạo Mới
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {stages.map((s) => {
            const total = s.zones.reduce(
              (acc, z) =>
                acc +
                z.seats.filter((st) => st.type !== "blocked" && !z.isBox)
                  .length,
              0
            );
            const checked = s.zones.reduce(
              (acc, z) => acc + z.seats.filter((st) => st.isOccupied).length,
              0
            );
            return (
              <div
                key={s.id}
                className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all border border-slate-100 flex flex-col justify-between h-56"
              >
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                      <Monitor size={24} />
                    </div>
                    <button
                      onClick={() => {
                        if (confirm("Xóa?"))
                          setStages(stages.filter((x) => x.id !== s.id));
                      }}
                      className="text-slate-300 hover:text-red-500 p-2"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                  <h3 className="text-xl font-bold text-slate-800">{s.name}</h3>
                  <div className="text-sm text-slate-400 mt-1">
                    Cập nhật: {s.lastModified}
                  </div>
                  <div className="mt-3 flex items-center gap-2 text-sm font-medium text-slate-600">
                    <Users size={16} /> {checked} / {total} khách
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 mt-4">
                  <button
                    onClick={() => {
                      setCurrentId(s.id);
                      setView("design");
                    }}
                    className="flex items-center justify-center py-2 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 font-bold transition-colors"
                  >
                    <PencilRuler size={16} className="mr-2" /> Thiết Kế
                  </button>
                  <button
                    onClick={() => {
                      setCurrentId(s.id);
                      setView("checkin");
                    }}
                    className="flex items-center justify-center py-2 rounded-lg bg-green-500 text-white hover:bg-green-600 font-bold shadow-green-200 shadow-lg transition-colors"
                  >
                    <UserCheck size={16} className="mr-2" /> Check-in
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default StageManagerApp;
