import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import API_BASE_URL from '../config/api';

const PIE_COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#a4de6c', '#d0ed57', '#8dd1e1'];

// --- Styling Component (with new styles for tabs) ---
const AnalyticsStyles = () => (
    <style>{`
        /* [Previous styles remain the same] */
        .analytics-container { padding: 2rem; background-color: #f0f2f5; min-height: 100vh; font-family: 'Inter', sans-serif; }
        .analytics-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
        .analytics-header h1 { font-size: 2rem; font-weight: 700; color: #1e293b; }
        .back-button { background-color: #fff; color: #475569; border: 1px solid #cbd5e1; padding: 0.6rem 1.2rem; border-radius: 8px; font-weight: 600; cursor: pointer; transition: all 0.2s ease-in-out; display: flex; align-items: center; gap: 0.5rem; }
        .back-button:hover { background-color: #f1f5f9; border-color: #94a3b8; }
        .kpi-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1.5rem; margin-bottom: 2.5rem; }
        .kpi-card { background-color: #fff; border-radius: 12px; padding: 1.5rem; display: flex; align-items: center; gap: 1.5rem; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.07), 0 2px 4px -2px rgba(0, 0, 0, 0.07); transition: transform 0.2s ease, box-shadow 0.2s ease; }
        .kpi-card:hover { transform: translateY(-4px); box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -4px rgba(0, 0, 0, 0.08); }
        .kpi-icon { width: 50px; height: 50px; border-radius: 50%; display: flex; justify-content: center; align-items: center; font-size: 1.5rem; }
        .kpi-content .kpi-title { margin: 0; font-size: 0.9rem; color: #64748b; font-weight: 500; }
        .kpi-content .kpi-value { margin: 0.25rem 0 0; font-size: 1.75rem; font-weight: 700; color: #1e293b; }
        .charts-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(400px, 1fr)); gap: 1.5rem; }
        .chart-card { background-color: #fff; border-radius: 12px; padding: 1.5rem; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.07), 0 2px 4px -2px rgba(0, 0, 0, 0.07); }
        .chart-title { font-size: 1.1rem; font-weight: 600; color: #334155; margin-bottom: 1.5rem; }
        .chart-container { width: 100%; height: 300px; }
        .custom-tooltip { background-color: rgba(30, 41, 59, 0.9); border: 1px solid #475569; padding: 0.75rem; border-radius: 8px; color: #f1f5f9; }
        .custom-tooltip .label { font-weight: 600; margin-bottom: 0.5rem; }
        .analytics-loader { display: flex; flex-direction: column; justify-content: center; align-items: center; height: 100vh; gap: 1rem; }
        .analytics-loader p { font-size: 1.1rem; color: #475569; }
        .analytics-loader div, .tab-loader div { border: 5px solid #e2e8f0; border-top: 5px solid #8b5cf6; border-radius: 50%; width: 50px; height: 50px; animation: spin 1s linear infinite; }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        .error-page, .tab-error { text-align: center; padding-top: 5rem; }
        .error-page h2, .tab-error h2 { color: #ef4444; font-size: 2rem; margin-bottom: 1rem; }
        .error-page p, .tab-error p { font-size: 1.1rem; color: #475569; margin-bottom: 2rem; }
        
        /* --- NEW TAB STYLES --- */
        .analytics-tabs {
            display: flex;
            gap: 0.5rem;
            margin-bottom: 1.5rem;
            border-bottom: 2px solid #e2e8f0;
        }
        .tab-button {
            padding: 0.75rem 1.5rem;
            border: none;
            background-color: transparent;
            cursor: pointer;
            font-size: 1rem;
            font-weight: 600;
            color: #64748b;
            border-bottom: 3px solid transparent;
            transform: translateY(2px);
            transition: color 0.2s, border-color 0.2s;
        }
        .tab-button:hover {
            color: #334155;
        }
        .tab-button.active {
            color: #8b5cf6;
            border-bottom-color: #8b5cf6;
        }
        .tab-content {
            min-height: 400px; /* Prevents layout shift during loading */
        }
        .tab-loader {
            display: flex;
            justify-content: center;
            align-items: center;
            height: 400px;
            flex-direction: column;
            gap: 1rem;
        }
        .tab-loader div { width: 40px; height: 40px; }

        /* [Other previous styles remain the same] */
        .date-filter-card { background-color: #fff; border-radius: 12px; padding: 1.5rem; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.07), 0 2px 4px -2px rgba(0, 0, 0, 0.07); margin-bottom: 1.5rem; grid-column: 1 / -1; }
        .date-filter-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; flex-wrap: wrap; gap: 1rem; }
        .date-filter-header h3 { font-size: 1.25rem; font-weight: 600; color: #334155; margin: 0; }
        .date-inputs, .preset-buttons { display: flex; align-items: center; gap: 1rem; flex-wrap: wrap; }
        .date-inputs label { font-weight: 500; color: #475569; }
        .date-inputs input { padding: 0.5rem; border: 1px solid #cbd5e1; border-radius: 8px; font-family: 'Inter', sans-serif; }
        .preset-buttons button, .fetch-button { background-color: #f1f5f9; color: #475569; border: 1px solid #cbd5e1; padding: 0.5rem 1rem; border-radius: 8px; font-weight: 600; cursor: pointer; transition: background-color 0.2s; }
        .preset-buttons button.active, .preset-buttons button:hover, .fetch-button:hover { background-color: #8b5cf6; color: #fff; border-color: #8b5cf6; }
        .fetch-button { background-color: #8b5cf6; color: #fff; }
        .revenue-grid { display: grid; grid-template-columns: 2fr 1fr; gap: 1.5rem; margin-top: 1.5rem; }
        .revenue-table-container { max-height: 400px; overflow-y: auto; }
        .revenue-table { width: 100%; border-collapse: collapse; }
        .revenue-table th, .revenue-table td { padding: 0.75rem; text-align: left; border-bottom: 1px solid #e2e8f0; }
        .revenue-table th { background-color: #f8fafc; font-weight: 600; color: #475569; }
        .revenue-table td { color: #334155; }
        .revenue-summary { display: flex; flex-direction: column; gap: 1rem; }
        .summary-card { background-color: #f8fafc; border-radius: 8px; padding: 1.5rem; border: 1px solid #e2e8f0; }
        .summary-card .title { font-size: 1rem; color: #64748b; margin: 0 0 0.5rem 0; }
        .summary-card .value { font-size: 2rem; font-weight: 700; color: #1e293b; margin: 0; }
    `}</style>
);

