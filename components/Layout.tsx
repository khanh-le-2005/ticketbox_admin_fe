import React, { Suspense, useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import { HiOutlineGlobeAlt, HiOutlineMenu } from "react-icons/hi";

const Layout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

      {/* Overlay for mobile when sidebar is open */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <div
        className={`flex flex-col min-h-screen transition-all duration-300 ${sidebarOpen ? "md:pl-64" : "pl-0"
          }`}
      >
        {/* Header */}
        <header className="h-16 bg-white border-b border-gray-200 px-4 md:px-8 flex items-center justify-between sticky top-0 z-40">
          <div className="flex items-center gap-4">
            {/* Nút 3 gạch */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-lg hover:bg-gray-100 transition"
            >
              <HiOutlineMenu size={22} />
            </button>

            <h2 className="text-xl font-bold text-gray-800">
              Bảng Điều Khiển Quản Trị
            </h2>
          </div>

          <a
            href="#"
            className="flex items-center gap-2 text-rose-500 hover:text-rose-600 transition-colors font-medium text-sm"
          >
            Xem Trang Chủ
            <HiOutlineGlobeAlt size={18} />
          </a>
        </header>

        {/* Page Content */}
        <main className="p-4 md:p-8 flex-1">
          <div className="w-full mx-auto">
            <Suspense
              fallback={
                <div className="flex items-center justify-center h-64">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-pink-500"></div>
                </div>
              }
            >
              <Outlet />
            </Suspense>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
