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
    const [userRole, setUserRole] = useState(null);

    const [selectedPeriod, setSelectedPeriod] = useState('month');
    const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0].substring(0, 7));
    const [totalRevenue, setTotalRevenue] = useState(0);

    // NEW: State for outstanding payments
    const [outstandingData, setOutstandingData] = useState({ patients: [], total: 0 });
    const [outstandingLoading, setOutstandingLoading] = useState(true);

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

            if (role !== 'owner' && role !== 'staff') {
                toast.error('Access denied. Only Owners and Staff can view this report.');
                navigate('/dashboard');
                return;
            }

            try {
                const response = await fetch(`${API_BASE_URL}/api/receipts/revenue-report`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (response.ok) {
                    const data = await response.json();
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
    }, [navigate]);

    // NEW: Effect to fetch outstanding patient data
    useEffect(() => {
        const fetchOutstandingData = async () => {
            setOutstandingLoading(true);
            const token = localStorage.getItem('jwtToken');

            // No need to re-check role, as it's handled in the first effect
            if (!token) return;

            try {
                // This new endpoint should return all patients from your primary database
                const response = await fetch(`${API_BASE_URL}/api/patients`, { // Assuming endpoint is /api/patients
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (response.ok) {
                    const patients = await response.json();
                    let total = 0;
                    // Filter for patients with an outstanding balance > 0
                    const owingPatients = patients.filter(p => {
                        const outstandingAmount = parseFloat(p.outstanding);
                        if (!isNaN(outstandingAmount) && outstandingAmount > 0) {
                            total += outstandingAmount;
                            return true;
                        }
                        return false;
                    });

                    // Sort patients by the highest outstanding amount
                    owingPatients.sort((a, b) => parseFloat(b.outstanding) - parseFloat(a.outstanding));

                    setOutstandingData({ patients: owingPatients, total: total });
                } else {
                    toast.error('Failed to fetch outstanding patient data.');
                }
            } catch (err) {
                toast.error('Network error fetching outstanding data.');
                console.error('Network Error:', err);
            } finally {
                setOutstandingLoading(false);
            }
        };

        fetchOutstandingData();
    }, []); // Runs once on component mount

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

            if (!rowDateStr || rowDateStr === 'N/A' || !rowAmountStr || rowAmountStr === 'N/A') {
                return;
            }

            const rowDate = new Date(rowDateStr);
            const amount = parseFloat(rowAmountStr);

            if (isNaN(amount)) {
                console.warn(`Invalid amount found in row: "${rowAmountStr}". Skipping.`);
                return;
            }

            let includeRow = false;

            switch (selectedPeriod) {
                case 'day':
                    if (currentFilterDateObj &&
                        rowDate.getFullYear() === currentFilterDateObj.getFullYear() &&
                        rowDate.getMonth() === currentFilterDateObj.getMonth() &&
                        rowDate.getDate() === currentFilterDateObj.getDate()) {
                        includeRow = true;
                    }
                    break;
                case 'week':
                    if (currentFilterDateObj) {
                        const getStartOfWeek = (date) => {
                            const d = new Date(date);
                            d.setHours(0, 0, 0, 0);
                            d.setDate(d.getDate() - d.getDay());
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
                    if (currentFilterDateObj &&
                        rowDate.getMonth() === currentFilterDateObj.getMonth() &&
                        rowDate.getFullYear() === currentFilterDateObj.getFullYear()) {
                        includeRow = true;
                    }
                    break;
                case 'year':
                    if (currentFilterDateObj && rowDate.getFullYear() === currentFilterDateObj.getFullYear()) {
                        includeRow = true;
                    }
                    break;
                case 'all':
                default:
                    includeRow = true;
                    break;
            }

            if (includeRow) {
                sum += amount;
            }
        });
        setTotalRevenue(sum);
    }, [allReceipts, selectedPeriod, filterDate]);

    const handlePeriodChange = (e) => {
        const newPeriod = e.target.value;
        setSelectedPeriod(newPeriod);
        const today = new Date();
        switch (newPeriod) {
            case 'day': setFilterDate(today.toISOString().split('T')[0]); break;
            case 'month': setFilterDate(today.toISOString().split('T')[0].substring(0, 7)); break;
            case 'year': setFilterDate(today.getFullYear().toString()); break;
            case 'all': setFilterDate(''); break;
            default: setFilterDate(today.toISOString().split('T')[0]); break;
        }
    };

    const handleFilterDateChange = (e) => {
        setFilterDate(e.target.value);
    };

    if (loading) {
        return (
            <div className="revenue-report-container">
                <div className="loading-state"><p>Loading revenue data...</p><div className="spinner"></div></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="revenue-report-container">
                <div className="error-state">
                    <p>Error: {error}</p>
                    <button onClick={() => navigate('/dashboard')} className="back-button"><i className="fas fa-arrow-left"></i> Back to Dashboard</button>
                </div>
            </div>
        );
    }
    
    if (userRole !== 'owner' && userRole !== 'staff') {
        return (
            <div className="revenue-report-container">
                <div className="access-denied">
                    <p>Access Denied. You do not have permission to view this report.</p>
                    <button onClick={() => navigate('/dashboard')} className="back-button"><i className="fas fa-arrow-left"></i> Back to Dashboard</button>
                </div>
            </div>
        );
    }

    return (
        <div className="revenue-report-container">
            <header className="revenue-report-header">
                <h1>Revenue & Receivables</h1>
                <button onClick={() => navigate('/dashboard')} className="back-button">
                    <i className="fas fa-arrow-left"></i> Back to Dashboard
                </button>
            </header>

            <section className="controls-section">
                <div className="control-group">
                    <label htmlFor="period-select">View Revenue by:</label>
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
                            id="filter-date" value={filterDate} onChange={handleFilterDateChange} className="form-control"
                            min={selectedPeriod === 'year' ? "1900" : undefined} max={selectedPeriod === 'year' ? "2100" : undefined}
                        />
                    </div>
                )}
                {selectedPeriod === 'week' && (
                     <div className="control-group date-filter-group">
                        <label htmlFor="filter-date-week">Select a date in the week:</label>
                        <input type="date" id="filter-date-week" value={filterDate} onChange={handleFilterDateChange} className="form-control" />
                         <p className="filter-hint">Shows revenue for the entire week of the selected date.</p>
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

            {/* NEW: Outstanding Balances Section */}
            <section className="outstanding-section">
                <div className="total-outstanding-section">
                    <h2>Total Outstanding: <span className="outstanding-amount">₦{outstandingData.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></h2>
                    <p className="period-display">Across {outstandingData.patients.length} patient(s)</p>
                </div>

                {outstandingLoading ? (
                    <div className="loading-state small"><div className="spinner"></div><p>Loading outstanding balances...</p></div>
                ) : outstandingData.patients.length > 0 ? (
                    <div className="patients-table-container">
                        <table className="patients-table">
                            <thead>
                                <tr>
                                    <th>Patient Name</th>
                                    <th>Phone Number</th>
                                    <th>Outstanding Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                {outstandingData.patients.map(patient => (
                                    <tr key={patient.id}>
                                        <td>{patient.name}</td>
                                        <td>{patient.phoneNumber || 'N/A'}</td>
                                        <td className="amount-cell">₦{parseFloat(patient.outstanding).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <p className="no-data-message">No patients with outstanding balances found.</p>
                )}
            </section>
        </div>
    );
}