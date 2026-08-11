import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';

import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';

import BottomNav from './components/BottomNav';

import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import SuperAdminLogin from './pages/auth/SuperAdminLogin';

import Home from './pages/Home';
import Services from './pages/Services';
import ServicePage from './pages/ServicePage';
import BuyData from './pages/BuyData';
import BuyAirtime from './pages/BuyAirtime';

import Electricity from './pages/services/Electricity';
import CableTV from './pages/services/CableTV';
import WaecPin from './pages/services/WaecPin';
import JambPin from './pages/services/JambPin';
import Betting from './pages/services/Betting';
import SmileData from './pages/services/SmileData';
import Internet from './pages/services/Internet';

import FundWallet from './pages/FundWallet';
import Transactions from './pages/Transactions';
import TransactionDetail from './pages/TransactionDetail';
import Profile from './pages/Profile';
import Notifications from './pages/Notifications';
import Support from './pages/Support';
import Wallet from './pages/Wallet';
import Settings from './pages/Settings';

import AdminDashboard from './pages/admin/AdminDashboard';

const SUPER_ADMIN_SESSION = 'gydata_super_admin_session';

function ProtectedRoute({
  children,
}: {
  children: ReactNode;
}) {
  const { user, loading } = useAuth();

  if (loading) {
    return null;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function SuperAdminRoute({
  children,
}: {
  children: ReactNode;
}) {
  const session = localStorage.getItem(SUPER_ADMIN_SESSION);

  if (session !== 'true') {
    return <Navigate to="/super-admin-login" replace />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  const location = useLocation();
  const { user } = useAuth();

  const isAuthPage =
    location.pathname === '/login' ||
    location.pathname === '/register' ||
    location.pathname === '/super-admin-login';

  const isAdminPage =
    location.pathname.startsWith('/admin');

  const isSuperAdminPage =
    location.pathname.startsWith('/super-admin');

  const showBottomNav =
    !!user &&
    !isAuthPage &&
    !isAdminPage &&
    !isSuperAdminPage;

  return (
    <>
      <Routes>

        {/* Authentication */}

        <Route
          path="/login"
          element={<Login />}
        />

        <Route
          path="/register"
          element={<Register />}
        />

        {/* Super Admin Login */}

        <Route
          path="/super-admin-login"
          element={<SuperAdminLogin />}
        />

        {/* Super Admin - dashboard will be added next */}

        <Route
          path="/super-admin"
          element={
            <SuperAdminRoute>
              <Navigate
                to="/super-admin-login"
                replace
              />
            </SuperAdminRoute>
          }
        />

        {/* Main Home */}

        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          }
        />

        {/* Services */}

        <Route
          path="/services"
          element={
            <ProtectedRoute>
              <Services />
            </ProtectedRoute>
          }
        />

        <Route
          path="/services/:serviceId"
          element={
            <ProtectedRoute>
              <ServicePage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/buy-data"
          element={
            <ProtectedRoute>
              <BuyData />
            </ProtectedRoute>
          }
        />

        <Route
          path="/buy-airtime"
          element={
            <ProtectedRoute>
              <BuyAirtime />
            </ProtectedRoute>
          }
        />

        {/* Service Pages */}

        <Route
          path="/services/electricity"
          element={
            <ProtectedRoute>
              <Electricity />
            </ProtectedRoute>
          }
        />

        <Route
          path="/services/cable"
          element={
            <ProtectedRoute>
              <CableTV />
            </ProtectedRoute>
          }
        />

        <Route
          path="/services/waec"
          element={
            <ProtectedRoute>
              <WaecPin />
            </ProtectedRoute>
          }
        />

        <Route
          path="/services/jamb"
          element={
            <ProtectedRoute>
              <JambPin />
            </ProtectedRoute>
          }
        />

        <Route
          path="/services/betting"
          element={
            <ProtectedRoute>
              <Betting />
            </ProtectedRoute>
          }
        />

        <Route
          path="/services/smile"
          element={
            <ProtectedRoute>
              <SmileData />
            </ProtectedRoute>
          }
        />

        <Route
          path="/services/internet"
          element={
            <ProtectedRoute>
              <Internet />
            </ProtectedRoute>
          }
        />

        {/* Wallet */}

        <Route
          path="/fund-wallet"
          element={
            <ProtectedRoute>
              <FundWallet />
            </ProtectedRoute>
          }
        />

        <Route
          path="/wallet"
          element={
            <ProtectedRoute>
              <Wallet />
            </ProtectedRoute>
          }
        />

        {/* Transactions */}

        <Route
          path="/transactions"
          element={
            <ProtectedRoute>
              <Transactions />
            </ProtectedRoute>
          }
        />

        <Route
          path="/transactions/:id"
          element={
            <ProtectedRoute>
              <TransactionDetail />
            </ProtectedRoute>
          }
        />

        {/* Account */}

        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />

        <Route
          path="/notifications"
          element={
            <ProtectedRoute>
              <Notifications />
            </ProtectedRoute>
          }
        />

        <Route
          path="/support"
          element={
            <ProtectedRoute>
              <Support />
            </ProtectedRoute>
          }
        />

        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          }
        />

        {/* Normal Admin */}

        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        {/* Unknown route */}

        <Route
          path="*"
          element={
            <Navigate
              to="/"
              replace
            />
          }
        />

      </Routes>

      {showBottomNav && <BottomNav />}
    </>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
