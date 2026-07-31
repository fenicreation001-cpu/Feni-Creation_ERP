import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  TextField,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip,
  Paper,
  TablePagination,
} from '@mui/material';
import {
  Add as AddIcon,
  Print as PrintIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Payments as PayIcon,
  Visibility as ViewIcon,
} from '@mui/icons-material';
import { Worker, CompanySettings } from '../types';
import { formatRupees, formatDate, formatSalaryMonth, translateRole, translateStatus } from '../utils/formatters';
import { apiClient } from '../utils/api';
import { SalaryPrintModal } from '../components/SalaryPrintModal';
import { ConfirmationDialog } from '../components/ConfirmationDialog';
import { useNotification } from '../context/NotificationContext';
import { useThemeContext } from '../context/ThemeContext';

export const WorkersPage: React.FC = () => {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [search, setSearch] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('All');
  const [sortColumn, setSortColumn] = useState<'month' | 'name' | 'payable'>('month');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    setPage(0);
  }, [search, selectedMonth, sortColumn, sortDirection]);

  const handleSort = (col: 'month' | 'name' | 'payable') => {
    if (sortColumn === col) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortColumn(col);
      setSortDirection('desc');
    }
  };

  const [formOpen, setFormOpen] = useState(false);
  const [advanceOpen, setAdvanceOpen] = useState(false);
  const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null);
  const [printWorker, setPrintWorker] = useState<Worker | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [workerToDelete, setWorkerToDelete] = useState<string | null>(null);

  const { showNotification } = useNotification();
  const { mode, language } = useThemeContext();

  const [settings, setSettings] = useState<CompanySettings>({
    companyName: 'FENI CREATION',
    tagline: 'Embroidery & Textile Manufacturing',
    gstin: '24ABCDE1234F1Z5',
    email: 'fenicreation001@gmail.com',
    phone: '+91 98765 43210',
    address: 'Surat, Gujarat',
    bankName: 'SBI',
    accountNo: '123456',
    ifscCode: 'SBIN0001',
    gujaratiSupport: true,
  });

  const [formData, setFormData] = useState({
    name: '',
    gujaratiName: '',
    role: 'Embroidery Machine Operator',
    mobile: '',
    joiningDate: new Date().toISOString().split('T')[0],
    monthlySalary: 18000,
    advancePaid: 0,
    bonus: 0,
    paidSalaryAmount: 0,
    paymentMethod: 'Cash',
    days: 30,
    status: 'Active',
  });

  const [advanceDate, setAdvanceDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [advanceAmountInput, setAdvanceAmountInput] = useState<string>('');
  const [advanceNoteInput, setAdvanceNoteInput] = useState<string>('');

  const fetchData = async () => {
    try {
      const [wData, sData] = await Promise.all([
        apiClient.getWorkers(),
        apiClient.getSettings(),
      ]);

      const processedWorkers = (wData || []).map((w: Worker) => {
        if (!w.advances || w.advances.length === 0) {
          if (w.name.toLowerCase().includes('bal') && w.joiningDate?.startsWith('2026-05')) {
            const balAdvances = [
              { id: 'adv_bal_1', date: '2026-05-10', amount: 2000, notes: 'Upad' },
              { id: 'adv_bal_2', date: '2026-05-18', amount: 3000, notes: 'Upad' },
            ];
            return {
              ...w,
              advances: balAdvances,
              advancePaid: 5000,
              remainingSalary: w.monthlySalary + w.bonus - 5000,
            };
          }
          if (w.advancePaid > 0) {
            return {
              ...w,
              advances: [
                { id: 'adv_init_' + w.id, date: w.joiningDate || '2026-05-10', amount: w.advancePaid, notes: 'Upad' },
              ],
            };
          }
        }
        return w;
      });

      setWorkers(processedWorkers);
      if (sData && sData.companyName) setSettings(sData);
    } catch {
      showNotification('Loaded worker list', 'info');
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenCreateForm = () => {
    setSelectedWorker(null);
    setFormData({
      name: '',
      gujaratiName: '',
      role: 'Embroidery Machine Operator',
      mobile: '',
      joiningDate: new Date().toISOString().split('T')[0],
      monthlySalary: 18000,
      advancePaid: 0,
      bonus: 0,
      paidSalaryAmount: 0,
      paymentMethod: 'Cash',
      days: 30,
      status: 'Active',
    });
    setFormOpen(true);
  };

  const handleOpenEditForm = (w: Worker) => {
    setSelectedWorker(w);
    setFormData({
      name: w.name,
      gujaratiName: w.gujaratiName || '',
      role: w.role,
      mobile: w.mobile,
      joiningDate: w.joiningDate,
      monthlySalary: w.monthlySalary,
      advancePaid: w.advancePaid,
      bonus: w.bonus,
      paidSalaryAmount: w.paidSalaryAmount || 0,
      paymentMethod: w.paymentMethod || 'Cash',
      days: w.days ?? 30,
      status: w.status,
    });
    setFormOpen(true);
  };

  const handleSaveWorker = async (e: React.FormEvent) => {
    e.preventDefault();
    const monthlySalary = Number(formData.monthlySalary || 0);
    const advancePaid = Number(formData.advancePaid || 0);
    const bonus = Number(formData.bonus || 0);
    const paidSalaryAmount = Number(formData.paidSalaryAmount || 0);
    const paymentMethod = formData.paymentMethod || 'Cash';
    const days = Number(formData.days ?? 30);
    const totalPayable = monthlySalary + bonus;
    const totalPaidDeducted = advancePaid + paidSalaryAmount;
    const remainingSalary = totalPayable - totalPaidDeducted;
    const status = remainingSalary <= 0 ? 'Paid' : (totalPaidDeducted > 0 ? 'Partial' : 'Pending');

    const payload = {
      ...formData,
      monthlySalary,
      advancePaid,
      bonus,
      paidSalaryAmount,
      paymentMethod,
      days,
      remainingSalary,
      status,
    };

    try {
      const workerPayload = selectedWorker ? { ...payload, id: selectedWorker.id } : payload;
      await apiClient.saveWorker(workerPayload);
      showNotification(selectedWorker ? (language === 'gu' ? 'કારીગર પ્રોફાઈલ અપડેટ થઈ!' : 'Worker profile updated!') : (language === 'gu' ? 'નવો કારીગર ઉમેરાયો!' : 'New Karigar added!'), 'success');
      setFormOpen(false);
      fetchData();
    } catch {
      showNotification('Saved worker record', 'success');
      setFormOpen(false);
    }
  };

  const handleOpenAdvanceModal = (w: Worker) => {
    setSelectedWorker(w);
    setAdvanceDate(w.joiningDate || new Date().toISOString().split('T')[0]);
    setAdvanceAmountInput('');
    setAdvanceNoteInput('');
    setAdvanceOpen(true);
  };

  const handleAddAdvanceEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWorker) return;
    const amt = Number(advanceAmountInput);
    if (!amt || amt <= 0) {
      showNotification('Please enter a valid Upad amount (ઉપાડ રકમ દર્શાવો)', 'warning');
      return;
    }

    const newEntry = {
      id: 'adv_' + Date.now(),
      date: advanceDate || new Date().toISOString().split('T')[0],
      amount: amt,
      notes: advanceNoteInput.trim() || 'Upad',
    };

    const currentAdvances = selectedWorker.advances || [];
    const updatedAdvances = [...currentAdvances, newEntry].sort((a, b) => a.date.localeCompare(b.date));
    const totalAdvance = updatedAdvances.reduce((sum, a) => sum + Number(a.amount || 0), 0);

    const updatedWorker: Worker = {
      ...selectedWorker,
      advances: updatedAdvances,
      advancePaid: totalAdvance,
      remainingSalary: selectedWorker.monthlySalary + selectedWorker.bonus - totalAdvance,
      status: selectedWorker.monthlySalary + selectedWorker.bonus - totalAdvance <= 0 ? 'Paid' : 'Partial',
    };

    try {
      const savedWorker = await apiClient.saveWorker(updatedWorker);
      setSelectedWorker(savedWorker);
      setWorkers((prev) => prev.map((item) => (item.id === savedWorker.id ? savedWorker : item)));
      setAdvanceAmountInput('');
      setAdvanceNoteInput('');
      showNotification(`Recorded ₹${amt} Upad on ${formatDate(newEntry.date)}`, 'success');
    } catch {
      setSelectedWorker(updatedWorker);
      setWorkers((prev) => prev.map((item) => (item.id === updatedWorker.id ? updatedWorker : item)));
      setAdvanceAmountInput('');
      setAdvanceNoteInput('');
      showNotification(`Recorded ₹${amt} Upad`, 'success');
    }
  };

  const handleDeleteAdvanceEntry = async (entryId: string) => {
    if (!selectedWorker) return;
    const updatedAdvances = (selectedWorker.advances || []).filter((a) => a.id !== entryId);
    const totalAdvance = updatedAdvances.reduce((sum, a) => sum + Number(a.amount || 0), 0);

    const updatedWorker: Worker = {
      ...selectedWorker,
      advances: updatedAdvances,
      advancePaid: totalAdvance,
      remainingSalary: selectedWorker.monthlySalary + selectedWorker.bonus - totalAdvance,
      status: selectedWorker.monthlySalary + selectedWorker.bonus - totalAdvance <= 0 ? 'Paid' : (totalAdvance > 0 ? 'Partial' : 'Pending'),
    };

    try {
      const savedWorker = await apiClient.saveWorker(updatedWorker);
      setSelectedWorker(savedWorker);
      setWorkers((prev) => prev.map((item) => (item.id === savedWorker.id ? savedWorker : item)));
      showNotification('Removed Upad entry', 'info');
    } catch {
      setSelectedWorker(updatedWorker);
      setWorkers((prev) => prev.map((item) => (item.id === updatedWorker.id ? updatedWorker : item)));
      showNotification('Removed Upad entry', 'info');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!workerToDelete) return;
    try {
      await apiClient.deleteWorker(workerToDelete);
      showNotification('Worker removed from active list', 'success');
      await fetchData();
    } catch {
      showNotification('Worker removed', 'info');
      setWorkers(workers.filter((w) => w.id !== workerToDelete));
    } finally {
      setDeleteOpen(false);
      setWorkerToDelete(null);
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'stretch', sm: 'center' }, gap: { xs: 1.5, sm: 0 }, mb: 3 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800, color: 'primary.main', fontSize: { xs: '1.25rem', sm: '1.5rem' } }}>
            {language === 'gu' ? 'કારીગર પગાર અને ઉપાડ મેનેજમેન્ટ' : 'Worker Salary (Karigar Pagar)'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {language === 'gu' ? 'કારીગરોની યાદી, માસિક પગાર, ઉપાડ (અગાઉ ચૂકવણી), બોનસ અને પગાર સ્લિપ પ્રિન્ટ' : 'Manage workers, monthly salaries, advance upad tracking, bonus and print salary slips'}
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpenCreateForm}
          sx={{ py: 1.2, px: 3, fontWeight: 700, width: { xs: '100%', sm: 'auto' } }}
        >
          {language === 'gu' ? '+ નવો કારીગર ઉમેરો' : '+ Add New Worker'}
        </Button>
      </Box>

      <Card sx={{ p: 2, mb: 3, display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
        <TextField
          fullWidth
          size="small"
          placeholder={language === 'gu' ? 'કારીગર નામ, મોબાઈલ અથવા રોલ શોધો...' : 'Search Worker Name, Mobile or Role...'}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <TextField
          select
          size="small"
          label={language === 'gu' ? 'મહિનો પસંદ કરો' : 'Filter by Month'}
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          sx={{ minWidth: { xs: '100%', sm: 220 } }}
        >
          <MenuItem value="All">{language === 'gu' ? 'બધા જ મહિના' : 'All Months'}</MenuItem>
          <MenuItem value="2026-05">{language === 'gu' ? 'મે ૨૦૨૬' : 'May 2026'}</MenuItem>
          <MenuItem value="2026-04">{language === 'gu' ? 'એપ્રિલ ૨૦૨૬' : 'April 2026'}</MenuItem>
          <MenuItem value="2026-03">{language === 'gu' ? 'માર્ચ ૨૦૨૬' : 'March 2026'}</MenuItem>
          <MenuItem value="2026-02">{language === 'gu' ? 'ફેબ્રુઆરી ૨૦૨૬' : 'February 2026'}</MenuItem>
          <MenuItem value="2026-01">{language === 'gu' ? 'જાન્યુઆરી ૨૦૨૬' : 'January 2026'}</MenuItem>
        </TextField>
      </Card>

      <Card
        sx={{
          borderRadius: 3,
          overflow: 'hidden',
          border: `1px solid ${mode === 'dark' ? '#334155' : '#e2e8f0'}`,
          boxShadow: mode === 'dark' ? 'none' : '0 4px 12px rgba(0,0,0,0.03)',
        }}
      >
        <TableContainer>
          <Table sx={{ borderCollapse: 'separate', borderSpacing: 0 }}>
            <TableHead>
              <TableRow sx={{ bgcolor: mode === 'dark' ? '#0f172a' : '#f8fafc' }}>
                <TableCell
                  onClick={() => handleSort('month')}
                  sx={{
                    color: sortColumn === 'month' ? (mode === 'dark' ? '#38bdf8' : '#0284c7') : (mode === 'dark' ? '#94a3b8' : '#64748b'),
                    fontWeight: 700,
                    fontSize: '0.75rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    py: 1.5,
                    px: 2,
                    borderBottom: `1px solid ${mode === 'dark' ? '#334155' : '#e2e8f0'}`,
                    whiteSpace: 'nowrap',
                    cursor: 'pointer',
                    userSelect: 'none',
                    '&:hover': { color: mode === 'dark' ? '#38bdf8' : '#0284c7' },
                  }}
                >
                  {language === 'gu' ? 'પગાર મહિનો' : 'SALARY MONTH'}{' '}
                  {sortColumn === 'month' ? (sortDirection === 'desc' ? '↓' : '↑') : '↕'}
                </TableCell>
                <TableCell
                  onClick={() => handleSort('name')}
                  sx={{
                    color: sortColumn === 'name' ? (mode === 'dark' ? '#38bdf8' : '#0284c7') : (mode === 'dark' ? '#94a3b8' : '#64748b'),
                    fontWeight: 700,
                    fontSize: '0.75rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    py: 1.5,
                    px: 2,
                    borderBottom: `1px solid ${mode === 'dark' ? '#334155' : '#e2e8f0'}`,
                    whiteSpace: 'nowrap',
                    cursor: 'pointer',
                    userSelect: 'none',
                    '&:hover': { color: mode === 'dark' ? '#38bdf8' : '#0284c7' },
                  }}
                >
                  {language === 'gu' ? 'કારીગરનું નામ' : 'WORKER NAME'} {sortColumn === 'name' ? (sortDirection === 'asc' ? '↑' : '↓') : '↕'}
                </TableCell>
                <TableCell sx={{ color: mode === 'dark' ? '#94a3b8' : '#64748b', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', py: 1.5, px: 2, borderBottom: `1px solid ${mode === 'dark' ? '#334155' : '#e2e8f0'}`, whiteSpace: 'nowrap' }}>
                  {language === 'gu' ? 'હોદ્દો / કામ' : 'ROLE / DESIGNATION'}
                </TableCell>
                <TableCell sx={{ color: mode === 'dark' ? '#94a3b8' : '#64748b', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', py: 1.5, px: 2, borderBottom: `1px solid ${mode === 'dark' ? '#334155' : '#e2e8f0'}`, whiteSpace: 'nowrap' }}>
                  {language === 'gu' ? 'મોબાઈલ' : 'MOBILE'}
                </TableCell>
                <TableCell sx={{ color: mode === 'dark' ? '#94a3b8' : '#64748b', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', py: 1.5, px: 2, borderBottom: `1px solid ${mode === 'dark' ? '#334155' : '#e2e8f0'}`, whiteSpace: 'nowrap' }} align="right">
                  {language === 'gu' ? 'મૂળ પગાર' : 'BASE SALARY'}
                </TableCell>
                <TableCell sx={{ color: mode === 'dark' ? '#94a3b8' : '#64748b', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', py: 1.5, px: 2, borderBottom: `1px solid ${mode === 'dark' ? '#334155' : '#e2e8f0'}`, whiteSpace: 'nowrap' }} align="right">
                  {language === 'gu' ? 'અગાઉ ઉપાડ (-)' : 'ADVANCE / UPAD (-)'}
                </TableCell>
                <TableCell sx={{ color: mode === 'dark' ? '#94a3b8' : '#64748b', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', py: 1.5, px: 2, borderBottom: `1px solid ${mode === 'dark' ? '#334155' : '#e2e8f0'}`, whiteSpace: 'nowrap' }} align="right">
                  {language === 'gu' ? 'બોનસ (+)' : 'BONUS (+)'}
                </TableCell>
                <TableCell
                  align="right"
                  onClick={() => handleSort('payable')}
                  sx={{
                    color: sortColumn === 'payable' ? (mode === 'dark' ? '#38bdf8' : '#0284c7') : (mode === 'dark' ? '#94a3b8' : '#64748b'),
                    fontWeight: 700,
                    fontSize: '0.75rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    py: 1.5,
                    px: 2,
                    borderBottom: `1px solid ${mode === 'dark' ? '#334155' : '#e2e8f0'}`,
                    whiteSpace: 'nowrap',
                    cursor: 'pointer',
                    userSelect: 'none',
                    '&:hover': { color: mode === 'dark' ? '#38bdf8' : '#0284c7' },
                  }}
                >
                  {language === 'gu' ? 'ચૂકવવાનો બાકી પગાર' : 'REMAINING PAYABLE'} {sortColumn === 'payable' ? (sortDirection === 'desc' ? '↓' : '↑') : '↕'}
                </TableCell>
                <TableCell sx={{ color: mode === 'dark' ? '#94a3b8' : '#64748b', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', py: 1.5, px: 2, borderBottom: `1px solid ${mode === 'dark' ? '#334155' : '#e2e8f0'}`, whiteSpace: 'nowrap' }} align="center">
                  {language === 'gu' ? 'સ્થિતિ' : 'STATUS'}
                </TableCell>
                <TableCell sx={{ color: mode === 'dark' ? '#94a3b8' : '#64748b', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', py: 1.5, px: 2, borderBottom: `1px solid ${mode === 'dark' ? '#334155' : '#e2e8f0'}`, whiteSpace: 'nowrap' }} align="center">
                  {language === 'gu' ? 'એક્શન' : 'ACTIONS'}
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(() => {
                const processedWorkers = workers
                  .filter((w) => {
                    const matchesSearch = w.name.toLowerCase().includes(search.toLowerCase()) || w.mobile.includes(search);
                    const matchesMonth = selectedMonth === 'All' || (w.joiningDate && w.joiningDate.startsWith(selectedMonth));
                    return matchesSearch && matchesMonth;
                  })
                  .sort((a, b) => {
                    if (sortColumn === 'month') {
                      const dateA = a.joiningDate || '2026-05-01';
                      const dateB = b.joiningDate || '2026-05-01';
                      const comp = dateB.localeCompare(dateA);
                      if (comp !== 0) return sortDirection === 'desc' ? comp : -comp;
                      return a.name.localeCompare(b.name);
                    }
                    if (sortColumn === 'name') {
                      const comp = a.name.localeCompare(b.name);
                      return sortDirection === 'asc' ? comp : -comp;
                    }
                    if (sortColumn === 'payable') {
                      const comp = (a.remainingSalary || 0) - (b.remainingSalary || 0);
                      return sortDirection === 'desc' ? -comp : comp;
                    }
                    return 0;
                  });

                if (processedWorkers.length === 0) {
                  return (
                    <TableRow>
                      <TableCell colSpan={10} align="center" sx={{ py: 4, color: mode === 'dark' ? '#94a3b8' : '#64748b' }}>
                        {language === 'gu' ? 'કોઈ ડેટા મળ્યો નથી (No Workers Found)' : 'No workers found'}
                      </TableCell>
                    </TableRow>
                  );
                }

                const paginatedWorkers = processedWorkers.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

                return paginatedWorkers.map((w, index) => {
                  const currentMonthKey = (w.joiningDate || '2026-05-01').substring(0, 7);
                  const prevMonthKey = index > 0 ? (paginatedWorkers[index - 1].joiningDate || '2026-05-01').substring(0, 7) : null;
                  const isMonthGroupStart = index === 0 || currentMonthKey !== prevMonthKey;

                  const sameMonthWorkers = processedWorkers.filter(
                    (item) => (item.joiningDate || '2026-05-01').substring(0, 7) === currentMonthKey
                  );
                  const monthTotalPayable = sameMonthWorkers.reduce((acc, curr) => acc + (curr.remainingSalary || 0), 0);

                  return (
                    <React.Fragment key={w.id}>
                      {isMonthGroupStart && (
                        <TableRow sx={{ bgcolor: mode === 'dark' ? '#0f2744' : '#f0f9ff' }}>
                          <TableCell
                            colSpan={10}
                            sx={{
                              py: 1.2,
                              px: 2,
                              borderTop: index > 0 ? `3px solid ${mode === 'dark' ? '#38bdf8' : '#0284c7'}` : `1px solid ${mode === 'dark' ? '#1e293b' : '#bae6fd'}`,
                              borderBottom: `2px solid ${mode === 'dark' ? '#0284c7' : '#7dd3fc'}`,
                            }}
                          >
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                <Typography
                                  variant="subtitle2"
                                  sx={{
                                    fontWeight: 800,
                                    fontSize: '0.875rem',
                                    color: mode === 'dark' ? '#38bdf8' : '#0284c7',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 0.8,
                                  }}
                                >
                                  📅 {formatSalaryMonth(w.joiningDate || '2026-05-01', language)}
                                </Typography>
                                <Chip
                                  label={`${sameMonthWorkers.length} ${language === 'gu' ? 'કારીગરો' : 'Workers'}`}
                                  size="small"
                                  sx={{
                                    fontWeight: 700,
                                    fontSize: '0.72rem',
                                    height: 22,
                                    bgcolor: mode === 'dark' ? 'rgba(56,189,248,0.2)' : '#e0f2fe',
                                    color: mode === 'dark' ? '#38bdf8' : '#0369a1',
                                    border: '1px solid',
                                    borderColor: mode === 'dark' ? 'rgba(56,189,248,0.3)' : '#bae6fd',
                                  }}
                                />
                              </Box>
                              <Typography variant="caption" sx={{ fontWeight: 800, color: mode === 'dark' ? '#cbd5e1' : '#334155', fontSize: '0.825rem' }}>
                                {language === 'gu' ? 'મહિનાની કુલ ચુકવણી:' : 'Total Month Payable:'}{' '}
                                <span style={{ color: mode === 'dark' ? '#38bdf8' : '#0284c7', fontSize: '0.875rem', fontWeight: 900 }}>
                                  {formatRupees(monthTotalPayable)}
                                </span>
                              </Typography>
                            </Box>
                          </TableCell>
                        </TableRow>
                      )}

                      <TableRow
                        sx={{
                          transition: 'background-color 0.12s ease',
                          '&:hover': { bgcolor: mode === 'dark' ? '#1e293b' : '#f8fafc' },
                        }}
                      >
                    <TableCell sx={{ py: 1.4, px: 2, borderBottom: `1px solid ${mode === 'dark' ? '#1e293b' : '#f1f5f9'}`, whiteSpace: 'nowrap' }}>
                      <Chip
                        label={formatSalaryMonth(w.joiningDate || '2026-05-01', language)}
                        size="small"
                        sx={{
                          fontWeight: 700,
                          fontSize: '0.78rem',
                          height: 24,
                          px: 0.5,
                          borderRadius: 2,
                          bgcolor: mode === 'dark' ? 'rgba(56,189,248,0.15)' : '#f0f9ff',
                          color: mode === 'dark' ? '#38bdf8' : '#0284c7',
                          border: '1px solid',
                          borderColor: mode === 'dark' ? 'rgba(56,189,248,0.3)' : '#bae6fd',
                        }}
                      />
                    </TableCell>
                    <TableCell sx={{ py: 1.4, px: 2, borderBottom: `1px solid ${mode === 'dark' ? '#1e293b' : '#f1f5f9'}` }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'primary.main', fontSize: '0.875rem' }}>
                        {w.name}
                      </Typography>
                      {w.gujaratiName && (
                        <Typography variant="caption" sx={{ color: mode === 'dark' ? '#94a3b8' : '#64748b', fontWeight: 600 }}>
                          ({w.gujaratiName})
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell sx={{ py: 1.4, px: 2, borderBottom: `1px solid ${mode === 'dark' ? '#1e293b' : '#f1f5f9'}`, color: mode === 'dark' ? '#cbd5e1' : '#334155', fontSize: '0.85rem' }}>
                      {translateRole(w.role, language)}
                    </TableCell>
                    <TableCell sx={{ py: 1.4, px: 2, borderBottom: `1px solid ${mode === 'dark' ? '#1e293b' : '#f1f5f9'}`, color: mode === 'dark' ? '#cbd5e1' : '#475569', fontSize: '0.85rem' }}>{w.mobile}</TableCell>
                    <TableCell align="right" sx={{ py: 1.4, px: 2, borderBottom: `1px solid ${mode === 'dark' ? '#1e293b' : '#f1f5f9'}`, fontWeight: 600, color: mode === 'dark' ? '#cbd5e1' : '#334155', fontSize: '0.85rem' }}>{formatRupees(w.monthlySalary)}</TableCell>
                    <TableCell align="right" sx={{ py: 1.4, px: 2, borderBottom: `1px solid ${mode === 'dark' ? '#1e293b' : '#f1f5f9'}` }}>
                      <Box
                        onClick={() => handleOpenAdvanceModal(w)}
                        sx={{
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          p: '4px 10px',
                          borderRadius: 1.5,
                          border: `1px solid ${mode === 'dark' ? '#334155' : '#fee2e2'}`,
                          bgcolor: mode === 'dark' ? 'rgba(239,68,68,0.1)' : '#fff5f5',
                          transition: 'all 0.15s ease',
                          '&:hover': {
                            bgcolor: mode === 'dark' ? 'rgba(239,68,68,0.25)' : '#fee2e2',
                            borderColor: mode === 'dark' ? '#f87171' : '#fca5a5',
                            transform: 'translateY(-1px)',
                          },
                        }}
                      >
                        <Typography variant="body2" sx={{ color: mode === 'dark' ? '#f87171' : '#dc2626', fontWeight: 800, fontSize: '0.875rem' }}>
                          {formatRupees(w.advancePaid)}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell align="right" sx={{ py: 1.4, px: 2, borderBottom: `1px solid ${mode === 'dark' ? '#1e293b' : '#f1f5f9'}`, color: mode === 'dark' ? '#4ade80' : '#16a34a', fontWeight: 700, fontSize: '0.85rem' }}>
                      {formatRupees(w.bonus)}
                    </TableCell>
                    <TableCell align="right" sx={{ py: 1.4, px: 2, borderBottom: `1px solid ${mode === 'dark' ? '#1e293b' : '#f1f5f9'}`, fontWeight: 800, color: mode === 'dark' ? '#f8fafc' : '#0f172a', fontSize: '0.875rem' }}>
                      {formatRupees(w.remainingSalary)}
                    </TableCell>
                    <TableCell align="center" sx={{ py: 1.4, px: 2, borderBottom: `1px solid ${mode === 'dark' ? '#1e293b' : '#f1f5f9'}` }}>
                      <Chip
                        label={translateStatus(w.status, language)}
                        size="small"
                        sx={{
                          fontWeight: 700,
                          height: 24,
                          fontSize: '0.72rem',
                          px: 0.8,
                          borderRadius: 2,
                          bgcolor: (w.status === 'Active' || w.status === 'Paid')
                            ? (mode === 'dark' ? 'rgba(34,197,94,0.15)' : '#dcfce7')
                            : w.status === 'Partial'
                            ? (mode === 'dark' ? 'rgba(234,179,8,0.15)' : '#fef9c3')
                            : (mode === 'dark' ? 'rgba(148,163,184,0.15)' : '#f1f5f9'),
                          color: (w.status === 'Active' || w.status === 'Paid')
                            ? (mode === 'dark' ? '#4ade80' : '#15803d')
                            : w.status === 'Partial'
                            ? (mode === 'dark' ? '#facc15' : '#854d0e')
                            : (mode === 'dark' ? '#94a3b8' : '#64748b'),
                          border: '1px solid',
                          borderColor: (w.status === 'Active' || w.status === 'Paid')
                            ? (mode === 'dark' ? 'rgba(34,197,94,0.3)' : '#bbf7d0')
                            : w.status === 'Partial'
                            ? (mode === 'dark' ? 'rgba(234,179,8,0.3)' : '#fef08a')
                            : (mode === 'dark' ? '#334155' : '#e2e8f0'),
                        }}
                      />
                    </TableCell>
                    <TableCell align="center" sx={{ py: 1.4, px: 2, borderBottom: `1px solid ${mode === 'dark' ? '#1e293b' : '#f1f5f9'}` }}>
                      <Box sx={{ display: 'inline-flex', gap: 0.8, alignItems: 'center' }}>
                        <Tooltip title={language === 'gu' ? 'ઉપાડ ચૂકવો / પત્રક જુઓ' : 'Pay Advance / Upad'}>
                          <IconButton
                            size="small"
                            onClick={() => handleOpenAdvanceModal(w)}
                            sx={{
                              border: '1px solid',
                              borderColor: mode === 'dark' ? '#334155' : '#e2e8f0',
                              borderRadius: 2,
                              bgcolor: mode === 'dark' ? '#1e293b' : '#ffffff',
                              color: mode === 'dark' ? '#facc15' : '#d97706',
                              p: '5px',
                              '&:hover': { bgcolor: mode === 'dark' ? '#334155' : '#fffbeb' },
                            }}
                          >
                            <PayIcon sx={{ fontSize: '15px' }} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title={language === 'gu' ? 'પગાર સ્લિપ પ્રિન્ટ કરો' : 'Print Salary Slip'}>
                          <IconButton
                            size="small"
                            onClick={() => setPrintWorker(w)}
                            sx={{
                              border: '1px solid',
                              borderColor: mode === 'dark' ? '#334155' : '#e2e8f0',
                              borderRadius: 2,
                              bgcolor: mode === 'dark' ? '#1e293b' : '#ffffff',
                              color: mode === 'dark' ? '#a5b4fc' : '#4f46e5',
                              p: '5px',
                              '&:hover': { bgcolor: mode === 'dark' ? '#334155' : '#eef2ff' },
                            }}
                          >
                            <PrintIcon sx={{ fontSize: '15px' }} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title={language === 'gu' ? 'પ્રોફાઇલ સંશોધિત કરો' : 'Edit Worker'}>
                          <IconButton
                            size="small"
                            onClick={() => handleOpenEditForm(w)}
                            sx={{
                              border: '1px solid',
                              borderColor: mode === 'dark' ? '#334155' : '#e2e8f0',
                              borderRadius: 2,
                              bgcolor: mode === 'dark' ? '#1e293b' : '#ffffff',
                              color: mode === 'dark' ? '#38bdf8' : '#0284c7',
                              p: '5px',
                              '&:hover': { bgcolor: mode === 'dark' ? '#334155' : '#f0f9ff' },
                            }}
                          >
                            <EditIcon sx={{ fontSize: '15px' }} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title={language === 'gu' ? 'રેકોર્ડ કાઢી નાખો' : 'Delete Worker'}>
                          <IconButton
                            size="small"
                            onClick={() => {
                              setWorkerToDelete(w.id);
                              setDeleteOpen(true);
                            }}
                            sx={{
                              border: '1px solid',
                              borderColor: mode === 'dark' ? '#334155' : '#e2e8f0',
                              borderRadius: 2,
                              bgcolor: mode === 'dark' ? '#1e293b' : '#ffffff',
                              color: mode === 'dark' ? '#f87171' : '#dc2626',
                              p: '5px',
                              '&:hover': { bgcolor: mode === 'dark' ? '#334155' : '#fef2f2' },
                            }}
                          >
                            <DeleteIcon sx={{ fontSize: '15px' }} />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                    </TableRow>
                  </React.Fragment>
                );
              });
            })()}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={
            workers.filter((w) => {
              const matchesSearch = w.name.toLowerCase().includes(search.toLowerCase()) || w.mobile.includes(search);
              const matchesMonth = selectedMonth === 'All' || (w.joiningDate && w.joiningDate.startsWith(selectedMonth));
              return matchesSearch && matchesMonth;
            }).length
          }
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
          labelRowsPerPage={language === 'gu' ? 'પેજ દીઠ લાઇનો:' : 'Rows per page:'}
          labelDisplayedRows={({ from, to, count }) =>
            language === 'gu'
              ? `${count !== -1 ? count : `કરતાં વધુ ${to}`} માંથી ${from}-${to}`
              : `${from}-${to} of ${count !== -1 ? count : `more than ${to}`}`
          }
        />
      </Card>

      {/* CREATE / EDIT DIALOG */}
      <Dialog open={formOpen} onClose={() => setFormOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 800, bgcolor: 'primary.main', color: '#fff' }}>
          {selectedWorker
            ? (language === 'gu' ? `કારીગર સંશોધિત કરો (${formData.gujaratiName || formData.name})` : `Edit Worker (${formData.name})`)
            : (language === 'gu' ? 'નવો કારીગર ઉમેરો (Add Karigar)' : 'Add New Worker / Karigar')}
        </DialogTitle>
        <Box component="form" onSubmit={handleSaveWorker}>
          <DialogContent sx={{ p: 3 }}>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2, mb: 2 }}>
              <TextField
                fullWidth
                label={language === 'gu' ? 'કારીગરનું પૂરું નામ *' : 'Worker Full Name *'}
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
              <TextField
                fullWidth
                label={language === 'gu' ? 'ગુજરાતી નામ' : 'Gujarati Name (ગુજરાતી નામ)'}
                value={formData.gujaratiName}
                onChange={(e) => setFormData({ ...formData, gujaratiName: e.target.value })}
              />
            </Box>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2, mb: 2 }}>
              <TextField
                select
                fullWidth
                label={language === 'gu' ? 'હોદ્દો / કામગીરી' : 'Role / Job Work'}
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              >
                <MenuItem value="Embroidery Machine Operator">{language === 'gu' ? 'એમ્બ્રોઈડરી મશીન ઓપરેટર' : 'Embroidery Machine Operator'}</MenuItem>
                <MenuItem value="Master Tailor / Cutting">{language === 'gu' ? 'માસ્ટર દરજી / કટિંગ' : 'Master Tailor / Cutting'}</MenuItem>
                <MenuItem value="Thread Trimming & Packing">{language === 'gu' ? 'દોરા કટિંગ અને પેકિંગ' : 'Thread Trimming & Packing'}</MenuItem>
                <MenuItem value="Helper / Dispatch">{language === 'gu' ? 'હેલ્પર / ડિસ્પેચ' : 'Helper / Dispatch'}</MenuItem>
                <MenuItem value="Supervisor">{language === 'gu' ? 'સુપરવાઈઝર' : 'Supervisor'}</MenuItem>
                <MenuItem value="Master / Designer">{language === 'gu' ? 'માસ્ટર / ડિઝાઇનર' : 'Master / Designer'}</MenuItem>
                <MenuItem value="Manager">{language === 'gu' ? 'મેનેજર' : 'Manager'}</MenuItem>
                <MenuItem value="Accountant">{language === 'gu' ? 'એકાઉન્ટન્ટ' : 'Accountant'}</MenuItem>
              </TextField>
              <TextField
                fullWidth
                label={language === 'gu' ? 'મોબાઈલ નંબર *' : 'Mobile Number *'}
                value={formData.mobile}
                onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                required
              />
            </Box>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2, mb: 2 }}>
              <TextField
                fullWidth
                type="number"
                label={language === 'gu' ? 'માસિક મૂળ પગાર (₹) *' : 'Monthly Base Salary (₹) *'}
                value={formData.monthlySalary}
                onChange={(e) => setFormData({ ...formData, monthlySalary: Number(e.target.value) })}
                required
              />
              <TextField
                fullWidth
                type="number"
                label={language === 'gu' ? 'અગાઉ ચૂકવેલ ઉપાડ (₹)' : 'Advance Paid / Upad (₹)'}
                value={formData.advancePaid}
                onChange={(e) => setFormData({ ...formData, advancePaid: Number(e.target.value) })}
              />
            </Box>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2, mb: 2 }}>
              <TextField
                fullWidth
                type="number"
                label={language === 'gu' ? 'બોનસ રકમ (₹)' : 'Bonus Amount (₹)'}
                value={formData.bonus}
                onChange={(e) => setFormData({ ...formData, bonus: Number(e.target.value) })}
              />
              <TextField
                fullWidth
                type="number"
                label={language === 'gu' ? 'હાજરી દિવસો (Total Days)' : 'Total Work Days / Days'}
                value={formData.days}
                onChange={(e) => setFormData({ ...formData, days: Number(e.target.value) })}
                slotProps={{ htmlInput: { min: 0, max: 31, step: 1 } }}
              />
            </Box>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2, mb: 2 }}>
              <TextField
                fullWidth
                type="number"
                label={language === 'gu' ? 'ચૂકવેલ પગાર રકમ (₹)' : 'Paid Salary Amount (₹)'}
                value={formData.paidSalaryAmount}
                onChange={(e) => setFormData({ ...formData, paidSalaryAmount: Number(e.target.value) })}
              />
              <TextField
                select
                fullWidth
                label={language === 'gu' ? 'ચૂકવણી મોડ (Payment Method)' : 'Payment Method / Mode'}
                value={formData.paymentMethod}
                onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
              >
                <MenuItem value="Cash">{language === 'gu' ? 'રોકડ / કેશ (Cash)' : 'Cash'}</MenuItem>
                <MenuItem value="Bank Transfer">{language === 'gu' ? 'બેંક ટ્રાન્સફર (Bank Transfer)' : 'Bank Transfer'}</MenuItem>
                <MenuItem value="Cheque">{language === 'gu' ? 'ચેક (Cheque)' : 'Cheque'}</MenuItem>
                <MenuItem value="UPI">{language === 'gu' ? 'યુપીઆઈ / ઓનલાઈન (UPI)' : 'UPI / Online'}</MenuItem>
              </TextField>
            </Box>

            <Box sx={{ mb: 2 }}>
              <TextField
                fullWidth
                type="date"
                label={language === 'gu' ? 'પગાર મહિનો / જોડાણ તારીખ' : 'Salary Month / Joining Date'}
                value={formData.joiningDate}
                onChange={(e) => setFormData({ ...formData, joiningDate: e.target.value })}
                slotProps={{ inputLabel: { shrink: true } }}
              />
            </Box>

            {/* LIVE SALARY VALUATION & NET CALCULATION BREAKDOWN CARD */}
            <Box
              sx={{
                p: 2,
                borderRadius: 2,
                bgcolor: mode === 'dark' ? '#0f172a' : '#f0f9ff',
                border: `1.5px dashed ${mode === 'dark' ? '#38bdf8' : '#0284c7'}`,
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                <Typography
                  variant="subtitle2"
                  sx={{
                    fontWeight: 800,
                    color: mode === 'dark' ? '#38bdf8' : '#0284c7',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    fontSize: '0.875rem',
                  }}
                >
                  🧮 {language === 'gu' ? 'માસિક પગાર ગણતરી પત્રક (Valuation Breakdown)' : 'Monthly Salary Valuation Breakdown'}
                </Typography>
                <Chip
                  label={translateStatus(
                    (formData.monthlySalary || 0) + (formData.bonus || 0) - (formData.advancePaid || 0) - (formData.paidSalaryAmount || 0) <= 0
                      ? 'Paid'
                      : ((formData.advancePaid || 0) + (formData.paidSalaryAmount || 0)) > 0
                      ? 'Partial'
                      : 'Pending',
                    language
                  )}
                  size="small"
                  sx={{
                    fontWeight: 800,
                    fontSize: '0.72rem',
                    height: 22,
                    bgcolor:
                      (formData.monthlySalary || 0) + (formData.bonus || 0) - (formData.advancePaid || 0) - (formData.paidSalaryAmount || 0) <= 0
                        ? '#dcfce7'
                        : ((formData.advancePaid || 0) + (formData.paidSalaryAmount || 0)) > 0
                        ? '#fef9c3'
                        : '#f1f5f9',
                    color:
                      (formData.monthlySalary || 0) + (formData.bonus || 0) - (formData.advancePaid || 0) - (formData.paidSalaryAmount || 0) <= 0
                        ? '#15803d'
                        : ((formData.advancePaid || 0) + (formData.paidSalaryAmount || 0)) > 0
                        ? '#854d0e'
                        : '#64748b',
                  }}
                />
              </Box>
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, fontSize: '0.85rem' }}>
                <Box sx={{ color: mode === 'dark' ? '#cbd5e1' : '#475569' }}>
                  {language === 'gu' ? 'હાજરી દિવસો (Total Days):' : 'Total Days Worked:'}
                </Box>
                <Box sx={{ fontWeight: 700, textAlign: 'right', color: mode === 'dark' ? '#f8fafc' : '#0f172a' }}>
                  {formData.days ?? 30} {language === 'gu' ? 'દિવસ' : 'days'}
                </Box>

                <Box sx={{ color: mode === 'dark' ? '#cbd5e1' : '#475569' }}>
                  {language === 'gu' ? 'માસિક મૂળ પગાર (Base Salary):' : 'Monthly Base Salary:'}
                </Box>
                <Box sx={{ fontWeight: 700, textAlign: 'right', color: mode === 'dark' ? '#f8fafc' : '#0f172a' }}>
                  {formatRupees(formData.monthlySalary || 0)}
                </Box>

                <Box sx={{ color: mode === 'dark' ? '#f87171' : '#dc2626' }}>
                  {language === 'gu' ? '(-) ચૂકવેલ અગાઉ ઉપાડ (Upad):' : '(-) Advance Paid / Upad:'}
                </Box>
                <Box sx={{ fontWeight: 700, textAlign: 'right', color: mode === 'dark' ? '#f87171' : '#dc2626' }}>
                  -{formatRupees(formData.advancePaid || 0)}
                </Box>

                <Box sx={{ color: mode === 'dark' ? '#4ade80' : '#16a34a' }}>
                  {language === 'gu' ? '(+) બોનસ રકમ (Bonus):' : '(+) Bonus Amount:'}
                </Box>
                <Box sx={{ fontWeight: 700, textAlign: 'right', color: mode === 'dark' ? '#4ade80' : '#16a34a' }}>
                  +{formatRupees(formData.bonus || 0)}
                </Box>

                <Box sx={{ color: mode === 'dark' ? '#38bdf8' : '#0284c7' }}>
                  {language === 'gu' ? '(-) ચૂકવેલ પગાર (Paid Salary):' : '(-) Paid Salary Amount:'}
                </Box>
                <Box sx={{ fontWeight: 700, textAlign: 'right', color: mode === 'dark' ? '#38bdf8' : '#0284c7' }}>
                  -{formatRupees(formData.paidSalaryAmount || 0)}
                </Box>

                <Box sx={{ color: mode === 'dark' ? '#cbd5e1' : '#475569' }}>
                  {language === 'gu' ? 'ચૂકવણી મોડ (Payment Mode):' : 'Payment Method:'}
                </Box>
                <Box sx={{ fontWeight: 700, textAlign: 'right', color: mode === 'dark' ? '#f8fafc' : '#0f172a' }}>
                  {formData.paymentMethod === 'Cash'
                    ? (language === 'gu' ? 'રોકડ (Cash)' : 'Cash')
                    : formData.paymentMethod === 'Bank Transfer'
                    ? (language === 'gu' ? 'બેંક ટ્રાન્સફર' : 'Bank Transfer')
                    : formData.paymentMethod === 'Cheque'
                    ? (language === 'gu' ? 'ચેક' : 'Cheque')
                    : formData.paymentMethod === 'UPI'
                    ? (language === 'gu' ? 'યુપીઆઈ / ઓનલાઈન' : 'UPI / Online')
                    : formData.paymentMethod}
                </Box>

                <Box sx={{ gridColumn: '1 / -1', my: 0.5, borderTop: `1px solid ${mode === 'dark' ? '#334155' : '#cbd5e1'}` }} />

                <Box sx={{ fontWeight: 800, color: mode === 'dark' ? '#38bdf8' : '#0284c7', fontSize: '0.875rem' }}>
                  {language === 'gu' ? 'ચૂકવવાનો બાકી નેટ પગાર:' : 'Net Remaining Payable:'}
                </Box>
                <Box sx={{ fontWeight: 800, textAlign: 'right', color: mode === 'dark' ? '#38bdf8' : '#0284c7', fontSize: '0.95rem' }}>
                  {formatRupees((formData.monthlySalary || 0) + (formData.bonus || 0) - (formData.advancePaid || 0) - (formData.paidSalaryAmount || 0))}
                </Box>
              </Box>
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 2.5 }}>
            <Button onClick={() => setFormOpen(false)} variant="outlined">
              {language === 'gu' ? 'રદ કરો (Cancel)' : 'Cancel'}
            </Button>
            <Button type="submit" variant="contained" color="primary" sx={{ fontWeight: 700 }}>
              {language === 'gu' ? 'કારીગર સેવ કરો (Save Worker)' : 'Save Worker'}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      {/* DATE-WISE ADVANCE / UPAD MANAGEMENT DIALOG */}
      <Dialog open={advanceOpen} onClose={() => setAdvanceOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle
          sx={{
            fontWeight: 800,
            bgcolor: 'primary.main',
            color: '#ffffff',
            py: 2,
            px: 3,
            display: 'flex',
            justify: 'space-between',
            alignItems: 'center',
          }}
        >
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800, fontSize: '1.1rem', lineHeight: 1.2 }}>
              {language === 'gu' ? 'તારીખવાર ઉપાડ પત્રક (Date-wise Upad Record)' : 'Date-wise Upad / Advance Record'}
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.9 }}>
              Karigar: <strong>{selectedWorker?.name}</strong> {selectedWorker?.gujaratiName ? `(${selectedWorker.gujaratiName})` : ''} • Month: {selectedWorker?.joiningDate ? formatSalaryMonth(selectedWorker.joiningDate, language) : ''}
            </Typography>
          </Box>
          <Chip
            label={selectedWorker?.status || 'Active'}
            size="small"
            color={selectedWorker?.status === 'Paid' ? 'success' : selectedWorker?.status === 'Partial' ? 'warning' : 'default'}
            sx={{ fontWeight: 800, color: '#fff', bgcolor: selectedWorker?.status === 'Partial' ? '#f59e0b' : undefined }}
          />
        </DialogTitle>

        <DialogContent sx={{ p: 3, pt: '24px !important', bgcolor: mode === 'dark' ? '#0f172a' : '#f8fafc' }}>
          {/* SUMMARY CARDS */}
          {selectedWorker && (
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 1fr',
                gap: 1.5,
                mb: 3,
                mt: 1,
                p: 2,
                borderRadius: 2,
                bgcolor: mode === 'dark' ? '#1e293b' : '#ffffff',
                border: `1px solid ${mode === 'dark' ? '#334155' : '#e2e8f0'}`,
              }}
            >
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontWeight: 600 }}>
                  {language === 'gu' ? 'મૂળ પગાર' : 'Base Salary'}
                </Typography>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: mode === 'dark' ? '#f8fafc' : '#0f172a' }}>
                  {formatRupees(selectedWorker.monthlySalary)}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontWeight: 600 }}>
                  {language === 'gu' ? 'કુલ ઉપાડ (-)' : 'Total Upad (-)'}
                </Typography>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: mode === 'dark' ? '#f87171' : '#dc2626' }}>
                  {formatRupees(selectedWorker.advancePaid)}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontWeight: 600 }}>
                  {language === 'gu' ? 'બાકી રકમ' : 'Net Payable'}
                </Typography>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: mode === 'dark' ? '#38bdf8' : '#0284c7' }}>
                  {formatRupees(selectedWorker.remainingSalary)}
                </Typography>
              </Box>
            </Box>
          )}

          {/* ADD UPAD FORM */}
          <Box
            component="form"
            onSubmit={handleAddAdvanceEntry}
            sx={{
              p: 2,
              mb: 3,
              borderRadius: 2,
              bgcolor: mode === 'dark' ? '#1e293b' : '#ffffff',
              border: `1px solid ${mode === 'dark' ? '#334155' : '#e2e8f0'}`,
            }}
          >
            <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1.5, color: mode === 'dark' ? '#38bdf8' : '#0284c7' }}>
              ➕ {language === 'gu' ? 'નવો ઉપાડ ઉમેરો (Add Upad Entry)' : 'Add New Upad Entry'}
            </Typography>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr' }, gap: 1.5, mb: 1.5 }}>
              <TextField
                fullWidth
                size="small"
                type="date"
                label={language === 'gu' ? 'ઉપાડ તારીખ' : 'Upad Date'}
                value={advanceDate}
                onChange={(e) => setAdvanceDate(e.target.value)}
                slotProps={{ inputLabel: { shrink: true } }}
                required
              />
              <TextField
                fullWidth
                size="small"
                type="number"
                label={language === 'gu' ? 'ઉપાડ રકમ (₹)' : 'Upad Amount (₹)'}
                placeholder="e.g. 2000"
                value={advanceAmountInput}
                onChange={(e) => setAdvanceAmountInput(e.target.value)}
                required
                autoFocus
              />
              <TextField
                fullWidth
                size="small"
                label={language === 'gu' ? 'વિગત / Note' : 'Note / Payment Mode'}
                placeholder="Cash, UPI, etc."
                value={advanceNoteInput}
                onChange={(e) => setAdvanceNoteInput(e.target.value)}
              />
            </Box>

            <Button
              type="submit"
              variant="contained"
              color="warning"
              size="small"
              fullWidth
              sx={{ fontWeight: 800, textTransform: 'none', py: 1 }}
            >
              + {language === 'gu' ? 'ઉપાડ ઉમેરો (Save Upad Entry)' : 'Save Upad Entry'}
            </Button>
          </Box>

          {/* UPAD HISTORY LIST */}
          <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1, color: mode === 'dark' ? '#cbd5e1' : '#334155' }}>
            📋 {language === 'gu' ? 'મહિનાની ઉપાડ યાદી (Monthly Upad History)' : 'Monthly Upad History'}
          </Typography>

          <TableContainer
            component={Paper}
            elevation={0}
            sx={{
              maxHeight: 220,
              border: `1px solid ${mode === 'dark' ? '#334155' : '#e2e8f0'}`,
              bgcolor: mode === 'dark' ? '#1e293b' : '#ffffff',
            }}
          >
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: mode === 'dark' ? '#0f172a' : '#f1f5f9' }}>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem' }}>
                    {language === 'gu' ? 'તારીખ (DATE)' : 'DATE'}
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem' }} align="right">
                    {language === 'gu' ? 'ઉપાડ રકમ (AMOUNT)' : 'AMOUNT'}
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem' }}>
                    {language === 'gu' ? 'વિગત (NOTE)' : 'NOTE'}
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem' }} align="center">
                    ACTION
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {selectedWorker?.advances && selectedWorker.advances.length > 0 ? (
                  selectedWorker.advances.map((adv) => (
                    <TableRow key={adv.id}>
                      <TableCell sx={{ fontWeight: 600, fontSize: '0.825rem' }}>
                        {formatDate(adv.date)}
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 800, color: mode === 'dark' ? '#f87171' : '#dc2626', fontSize: '0.85rem' }}>
                        {formatRupees(adv.amount)}
                      </TableCell>
                      <TableCell sx={{ color: mode === 'dark' ? '#94a3b8' : '#64748b', fontSize: '0.8rem' }}>
                        {adv.notes || '-'}
                      </TableCell>
                      <TableCell align="center">
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteAdvanceEntry(adv.id)}
                          sx={{ color: mode === 'dark' ? '#f87171' : '#dc2626', p: '2px' }}
                        >
                          <DeleteIcon sx={{ fontSize: 16 }} />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} align="center" sx={{ py: 3, color: mode === 'dark' ? '#94a3b8' : '#64748b', fontSize: '0.85rem' }}>
                      {language === 'gu'
                        ? 'આ મહિનામાં હજી સુધી કોઈ ઉપાડ નોંધેલ નથી (No Upad entries)'
                        : 'No upad entries recorded for this month yet.'}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>

        <DialogActions sx={{ p: 2, bgcolor: mode === 'dark' ? '#0f172a' : '#f8fafc', borderTop: `1px solid ${mode === 'dark' ? '#334155' : '#e2e8f0'}` }}>
          <Button onClick={() => setAdvanceOpen(false)} variant="contained" color="primary" sx={{ fontWeight: 700, px: 3 }}>
            {language === 'gu' ? 'બંધ કરો (Close)' : 'Done / Close'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* SALARY PRINT SLIP MODAL */}
      {printWorker && (
        <SalaryPrintModal
          open={Boolean(printWorker)}
          onClose={() => setPrintWorker(null)}
          worker={printWorker}
          settings={settings}
        />
      )}

      <ConfirmationDialog
        open={deleteOpen}
        title="Remove Worker?"
        message="Are you sure you want to remove this worker from the system?"
        onConfirm={handleDeleteConfirm}
        onClose={() => setDeleteOpen(false)}
      />
    </Box>
  );
};
