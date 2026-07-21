import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import PageLoader from './components/ui/PageLoader'
import Layout from './components/layout/Layout'

import Landing from './pages/landing/Landing'
import Privacy from './pages/landing/Privacy'
import Terms from './pages/landing/Terms'
import DataDeletion from './pages/landing/DataDeletion'
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import ForgotPassword from './pages/auth/ForgotPassword'
import ResetPassword from './pages/auth/ResetPassword'
import Dashboard from './pages/user/Dashboard'
import BuyData from './pages/user/BuyData'
import BuyAirtime from './pages/user/BuyAirtime'
import BuyElectricity from './pages/user/BuyElectricity'
// import BuyCable from './pages/user/BuyCable'
import Transactions from './pages/user/Transactions'
import Profile from './pages/user/Profile'
import FundWallet from './pages/user/FundWallet'
import Earnings from './pages/user/Earnings'
import ApiDocs from './pages/user/ApiDocs'

import AdminDashboard from './pages/admin/AdminDashboard'
import AdminUsers from './pages/admin/AdminUsers'
import AdminTransactions from './pages/admin/AdminTransactions'
import AdminPlans from './pages/admin/AdminPlans'
import AdminCoupons from './pages/admin/AdminCoupons'
import AdminNotifications from './pages/admin/AdminNotifications'
import AdminSettings from './pages/admin/AdminSettings'
import AdminUserPricing from './pages/admin/AdminUserPricing'
import AdminBroadcast from './pages/admin/AdminBroadcast'
import AdminTransfer from './pages/admin/AdminTransfer'
import AdminWhatsApp from './pages/admin/AdminWhatsApp'

function PrivateRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <PageLoader />
  if (!user) return <Navigate to="/login" replace />
  return children
}

function AdminRoute({ children }) {
  const { user, loading, isAdmin } = useAuth()
  if (loading) return <PageLoader />
  if (!user) return <Navigate to="/login" replace />
  if (!isAdmin) return <Navigate to="/dashboard" replace />
  return children
}

function GuestRoute({ children }) {
  const { user, loading, isAdmin } = useAuth()
  if (loading) return <PageLoader />
  if (user) return <Navigate to={isAdmin ? '/admin/dashboard' : '/dashboard'} replace />
  return children
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"                element={<GuestRoute><Landing /></GuestRoute>} />
        <Route path="/privacy"         element={<Privacy />} />
        <Route path="/terms"           element={<Terms />} />
        <Route path="/data-deletion"   element={<DataDeletion />} />
        <Route path="/login"           element={<GuestRoute><Login /></GuestRoute>} />
        <Route path="/register"        element={<GuestRoute><Register /></GuestRoute>} />
        <Route path="/forgot-password" element={<GuestRoute><ForgotPassword /></GuestRoute>} />
        <Route path="/reset-password"  element={<GuestRoute><ResetPassword /></GuestRoute>} />

        <Route element={<PrivateRoute><Layout /></PrivateRoute>}>
          <Route path="/dashboard"       element={<Dashboard />} />
          <Route path="/buy/data"        element={<BuyData />} />
          <Route path="/buy/airtime"     element={<BuyAirtime />} />
          <Route path="/buy/electricity" element={<BuyElectricity />} />
          {/* <Route path="/buy/cable"       element={<BuyCable />} /> */}
          <Route path="/transactions"    element={<Transactions />} />
          <Route path="/profile"         element={<Profile />} />
          <Route path="/fund-wallet"     element={<FundWallet />} />
          <Route path="/earnings"        element={<Earnings />} />
          <Route path="/api-docs"        element={<ApiDocs />} />
        </Route>

        <Route element={<AdminRoute><Layout /></AdminRoute>}>
          <Route path="/admin/dashboard"          element={<AdminDashboard />} />
          <Route path="/admin/users"              element={<AdminUsers />} />
          <Route path="/admin/transactions"       element={<AdminTransactions />} />
          <Route path="/admin/plans"              element={<AdminPlans />} />
          <Route path="/admin/coupons"            element={<AdminCoupons />} />
          <Route path="/admin/notifications"      element={<AdminNotifications />} />
          <Route path="/admin/settings"           element={<AdminSettings />} />
          <Route path="/admin/users/:id/pricing"  element={<AdminUserPricing />} />
          <Route path="/admin/broadcast"          element={<AdminBroadcast />} />
          <Route path="/admin/transfer"           element={<AdminTransfer />} />
          <Route path="/admin/whatsapp"           element={<AdminWhatsApp />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