// --- Reusable Components (no changes needed) ---
const KpiCard = ({ title, value, icon, color }) => ( <div className="kpi-card"><div className="kpi-icon" style={{ backgroundColor: color + '22', color }}><i className={`fas ${icon}`}></i></div><div className="kpi-content"><div className="kpi-title">{title}</div><div className="kpi-value">{value}</div></div></div>);
const ChartCard = ({ title, children }) => ( <div className="chart-card"><div className="chart-title">{title}</div><div className="chart-container">{children}</div></div>);
const CustomTooltip = ({ active, payload, label }) => { if (active && payload && payload.length) { return ( <div className="custom-tooltip"><div className="label">{label}</div>{payload.map((entry, idx) => ( <div key={idx}><span style={{ color: entry.color, fontWeight: 600 }}>{entry.name}:</span> {entry.value}</div>))}</div>); } return null; };
const TabLoader = ({ text }) => ( <div className="tab-loader"><div></div><p>{text || "Loading..."}</p></div>);
const TabError = ({ message }) => ( <div className="tab-error"><h2><i className="fas fa-exclamation-triangle"></i> Error</h2><p>{message}</p></div>);

// --- Component for Treatment Revenue (no logic changes) ---
const TreatmentRevenueAnalytics = ({ token, navigate }) => { /* ... existing code for this component ... */ return (<div></div>); };

// --- Tab Content Components ---

