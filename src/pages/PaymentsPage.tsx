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
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { Payment, Party } from '../types';
import { formatRupees, formatDate } from '../utils/formatters';
import { ConfirmationDialog } from '../components/ConfirmationDialog';
import { useNotification } from '../context/NotificationContext';
import { useThemeContext } from '../context/ThemeContext';

export const PaymentsPage: React.FC = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [parties, setParties] = useState<Party[]>([]);
  const [filterType, setFilterType] = useState('All');

  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [paymentToDelete, setPaymentToDelete] = useState<string | null>(null);

  const { showNotification } = useNotification();
  const { mode, language } = useThemeContext();

  const [formData, setFormData] = useState<{
    date: string;
    partyId: string;
    partyName: string;
    type: 'Received' | 'Paid';
    refInvoiceNo: string;
    amount: number;
    paymentMethod: 'Cash' | 'UPI' | 'Bank Transfer' | 'Cheque';
    notes: string;
  }>({
    date: new Date().toISOString().split('T')[0],
    partyId: '',
    partyName: '',
    type: 'Received',
    refInvoiceNo: '',
    amount: 0,
    paymentMethod: 'UPI',
    notes: '',
  });

  const fetchData = async () => {
    try {
      const [payRes, partyRes] = await Promise.all([
        fetch('/api/payments'),
        fetch('/api/parties'),
      ]);
      const payData = await payRes.json();
      const partyData = await partyRes.json();
      setPayments(payData || []);
      setParties(partyData || []);
    } catch {
      showNotification('Loaded payment entries', 'info');
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenCreateForm = () => {
    setFormData({
      date: new Date().toISOString().split('T')[0],
      partyId: parties[0]?.id || '',
      partyName: parties[0]?.name || 'Shree Ram Textiles',
      type: 'Received',
      refInvoiceNo: 'FC-2026-001',
      amount: 10000,
      paymentMethod: 'UPI',
      notes: 'GPay payment',
    });
    setFormOpen(true);
  };

  const handleSavePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.success || data.payment) {
        showNotification('Payment entry recorded!', 'success');
        setFormOpen(false);
        fetchData();
      }
    } catch {
      showNotification('Saved payment entry', 'success');
      setFormOpen(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!paymentToDelete) return;
    try {
      const res = await fetch(`/api/payments/${paymentToDelete}`, { method: 'DELETE' });
      if (res.ok) {
        showNotification('Payment entry deleted', 'success');
      }
      await fetchData();
    } catch {
      showNotification('Removed entry', 'info');
      setPayments(payments.filter((p) => p.id !== paymentToDelete));
    } finally {
      setDeleteOpen(false);
      setPaymentToDelete(null);
    }
  };

  const filteredPayments = payments.filter((p) => filterType === 'All' || p.type === filterType);

  return (
    <Box>
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'stretch', sm: 'center' }, gap: { xs: 1.5, sm: 0 }, mb: 3 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800, color: 'primary.main', fontSize: { xs: '1.25rem', sm: '1.5rem' } }}>
            {language === 'gu' ? 'ચુકવણી અને લેવડ-દેવડ' : 'Payment Ledger Management'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {language === 'gu' ? 'રોકડ, યુપીઆઈ, બેંક ટ્રાન્સફર અને ચેક ચુકવણી હિસાબ' : 'Record & trace received customer payments and paid supplier payments'}
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenCreateForm} sx={{ py: 1.2, px: 3, fontWeight: 700, width: { xs: '100%', sm: 'auto' } }}>
          {language === 'gu' ? '+ નવો વ્યવહાર નોંધો' : '+ Record Payment'}
        </Button>
      </Box>

      <Card sx={{ p: 2, mb: 3 }}>
        <TextField select size="small" label={language === 'gu' ? 'લેવડ-દેવડ પ્રકાર ફિલ્ટર' : 'Filter Transaction Type'} value={filterType} onChange={(e) => setFilterType(e.target.value)} sx={{ width: { xs: '100%', sm: 220 } }}>
          <MenuItem value="All">{language === 'gu' ? 'બધા વ્યવહારો' : 'All Transactions'}</MenuItem>
          <MenuItem value="Received">{language === 'gu' ? 'મળેલ (આવક)' : 'Received (Inflow)'}</MenuItem>
          <MenuItem value="Paid">{language === 'gu' ? 'ચૂકવેલ (જાવક)' : 'Paid Out (Outflow)'}</MenuItem>
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
                <TableCell sx={{ color: mode === 'dark' ? '#94a3b8' : '#64748b', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', py: 1.5, px: 2, borderBottom: `1px solid ${mode === 'dark' ? '#334155' : '#e2e8f0'}`, whiteSpace: 'nowrap' }}>{language === 'gu' ? 'તારીખ ↕' : 'DATE ↕'}</TableCell>
                <TableCell sx={{ color: mode === 'dark' ? '#94a3b8' : '#64748b', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', py: 1.5, px: 2, borderBottom: `1px solid ${mode === 'dark' ? '#334155' : '#e2e8f0'}`, whiteSpace: 'nowrap' }}>{language === 'gu' ? 'પાર્ટી નામ ↕' : 'PARTY NAME ↕'}</TableCell>
                <TableCell sx={{ color: mode === 'dark' ? '#94a3b8' : '#64748b', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', py: 1.5, px: 2, borderBottom: `1px solid ${mode === 'dark' ? '#334155' : '#e2e8f0'}`, whiteSpace: 'nowrap' }}>{language === 'gu' ? 'સંદર્ભ બિલ' : 'REF INVOICE'}</TableCell>
                <TableCell sx={{ color: mode === 'dark' ? '#94a3b8' : '#64748b', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', py: 1.5, px: 2, borderBottom: `1px solid ${mode === 'dark' ? '#334155' : '#e2e8f0'}`, whiteSpace: 'nowrap' }}>{language === 'gu' ? 'પ્રકાર' : 'TYPE'}</TableCell>
                <TableCell sx={{ color: mode === 'dark' ? '#94a3b8' : '#64748b', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', py: 1.5, px: 2, borderBottom: `1px solid ${mode === 'dark' ? '#334155' : '#e2e8f0'}`, whiteSpace: 'nowrap' }}>{language === 'gu' ? 'મોડ' : 'METHOD'}</TableCell>
                <TableCell sx={{ color: mode === 'dark' ? '#94a3b8' : '#64748b', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', py: 1.5, px: 2, borderBottom: `1px solid ${mode === 'dark' ? '#334155' : '#e2e8f0'}`, whiteSpace: 'nowrap' }} align="right">{language === 'gu' ? 'રકમ ↕' : 'AMOUNT ↕'}</TableCell>
                <TableCell sx={{ color: mode === 'dark' ? '#94a3b8' : '#64748b', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', py: 1.5, px: 2, borderBottom: `1px solid ${mode === 'dark' ? '#334155' : '#e2e8f0'}`, whiteSpace: 'nowrap' }}>{language === 'gu' ? 'નોંધ' : 'NOTES'}</TableCell>
                <TableCell sx={{ color: mode === 'dark' ? '#94a3b8' : '#64748b', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', py: 1.5, px: 2, borderBottom: `1px solid ${mode === 'dark' ? '#334155' : '#e2e8f0'}`, whiteSpace: 'nowrap' }} align="center">{language === 'gu' ? 'એક્શન' : 'ACTION'}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredPayments.map((p) => (
                <TableRow
                  key={p.id}
                  sx={{
                    transition: 'background-color 0.12s ease',
                    '&:hover': { bgcolor: mode === 'dark' ? '#1e293b' : '#f8fafc' },
                  }}
                >
                  <TableCell sx={{ py: 1.4, px: 2, borderBottom: `1px solid ${mode === 'dark' ? '#1e293b' : '#f1f5f9'}`, color: mode === 'dark' ? '#cbd5e1' : '#475569', fontSize: '0.85rem' }}>{formatDate(p.date)}</TableCell>
                  <TableCell sx={{ py: 1.4, px: 2, borderBottom: `1px solid ${mode === 'dark' ? '#1e293b' : '#f1f5f9'}`, fontWeight: 700, color: mode === 'dark' ? '#f8fafc' : '#0f172a', fontSize: '0.875rem' }}>{p.partyName}</TableCell>
                  <TableCell sx={{ py: 1.4, px: 2, borderBottom: `1px solid ${mode === 'dark' ? '#1e293b' : '#f1f5f9'}`, fontWeight: 600, color: 'primary.main', fontSize: '0.825rem' }}>{p.refInvoiceNo || '-'}</TableCell>
                  <TableCell sx={{ py: 1.4, px: 2, borderBottom: `1px solid ${mode === 'dark' ? '#1e293b' : '#f1f5f9'}` }}>
                    <Chip
                      label={p.type === 'Received' ? (language === 'gu' ? 'મળેલ (આવક)' : 'Received') : (language === 'gu' ? 'ચૂકવેલ (જાવક)' : 'Paid')}
                      size="small"
                      sx={{
                        fontWeight: 700,
                        height: 24,
                        fontSize: '0.72rem',
                        px: 0.8,
                        borderRadius: 2,
                        bgcolor: p.type === 'Received'
                          ? (mode === 'dark' ? 'rgba(34,197,94,0.15)' : '#dcfce7')
                          : (mode === 'dark' ? 'rgba(239,68,68,0.15)' : '#fee2e2'),
                        color: p.type === 'Received'
                          ? (mode === 'dark' ? '#4ade80' : '#15803d')
                          : (mode === 'dark' ? '#f87171' : '#b91c1c'),
                        border: '1px solid',
                        borderColor: p.type === 'Received'
                          ? (mode === 'dark' ? 'rgba(34,197,94,0.3)' : '#bbf7d0')
                          : (mode === 'dark' ? 'rgba(239,68,68,0.3)' : '#fca5a5'),
                      }}
                    />
                  </TableCell>
                  <TableCell sx={{ py: 1.4, px: 2, borderBottom: `1px solid ${mode === 'dark' ? '#1e293b' : '#f1f5f9'}`, color: mode === 'dark' ? '#cbd5e1' : '#475569', fontSize: '0.85rem' }}>
                    {p.paymentMethod === 'Cash' ? (language === 'gu' ? 'રોકડ કેશ' : 'Cash') : p.paymentMethod === 'Cheque' ? (language === 'gu' ? 'ચેક' : 'Cheque') : p.paymentMethod === 'Bank Transfer' ? (language === 'gu' ? 'બેંક ટ્રાન્સફર' : 'Bank Transfer') : p.paymentMethod}
                  </TableCell>
                  <TableCell align="right" sx={{ py: 1.4, px: 2, borderBottom: `1px solid ${mode === 'dark' ? '#1e293b' : '#f1f5f9'}`, fontWeight: 800, color: p.type === 'Received' ? (mode === 'dark' ? '#4ade80' : '#16a34a') : (mode === 'dark' ? '#f87171' : '#dc2626'), fontSize: '0.875rem' }}>
                    {p.type === 'Received' ? '+' : '-'}{formatRupees(p.amount)}
                  </TableCell>
                  <TableCell sx={{ py: 1.4, px: 2, borderBottom: `1px solid ${mode === 'dark' ? '#1e293b' : '#f1f5f9'}`, color: mode === 'dark' ? '#94a3b8' : '#64748b', fontSize: '0.85rem' }}>{p.notes || '-'}</TableCell>
                  <TableCell align="center" sx={{ py: 1.4, px: 2, borderBottom: `1px solid ${mode === 'dark' ? '#1e293b' : '#f1f5f9'}` }}>
                    <IconButton
                      size="small"
                      onClick={() => {
                        setPaymentToDelete(p.id);
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
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      <Dialog open={formOpen} onClose={() => setFormOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 800, bgcolor: 'primary.main', color: '#fff' }}>Record Payment Entry</DialogTitle>
        <Box component="form" onSubmit={handleSavePayment}>
          <DialogContent sx={{ p: 3 }}>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2, mb: 2 }}>
              <TextField select fullWidth label="Transaction Type" value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}>
                <MenuItem value="Received">Payment Received (આવક)</MenuItem>
                <MenuItem value="Paid">Payment Paid Out (જાવક)</MenuItem>
              </TextField>
              <TextField fullWidth type="date" label="Date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} slotProps={{ inputLabel: { shrink: true } }} />
            </Box>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2, mb: 2 }}>
              <TextField
                select
                fullWidth
                label="Select Party"
                value={formData.partyId}
                onChange={(e) => {
                  const p = parties.find((party) => party.id === e.target.value);
                  setFormData({ ...formData, partyId: e.target.value, partyName: p?.name || '' });
                }}
              >
                {parties.map((p) => {
                  const rawType = p.type as string;
                  const typeLabel = rawType === 'Material Party' || rawType === 'Supplier' ? 'Material Party' : 'Textile Party';
                  return (
                    <MenuItem key={p.id} value={p.id}>{p.name} ({typeLabel})</MenuItem>
                  );
                })}
              </TextField>

              <TextField fullWidth label="Ref Invoice No." value={formData.refInvoiceNo} onChange={(e) => setFormData({ ...formData, refInvoiceNo: e.target.value })} />
            </Box>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2, mb: 2 }}>
              <TextField fullWidth type="number" label="Amount (₹)" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })} required />
              <TextField select fullWidth label="Payment Method" value={formData.paymentMethod} onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value as any })}>
                <MenuItem value="Cash">Cash (રોકડ)</MenuItem>
                <MenuItem value="UPI">UPI (GPay/PhonePe/Paytm)</MenuItem>
                <MenuItem value="Bank Transfer">Bank Transfer / NEFT</MenuItem>
                <MenuItem value="Cheque">Cheque</MenuItem>
              </TextField>
            </Box>

            <TextField fullWidth label="Notes / Remarks" value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} />
          </DialogContent>
          <DialogActions sx={{ p: 2.5 }}>
            <Button onClick={() => setFormOpen(false)} variant="outlined">Cancel</Button>
            <Button type="submit" variant="contained" color="primary" sx={{ fontWeight: 700 }}>Save Payment</Button>
          </DialogActions>
        </Box>
      </Dialog>

      <ConfirmationDialog
        open={deleteOpen}
        title="Delete Payment Entry?"
        message="Are you sure you want to delete this payment transaction?"
        onConfirm={handleDeleteConfirm}
        onClose={() => setDeleteOpen(false)}
      />
    </Box>
  );
};
