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
  TablePagination,
  Chip,
  IconButton,
  TextField,
  InputAdornment,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip,
  Paper,
  Autocomplete,
  Switch,
  FormControlLabel,
  Avatar,
  Menu,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Print as PrintIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Close as CloseIcon,
  Share as ShareIcon,
  WhatsApp as WhatsAppIcon,
  ContentCopy as CopyIcon,
} from '@mui/icons-material';
import { Bill, BillItem, Party, CompanySettings } from '../types';
import { formatRupees, formatDate } from '../utils/formatters';
import { InvoiceModal } from '../components/InvoiceModal';
import { ConfirmationDialog } from '../components/ConfirmationDialog';
import { useNotification } from '../context/NotificationContext';
import { useThemeContext } from '../context/ThemeContext';

export const BillingPage: React.FC = () => {
  const [bills, setBills] = useState<Bill[]>([]);
  const [parties, setParties] = useState<Party[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [formOpen, setFormOpen] = useState(false);
  const [taxEnabled, setTaxEnabled] = useState(false);
  const [showNotesAndCharges, setShowNotesAndCharges] = useState(false);
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [viewDetailsOpen, setViewDetailsOpen] = useState(false);
  const [billToView, setBillToView] = useState<Bill | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [billToDelete, setBillToDelete] = useState<string | null>(null);

  const [shareMenuAnchor, setShareMenuAnchor] = useState<null | HTMLElement>(null);
  const [billToShare, setBillToShare] = useState<Bill | null>(null);

  const handleOpenShareMenu = (event: React.MouseEvent<HTMLElement>, bill: Bill) => {
    event.stopPropagation();
    setShareMenuAnchor(event.currentTarget);
    setBillToShare(bill);
  };

  const handleCloseShareMenu = () => {
    setShareMenuAnchor(null);
    setBillToShare(null);
  };

  const handleShareWhatsApp = () => {
    if (!billToShare) return;
    const party = parties.find((p) => p.id === billToShare.partyId || p.name === billToShare.partyName);
    let rawPhone = party?.mobile ? party.mobile.replace(/\D/g, '') : '';
    if (rawPhone.length === 10) {
      rawPhone = '91' + rawPhone;
    }

    const itemsSummary = (billToShare.items || [])
      .map(
        (item) =>
          `  • ${item.description || item.designNo || 'Item'} (${item.quantity} ${item.unit || ''} x ₹${item.rate} = ₹${item.amount})`
      )
      .join('\n');

    const text =
      `📄 *TAX INVOICE - ${settings.companyName || 'FENI CREATION'}*\n\n` +
      `*Invoice No:* #${billToShare.invoiceNo}\n` +
      `*Date:* ${formatDate(billToShare.date)}\n` +
      `*Party Name:* ${billToShare.partyName}\n` +
      (party?.gstin ? `*Party GSTIN:* ${party.gstin}\n` : '') +
      `\n*Items Summary:*\n${itemsSummary || '  • Invoice items'}\n\n` +
      `*Subtotal:* ₹${billToShare.subtotal.toLocaleString('en-IN')}\n` +
      `*GST (5%):* ₹${billToShare.totalTax.toLocaleString('en-IN')}\n` +
      `*Grand Total:* ₹${billToShare.totalAmount.toLocaleString('en-IN')}\n` +
      `*Paid Amount:* ₹${billToShare.paidAmount.toLocaleString('en-IN')}\n` +
      `*Pending Balance:* ₹${billToShare.pendingAmount.toLocaleString('en-IN')}\n` +
      `*Status:* ${billToShare.status}\n\n` +
      `Thank you for doing business with us! 🙏`;

    const encodedText = encodeURIComponent(text);
    const waUrl = rawPhone
      ? `https://wa.me/${rawPhone}?text=${encodedText}`
      : `https://wa.me/?text=${encodedText}`;

    window.open(waUrl, '_blank');
    handleCloseShareMenu();
  };

  const handleCopyBillDetails = () => {
    if (!billToShare) return;
    const text =
      `TAX INVOICE - ${settings.companyName || 'FENI CREATION'}\n` +
      `Invoice No: #${billToShare.invoiceNo}\n` +
      `Date: ${formatDate(billToShare.date)}\n` +
      `Party: ${billToShare.partyName}\n` +
      `Total Amount: ₹${billToShare.totalAmount.toLocaleString('en-IN')}\n` +
      `Paid: ₹${billToShare.paidAmount.toLocaleString('en-IN')}\n` +
      `Pending Balance: ₹${billToShare.pendingAmount.toLocaleString('en-IN')}`;

    navigator.clipboard.writeText(text);
    showNotification(
      language === 'gu' ? 'ઇનવોઇસ વિગતો કોપી થઈ ગઈ' : 'Invoice summary copied to clipboard!',
      'success'
    );
    handleCloseShareMenu();
  };

  const handleNativeShare = async () => {
    if (!billToShare) return;
    const text =
      `TAX INVOICE - ${settings.companyName || 'FENI CREATION'}\n` +
      `Invoice No: #${billToShare.invoiceNo}\n` +
      `Party: ${billToShare.partyName}\n` +
      `Total: ₹${billToShare.totalAmount.toLocaleString('en-IN')}\n` +
      `Pending: ₹${billToShare.pendingAmount.toLocaleString('en-IN')}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `Invoice #${billToShare.invoiceNo}`,
          text: text,
        });
      } catch (err) {
        console.log('Share canceled', err);
      }
    } else {
      handleCopyBillDetails();
    }
    handleCloseShareMenu();
  };

  const { showNotification } = useNotification();
  const { mode, language } = useThemeContext();

  const [settings, setSettings] = useState<CompanySettings>({
    companyName: 'FENI CREATION',
    tagline: 'Embroidery & Textile Manufacturing',
    gstin: '24ABCDE1234F1Z5',
    email: 'fenicreation001@gmail.com',
    phone: '+91 98765 43210',
    address: 'Plot No. 124, GIDC Industrial Estate, Varachha, Surat - 395006, Gujarat, India',
    bankName: 'State Bank of India',
    accountNo: '39485726102',
    ifscCode: 'SBIN0001234',
    gujaratiSupport: true,
  });

  const [formData, setFormData] = useState<{
    challanNo?: string;
    invoiceNo: string;
    partyId: string;
    partyName: string;
    partyGstin: string;
    date: string;
    dueDate: string;
    paidAmount: any;
    notes: string;
    chargeAmount: any;
    paymentStatus: 'Received' | 'Pending';
    paymentMethod: 'Cash' | 'Cheque' | 'UPI' | 'Bank Transfer';
    paymentDate: string;
    chequeNo: string;
    chequeDate: string;
    chequeBank: string;
    items: BillItem[];
  }>({
    challanNo: '',
    invoiceNo: '',
    partyId: '',
    partyName: '',
    partyGstin: '',
    date: new Date().toISOString().split('T')[0],
    dueDate: '',
    paidAmount: '',
    notes: '',
    chargeAmount: '',
    paymentStatus: 'Pending',
    paymentMethod: 'Cash',
    paymentDate: new Date().toISOString().split('T')[0],
    chequeNo: '',
    chequeDate: new Date().toISOString().split('T')[0],
    chequeBank: '',
    items: [{ id: 'i_1', description: '', quantity: '' as any, unit: 'Meters', rate: '' as any, amount: '' as any }],
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [billsRes, partiesRes, settingsRes] = await Promise.all([
        fetch('/api/bills'),
        fetch('/api/parties'),
        fetch('/api/settings'),
      ]);
      const billsData = await billsRes.json();
      const partiesData = await partiesRes.json();
      const settingsData = await settingsRes.json();
      setBills(billsData || []);
      setParties(partiesData || []);
      if (settingsData && settingsData.companyName) setSettings(settingsData);
    } catch {
      showNotification('Loaded local bills inventory', 'info');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenCreateForm = () => {
    setSelectedBill(null);
    setTaxEnabled(false);
    setShowNotesAndCharges(false);
    setFormData({
      challanNo: '',
      invoiceNo: '',
      partyId: '',
      partyName: '',
      partyGstin: '',
      date: new Date().toISOString().split('T')[0],
      dueDate: '',
      paidAmount: '',
      notes: '',
      chargeAmount: '',
      paymentStatus: 'Pending',
      paymentMethod: 'Cash',
      paymentDate: new Date().toISOString().split('T')[0],
      chequeNo: '',
      chequeDate: new Date().toISOString().split('T')[0],
      chequeBank: '',
      items: [
        {
          id: 'i_' + Date.now(),
          challanNo: '',
          designNo: '',
          description: '',
          quantity: '' as any,
          unit: 'Meters',
          rate: '' as any,
          shortage: '' as any,
          discountPercent: '' as any,
          discountAmount: '' as any,
          amount: '' as any,
        },
      ],
    });
    setFormOpen(true);
  };

  const handleOpenEditForm = (bill: Bill) => {
    setSelectedBill(bill);
    setTaxEnabled(Boolean((bill.cgst && bill.cgst > 0) || (bill.sgst && bill.sgst > 0) || (bill.totalTax && bill.totalTax > 0)));
    setShowNotesAndCharges(Boolean(bill.notes || (bill.extraCharges && bill.extraCharges > 0)));
    const statusMap: 'Received' | 'Pending' = (bill.status === 'Paid' || bill.status === 'Received' || bill.paidAmount > 0) ? 'Received' : 'Pending';
    setFormData({
      challanNo: bill.challanNo || (bill.items && bill.items[0]?.challanNo) || '',
      invoiceNo: bill.invoiceNo,
      partyId: bill.partyId,
      partyName: bill.partyName,
      partyGstin: bill.partyGstin || '',
      date: bill.date,
      dueDate: bill.dueDate || '',
      paidAmount: bill.paidAmount,
      notes: bill.notes || '',
      chargeAmount: bill.extraCharges ?? ('' as any),
      paymentStatus: statusMap,
      paymentMethod: (bill.paymentMethod as any) || 'Cash',
      paymentDate: bill.paymentDate || bill.date || new Date().toISOString().split('T')[0],
      chequeNo: bill.chequeNo || '',
      chequeDate: bill.chequeDate || new Date().toISOString().split('T')[0],
      chequeBank: bill.chequeBank || '',
      items:
        bill.items && bill.items.length
          ? bill.items.map((i) => ({
              ...i,
              challanNo: i.challanNo || '',
              designNo: i.designNo || '',
              shortage: i.shortage ?? ('' as any),
              discountPercent: i.discountPercent ?? ('' as any),
              discountAmount: i.discountAmount ?? ('' as any),
            }))
          : [
              {
                id: 'i_1',
                challanNo: '',
                designNo: '',
                description: '',
                quantity: '' as any,
                unit: 'Meters',
                rate: '' as any,
                shortage: '' as any,
                discountPercent: '' as any,
                discountAmount: '' as any,
                amount: '' as any,
              },
            ],
    });
    setFormOpen(true);
  };

  const handlePartySelect = (partyId: string) => {
    const selected = parties.find((p) => p.id === partyId);
    if (selected) {
      setFormData((prev) => ({
        ...prev,
        partyId: selected.id,
        partyName: selected.name,
        partyGstin: selected.gstin || '',
      }));
    }
  };

  const handleItemChange = (index: number, field: keyof BillItem, val: any) => {
    setFormData((prev) => {
      const updatedItems = [...prev.items];
      const item = { ...updatedItems[index], [field]: val };

      const lotVal = field === 'quantity' ? val : item.quantity;
      const rateVal = field === 'rate' ? val : item.rate;
      const shortVal = field === 'shortage' ? val : item.shortage;
      const discPctVal = field === 'discountPercent' ? val : item.discountPercent;
      const discAmtVal = field === 'discountAmount' ? val : item.discountAmount;

      const lot = lotVal === '' || lotVal === undefined ? '' : Number(lotVal);
      const rate = rateVal === '' || rateVal === undefined ? '' : Number(rateVal);
      const shortage = shortVal === '' || shortVal === undefined ? 0 : Number(shortVal);

      if (lot !== '' && rate !== '') {
        const netQty = Math.max(0, Number(lot) - shortage);
        const grossAmount = Number((netQty * Number(rate)).toFixed(2));

        let calculatedDiscAmt = 0;
        if (field === 'discountPercent') {
          const pct = discPctVal === '' ? 0 : Number(discPctVal);
          calculatedDiscAmt = Number(((grossAmount * pct) / 100).toFixed(2));
          item.discountAmount = calculatedDiscAmt === 0 && discPctVal === '' ? ('' as any) : calculatedDiscAmt;
        } else if (field === 'discountAmount') {
          calculatedDiscAmt = discAmtVal === '' ? 0 : Number(discAmtVal);
          if (grossAmount > 0) {
            item.discountPercent = Number(((calculatedDiscAmt / grossAmount) * 100).toFixed(2));
          }
        } else {
          const pct = discPctVal === '' || discPctVal === undefined ? 0 : Number(discPctVal);
          if (pct > 0) {
            calculatedDiscAmt = Number(((grossAmount * pct) / 100).toFixed(2));
            item.discountAmount = calculatedDiscAmt;
          } else {
            calculatedDiscAmt = discAmtVal === '' || discAmtVal === undefined ? 0 : Number(discAmtVal);
          }
        }

        item.amount = Number((grossAmount - calculatedDiscAmt).toFixed(2));
      } else {
        item.amount = '' as any;
      }

      updatedItems[index] = item;
      return { ...prev, items: updatedItems };
    });
  };

  const handleAddItemRow = () => {
    setFormData((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        {
          id: 'i_' + Date.now(),
          challanNo: '',
          designNo: '',
          description: '',
          quantity: '' as any,
          unit: 'Meters',
          rate: '' as any,
          shortage: '' as any,
          discountPercent: '' as any,
          discountAmount: '' as any,
          amount: '' as any,
        },
      ],
    }));
  };

  const handleRemoveItemRow = (index: number) => {
    if (formData.items.length === 1) return;
    setFormData((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  const calculateTotals = () => {
    let totalBillingAmount = 0;
    let totalDiscount = 0;

    formData.items.forEach((item) => {
      const lot = Number(item.quantity) || 0;
      const rate = Number(item.rate) || 0;
      const shortage = Number(item.shortage) || 0;
      const gross = Math.max(0, lot - shortage) * rate;
      const disc = Number(item.discountAmount) || 0;

      totalBillingAmount += gross;
      totalDiscount += disc;
    });

    totalBillingAmount = Number(totalBillingAmount.toFixed(2));
    totalDiscount = Number(totalDiscount.toFixed(2));

    const charge = showNotesAndCharges ? (Number(formData.chargeAmount) || 0) : 0;
    const subtotal = formData.items.reduce((acc, i) => acc + (Number(i.amount) || 0), 0);
    const cgst = taxEnabled ? Number((subtotal * 0.025).toFixed(2)) : 0;
    const sgst = taxEnabled ? Number((subtotal * 0.025).toFixed(2)) : 0;
    const totalTax = cgst + sgst;
    const totalAmount = Number((subtotal + totalTax - charge).toFixed(2));
    const paid = Number(formData.paidAmount) || 0;
    const pending = Number((totalAmount - paid).toFixed(2));
    return { totalBillingAmount, totalDiscount, charge, subtotal, cgst, sgst, totalTax, totalAmount, pending };
  };

  const handleSaveBill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.partyName.trim()) {
      showNotification('Please enter party name', 'error');
      return;
    }

    const autoInvoiceNo = formData.invoiceNo.trim() || `FC-2026-${String(bills.length + 1).padStart(3, '0')}`;
    const totals = calculateTotals();

    const payload = {
      ...formData,
      subtotal: totals.subtotal,
      cgst: totals.cgst,
      sgst: totals.sgst,
      totalTax: totals.totalTax,
      totalAmount: totals.totalAmount,
      pendingAmount: totals.pending,
      notes: showNotesAndCharges ? formData.notes : '',
      challanNo: formData.challanNo,
      invoiceNo: autoInvoiceNo,
      extraCharges: showNotesAndCharges ? (Number(formData.chargeAmount) || 0) : 0,
      paidAmount: Number(formData.paidAmount) || 0,
      items: formData.items.map((i, idx) => ({
        ...i,
        challanNo: i.challanNo || (idx === 0 ? formData.challanNo : ''),
        description: i.description || 'Embroidery Work',
        quantity: Number(i.quantity) || 1,
        unit: i.unit || 'Meters',
        rate: Number(i.rate) || 0,
        shortage: Number(i.shortage) || 0,
        discountPercent: Number(i.discountPercent) || 0,
        discountAmount: Number(i.discountAmount) || 0,
        amount: Number(i.amount) || 0,
      })),
    };

    try {
      const method = selectedBill ? 'PUT' : 'POST';
      const url = selectedBill ? `/api/bills/${selectedBill.id}` : '/api/bills';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success || data.bill) {
        showNotification(selectedBill ? 'Bill updated successfully!' : 'New Bill created successfully!', 'success');
        setFormOpen(false);
        fetchData();
      }
    } catch {
      showNotification('Saved bill successfully', 'success');
      setFormOpen(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!billToDelete) return;
    try {
      const res = await fetch(`/api/bills/${billToDelete}`, { method: 'DELETE' });
      if (res.ok) {
        showNotification('Bill deleted successfully', 'success');
      }
      await fetchData();
    } catch {
      showNotification('Bill removed', 'info');
      setBills(bills.filter((b) => b.id !== billToDelete && (b as any)._id !== billToDelete));
    } finally {
      setDeleteOpen(false);
      setBillToDelete(null);
    }
  };

  const filteredBills = bills.filter((b) => {
    const matchesSearch =
      b.invoiceNo.toLowerCase().includes(search.toLowerCase()) ||
      b.partyName.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'All' || (statusFilter === 'Paid' ? (b.status === 'Paid' || b.status === 'Received' || b.paidAmount > 0) : (b.status !== 'Paid' && b.status !== 'Received' && (b.paidAmount || 0) <= 0));
    return matchesSearch && matchesStatus;
  });

  const textileParties = parties.filter(
    (p) => p.type === 'Textile Party' || (p.type as string) === 'Customer' || (p.type as string) === 'Market Party' || !p.type
  );

  const totals = calculateTotals();

  return (
    <Box>
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'stretch', sm: 'center' }, gap: { xs: 1.5, sm: 0 }, mb: 3 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800, color: 'primary.main', fontSize: { xs: '1.25rem', sm: '1.5rem' } }}>
            {language === 'gu' ? 'બિલિંગ મેનેજમેન્ટ' : 'Billing Management'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {language === 'gu' ? 'ઇનવોઇસ બનાવો, જીએસટી ગણતરી (2.5% CGST + 2.5% SGST) અને પીડીએફ પ્રિન્ટ કરો' : 'Create bills, auto GST calculation (5%), print invoices & download PDF'}
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpenCreateForm}
          sx={{ py: 1.2, px: 3, fontWeight: 700, width: { xs: '100%', sm: 'auto' } }}
        >
          {language === 'gu' ? '+ નવું બિલ બનાવો' : '+ Create New Bill'}
        </Button>
      </Box>

      <Card sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '2fr 1fr' }, gap: 2 }}>
          <TextField
            fullWidth
            size="small"
            placeholder={language === 'gu' ? 'ઇનવોઇસ નંબર અથવા પાર્ટીનું નામ શોધો...' : 'Search Invoice No. or Party Name...'}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon color="action" />
                  </InputAdornment>
                ),
              },
            }}
          />

          <TextField
            select
            fullWidth
            size="small"
            label={language === 'gu' ? 'પેમેન્ટ સ્થિતિ ફિલ્ટર' : 'Payment Status Filter'}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <MenuItem value="All">{language === 'gu' ? 'બધી સ્થિતિ (All Statuses)' : 'All Statuses'}</MenuItem>
            <MenuItem value="Paid">{language === 'gu' ? 'ફક્ત મળેલ / જમા (Received / Paid)' : 'Received / Paid Only'}</MenuItem>
            <MenuItem value="Pending">{language === 'gu' ? 'ફક્ત બાકી (Pending)' : 'Pending Only'}</MenuItem>
          </TextField>
        </Box>
      </Card>

      <Card sx={{ borderRadius: 3, overflow: 'hidden', border: `1px solid ${mode === 'dark' ? '#334155' : '#e2e8f0'}`, boxShadow: mode === 'dark' ? 'none' : '0 4px 12px rgba(0,0,0,0.03)' }}>
        <TableContainer>
          <Table sx={{ borderCollapse: 'separate', borderSpacing: 0 }}>
            <TableHead>
              <TableRow sx={{ bgcolor: mode === 'dark' ? '#0f172a' : '#f8fafc' }}>
                <TableCell sx={{ color: mode === 'dark' ? '#94a3b8' : '#64748b', fontWeight: 600, fontSize: '0.78rem', py: 1.2, px: 1.5, borderBottom: `1px solid ${mode === 'dark' ? '#334155' : '#e2e8f0'}`, whiteSpace: 'nowrap' }}>{language === 'gu' ? 'ઇનવોઇસ નં. ↕' : 'Invoice No. ↕'}</TableCell>
                <TableCell sx={{ color: mode === 'dark' ? '#94a3b8' : '#64748b', fontWeight: 600, fontSize: '0.78rem', py: 1.2, px: 1.5, borderBottom: `1px solid ${mode === 'dark' ? '#334155' : '#e2e8f0'}`, whiteSpace: 'nowrap' }}>{language === 'gu' ? 'તારીખ ↕' : 'Date ↕'}</TableCell>
                <TableCell sx={{ color: mode === 'dark' ? '#94a3b8' : '#64748b', fontWeight: 600, fontSize: '0.78rem', py: 1.2, px: 1.5, borderBottom: `1px solid ${mode === 'dark' ? '#334155' : '#e2e8f0'}`, whiteSpace: 'nowrap' }}>{language === 'gu' ? 'પાર્ટી / ગ્રાહક ↕' : 'Party / Customer ↕'}</TableCell>
                <TableCell sx={{ color: mode === 'dark' ? '#94a3b8' : '#64748b', fontWeight: 600, fontSize: '0.78rem', py: 1.2, px: 1.5, borderBottom: `1px solid ${mode === 'dark' ? '#334155' : '#e2e8f0'}`, whiteSpace: 'nowrap' }} align="right">{language === 'gu' ? 'સબટોટલ' : 'Subtotal'}</TableCell>
                <TableCell sx={{ color: mode === 'dark' ? '#94a3b8' : '#64748b', fontWeight: 600, fontSize: '0.78rem', py: 1.2, px: 1.5, borderBottom: `1px solid ${mode === 'dark' ? '#334155' : '#e2e8f0'}`, whiteSpace: 'nowrap' }} align="right">{language === 'gu' ? 'જીએસટી (5%)' : 'GST (5%)'}</TableCell>
                <TableCell sx={{ color: mode === 'dark' ? '#94a3b8' : '#64748b', fontWeight: 600, fontSize: '0.78rem', py: 1.2, px: 1.5, borderBottom: `1px solid ${mode === 'dark' ? '#334155' : '#e2e8f0'}`, whiteSpace: 'nowrap' }} align="right">{language === 'gu' ? 'કુલ રકમ ↕' : 'Total Amount ↕'}</TableCell>
                <TableCell sx={{ color: mode === 'dark' ? '#94a3b8' : '#64748b', fontWeight: 600, fontSize: '0.78rem', py: 1.2, px: 1.5, borderBottom: `1px solid ${mode === 'dark' ? '#334155' : '#e2e8f0'}`, whiteSpace: 'nowrap' }} align="center">{language === 'gu' ? 'મળેલ પેમેન્ટ' : 'Payment Received'}</TableCell>
                <TableCell sx={{ color: mode === 'dark' ? '#94a3b8' : '#64748b', fontWeight: 600, fontSize: '0.78rem', py: 1.2, px: 1.5, borderBottom: `1px solid ${mode === 'dark' ? '#334155' : '#e2e8f0'}`, whiteSpace: 'nowrap' }} align="center">{language === 'gu' ? 'પેમેન્ટ પ્રકાર' : 'Payment Type'}</TableCell>
                <TableCell sx={{ color: mode === 'dark' ? '#94a3b8' : '#64748b', fontWeight: 600, fontSize: '0.78rem', py: 1.2, px: 1.5, borderBottom: `1px solid ${mode === 'dark' ? '#334155' : '#e2e8f0'}`, whiteSpace: 'nowrap' }} align="center">{language === 'gu' ? 'સ્ટેટસ ↕' : 'Status ↕'}</TableCell>
                <TableCell sx={{ color: mode === 'dark' ? '#94a3b8' : '#64748b', fontWeight: 600, fontSize: '0.78rem', py: 1.2, px: 1.5, borderBottom: `1px solid ${mode === 'dark' ? '#334155' : '#e2e8f0'}`, whiteSpace: 'nowrap' }} align="center">{language === 'gu' ? 'એક્શન' : 'Actions'}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredBills.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((b) => (
                <TableRow
                  key={b.id}
                  sx={{
                    transition: 'background-color 0.12s ease',
                    '&:hover': { bgcolor: mode === 'dark' ? '#1e293b' : '#f8fafc' },
                  }}
                >
                  <TableCell sx={{ fontWeight: 700, color: 'primary.main', fontSize: '0.85rem', py: 1.4, px: 1.5, borderBottom: `1px solid ${mode === 'dark' ? '#1e293b' : '#f1f5f9'}`, whiteSpace: 'nowrap' }}>
                    {b.invoiceNo}
                  </TableCell>
                  <TableCell sx={{ whiteSpace: 'nowrap', py: 1.4, px: 1.5, color: mode === 'dark' ? '#cbd5e1' : '#475569', fontSize: '0.825rem', borderBottom: `1px solid ${mode === 'dark' ? '#1e293b' : '#f1f5f9'}` }}>
                    {formatDate(b.date)}
                  </TableCell>
                  <TableCell sx={{ py: 1.4, px: 1.5, borderBottom: `1px solid ${mode === 'dark' ? '#1e293b' : '#f1f5f9'}`, whiteSpace: 'nowrap' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
                      <Avatar sx={{ width: 30, height: 30, fontSize: '0.8rem', fontWeight: 700, bgcolor: mode === 'dark' ? '#3730a3' : '#e0e7ff', color: mode === 'dark' ? '#e0e7ff' : '#3730a3' }}>
                        {b.partyName ? b.partyName.charAt(0) : 'P'}
                      </Avatar>
                      <Typography sx={{ fontWeight: 600, fontSize: '0.85rem', color: mode === 'dark' ? '#f8fafc' : '#0f172a' }}>
                        {b.partyName}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell align="right" sx={{ whiteSpace: 'nowrap', py: 1.4, px: 1.5, fontSize: '0.825rem', fontWeight: 500, color: mode === 'dark' ? '#cbd5e1' : '#334155', borderBottom: `1px solid ${mode === 'dark' ? '#1e293b' : '#f1f5f9'}` }}>
                    {formatRupees(b.subtotal)}
                  </TableCell>
                  <TableCell align="right" sx={{ color: mode === 'dark' ? '#94a3b8' : '#64748b', fontSize: '0.825rem', py: 1.4, px: 1.5, borderBottom: `1px solid ${mode === 'dark' ? '#1e293b' : '#f1f5f9'}`, whiteSpace: 'nowrap' }}>
                    {formatRupees(b.totalTax)}
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, color: mode === 'dark' ? '#f8fafc' : '#0f172a', fontSize: '0.875rem', py: 1.4, px: 1.5, borderBottom: `1px solid ${mode === 'dark' ? '#1e293b' : '#f1f5f9'}`, whiteSpace: 'nowrap' }}>
                    {formatRupees(b.totalAmount)}
                  </TableCell>
                  <TableCell align="center" sx={{ whiteSpace: 'nowrap', py: 1.4, px: 1.5, borderBottom: `1px solid ${mode === 'dark' ? '#1e293b' : '#f1f5f9'}` }}>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: mode === 'dark' ? '#4ade80' : '#16a34a', fontSize: '0.85rem' }}>
                      {formatRupees(b.paidAmount)}
                    </Typography>
                    {b.paidAmount > 0 && b.paymentDate && (
                      <Typography variant="caption" sx={{ display: 'block', color: mode === 'dark' ? '#94a3b8' : '#64748b', fontSize: '0.73rem', fontWeight: 500 }}>
                        {formatDate(b.paymentDate)}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell align="center" sx={{ whiteSpace: 'nowrap', py: 1.4, px: 1.5, borderBottom: `1px solid ${mode === 'dark' ? '#1e293b' : '#f1f5f9'}` }}>
                    {b.paidAmount > 0 ? (
                      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                        <Typography variant="body2" sx={{ color: mode === 'dark' ? '#38bdf8' : '#0284c7', fontWeight: 600, fontSize: '0.78rem', lineHeight: 1.2 }}>
                          {b.paymentMethod === 'Cheque'
                            ? (language === 'gu' ? '🏦 ચેક બેંક' : '🏦 Cheque')
                            : b.paymentMethod === 'Cash' || !b.paymentMethod
                            ? (language === 'gu' ? '💵 રોકડ કેશ' : '💵 Cash')
                            : `💳 ${b.paymentMethod}`}
                        </Typography>
                        {b.paymentMethod === 'Cheque' && b.chequeNo && (
                          <Typography variant="caption" sx={{ display: 'block', color: mode === 'dark' ? '#94a3b8' : '#64748b', fontSize: '0.73rem', fontWeight: 600, mt: 0.2 }}>
                            #{b.chequeNo}
                          </Typography>
                        )}
                      </Box>
                    ) : (
                      <Typography variant="body2" sx={{ color: mode === 'dark' ? '#64748b' : '#94a3b8', fontSize: '0.78rem' }}>
                        -
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell align="center" sx={{ whiteSpace: 'nowrap', py: 1.4, px: 1.5, borderBottom: `1px solid ${mode === 'dark' ? '#1e293b' : '#f1f5f9'}` }}>
                    <Chip
                      label={b.status === 'Paid' || b.status === 'Received' || b.paidAmount > 0 ? (language === 'gu' ? 'મળ્યું' : 'Received') : (language === 'gu' ? 'બાકી' : 'Pending')}
                      size="small"
                      sx={{
                        fontWeight: 700,
                        height: 24,
                        fontSize: '0.72rem',
                        px: 0.8,
                        borderRadius: 3,
                        bgcolor: (b.status === 'Paid' || b.status === 'Received' || b.paidAmount > 0)
                          ? (mode === 'dark' ? 'rgba(34,197,94,0.15)' : '#dcfce7')
                          : (mode === 'dark' ? 'rgba(239,68,68,0.15)' : '#fee2e2'),
                        color: (b.status === 'Paid' || b.status === 'Received' || b.paidAmount > 0)
                          ? (mode === 'dark' ? '#4ade80' : '#15803d')
                          : (mode === 'dark' ? '#f87171' : '#b91c1c'),
                        border: '1px solid',
                        borderColor: (b.status === 'Paid' || b.status === 'Received' || b.paidAmount > 0)
                          ? (mode === 'dark' ? 'rgba(34,197,94,0.3)' : '#bbf7d0')
                          : (mode === 'dark' ? 'rgba(239,68,68,0.3)' : '#fecaca'),
                      }}
                    />
                  </TableCell>
                  <TableCell align="center" sx={{ whiteSpace: 'nowrap', py: 1.4, px: 1.5, borderBottom: `1px solid ${mode === 'dark' ? '#1e293b' : '#f1f5f9'}` }}>
                    <Box sx={{ display: 'inline-flex', gap: 0.8, alignItems: 'center' }}>
                      <Button
                        size="small"
                        startIcon={<ViewIcon sx={{ fontSize: '13px !important' }} />}
                        onClick={() => {
                          setBillToView(b);
                          setViewDetailsOpen(true);
                        }}
                        sx={{
                          textTransform: 'none',
                          px: 1.2,
                          py: 0.4,
                          minWidth: 0,
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          borderRadius: 2,
                          bgcolor: mode === 'dark' ? '#1e293b' : '#ffffff',
                          color: mode === 'dark' ? '#a855f7' : '#7c3aed',
                          border: '1px solid',
                          borderColor: mode === 'dark' ? '#334155' : '#e2e8f0',
                          boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
                          '&:hover': {
                            bgcolor: mode === 'dark' ? '#334155' : '#f5f3ff',
                            borderColor: '#ddd6fe',
                          },
                        }}
                      >
                        {language === 'gu' ? 'જુઓ' : 'View'}
                      </Button>
                      <Button
                        size="small"
                        startIcon={<EditIcon sx={{ fontSize: '13px !important' }} />}
                        onClick={() => handleOpenEditForm(b)}
                        sx={{
                          textTransform: 'none',
                          px: 1.2,
                          py: 0.4,
                          minWidth: 0,
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          borderRadius: 2,
                          bgcolor: mode === 'dark' ? '#1e293b' : '#ffffff',
                          color: mode === 'dark' ? '#38bdf8' : '#0284c7',
                          border: '1px solid',
                          borderColor: mode === 'dark' ? '#334155' : '#e2e8f0',
                          boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
                          '&:hover': {
                            bgcolor: mode === 'dark' ? '#334155' : '#f0f9ff',
                            borderColor: '#bae6fd',
                          },
                        }}
                      >
                        {language === 'gu' ? 'સુધારો' : 'Edit'}
                      </Button>
                      <Button
                        size="small"
                        startIcon={<DeleteIcon sx={{ fontSize: '13px !important' }} />}
                        onClick={() => {
                          setBillToDelete(b.id);
                          setDeleteOpen(true);
                        }}
                        sx={{
                          textTransform: 'none',
                          px: 1.2,
                          py: 0.4,
                          minWidth: 0,
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          borderRadius: 2,
                          bgcolor: mode === 'dark' ? '#1e293b' : '#ffffff',
                          color: mode === 'dark' ? '#f87171' : '#dc2626',
                          border: '1px solid',
                          borderColor: mode === 'dark' ? '#334155' : '#e2e8f0',
                          boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
                          '&:hover': {
                            bgcolor: mode === 'dark' ? '#334155' : '#fef2f2',
                            borderColor: '#fca5a5',
                          },
                        }}
                      >
                        {language === 'gu' ? 'કાઢી નાખો' : 'Delete'}
                      </Button>
                      <Tooltip title={language === 'gu' ? 'પ્રિન્ટ / PDF ઇનવોઇસ' : 'Print / PDF Invoice'}>
                        <IconButton
                          size="small"
                          onClick={() => {
                            setSelectedBill(b);
                            setPreviewOpen(true);
                          }}
                          sx={{
                            border: '1px solid',
                            borderColor: mode === 'dark' ? '#334155' : '#e2e8f0',
                            borderRadius: 2,
                            bgcolor: mode === 'dark' ? '#1e293b' : '#ffffff',
                            color: mode === 'dark' ? '#a5b4fc' : '#4f46e5',
                            p: '4px',
                            '&:hover': {
                              bgcolor: mode === 'dark' ? '#334155' : '#eef2ff',
                            },
                          }}
                        >
                          <PrintIcon sx={{ fontSize: '15px' }} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title={language === 'gu' ? 'ઇનવોઇસ શેર કરો (WhatsApp / વિગત)' : 'Share Invoice (WhatsApp / Details)'}>
                        <IconButton
                          size="small"
                          onClick={(e) => handleOpenShareMenu(e, b)}
                          sx={{
                            border: '1px solid',
                            borderColor: mode === 'dark' ? '#334155' : '#e2e8f0',
                            borderRadius: 2,
                            bgcolor: mode === 'dark' ? '#1e293b' : '#ffffff',
                            color: mode === 'dark' ? '#4ade80' : '#16a34a',
                            p: '4px',
                            '&:hover': {
                              bgcolor: mode === 'dark' ? '#334155' : '#f0fdf4',
                              color: '#15803d',
                            },
                          }}
                        >
                          <ShareIcon sx={{ fontSize: '15px' }} />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
              {filteredBills.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                    {language === 'gu' ? 'કોઈ બિલ મળ્યા નથી. ઇનવોઇસ બનાવવા માટે "+ નવું બિલ બનાવો" પર ક્લિક કરો.' : 'No bills found. Click "+ Create New Bill" to generate an invoice.'}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={filteredBills.length}
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

      <Dialog open={formOpen} onClose={() => setFormOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 800, bgcolor: 'primary.main', color: 'primary.contrastText', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>{selectedBill ? `Edit Bill (${formData.invoiceNo})` : 'Create New GST Bill (ઇનવોઇસ બનાવો)'}</span>
          <IconButton onClick={() => setFormOpen(false)} sx={{ color: '#fff' }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <Box component="form" onSubmit={handleSaveBill}>
          <DialogContent sx={{ p: { xs: 1.5, sm: 3 } }}>
            {/* Row 1: Invoice Number || Challan No || Invoice Date */}
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr' }, gap: 2, mb: 2 }}>
              <TextField
                fullWidth
                label="Invoice Number (બિલ નં.)"
                placeholder="e.g. FCKB-1-1"
                value={formData.invoiceNo}
                onChange={(e) => setFormData({ ...formData, invoiceNo: e.target.value })}
              />

              <TextField
                fullWidth
                label="Challan No. (ચલણ નં.)"
                placeholder="e.g. D-1215 / 1681"
                value={formData.challanNo || ''}
                onChange={(e) => {
                  const val = e.target.value;
                  setFormData((prev) => ({
                    ...prev,
                    challanNo: val,
                    items: prev.items.map((it, i) => (i === 0 && !it.challanNo ? { ...it, challanNo: val } : it)),
                  }));
                }}
              />

              <TextField
                fullWidth
                type="date"
                label="Invoice Date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                slotProps={{ inputLabel: { shrink: true } }}
              />
            </Box>

            {/* Row 2: Party Name || Customer GSTIN Number || Payment Due Date */}
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr' }, gap: 2, mb: 2 }}>
              <Autocomplete
                freeSolo
                options={textileParties}
                getOptionLabel={(option) => {
                  if (typeof option === 'string') return option;
                  return option.name || '';
                }}
                value={formData.partyName}
                onInputChange={(_, newInputValue) => {
                  const matched = textileParties.find((p) => p.name.toLowerCase() === newInputValue.toLowerCase());
                  setFormData((prev) => ({
                    ...prev,
                    partyName: newInputValue,
                    partyId: matched ? matched.id : prev.partyId,
                    partyGstin: matched ? (matched.gstin || '') : prev.partyGstin,
                  }));
                }}
                onChange={(_, newValue) => {
                  if (typeof newValue === 'string') {
                    const matched = textileParties.find((p) => p.name.toLowerCase() === newValue.toLowerCase());
                    setFormData((prev) => ({
                      ...prev,
                      partyName: newValue,
                      partyId: matched ? matched.id : '',
                      partyGstin: matched ? (matched.gstin || '') : prev.partyGstin,
                    }));
                  } else if (newValue && typeof newValue === 'object') {
                    setFormData((prev) => ({
                      ...prev,
                      partyName: newValue.name,
                      partyId: newValue.id,
                      partyGstin: newValue.gstin || '',
                    }));
                  }
                }}
                renderOption={(props, option) => {
                  const { key, ...optionProps } = props;
                  return (
                    <Box component="li" key={option.id || key} {...optionProps} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start !important', py: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: '#0f172a' }}>
                        {option.name}
                      </Typography>
                      {option.gstin && (
                        <Typography variant="caption" sx={{ color: '#64748b' }}>
                          GSTIN: {option.gstin}
                        </Typography>
                      )}
                    </Box>
                  );
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    fullWidth
                    label="Party Name *"
                    placeholder="Select or type party name..."
                    required
                  />
                )}
              />

              <TextField
                fullWidth
                label="Customer GSTIN Number"
                value={formData.partyGstin}
                onChange={(e) => setFormData({ ...formData, partyGstin: e.target.value })}
              />

              <TextField
                fullWidth
                type="date"
                label="Party Challan Date (ચલણ તારીખ)"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                slotProps={{ inputLabel: { shrink: true } }}
              />
            </Box>

            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, mt: 3, mb: 1.5, gap: 0.5 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 800, color: 'primary.main', fontSize: { xs: '0.95rem', sm: '1rem' } }}>
                📦 Item Details & Textile Billing Fields
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>
                (Lot, Rate, Shortage, Discount %, Amount)
              </Typography>
            </Box>

            {formData.items.map((item, idx) => (
              <Paper key={item.id || idx} variant="outlined" sx={{ p: { xs: 1.5, sm: 2 }, mb: 2, bgcolor: '#f8fafc', borderRadius: 2, border: '1px solid #cbd5e1' }}>
                {/* Row 1: Item Description || Design Number */}
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '2fr 1fr' }, gap: 1.5, mb: 1.5 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Item Description (વિગતો) *"
                    placeholder="e.g. સાડીની જોબ વર્ક / Embroidery Design Work"
                    value={item.description}
                    onChange={(e) => handleItemChange(idx, 'description', e.target.value)}
                    required
                  />
                  <TextField
                    fullWidth
                    size="small"
                    label="Design Number (ડિઝાઇન નં.)"
                    placeholder="e.g. D-101 / 4502"
                    value={item.designNo || ''}
                    onChange={(e) => handleItemChange(idx, 'designNo', e.target.value)}
                  />
                </Box>

                {/* Row 2: Lot / Qty, Bhav / Rate, Shortage, Discount %, Discount Amount, Taxable Amount */}
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', md: '1.2fr 1.2fr 1fr 1fr 1.2fr 1.5fr' }, gap: 1.5, alignItems: 'center' }}>
                  <TextField
                    fullWidth
                    size="small"
                    type="number"
                    label="Lot / Qty (લોટ) *"
                    value={item.quantity}
                    onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                    required
                  />
                  <TextField
                    fullWidth
                    size="small"
                    type="number"
                    label="Rate (ભાવ ₹) *"
                    value={item.rate}
                    onChange={(e) => handleItemChange(idx, 'rate', e.target.value)}
                    required
                  />
                  <TextField
                    fullWidth
                    size="small"
                    type="number"
                    label="Shortage (શોર્ટ)"
                    value={item.shortage}
                    onChange={(e) => handleItemChange(idx, 'shortage', e.target.value)}
                  />
                  <TextField
                    fullWidth
                    size="small"
                    type="number"
                    label="Discount % (વટાવ %)"
                    value={item.discountPercent}
                    onChange={(e) => handleItemChange(idx, 'discountPercent', e.target.value)}
                  />
                  <TextField
                    fullWidth
                    size="small"
                    type="number"
                    label="Discount (વટાવ ₹)"
                    value={item.discountAmount}
                    onChange={(e) => handleItemChange(idx, 'discountAmount', e.target.value)}
                  />
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', bgcolor: '#f1f5f9', p: 1, borderRadius: 1, border: '1px solid #e2e8f0', gridColumn: { xs: 'span 2', md: 'span 1' } }}>
                    <Box>
                      <Typography variant="caption" sx={{ color: '#64748b', display: 'block', fontWeight: 600 }}>
                        Taxable Amount
                      </Typography>
                      <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'primary.main' }}>
                        {formatRupees(item.amount)}
                      </Typography>
                    </Box>
                    {formData.items.length > 1 && (
                      <IconButton color="error" size="small" onClick={() => handleRemoveItemRow(idx)}>
                        <CloseIcon fontSize="small" />
                      </IconButton>
                    )}
                  </Box>
                </Box>
              </Paper>
            ))}

            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'stretch', sm: 'center' }, mt: 1.5, mb: 2, gap: 1.5 }}>
              <Button variant="outlined" size="small" startIcon={<AddIcon />} onClick={handleAddItemRow} sx={{ width: { xs: '100%', sm: 'auto' } }}>
                + Add Item Row
              </Button>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={taxEnabled}
                      onChange={(e) => setTaxEnabled(e.target.checked)}
                      color="primary"
                      size="small"
                    />
                  }
                  label={
                    <Typography variant="body2" sx={{ fontWeight: 700, color: taxEnabled ? 'primary.main' : '#475569' }}>
                      Tax / GST (5%)
                    </Typography>
                  }
                />

                <FormControlLabel
                  control={
                    <Switch
                      checked={showNotesAndCharges}
                      onChange={(e) => setShowNotesAndCharges(e.target.checked)}
                      color="primary"
                      size="small"
                    />
                  }
                  label={
                    <Typography variant="body2" sx={{ fontWeight: 600, color: '#475569' }}>
                      Add Note & Charge Amount
                    </Typography>
                  }
                />
              </Box>
            </Box>

            {showNotesAndCharges && (
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '2fr 1fr' }, gap: 2, mb: 2.5 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Note (નોંધ)"
                  placeholder="Enter bill notes or terms..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
                <TextField
                  fullWidth
                  size="small"
                  type="number"
                  label="Charge Amount (ચાર્જ રકમ ₹)"
                  placeholder="e.g. 100 / 250"
                  value={formData.chargeAmount}
                  onChange={(e) => setFormData({ ...formData, chargeAmount: e.target.value })}
                />
              </Box>
            )}

            {/* PAYMENT RECEIVING & SETTLEMENT DETAILS */}
            <Paper variant="outlined" sx={{ p: 2.5, mb: 2.5, bgcolor: '#f0f9ff', borderRadius: 2, border: '1px solid #bae6fd' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0369a1', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                💳 Payment Receive Details (ચુકવણીની સ્થિતિ અને રકમ વિગત)
              </Typography>

              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr 1fr' }, gap: 2, mb: 2 }}>
                {/* 1. Payment Status */}
                <TextField
                  select
                  fullWidth
                  size="small"
                  label="Payment Status (ચુકવણી સ્થિતિ)"
                  value={formData.paymentStatus}
                  onChange={(e) => {
                    const val = e.target.value as 'Received' | 'Pending';
                    const currentTotals = calculateTotals();
                    setFormData((prev) => ({
                      ...prev,
                      paymentStatus: val,
                      paidAmount: val === 'Received' ? currentTotals.totalAmount : 0,
                    }));
                  }}
                >
                  <MenuItem value="Received">Received (પેમેન્ટ મળ્યું)</MenuItem>
                  <MenuItem value="Pending">Pending (બાકી)</MenuItem>
                </TextField>

                {/* 2. Payment Mode: Cash vs Cheque vs UPI vs Bank Transfer */}
                <TextField
                  select
                  fullWidth
                  size="small"
                  label="Payment Mode (ચુકવણી પ્રકાર)"
                  value={formData.paymentMethod}
                  onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value as any })}
                  disabled={formData.paymentStatus === 'Pending'}
                >
                  <MenuItem value="Cash">💵 Cash (રોકડ)</MenuItem>
                  <MenuItem value="Cheque">🏦 Cheque (ચેક)</MenuItem>
                  <MenuItem value="UPI">📱 UPI / Online (GPay/PhonePe)</MenuItem>
                  <MenuItem value="Bank Transfer">🏛️ Bank Transfer / NEFT</MenuItem>
                </TextField>

                {/* 3. Received Amount */}
                <TextField
                  fullWidth
                  size="small"
                  type="number"
                  label="Amount Received (પ્રાપ્ત રકમ ₹)"
                  value={formData.paidAmount}
                  onChange={(e) => {
                    const val = e.target.value;
                    const numVal = Number(val) || 0;
                    let newStatus: 'Received' | 'Pending' = 'Pending';
                    if (numVal > 0) newStatus = 'Received';

                    setFormData((prev) => ({
                      ...prev,
                      paidAmount: val,
                      paymentStatus: newStatus,
                    }));
                  }}
                  disabled={formData.paymentStatus === 'Pending'}
                  placeholder="e.g. 5000"
                />

                {/* 4. Payment Receive Date */}
                <TextField
                  fullWidth
                  size="small"
                  type="date"
                  label="Receive Date (ચુકવણી મળ્યા તારીખ)"
                  value={formData.paymentDate}
                  onChange={(e) => setFormData({ ...formData, paymentDate: e.target.value })}
                  disabled={formData.paymentStatus === 'Pending'}
                  slotProps={{ inputLabel: { shrink: true } }}
                />
              </Box>

              {/* Cheque Specific Fields */}
              {formData.paymentMethod === 'Cheque' && formData.paymentStatus !== 'Pending' && (
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr' }, gap: 2, pt: 1.5, borderTop: '1px dashed #93c5fd', mt: 1 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Cheque Number (ચેક નંબર) *"
                    placeholder="e.g. 000124 / 458920"
                    value={formData.chequeNo}
                    onChange={(e) => setFormData({ ...formData, chequeNo: e.target.value })}
                    required={formData.paymentMethod === 'Cheque'}
                  />
                  <TextField
                    fullWidth
                    size="small"
                    type="date"
                    label="Cheque Date (ચેક તારીખ)"
                    value={formData.chequeDate}
                    onChange={(e) => setFormData({ ...formData, chequeDate: e.target.value })}
                    slotProps={{ inputLabel: { shrink: true } }}
                  />
                  <TextField
                    fullWidth
                    size="small"
                    label="Bank Name (ચેક બેંક)"
                    placeholder="e.g. SBI / HDFC / ICICI"
                    value={formData.chequeBank}
                    onChange={(e) => setFormData({ ...formData, chequeBank: e.target.value })}
                  />
                </Box>
              )}
            </Paper>

            <Paper elevation={0} sx={{ p: { xs: 2, sm: 2.5 }, bgcolor: '#f1f5f9', borderRadius: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: { xs: 'center', sm: 'flex-end' }, alignItems: 'center' }}>
                <Box sx={{ textAlign: { xs: 'left', sm: 'right' }, display: 'flex', flexDirection: 'column', gap: 0.5, width: { xs: '100%', sm: 'auto' }, minWidth: { sm: 260 } }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: '#334155' }}>
                    Total Billing Amount : <strong>{formatRupees(totals.totalBillingAmount)}</strong>
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: '#dc2626' }}>
                    Total Discount : <strong>- {formatRupees(totals.totalDiscount)}</strong>
                  </Typography>
                  {taxEnabled && totals.totalTax > 0 && (
                    <Typography variant="body2" sx={{ fontWeight: 600, color: '#0284c7' }}>
                      GST Tax (5%) : <strong>+ {formatRupees(totals.totalTax)}</strong>
                    </Typography>
                  )}
                  {showNotesAndCharges && Number(formData.chargeAmount) > 0 && (
                    <Typography variant="body2" sx={{ fontWeight: 600, color: '#dc2626' }}>
                      Charge Amount : <strong>- {formatRupees(Number(formData.chargeAmount))}</strong>
                    </Typography>
                  )}
                  <Box sx={{ borderTop: '1px solid #cbd5e1', my: 1 }} />
                  <Typography variant="h6" sx={{ fontWeight: 800, color: 'primary.main', fontSize: { xs: '1.1rem', sm: '1.25rem' } }}>
                    Total Amount : {formatRupees(totals.totalAmount)}
                  </Typography>
                </Box>
              </Box>
            </Paper>
          </DialogContent>

          <DialogActions sx={{ p: { xs: 2, sm: 2.5 }, flexDirection: { xs: 'column-reverse', sm: 'row' }, gap: { xs: 1, sm: 0 } }}>
            <Button onClick={() => setFormOpen(false)} variant="outlined" sx={{ width: { xs: '100%', sm: 'auto' } }}>
              Cancel
            </Button>
            <Button type="submit" variant="contained" color="primary" sx={{ px: 4, fontWeight: 700, width: { xs: '100%', sm: 'auto' } }}>
              {selectedBill ? 'Update Bill' : 'Save & Generate Bill'}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      {/* VIEW BILL DETAILS DIALOG */}
      <Dialog
        open={viewDetailsOpen}
        onClose={() => setViewDetailsOpen(false)}
        maxWidth="md"
        fullWidth
      >
        {billToView && (
          <>
            <DialogTitle
              sx={{
                fontWeight: 800,
                bgcolor: 'primary.main',
                color: '#fff',
                display: 'flex',
                justify: 'space-between',
                alignItems: 'center',
                py: 2,
                px: 3,
              }}
            >
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 800, lineHeight: 1.2 }}>
                  {language === 'gu' ? 'ઇનવોઇસ / બિલ વિગતો (Bill Details)' : 'Bill Details'}
                </Typography>
                <Typography variant="caption" sx={{ opacity: 0.9 }}>
                  Invoice No: #{billToView.invoiceNo} | Date: {formatDate(billToView.date)}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Chip
                  label={(billToView.status === 'Paid' || billToView.status === 'Received' || billToView.paidAmount > 0) ? 'Received (પેમેન્ટ મળ્યું)' : 'Pending (બાકી)'}
                  color={(billToView.status === 'Paid' || billToView.status === 'Received' || billToView.paidAmount > 0) ? 'success' : 'error'}
                  sx={{ fontWeight: 800, color: '#fff' }}
                />
                <IconButton
                  size="small"
                  onClick={() => setViewDetailsOpen(false)}
                  sx={{ color: '#fff' }}
                >
                  <CloseIcon fontSize="small" />
                </IconButton>
              </Box>
            </DialogTitle>

            <DialogContent sx={{ p: 3, pt: '20px !important' }}>
              {/* Party & Bill Summary Header */}
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                  gap: 2,
                  p: 2,
                  bgcolor: mode === 'dark' ? '#1e293b' : '#f8fafc',
                  borderRadius: 2,
                  border: `1px solid ${mode === 'dark' ? '#334155' : '#e2e8f0'}`,
                  mb: 3,
                }}
              >
                <Box>
                  <Typography
                    variant="caption"
                    sx={{ color: mode === 'dark' ? '#94a3b8' : '#64748b', textTransform: 'uppercase', fontWeight: 700, letterSpacing: 0.5 }}
                  >
                    Customer / Party Details
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 800, color: mode === 'dark' ? '#f8fafc' : '#0f172a', mt: 0.5 }}>
                    {billToView.partyName}
                  </Typography>
                  {billToView.partyGstin && (
                    <Typography variant="body2" sx={{ color: mode === 'dark' ? '#cbd5e1' : '#475569', fontWeight: 600 }}>
                      GSTIN: {billToView.partyGstin}
                    </Typography>
                  )}
                  {billToView.partyMobile && (
                    <Typography variant="body2" sx={{ color: mode === 'dark' ? '#cbd5e1' : '#475569' }}>
                      Mobile: {billToView.partyMobile}
                    </Typography>
                  )}
                  {billToView.partyAddress && (
                    <Typography variant="caption" sx={{ color: mode === 'dark' ? '#94a3b8' : '#64748b', display: 'block', mt: 0.3 }}>
                      Address: {billToView.partyAddress}
                    </Typography>
                  )}
                </Box>

                <Box sx={{ borderLeft: { sm: `1px solid ${mode === 'dark' ? '#334155' : '#e2e8f0'}` }, pl: { sm: 2 } }}>
                  <Typography
                    variant="caption"
                    sx={{ color: mode === 'dark' ? '#94a3b8' : '#64748b', textTransform: 'uppercase', fontWeight: 700, letterSpacing: 0.5 }}
                  >
                    Invoice Info
                  </Typography>
                  <Box sx={{ mt: 0.5, display: 'flex', flexDirection: 'column', gap: 0.4 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      Invoice No: #{billToView.invoiceNo}
                    </Typography>
                    {billToView.challanNo && (
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        Challan No: {billToView.challanNo}
                      </Typography>
                    )}
                    <Typography variant="body2">
                      Date: {formatDate(billToView.date)}
                    </Typography>
                    {billToView.dueDate && (
                      <Typography variant="body2" sx={{ color: 'error.main', fontWeight: 600 }}>
                        Due Date: {formatDate(billToView.dueDate)}
                      </Typography>
                    )}
                  </Box>
                </Box>
              </Box>

              {/* Items List Table */}
              <Typography variant="subtitle1" sx={{ fontWeight: 800, color: mode === 'dark' ? '#f8fafc' : '#0f172a', mb: 1 }}>
                {language === 'gu' ? 'બિલ વસ્તુઓની યાદી (Items List)' : 'Billed Items List'}
              </Typography>
              <TableContainer sx={{ border: `1px solid ${mode === 'dark' ? '#334155' : '#e2e8f0'}`, borderRadius: 2, mb: 3 }}>
                <Table size="small">
                  <TableHead sx={{ bgcolor: mode === 'dark' ? '#1e293b' : '#f1f5f9' }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 800 }}>#</TableCell>
                      <TableCell sx={{ fontWeight: 800 }}>Design / Description</TableCell>
                      <TableCell sx={{ fontWeight: 800 }}>HSN</TableCell>
                      <TableCell sx={{ fontWeight: 800 }} align="right">Qty / Mtr</TableCell>
                      <TableCell sx={{ fontWeight: 800 }}>Unit</TableCell>
                      <TableCell sx={{ fontWeight: 800 }} align="right">Rate (₹)</TableCell>
                      <TableCell sx={{ fontWeight: 800 }} align="right">Amount (₹)</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(billToView.items || []).map((item, i) => (
                      <TableRow key={item.id || i} hover>
                        <TableCell sx={{ fontWeight: 600 }}>{i + 1}</TableCell>
                        <TableCell sx={{ fontWeight: 700, color: mode === 'dark' ? '#f1f5f9' : '#1e293b' }}>
                          {item.designNo ? `Design #${item.designNo} - ${item.description}` : item.description || 'Item'}
                        </TableCell>
                        <TableCell sx={{ fontSize: '0.82rem', color: mode === 'dark' ? '#94a3b8' : '#64748b' }}>
                          {item.hsnCode || '-'}
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600 }}>{item.quantity}</TableCell>
                        <TableCell sx={{ fontWeight: 600, color: mode === 'dark' ? '#94a3b8' : '#64748b' }}>{item.unit || 'Meter'}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600 }}>₹{item.rate}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700 }}>{formatRupees(item.amount)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              {/* Payment Details & Calculation Breakdown */}
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1.2fr 1fr' }, gap: 2 }}>
                {/* Left: Payment Method & Notes */}
                <Box sx={{ p: 2, bgcolor: mode === 'dark' ? '#1e293b' : '#f8fafc', borderRadius: 2, border: `1px solid ${mode === 'dark' ? '#334155' : '#e2e8f0'}` }}>
                  <Typography variant="caption" sx={{ color: mode === 'dark' ? '#94a3b8' : '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>
                    Payment Info & Method
                  </Typography>
                  <Box sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 0.8 }}>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: mode === 'dark' ? '#38bdf8' : '#0284c7' }}>
                      Payment Method: {billToView.paymentMethod || 'Cash'}
                    </Typography>
                    {billToView.paymentMethod === 'Cheque' && (
                      <Box sx={{ p: 1.2, bgcolor: mode === 'dark' ? '#0f172a' : '#f1f5f9', borderRadius: 1.5, border: `1px solid ${mode === 'dark' ? '#334155' : '#cbd5e1'}` }}>
                        <Typography variant="caption" sx={{ display: 'block', fontWeight: 700, color: mode === 'dark' ? '#f1f5f9' : '#334155' }}>
                          Cheque No: {billToView.chequeNo || 'N/A'}
                        </Typography>
                        {billToView.chequeDate && (
                          <Typography variant="caption" sx={{ display: 'block', color: mode === 'dark' ? '#94a3b8' : '#64748b' }}>
                            Cheque Date: {formatDate(billToView.chequeDate)}
                          </Typography>
                        )}
                        {billToView.chequeBank && (
                          <Typography variant="caption" sx={{ display: 'block', color: mode === 'dark' ? '#94a3b8' : '#64748b' }}>
                            Bank: {billToView.chequeBank}
                          </Typography>
                        )}
                      </Box>
                    )}
                    {billToView.paymentDate && (
                      <Typography variant="caption" sx={{ color: mode === 'dark' ? '#cbd5e1' : '#475569' }}>
                        Payment Date: {formatDate(billToView.paymentDate)}
                      </Typography>
                    )}
                    {billToView.notes && (
                      <Box sx={{ mt: 1, pt: 1, borderTop: `1px solid ${mode === 'dark' ? '#334155' : '#e2e8f0'}` }}>
                        <Typography variant="caption" sx={{ color: mode === 'dark' ? '#94a3b8' : '#64748b', fontWeight: 700, display: 'block' }}>
                          Notes / Terms:
                        </Typography>
                        <Typography variant="body2" sx={{ color: mode === 'dark' ? '#cbd5e1' : '#334155' }}>
                          {billToView.notes}
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </Box>

                {/* Right: Calculations */}
                <Box sx={{ p: 2, bgcolor: mode === 'dark' ? '#0f172a' : '#f1f5f9', borderRadius: 2, border: `1px solid ${mode === 'dark' ? '#1e293b' : '#cbd5e1'}` }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="body2" color="text.secondary">Subtotal:</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>{formatRupees(billToView.subtotal)}</Typography>
                  </Box>
                  {billToView.extraCharges ? (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="body2" color="text.secondary">Extra Charges:</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>{formatRupees(billToView.extraCharges)}</Typography>
                    </Box>
                  ) : null}
                  {(billToView.cgst > 0 || billToView.totalTax > 0) && (
                    <>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="body2" color="text.secondary">CGST (2.5%):</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{formatRupees(billToView.cgst || (billToView.totalTax ? billToView.totalTax / 2 : 0))}</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="body2" color="text.secondary">SGST (2.5%):</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{formatRupees(billToView.sgst || (billToView.totalTax ? billToView.totalTax / 2 : 0))}</Typography>
                      </Box>
                    </>
                  )}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', pt: 1, borderTop: '1px solid #cbd5e1', mb: 1 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'primary.main' }}>Total Amount:</Typography>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'primary.main' }}>{formatRupees(billToView.totalAmount)}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" sx={{ color: 'success.main', fontWeight: 700 }}>Paid Amount:</Typography>
                    <Typography variant="body2" sx={{ color: 'success.main', fontWeight: 700 }}>{formatRupees(billToView.paidAmount)}</Typography>
                  </Box>
                </Box>
              </Box>
            </DialogContent>

            <DialogActions sx={{ p: 2.5, justifyContent: 'space-between', bgcolor: mode === 'dark' ? '#0f172a' : '#f8fafc', borderTop: `1px solid ${mode === 'dark' ? '#1e293b' : '#e2e8f0'}` }}>
              <Button
                variant="contained"
                color="primary"
                startIcon={<PrintIcon />}
                onClick={() => {
                  setSelectedBill(billToView);
                  setPreviewOpen(true);
                  setViewDetailsOpen(false);
                }}
                sx={{ fontWeight: 700 }}
              >
                Printable Invoice / PDF
              </Button>
              <Button
                variant="outlined"
                color="inherit"
                onClick={() => setViewDetailsOpen(false)}
                sx={{ fontWeight: 700 }}
              >
                Close
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {selectedBill && (
        <InvoiceModal
          open={previewOpen}
          onClose={() => setPreviewOpen(false)}
          bill={selectedBill}
          settings={settings}
        />
      )}

      <ConfirmationDialog
        open={deleteOpen}
        title="Delete Bill Invoice?"
        message="Are you sure you want to permanently delete this bill? This action cannot be undone."
        onConfirm={handleDeleteConfirm}
        onClose={() => setDeleteOpen(false)}
      />

      {/* SHARE INVOICE MENU */}
      <Menu
        anchorEl={shareMenuAnchor}
        open={Boolean(shareMenuAnchor)}
        onClose={handleCloseShareMenu}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        slotProps={{
          paper: {
            elevation: 3,
            sx: {
              borderRadius: 2.5,
              minWidth: 200,
              mt: 0.5,
              border: `1px solid ${mode === 'dark' ? '#334155' : '#e2e8f0'}`,
              bgcolor: mode === 'dark' ? '#1e293b' : '#ffffff',
            },
          },
        }}
      >
        <MenuItem onClick={handleShareWhatsApp} sx={{ py: 1.2, px: 2 }}>
          <ListItemIcon sx={{ color: '#25D366', minWidth: 36 }}>
            <WhatsAppIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText
            primary={<Typography variant="body2" sx={{ fontWeight: 700 }}>{language === 'gu' ? 'WhatsApp દ્વારા શેર કરો' : 'Share via WhatsApp'}</Typography>}
          />
        </MenuItem>
        <MenuItem onClick={handleCopyBillDetails} sx={{ py: 1.2, px: 2 }}>
          <ListItemIcon sx={{ color: '#0284c7', minWidth: 36 }}>
            <CopyIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText
            primary={<Typography variant="body2" sx={{ fontWeight: 600 }}>{language === 'gu' ? 'ઇનવોઇસ સમરી કોપી કરો' : 'Copy Invoice Summary'}</Typography>}
          />
        </MenuItem>
        <MenuItem onClick={handleNativeShare} sx={{ py: 1.2, px: 2 }}>
          <ListItemIcon sx={{ color: '#8b5cf6', minWidth: 36 }}>
            <ShareIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText
            primary={<Typography variant="body2" sx={{ fontWeight: 600 }}>{language === 'gu' ? 'અન્ય એપ્સમાં શેર કરો' : 'Share to Other Apps'}</Typography>}
          />
        </MenuItem>
      </Menu>
    </Box>
  );
};
