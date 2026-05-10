import { Navigate, Route, Routes } from 'react-router-dom';
import { DashboardLayout } from './layouts/DashboardLayout';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { DriverDashboard } from './pages/driver/DriverDashboard';
import { FeatureModulesPage } from './pages/FeatureModulesPage';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { UserDashboard } from './pages/user/UserDashboard';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/dashboard" element={<DashboardLayout />}>
        <Route index element={<Navigate to="/dashboard/user" replace />} />
        <Route path="user" element={<UserDashboard />} />
        <Route path="driver" element={<DriverDashboard />} />
        <Route path="admin" element={<AdminDashboard />} />
      </Route>
      <Route path="/features" element={<DashboardLayout />}>
        <Route index element={<FeatureModulesPage />} />
      </Route>
    </Routes>
  );
}
