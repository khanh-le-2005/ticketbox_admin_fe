import React, { useState } from "react";
import { GiPodium } from "react-icons/gi";
import {
  HiOutlineViewGrid,
  HiOutlineNewspaper,
  HiOutlinePhotograph,
  HiOutlineLogout,
  HiOutlineUser,
  HiOutlineTicket,
  HiOutlineUsers,
} from "react-icons/hi";
import { AiFillSignal } from "react-icons/ai";
import { FaHotel, FaBell } from "react-icons/fa";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { MenuItem, SidebarProps } from "@/type/api_types";

const Sidebar: React.FC<SidebarProps> = ({ isOpen, setIsOpen }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [openMenus, setOpenMenus] = useState<string[]>([]);

  const toggleMenu = (label: string) => {
    setOpenMenus((prev) =>
      prev.includes(label)
        ? prev.filter((l) => l !== label)
        : [...prev, label]
    );
  };

  const menuItems: MenuItem[] = [
    {
      label: "Tổng quan",
      path: "/dashboard",
      icon: <HiOutlineViewGrid size={22} />,
    },
    {
      label: "Quản lý Show",
      path: "/shows",
      icon: <HiOutlineTicket size={22} />,
    },
    {
      label: "Quản lý khách sạn",
      icon: <FaHotel size={22} />,
      children: [
        { label: "Dashboard", path: "/hotels/dashboard" },
        { label: "Quản lý khách sạn", path: "/hotels/HotelManagement" },
        { label: "Quản lý phòng", path: "/rooms" },
        { label: "Check-in / Check-out", path: "/CheckAction" },
        { label: "Dọn phòng", path: "/cleanroom" },
        { label: "Danh sách booking", path: "/hotels/BookingByDate" },
        { label: "Danh sách Trả Phòng ", path: "/hotels/DailyDepartures" },
        { label: "Danh sách Khách Đến ", path: "/hotels/DailyArrivals" },
        { label: "Đặt phòng thủ công", path: "/hotels/manual-booking" },
        { label: "Biểu đồ Gantt", path: "/hotels/gantt-chart" },
      ],
    },
    
    {
      label: "Thống kê",
      icon: <AiFillSignal size={22} />,
      children: [
        { label: "Thống kê khách sạn", path: "/Statistical/HotelAvailability" },
      ],
    },

    {
      label: "Người dùng",
      icon: <HiOutlineUsers size={22} />,
      children: [
        { label: "Đối tác & Tổ chức", path: "/users/companies" },
        { label: "Nhân viên hệ thống", path: "/users/staff" },
        { label: "Khách hàng", path: "/users/customers" },
      ],
    },

    {
      label: "Quản lý Tin tức",
      path: "/news",
      icon: <HiOutlineNewspaper size={22} />,
    },
    {
      label: "Quản lý Banner",
      path: "/banners",
      icon: <HiOutlinePhotograph size={22} />,
    },
    {
      label: "Quản lý sân khấu",
      path: "/stage",
      icon: <GiPodium size={22} />,
    },
    {
      label: "Quản lý thông báo",
      path: "/NotificationPage",
      icon: <FaBell size={22} />,
    },
  ];

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div
      className={`
        w-64 h-screen bg-[#111827] text-gray-300 flex flex-col
        fixed inset-y-0 left-0 z-50 overflow-hidden
        transition-transform duration-300
        ${isOpen ? "translate-x-0" : "-translate-x-full"}
      `}
    >
      {/* Header */}
      <div className="p-6 flex items-center gap-3">
        <div className="w-10 h-10 bg-pink-500 rounded-lg flex items-center justify-center text-white shadow-lg shadow-pink-500/20">
          <HiOutlineViewGrid size={24} />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">MoMang</h1>
          <p className="text-xs text-gray-500 uppercase">Trang Quản Trị</p>
        </div>
      </div>

      {/* Menu */}
      <nav className="flex-1 px-3 mt-6 space-y-1 overflow-y-auto sidebar-scroll">
        {menuItems.map((item) => {
          const isOpenMenu = openMenus.includes(item.label);

          if (item.children) {
            return (
              <div key={item.label}>
                <button
                  onClick={() => toggleMenu(item.label)}
                  className="w-full flex items-center justify-between px-4 py-3 rounded-xl hover:bg-gray-800 hover:text-white transition-all"
                >
                  <div className="flex items-center gap-4">
                    {item.icon}
                    <span className="font-medium">{item.label}</span>
                  </div>
                  <span
                    className={`transition-transform ${isOpenMenu ? "rotate-90" : ""
                      }`}
                  >
                    ▶
                  </span>
                </button>

                {isOpenMenu && (
                  <div className="ml-10 mt-1 space-y-1">
                    {item.children.map((child) => (
                      <NavLink
                        key={child.path}
                        to={child.path}
                        onClick={() => window.innerWidth < 1024 && setIsOpen(false)}
                        className={({ isActive }) => `
                          block px-4 py-2 rounded-lg text-sm transition-all
                          ${isActive
                            ? "bg-pink-500/20 text-pink-400"
                            : "hover:bg-gray-800"
                          }
                        `}
                      >
                        {child.label}
                      </NavLink>
                    ))}
                  </div>
                )}
              </div>
            );
          }

          return (
            <NavLink
              key={item.path}
              to={item.path!}
              onClick={() => window.innerWidth < 1024 && setIsOpen(false)}
              className={({ isActive }) => `
                flex items-center gap-4 px-4 py-3 rounded-xl transition-all
                ${isActive
                  ? "bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-lg shadow-pink-500/20"
                  : "hover:bg-gray-800 hover:text-white"
                }
              `}
            >
              {item.icon}
              <span className="font-medium">{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-gray-800 p-4 space-y-4">
        {user && (
          <div className="bg-gray-800/50 p-3 rounded-xl flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center">
              <HiOutlineUser size={20} />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">
                {user.fullName || user.username}
              </p>
              <p className="text-xs text-gray-500">
                {user.role === "ADMIN" ? "Quản trị viên" : "Nhân viên"}
              </p>
            </div>
          </div>
        )}

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-4 px-4 py-3 text-rose-400 hover:bg-rose-500/10 rounded-xl"
        >
          <HiOutlineLogout size={22} />
          Đăng xuất
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
