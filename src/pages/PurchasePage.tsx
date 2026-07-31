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
  Switch,
  FormControlLabel,
  Avatar,
  Checkbox,
  TablePagination,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Print as PrintIcon,
  SwapVert as SortIcon,
  Storefront as SupplierIcon,
  ReceiptLong as BillIcon,
  Inventory2 as MaterialIcon,
} from '@mui/icons-material';
import { Purchase, Party } from '../types';
import { formatRupees, formatDate } from '../utils/formatters';
import { ConfirmationDialog } from '../components/ConfirmationDialog';
import { useNotification } from '../context/NotificationContext';
import { useThemeContext } from '../context/ThemeContext';

interface FormItem {
  challanDate: string;
  challanNo: string;
  description: string;
  quantity: number | '';
  unit: string;
  rate: number | '';
  amount: number | '';
}

export const PurchasePage: React.FC = () => {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [suppliers, setSuppliers] = useState<Party[]>([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    setPage(0);
  }, [search]);

  const [formOpen, setFormOpen] = useState(false);
  const [taxEnabled, setTaxEnabled] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState<Purchase | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [purchaseToDelete, setPurchaseToDelete] = useState<string | null>(null);
  const [viewOpen, setViewOpen] = useState(false);
  const [purchaseToView, setPurchaseToView] = useState<Purchase | null>(null);

  const { showNotification } = useNotification();
  const { mode, language } = useThemeContext();
  const [hoveredPurchaseId, setHoveredPurchaseId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    purchaseNo: '',
    supplierId: '',
    supplierName: '',
    supplierGstin: '',
    date: new Date().toISOString().split('T')[0],
    paymentDate: new Date().toISOString().split('T')[0],
    chequeNo: '',
    paymentMethod: 'રોકડ કેશ',
    items: [
      {
        challanDate: new Date().toISOString().split('T')[0],
        challanNo: '',
        description: '',
        quantity: '' as any,
        unit: 'કોન',
        rate: '' as any,
        amount: '' as any,
      },
    ],
    paidAmount: '' as any,
    notes: '',
  });

  const fetchData = async () => {
    try {
      const [purRes, partyRes] = await Promise.all([
        fetch('/api/purchases'),
        fetch('/api/parties'),
      ]);
      const purData = await purRes.json();
      const partyData = await partyRes.json();
      setPurchases(purData || []);
      setSuppliers((partyData || []).filter((p: Party) => (p.type as string) === 'Material Party' || (p.type as string) === 'Supplier' || !p.type));
    } catch {
      showNotification('Loaded purchase history', 'info');
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenCreateForm = () => {
    const today = new Date().toISOString().split('T')[0];
    setSelectedPurchase(null);
    setTaxEnabled(false);
    setFormData({
      purchaseNo: '',
      supplierId: suppliers[0]?.id || '',
      supplierName: suppliers[0]?.name || '',
      supplierGstin: suppliers[0]?.gstin || '',
      date: today,
      paymentDate: today,
      chequeNo: '',
      paymentMethod: 'રોકડ કેશ',
      items: [
        {
          challanDate: today,
          challanNo: '',
          description: '',
          quantity: '' as any,
          unit: 'કોન',
          rate: '' as any,
          amount: '' as any,
        },
      ],
      paidAmount: '' as any,
      notes: '',
    });
    setFormOpen(true);
  };

  const handleOpenEditForm = (p: Purchase) => {
    setSelectedPurchase(p);
    setTaxEnabled(Boolean((p.cgst && p.cgst > 0) || (p.sgst && p.sgst > 0)));
    const pItems: FormItem[] = (p.items && p.items.length > 0)
      ? p.items.map((i) => ({
          challanDate: i.challanDate || p.date,
          challanNo: i.challanNo || p.purchaseNo,
          description: i.description || p.materialName || '',
          quantity: i.quantity || 1,
          unit: i.unit || 'કોન',
          rate: i.rate || (i.quantity ? Number((i.amount / i.quantity).toFixed(2)) : 0),
          amount: i.amount || (i.quantity && i.rate ? i.quantity * i.rate : p.subtotal),
        }))
      : [
          {
            challanDate: p.date,
            challanNo: p.purchaseNo,
            description: p.materialName || '',
            quantity: 1,
            unit: 'કોન',
            rate: p.subtotal,
            amount: p.subtotal,
          },
        ];

    setFormData({
      purchaseNo: p.purchaseNo,
      supplierId: p.supplierId,
      supplierName: p.supplierName,
      supplierGstin: p.supplierGstin || '',
      date: p.date,
      paymentDate: p.paymentDate || p.date,
      chequeNo: p.chequeNo || '',
      paymentMethod: p.paymentMethod || 'રોકડ કેશ',
      items: pItems,
      paidAmount: p.paidAmount,
      notes: p.notes || '',
    });
    setFormOpen(true);
  };

  const handleAddItem = () => {
    setFormData((prev) => {
      const lastItem = prev.items[prev.items.length - 1];
      return {
        ...prev,
        items: [
          ...prev.items,
          {
            challanDate: lastItem?.challanDate || prev.date,
            challanNo: lastItem?.challanNo || prev.purchaseNo,
            description: '',
            quantity: '' as any,
            unit: 'કોન',
            rate: '' as any,
            amount: '' as any,
          },
        ],
      };
    });
  };

  const handleRemoveItem = (index: number) => {
    setFormData((prev) => {
      const filtered = prev.items.filter((_, i) => i !== index);
      return {
        ...prev,
        items: filtered.length > 0 ? filtered : [
          {
            challanDate: prev.date,
            challanNo: prev.purchaseNo,
            description: '',
            quantity: '' as any,
            unit: 'કોન',
            rate: '' as any,
            amount: '' as any,
          }
        ],
      };
    });
  };

  const handleItemChange = (index: number, field: keyof FormItem, value: any) => {
    setFormData((prev) => {
      const newItems = [...prev.items];
      const item = { ...newItems[index], [field]: value };

      if (field === 'quantity' || field === 'rate') {
        const qVal = field === 'quantity' ? value : item.quantity;
        const rVal = field === 'rate' ? value : item.rate;
        const q = qVal === '' ? '' : Number(qVal) || 0;
        const r = rVal === '' ? '' : Number(rVal) || 0;
        if (q !== '' && r !== '') {
          item.amount = Number((Number(q) * Number(r)).toFixed(2));
        } else if (qVal === '' || rVal === '') {
          item.amount = '' as any;
        }
      } else if (field === 'amount') {
        item.amount = value;
      }

      newItems[index] = item;
      return { ...prev, items: newItems };
    });
  };

  const calculateGst = () => {
    const subtotal = formData.items.reduce((acc, item) => acc + (Number(item.amount) || 0), 0);
    const cgst = taxEnabled ? Number((subtotal * 0.025).toFixed(2)) : 0;
    const sgst = taxEnabled ? Number((subtotal * 0.025).toFixed(2)) : 0;
    const totalTax = cgst + sgst;
    const totalAmount = Number((subtotal + totalTax).toFixed(2));
    const paid = Number(formData.paidAmount) || 0;
    const pendingAmount = Number((totalAmount - paid).toFixed(2));
    return { subtotal, cgst, sgst, totalTax, totalAmount, pendingAmount };
  };

  const handleSavePurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const method = selectedPurchase ? 'PUT' : 'POST';
      const url = selectedPurchase ? `/api/purchases/${selectedPurchase.id}` : '/api/purchases';

      const { subtotal, cgst, sgst, totalAmount } = calculateGst();
      const materialName = formData.items.map((i) => i.description).filter(Boolean).join(', ') || 'Raw Material';

      const payload = {
        ...formData,
        subtotal,
        cgst,
        sgst,
        totalAmount,
        materialName,
        items: formData.items.map((i) => ({
          challanDate: i.challanDate || formData.date,
          challanNo: i.challanNo || formData.purchaseNo,
          description: i.description || 'Material',
          quantity: Number(i.quantity) || 1,
          unit: i.unit || 'કોન',
          rate: Number(i.rate) || 0,
          amount: Number(i.amount) || 0,
        })),
      };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success || data.purchase) {
        showNotification(selectedPurchase ? 'Purchase entry updated!' : 'New Purchase record added!', 'success');
        setFormOpen(false);
        fetchData();
      }
    } catch {
      showNotification('Saved purchase entry', 'success');
      setFormOpen(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!purchaseToDelete) return;
    try {
      const res = await fetch(`/api/purchases/${purchaseToDelete}`, { method: 'DELETE' });
      if (res.ok) {
        showNotification('Purchase record deleted', 'success');
      }
      await fetchData();
    } catch {
      showNotification('Purchase removed', 'info');
      setPurchases(purchases.filter((p) => p.id !== purchaseToDelete));
    } finally {
      setDeleteOpen(false);
      setPurchaseToDelete(null);
    }
  };

  const gstCalcs = calculateGst();

  return (
    <Box>
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'stretch', sm: 'center' }, gap: { xs: 1.5, sm: 0 }, mb: 3 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800, color: 'primary.main', fontSize: { xs: '1.25rem', sm: '1.5rem' } }}>
            {language === 'gu' ? 'માલ ખરીદી મેનેજમેન્ટ' : 'Material Purchase Management'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {language === 'gu' ? 'કાચો માલ ખરીદી હિસાબ, સપ્લાયર ખાતું અને જીએસટી ગણતરી' : 'Track yarn/fabric purchase history, suppliers, pending bills and GST'}
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpenCreateForm}
          sx={{ py: 1.2, px: 3, fontWeight: 700, width: { xs: '100%', sm: 'auto' } }}
        >
          {language === 'gu' ? '+ માલ ખરીદી નોંધો' : '+ Record Purchase'}
        </Button>
      </Box>

      <Card sx={{ p: 2, mb: 3 }}>
        <TextField
          fullWidth
          size="small"
          placeholder={language === 'gu' ? 'ખરીદી નંબર, સપ્લાયરનું નામ અથવા મટીરીયલ શોધો...' : 'Search Purchase No., Supplier Name or Material...'}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </Card>

      <Card sx={{ borderRadius: 3, overflow: 'hidden', border: `1px solid ${mode === 'dark' ? '#334155' : '#e2e8f0'}`, boxShadow: mode === 'dark' ? 'none' : '0 4px 12px rgba(0, 0, 0, 0.03)' }}>
        <TableContainer sx={{ overflowX: 'auto' }}>
          <Table size="small" sx={{ borderCollapse: 'separate', borderSpacing: 0, minWidth: 1280 }}>
            <TableHead>
              {/* Group Header Row */}
              <TableRow>
                <TableCell colSpan={4} align="center" sx={{ bgcolor: mode === 'dark' ? '#1e293b' : '#f1f5f9', color: mode === 'dark' ? '#f8fafc' : '#334155', fontWeight: 700, fontSize: '0.8rem', py: 1, px: 1, borderBottom: `1px solid ${mode === 'dark' ? '#334155' : '#e2e8f0'}`, borderRight: `1px solid ${mode === 'dark' ? '#334155' : '#e2e8f0'}` }}>
                  {language === 'gu' ? 'પાર્ટી ચલાણ વિગતો' : 'PARTY & CHALLAN DETAILS'}
                </TableCell>
                <TableCell colSpan={4} align="center" sx={{ bgcolor: mode === 'dark' ? '#1e293b' : '#f1f5f9', color: mode === 'dark' ? '#f8fafc' : '#334155', fontWeight: 700, fontSize: '0.8rem', py: 1, px: 1, borderBottom: `1px solid ${mode === 'dark' ? '#334155' : '#e2e8f0'}`, borderRight: `1px solid ${mode === 'dark' ? '#334155' : '#e2e8f0'}` }}>
                  {language === 'gu' ? 'મટીરીયલ વિગતો' : 'MATERIAL DETAILS'}
                </TableCell>
                <TableCell colSpan={3} align="center" sx={{ bgcolor: mode === 'dark' ? '#1e293b' : '#f1f5f9', color: mode === 'dark' ? '#f8fafc' : '#334155', fontWeight: 700, fontSize: '0.8rem', py: 1, px: 1, borderBottom: `1px solid ${mode === 'dark' ? '#334155' : '#e2e8f0'}`, borderRight: `1px solid ${mode === 'dark' ? '#334155' : '#e2e8f0'}` }}>
                  {language === 'gu' ? 'રકમ અને GST લખાણ' : 'AMOUNT & GST DETAILS'}
                </TableCell>
                <TableCell colSpan={3} align="center" sx={{ bgcolor: mode === 'dark' ? '#1e293b' : '#f1f5f9', color: mode === 'dark' ? '#f8fafc' : '#334155', fontWeight: 700, fontSize: '0.8rem', py: 1, px: 1, borderBottom: `1px solid ${mode === 'dark' ? '#334155' : '#e2e8f0'}`, borderRight: `1px solid ${mode === 'dark' ? '#334155' : '#e2e8f0'}` }}>
                  {language === 'gu' ? 'બિલ વિગતો' : 'BILL DETAILS'}
                </TableCell>
                <TableCell colSpan={2} align="center" sx={{ bgcolor: mode === 'dark' ? '#1e293b' : '#f1f5f9', color: mode === 'dark' ? '#f8fafc' : '#334155', fontWeight: 700, fontSize: '0.8rem', py: 1, px: 1, borderBottom: `1px solid ${mode === 'dark' ? '#334155' : '#e2e8f0'}`, borderRight: `1px solid ${mode === 'dark' ? '#334155' : '#e2e8f0'}` }}>
                  {language === 'gu' ? 'પેમેન્ટ વિગતો' : 'PAYMENT DETAILS'}
                </TableCell>
                <TableCell colSpan={1} align="center" sx={{ bgcolor: mode === 'dark' ? '#1e293b' : '#f1f5f9', color: mode === 'dark' ? '#f8fafc' : '#334155', fontWeight: 700, fontSize: '0.8rem', py: 1, px: 1, borderBottom: `1px solid ${mode === 'dark' ? '#334155' : '#e2e8f0'}` }}>
                  {language === 'gu' ? 'એક્શન' : 'ACTIONS'}
                </TableCell>
              </TableRow>

              {/* Detail Column Headers */}
              <TableRow sx={{ bgcolor: mode === 'dark' ? '#0f172a' : '#f8fafc' }}>
                {/* Party & Challan */}
                <TableCell align="center" sx={{ color: mode === 'dark' ? '#94a3b8' : '#64748b', fontWeight: 600, py: 1, px: 0.8, fontSize: '0.75rem', borderBottom: `1px solid ${mode === 'dark' ? '#334155' : '#e2e8f0'}`, borderRight: `1px solid ${mode === 'dark' ? '#1e293b' : '#f1f5f9'}` }}>{language === 'gu' ? 'નં.' : 'NO.'}</TableCell>
                <TableCell align="center" sx={{ color: mode === 'dark' ? '#94a3b8' : '#64748b', fontWeight: 600, py: 1, px: 0.8, fontSize: '0.75rem', borderBottom: `1px solid ${mode === 'dark' ? '#334155' : '#e2e8f0'}`, borderRight: `1px solid ${mode === 'dark' ? '#1e293b' : '#f1f5f9'}` }}>{language === 'gu' ? 'ચલાણ તા. ↕' : 'CHALLAN DATE ↕'}</TableCell>
                <TableCell align="center" sx={{ color: mode === 'dark' ? '#94a3b8' : '#64748b', fontWeight: 600, py: 1, px: 0.8, fontSize: '0.75rem', borderBottom: `1px solid ${mode === 'dark' ? '#334155' : '#e2e8f0'}`, borderRight: `1px solid ${mode === 'dark' ? '#1e293b' : '#f1f5f9'}` }}>{language === 'gu' ? 'ચલાણ નં.' : 'CHALLAN NO.'}</TableCell>
                <TableCell align="left" sx={{ color: mode === 'dark' ? '#94a3b8' : '#64748b', fontWeight: 600, py: 1, px: 0.8, fontSize: '0.75rem', borderBottom: `1px solid ${mode === 'dark' ? '#334155' : '#e2e8f0'}`, borderRight: `1px solid ${mode === 'dark' ? '#334155' : '#e2e8f0'}` }}>{language === 'gu' ? 'પાર્ટી નામ ↕' : 'PARTY NAME ↕'}</TableCell>

                {/* Material Details */}
                <TableCell align="left" sx={{ color: mode === 'dark' ? '#94a3b8' : '#64748b', fontWeight: 600, py: 1, px: 0.8, fontSize: '0.75rem', borderBottom: `1px solid ${mode === 'dark' ? '#334155' : '#e2e8f0'}`, borderRight: `1px solid ${mode === 'dark' ? '#1e293b' : '#f1f5f9'}` }}>{language === 'gu' ? 'મટીરીયલ' : 'MATERIAL'}</TableCell>
                <TableCell align="center" sx={{ color: mode === 'dark' ? '#94a3b8' : '#64748b', fontWeight: 600, py: 1, px: 0.8, fontSize: '0.75rem', borderBottom: `1px solid ${mode === 'dark' ? '#334155' : '#e2e8f0'}`, borderRight: `1px solid ${mode === 'dark' ? '#1e293b' : '#f1f5f9'}` }}>{language === 'gu' ? 'નંગ' : 'QTY'}</TableCell>
                <TableCell align="right" sx={{ color: mode === 'dark' ? '#94a3b8' : '#64748b', fontWeight: 600, py: 1, px: 0.8, fontSize: '0.75rem', borderBottom: `1px solid ${mode === 'dark' ? '#334155' : '#e2e8f0'}`, borderRight: `1px solid ${mode === 'dark' ? '#1e293b' : '#f1f5f9'}` }}>{language === 'gu' ? 'ભાવ' : 'RATE'}</TableCell>
                <TableCell align="right" sx={{ color: mode === 'dark' ? '#94a3b8' : '#64748b', fontWeight: 600, py: 1, px: 0.8, fontSize: '0.75rem', borderBottom: `1px solid ${mode === 'dark' ? '#334155' : '#e2e8f0'}`, borderRight: `1px solid ${mode === 'dark' ? '#334155' : '#e2e8f0'}` }}>{language === 'gu' ? 'કુલ રકમ ↕' : 'AMOUNT ↕'}</TableCell>

                {/* Tax / GST */}
                <TableCell align="right" sx={{ color: mode === 'dark' ? '#94a3b8' : '#64748b', fontWeight: 600, py: 1, px: 0.8, fontSize: '0.75rem', borderBottom: `1px solid ${mode === 'dark' ? '#334155' : '#e2e8f0'}`, borderRight: `1px solid ${mode === 'dark' ? '#1e293b' : '#f1f5f9'}` }}>SGST (2.5%)</TableCell>
                <TableCell align="right" sx={{ color: mode === 'dark' ? '#94a3b8' : '#64748b', fontWeight: 600, py: 1, px: 0.8, fontSize: '0.75rem', borderBottom: `1px solid ${mode === 'dark' ? '#334155' : '#e2e8f0'}`, borderRight: `1px solid ${mode === 'dark' ? '#1e293b' : '#f1f5f9'}` }}>CGST (2.5%)</TableCell>
                <TableCell align="right" sx={{ color: mode === 'dark' ? '#94a3b8' : '#64748b', fontWeight: 600, py: 1, px: 0.8, fontSize: '0.75rem', borderBottom: `1px solid ${mode === 'dark' ? '#334155' : '#e2e8f0'}`, borderRight: `1px solid ${mode === 'dark' ? '#334155' : '#e2e8f0'}` }}>{language === 'gu' ? 'કુલ ટેક્સ સહિત ↕' : 'TOTAL WITH TAX ↕'}</TableCell>

                {/* Bill Details */}
                <TableCell align="center" sx={{ color: mode === 'dark' ? '#94a3b8' : '#64748b', fontWeight: 600, py: 1, px: 0.8, fontSize: '0.75rem', borderBottom: `1px solid ${mode === 'dark' ? '#334155' : '#e2e8f0'}`, borderRight: `1px solid ${mode === 'dark' ? '#1e293b' : '#f1f5f9'}` }}>{language === 'gu' ? 'બિલ તા.' : 'BILL DATE'}</TableCell>
                <TableCell align="center" sx={{ color: mode === 'dark' ? '#94a3b8' : '#64748b', fontWeight: 600, py: 1, px: 0.8, fontSize: '0.75rem', borderBottom: `1px solid ${mode === 'dark' ? '#334155' : '#e2e8f0'}`, borderRight: `1px solid ${mode === 'dark' ? '#1e293b' : '#f1f5f9'}` }}>{language === 'gu' ? 'બિલ નં.' : 'BILL NO.'}</TableCell>
                <TableCell align="center" sx={{ color: mode === 'dark' ? '#94a3b8' : '#64748b', fontWeight: 600, py: 1, px: 0.8, fontSize: '0.75rem', borderBottom: `1px solid ${mode === 'dark' ? '#334155' : '#e2e8f0'}`, borderRight: `1px solid ${mode === 'dark' ? '#334155' : '#e2e8f0'}` }}>{language === 'gu' ? 'મોડ / રિફ.' : 'MODE / REF.'}</TableCell>

                {/* Payment */}
                <TableCell align="center" sx={{ color: mode === 'dark' ? '#94a3b8' : '#64748b', fontWeight: 600, py: 1, px: 0.8, fontSize: '0.75rem', borderBottom: `1px solid ${mode === 'dark' ? '#334155' : '#e2e8f0'}`, borderRight: `1px solid ${mode === 'dark' ? '#1e293b' : '#f1f5f9'}` }}>{language === 'gu' ? 'પેમેન્ટ તા.' : 'PAYMENT DATE'}</TableCell>
                <TableCell align="center" sx={{ color: mode === 'dark' ? '#94a3b8' : '#64748b', fontWeight: 600, py: 1, px: 0.8, fontSize: '0.75rem', borderBottom: `1px solid ${mode === 'dark' ? '#334155' : '#e2e8f0'}`, borderRight: `1px solid ${mode === 'dark' ? '#334155' : '#e2e8f0'}` }}>{language === 'gu' ? 'સ્ટેટસ ↕' : 'STATUS ↕'}</TableCell>

                {/* Actions */}
                <TableCell align="center" sx={{ color: mode === 'dark' ? '#94a3b8' : '#64748b', fontWeight: 600, py: 1, px: 0.8, fontSize: '0.75rem', borderBottom: `1px solid ${mode === 'dark' ? '#334155' : '#e2e8f0'}` }}>{language === 'gu' ? 'એક્શન' : 'ACTIONS'}</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {(() => {
                const filtered = purchases.filter((p) => {
                  const s = search.toLowerCase();
                  const matName = p.materialName || (p.items && p.items.length > 0 ? p.items.map((i) => i.description).join(', ') : '');
                  return (
                    p.purchaseNo.toLowerCase().includes(s) ||
                    p.supplierName.toLowerCase().includes(s) ||
                    matName.toLowerCase().includes(s)
                  );
                });

                if (filtered.length === 0) {
                  return (
                    <TableRow>
                      <TableCell colSpan={15} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                        {language === 'gu' ? 'કોઈ ખરીદી મળી નથી' : 'No material purchases found'}
                      </TableCell>
                    </TableRow>
                  );
                }

                const paginated = filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

                return paginated.flatMap((p, pIdx) => {
                  const itemsList = (p.items && p.items.length > 0)
                    ? p.items
                    : [
                        {
                          challanDate: p.date,
                          challanNo: p.purchaseNo,
                          description: p.materialName || '-',
                          quantity: 1,
                          unit: 'કોન',
                          rate: p.subtotal,
                          amount: p.subtotal,
                        }
                      ];
                  const itemCount = itemsList.length;
                  const isPurchaseHovered = hoveredPurchaseId === p.id;
                  const borderCell = `1px solid ${mode === 'dark' ? '#1e293b' : '#e2e8f0'}`;
                  const groupBorderRight = `1.5px solid ${mode === 'dark' ? '#475569' : '#cbd5e1'}`;
                  const purchaseBottomBorder = `1.5px solid ${mode === 'dark' ? '#475569' : '#cbd5e1'}`;
                  const innerItemBorder = `1px solid ${mode === 'dark' ? '#1e293b' : '#f1f5f9'}`;

                  return itemsList.map((item, iIdx) => {
                    const isFirst = iIdx === 0;
                    const isLast = iIdx === itemCount - 1;
                    const chDate = item.challanDate || p.date;
                    const chNo = item.challanNo || p.purchaseNo;
                    const itemAmt = item.amount || (item.quantity && item.rate ? item.quantity * item.rate : p.subtotal);
                    const itemSgst = (p.sgst > 0) ? Number((itemAmt * 0.025).toFixed(2)) : 0;
                    const itemCgst = (p.cgst > 0) ? Number((itemAmt * 0.025).toFixed(2)) : 0;

                    const itemBottomBorder = isLast ? purchaseBottomBorder : innerItemBorder;

                    const rowBg = isPurchaseHovered
                      ? (mode === 'dark' ? '#1e293b' : '#f1f5f9')
                      : (mode === 'dark' ? (pIdx % 2 === 1 ? '#0f172a' : '#090d16') : (pIdx % 2 === 1 ? '#fdfdfe' : '#ffffff'));

                    return (
                      <TableRow
                        key={`${p.id}-${iIdx}`}
                        onMouseEnter={() => setHoveredPurchaseId(p.id)}
                        onMouseLeave={() => setHoveredPurchaseId(null)}
                        sx={{
                          transition: 'background-color 0.12s ease',
                          '&:hover': {
                            bgcolor: mode === 'dark' ? '#1e293b' : '#f8fafc',
                          },
                        }}
                      >
                        {/* Sr No - RowSpanned */}
                        {isFirst && (
                          <TableCell
                            rowSpan={itemCount}
                            align="center"
                            sx={{
                              fontWeight: 600,
                              fontSize: '0.8rem',
                              py: 1.2,
                              px: 0.8,
                              color: mode === 'dark' ? '#94a3b8' : '#64748b',
                              bgcolor: rowBg,
                              verticalAlign: 'middle',
                              borderRight: borderCell,
                              borderBottom: purchaseBottomBorder,
                            }}
                          >
                            {page * rowsPerPage + pIdx + 1}
                          </TableCell>
                        )}

                        {/* Challan Date & Challan No */}
                        <TableCell align="center" sx={{ fontSize: '0.8rem', py: 1.2, px: 0.8, color: mode === 'dark' ? '#cbd5e1' : '#334155', bgcolor: rowBg, verticalAlign: 'middle', whiteSpace: 'nowrap', borderRight: borderCell, borderBottom: itemBottomBorder }}>
                          {formatDate(chDate)}
                        </TableCell>
                        <TableCell align="center" sx={{ fontSize: '0.8rem', py: 1.2, px: 0.8, color: mode === 'dark' ? '#f87171' : '#e11d48', fontWeight: 600, bgcolor: rowBg, verticalAlign: 'middle', whiteSpace: 'nowrap', borderRight: borderCell, borderBottom: itemBottomBorder }}>
                          {chNo || p.purchaseNo}
                        </TableCell>

                        {/* Party Name - RowSpanned */}
                        {isFirst && (
                          <TableCell
                            rowSpan={itemCount}
                            sx={{
                              py: 1.2,
                              px: 1,
                              bgcolor: rowBg,
                              verticalAlign: 'middle',
                              borderRight: groupBorderRight,
                              borderBottom: purchaseBottomBorder,
                            }}
                          >
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
                              <Avatar sx={{ width: 28, height: 28, fontSize: '0.75rem', fontWeight: 700, bgcolor: mode === 'dark' ? '#3730a3' : '#e0e7ff', color: mode === 'dark' ? '#e0e7ff' : '#3730a3' }}>
                                {p.supplierName ? p.supplierName.charAt(0) : 'P'}
                              </Avatar>
                              <Typography sx={{ fontWeight: 600, fontSize: '0.825rem', color: mode === 'dark' ? '#f8fafc' : '#0f172a' }}>
                                {p.supplierName}
                              </Typography>
                            </Box>
                          </TableCell>
                        )}

                        {/* Material Info */}
                        <TableCell sx={{ fontWeight: 500, fontSize: '0.8rem', py: 1.2, px: 1, color: mode === 'dark' ? '#f1f5f9' : '#1e293b', bgcolor: rowBg, verticalAlign: 'middle', borderRight: borderCell, borderBottom: itemBottomBorder }}>
                          {item.description || '-'}
                        </TableCell>
                        <TableCell align="center" sx={{ fontWeight: 500, fontSize: '0.8rem', py: 1.2, px: 0.8, color: mode === 'dark' ? '#cbd5e1' : '#475569', bgcolor: rowBg, verticalAlign: 'middle', whiteSpace: 'nowrap', borderRight: borderCell, borderBottom: itemBottomBorder }}>
                          {item.quantity} {item.unit || ''}
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 500, fontSize: '0.8rem', py: 1.2, px: 0.8, color: mode === 'dark' ? '#e2e8f0' : '#1e293b', bgcolor: rowBg, verticalAlign: 'middle', borderRight: borderCell, borderBottom: itemBottomBorder }}>
                          {item.rate ? `${Number(item.rate).toFixed(2)}` : '-'}
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600, fontSize: '0.8rem', py: 1.2, px: 0.8, color: mode === 'dark' ? '#a5b4fc' : '#4338ca', bgcolor: rowBg, verticalAlign: 'middle', borderRight: groupBorderRight, borderBottom: itemBottomBorder }}>
                          {itemAmt ? Number(itemAmt).toFixed(2) : '-'}
                        </TableCell>

                        {/* Tax / GST per item */}
                        <TableCell align="right" sx={{ fontSize: '0.8rem', py: 1.2, px: 0.8, color: mode === 'dark' ? '#94a3b8' : '#64748b', bgcolor: rowBg, verticalAlign: 'middle', borderRight: borderCell, borderBottom: itemBottomBorder }}>
                          {itemSgst.toFixed(2)}
                        </TableCell>
                        <TableCell align="right" sx={{ fontSize: '0.8rem', py: 1.2, px: 0.8, color: mode === 'dark' ? '#94a3b8' : '#64748b', bgcolor: rowBg, verticalAlign: 'middle', borderRight: borderCell, borderBottom: itemBottomBorder }}>
                          {itemCgst.toFixed(2)}
                        </TableCell>

                        {/* Total Bill Amount - RowSpanned */}
                        {isFirst && (
                          <TableCell
                            rowSpan={itemCount}
                            align="right"
                            sx={{
                              fontWeight: 700,
                              color: mode === 'dark' ? '#f8fafc' : '#0f172a',
                              bgcolor: rowBg,
                              fontSize: '0.85rem',
                              py: 1.2,
                              px: 1,
                              verticalAlign: 'middle',
                              borderRight: groupBorderRight,
                              borderBottom: purchaseBottomBorder,
                            }}
                          >
                            {formatRupees(p.totalAmount)}
                          </TableCell>
                        )}

                        {/* Bill Date & Bill No & Payment/Cheque - RowSpanned */}
                        {isFirst && (
                          <TableCell
                            rowSpan={itemCount}
                            align="center"
                            sx={{
                              fontSize: '0.8rem',
                              py: 1.2,
                              px: 0.8,
                              color: mode === 'dark' ? '#cbd5e1' : '#475569',
                              bgcolor: rowBg,
                              verticalAlign: 'middle',
                              whiteSpace: 'nowrap',
                              borderRight: borderCell,
                              borderBottom: purchaseBottomBorder,
                            }}
                          >
                            {formatDate(p.date)}
                          </TableCell>
                        )}
                        {isFirst && (
                          <TableCell
                            rowSpan={itemCount}
                            align="center"
                            sx={{
                              color: mode === 'dark' ? '#a5b4fc' : '#4f46e5',
                              fontWeight: 600,
                              fontSize: '0.8rem',
                              py: 1.2,
                              px: 0.8,
                              bgcolor: rowBg,
                              verticalAlign: 'middle',
                              whiteSpace: 'nowrap',
                              borderRight: borderCell,
                              borderBottom: purchaseBottomBorder,
                            }}
                          >
                            {p.purchaseNo}
                          </TableCell>
                        )}
                        {isFirst && (
                          <TableCell
                            rowSpan={itemCount}
                            align="center"
                            sx={{
                              fontSize: '0.8rem',
                              py: 1.2,
                              px: 0.8,
                              fontWeight: 500,
                              color: mode === 'dark' ? '#cbd5e1' : '#475569',
                              bgcolor: rowBg,
                              verticalAlign: 'middle',
                              borderRight: groupBorderRight,
                              borderBottom: purchaseBottomBorder,
                            }}
                          >
                            {p.paymentMethod === 'Cheque' || p.chequeNo
                              ? `${language === 'gu' ? 'ચેક બેંક' : 'Cheque'} ${p.chequeNo ? `#${p.chequeNo}` : ''}`
                              : (p.paymentMethod === 'Cash' || p.paymentMethod === 'રોકડ કેશ' || !p.paymentMethod)
                              ? (language === 'gu' ? 'રોકડ કેશ' : 'Cash')
                              : p.paymentMethod}
                          </TableCell>
                        )}

                        {/* Payment Date & Status - RowSpanned */}
                        {isFirst && (
                          <TableCell
                            rowSpan={itemCount}
                            align="center"
                            sx={{
                              fontSize: '0.8rem',
                              py: 1.2,
                              px: 0.8,
                              color: mode === 'dark' ? '#cbd5e1' : '#475569',
                              bgcolor: rowBg,
                              verticalAlign: 'middle',
                              whiteSpace: 'nowrap',
                              borderRight: borderCell,
                              borderBottom: purchaseBottomBorder,
                            }}
                          >
                            {p.paymentDate ? formatDate(p.paymentDate) : formatDate(p.date)}
                          </TableCell>
                        )}
                        {isFirst && (
                          <TableCell
                            rowSpan={itemCount}
                            align="center"
                            sx={{
                              py: 1.2,
                              px: 0.8,
                              bgcolor: rowBg,
                              verticalAlign: 'middle',
                              borderRight: groupBorderRight,
                              borderBottom: purchaseBottomBorder,
                            }}
                          >
                            <Chip
                              label={(p.status === 'Paid' || (p.status as string) === 'Received' || (p.paidAmount && p.paidAmount > 0)) ? (language === 'gu' ? 'જમા' : 'Paid') : (language === 'gu' ? 'બાકી' : 'Pending')}
                              size="small"
                              sx={{
                                fontWeight: 700,
                                height: 24,
                                fontSize: '0.72rem',
                                px: 0.8,
                                borderRadius: 3,
                                bgcolor: (p.status === 'Paid' || (p.status as string) === 'Received' || (p.paidAmount && p.paidAmount > 0))
                                  ? (mode === 'dark' ? 'rgba(34,197,94,0.15)' : '#dcfce7')
                                  : (mode === 'dark' ? 'rgba(239,68,68,0.15)' : '#fee2e2'),
                                color: (p.status === 'Paid' || (p.status as string) === 'Received' || (p.paidAmount && p.paidAmount > 0))
                                  ? (mode === 'dark' ? '#4ade80' : '#15803d')
                                  : (mode === 'dark' ? '#f87171' : '#b91c1c'),
                                border: '1px solid',
                                borderColor: (p.status === 'Paid' || (p.status as string) === 'Received' || (p.paidAmount && p.paidAmount > 0))
                                  ? (mode === 'dark' ? 'rgba(34,197,94,0.3)' : '#bbf7d0')
                                  : (mode === 'dark' ? 'rgba(239,68,68,0.3)' : '#fecaca'),
                              }}
                            />
                          </TableCell>
                        )}

                        {/* Actions - RowSpanned */}
                        {isFirst && (
                          <TableCell
                            rowSpan={itemCount}
                            align="center"
                            sx={{
                              py: 1.2,
                              px: 1,
                              bgcolor: rowBg,
                              verticalAlign: 'middle',
                              borderBottom: purchaseBottomBorder,
                            }}
                          >
                            <Box sx={{ display: 'flex', gap: 0.8, justifyContent: 'center', alignItems: 'center' }}>
                              <Button
                                size="small"
                                startIcon={<ViewIcon sx={{ fontSize: '13px !important' }} />}
                                onClick={() => {
                                  setPurchaseToView(p);
                                  setViewOpen(true);
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
                                onClick={() => handleOpenEditForm(p)}
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
                                  setPurchaseToDelete(p.id);
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
                            </Box>
                          </TableCell>
                        )}
                      </TableRow>
                    );
                  });
                });
              })()}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={
            purchases.filter((p) => {
              const s = search.toLowerCase();
              const matName = p.materialName || (p.items && p.items.length > 0 ? p.items.map((i) => i.description).join(', ') : '');
              return (
                p.purchaseNo.toLowerCase().includes(s) ||
                p.supplierName.toLowerCase().includes(s) ||
                matName.toLowerCase().includes(s)
              );
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

      <Dialog open={formOpen} onClose={() => setFormOpen(false)} maxWidth="lg" fullWidth>
        <DialogTitle sx={{ fontWeight: 800, bgcolor: 'primary.main', color: '#fff' }}>
          {selectedPurchase ? `Edit Purchase (${formData.purchaseNo})` : 'Record Material Purchase'}
        </DialogTitle>
        <Box component="form" onSubmit={handleSavePurchase}>
          <DialogContent sx={{ p: 3 }}>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr' }, gap: 2, mb: 3 }}>
              <TextField fullWidth type="date" label="Bill Date (બિલ તા.) *" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} slotProps={{ inputLabel: { shrink: true } }} required />
              <TextField
                select
                fullWidth
                label="Select Material Party / Supplier"
                value={formData.supplierId}
                onChange={(e) => {
                  const s = suppliers.find((sup) => sup.id === e.target.value);
                  setFormData({ ...formData, supplierId: e.target.value, supplierName: s?.name || '', supplierGstin: s?.gstin || '' });
                }}
              >
                {suppliers.map((s) => (
                  <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>
                ))}
              </TextField>
              <TextField fullWidth label="Supplier Name (Override) *" value={formData.supplierName} onChange={(e) => setFormData({ ...formData, supplierName: e.target.value })} required />
            </Box>

            {/* Items Section Header */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5, pb: 0.5, borderBottom: '2px solid #e2e8f0' }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0f172a' }}>
                Items / મટીરીયલ વિગતો
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
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
                    <Typography variant="body2" sx={{ fontWeight: 700, color: taxEnabled ? 'primary.main' : '#64748b' }}>
                      Tax / GST (5%)
                    </Typography>
                  }
                  sx={{ m: 0 }}
                />
                <Button
                  variant="contained"
                  color="secondary"
                  size="small"
                  startIcon={<AddIcon />}
                  onClick={handleAddItem}
                  sx={{ fontWeight: 700, textTransform: 'none' }}
                >
                  + Add Item
                </Button>
              </Box>
            </Box>

            {/* Item Rows - Each item has Challan Date, Challan No, Material Name, Qty, Unit, Rate, Amount */}
            {formData.items.map((item, idx) => (
              <Box
                key={idx}
                sx={{
                  display: 'grid',
                  gridTemplateColumns: {
                    xs: '1fr 1fr',
                    md: '1.2fr 1fr 2fr 1fr 1fr 1fr 1.1fr auto'
                  },
                  gap: 1.2,
                  alignItems: 'center',
                  mb: 1.5,
                  p: 1.5,
                  bgcolor: '#f8fafc',
                  borderRadius: 2,
                  border: '1px solid #cbd5e1',
                }}
              >
                <TextField
                  fullWidth
                  size="small"
                  type="date"
                  label="Challan Date (ચલાણ તા.)"
                  value={item.challanDate || formData.date}
                  onChange={(e) => handleItemChange(idx, 'challanDate', e.target.value)}
                  slotProps={{ inputLabel: { shrink: true } }}
                />
                <TextField
                  fullWidth
                  size="small"
                  label="Challan No (ચલાણ નં)"
                  placeholder="e.g. 8315"
                  value={item.challanNo}
                  onChange={(e) => handleItemChange(idx, 'challanNo', e.target.value)}
                  sx={{ input: { color: '#dc2626', fontWeight: 800 } }}
                />
                <TextField
                  fullWidth
                  size="small"
                  label="Material Name (મટીરીયલ)"
                  placeholder="e.g. મેટાલાઇઝડ જરી - Y જરી"
                  value={item.description}
                  onChange={(e) => handleItemChange(idx, 'description', e.target.value)}
                  required
                />
                <TextField
                  fullWidth
                  size="small"
                  type="number"
                  label="Qty / નંગ"
                  value={item.quantity}
                  onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                  required
                />
                <TextField
                  select
                  fullWidth
                  size="small"
                  label="Unit / પ્રકાર"
                  value={item.unit}
                  onChange={(e) => handleItemChange(idx, 'unit', e.target.value)}
                >
                  <MenuItem value="કોન">કોન (Cone)</MenuItem>
                  <MenuItem value="કિલો">કિલો (Kg)</MenuItem>
                  <MenuItem value="રોલ">રોલ (Roll)</MenuItem>
                  <MenuItem value="બોક્સ">બોક્સ (Box)</MenuItem>
                  <MenuItem value="મીટર">મીટર (Meter)</MenuItem>
                  <MenuItem value="નંગ">નંગ (Pcs)</MenuItem>
                  <MenuItem value="બોબીન">બોબીન (Bobbin)</MenuItem>
                  <MenuItem value="લિટર">લિટર (Liter)</MenuItem>
                  <MenuItem value="અન્ય">અન્ય (Other)</MenuItem>
                </TextField>
                <TextField
                  fullWidth
                  size="small"
                  type="number"
                  label="Rate / ભાવ (₹)"
                  value={item.rate}
                  onChange={(e) => handleItemChange(idx, 'rate', e.target.value)}
                  required
                />
                <TextField
                  fullWidth
                  size="small"
                  type="number"
                  label="Amount (₹)"
                  value={item.amount}
                  onChange={(e) => handleItemChange(idx, 'amount', e.target.value)}
                  required
                />
                <IconButton
                  color="error"
                  size="small"
                  onClick={() => handleRemoveItem(idx)}
                  disabled={formData.items.length <= 1}
                  title="Remove Item"
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Box>
            ))}

            {/* Payment Receive Details Section */}
            <Box
              sx={{
                my: 2.5,
                p: 2,
                bgcolor: mode === 'dark' ? 'rgba(30, 41, 59, 0.7)' : '#f0f9ff',
                border: `1px solid ${mode === 'dark' ? '#334155' : '#bae6fd'}`,
                borderRadius: '16px',
              }}
            >
              <Typography
                variant="subtitle2"
                sx={{
                  fontWeight: 800,
                  color: mode === 'dark' ? '#38bdf8' : '#0284c7',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  mb: 1.5,
                  fontSize: '0.88rem',
                }}
              >
                💳 Payment Details (ચુકવણીની સ્થિતિ અને રકમ વિગત)
              </Typography>

              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1.1fr 1.1fr 1fr 1.2fr' },
                  gap: 1.5,
                }}
              >
                {/* Payment Status (ચુકવણી સ્થિતિ) */}
                <TextField
                  select
                  fullWidth
                  size="small"
                  label="Payment Status (ચુકવણી સ્થિતિ)"
                  value={
                    Number(formData.paidAmount) > 0 || (Number(formData.paidAmount) >= gstCalcs.totalAmount && gstCalcs.totalAmount > 0)
                      ? 'Paid'
                      : 'Pending'
                  }
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === 'Paid') {
                      setFormData({ ...formData, paidAmount: gstCalcs.totalAmount > 0 ? gstCalcs.totalAmount : (formData.paidAmount || 0) });
                    } else if (val === 'Pending') {
                      setFormData({ ...formData, paidAmount: 0 });
                    }
                  }}
                  slotProps={{
                    input: {
                      sx: {
                        borderRadius: '12px',
                        bgcolor: mode === 'dark' ? '#0f172a' : '#ffffff',
                        fontWeight: 600,
                      },
                    },
                  }}
                >
                  <MenuItem value="Paid">Paid (જમા)</MenuItem>
                  <MenuItem value="Pending">Pending (બાકી)</MenuItem>
                </TextField>

                {/* Payment Mode (ચુકવણી પ્રકાર) */}
                <TextField
                  select
                  fullWidth
                  size="small"
                  label="Payment Mode (ચુકવણી પ્રકાર)"
                  value={formData.paymentMethod || 'રોકડ કેશ'}
                  onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                  slotProps={{
                    input: {
                      sx: {
                        borderRadius: '12px',
                        bgcolor: mode === 'dark' ? '#0f172a' : '#ffffff',
                        fontWeight: 600,
                      },
                    },
                  }}
                >
                  <MenuItem value="રોકડ કેશ">💵 Cash (રોકડ)</MenuItem>
                  <MenuItem value="ચેક બેંક">🏦 Cheque / Bank (ચેક / બેંક)</MenuItem>
                  <MenuItem value="ઓનલાઇન UPI">📱 UPI / Online (યુપીઆઈ)</MenuItem>
                  <MenuItem value="અન્ય">💳 Other (અન્ય)</MenuItem>
                </TextField>

                {/* Amount Paid / Received (ચુકવેલ રકમ ₹) */}
                <TextField
                  fullWidth
                  size="small"
                  type="number"
                  label="Amount Paid (ચુકવેલ રકમ ₹)"
                  value={formData.paidAmount}
                  onChange={(e) => setFormData({ ...formData, paidAmount: e.target.value })}
                  slotProps={{
                    input: {
                      sx: {
                        borderRadius: '12px',
                        bgcolor: mode === 'dark' ? '#0f172a' : '#ffffff',
                        fontWeight: 700,
                      },
                    },
                  }}
                />

                {/* Payment Date (ચુકવણી તારીખ) */}
                <TextField
                  fullWidth
                  size="small"
                  type="date"
                  label="Payment Date (ચુકવણી તા.)"
                  value={formData.paymentDate}
                  onChange={(e) => setFormData({ ...formData, paymentDate: e.target.value })}
                  slotProps={{
                    inputLabel: { shrink: true },
                    input: {
                      sx: {
                        borderRadius: '12px',
                        bgcolor: mode === 'dark' ? '#0f172a' : '#ffffff',
                        fontWeight: 600,
                      },
                    },
                  }}
                />
              </Box>

              {/* Cheque / Reference Field */}
              <Box sx={{ mt: 1.5 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Cheque No / Ref (ચેક નંબર / માહિતી)"
                  placeholder="e.g. Cheque #492015 / UTR Ref..."
                  value={formData.chequeNo}
                  onChange={(e) => setFormData({ ...formData, chequeNo: e.target.value })}
                  slotProps={{
                    input: {
                      sx: {
                        borderRadius: '12px',
                        bgcolor: mode === 'dark' ? '#0f172a' : '#ffffff',
                      },
                    },
                  }}
                />
              </Box>
            </Box>
            <TextField
              fullWidth
              label="Notes / Description"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              sx={{ mb: 2 }}
            />

            <Box sx={{ p: 2, bgcolor: '#f1f5f9', borderRadius: 2 }}>
              <Typography variant="body2">Subtotal: <strong>{formatRupees(gstCalcs.subtotal)}</strong></Typography>
              {taxEnabled && (
                <>
                  <Typography variant="body2">CGST (2.5%): <strong>{formatRupees(gstCalcs.cgst)}</strong></Typography>
                  <Typography variant="body2">SGST (2.5%): <strong>{formatRupees(gstCalcs.sgst)}</strong></Typography>
                </>
              )}
              <Typography variant="subtitle1" sx={{ fontWeight: 800, color: 'primary.main', mt: 0.5 }}>
                Total Bill Amount: {formatRupees(gstCalcs.totalAmount)}
              </Typography>
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 2.5 }}>
            <Button onClick={() => setFormOpen(false)} variant="outlined">Cancel</Button>
            <Button type="submit" variant="contained" color="primary" sx={{ fontWeight: 700 }}>Save Record</Button>
          </DialogActions>
        </Box>
      </Dialog>

      <ConfirmationDialog
        open={deleteOpen}
        title="Delete Purchase Record?"
        message="Are you sure you want to delete this purchase entry?"
        onConfirm={handleDeleteConfirm}
        onClose={() => setDeleteOpen(false)}
      />

      {/* View Purchase Details Dialog */}
      <Dialog open={viewOpen} onClose={() => setViewOpen(false)} maxWidth="md" fullWidth>
        {purchaseToView && (
          <>
            <DialogTitle sx={{ fontWeight: 800, bgcolor: 'primary.main', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 800, lineHeight: 1.2 }}>
                  {language === 'gu' ? 'ખરીદી પાવતી વિગતો (Purchase Details)' : 'Purchase Voucher Details'}
                </Typography>
                <Typography variant="caption" sx={{ opacity: 0.9 }}>
                  Voucher No: #{purchaseToView.purchaseNo} | Date: {formatDate(purchaseToView.date)}
                </Typography>
              </Box>
              <Chip
                label={(purchaseToView.status === 'Paid' || (purchaseToView.status as string) === 'Received' || (purchaseToView.paidAmount && purchaseToView.paidAmount > 0)) ? (language === 'gu' ? 'જમા' : 'Paid') : (language === 'gu' ? 'બાકી' : 'Pending')}
                color={(purchaseToView.status === 'Paid' || (purchaseToView.status as string) === 'Received' || (purchaseToView.paidAmount && purchaseToView.paidAmount > 0)) ? 'success' : 'error'}
                sx={{ fontWeight: 800, color: '#fff' }}
              />
            </DialogTitle>

            <DialogContent sx={{ p: 3, pt: '24px !important' }}>
              {/* Supplier Info */}
              <Box sx={{ p: 2, bgcolor: mode === 'dark' ? '#1e293b' : '#f8fafc', borderRadius: 2, border: `1px solid ${mode === 'dark' ? '#334155' : '#e2e8f0'}`, mb: 3, mt: 1 }}>
                <Typography variant="caption" sx={{ color: mode === 'dark' ? '#94a3b8' : '#64748b', textTransform: 'uppercase', fontWeight: 700, letterSpacing: 0.5 }}>
                  Supplier / Party Information
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 800, color: mode === 'dark' ? '#f8fafc' : '#0f172a', mt: 0.5 }}>
                  {purchaseToView.supplierName}
                </Typography>
                {purchaseToView.supplierGstin && (
                  <Typography variant="body2" sx={{ color: mode === 'dark' ? '#cbd5e1' : '#475569', fontWeight: 600 }}>
                    GSTIN: {purchaseToView.supplierGstin}
                  </Typography>
                )}
              </Box>

              {/* Items Table */}
              <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0f172a', mb: 1 }}>
                {language === 'gu' ? 'મટીરીયલ વિગતો (Items List)' : 'Purchased Items List'}
              </Typography>
              <TableContainer sx={{ border: '1px solid #e2e8f0', borderRadius: 2, mb: 3 }}>
                <Table size="small">
                  <TableHead sx={{ bgcolor: '#f1f5f9' }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 800 }}>#</TableCell>
                      <TableCell sx={{ fontWeight: 800 }}>Challan Date</TableCell>
                      <TableCell sx={{ fontWeight: 800 }}>Challan No.</TableCell>
                      <TableCell sx={{ fontWeight: 800 }}>Material Name</TableCell>
                      <TableCell sx={{ fontWeight: 800 }} align="right">Qty</TableCell>
                      <TableCell sx={{ fontWeight: 800 }}>Unit</TableCell>
                      <TableCell sx={{ fontWeight: 800 }} align="right">Rate (₹)</TableCell>
                      <TableCell sx={{ fontWeight: 800 }} align="right">Amount (₹)</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {((purchaseToView.items && purchaseToView.items.length > 0)
                      ? purchaseToView.items
                      : [
                          {
                            challanDate: purchaseToView.date,
                            challanNo: purchaseToView.purchaseNo,
                            description: purchaseToView.materialName || 'Material',
                            quantity: 1,
                            unit: 'કોન',
                            rate: purchaseToView.subtotal,
                            amount: purchaseToView.subtotal,
                          },
                        ]
                    ).map((item, i) => (
                      <TableRow key={i} hover>
                        <TableCell sx={{ fontWeight: 600 }}>{i + 1}</TableCell>
                        <TableCell sx={{ fontSize: '0.82rem', whiteSpace: 'nowrap' }}>{formatDate(item.challanDate || purchaseToView.date)}</TableCell>
                        <TableCell sx={{ fontWeight: 800, color: '#dc2626' }}>{item.challanNo || purchaseToView.purchaseNo}</TableCell>
                        <TableCell sx={{ fontWeight: 700, color: '#1e293b' }}>{item.description || '-'}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600 }}>{item.quantity}</TableCell>
                        <TableCell sx={{ fontWeight: 600, color: '#64748b' }}>{item.unit || '-'}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600 }}>₹{item.rate}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700 }}>{formatRupees(item.amount)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              {/* Calculation Breakdown & Notes */}
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1.2fr 1fr' }, gap: 2 }}>
                <Box sx={{ p: 2, bgcolor: '#f8fafc', borderRadius: 2, border: '1px solid #e2e8f0' }}>
                  <Typography variant="caption" sx={{ color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>
                    Notes / Description
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 0.5, color: '#334155', fontWeight: 500 }}>
                    {purchaseToView.notes || 'No notes added for this purchase.'}
                  </Typography>
                </Box>

                <Box sx={{ p: 2, bgcolor: '#f1f5f9', borderRadius: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="body2" color="text.secondary">Subtotal:</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>{formatRupees(purchaseToView.subtotal)}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="body2" color="text.secondary">CGST (2.5%):</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{formatRupees(purchaseToView.cgst || 0)}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="body2" color="text.secondary">SGST (2.5%):</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{formatRupees(purchaseToView.sgst || 0)}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', pt: 1, borderTop: '1px solid #cbd5e1', mb: 1 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'primary.main' }}>Total Amount:</Typography>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'primary.main' }}>{formatRupees(purchaseToView.totalAmount)}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" sx={{ color: 'success.main', fontWeight: 700 }}>Paid Amount:</Typography>
                    <Typography variant="body2" sx={{ color: 'success.main', fontWeight: 700 }}>{formatRupees(purchaseToView.paidAmount)}</Typography>
                  </Box>
                </Box>
              </Box>
            </DialogContent>

            <DialogActions sx={{ p: 2.5, justifyContent: 'space-between' }}>
              <Button
                variant="outlined"
                startIcon={<PrintIcon />}
                onClick={() => window.print()}
                sx={{ fontWeight: 700 }}
              >
                Print / Print Voucher
              </Button>
              <Button variant="contained" onClick={() => setViewOpen(false)} sx={{ fontWeight: 700 }}>
                Close
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};
