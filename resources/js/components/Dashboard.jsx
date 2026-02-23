import React, { useEffect, useState, useRef } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import axios from 'axios';
import {
  Upload,
  FileText,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Activity,
  Calendar,
  Search,
  Loader2,
  Download,
  CheckCircle,
  AlertCircle,
  BarChart3,
  PieChart
} from 'lucide-react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

export default function Dashboard() {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summary, setSummary] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [totals, setTotals] = useState({ total_sent: 0, total_received: 0, net_flow: 0, transaction_count: 0 });

  const [uploadStatus, setUploadStatus] = useState(null); // null, 'uploading', 'success', 'error'
  const [uploadMessage, setUploadMessage] = useState('');
  const fileInputRef = useRef(null);

  const [chartData, setChartData] = useState({
      monthly: { labels: [], datasets: [] },
      category: { labels: [], datasets: [] }
  });

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
      },
    },
    scales: {
      x: {
        stacked: true,
        grid: { display: false }
      },
      y: {
        stacked: true,
        grid: { color: '#f3f4f6' }
      },
    },
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
      }
    }
  };

  const fetchData = async () => {
      if (!phone || !startDate || !endDate) return;
      setLoading(true);
      try {
          const response = await axios.get(`/api/dashboard/data`, {
              params: { phone, start_date: startDate, end_date: endDate }
          });
          const { monthly_spending, category_breakdown, totals: totalsResp } = response.data;

          setChartData({
              monthly: {
                  labels: monthly_spending.labels,
                  datasets: monthly_spending.datasets
              },
              category: {
                  labels: category_breakdown.labels,
                  datasets: [{
                      label: 'Total (KES)',
                      data: category_breakdown.data,
                      backgroundColor: [
                          'rgba(255, 99, 132, 0.8)',
                          'rgba(54, 162, 235, 0.8)',
                          'rgba(255, 206, 86, 0.8)',
                          'rgba(75, 192, 192, 0.8)',
                          'rgba(153, 102, 255, 0.8)',
                          'rgba(255, 159, 64, 0.8)',
                      ],
                      borderWidth: 0,
                  }]
              }
          });
          setTotals(totalsResp);
      } catch (error) {
          console.error("Error fetching data", error);
      } finally {
        setLoading(false);
      }
  };

  useEffect(() => {
      if (!phone) return;
      const fetchRange = async () => {
          try {
              const resp = await axios.get('/api/transactions/range', { params: { phone } });
              if (resp.data.start_date && resp.data.end_date) {
                  setStartDate(resp.data.start_date.substring(0, 10));
                  setEndDate(resp.data.end_date.substring(0, 10));
              }
          } catch (e) {
              console.error('Range fetch error', e);
          }
      };
      fetchRange();
  }, [phone]);

  const fetchSummary = async () => {
      setSummaryLoading(true);
      try {
          const response = await axios.post('/mpesa/summary', {
              phone: phone,
              start_date: startDate,
              end_date: endDate
          });
          setSummary(response.data.summary);
      } catch (error) {
          console.error("Summary error", error);
          setSummary("Could not generate summary.");
      } finally {
          setSummaryLoading(false);
      }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!phone) {
      setUploadStatus('error');
      setUploadMessage('Please enter a phone number first.');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('phone', phone);

    setUploadStatus('uploading');
    setUploadMessage('Processing statement...');

    try {
      const response = await axios.post('/mpesa/statement', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setUploadStatus('success');
      setUploadMessage(`Success! Imported ${response.data.transactions_imported} transactions.`);
      fetchData(); // Refresh data
    } catch (error) {
      console.error('Upload failed:', error);
      setUploadStatus('error');
      setUploadMessage(error.response?.data?.error || 'Failed to upload statement.');
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES' }).format(amount);
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-800">

      {/* Navbar */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="bg-green-600 text-white p-2 rounded-lg">
                <Activity size={24} />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 tracking-tight">M-Pesa Agent</h1>
                <p className="text-xs text-gray-500 font-medium">Financial Intelligence</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search size={16} className="text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Enter Phone Number"
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all w-64"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

        {/* Controls */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-wrap gap-4 items-center justify-between">
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-gray-600 bg-gray-50 px-3 py-2 rounded-lg border border-gray-200">
                    <Calendar size={18} />
                    <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="bg-transparent border-none outline-none text-sm w-32"
                    />
                    <span className="text-gray-400">to</span>
                    <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="bg-transparent border-none outline-none text-sm w-32"
                    />
                </div>
                <button
                    onClick={fetchData}
                    disabled={loading || !phone}
                    className="bg-gray-900 hover:bg-gray-800 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
                    Load Data
                </button>
            </div>

            <div className="text-sm text-gray-500">
                {totals.transaction_count > 0 && (
                    <span>Found <strong>{totals.transaction_count}</strong> transactions in range</span>
                )}
            </div>
        </div>

        {/* Hero Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 relative overflow-hidden group hover:shadow-md transition-shadow">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <TrendingUp size={48} className="text-green-600" />
                </div>
                <p className="text-sm font-medium text-gray-500 mb-1">Total Received</p>
                <h3 className="text-2xl font-bold text-gray-900">{formatCurrency(totals.total_received)}</h3>
                <div className="mt-2 flex items-center text-xs text-green-600 font-medium">
                    <TrendingUp size={14} className="mr-1" />
                    <span>Inflow</span>
                </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 relative overflow-hidden group hover:shadow-md transition-shadow">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <TrendingDown size={48} className="text-red-600" />
                </div>
                <p className="text-sm font-medium text-gray-500 mb-1">Total Sent</p>
                <h3 className="text-2xl font-bold text-gray-900">{formatCurrency(totals.total_sent)}</h3>
                <div className="mt-2 flex items-center text-xs text-red-600 font-medium">
                    <TrendingDown size={14} className="mr-1" />
                    <span>Outflow</span>
                </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 relative overflow-hidden group hover:shadow-md transition-shadow">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <DollarSign size={48} className={totals.net_flow >= 0 ? "text-green-600" : "text-red-600"} />
                </div>
                <p className="text-sm font-medium text-gray-500 mb-1">Net Flow</p>
                <h3 className={`text-2xl font-bold ${totals.net_flow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {totals.net_flow >= 0 ? '+' : ''}{formatCurrency(totals.net_flow)}
                </h3>
                <div className="mt-2 flex items-center text-xs text-gray-500 font-medium">
                    <span>Balance Impact</span>
                </div>
            </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

            {/* Left Column: Charts */}
            <div className="lg:col-span-2 space-y-8">

                {/* Monthly Spending */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-96">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                            <Activity size={20} className="text-gray-400" />
                            Monthly Spending Trend
                        </h3>
                    </div>
                    <div className="h-72 w-full">
                        {chartData.monthly.labels.length > 0 ? (
                            <Bar options={barOptions} data={chartData.monthly} />
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-gray-400 border-2 border-dashed border-gray-200 rounded-lg">
                                <BarChart3 size={48} className="mb-2 opacity-20" />
                                <p>No data to display</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Category Breakdown */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-96">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                            <PieChart size={20} className="text-gray-400" />
                            Spending by Category
                        </h3>
                    </div>
                    <div className="h-72 w-full relative">
                         {chartData.category.labels.length > 0 ? (
                            <Doughnut data={chartData.category} options={doughnutOptions} />
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-gray-400 border-2 border-dashed border-gray-200 rounded-lg">
                                <p>No categories found</p>
                            </div>
                        )}
                    </div>
                </div>

            </div>

            {/* Right Column: Actions & Summary */}
            <div className="space-y-8">

                {/* Upload Module */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <Upload size={20} className="text-gray-400" />
                        Upload Statement
                    </h3>
                    <div
                        className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer
                            ${uploadStatus === 'uploading' ? 'bg-gray-50 border-gray-300' : 'hover:bg-gray-50 hover:border-green-400 border-gray-200'}
                        `}
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept=".pdf"
                            onChange={handleFileUpload}
                            disabled={uploadStatus === 'uploading'}
                        />

                        {uploadStatus === 'uploading' ? (
                             <div className="flex flex-col items-center">
                                <Loader2 size={32} className="animate-spin text-green-600 mb-2" />
                                <p className="text-sm text-gray-600 font-medium">Processing...</p>
                             </div>
                        ) : (
                            <div className="flex flex-col items-center">
                                <div className="bg-green-50 text-green-600 p-3 rounded-full mb-3">
                                    <FileText size={24} />
                                </div>
                                <p className="text-sm font-medium text-gray-900 mb-1">Click to Upload PDF</p>
                                <p className="text-xs text-gray-400">Supports M-Pesa Statements</p>
                            </div>
                        )}
                    </div>

                    {/* Upload Status Messages */}
                    {uploadStatus === 'success' && (
                        <div className="mt-4 p-3 bg-green-50 border border-green-100 rounded-lg flex items-start gap-3">
                            <CheckCircle size={18} className="text-green-600 mt-0.5" />
                            <p className="text-sm text-green-800">{uploadMessage}</p>
                        </div>
                    )}
                    {uploadStatus === 'error' && (
                        <div className="mt-4 p-3 bg-red-50 border border-red-100 rounded-lg flex items-start gap-3">
                            <AlertCircle size={18} className="text-red-600 mt-0.5" />
                            <p className="text-sm text-red-800">{uploadMessage}</p>
                        </div>
                    )}
                </div>

                {/* AI Summary Module */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col h-[calc(100%-20rem)] min-h-[500px]">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                            <Activity size={20} className="text-purple-500" />
                            AI Insights
                        </h3>
                        <button
                            onClick={fetchSummary}
                            disabled={summaryLoading || !phone}
                            className="text-xs bg-purple-50 text-purple-700 px-3 py-1 rounded-full font-medium hover:bg-purple-100 transition-colors disabled:opacity-50"
                        >
                            {summaryLoading ? 'Generating...' : 'Generate New'}
                        </button>
                    </div>

                    <div className="flex-1 bg-gray-50 rounded-xl p-4 overflow-y-auto border border-gray-100 custom-scrollbar">
                        {summaryLoading ? (
                            <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-4">
                                <Loader2 size={32} className="animate-spin text-purple-500" />
                                <p className="text-sm">Analyzing transaction patterns...</p>
                            </div>
                        ) : summary ? (
                            <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap">
                                {summary}
                            </div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-gray-400 text-center p-4">
                                <Activity size={32} className="mb-2 opacity-20" />
                                <p className="text-sm">Click "Generate New" to get a detailed AI analysis of your financial statement.</p>
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </div>
      </main>
    </div>
  );
}
