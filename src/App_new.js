import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import NotificationBar from './components/common/NotificationBar';
import LoginForm from './components/auth/LoginForm';
import ApartmentSelection from './components/dashboard/ApartmentSelection';
// Import other components as we create them
// import ApartmentDashboard from './components/dashboard/ApartmentDashboard';
// import UnitManagement from './components/units/UnitManagement';
// import TenantManagement from './components/tenants/TenantManagement';
// import Reports from './components/reports/Reports';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { currentUser } = useAuth();
  return currentUser ? children : <Navigate to="/login" />;
};

// Public Route Component (redirect if authenticated)
const PublicRoute = ({ children }) => {
  const { currentUser } = useAuth();
  return !currentUser ? children : <Navigate to="/dashboard" />;
};

function AppRoutes() {
  return (
    <div className="App">
      <NotificationBar />
      <Routes>
        <Route 
          path="/login" 
          element={
            <PublicRoute>
              <LoginForm />
            </PublicRoute>
          } 
        />
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <ApartmentSelection />
            </ProtectedRoute>
          } 
        />
        {/* Add more routes as we create components */}
        {/* 
        <Route 
          path="/apartment/:id/dashboard" 
          element={
            <ProtectedRoute>
              <ApartmentDashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/apartment/:id/units" 
          element={
            <ProtectedRoute>
              <UnitManagement />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/apartment/:id/tenants" 
          element={
            <ProtectedRoute>
              <TenantManagement />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/apartment/:id/reports" 
          element={
            <ProtectedRoute>
              <Reports />
            </ProtectedRoute>
          } 
        />
        */}
        <Route path="/" element={<Navigate to="/dashboard" />} />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <NotificationProvider>
          <AppRoutes />
        </NotificationProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
