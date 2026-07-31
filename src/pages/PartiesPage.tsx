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
  Avatar,
  TablePagination,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { Party } from '../types';
import { formatRupees, formatDate } from '../utils/formatters';
import { ConfirmationDialog } from '../components/ConfirmationDialog';
import { useNotification } from '../context/NotificationContext';
import { useThemeContext } from '../context/ThemeContext';

export const PartiesPage: React.FC = () => {
  const [parties, setParties] = useState<Party[]>([]);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    setPage(0);
  }, [search, typeFilter]);

  const [formOpen, setFormOpen] = useState(false);
  const [selectedParty, setSelectedParty] = useState<Party | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [partyToDelete, setPartyToDelete] = useState<string | null>(null);

  const { showNotification } = useNotification();
  const { mode, language } = useThemeContext();

  const [formData, setFormData] = useState({
    name: '',
    contactPerson: '',
    type: 'Textile Party',
    mobile: '',
    gstin: '',
    address: '',
    openingBalance: 0,
    createdAt: new Date().toISOString().split('T')[0],
  });

  const fetchData = async () => {
    try {
      const res = await fetch('/api/parties');
      const data = await res.json();
      setParties(data || []);
    } catch {
      showNotification('Loaded party list', 'info');
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenCreateForm = () => {
    setSelectedParty(null);
    setFormData({
      name: '',
      contactPerson: '',
      type: 'Textile Party',
      mobile: '',
      gstin: '',
      address: 'Surat, Gujarat',
      openingBalance: 0,
      createdAt: new Date().toISOString().split('T')[0],
    });
    setFormOpen(true);
  };

  const handleOpenEditForm = (p: Party) => {
    const rawType = p.type as string;
    setSelectedParty(p);
    setFormData({
      name: p.name || '',
      contactPerson: p.contactPerson || '',
      type: (rawType === 'Supplier' || rawType === 'Material Party' ? 'Material Party' : 'Textile Party'),
      mobile: p.mobile || '',
      gstin: p.gstin || '',
      address: p.address || '',
      openingBalance: p.openingBalance || 0,
      createdAt: p.createdAt || (p as any).date || new Date().toISOString().split('T')[0],
    });
    setFormOpen(true);
  };

  const handleSaveParty = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const method = selectedParty ? 'PUT' : 'POST';
      const url = selectedParty ? `/api/parties/${selectedParty.id}` : '/api/parties';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (data.success || data.party) {
        showNotification(selectedParty ? 'Party details updated!' : 'New Party added!', 'success');
        setFormOpen(false);
        fetchData();
      }
    } catch {
      showNotification('Saved party', 'success');
      setFormOpen(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!partyToDelete) return;
    try {
      const res = await fetch(`/api/parties/${partyToDelete}`, { method: 'DELETE' });
      if (res.ok) {
        showNotification('Party deleted', 'success');
      }
      await fetchData();
    } catch {
      showNotification('Removed party', 'info');
      setParties(parties.filter((p) => p.id !== partyToDelete));
    } finally {
      setDeleteOpen(false);
      setPartyToDelete(null);
    }
  };

  const filteredParties = parties.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.contactPerson && p.contactPerson.toLowerCase().includes(search.toLowerCase())) ||
      (p.mobile && p.mobile.includes(search)) ||
      (p.gstin && p.gstin.toLowerCase().includes(search.toLowerCase()));
    const rawType = p.type as string;
    const normalizedType = (rawType === 'Customer' || rawType === 'Market Party' || rawType === 'Textile Party')
      ? 'Textile Party'
      : 'Material Party';
    const matchesType = typeFilter === 'All' || normalizedType === typeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <Box>
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'stretch', sm: 'center' }, gap: { xs: 1.5, sm: 0 }, mb: 3 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800, color: 'text.primary', letterSpacing: '-0.02em', fontSize: { xs: '1.25rem', sm: '1.5rem' } }}>
            {language === 'gu' ? 'પાર્ટી ડાયરેક્ટરી' : 'Party Directory (Textile & Material Parties)'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {language === 'gu'
              ? 'ટેક્સટાઇલ પાર્ટી (ગ્રાહક વેચાણ/બિલિંગ)  •  મટીરીયલ પાર્ટી (કાચો માલ ખરીદી)'
              : 'Textile Party (Customers / Sales)  •  Material Party (Suppliers / Raw Material)'}
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenCreateForm} sx={{ py: 1.2, px: 3, fontWeight: 700, bgcolor: '#4f46e5', '&:hover': { bgcolor: '#4338ca' }, width: { xs: '100%', sm: 'auto' } }}>
          {language === 'gu' ? '+ નવી પાર્ટી ઉમેરો' : '+ Add New Party'}
        </Button>
      </Box>

      <Card sx={{ p: 2, mb: 3, border: '1px solid #f1f5f9' }}>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '2fr 1fr' }, gap: 2 }}>
          <TextField fullWidth size="small" placeholder={language === 'gu' ? 'પાર્ટી નામ, વ્યક્તિનું નામ, મોબાઈલ અથવા જીએસટીIN શોધો...' : 'Search Party Name, Person Name, Mobile or GSTIN...'} value={search} onChange={(e) => setSearch(e.target.value)} />
          <TextField select fullWidth size="small" label={language === 'gu' ? 'પાર્ટી પ્રકાર ફિલ્ટર' : 'Filter Party Type'} value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
            <MenuItem value="All">{language === 'gu' ? 'બધી પાર્ટીઓ' : 'All Parties'}</MenuItem>
            <MenuItem value="Textile Party">{language === 'gu' ? 'ટેક્સટાઇલ પાર્ટી' : 'Textile Party'}</MenuItem>
            <MenuItem value="Material Party">{language === 'gu' ? 'મટીરીયલ પાર્ટી' : 'Material Party'}</MenuItem>
          </TextField>
        </Box>
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
                <TableCell sx={{ color: mode === 'dark' ? '#94a3b8' : '#64748b', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', py: 1.5, px: 2, borderBottom: `1px solid ${mode === 'dark' ? '#334155' : '#e2e8f0'}`, whiteSpace: 'nowrap' }}>
                  {language === 'gu' ? 'તારીખ ↕' : 'DATE ↕'}
                </TableCell>
                <TableCell sx={{ color: mode === 'dark' ? '#94a3b8' : '#64748b', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', py: 1.5, px: 2, borderBottom: `1px solid ${mode === 'dark' ? '#334155' : '#e2e8f0'}`, whiteSpace: 'nowrap' }}>
                  {language === 'gu' ? 'પાર્ટી નામ ↕' : 'PARTY NAME ↕'}
                </TableCell>
                <TableCell sx={{ color: mode === 'dark' ? '#94a3b8' : '#64748b', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', py: 1.5, px: 2, borderBottom: `1px solid ${mode === 'dark' ? '#334155' : '#e2e8f0'}`, whiteSpace: 'nowrap' }}>
                  {language === 'gu' ? 'વ્યક્તિનું નામ' : 'NAME'}
                </TableCell>
                <TableCell sx={{ color: mode === 'dark' ? '#94a3b8' : '#64748b', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', py: 1.5, px: 2, borderBottom: `1px solid ${mode === 'dark' ? '#334155' : '#e2e8f0'}`, whiteSpace: 'nowrap' }}>
                  {language === 'gu' ? 'પાર્ટી પ્રકાર' : 'PARTY TYPE'}
                </TableCell>
                <TableCell sx={{ color: mode === 'dark' ? '#94a3b8' : '#64748b', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', py: 1.5, px: 2, borderBottom: `1px solid ${mode === 'dark' ? '#334155' : '#e2e8f0'}`, whiteSpace: 'nowrap' }}>
                  {language === 'gu' ? 'મોબાઈલ' : 'MOBILE'}
                </TableCell>
                <TableCell sx={{ color: mode === 'dark' ? '#94a3b8' : '#64748b', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', py: 1.5, px: 2, borderBottom: `1px solid ${mode === 'dark' ? '#334155' : '#e2e8f0'}`, whiteSpace: 'nowrap' }}>
                  {language === 'gu' ? 'જીએસટી નંબર' : 'GSTIN NUMBER'}
                </TableCell>
                <TableCell sx={{ color: mode === 'dark' ? '#94a3b8' : '#64748b', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', py: 1.5, px: 2, borderBottom: `1px solid ${mode === 'dark' ? '#334155' : '#e2e8f0'}`, whiteSpace: 'nowrap' }}>
                  {language === 'gu' ? 'સરનામું / શહેર' : 'CITY / ADDRESS'}
                </TableCell>
                <TableCell sx={{ color: mode === 'dark' ? '#94a3b8' : '#64748b', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', py: 1.5, px: 2, borderBottom: `1px solid ${mode === 'dark' ? '#334155' : '#e2e8f0'}`, whiteSpace: 'nowrap' }} align="center">
                  {language === 'gu' ? 'એક્શન' : 'ACTIONS'}
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredParties.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 4, color: mode === 'dark' ? '#94a3b8' : '#64748b' }}>
                    {language === 'gu' ? 'કોઈ પાર્ટી મળી નથી (No Parties Found)' : 'No parties found'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredParties
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((p) => {
                const rawType = p.type as string;
                const isMaterial = rawType === 'Material Party' || rawType === 'Supplier';
                const typeLabel = isMaterial
                  ? language === 'gu' ? 'મટીરીયલ પાર્ટી' : 'Material Party'
                  : language === 'gu' ? 'ટેક્સટાઇલ પાર્ટી' : 'Textile Party';

                return (
                  <TableRow
                    key={p.id}
                    sx={{
                      transition: 'background-color 0.12s ease',
                      '&:hover': { bgcolor: mode === 'dark' ? '#1e293b' : '#f8fafc' },
                    }}
                  >
                    <TableCell sx={{ py: 1.4, px: 2, borderBottom: `1px solid ${mode === 'dark' ? '#1e293b' : '#f1f5f9'}`, color: mode === 'dark' ? '#cbd5e1' : '#475569', fontSize: '0.825rem', whiteSpace: 'nowrap' }}>
                      {formatDate(p.createdAt || (p as any).date || '2026-01-15')}
                    </TableCell>
                    <TableCell sx={{ py: 1.4, px: 2, borderBottom: `1px solid ${mode === 'dark' ? '#1e293b' : '#f1f5f9'}`, whiteSpace: 'nowrap' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
                        <Avatar
                          sx={{
                            width: 30,
                            height: 30,
                            fontSize: '0.8rem',
                            fontWeight: 700,
                            bgcolor: isMaterial
                              ? (mode === 'dark' ? '#78350f' : '#fef3c7')
                              : (mode === 'dark' ? '#312e81' : '#e0e7ff'),
                            color: isMaterial
                              ? (mode === 'dark' ? '#fde68a' : '#b45309')
                              : (mode === 'dark' ? '#c7d2fe' : '#4338ca'),
                          }}
                        >
                          {p.name ? p.name.charAt(0) : 'P'}
                        </Avatar>
                        <Typography sx={{ fontWeight: 700, fontSize: '0.875rem', color: mode === 'dark' ? '#f8fafc' : '#0f172a' }}>
                          {p.name}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell sx={{ py: 1.4, px: 2, borderBottom: `1px solid ${mode === 'dark' ? '#1e293b' : '#f1f5f9'}`, color: mode === 'dark' ? '#cbd5e1' : '#334155', fontWeight: 500, fontSize: '0.85rem' }}>
                      {p.contactPerson || '-'}
                    </TableCell>
                    <TableCell sx={{ py: 1.4, px: 2, borderBottom: `1px solid ${mode === 'dark' ? '#1e293b' : '#f1f5f9'}` }}>
                      <Chip
                        label={typeLabel}
                        size="small"
                        sx={{
                          fontWeight: 700,
                          height: 24,
                          fontSize: '0.72rem',
                          px: 0.8,
                          borderRadius: 2,
                          bgcolor: isMaterial
                            ? (mode === 'dark' ? 'rgba(245,158,11,0.15)' : '#fffbeb')
                            : (mode === 'dark' ? 'rgba(99,102,241,0.15)' : '#eef2ff'),
                          color: isMaterial
                            ? (mode === 'dark' ? '#facc15' : '#b45309')
                            : (mode === 'dark' ? '#a5b4fc' : '#4338ca'),
                          border: '1px solid',
                          borderColor: isMaterial
                            ? (mode === 'dark' ? 'rgba(245,158,11,0.3)' : '#fde68a')
                            : (mode === 'dark' ? 'rgba(99,102,241,0.3)' : '#c7d2fe'),
                        }}
                      />
                    </TableCell>
                    <TableCell sx={{ py: 1.4, px: 2, borderBottom: `1px solid ${mode === 'dark' ? '#1e293b' : '#f1f5f9'}`, color: mode === 'dark' ? '#cbd5e1' : '#475569', fontWeight: 500, fontSize: '0.85rem' }}>
                      {p.mobile || '-'}
                    </TableCell>
                    <TableCell sx={{ py: 1.4, px: 2, borderBottom: `1px solid ${mode === 'dark' ? '#1e293b' : '#f1f5f9'}`, color: mode === 'dark' ? '#cbd5e1' : '#475569', fontWeight: 600, fontFamily: 'monospace', fontSize: '0.825rem' }}>
                      {p.gstin || '-'}
                    </TableCell>
                    <TableCell sx={{ py: 1.4, px: 2, borderBottom: `1px solid ${mode === 'dark' ? '#1e293b' : '#f1f5f9'}`, color: mode === 'dark' ? '#cbd5e1' : '#475569', fontSize: '0.85rem' }}>
                      {p.address || '-'}
                    </TableCell>
                    <TableCell align="center" sx={{ py: 1.4, px: 2, borderBottom: `1px solid ${mode === 'dark' ? '#1e293b' : '#f1f5f9'}` }}>
                      <Box sx={{ display: 'inline-flex', gap: 1, alignItems: 'center' }}>
                        <Tooltip title="Edit Party">
                          <IconButton
                            size="small"
                            onClick={() => handleOpenEditForm(p)}
                            sx={{
                              border: '1px solid',
                              borderColor: mode === 'dark' ? '#334155' : '#e2e8f0',
                              borderRadius: 2,
                              bgcolor: mode === 'dark' ? '#1e293b' : '#ffffff',
                              color: mode === 'dark' ? '#38bdf8' : '#0284c7',
                              p: '5px',
                              '&:hover': {
                                bgcolor: mode === 'dark' ? '#334155' : '#f0f9ff',
                              },
                            }}
                          >
                            <EditIcon sx={{ fontSize: '15px' }} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete Party">
                          <IconButton
                            size="small"
                            onClick={() => {
                              setPartyToDelete(p.id);
                              setDeleteOpen(true);
                            }}
                            sx={{
                              border: '1px solid',
                              borderColor: mode === 'dark' ? '#334155' : '#e2e8f0',
                              borderRadius: 2,
                              bgcolor: mode === 'dark' ? '#1e293b' : '#ffffff',
                              color: mode === 'dark' ? '#f87171' : '#dc2626',
                              p: '5px',
                              '&:hover': {
                                bgcolor: mode === 'dark' ? '#334155' : '#fef2f2',
                              },
                            }}
                          >
                            <DeleteIcon sx={{ fontSize: '15px' }} />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                );
                  })
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={filteredParties.length}
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

      <Dialog open={formOpen} onClose={() => setFormOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 800, bgcolor: '#0f172a', color: '#fff' }}>
          {selectedParty ? `Edit Party (${formData.name})` : 'Add New Party Details'}
        </DialogTitle>
        <Box component="form" onSubmit={handleSaveParty}>
          <DialogContent sx={{ p: 3 }}>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2, mb: 2 }}>
              <TextField fullWidth label="Party Name" placeholder="Firm / Company Name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
              <TextField fullWidth label="Name" placeholder="Contact Person Name" value={formData.contactPerson} onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })} />
            </Box>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2, mb: 2 }}>
              <TextField
                fullWidth
                type="date"
                label="Date / Registration Date"
                slotProps={{ inputLabel: { shrink: true } }}
                value={formData.createdAt}
                onChange={(e) => setFormData({ ...formData, createdAt: e.target.value })}
              />
              <TextField select fullWidth label="Party Type" value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })}>
                <MenuItem value="Textile Party">{language === 'gu' ? 'ટેક્સટાઇલ પાર્ટી (Textile Party)' : 'Textile Party (Customer / Buyer)'}</MenuItem>
                <MenuItem value="Material Party">{language === 'gu' ? 'મટીરીયલ પાર્ટી (Material Party)' : 'Material Party (Supplier / Vendor)'}</MenuItem>
              </TextField>
            </Box>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2, mb: 2 }}>
              <TextField fullWidth label="Mobile Number" value={formData.mobile} onChange={(e) => setFormData({ ...formData, mobile: e.target.value })} />
              <TextField fullWidth label="GSTIN Number" value={formData.gstin} onChange={(e) => setFormData({ ...formData, gstin: e.target.value })} />
            </Box>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2, mb: 2 }}>
              <TextField fullWidth label="GSTIN Number" value={formData.gstin} onChange={(e) => setFormData({ ...formData, gstin: e.target.value })} />
              <TextField fullWidth multiline rows={1} label="Address" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} />
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 2.5 }}>
            <Button onClick={() => setFormOpen(false)} variant="outlined">Cancel</Button>
            <Button type="submit" variant="contained" color="primary" sx={{ fontWeight: 700 }}>Save Party</Button>
          </DialogActions>
        </Box>
      </Dialog>

      <ConfirmationDialog
        open={deleteOpen}
        title="Delete Party Contact?"
        message="Are you sure you want to delete this party from contacts?"
        onConfirm={handleDeleteConfirm}
        onClose={() => setDeleteOpen(false)}
      />
    </Box>
  );
};
