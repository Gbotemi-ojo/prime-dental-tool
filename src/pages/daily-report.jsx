import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom'; // Added useNavigate
import { toast } from 'react-toastify';
import './daily-report.css';
import API_BASE_URL from '../config/api';

export default function DailyReport() {
    const navigate = useNavigate(); // Initialize navigation
    const [userRole, setUserRole] = useState(localStorage.getItem('role'));
    const [viewMode, setViewMode] = useState('submit'); 
    const [pastReports, setPastReports] = useState([]);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [submitting, setSubmitting] = useState(false);

    // Initial state with empty strings for numbers to allow placeholders to show
    const [formData, setFormData] = useState({
        date: new Date().toISOString().split('T')[0],
        receptionistName: '',
        openingTime: '',
        closingTime: '',
        newPatientsCount: '', 
        returningPatientsCount: '',
        hmoPatientsCount: '',
        transactions: [], 
        expenses: [],     
        outstanding: [],  
        activityLog: [],  
        observations: '',
        followUpReminders: '',
        closingNotes: ''
    });

    useEffect(() => {
        if (userRole === 'owner' && viewMode === 'view') {
            fetchReports();
        }
    }, [userRole, viewMode, selectedDate]);

    const fetchReports = async () => {
        const token = localStorage.getItem('jwtToken');
        try {
            const res = await fetch(`${API_BASE_URL}/api/reports?date=${selectedDate}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                setPastReports(await res.json());
            } else {
                toast.error("Failed to load reports.");
            }
        } catch (err) {
            console.error("Error fetching reports", err);
            toast.error("Network error while loading history.");
        }
    };

    const financials = useMemo(() => {
        let cash = 0, pos = 0, transfer = 0;
        formData.transactions.forEach(t => {
            const amt = parseFloat(t.amount) || 0;
            if (t.method === 'cash') cash += amt;
            if (t.method === 'pos') pos += amt;
            if (t.method === 'transfer') transfer += amt;
        });
        return { cash, pos, transfer, total: cash + pos + transfer };
    }, [formData.transactions]);

    const totalExpenses = useMemo(() => {
        return formData.expenses.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
    }, [formData.expenses]);

    const handleInputChange = (e) => {
        const { name, value, type } = e.target;
        const finalValue = (type === 'number' && value === '') ? '' : value; 
        setFormData(prev => ({ ...prev, [name]: finalValue }));
    };

    const updateList = (listName, index, field, value) => {
        setFormData(prev => {
            const newList = prev[listName].map((item, i) => {
                if (i === index) return { ...item, [field]: value };
                return item;
            });
            return { ...prev, [listName]: newList };
        });
    };

    const addListItem = (listName, template) => {
        setFormData(prev => ({ ...prev, [listName]: [...prev[listName], template] }));
    };

    const removeListItem = (listName, index) => {
        setFormData(prev => {
            const newList = prev[listName].filter((_, i) => i !== index);
            return { ...prev, [listName]: newList };
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        const token = localStorage.getItem('jwtToken');

        const payload = {
            ...formData,
            newPatientsCount: parseInt(formData.newPatientsCount) || 0,
            returningPatientsCount: parseInt(formData.returningPatientsCount) || 0,
            hmoPatientsCount: parseInt(formData.hmoPatientsCount) || 0,
            financialTransactions: formData.transactions,
            expensesBreakdown: formData.expenses,
            outstandingBalances: formData.outstanding,
            patientActivityLog: formData.activityLog,
            cashTotal: financials.cash,
            posTotal: financials.pos,
            transferTotal: financials.transfer,
            grandTotal: financials.total,
            expensesTotal: totalExpenses
        };

        try {
            const res = await fetch(`${API_BASE_URL}/api/reports`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                toast.success('Daily Report Submitted Successfully! 🚀');
                window.scrollTo(0,0);
                setFormData(prev => ({ 
                    ...prev, 
                    transactions: [], expenses: [], outstanding: [], activityLog: [],
                    observations: '', followUpReminders: '', closingNotes: ''
                }));
            } else {
                throw new Error('Submission failed');
            }
        } catch (err) {
            toast.error('Something went wrong. Please check your connection.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="daily-report-page-wrapper">
            <div className="daily-report-container">
                <header className="report-header-modern">
                    <div className="header-left-group">
                        <button onClick={() => navigate('/dashboard')} className="back-dashboard-btn">
                            <i className="fas fa-arrow-left"></i> Dashboard
                        </button>
                        <div className="header-title">
                            <i className="fas fa-rocket"></i>
                            <h1>Daily Clinic Summary</h1>
                        </div>
                    </div>
                    
                    {userRole === 'owner' && (
                        <div className="view-toggle-modern">
                            <button 
                                className={viewMode === 'submit' ? 'active' : ''} 
                                onClick={() => setViewMode('submit')}
                            >
                                <i className="fas fa-pen"></i> New Report
                            </button>
                            <button 
                                className={viewMode === 'view' ? 'active' : ''} 
                                onClick={() => setViewMode('view')}
                            >
                                <i className="fas fa-history"></i> History
                            </button>
                        </div>
                    )}
                </header>

                {viewMode === 'submit' ? (
                    <form onSubmit={handleSubmit} className="modern-form fade-in">
                        
                        {/* 1. OPERATIONS */}
                        <div className="modern-card purple-accent">
                            <div className="card-heading">
                                <i className="fas fa-calendar-alt"></i>
                                <h3>Operations</h3>
                            </div>
                            <div className="form-grid">
                                <div className="input-group">
                                    <label>Date</label>
                                    <input type="date" name="date" value={formData.date} onChange={handleInputChange} />
                                </div>
                                <div className="input-group">
                                    <label>Receptionist</label>
                                    <input type="text" name="receptionistName" value={formData.receptionistName} onChange={handleInputChange} placeholder="Who is reporting?" />
                                </div>
                                <div className="input-group">
                                    <label>Opening Time</label>
                                    <input type="time" name="openingTime" value={formData.openingTime} onChange={handleInputChange} />
                                </div>
                                <div className="input-group">
                                    <label>Closing Time</label>
                                    <input type="time" name="closingTime" value={formData.closingTime} onChange={handleInputChange} />
                                </div>
                            </div>
                        </div>

                        {/* 2. STATS */}
                        <div className="modern-card blue-accent">
                            <div className="card-heading">
                                <i className="fas fa-users"></i>
                                <h3>Patient Counts</h3>
                            </div>
                            <div className="stats-container">
                                <div className="stat-input-box">
                                    <label>New</label>
                                    <input type="number" name="newPatientsCount" value={formData.newPatientsCount} onChange={handleInputChange} placeholder="0" />
                                </div>
                                <div className="stat-input-box">
                                    <label>Returning</label>
                                    <input type="number" name="returningPatientsCount" value={formData.returningPatientsCount} onChange={handleInputChange} placeholder="0" />
                                </div>
                                <div className="stat-input-box">
                                    <label>HMO</label>
                                    <input type="number" name="hmoPatientsCount" value={formData.hmoPatientsCount} onChange={handleInputChange} placeholder="0" />
                                </div>
                            </div>
                        </div>

                        {/* 3. FINANCIALS */}
                        <div className="modern-card green-accent">
                            <div className="card-heading">
                                <i className="fas fa-coins"></i>
                                <h3>Financials</h3>
                            </div>
                            
                            <div className="live-totals">
                                <div className="live-total-item">
                                    <small>Cash</small>
                                    <span>₦{financials.cash.toLocaleString()}</span>
                                </div>
                                <div className="live-total-item">
                                    <small>POS</small>
                                    <span>₦{financials.pos.toLocaleString()}</span>
                                </div>
                                <div className="live-total-item">
                                    <small>Transfer</small>
                                    <span>₦{financials.transfer.toLocaleString()}</span>
                                </div>
                                <div className="live-total-item total">
                                    <small>Total Income</small>
                                    <span>₦{financials.total.toLocaleString()}</span>
                                </div>
                            </div>

                            <div className="dynamic-section">
                                {formData.transactions.map((t, idx) => (
                                    <div key={idx} className="dynamic-row slide-in">
                                        <input placeholder="Patient Name" value={t.patient} onChange={e => updateList('transactions', idx, 'patient', e.target.value)} />
                                        <input placeholder="Service (e.g. Scaling)" className="flex-2" value={t.description} onChange={e => updateList('transactions', idx, 'description', e.target.value)} />
                                        <select value={t.method} onChange={e => updateList('transactions', idx, 'method', e.target.value)}>
                                            <option value="transfer">Transfer</option>
                                            <option value="pos">POS</option>
                                            <option value="cash">Cash</option>
                                        </select>
                                        <input type="number" placeholder="Amount" value={t.amount} onChange={e => updateList('transactions', idx, 'amount', e.target.value)} />
                                        <button type="button" className="icon-btn delete" onClick={() => removeListItem('transactions', idx)}><i className="fas fa-trash"></i></button>
                                    </div>
                                ))}
                                <button type="button" className="add-action-btn" onClick={() => addListItem('transactions', { patient: '', description: '', method: 'transfer', amount: '' })}>
                                    <i className="fas fa-plus"></i> Add Transaction
                                </button>
                            </div>
                        </div>

                        {/* 4. EXPENSES & DEBTORS */}
                        <div className="split-layout">
                            <div className="modern-card orange-accent">
                                <div className="card-heading">
                                    <i className="fas fa-receipt"></i>
                                    <h3>Expenses</h3>
                                </div>
                                {formData.expenses.map((ex, idx) => (
                                    <div key={idx} className="dynamic-row compact slide-in">
                                        <input placeholder="Item..." className="flex-2" value={ex.description} onChange={e => updateList('expenses', idx, 'description', e.target.value)} />
                                        <input type="number" placeholder="Amount" value={ex.amount} onChange={e => updateList('expenses', idx, 'amount', e.target.value)} />
                                        <button type="button" className="icon-btn delete" onClick={() => removeListItem('expenses', idx)}>&times;</button>
                                    </div>
                                ))}
                                <button type="button" className="add-action-btn small" onClick={() => addListItem('expenses', { description: '', amount: '' })}>+ Add Expense</button>
                            </div>

                            <div className="modern-card red-accent">
                                <div className="card-heading">
                                    <i className="fas fa-user-clock"></i>
                                    <h3>Debtors</h3>
                                </div>
                                {formData.outstanding.map((o, idx) => (
                                    <div key={idx} className="dynamic-row compact slide-in">
                                        <input placeholder="Name..." className="flex-2" value={o.patient} onChange={e => updateList('outstanding', idx, 'patient', e.target.value)} />
                                        <input type="number" placeholder="Owed" value={o.amount} onChange={e => updateList('outstanding', idx, 'amount', e.target.value)} />
                                        <button type="button" className="icon-btn delete" onClick={() => removeListItem('outstanding', idx)}>&times;</button>
                                    </div>
                                ))}
                                <button type="button" className="add-action-btn small" onClick={() => addListItem('outstanding', { patient: '', amount: '' })}>+ Add Debtor</button>
                            </div>
                        </div>

                        {/* 5. CLINICAL LOG */}
                        <div className="modern-card indigo-accent">
                            <div className="card-heading">
                                <i className="fas fa-notes-medical"></i>
                                <h3>Clinical Log</h3>
                            </div>
                            <div className="dynamic-section">
                                {formData.activityLog.map((log, idx) => (
                                    <div key={idx} className="dynamic-row slide-in">
                                        <span className="row-counter">{idx + 1}</span>
                                        <input placeholder="Patient Name" value={log.patient} onChange={e => updateList('activityLog', idx, 'patient', e.target.value)} />
                                        <input placeholder="Treatment Summary" className="flex-3" value={log.summary} onChange={e => updateList('activityLog', idx, 'summary', e.target.value)} />
                                        <button type="button" className="icon-btn delete" onClick={() => removeListItem('activityLog', idx)}>&times;</button>
                                    </div>
                                ))}
                                <button type="button" className="add-action-btn" onClick={() => addListItem('activityLog', { patient: '', summary: '' })}>
                                    <i className="fas fa-plus"></i> Add Patient Activity
                                </button>
                            </div>
                        </div>

                        {/* 6. HANDOVER NOTES */}
                        <div className="modern-card gray-accent">
                            <div className="card-heading">
                                <i className="fas fa-comment-alt"></i>
                                <h3>Handover Notes</h3>
                            </div>
                            <div className="form-grid full-width">
                                <div className="input-group">
                                    <label>Issues / Observations</label>
                                    <textarea rows="2" name="observations" value={formData.observations} onChange={handleInputChange} placeholder="Any problems today?" />
                                </div>
                                <div className="input-group">
                                    <label>Reminders for Tomorrow</label>
                                    <textarea rows="2" name="followUpReminders" value={formData.followUpReminders} onChange={handleInputChange} placeholder="Who needs a call back?" />
                                </div>
                                <div className="input-group">
                                    <label>Closing Remark</label>
                                    <textarea rows="2" name="closingNotes" value={formData.closingNotes} onChange={handleInputChange} placeholder="General closing statement..." />
                                </div>
                            </div>
                        </div>

                        {/* SUBMIT BUTTON */}
                        <div className="submit-section">
                            <button type="submit" className="submit-report-btn-large" disabled={submitting}>
                                {submitting ? <span className="spinner-mini"></span> : 'SUBMIT DAILY REPORT'}
                            </button>
                        </div>

                    </form>
                ) : (
                    // VIEW MODE
                    <div className="report-history fade-in">
                        <div className="history-filter">
                            <label>Viewing Date:</label>
                            <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
                        </div>
                        
                        {pastReports.length === 0 ? (
                            <div className="empty-state">
                                <p>No reports found for this date.</p>
                            </div>
                        ) : (
                            pastReports.map(report => (
                                <div key={report.id} className="history-card slide-up">
                                    
                                    {/* HEADER */}
                                    <div className="history-header">
                                        <div>
                                            <h2>{new Date(report.date).toDateString()}</h2>
                                            <span className="reporter-name">
                                                <i className="fas fa-user-edit"></i> {report.receptionistName || 'Unknown'} 
                                                <span style={{marginLeft: '10px', fontSize: '0.8rem', color: '#888'}}>
                                                    ({report.openingTime || '--:--'} - {report.closingTime || '--:--'})
                                                </span>
                                            </span>
                                        </div>
                                        <div className="total-badge">
                                            ₦{parseFloat(report.grandTotal).toLocaleString()}
                                        </div>
                                    </div>

                                    {/* STATS */}
                                    <div className="history-stats-grid">
                                        <div className="h-stat"><span>New</span><strong>{report.newPatientsCount}</strong></div>
                                        <div className="h-stat"><span>Returning</span><strong>{report.returningPatientsCount}</strong></div>
                                        <div className="h-stat"><span>HMO</span><strong>{report.hmoPatientsCount}</strong></div>
                                    </div>

                                    <div className="history-content-grid">
                                        
                                        {/* FINANCIALS */}
                                        <div className="h-section green-border">
                                            <h4><i className="fas fa-money-bill-wave"></i> Income</h4>
                                            {report.financialTransactions && report.financialTransactions.length > 0 ? (
                                                <ul className="h-list">
                                                    {report.financialTransactions.map((t, i) => (
                                                        <li key={i}>
                                                            <div className="h-row">
                                                                <span className="h-name">{t.patient}</span>
                                                                <span className="h-amt">₦{parseFloat(t.amount).toLocaleString()}</span>
                                                            </div>
                                                            <small>{t.description} ({t.method})</small>
                                                        </li>
                                                    ))}
                                                </ul>
                                            ) : <p className="h-empty">No transactions recorded.</p>}
                                            <div className="h-summary">
                                                <span>Cash: ₦{parseFloat(report.cashTotal).toLocaleString()}</span>
                                                <span>POS: ₦{parseFloat(report.posTotal).toLocaleString()}</span>
                                                <span>Trf: ₦{parseFloat(report.transferTotal).toLocaleString()}</span>
                                            </div>
                                        </div>

                                        {/* EXPENSES & DEBT */}
                                        <div className="h-col-split">
                                            <div className="h-section orange-border">
                                                <h4><i className="fas fa-receipt"></i> Expenses</h4>
                                                {report.expensesBreakdown && report.expensesBreakdown.length > 0 ? (
                                                    <ul className="h-list">
                                                        {report.expensesBreakdown.map((e, i) => (
                                                            <li key={i} className="h-row">
                                                                <span>{e.description}</span>
                                                                <span className="h-amt">-₦{parseFloat(e.amount).toLocaleString()}</span>
                                                            </li>
                                                        ))}
                                                        <li className="h-row total">
                                                            <strong>Total</strong>
                                                            <strong>-₦{parseFloat(report.expensesTotal).toLocaleString()}</strong>
                                                        </li>
                                                    </ul>
                                                ) : <p className="h-empty">No expenses.</p>}
                                            </div>

                                            <div className="h-section red-border">
                                                <h4><i className="fas fa-user-clock"></i> Debtors</h4>
                                                {report.outstandingBalances && report.outstandingBalances.length > 0 ? (
                                                    <ul className="h-list">
                                                        {report.outstandingBalances.map((o, i) => (
                                                            <li key={i} className="h-row">
                                                                <span>{o.patient}</span>
                                                                <span className="h-amt red">₦{parseFloat(o.amount).toLocaleString()}</span>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                ) : <p className="h-empty">No outstanding balances.</p>}
                                            </div>
                                        </div>
                                    </div>

                                    {/* CLINICAL LOG */}
                                    <div className="h-section indigo-border full-width">
                                        <h4><i className="fas fa-notes-medical"></i> Clinical Activity Log</h4>
                                        {report.patientActivityLog && report.patientActivityLog.length > 0 ? (
                                            <table className="h-table">
                                                <tbody>
                                                    {report.patientActivityLog.map((l, i) => (
                                                        <tr key={i}>
                                                            <td className="h-num">{i+1}.</td>
                                                            <td className="h-p-name">{l.patient}</td>
                                                            <td>{l.summary}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        ) : <p className="h-empty">No clinical activity recorded.</p>}
                                    </div>

                                    {/* NOTES */}
                                    <div className="h-section gray-border full-width">
                                        <h4><i className="fas fa-clipboard-list"></i> Handover Notes</h4>
                                        <div className="h-notes-grid">
                                            {report.observations && (
                                                <div><strong>Observations:</strong> <p>{report.observations}</p></div>
                                            )}
                                            {report.followUpReminders && (
                                                <div><strong>Reminders:</strong> <p>{report.followUpReminders}</p></div>
                                            )}
                                            {report.closingNotes && (
                                                <div><strong>Closing:</strong> <p>{report.closingNotes}</p></div>
                                            )}
                                        </div>
                                    </div>

                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
