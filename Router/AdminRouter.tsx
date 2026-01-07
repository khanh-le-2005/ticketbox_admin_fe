import AddBanner from "@/components/AddBanner";
import AddCompany from "@/components/AddCompany";
import AddNewArticle from "@/components/AddNewArticle";
import AddStaff from "@/components/AddStaff";
import CustomerDetail from "@/components/CustomerDetail";
import Layout from "@/components/Layout";
import ProtectedRoute from "@/components/ProtectedRoute";
import CreateHotel from "@/pages/Admin/Hotel/CreateHotel";
import HotelManagement from "@/pages/Admin/Hotel/HotelManagement";
import CreateRoomPage from "@/pages/Admin/room/CreateRoom";
import RoomManagementPage from "@/pages/Admin/room/RoomManagementPage";
import AddShow from "@/pages/Admin/Shows/AddShow";
import ShowManagement from "@/pages/Admin/Shows/ShowManagement";
import AdminNews from "@/pages/AdminNews";
import BannerManagement from "@/pages/BannerManagement";
import CommonModule from "@/pages/CommonModule";
import CompanyManagement from "@/pages/CompanyManagement";
import CustomerManagement from "@/pages/CustomerManagement";
import Dashboard from "@/pages/Dashboard";
import StaffManagement from "@/pages/StaffManagement";
import Stagemanager from "@/pages/Admin/Stage/StageManager";
import CheckAction from "@/pages/Admin/Checkroom/CheckAction";

import { Routes, Route, Navigate } from "react-router-dom";

const AdminRouter = () => {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        {/* check in vs check out */}
        <Route path="CheckAction" element={<CheckAction />} />
        {/* Quản lý sân khấu */}
        <Route path="stage" element={<Stagemanager />} />

        <Route path="stage" element={<Stagemanager />} />
        {/* <Route path="stage/create" element={<CreateHotel />} />
        <Route path="stage/edit/:id" element={<CreateHotel />} /> */}

        {/* Quản lý Khách sạn */}
        <Route index element={<Navigate to="/admin/hotels" replace />} />
        <Route path="/hotels/:hotelId/rooms" element={<RoomManagementPage />} />
        <Route path="hotels" element={<HotelManagement />} />
        <Route path="hotels/create" element={<CreateHotel />} />
        <Route path="hotels/edit/:id" element={<CreateHotel />} />

        {/* Quản lý Phòng */}
        <Route path="/rooms" element={<RoomManagementPage />} />
        <Route path="/rooms/create" element={<CreateRoomPage />} />
        <Route path="/" element={<Navigate to="/rooms" replace />} />
        <Route index element={<Navigate to="/dashboard" replace />} />

        <Route path="dashboard" element={<Dashboard />} />

        <Route path="users/customers" element={<CustomerManagement />} />
        <Route path="users/customers/detail/:id" element={<CustomerDetail />} />

        <Route
          path="/admin/companies"
          element={
            <ProtectedRoute>
              <CompanyManagement />
            </ProtectedRoute>
          }
        />

        <Route path="users/companies" element={<CompanyManagement />} />
        <Route path="users/companies/add" element={<AddCompany />} />
        <Route path="users/companies/edit/:id" element={<AddCompany />} />

        <Route path="users/staff" element={<StaffManagement />} />
        <Route path="users/staff/add" element={<AddStaff />} />
        <Route path="users/staff/edit/:id" element={<AddStaff />} />

        <Route path="news" element={<AdminNews />} />
        <Route path="news/add" element={<AddNewArticle />} />
        <Route path="news/edit/:id" element={<AddNewArticle />} />

        <Route path="banners" element={<BannerManagement />} />
        <Route path="banners/add" element={<AddBanner />} />

        <Route path="shows" element={<ShowManagement />} />
        <Route path="shows/add" element={<AddShow />} />
        <Route path="shows/edit/:id" element={<AddShow />} />

        <Route path="config" element={<CommonModule title="Configuration" />} />

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>
    </Routes>
  );
};

export default AdminRouter;
