import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import API_BASE_URL from '../config/api';
import './revenue-report-page.css'; 

// --- HELPER FUNCTIONS FOR UTC DATES ---
const getTodayUTCString = () => {
    const today = new Date();
    const year = today.getUTCFullYear();
    const month = String(today.getUTCMonth() + 1).padStart(2, '0');
    const day = String(today.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const getCurrentUTCMonthString = () => {
    const today = new Date();
    const year = today.getUTCFullYear();
    const month = String(today.getUTCMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
};

const getStartOfWeekUTC = (date) => {
    const d = new Date(date.getTime()); 
    const dayOfWeekUTC = d.getUTCDay();
    d.setUTCDate(d.getUTCDate() - dayOfWeekUTC);
    d.setUTCHours(0, 0, 0, 0);
    return d;
};


export default function RevenueReportPage() {
    const navigate = useNavigate();
    const [allReceipts, setAllReceipts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [userRole, setUserRole] = useState(null);

    const [selectedPeriod, setSelectedPeriod] = useState('month');
    const [filterDate, setFilterDate] = useState(getCurrentUTCMonthString());
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

            if (!token) return;

            try {
                // FIXED: Use specific endpoint to fetch ONLY debtors
                const response = await fetch(`${API_BASE_URL}/api/patients/debtors`, { 
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (response.ok) {
                    const debtors = await response.json(); // Array of patients
                    let total = 0;
                    
                    debtors.forEach(p => {
                        const amount = parseFloat(p.outstanding);
                        if (!isNaN(amount)) total += amount;
                    });

                    setOutstandingData({ patients: debtors, total: total });
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
    }, []); 

    useEffect(() => {
        if (allReceipts.length === 0) {
            setTotalRevenue(0);
            return;
        }

        let sum = 0;
        const currentFilterDateObj = filterDate ? new Date(`${filterDate}T00:00:00.000Z`) : null;
        
        allReceipts.forEach(row => {
            const rowDateStr = row[DATE_COLUMN_INDEX];
            const rowAmountStr = row[AMOUNT_COLUMN_INDEX];

            if (!rowDateStr || rowDateStr === 'N/A' || !rowAmountStr || rowAmountStr === 'N/A') {
                return;
            }
            
            const rowDate = new Date(rowDateStr);
            const amount = parseFloat(rowAmountStr);

            if (isNaN(rowDate.getTime())) {
                return;
            }

            if (isNaN(amount)) {
                return;
            }

            let includeRow = false;

            switch (selectedPeriod) {
                case 'day':
                    if (currentFilterDateObj &&
                        rowDate.getUTCFullYear() === currentFilterDateObj.getUTCFullYear() &&
                        rowDate.getUTCMonth() === currentFilterDateObj.getUTCMonth() &&
                        rowDate.getUTCDate() === currentFilterDateObj.getUTCDate()) {
                        includeRow = true;
                    }
                    break;
                case 'week':
                    if (currentFilterDateObj) {
                        const startOfWeekRow = getStartOfWeekUTC(rowDate);
                        const startOfWeekFilter = getStartOfWeekUTC(currentFilterDateObj);
                        if (startOfWeekRow.getTime() === startOfWeekFilter.getTime()) {
                            includeRow = true;
                        }
                    }
                    break;
                case 'month':
                    if (currentFilterDateObj &&
                        rowDate.getUTCMonth() === currentFilterDateObj.getUTCMonth() &&
                        rowDate.getUTCFullYear() === currentFilterDateObj.getUTCFullYear()) {
                        includeRow = true;
                    }
                    break;
                case 'year':
                    if (currentFilterDateObj && rowDate.getUTCFullYear() === currentFilterDateObj.getUTCFullYear()) {
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
        
        switch (newPeriod) {
            case 'day': setFilterDate(getTodayUTCString()); break;
            case 'week': setFilterDate(getTodayUTCString()); break; 
            case 'month': setFilterDate(getCurrentUTCMonthString()); break;
            case 'year': setFilterDate(new Date().getUTCFullYear().toString()); break;
            case 'all': setFilterDate(''); break;
            default: setFilterDate(getTodayUTCString()); break;
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
                    {selectedPeriod === 'week' && ` week of ${filterDate ? new Date(`${filterDate}T00:00:00.000Z`).toLocaleDateString() : ''}`}
                    {selectedPeriod === 'month' && ` month of ${filterDate}`}
                    {selectedPeriod === 'year' && ` year ${filterDate}`}
                    {selectedPeriod === 'all' && ` All Time`}
                </p>
            </section>

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
