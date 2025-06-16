import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import API_BASE_URL from '../config/api';
import './revenue-report-page.css'; // Import the new CSS file

export default function RevenueReportPage() {
    const navigate = useNavigate();
    const [allReceipts, setAllReceipts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [userRole, setUserRole] = useState(null); // To check user role for access

    // State for selected time period and calculated total
    const [selectedPeriod, setSelectedPeriod] = useState('month'); // Default to month view
    const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0].substring(0, 7)); // Default to current month (YYYY-MM)
    const [totalRevenue, setTotalRevenue] = useState(0);

    // Column indices (based on your Google Sheet headers in Sheet2!A:J)
    // Receipt Date: 0 (Column A)
    // Total Due From Patient (₦): 7 (Column H)
    const DATE_COLUMN_INDEX = 0;
    const AMOUNT_COLUMN_INDEX = 7;

    useEffect(() => {
        const fetchRevenueData = async () => {
            setLoading(true);
            setError(null);

            const token = localStorage.getItem('jwtToken');
            const role = localStorage.getItem('role');
            setUserRole(role);

            if (!token) {
                toast.error('Authentication required. Please log in.');
                navigate('/login');
                return;
            }

            if (role !== 'owner' && role !== 'staff') { // Allow staff to view reports as well
                toast.error('Access denied. Only Owners and Staff can view this report.');
                navigate('/dashboard'); // Redirect to dashboard if not authorized
                return;
            }

            try {
                const response = await fetch(`${API_BASE_URL}/api/receipts/revenue-report`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (response.ok) {
                    const data = await response.json();
                    // Assuming the first row is headers, slice the array to get only data rows
                    const dataRows = data.slice(1);
                    setAllReceipts(dataRows);
                } else {
                    const errorData = await response.json();
                    setError(errorData.error || 'Failed to fetch revenue data.');
                    toast.error(`Error fetching revenue data: ${errorData.error || 'Unknown error'}`);
                }
            } catch (err) {
                setError('Network error. Could not connect to the server.');
                toast.error('Network error fetching revenue data.');
                console.error('Network Error:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchRevenueData();
    }, [navigate]); // navigate is a dependency

    // Effect to recalculate total revenue whenever `allReceipts`, `selectedPeriod`, or `filterDate` changes
    useEffect(() => {
        if (allReceipts.length === 0) {
            setTotalRevenue(0);
            return;
        }

        let sum = 0;
        const currentFilterDateObj = filterDate ? new Date(filterDate) : null;

        allReceipts.forEach(row => {
            const rowDateStr = row[DATE_COLUMN_INDEX];
            const rowAmountStr = row[AMOUNT_COLUMN_INDEX];

            // Basic validation for row data
            if (!rowDateStr || rowDateStr === 'N/A' || !rowAmountStr || rowAmountStr === 'N/A') {
                return; // Skip rows with missing or 'N/A' date or amount
            }

            const rowDate = new Date(rowDateStr); // Example: "2025-06-16"
            const amount = parseFloat(rowAmountStr);

            if (isNaN(amount)) {
                console.warn(`Invalid amount found in row: "${rowAmountStr}". Skipping.`);
                return; // Skip if amount is not a valid number
            }

            let includeRow = false;

            switch (selectedPeriod) {
                case 'day':
                    // Compare YYYY-MM-DD
                    if (currentFilterDateObj &&
                        rowDate.getFullYear() === currentFilterDateObj.getFullYear() &&
                        rowDate.getMonth() === currentFilterDateObj.getMonth() &&
                        rowDate.getDate() === currentFilterDateObj.getDate()) {
                        includeRow = true;
                    }
                    break;
                case 'week':
                    if (currentFilterDateObj) {
                        // Calculate the start of the week (Sunday) for both dates
                        const getStartOfWeek = (date) => {
                            const d = new Date(date);
                            d.setHours(0, 0, 0, 0); // Reset time to start of day
                            d.setDate(d.getDate() - d.getDay()); // Adjust to Sunday (0)
                            return d;
                        };
                        const startOfWeekRow = getStartOfWeek(rowDate);
                        const startOfWeekFilter = getStartOfWeek(currentFilterDateObj);

                        if (startOfWeekRow.getTime() === startOfWeekFilter.getTime()) {
                            includeRow = true;
                        }
                    }
                    break;
                case 'month':
                    // For month input, filterDate will be YYYY-MM
                    if (currentFilterDateObj &&
                        rowDate.getMonth() === currentFilterDateObj.getMonth() &&
                        rowDate.getFullYear() === currentFilterDateObj.getFullYear()) {
                        includeRow = true;
                    }
                    break;
                case 'year':
                    // For year input, filterDate will be YYYY
                    if (currentFilterDateObj && rowDate.getFullYear() === currentFilterDateObj.getFullYear()) {
                        includeRow = true;
                    }
                    break;
                case 'all':
                default:
                    includeRow = true; // Include all records
                    break;
            }

            if (includeRow) {
                sum += amount;
            }
        });
        setTotalRevenue(sum);
    }, [allReceipts, selectedPeriod, filterDate]); // Re-run effect if these states change

    const handlePeriodChange = (e) => {
        const newPeriod = e.target.value;
        setSelectedPeriod(newPeriod);
        // Set default filterDate based on new period
        const today = new Date();
        switch (newPeriod) {
            case 'day':
                setFilterDate(today.toISOString().split('T')[0]); // YYYY-MM-DD
                break;
            case 'month':
                setFilterDate(today.toISOString().split('T')[0].substring(0, 7)); // YYYY-MM
                break;
            case 'year':
                setFilterDate(today.getFullYear().toString()); // YYYY
                break;
            case 'all':
                setFilterDate(''); // No specific date filter for 'all time'
                break;
            default:
                setFilterDate(today.toISOString().split('T')[0]);
                break;
        }
    };

    const handleFilterDateChange = (e) => {
        setFilterDate(e.target.value);
    };

    if (loading) {
        return (
            <div className="revenue-report-container">
                <div className="loading-state">
                    <p>Loading revenue data...</p>
                    <div className="spinner"></div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="revenue-report-container">
                <div className="error-state">
                    <p>Error: {error}</p>
                    <button onClick={() => navigate('/dashboard')} className="back-button">
                        <i className="fas fa-arrow-left"></i> Back to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    // Role-based access check after loading and error handling
    if (userRole !== 'owner' && userRole !== 'staff') {
        return (
            <div className="revenue-report-container">
                <div className="access-denied">
                    <p>Access Denied. You do not have permission to view this report.</p>
                    <button onClick={() => navigate('/dashboard')} className="back-button">
                        <i className="fas fa-arrow-left"></i> Back to Dashboard
                    </button>
                </div>
            </div>
        );
    }


    return (
        <div className="revenue-report-container">
            <header className="revenue-report-header">
                <h1>Revenue Report</h1>
                <button onClick={() => navigate('/dashboard')} className="back-button">
                    <i className="fas fa-arrow-left"></i> Back to Dashboard
                </button>
            </header>

            <section className="controls-section">
                <div className="control-group">
                    <label htmlFor="period-select">View by:</label>
                    <select id="period-select" value={selectedPeriod} onChange={handlePeriodChange} className="form-select">
                        <option value="day">Day</option>
                        <option value="week">Week</option>
                        <option value="month">Month</option>
                        <option value="year">Year</option>
                        <option value="all">All Time</option>
                    </select>
                </div>

                {(selectedPeriod === 'day' || selectedPeriod === 'month' || selectedPeriod === 'year') && (
                    <div className="control-group date-filter-group">
                        <label htmlFor="filter-date">
                            {selectedPeriod === 'day' && 'Select Date:'}
                            {selectedPeriod === 'month' && 'Select Month:'}
                            {selectedPeriod === 'year' && 'Select Year:'}
                        </label>
                        <input
                            type={selectedPeriod === 'day' ? 'date' : selectedPeriod === 'month' ? 'month' : 'number'}
                            id="filter-date"
                            value={filterDate}
                            onChange={handleFilterDateChange}
                            className="form-control"
                            // Set min/max for year for better usability
                            min={selectedPeriod === 'year' ? "1900" : undefined}
                            max={selectedPeriod === 'year' ? "2100" : undefined}
                            // For month type, value format is "YYYY-MM"
                            // For date type, value format is "YYYY-MM-DD"
                        />
                    </div>
                )}
                {selectedPeriod === 'week' && (
                     <div className="control-group date-filter-group">
                        <label htmlFor="filter-date-week">Select a date in the week:</label>
                        <input
                            type="date"
                            id="filter-date-week"
                            value={filterDate} // For week, still a single date for selection
                            onChange={handleFilterDateChange}
                            className="form-control"
                        />
                         <p className="filter-hint">Selecting a date will show revenue for its entire week.</p>
                     </div>
                )}
            </section>

            <section className="total-revenue-section">
                <h2>Total Revenue: <span className="revenue-amount">₦{totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></h2>
                <p className="period-display">
                    For the
                    {selectedPeriod === 'day' && ` day of ${filterDate}`}
                    {selectedPeriod === 'week' && ` week of ${filterDate ? new Date(filterDate).toLocaleDateString() : ''}`}
                    {selectedPeriod === 'month' && ` month of ${filterDate}`}
                    {selectedPeriod === 'year' && ` year ${filterDate}`}
                    {selectedPeriod === 'all' && ` All Time`}
                </p>
            </section>

            {/* Optional: Display raw data or filtered data for debugging */}
            {/* <section className="raw-data-section">
                <h3>Raw Data (First 5 Rows for Debugging):</h3>
                <pre>{JSON.stringify(allReceipts.slice(0, 5), null, 2)}</pre>
            </section> */}
        </div>
    );
}
