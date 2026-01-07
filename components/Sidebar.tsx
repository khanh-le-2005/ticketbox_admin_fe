import React from "react";
import { GiPodium } from "react-icons/gi";
import { HiOutlineAdjustmentsHorizontal } from "react-icons/hi2";
import { NavLink, useNavigate } from "react-router-dom";
import {
  HiOutlineViewGrid,
  HiOutlineNewspaper,
  HiOutlinePhotograph,
  HiOutlineCog,
  HiOutlineLogout,
  HiOutlineUser,
  HiOutlineTicket,
  HiOutlineUsers,
  HiOutlineOfficeBuilding,
  HiOutlineUserGroup,
} from "react-icons/hi";
import { FaHotel } from "react-icons/fa";
import { useAuth } from "../context/AuthContext";

interface SidebarProps {
  isOpen: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const menuItems = [
    { label: "Tổng quan", path: "/dashboard", icon: <HiOutlineViewGrid size={22} /> },
    { label: "Quản lý Show", path: "/shows", icon: <HiOutlineTicket size={22} /> },
    { label: "Quản lý Phòng", path: "/rooms", icon: <HiOutlineTicket size={22} /> },
    { label: "Quản lý Khách sạn", path: "/hotels", icon: <FaHotel size={22} /> },
    { label: "Đối tác & Tổ chức", path: "/users/companies", icon: <HiOutlineOfficeBuilding size={22} /> },
    { label: "Nhân viên hệ thống", path: "/users/staff", icon: <HiOutlineUserGroup size={22} /> },
    { label: "Khách hàng", path: "/users/customers", icon: <HiOutlineUsers size={22} /> },
    { label: "Quản lý Tin tức", path: "/news", icon: <HiOutlineNewspaper size={22} /> },
    { label: "Quản lý Banner", path: "/banners", icon: <HiOutlinePhotograph size={22} /> },
    // { label: "Cấu hình hệ thống", path: "/config", icon: <HiOutlineCog size={22} /> },
    { label: "quản lý sân khấu", path: "/stage", icon: <GiPodium size={22} />},
    { label: "CheckAction", path: "/CheckAction", icon: <GiPodium size={22} />},
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
          <h1 className="text-xl font-bold text-white">momang</h1>
          <p className="text-xs text-gray-500 uppercase">Trang Quản Trị</p>
        </div>
      </div>

      {/* Menu */}
      <nav className="flex-1 px-3 mt-6 space-y-1 overflow-y-auto sidebar-scroll">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `
              flex items-center gap-4 px-4 py-3 rounded-xl transition-all
              ${
                isActive
                  ? "bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-lg shadow-pink-500/20"
                  : "hover:bg-gray-800 hover:text-white"
              }
            `}
          >
            {item.icon}
            <span className="font-medium">{item.label}</span>
          </NavLink>
        ))}
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
