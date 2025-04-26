import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Authentication
import { AuthProvider, useAuth } from "./contexts/AuthContext";

// Layouts
import PatientLayout from "./layouts/PatientLayout";
import NurseLayout from "./layouts/NurseLayout";

// Auth Pages
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";

// Patient Pages
import PatientDashboard from "./pages/patient/Dashboard";
import GlucoseLog from "./pages/patient/GlucoseLog";
import MealLog from "./pages/patient/MealLog";
import WeightLog from "./pages/patient/WeightLog";
import ActivityLog from "./pages/patient/ActivityLog";
import Appointments from "./pages/patient/Appointments";
import PatientProfile from "./pages/patient/Profile";

// Nurse Pages
import NurseDashboard from "./pages/nurse/Dashboard";
import PatientList from "./pages/nurse/PatientList";
// import PatientDetail from "./pages/nurse/PatientDetail";
// import PatientGlucose from "./pages/nurse/PatientGlucose";
// import TreatmentPlan from "./pages/nurse/TreatmentPlan";
import Reports from "./pages/nurse/Reports";

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, currentUser, loading } = useAuth();

  // ถ้ากำลังโหลดข้อมูล ให้แสดงหน้าโหลดก่อน
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        กำลังโหลด...
      </div>
    );
  }

  // ถ้ายังไม่ได้เข้าสู่ระบบ ให้ redirect ไปหน้าล็อกอิน
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // ถ้ามีการระบุบทบาทที่อนุญาต ให้ตรวจสอบว่าผู้ใช้มีบทบาทที่อนุญาตหรือไม่
  if (allowedRoles && !allowedRoles.includes(currentUser.role)) {
    // ถ้าไม่มีสิทธิ์ ให้ redirect ไปยังหน้าที่เหมาะสมตามบทบาท
    if (currentUser.role === "patient") {
      return <Navigate to="/patient/dashboard" replace />;
    } else if (currentUser.role === "nurse" || currentUser.role === "admin") {
      return <Navigate to="/nurse/dashboard" replace />;
    } else {
      return <Navigate to="/" replace />;
    }
  }

  return children;
};

// Public Route Component - สำหรับหน้าที่คนที่ล็อกอินแล้วไม่ควรเข้าถึง (เช่น หน้าล็อกอิน)
const PublicRoute = ({ children }) => {
  const { isAuthenticated, currentUser, loading } = useAuth();

  // ถ้ากำลังโหลดข้อมูล ให้แสดงหน้าโหลดก่อน
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        กำลังโหลด...
      </div>
    );
  }

  // ถ้าล็อกอินแล้ว ให้ redirect ไปหน้าที่เหมาะสม
  if (isAuthenticated) {
    if (currentUser.role === "patient") {
      return <Navigate to="/patient/dashboard" replace />;
    } else if (currentUser.role === "nurse" || currentUser.role === "admin") {
      return <Navigate to="/nurse/dashboard" replace />;
    }
  }

  return children;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route
            path="/"
            element={
              <PublicRoute>
                <Navigate to="/login" replace />
              </PublicRoute>
            }
          />
          <Route
            path="/login"
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            }
          />
          <Route
            path="/register"
            element={
              <PublicRoute>
                <Register />
              </PublicRoute>
            }
          />

          {/* Patient Routes */}
          <Route
            path="/patient"
            element={
              <ProtectedRoute allowedRoles={["patient"]}>
                <PatientLayout />
              </ProtectedRoute>
            }
          >
            <Route path="dashboard" element={<PatientDashboard />} />
            <Route path="glucose" element={<GlucoseLog />} />
            <Route path="meals" element={<MealLog />} />
            <Route path="weight" element={<WeightLog />} />
            <Route path="activities" element={<ActivityLog />} />
            <Route path="appointments" element={<Appointments />} />
            <Route path="profile" element={<PatientProfile />} />
            <Route
              path=""
              element={<Navigate to="/patient/dashboard" replace />}
            />
          </Route>

          {/* Nurse Routes */}
          <Route
            path="/nurse"
            element={
              <ProtectedRoute allowedRoles={["nurse", "admin"]}>
                <NurseLayout />
              </ProtectedRoute>
            }
          >
            <Route path="dashboard" element={<NurseDashboard />} />
            <Route path="patients" element={<PatientList />} />
            <Route path="patients/:id" element={<PatientDetail />} />
            <Route path="patients/:id/glucose" element={<PatientGlucose />} />
            <Route path="patients/:id/treatments" element={<TreatmentPlan />} />
            <Route path="reports" element={<Reports />} />
            <Route
              path=""
              element={<Navigate to="/nurse/dashboard" replace />}
            />
          </Route>

          {/* 404 Route */}
          <Route path="*" element={<div>404 ไม่พบหน้าที่คุณต้องการ</div>} />
        </Routes>

        {/* Toast Notifications */}
        <ToastContainer
          position="top-right"
          autoClose={5000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
        />
      </Router>
    </AuthProvider>
  );
}

export default App;