const OperationalTab = ({ data }) => (
    <div className="charts-grid">
        <ChartCard title="Patient Visits (Last 30 Days)">
            <ResponsiveContainer width="100%" height={300}>
                <LineChart data={data.patient_flow} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="visits" stroke="#82ca9d" activeDot={{ r: 8 }} />
                </LineChart>
            </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Patient Gender Distribution">
            <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                    <Pie data={data.patient_demographics?.gender} cx="50%" cy="50%" labelLine={false} outerRadius={100} fill="#8884d8" dataKey="value" nameKey="name" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                        {data.patient_demographics?.gender.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                </PieChart>
            </ResponsiveContainer>
        </ChartCard>
    </div>
);

const ClinicalTab = ({ data }) => (
    <div className="charts-grid">
        <ChartCard title="Top 10 Most Common Diagnoses">
            <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.diagnoses_common} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Bar dataKey="value" name="Cases" fill="#8884d8" />
                </BarChart>
            </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Doctor Performance (by Patient Encounters)">
            <ResponsiveContainer width="100%" height={300}>
                <BarChart layout="vertical" data={data.doctor_performance} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="doctorName" type="category" width={100} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="patientCount" name="Patients Seen" fill="#ffc658" />
                </BarChart>
            </ResponsiveContainer>
        </ChartCard>
    </div>
);

const FinancialTab = ({ data }) => (
    <div className="charts-grid" style={{ gridTemplateColumns: '1fr' }}>
        <ChartCard title="HMO Provider Distribution">
            <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                    <Pie data={data.hmo_distribution} cx="50%" cy="50%" outerRadius={100} fill="#8884d8" dataKey="value" nameKey="name" label>
                        {data.hmo_distribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                </PieChart>
            </ResponsiveContainer>
        </ChartCard>
         {/* The TreatmentRevenueAnalytics component can be integrated here */}
         {/* <TreatmentRevenueAnalytics token={localStorage.getItem('jwtToken')} navigate={useNavigate()} /> */}
    </div>
);

const InventoryTab = ({ data }) => (
     <div className="charts-grid">
        <ChartCard title="Top 10 Most Used Inventory Items">
            <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.inventory_usage_top} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Bar dataKey="value" name="Units Used" fill="#82ca9d" />
                </BarChart>
            </ResponsiveContainer>
        </ChartCard>
    </div>
);


