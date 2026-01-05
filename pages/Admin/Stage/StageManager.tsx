import React, { useState, useRef, useEffect } from 'react';
import { 
  Move, Plus, Trash2, RotateCw, XCircle, X, Check, 
  ZoomIn, ZoomOut, Save, ArrowLeft, Users, Edit, Layout 
} from 'lucide-react';

// --- 1. TYPES DEFINITIONS ---

type SeatType = 'standard' | 'vip' | 'blocked';

interface Seat {
  id: string;
  label: string;
  type: SeatType;
  row: number;
  col: number;
  isOccupied?: boolean; // Trạng thái: Đã có người ngồi hay chưa
}

interface Zone {
  id: string;
  name: string;
  rows: number;
  cols: number;
  x: number;
  y: number;
  rotation: number;
  scale: number;
  seats: Seat[];
}

interface StageData {
  id: string;
  name: string;
  zones: Zone[];
  lastModified: string;
}

const SEAT_SIZE = 35; 
const GAP = 4;

// --- 2. COMPONENT: STAGE DESIGNER (TRANG THIẾT KẾ) ---

interface DesignerProps {
  initialData?: StageData | null;
  onSave: (data: StageData) => void;
  onBack: () => void;
}

const StageDesigner: React.FC<DesignerProps> = ({ initialData, onSave, onBack }) => {
  const [stageName, setStageName] = useState(initialData?.name || "Sân Khấu Mới");
  const [zones, setZones] = useState<Zone[]>(initialData?.zones || []);
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);
  const [activeTool, setActiveTool] = useState<'move' | SeatType>('move');
  const [isPainting, setIsPainting] = useState(false);
  const draggingRef = useRef<{ id: string, startX: number, startY: number, initX: number, initY: number } | null>(null);
  
  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [newZoneConfig, setNewZoneConfig] = useState({ name: '', rows: 5, cols: 8 });

  // Logic thêm Zone
  const handleCreateZone = () => {
    if (newZoneConfig.rows < 1 || newZoneConfig.cols < 1) return;
    const seatList: Seat[] = [];
    for(let i=0; i<newZoneConfig.rows; i++) {
      for(let j=0; j<newZoneConfig.cols; j++) {
        seatList.push({
          id: `${Date.now()}-${i}-${j}`,
          label: `${i+1}-${j+1}`,
          type: 'standard',
          row: i,
          col: j,
          isOccupied: false
        });
      }
    }
    const newZone: Zone = {
      id: Date.now().toString(),
      name: newZoneConfig.name || `Zone ${zones.length + 1}`,
      rows: newZoneConfig.rows,
      cols: newZoneConfig.cols,
      x: 100, y: 100, rotation: 0, scale: 1,
      seats: seatList
    };
    setZones([...zones, newZone]);
    setSelectedZoneId(newZone.id);
    setActiveTool('move');
    setShowModal(false);
    setNewZoneConfig({ name: '', rows: 5, cols: 8 });
  };

  // Logic Di chuyển & Vẽ (Giữ nguyên như cũ)
  const handleZoneMouseDown = (e: React.MouseEvent, id: string, zone: Zone) => {
    if (activeTool !== 'move') return;
    e.stopPropagation();
    setSelectedZoneId(id);
    draggingRef.current = { id, startX: e.clientX, startY: e.clientY, initX: zone.x, initY: zone.y };
  };

  const handleGlobalMouseMove = (e: React.MouseEvent) => {
    if (draggingRef.current && activeTool === 'move') {
      const { id, startX, startY, initX, initY } = draggingRef.current;
      setZones(prev => prev.map(z => z.id === id ? { ...z, x: initX + (e.clientX - startX), y: initY + (e.clientY - startY) } : z));
    }
  };

  const handleGlobalMouseUp = () => {
    draggingRef.current = null;
    setIsPainting(false);
  };

  const updateSeatType = (zoneId: string, seatIndex: number) => {
    if (activeTool === 'move') return;
    setZones(prev => prev.map(z => {
      if (z.id !== zoneId) return z;
      const newSeats = [...z.seats];
      newSeats[seatIndex] = { ...newSeats[seatIndex], type: activeTool as SeatType };
      return { ...z, seats: newSeats };
    }));
  };

  // Logic Toolbar Zone
  const updateZone = (id: string, updates: Partial<Zone>) => {
    setZones(prev => prev.map(z => z.id === id ? { ...z, ...updates } : z));
  };

  const handleSaveStage = () => {
    if (!stageName.trim()) return alert("Vui lòng nhập tên sân khấu!");
    const data: StageData = {
      id: initialData?.id || Date.now().toString(),
      name: stageName,
      zones: zones,
      lastModified: new Date().toLocaleString()
    };
    onSave(data);
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100 overflow-hidden" onMouseMove={handleGlobalMouseMove} onMouseUp={handleGlobalMouseUp}>
      {/* HEADER / TOOLBAR */}
      <div className="bg-white shadow-md p-4 flex items-center justify-between z-40">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="text-gray-500 hover:text-gray-800 p-2 border rounded"><ArrowLeft size={20} /></button>
          <input 
            value={stageName} 
            onChange={(e) => setStageName(e.target.value)} 
            className="text-xl font-bold text-gray-800 border-b border-dashed border-gray-300 focus:border-blue-500 outline-none px-2"
            placeholder="Tên sân khấu..."
          />
          <div className="w-px h-8 bg-gray-300 mx-2"></div>
          
          {/* Tools */}
          <div className="flex bg-gray-100 p-1 rounded-lg gap-1 border border-gray-200">
            <button onClick={() => setActiveTool('move')} className={`flex items-center px-3 py-2 rounded text-sm font-medium ${activeTool === 'move' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
              <Move size={16} className="mr-2"/> Move
            </button>
            <div className="w-px bg-gray-300 mx-1"></div>
            <button onClick={() => setActiveTool('standard')} className={`flex items-center px-3 py-2 rounded text-sm font-medium ${activeTool === 'standard' ? 'bg-blue-100 text-blue-700 shadow-inner' : 'text-gray-500 hover:text-gray-700'}`}>
              <div className="w-4 h-4 bg-blue-500 rounded mr-2"></div> Std
            </button>
            <button onClick={() => setActiveTool('vip')} className={`flex items-center px-3 py-2 rounded text-sm font-medium ${activeTool === 'vip' ? 'bg-yellow-100 text-yellow-700 shadow-inner' : 'text-gray-500 hover:text-gray-700'}`}>
              <div className="w-4 h-4 bg-yellow-500 rounded mr-2"></div> VIP
            </button>
            <button onClick={() => setActiveTool('blocked')} className={`flex items-center px-3 py-2 rounded text-sm font-medium ${activeTool === 'blocked' ? 'bg-gray-200 text-gray-700 shadow-inner' : 'text-gray-500 hover:text-gray-700'}`}>
              <XCircle size={16} className="mr-2 text-gray-400"/> Del
            </button>
          </div>
        </div>

        <div className="flex gap-2">
           <button onClick={() => setShowModal(true)} className="bg-indigo-100 text-indigo-700 hover:bg-indigo-200 px-4 py-2 rounded flex items-center">
             <Plus size={18} className="mr-1"/> Add Zone
           </button>
           <button onClick={handleSaveStage} className="bg-green-600 text-white hover:bg-green-700 px-6 py-2 rounded flex items-center shadow-lg font-bold">
             <Save size={18} className="mr-2"/> Lưu Sân Khấu
           </button>
        </div>
      </div>

      {/* CANVAS */}
      <div className="flex-1 relative bg-slate-200 overflow-hidden cursor-crosshair">
        {zones.map((zone) => (
          <div
            key={zone.id}
            onMouseDown={(e) => handleZoneMouseDown(e, zone.id, zone)}
            style={{
              position: 'absolute', left: zone.x, top: zone.y,
              transform: `rotate(${zone.rotation}deg) scale(${zone.scale})`,
              cursor: activeTool === 'move' ? 'move' : 'default',
              zIndex: selectedZoneId === zone.id ? 10 : 1,
              transformOrigin: 'center center',
            }}
            className={`transition-shadow select-none ${selectedZoneId === zone.id && activeTool === 'move' ? 'ring-2 ring-blue-500 shadow-2xl' : ''}`}
          >
             {/* Zone Header Controls */}
             <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-max bg-gray-900 text-white px-2 py-1 rounded text-sm font-bold shadow-lg flex items-center gap-2">
               <span>{zone.name}</span>
               {selectedZoneId === zone.id && activeTool === 'move' && (
                 <div className="flex gap-1 ml-2 border-l border-gray-600 pl-2">
                    <button className="hover:text-blue-300 p-1" onClick={(e) => {e.stopPropagation(); updateZone(zone.id, {scale: Math.max(0.3, zone.scale - 0.1)})}}><ZoomOut size={14}/></button>
                    <button className="hover:text-blue-300 p-1" onClick={(e) => {e.stopPropagation(); updateZone(zone.id, {scale: Math.min(2, zone.scale + 0.1)})}}><ZoomIn size={14}/></button>
                    <button className="hover:text-blue-300 p-1" onClick={(e) => {e.stopPropagation(); updateZone(zone.id, {rotation: zone.rotation + 15})}}><RotateCw size={14}/></button>
                    <button className="hover:text-red-300 p-1" onClick={(e) => {e.stopPropagation(); setZones(zones.filter(z => z.id !== zone.id))}}><Trash2 size={14}/></button>
                 </div>
               )}
            </div>

            {/* Seats Grid */}
            <div className="bg-white/50 p-2 rounded-lg backdrop-blur-sm border border-gray-300" 
                 style={{ display: 'grid', gridTemplateColumns: `repeat(${zone.cols}, ${SEAT_SIZE}px)`, gap: GAP }}>
              {zone.seats.map((seat, index) => (
                <div
                  key={seat.id}
                  onMouseDown={(e) => { e.stopPropagation(); setIsPainting(true); updateSeatType(zone.id, index); }}
                  onMouseEnter={() => isPainting && updateSeatType(zone.id, index)}
                  className={`h-[35px] rounded-md flex items-center justify-center text-xs font-bold text-white
                    ${seat.type === 'standard' ? 'bg-blue-500' : ''}
                    ${seat.type === 'vip' ? 'bg-yellow-500 ring-2 ring-yellow-300' : ''}
                    ${seat.type === 'blocked' ? 'bg-gray-200 text-transparent' : ''}
                  `}
                >
                  {seat.type !== 'blocked' && seat.label}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Modal Add Zone */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 w-80">
            <h3 className="font-bold mb-4">Thêm Khu Vực Mới</h3>
            <input className="w-full border p-2 mb-2 rounded" placeholder="Tên (VD: Khu A)" value={newZoneConfig.name} onChange={e => setNewZoneConfig({...newZoneConfig, name: e.target.value})}/>
            <div className="flex gap-2 mb-4">
              <input type="number" className="w-1/2 border p-2 rounded" placeholder="Rows" value={newZoneConfig.rows} onChange={e => setNewZoneConfig({...newZoneConfig, rows: Number(e.target.value)})}/>
              <input type="number" className="w-1/2 border p-2 rounded" placeholder="Cols" value={newZoneConfig.cols} onChange={e => setNewZoneConfig({...newZoneConfig, cols: Number(e.target.value)})}/>
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowModal(false)} className="text-gray-500 px-3 py-1">Hủy</button>
              <button onClick={handleCreateZone} className="bg-blue-600 text-white px-3 py-1 rounded">Tạo</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// --- 3. COMPONENT: CHECK-IN VIEW (TRANG TÍCH KHÁCH HÀNG) ---

interface CheckInProps {
  data: StageData;
  onBack: () => void;
  onUpdate: (updatedData: StageData) => void;
}

const StageCheckIn: React.FC<CheckInProps> = ({ data, onBack, onUpdate }) => {
  const [zones, setZones] = useState<Zone[]>(data.zones);

  // Hàm xử lý check-in
  const toggleCheckIn = (zoneId: string, seatIndex: number) => {
    const newZones = zones.map(z => {
      if (z.id !== zoneId) return z;
      const newSeats = [...z.seats];
      // Nếu là ghế blocked thì bỏ qua
      if (newSeats[seatIndex].type === 'blocked') return z;
      
      // Đảo trạng thái isOccupied
      newSeats[seatIndex] = { 
        ...newSeats[seatIndex], 
        isOccupied: !newSeats[seatIndex].isOccupied 
      };
      return { ...z, seats: newSeats };
    });
    
    setZones(newZones);
    onUpdate({ ...data, zones: newZones });
  };

  // Tính thống kê
  const totalSeats = zones.reduce((acc, z) => acc + z.seats.filter(s => s.type !== 'blocked').length, 0);
  const checkedInCount = zones.reduce((acc, z) => acc + z.seats.filter(s => s.isOccupied).length, 0);

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* HEADER */}
      <div className="bg-white shadow px-6 py-4 flex justify-between items-center z-20">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="text-gray-600 hover:text-black flex items-center">
            <ArrowLeft className="mr-2"/> Quay lại
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">{data.name}</h1>
            <p className="text-sm text-green-600 font-medium">Chế độ Check-in Khách hàng</p>
          </div>
        </div>
        <div className="flex gap-6 text-sm">
          <div className="text-gray-500">Tổng ghế: <b className="text-gray-800">{totalSeats}</b></div>
          <div className="text-blue-600">Đã ngồi: <b className="text-2xl">{checkedInCount}</b></div>
        </div>
      </div>

      {/* MAP VIEWER (READ ONLY & CLICKABLE) */}
      <div className="flex-1 relative bg-slate-200 overflow-auto overflow-x-hidden">
        <div className="absolute top-4 left-4 bg-white/90 p-3 rounded shadow text-xs space-y-2 pointer-events-none z-10">
          <div className="font-bold mb-1">Chú thích:</div>
          <div className="flex items-center"><div className="w-4 h-4 bg-gray-300 rounded mr-2"></div> Chưa có khách</div>
          <div className="flex items-center"><div className="w-4 h-4 bg-green-500 rounded mr-2"></div> Đã Check-in (Có người)</div>
        </div>

        {zones.map((zone) => (
          <div
            key={zone.id}
            style={{
              position: 'absolute', left: zone.x, top: zone.y,
              transform: `rotate(${zone.rotation}deg) scale(${zone.scale})`,
              transformOrigin: 'center center',
            }}
            className="select-none pointer-events-auto"
          >
             <div className="absolute -top-8 left-0 w-full text-center font-bold text-gray-700 bg-white/50 rounded">{zone.name}</div>
            <div className="bg-white/30 p-2 rounded-lg border border-white/40" 
                 style={{ display: 'grid', gridTemplateColumns: `repeat(${zone.cols}, ${SEAT_SIZE}px)`, gap: GAP }}>
              {zone.seats.map((seat, index) => (
                <div
                  key={seat.id}
                  onClick={() => toggleCheckIn(zone.id, index)}
                  className={`h-[35px] rounded-md flex items-center justify-center text-xs font-bold cursor-pointer transition-all shadow-sm
                    ${seat.type === 'blocked' ? 'invisible pointer-events-none' : ''}
                    ${seat.isOccupied 
                        ? 'bg-green-500 text-white ring-2 ring-green-300' // Đã check-in
                        : 'bg-gray-300 text-gray-600 hover:bg-gray-400'  // Chưa check-in
                    }
                  `}
                  title={`Ghế: ${seat.label} (${seat.type === 'vip' ? 'VIP' : 'Thường'})`}
                >
                  {seat.type !== 'blocked' && (seat.isOccupied ? <Check size={16}/> : seat.label)}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// --- 4. COMPONENT: DASHBOARD (TRANG CHỦ - DANH SÁCH) ---

const StageManagerApp = () => {
  // 1. KHỞI TẠO STATE TỪ LOCALSTORAGE
  // Thay vì useState([]) rỗng, ta kiểm tra xem trong máy có dữ liệu chưa
  const [stages, setStages] = useState<StageData[]>(() => {
    try {
      const savedData = localStorage.getItem('my_stage_data');
      return savedData ? JSON.parse(savedData) : [];
    } catch (error) {
      console.error("Lỗi đọc dữ liệu:", error);
      return [];
    }
  });

  const [view, setView] = useState<'list' | 'create' | 'checkin'>('list');
  const [currentStageId, setCurrentStageId] = useState<string | null>(null);

  // 2. TỰ ĐỘNG LƯU KHI CÓ THAY ĐỔI
  // Mỗi khi biến 'stages' thay đổi (thêm, sửa, xóa), useEffect này sẽ chạy để lưu vào ổ cứng
  useEffect(() => {
    localStorage.setItem('my_stage_data', JSON.stringify(stages));
  }, [stages]);

  // Xử lý lưu từ trang Designer
  const handleSaveStage = (newStage: StageData) => {
    const existingIndex = stages.findIndex(s => s.id === newStage.id);
    if (existingIndex >= 0) {
      const updated = [...stages];
      updated[existingIndex] = newStage;
      setStages(updated);
    } else {
      setStages([...stages, newStage]);
    }
    setView('list');
    setCurrentStageId(null);
  };

  // Xử lý update từ trang Check-in
  const handleUpdateCheckIn = (updatedStage: StageData) => {
    const updated = stages.map(s => s.id === updatedStage.id ? updatedStage : s);
    setStages(updated);
  };

  const deleteStage = (id: string) => {
    if(confirm("Xóa toàn bộ sơ đồ này?")) {
      setStages(stages.filter(s => s.id !== id));
    }
  };

  // --- RENDER VIEWS ---

  if (view === 'create') {
    const stageToEdit = stages.find(s => s.id === currentStageId);
    return <StageDesigner initialData={stageToEdit} onSave={handleSaveStage} onBack={() => setView('list')} />;
  }

  if (view === 'checkin' && currentStageId) {
    const stageToCheckIn = stages.find(s => s.id === currentStageId);
    if(stageToCheckIn) 
        return <StageCheckIn data={stageToCheckIn} onUpdate={handleUpdateCheckIn} onBack={() => setView('list')} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Quản Lý Sân Khấu</h1>
            <p className="text-gray-500">Dữ liệu được lưu tự động trong trình duyệt</p>
          </div>
          <button 
            onClick={() => { setCurrentStageId(null); setView('create'); }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-lg shadow flex items-center font-medium"
          >
            <Plus className="mr-2"/> Tạo Sân Khấu Mới
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {stages.length === 0 && (
            <div className="col-span-full text-center py-20 bg-white rounded-xl border-2 border-dashed border-gray-300 text-gray-400">
              <p>Chưa có sân khấu nào.</p>
              <p className="text-sm mt-2">Dữ liệu bạn tạo sẽ không bị mất khi F5.</p>
            </div>
          )}

          {stages.map(stage => {
             const totalSeats = stage.zones.reduce((acc, z) => acc + z.seats.filter(s => s.type !== 'blocked').length, 0);
             const occupied = stage.zones.reduce((acc, z) => acc + z.seats.filter(s => s.isOccupied).length, 0);

             return (
              <div key={stage.id} className="bg-white rounded-xl shadow-sm hover:shadow-md transition border border-gray-100 overflow-hidden">
                <div className="h-2 bg-gradient-to-r from-blue-500 to-indigo-600"></div>
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xl font-bold text-gray-800">{stage.name}</h3>
                    <div className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">{stage.lastModified}</div>
                  </div>
                  
                  <div className="flex gap-4 text-sm text-gray-600 mb-6">
                    <div className="flex items-center"><Layout size={16} className="mr-1"/> {stage.zones.length} khu vực</div>
                    <div className="flex items-center"><Users size={16} className="mr-1"/> {occupied} / {totalSeats} khách</div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <button 
                      onClick={() => { setCurrentStageId(stage.id); setView('checkin'); }}
                      className="flex items-center justify-center bg-green-50 text-green-700 hover:bg-green-100 py-2 rounded font-medium border border-green-200"
                    >
                      <Check size={16} className="mr-2"/> Check-in
                    </button>
                    <button 
                      onClick={() => { setCurrentStageId(stage.id); setView('create'); }}
                      className="flex items-center justify-center bg-gray-50 text-gray-700 hover:bg-gray-100 py-2 rounded font-medium border border-gray-200"
                    >
                      <Edit size={16} className="mr-2"/> Thiết kế
                    </button>
                  </div>
                  <button onClick={() => deleteStage(stage.id)} className="w-full mt-3 text-red-400 text-xs hover:text-red-600 flex justify-center items-center py-1">
                    <Trash2 size={12} className="mr-1"/> Xóa sân khấu
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