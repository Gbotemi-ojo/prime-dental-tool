// src/App.js
import { lazy, Suspense } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Loader from "./components/Loader/Loader";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Lazy-loaded page components
const Home = lazy(() => import("./pages/Home"));
const Login = lazy(() => import("./pages/login"));
const Dashboard = lazy(() => import("./pages/dashboard"));
const PatientList = lazy(() => import("./pages/patient-list"));
const PatientDetail = lazy(() => import("./pages/patient-detail"));
const AddDentalRecord = lazy(() => import("./pages/add-dental-record"));
const DentalRecordDetail = lazy(() => import("./pages/dental-record-detail"));
const EditDentalRecord = lazy(() => import("./pages/edit-dental-record"));
const InventoryList = lazy(() => import("./pages/inventory-list"));
const AddItem = lazy(() => import("./pages/add-item"));
const InventoryDetail = lazy(() => import("./pages/inventory-detail"));
const EditItem = lazy(() => import("./pages/edit-item"));
const StaffList = lazy(() => import("./pages/staff-list"));
const AddStaff = lazy(() => import("./pages/add-staff"));
const StaffDetail = lazy(() => import("./pages/staff-detail"));
const EditStaff = lazy(() => import("./pages/edit-staff"));
const ProfilePage = lazy(() => import("./pages/profile-page"));
const Appointments = lazy(() => import("./pages/appointments"));
const DoctorSchedule = lazy(() => import("./pages/doctor-schedule"));
const EditPatientBio = lazy(() => import("./pages/EditPatientBio"));
const SetAppointmentPage = lazy(() => import("./pages/set-appointment"));
const RecordTransaction = lazy(() => import("./pages/RecordTransaction"));
const AllTransactions = lazy(() => import("./pages/AllTransactions"));
const InvoicePage = lazy(() => import("./pages/InvoicePage"));
const PatientReceiptsPage = lazy(() => import("./pages/PatientReceiptsPage"));
const RevenueReportPage = lazy(() => import("./pages/RevenueReportPage"));
const SettingsPage = lazy(() => import("./pages/settings"));
const AnalyticsPage = lazy(() => import("./pages/analytics-page"));
const BroadcastPage = lazy(() => import("./pages/BroadcastPage"));
const Bookings = lazy(() => import("./pages/bookings"));
const DailyReport = lazy(() => import("./pages/daily-report")); // NEW IMPORT

function App() {
  return (
    <Suspense fallback={<Loader />}>
      <Router>
        <ToastContainer
          position="top-right"
          autoClose={5000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
        />
        <div className="App">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/appointments" element={<Appointments />} />
            <Route path="/doctor-schedule" element={<DoctorSchedule />} />
            
            {/* Patient Routes */}
            <Route path="/patients" element={<PatientList />} />
            <Route path="/patients/:patientId" element={<PatientDetail />} />
            <Route path="/patients/:patientId/records/new" element={<AddDentalRecord />} />
            <Route path="/patients/:patientId/records/:recordId" element={<DentalRecordDetail />} />
            <Route path="/patients/:patientId/records/:recordId/edit" element={<EditDentalRecord />} />
            <Route path="/patients/:patientId/receipts" element={<PatientReceiptsPage />} />
            <Route path="/patients/:patientId/invoice" element={<InvoicePage />} />
            <Route path="/patients/:patientId/edit" element={<EditPatientBio />} />
            <Route path="/patients/:patientId/set-appointment" element={<SetAppointmentPage />} />

            {/* Inventory Management Routes */}
            <Route path="/inventory/items" element={<InventoryList />} />
            <Route path="/inventory/items/new" element={<AddItem />} />
            <Route path="/inventory/items/:itemId" element={<InventoryDetail />} />
            <Route path="/inventory/items/:itemId/edit" element={<EditItem />} />

            {/* Inventory Transaction Routes */}
            <Route path="/inventory/transactions/record" element={<RecordTransaction />} />
            <Route path="/inventory/transactions" element={<AllTransactions />} />

            {/* Staff Management Routes */}
            <Route path="/admin/staff-management" element={<StaffList />} />
            <Route path="/admin/staff-management/new" element={<AddStaff />} />
            <Route path="/admin/staff-management/:userId" element={<StaffDetail />} />
            <Route path="/admin/staff-management/:userId/edit" element={<EditStaff />} />

            {/* Revenue Report Route */}
            <Route path="/revenue-report" element={<RevenueReportPage />} />

            {/* Daily Report Route - NEW */}
            <Route path="/daily-report" element={<DailyReport />} />

            {/* Settings Route */}
            <Route path="/settings" element={<SettingsPage />} />

            {/* Analytics Route */}
            <Route path="/analytics" element={<AnalyticsPage />} />

            {/* Broadcast Route */}
            <Route path="/broadcast" element={<BroadcastPage />} />

            {/* Bookings Route */}
            <Route path="/bookings" element={<Bookings />} />

          </Routes>
        </div>
      </Router>
    </Suspense>
  );
}

export default App;