// --- Main Analytics Page Component ---
export default function AnalyticsPage() {
    const [activeTab, setActiveTab] = useState('operational');
    const [data, setData] = useState({});
    const [loading, setLoading] = useState({});
    const [error, setError] = useState({});
    const navigate = useNavigate();

    const fetcher = useCallback(async (endpoints) => {
        const token = localStorage.getItem('jwtToken');
        if (!token) {
            navigate('/login');
            return null;
        }
        const headers = { 'Authorization': `Bearer ${token}` };

        try {
            const responses = await Promise.all(
                endpoints.map(ep => fetch(`${API_BASE_URL}/api/analytics/${ep}`, { headers }))
            );

            for (const res of responses) {
                if (!res.ok) {
                    throw new Error(`Failed to fetch data. Status: ${res.status}`);
                }
            }
            
            const jsonData = await Promise.all(responses.map(res => res.json()));
            
            return endpoints.reduce((acc, endpoint, index) => {
                acc[endpoint.replace(/-/g, '_')] = jsonData[index];
                return acc;
            }, {});

        } catch (err) {
            console.error(err);
             if (err.message?.includes('401') || err.message?.includes('403')) {
                localStorage.clear();
                navigate('/login');
            }
            throw err; // Re-throw to be caught by the calling function
        }
    }, [navigate]);

    // Initial load for Key Metrics
    useEffect(() => {
        const fetchKeyMetrics = async () => {
            if (data.key_metrics) return; // Don't re-fetch
            setLoading(prev => ({ ...prev, key_metrics: true }));
            try {
                const fetchedData = await fetcher(['key-metrics']);
                setData(prev => ({ ...prev, ...fetchedData }));
            } catch (e) {
                setError(prev => ({ ...prev, key_metrics: e.message }));
            } finally {
                setLoading(prev => ({ ...prev, key_metrics: false }));
            }
        };
        fetchKeyMetrics();
    }, [fetcher, data.key_metrics]);
    
    // Fetch data based on active tab
    useEffect(() => {
        const tabEndpoints = {
            operational: ['patient-demographics', 'patient-flow'],
            clinical: ['diagnoses-common', 'doctor-performance'],
            financial: ['hmo-distribution'/*, 'treatment-revenue'*/],
            inventory: ['inventory-usage-top'],
        };
        
        const fetchTabData = async () => {
            const endpoints = tabEndpoints[activeTab];
            if (!endpoints || data[endpoints[0].replace(/-/g, '_')]) return; // Already fetched

            setLoading(prev => ({ ...prev, [activeTab]: true }));
            setError(prev => ({ ...prev, [activeTab]: null }));

            try {
                const fetchedData = await fetcher(endpoints);
                setData(prev => ({ ...prev, ...fetchedData }));
            } catch (e) {
                setError(prev => ({ ...prev, [activeTab]: e.message }));
            } finally {
                setLoading(prev => ({ ...prev, [activeTab]: false }));
            }
        };

        fetchTabData();
    }, [activeTab, fetcher, data]);
    

    const renderTabContent = () => {
        if (loading[activeTab]) return <TabLoader text={`Loading ${activeTab} analytics...`} />;
        if (error[activeTab]) return <TabError message={`Could not load ${activeTab} data.`} />;

        switch(activeTab) {
            case 'operational':
                return data.patient_demographics && data.patient_flow ? <OperationalTab data={data} /> : null;
            case 'clinical':
                return data.diagnoses_common && data.doctor_performance ? <ClinicalTab data={data} /> : null;
            case 'financial':
                return data.hmo_distribution ? <FinancialTab data={data} /> : null;
            case 'inventory':
                 return data.inventory_usage_top ? <InventoryTab data={data} /> : null;
            default:
                return null;
        }
    }

    if (loading.key_metrics && !data.key_metrics) {
        return <div className="analytics-loader"><AnalyticsStyles /><div></div><p>Loading Analytics...</p></div>;
    }

    if (error.key_metrics && !data.key_metrics) {
        return (
            <div className="analytics-container error-page">
                <AnalyticsStyles />
                <h2><i className="fas fa-exclamation-triangle"></i> Error</h2>
                <p>Could not load key metrics: {error.key_metrics}</p>
                <button onClick={() => navigate('/dashboard')} className="back-button">Back to Dashboard</button>
            </div>
        );
    }

    return (
        <div className="analytics-container">
            <AnalyticsStyles />
            <header className="analytics-header">
                <h1>Data & Analytics Dashboard</h1>
                <button onClick={() => navigate('/dashboard')} className="back-button">
                    <i className="fas fa-arrow-left"></i> Back to Dashboard
                </button>
            </header>
            
            {data.key_metrics && (
                <section className="kpi-grid">
                    <KpiCard title="Today's Visits" value={data.key_metrics.todaysVisits} icon="fa-user-clock" color="#3b82f6" />
                    <KpiCard title="New Patients (Month)" value={data.key_metrics.newPatientsThisMonth} icon="fa-user-plus" color="#16a34a" />
                    <KpiCard title="Total Outstanding" value={`₦${parseFloat(data.key_metrics.totalOutstanding || 0).toLocaleString()}`} icon="fa-file-invoice-dollar" color="#ef4444" />
                    <KpiCard title="Low Stock Items" value={data.key_metrics.lowStockItems} icon="fa-exclamation-triangle" color="#f97316" />
                    <KpiCard title="Upcoming Appointments" value={data.key_metrics.upcomingAppointments} icon="fa-calendar-check" color="#8b5cf6" />
                </section>
            )}

            <nav className="analytics-tabs">
                <button onClick={() => setActiveTab('operational')} className={`tab-button ${activeTab === 'operational' ? 'active' : ''}`}>Operational</button>
                <button onClick={() => setActiveTab('clinical')} className={`tab-button ${activeTab === 'clinical' ? 'active' : ''}`}>Clinical</button>
                <button onClick={() => setActiveTab('financial')} className={`tab-button ${activeTab === 'financial' ? 'active' : ''}`}>Financial</button>
                <button onClick={() => setActiveTab('inventory')} className={`tab-button ${activeTab === 'inventory' ? 'active' : ''}`}>Inventory</button>
            </nav>
            
            <main className="tab-content">
                {renderTabContent()}
            </main>
        </div>
    );
}
