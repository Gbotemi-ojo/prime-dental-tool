// src/App.jsx
import { lazy, Suspense } from "react";
import "bootstrap/dist/css/bootstrap.min.css"; // Ensure Bootstrap CSS is available
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import NavBar from "./components/Navbar/Navbar"; // Assuming you have this component
import Footer from "./components/Footer/Footer"; // Assuming you have this component
import Loader from "./components/Loader/Loader"; // Assuming you have a Loader component for Suspense fallback
import { ToastContainer } from "react-toastify"; // For notifications
import "react-toastify/dist/ReactToastify.css"; // CSS for react-toastify

// Lazy-loaded page components for better performance
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
const RecordTransaction = lazy(() => import("./pages/RecordTransaction"));
const AllTransactions = lazy(() => import("./pages/AllTransactions"));
const Shop = lazy(() => import("./pages/Shop"));
const Cart = lazy(() => import("./pages/Cart"));
const Product = lazy(() => import("./pages/Product"));
const BlogList = lazy(() => import("./pages/Bloglist"));
const BlogDetail = lazy(() => import("./pages/Blogdetail"));
const Privacy = lazy(() => import("./pages/privacy"));
const Terms = lazy(() => import("./pages/terms"));
// NEW: Lazy-load Patient Receipts component
const PatientReceiptsPage = lazy(() => import("./pages/PatientReceiptsPage"));


function App() {
  return (
    // Suspense provides a fallback (Loader) while lazy-loaded components are loading
    <Suspense fallback={<Loader />}>
      <Router>
        {/* ToastContainer for displaying notifications (e.g., success/error messages) */}
        <ToastContainer
          position="top-right"
          autoClose={1000} // Close after 1 second
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="light"
        />

        {/* Optional: Include your Navbar component here if it's part of your global layout */}
        {/* <NavBar /> */}

        {/* main-content-offset can be used to push content below a fixed header/navbar */}
        <div className="main-content-offset">
          <Routes>
            {/* Define all your application routes here */}

            {/* Home Page */}
            <Route path="/" element={<Home />} />

            {/* Authentication & Dashboard */}
            <Route path="/login" element={<Login />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/profile" element={<ProfilePage />} />

            {/* Patient Management Routes */}
            <Route path="/patients" element={<PatientList />} />
            <Route path="/patients/:patientId" element={<PatientDetail />} />
            <Route path="/patients/:patientId/dental-records/new" element={<AddDentalRecord />} />
            <Route path="/patients/:patientId/dental-records/:recordId" element={<DentalRecordDetail />} />
            <Route path="/patients/:patientId/dental-records/:recordId/edit" element={<EditDentalRecord />} />
            {/* NEW: Patient Receipts Route */}
            <Route path="/patients/:patientId/receipts" element={<PatientReceiptsPage />} />


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

            {/* Shop/Product Routes */}
            <Route path="/shop" element={<Shop />} />
            <Route path="/shop/:id" element={<Product />} />
            <Route path="/cart" element={<Cart />} />

            {/* Blog & Static Pages */}
            <Route path="/bloglist" element={<BlogList />} />
            <Route path="/blogdetail/:id" element={<BlogDetail />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/terms" element={<Terms />} />

            {/* Optional: Catch-all route for 404 Not Found pages */}
            {/* <Route path="*" element={<NotFound />} /> */}
          </Routes>
        </div>

        {/* Optional: Include your Footer component here if it's part of your global layout */}
        {/* <Footer /> */}
      </Router>
    </Suspense>
  );
}

export default App;
