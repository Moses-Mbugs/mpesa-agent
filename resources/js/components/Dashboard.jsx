import React, { useEffect, useState, useRef } from 'react';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement,
  LineElement, BarElement, Title, Tooltip, Legend, ArcElement,
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import axios from 'axios';
import {
  Upload, FileText, TrendingUp, TrendingDown, DollarSign,
  Activity, Calendar, Search, Loader2, CheckCircle,
  AlertCircle, BarChart3, PieChart, Zap, RefreshCw
} from 'lucide-react';

ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, Title, Tooltip, Legend, ArcElement
);

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600;700&family=IBM+Plex+Sans:wght@300;400;500;600&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg: #0a0c10;
    --surface: #111318;
    --border: #1f2430;
    --border-hard: #2a3040;
    --text: #e2e8f0;
    --muted: #4a5568;
    --muted2: #64748b;
    --green: #00e5a0;
    --green-dim: rgba(0,229,160,0.08);
    --red: #ff4757;
    --red-dim: rgba(255,71,87,0.08);
    --blue: #3b82f6;
    --mono: 'IBM Plex Mono', monospace;
    --sans: 'IBM Plex Sans', sans-serif;
  }

  body { background: var(--bg); color: var(--text); font-family: var(--sans); }
  .dash {
    min-height: 100vh;
    background: radial-gradient(circle at 50% 0%, #13161c 0%, var(--bg) 80%);
  }

  /* NAV */
  .nav {
    position: sticky; top: 0; z-index: 50;
    background: var(--bg);
    border-bottom: 2px solid var(--border-hard);
    padding: 0 1.75rem;
    display: flex; align-items: center; justify-content: space-between;
    height: 58px;
  }
  .nav-logo {
    display: flex; align-items: center; gap: 10px;
    font-family: var(--mono); font-weight: 700; font-size: 0.925rem;
    letter-spacing: 0.02em;
  }
  .logo-mark {
    width: 30px; height: 30px; border-radius: 4px;
    background: var(--green); color: #000;
    display: flex; align-items: center; justify-content: center;
    box-shadow: 0 0 14px rgba(0,229,160,0.3);
    flex-shrink: 0;
  }
  .logo-sub { font-size: 0.6rem; color: var(--muted2); font-weight: 400; display: block; margin-top: 1px; }

  .phone-wrap {
    display: flex; align-items: center; gap: 8px;
    border: 2px solid var(--border-hard); border-radius: 5px;
    padding: 0 12px; background: var(--surface);
    transition: border-color 0.15s;
  }
  .phone-wrap:focus-within { border-color: var(--green); }
  .phone-wrap svg { color: var(--muted); }
  .phone-wrap input {
    background: none; border: none; outline: none;
    font-family: var(--mono); font-size: 0.8rem;
    color: var(--text); width: 200px; padding: 8px 0;
  }
  .phone-wrap input::placeholder { color: var(--muted); }

  /* MAIN */
  .main { padding: 1.25rem 1.75rem; max-width: 1400px; margin: 0 auto; }

  /* CONTROLS */
  .controls {
    display: flex; align-items: center; justify-content: space-between;
    flex-wrap: wrap; gap: 0.75rem;
    border: 2px solid var(--border-hard); border-radius: 6px;
    padding: 0.875rem 1.125rem;
    background: var(--surface); margin-bottom: 1.25rem;
  }
  .controls-left { display: flex; align-items: center; gap: 0.625rem; flex-wrap: wrap; }
  .date-wrap {
    display: flex; align-items: center; gap: 8px;
    border: 2px solid var(--border-hard); border-radius: 5px;
    padding: 0 12px; background: var(--bg);
  }
  .date-wrap:focus-within { border-color: var(--border-hard); }
  .date-wrap svg { color: var(--muted); flex-shrink: 0; }
  .date-wrap input {
    background: none; border: none; outline: none;
    font-family: var(--mono); font-size: 0.75rem;
    color: var(--text); padding: 7px 0; width: 108px;
    color-scheme: dark;
  }
  .date-sep { color: var(--muted); font-size: 0.75rem; font-family: var(--mono); }

  .btn-primary {
    display: flex; align-items: center; gap: 6px;
    background: var(--green); color: #000;
    border: 2px solid var(--green); border-radius: 5px;
    padding: 7px 16px;
    font-family: var(--mono); font-weight: 600; font-size: 0.8rem;
    cursor: pointer; transition: box-shadow 0.15s, opacity 0.15s;
  }
  .btn-primary:hover:not(:disabled) { box-shadow: 0 0 16px rgba(0,229,160,0.35); }
  .btn-primary:disabled { opacity: 0.4; cursor: not-allowed; }

  .tx-badge { font-family: var(--mono); font-size: 0.73rem; color: var(--muted2); }
  .tx-badge strong { color: var(--green); }

  /* BENTO */
  .bento { display: grid; grid-template-columns: repeat(12, 1fr); gap: 10px; }

  .cell {
    background: var(--surface);
    border: 2px solid var(--border-hard);
    border-radius: 6px; padding: 1.125rem;
    position: relative; overflow: hidden;
    transition: border-color 0.2s;
  }
  .cell:hover { border-color: #38465e; }
  .cell::before {
    content: ''; position: absolute;
    top: 0; left: 0; right: 0; height: 2px;
    background: var(--accent-line, transparent);
  }

  /* Grid positions */
  .c-received { grid-column: span 4; --accent-line: var(--green); }
  .c-sent     { grid-column: span 4; --accent-line: var(--red); }
  .c-net      { grid-column: span 4; }
  .c-bar      { grid-column: span 8; }
  .c-donut    { grid-column: span 4; }
  .c-upload   { grid-column: span 4; }
  .c-ai       { grid-column: span 8; display: flex; flex-direction: column; }

  /* Stat cells */
  .eyebrow {
    font-family: var(--mono); font-size: 0.63rem;
    text-transform: uppercase; letter-spacing: 0.12em;
    color: var(--muted2); margin-bottom: 0.45rem;
    display: flex; align-items: center; gap: 6px;
  }
  .stat-val {
    font-family: var(--mono); font-size: 1.65rem;
    font-weight: 700; letter-spacing: -0.03em;
    line-height: 1.1; margin-bottom: 0.5rem;
  }
  .tag {
    display: inline-flex; align-items: center; gap: 4px;
    font-family: var(--mono); font-size: 0.68rem; font-weight: 500;
    padding: 3px 8px; border-radius: 3px;
  }
  .tag-g { background: var(--green-dim); color: var(--green); border: 1px solid rgba(0,229,160,0.2); }
  .tag-r { background: var(--red-dim);   color: var(--red);   border: 1px solid rgba(255,71,87,0.2); }
  .tag-m { background: rgba(255,255,255,0.04); color: var(--muted2); border: 1px solid var(--border); }

  .c-g { color: var(--green); }
  .c-r { color: var(--red); }
  .c-m { color: var(--muted2); }

  /* Chart cells */
  .cell-hd {
    display: flex; align-items: center; justify-content: space-between;
    margin-bottom: 0.875rem;
  }
  .cell-title {
    font-family: var(--mono); font-weight: 600; font-size: 0.8rem;
    color: var(--text); display: flex; align-items: center; gap: 6px;
  }
  .cell-title svg { color: var(--muted2); }
  .chart-wrap { height: 230px; position: relative; }
  .empty {
    height: 100%; display: flex; flex-direction: column;
    align-items: center; justify-content: center; gap: 8px;
    border: 1.5px dashed var(--border-hard); border-radius: 5px;
    color: var(--muted); font-family: var(--mono); font-size: 0.75rem;
  }
  .empty svg { opacity: 0.2; }

  /* Upload */
  .drop {
    border: 2px dashed var(--border-hard); border-radius: 5px;
    padding: 1.5rem 1rem; text-align: center;
    cursor: pointer; transition: border-color 0.15s, background 0.15s;
    margin-bottom: 0.625rem;
  }
  .drop:hover { border-color: var(--green); background: var(--green-dim); }
  .drop.busy { opacity: 0.5; cursor: not-allowed; }
  .drop-icon {
    width: 40px; height: 40px; border-radius: 5px;
    background: var(--green-dim); color: var(--green);
    display: flex; align-items: center; justify-content: center;
    margin: 0 auto 8px; border: 1px solid rgba(0,229,160,0.2);
  }
  .drop-t { font-family: var(--mono); font-weight: 600; font-size: 0.78rem; margin-bottom: 3px; }
  .drop-s { font-family: var(--mono); font-size: 0.68rem; color: var(--muted2); }

  .msg {
    display: flex; align-items: flex-start; gap: 7px;
    padding: 9px 11px; border-radius: 5px;
    font-family: var(--mono); font-size: 0.72rem; line-height: 1.5;
  }
  .msg-ok  { background: var(--green-dim); color: var(--green); border: 1px solid rgba(0,229,160,0.2); }
  .msg-err { background: var(--red-dim);   color: var(--red);   border: 1px solid rgba(255,71,87,0.2); }

  /* AI */
  .ai-pill {
    display: inline-flex; align-items: center; gap: 5px;
    font-family: var(--mono); font-size: 0.63rem;
    text-transform: uppercase; letter-spacing: 0.1em;
    padding: 3px 8px; border-radius: 3px;
    background: rgba(0,229,160,0.06);
    border: 1px solid rgba(0,229,160,0.15); color: var(--green);
  }
  .ai-dot {
    width: 5px; height: 5px; border-radius: 50%; background: var(--green);
    animation: blink 2s ease infinite;
  }
  @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.2} }

  .btn-outline {
    display: flex; align-items: center; gap: 6px;
    background: none; border: 2px solid var(--border-hard); border-radius: 5px;
    padding: 6px 12px; font-family: var(--mono); font-size: 0.75rem;
    color: var(--text); cursor: pointer; transition: border-color 0.15s, color 0.15s;
  }
  .btn-outline:hover:not(:disabled) { border-color: var(--green); color: var(--green); }
  .btn-outline:disabled { opacity: 0.4; cursor: not-allowed; }

  .ai-body {
    flex: 1; background: var(--bg);
    border: 2px solid var(--border-hard); border-radius: 5px;
    padding: 0.875rem; min-height: 180px; max-height: 280px;
    overflow-y: auto; font-size: 0.855rem; line-height: 1.7;
    color: #94a3b8; white-space: pre-wrap; position: relative;
    margin-top: 0.625rem;
  }
  .ai-body::-webkit-scrollbar { width: 3px; }
  .ai-body::-webkit-scrollbar-thumb { background: var(--border-hard); border-radius: 3px; }

  .ai-empty {
    position: absolute; inset: 0; display: flex;
    flex-direction: column; align-items: center;
    justify-content: center; gap: 10px;
    color: var(--muted); padding: 1.5rem; text-align: center;
  }
  .ai-empty svg { opacity: 0.18; }
  .ai-empty p { font-size: 0.78rem; max-width: 220px; line-height: 1.6; font-family: var(--mono); }

  @keyframes spin { to { transform: rotate(360deg); } }
  .spin { display: inline-block; animation: spin 0.9s linear infinite; }

  @media (max-width: 1100px) {
    .c-bar, .c-donut, .c-upload, .c-ai { grid-column: span 12; }
  }
  @media (max-width: 700px) {
    .main { padding: 1rem; } .nav { padding: 0 1rem; }
    .c-received, .c-sent, .c-net { grid-column: span 12; }
  }
