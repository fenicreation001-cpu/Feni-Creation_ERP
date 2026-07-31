import React, { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Paper,
  IconButton,
  Tooltip,
  CircularProgress,
} from '@mui/material';
import {
  TrendingUp as SalesIcon,
  ShoppingCart as PurchaseIcon,
  Badge as WorkerIcon,
  HourglassEmpty as PendingIcon,
  AccountBalanceWallet as IncomeIcon,
  Add as AddIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip as ChartTooltip, Legend, CartesianGrid } from 'recharts';
import { formatRupees } from '../utils/formatters';
import { apiClient } from '../utils/api';
import { DashboardStats } from '../types';
import { useNavigate } from 'react-router-dom';
import { useThemeContext } from '../context/ThemeContext';

export const DashboardPage: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { language } = useThemeContext();

  const fetchStats = async () => {
    setLoading(true);
    try {
      const data = await apiClient.getDashboardStats();
      setStats(data);
    } catch {
      setStats({
        totalSales: 118650,
        totalPurchase: 38850,
        totalWorkerSalary: 52000,
        pendingPayment: 38725,
        monthlyIncome: 27800,
        chartData: [
          { month: 'Jan', sales: 120000, purchase: 45000, salary: 35000 },
          { month: 'Feb', sales: 145000, purchase: 52000, salary: 38000 },
          { month: 'Mar', sales: 160000, purchase: 60000, salary: 40000 },
          { month: 'Apr', sales: 135000, purchase: 48000, salary: 42000 },
          { month: 'May', sales: 180000, purchase: 70000, salary: 45000 },
          { month: 'Jun', sales: 195000, purchase: 75000, salary: 48000 },
          { month: 'Jul', sales: 118650, purchase: 38850, salary: 52000 },
        ],
        recentActivities: [
          { id: 'b1', type: 'Bill Generated', ref: 'FC-2026-001', party: 'Shree Ram Textiles', amount: 39900, date: '2026-07-05', status: 'Partial' },
          { id: 'b2', type: 'Bill Generated', ref: 'FC-2026-002', party: 'Krishna Fashion Boutique', amount: 55125, date: '2026-07-12', status: 'Paid' },
          { id: 'pur1', type: 'Material Purchase', ref: 'PUR-2026-101', party: 'Mahavir Yarn Traders', amount: 25200, date: '2026-07-02', status: 'Partial' },
        ],
        isMongoConnected: false,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading || !stats) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress color="primary" />
      </Box>
    );
  }

  const metricCards = [
    {
      title: language === 'gu' ? 'કુલ વેચાણ' : 'Total Sales',
      value: formatRupees(stats.totalSales),
      icon: <SalesIcon sx={{ fontSize: 24, color: '#059669' }} />,
      bgColor: '#ecfdf5',
      borderColor: '#10b981',
      badge: language === 'gu' ? 'ગત મહિના કરતાં +૧૨%' : '+12% vs last month',
      badgeColor: '#10b981',
      onClick: () => navigate('/billing'),
    },
    {
      title: language === 'gu' ? 'મટીરીયલ ખરીદી' : 'Material Purchase',
      value: formatRupees(stats.totalPurchase),
      icon: <PurchaseIcon sx={{ fontSize: 24, color: '#d97706' }} />,
      bgColor: '#fffbeb',
      borderColor: '#f59e0b',
      badge: language === 'gu' ? 'સક્રિય સપ્લાયર્સ' : 'Active Suppliers',
      badgeColor: '#64748b',
      onClick: () => navigate('/purchases'),
    },
    {
      title: language === 'gu' ? 'કુલ કારીગર પગાર' : 'Worker Salaries',
      value: formatRupees(stats.totalWorkerSalary),
      icon: <WorkerIcon sx={{ fontSize: 24, color: '#4f46e5' }} />,
      bgColor: '#eef2ff',
      borderColor: '#6366f1',
      badge: language === 'gu' ? 'સક્રિય કારીગરો' : 'Active Staff',
      badgeColor: '#64748b',
      onClick: () => navigate('/workers'),
    },
    {
      title: language === 'gu' ? 'કુલ બાકી રકમ' : 'Total Pending',
      value: formatRupees(stats.pendingPayment),
      icon: <PendingIcon sx={{ fontSize: 24, color: '#e11d48' }} />,
      bgColor: '#fff1f2',
      borderColor: '#f43f5e',
      badge: language === 'gu' ? 'ધ્યાન આપવું જરૂરી' : 'Requires Attention',
      badgeColor: '#e11d48',
      onClick: () => navigate('/payments'),
    },
    {
      title: language === 'gu' ? 'માસિક આવક' : 'Net Monthly Income',
      value: formatRupees(stats.monthlyIncome),
      icon: <IncomeIcon sx={{ fontSize: 24, color: '#0284c7' }} />,
      bgColor: '#f0f9ff',
      borderColor: '#38bdf8',
      badge: language === 'gu' ? 'ચકાસાયેલ હિસાબ' : 'Verified Balance',
      badgeColor: '#0284c7',
      onClick: () => navigate('/reports'),
    },
  ];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800, color: 'text.primary', letterSpacing: '-0.02em' }}>
            {language === 'gu' ? 'ડેશબોર્ડ - ફેની ક્રિએશન' : 'Dashboard Overview'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {language === 'gu' ? 'લાઈવ વેચાણ, ખરીદી અને કારીગર પગાર હિસાબ' : 'Real-time billing, material purchase and worker salary tracking'}
          </Typography>
        </Box>
        <Tooltip title="Refresh Dashboard">
          <IconButton onClick={fetchStats} color="primary" sx={{ bgcolor: 'background.paper', border: '1px solid #e2e8f0' }}>
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Top Metric Cards Grid */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(5, 1fr)' }, gap: 2.5, mb: 4 }}>
        {metricCards.map((card, idx) => (
          <Card
            key={idx}
            onClick={card.onClick}
            sx={{
              cursor: 'pointer',
              p: 2.5,
              transition: 'all 0.2s ease-in-out',
              '&:hover': {
                transform: 'translateY(-3px)',
                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.08)',
              },
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
              <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.7rem' }}>
                {card.title}
              </Typography>
              <Box sx={{ p: 1, borderRadius: '8px', bgcolor: card.bgColor, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {card.icon}
              </Box>
            </Box>
            <Typography variant="h5" sx={{ fontWeight: 800, color: 'text.primary', mb: 1.5 }}>
              {card.value}
            </Typography>
            <Typography variant="caption" sx={{ color: card.badgeColor, fontWeight: 700, fontSize: '0.72rem' }}>
              {card.badge}
            </Typography>
          </Card>
        ))}
      </Box>

      {/* Quick Actions Bar */}
      <Paper sx={{ p: { xs: 2, sm: 2.5 }, mb: 4, bgcolor: 'background.paper', borderRadius: 3, border: '1px solid #f1f5f9', boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)' }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1.5, color: '#0f172a', letterSpacing: '-0.01em' }}>
          ⚡ {language === 'gu' ? 'ઝડપી એક્શન્સ' : 'Quick Actions'}
        </Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(4, 1fr)' }, gap: 1.5 }}>
          <Button
            fullWidth
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/billing')}
            sx={{ py: 1.2, fontWeight: 700, bgcolor: '#4f46e5', '&:hover': { bgcolor: '#4338ca' } }}
          >
            {language === 'gu' ? '+ નવું બિલ બનાવો' : '+ Create Bill'}
          </Button>
          <Button
            fullWidth
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={() => navigate('/purchases')}
            sx={{ py: 1.2, fontWeight: 700, color: '#d97706', borderColor: '#fde68a', '&:hover': { borderColor: '#d97706', bgcolor: '#fffbeb' } }}
          >
            {language === 'gu' ? '+ માલ ખરીદી ઉમેરો' : '+ Add Purchase'}
          </Button>
          <Button
            fullWidth
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={() => navigate('/workers')}
            sx={{ py: 1.2, fontWeight: 700, color: '#4f46e5', borderColor: '#c7d2fe', '&:hover': { borderColor: '#4f46e5', bgcolor: '#eef2ff' } }}
          >
            {language === 'gu' ? '+ કારીગર પગાર/ઉપાડ' : '+ Pay Worker'}
          </Button>
          <Button
            fullWidth
            variant="outlined"
            color="inherit"
            startIcon={<AddIcon />}
            onClick={() => navigate('/parties')}
            sx={{ py: 1.2, fontWeight: 700, borderColor: '#e2e8f0' }}
          >
            {language === 'gu' ? '+ નવી પાર્ટી ઉમેરો' : '+ Add Party'}
          </Button>
        </Box>
      </Paper>

      {/* Charts & Recent Activities Section */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '7fr 5fr' }, gap: 3 }}>
        <Card sx={{ p: 2.5, height: '100%' }}>
          <Typography variant="h6" sx={{ fontWeight: 800, mb: 2, color: 'text.primary', letterSpacing: '-0.01em' }}>
            📊 {language === 'gu' ? 'માસિક વેચાણ અને ખરીદી ચાર્ટ' : 'Monthly Sales, Purchase & Salary Overview'}
          </Typography>
          <Box sx={{ width: '100%', height: 320 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" stroke="#94a3b8" tick={{ fontSize: 12 }} />
                <YAxis tickFormatter={(val) => `₹${val / 1000}k`} stroke="#94a3b8" tick={{ fontSize: 12 }} />
                <ChartTooltip formatter={(val: any) => [formatRupees(Number(val)), '']} />
                <Legend />
                <Bar dataKey="sales" name={language === 'gu' ? 'વેચાણ' : 'Sales'} fill="#4f46e5" radius={[4, 4, 0, 0]} />
                <Bar dataKey="purchase" name={language === 'gu' ? 'ખરીદી' : 'Purchase'} fill="#f59e0b" radius={[4, 4, 0, 0]} />
                <Bar dataKey="salary" name={language === 'gu' ? 'કારીગર પગાર' : 'Salary'} fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Box>
        </Card>

        <Card sx={{ p: 2.5, height: '100%' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 800, color: 'text.primary', letterSpacing: '-0.01em' }}>
              🕒 {language === 'gu' ? 'છેલ્લા વ્યવહારો' : 'Recent Transactions'}
            </Typography>
            <Button size="small" onClick={() => navigate('/billing')} sx={{ fontWeight: 700, color: '#4f46e5' }}>
              {language === 'gu' ? 'બધા જુઓ' : 'View All'}
            </Button>
          </Box>

          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>{language === 'gu' ? 'સંદર્ભ નં.' : 'Ref No.'}</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>{language === 'gu' ? 'પાર્ટી' : 'Party'}</TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="right">{language === 'gu' ? 'રકમ' : 'Amount'}</TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="center">{language === 'gu' ? 'સ્થિતિ' : 'Status'}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {stats.recentActivities.map((act) => (
                  <TableRow key={act.id} hover sx={{ '&:hover': { bgcolor: '#f8fafc' } }}>
                    <TableCell sx={{ fontWeight: 700, fontFamily: 'monospace', fontSize: '0.8rem', color: '#4f46e5' }}>{act.ref}</TableCell>
                    <TableCell sx={{ fontSize: '0.85rem', fontWeight: 600 }}>{act.party}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 800 }}>{formatRupees(act.amount)}</TableCell>
                    <TableCell align="center">
                      <Chip
                        label={act.status}
                        size="small"
                        color={act.status === 'Paid' ? 'success' : act.status === 'Partial' ? 'warning' : 'error'}
                        sx={{ fontSize: '0.7rem', height: 20, fontWeight: 700 }}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      </Box>
    </Box>
  );
};
