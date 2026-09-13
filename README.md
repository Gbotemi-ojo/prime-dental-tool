# Prime Dental - Clinic Management System

A comprehensive, full-stack Electronic Medical Record (EMR) and practice management web application built to streamline operations for dental clinics. This platform handles patient lifecycle management, clinical charting, inventory tracking, financial reporting, and staff administration[cite: 1].

## Core Features

*   **Patient Management & EMR:** Register new and returning patients, manage family accounts, and track detailed medical history including specific medication tags for underlying conditions like Asthma, Diabetes, and Heart Disease[cite: 1].
*   **Clinical Dental Records:** Interactive oral charting with quadrant-based tracking (Q1-Q4) for teeth present, carious cavities, filled, missing, and fractured teeth[cite: 1].
*   **Scheduling & Appointments:** Dedicated doctor's schedule view, appointment interval setting, and automated reminder emails for specific treatments including Scaling & Polishing, Root Canal, and Post-Extraction[cite: 1].
*   **Inventory & Stock Control:** Track dental instruments, pharmaceuticals, and office supplies. Monitor current stock, unit prices, reorder levels, and log stock-in, stock-out, and adjustment transactions[cite: 1].
*   **Financial & Analytics Dashboard:** Visual data representation using Recharts to track patient flow, common diagnoses, revenue, and doctor performance[cite: 1]. Generates detailed daily operational reports tracking new patients, HMO patients, and revenue split by Cash, POS, and Transfers[cite: 1].
*   **Broadcast Center:** Send custom email broadcasts, targeted birthday wishes, and direct messages to patients, or export patient phone numbers for SMS campaigns[cite: 1].
*   **Role-Based Access Control:** Secure routes and customized views tailored for Owners, Doctors, Nurses, and Staff[cite: 1].

## Technology Stack

*   **Frontend Framework:** React 18+ utilizing `lazy` and `Suspense` for efficient code-splitting and load times[cite: 1].
*   **Routing:** React Router v6 (`react-router-dom`) managing extensive nested clinic routes[cite: 1].
*   **State Management:** Redux (`react-redux`) mapped via `src/app/store.js`[cite: 1].
*   **UI & Styling:** Bootstrap for core layout structure, paired with extensive custom CSS utilizing CSS Variables, flexbox grids, and Glassmorphism design principles[cite: 1].
*   **Data Visualization:** Recharts handling dynamic Bar, Line, and Pie charts for clinical and financial analytics[cite: 1].
*   **Alerts & Notifications:** React Toastify for sleek, non-blocking user feedback[cite: 1].

## Getting Started

### Prerequisites
*   Node.js (v14 or higher recommended)
*   npm or yarn package manager

### Installation
1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd prime-dental-frontend
    ```
2.  **Install dependencies:**
    ```bash
    npm install
    ```
3.  **Environment Configuration:**
    Ensure your API configuration in `src/config/api.js` points to your running backend server environment[cite: 1].

4.  **Run the application:**
    ```bash
    npm start
    ```
    The application will launch in development mode, typically accessible at `http://localhost:3000`.

## Project Structure

The codebase follows a modular, feature-based page architecture[cite: 1]:
*   `/src/components/` - Contains reusable UI components like Loaders and Toast containers[cite: 1].
*   `/src/pages/` - Core application views organized by domain:
    *   **Overview & Data:** `dashboard.jsx`, `analytics-page.jsx`, `daily-report.jsx`, `RevenueReportPage.jsx`[cite: 1].
    *   **Patient EMR:** `patient-list.jsx`, `patient-detail.jsx`, `add-dental-record.jsx`, `edit-dental-record.jsx`, `EditPatientBio.jsx`[cite: 1].
    *   **Inventory:** `inventory-list.jsx`, `add-item.jsx`, `AllTransactions.jsx`, `RecordTransaction.jsx`[cite: 1].
    *   **Scheduling:** `appointments.jsx`, `doctor-schedule.jsx`, `bookings.jsx`[cite: 1].
    *   **Communications:** `BroadcastPage.jsx`[cite: 1].
    *   **Administration:** `staff-list.jsx`, `add-staff.jsx`, `settings.jsx`[cite: 1].

## Author
**Ojo Gbotemi Samuel**