`;

export default function Dashboard() {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summary, setSummary] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [totals, setTotals] = useState({ total_sent: 0, total_received: 0, net_flow: 0, transaction_count: 0 });
  const [uploadStatus, setUploadStatus] = useState(null);
  const [uploadMessage, setUploadMessage] = useState('');
  const fileInputRef = useRef(null);
  const [chartData, setChartData] = useState({
    monthly: { labels: [], datasets: [] },
    category: { labels: [], datasets: [] }
  });

  useEffect(() => {
    const s = document.createElement('style');
    s.textContent = STYLES;
    document.head.appendChild(s);
    return () => document.head.removeChild(s);
  }, []);

  const fmt = (v) => new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', maximumFractionDigits: 0 }).format(v);

  const barOpts = {
    responsive: true, maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom', labels: { color: '#4a5568', font: { family: 'IBM Plex Mono', size: 11 }, boxWidth: 10, padding: 14 } },
      tooltip: {
        backgroundColor: '#111318', borderColor: '#2a3040', borderWidth: 1,
        titleColor: '#e2e8f0', bodyColor: '#4a5568',
        titleFont: { family: 'IBM Plex Mono', weight: '600' },
        bodyFont: { family: 'IBM Plex Mono', size: 11 }, padding: 10, cornerRadius: 4,
        callbacks: { label: (c) => ` ${fmt(c.raw)}` }
      }
    },
    scales: {
      x: { stacked: true, grid: { display: false }, ticks: { color: '#4a5568', font: { family: 'IBM Plex Mono', size: 11 } }, border: { color: '#1f2430' } },
      y: { stacked: true, grid: { color: 'rgba(255,255,255,0.03)' }, ticks: { color: '#4a5568', font: { family: 'IBM Plex Mono', size: 11 }, callback: (v) => `${(v / 1000).toFixed(0)}k` }, border: { color: '#1f2430' } },
    },
  };

  const donutOpts = {
    responsive: true, maintainAspectRatio: false,
    plugins: {
      legend: { position: 'right', labels: { color: '#4a5568', font: { family: 'IBM Plex Mono', size: 11 }, boxWidth: 10, padding: 12 } },
      tooltip: {
        backgroundColor: '#111318', borderColor: '#2a3040', borderWidth: 1,
        titleColor: '#e2e8f0', bodyColor: '#4a5568',
        callbacks: { label: (c) => ` ${fmt(c.raw)}` }
      }
    },
    cutout: '70%',
  };

  const fetchData = async () => {
    if (!phone || !startDate || !endDate) return;
    setLoading(true);
    try {
      const { data } = await axios.get('/api/dashboard/data', { params: { phone, start_date: startDate, end_date: endDate } });
      const { monthly_spending, category_breakdown, totals: t } = data;
      setChartData({
        monthly: { labels: monthly_spending.labels, datasets: monthly_spending.datasets },
        category: {
          labels: category_breakdown.labels,
          datasets: [{
            label: 'Total (KES)', data: category_breakdown.data, borderWidth: 0, hoverOffset: 4,
            backgroundColor: ['rgba(0,229,160,0.8)', 'rgba(59,130,246,0.8)', 'rgba(255,180,0,0.8)', 'rgba(255,71,87,0.8)', 'rgba(139,92,246,0.8)', 'rgba(251,113,133,0.8)'],
          }]
        }
      });
      setTotals(t);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    if (!phone) return;
    (async () => {
      try {
        const { data } = await axios.get('/api/transactions/range', { params: { phone } });
        if (data.start_date) setStartDate(data.start_date.substring(0, 10));
        if (data.end_date) setEndDate(data.end_date.substring(0, 10));
      } catch (e) { console.error(e); }
    })();
  }, [phone]);

  const fetchSummary = async () => {
    setSummaryLoading(true);
    try {
      const { data } = await axios.post('/mpesa/summary', { phone, start_date: startDate, end_date: endDate });
      setSummary(data.summary);
    } catch { setSummary('Could not generate summary.'); }
    finally { setSummaryLoading(false); }
  };

  const handleFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const fd = new FormData();
    fd.append('file', file);
    if (phone) fd.append('phone', phone);
    setUploadStatus('uploading');
    try {
      const { data } = await axios.post('/mpesa/statement', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      let msg = `Imported ${data.transactions_imported} transactions.`;
      if (data.detected_phone && data.detected_phone !== phone) { setPhone(data.detected_phone); msg += ` Phone: ${data.detected_phone}`; }
      setUploadStatus('success'); setUploadMessage(msg);
    } catch (err) {
      setUploadStatus('error'); setUploadMessage(err.response?.data?.error || 'Upload failed.');
    }
  };

  const netPos = totals.net_flow >= 0;

  return (
    <div className="dash">
      {/* NAV */}
      <nav className="nav">
        <div className="nav-logo">
          <div className="logo-mark"><Activity size={15} /></div>
          <div>
            M-PESA AGENT
            <span className="logo-sub">Financial Intelligence</span>
          </div>
        </div>
        <div className="phone-wrap">
          <Search size={13} />
          <input type="text" placeholder="254712345678" value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>
      </nav>

      <main className="main">
        {/* CONTROLS */}
        <div className="controls">
          <div className="controls-left">
            <div className="date-wrap">
              <Calendar size={13} />
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              <span className="date-sep">→</span>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
            <button className="btn-primary" onClick={fetchData} disabled={loading || !phone}>
              {loading ? <><span className="spin"><Loader2 size={13} /></span> Loading</> : <><Search size={13} /> Load Data</>}
            </button>
          </div>
          <span className="tx-badge">
            {totals.transaction_count > 0 && <><strong>{totals.transaction_count.toLocaleString()}</strong> transactions</>}
          </span>
        </div>

        {/* BENTO GRID */}
        <div className="bento">

          {/* Stats */}
          <div className="cell c-received">
            <div className="eyebrow"><TrendingUp size={11} /> Total Received</div>
            <div className="stat-val c-g">{fmt(totals.total_received)}</div>
            <span className="tag tag-g"><TrendingUp size={10} /> Inflow</span>
          </div>

          <div className="cell c-sent">
            <div className="eyebrow"><TrendingDown size={11} /> Total Sent</div>
            <div className="stat-val c-r">{fmt(totals.total_sent)}</div>
            <span className="tag tag-r"><TrendingDown size={10} /> Outflow</span>
          </div>

          <div className="cell c-net" style={{ '--accent-line': netPos ? 'var(--green)' : 'var(--red)' }}>
            <div className="eyebrow"><DollarSign size={11} /> Net Flow</div>
            <div className={`stat-val ${netPos ? 'c-g' : 'c-r'}`}>{netPos ? '+' : ''}{fmt(totals.net_flow)}</div>
            <span className={`tag ${netPos ? 'tag-g' : 'tag-r'}`}>Balance impact</span>
          </div>

          {/* Bar Chart */}
          <div className="cell c-bar">
            <div className="cell-hd">
              <div className="cell-title"><BarChart3 size={14} /> Monthly Spending</div>
            </div>
            <div className="chart-wrap">
              {chartData.monthly.labels.length > 0
                ? <Bar options={barOpts} data={chartData.monthly} />
                : <div className="empty"><BarChart3 size={30} /><span>No data loaded</span></div>
              }
            </div>
          </div>

          {/* Donut Chart */}
          <div className="cell c-donut">
            <div className="cell-hd">
              <div className="cell-title"><PieChart size={14} /> By Category</div>
            </div>
            <div className="chart-wrap">
              {chartData.category.labels.length > 0
                ? <Doughnut data={chartData.category} options={donutOpts} />
                : <div className="empty"><PieChart size={30} /><span>No categories</span></div>
              }
            </div>
          </div>

          {/* Upload */}
          <div className="cell c-upload">
            <div className="cell-hd">
              <div className="cell-title"><Upload size={14} /> Upload Statement</div>
            </div>
            <div
              className={`drop ${uploadStatus === 'uploading' ? 'busy' : ''}`}
              onClick={() => uploadStatus !== 'uploading' && fileInputRef.current?.click()}
            >
              <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept=".pdf" onChange={handleFile} disabled={uploadStatus === 'uploading'} />
              {uploadStatus === 'uploading' ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                  <span className="spin c-g"><Loader2 size={26} /></span>
                  <div className="drop-s">Parsing PDF...</div>
                </div>
              ) : (
                <>
                  <div className="drop-icon"><FileText size={18} /></div>
                  <div className="drop-t">Click to upload PDF</div>
                  <div className="drop-s">M-Pesa statements only</div>
                </>
              )}
            </div>
            {uploadStatus === 'success' && <div className="msg msg-ok"><CheckCircle size={13} /><span>{uploadMessage}</span></div>}
            {uploadStatus === 'error'   && <div className="msg msg-err"><AlertCircle size={13} /><span>{uploadMessage}</span></div>}
          </div>

          {/* AI Summary */}
          <div className="cell c-ai">
            <div className="cell-hd">
              <div className="cell-title" style={{ gap: 8 }}>
                <Zap size={14} style={{ color: 'var(--green)' }} />
                AI Insights
                <span className="ai-pill"><span className="ai-dot" /> Live</span>
              </div>
              <button className="btn-outline" onClick={fetchSummary} disabled={summaryLoading || !phone}>
                {summaryLoading
                  ? <><span className="spin"><Loader2 size={12} /></span> Generating</>
                  : <><RefreshCw size={12} /> Generate</>
                }
              </button>
            </div>
            <div className="ai-body">
              {summaryLoading ? (
                <div className="ai-empty">
                  <span className="spin c-g"><Loader2 size={26} /></span>
                  <p>Analyzing transactions...</p>
                </div>
              ) : summary ? summary : (
                <div className="ai-empty">
                  <Zap size={26} />
                  <p>Click Generate to get an AI breakdown of your spending patterns and recommendations.</p>
                </div>
              )}
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
