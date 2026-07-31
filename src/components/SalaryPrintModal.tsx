import React, { useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Paper,
  Divider,
} from '@mui/material';
import { Print as PrintIcon, PictureAsPdf as PdfIcon, Close as CloseIcon } from '@mui/icons-material';
import { Worker, CompanySettings } from '../types';
import { formatRupees, formatDate } from '../utils/formatters';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface SalaryPrintModalProps {
  open: boolean;
  onClose: () => void;
  worker: Worker | null;
  settings: CompanySettings;
}

export const SalaryPrintModal: React.FC<SalaryPrintModalProps> = ({
  open,
  onClose,
  worker,
  settings,
}) => {
  const printRef = useRef<HTMLDivElement>(null);

  if (!worker) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = async () => {
    if (!printRef.current) return;
    try {
      const element = printRef.current;
      const canvas = await html2canvas(element, {
        scale: 3,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      });
      const imgData = canvas.toDataURL('image/jpeg', 0.98);
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Salary_Slip_${worker.name.replace(/\s+/g, '_')}.pdf`);
    } catch (e) {
      console.error('Error creating Salary PDF:', e);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogActions sx={{ p: { xs: 1.5, sm: 2 }, flexDirection: { xs: 'column-reverse', sm: 'row' }, gap: { xs: 1, sm: 0 }, justifyContent: 'space-between', bgcolor: 'background.paper', borderBottom: '1px solid #e2e8f0' }}>
        <Box sx={{ display: 'flex', gap: 1, width: { xs: '100%', sm: 'auto' } }}>
          <Button variant="contained" color="primary" startIcon={<PrintIcon />} onClick={handlePrint} sx={{ flex: 1 }}>
            Print Salary Slip
          </Button>
          <Button variant="outlined" color="secondary" startIcon={<PdfIcon />} onClick={handleDownloadPdf} sx={{ flex: 1 }}>
            PDF Slip
          </Button>
        </Box>
        <Button onClick={onClose} color="inherit" startIcon={<CloseIcon />} sx={{ width: { xs: '100%', sm: 'auto' } }}>
          Close
        </Button>
      </DialogActions>

      <DialogContent sx={{ p: { xs: 1.5, sm: 3 }, bgcolor: '#ffffff', color: '#1a202c' }}>
        <Paper ref={printRef} id="printable-salary-slip" elevation={0} sx={{ p: 3, border: '1px solid #cbd5e1', borderRadius: 2 }}>
          <Typography variant="h5" align="center" sx={{ fontWeight: 800, color: '#1a365d' }}>
            {settings.companyName || 'FENI CREATION'}
          </Typography>
          <Typography variant="subtitle2" align="center" sx={{ color: '#475569', mb: 2 }}>
            KARIGAR PAGAR PATRAK (કારીગર પગાર પત્રક)
          </Typography>

          <Divider sx={{ mb: 2 }} />

          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 2 }}>
            <Box>
              <Typography variant="body2" color="text.secondary">Worker Name / કારીગરનું નામ:</Typography>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>{worker.name}</Typography>
              {worker.gujaratiName && (
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#1a365d' }}>
                  {worker.gujaratiName}
                </Typography>
              )}
            </Box>

            <Box>
              <Typography variant="body2" color="text.secondary">Role / કામગીરી:</Typography>
              <Typography variant="body1" sx={{ fontWeight: 600 }}>{worker.role}</Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                Mobile: {worker.mobile} | Days: <strong>{worker.days ?? 30} days</strong>
              </Typography>
            </Box>
          </Box>

          <Table sx={{ border: '1px solid #cbd5e1', my: 2 }}>
            <TableHead sx={{ bgcolor: '#1a365d' }}>
              <TableRow>
                <TableCell sx={{ color: '#fff', fontWeight: 700 }}>Salary Component (વિગત)</TableCell>
                <TableCell sx={{ color: '#fff', fontWeight: 700, textAlign: 'right' }}>Amount (₹)</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              <TableRow>
                <TableCell>Monthly Base Salary (માસિક મૂળ પગાર)</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600 }}>{formatRupees(worker.monthlySalary)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Bonus (+) (બોનસ)</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600, color: '#166534' }}>+{formatRupees(worker.bonus)}</TableCell>
              </TableRow>
              <TableRow sx={{ bgcolor: '#f8fafc' }}>
                <TableCell sx={{ fontWeight: 700 }}>Total Gross Payable</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>{formatRupees(worker.monthlySalary + worker.bonus)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ color: '#c53030' }}>
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: '#c53030' }}>
                      Advance Paid / Upad (-) (ઉપાડ)
                    </Typography>
                    {worker.advances && worker.advances.length > 0 && (
                      <Box sx={{ mt: 0.8, pl: 1, borderLeft: '2px solid #fca5a5' }}>
                        <Typography variant="caption" sx={{ fontWeight: 700, color: '#991b1b', display: 'block', mb: 0.3 }}>
                          Upad History (ઉપાડની તારીખવાર વિગત):
                        </Typography>
                        {worker.advances.map((adv, idx) => (
                          <Typography key={adv.id || idx} variant="caption" sx={{ display: 'block', color: '#7f1d1d', fontSize: '0.75rem' }}>
                            • {formatDate(adv.date)}: <strong>{formatRupees(adv.amount)}</strong> {adv.notes ? `(${adv.notes})` : ''}
                          </Typography>
                        ))}
                      </Box>
                    )}
                  </Box>
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 700, color: '#c53030', verticalAlign: 'top' }}>
                  -{formatRupees(worker.advancePaid)}
                </TableCell>
              </TableRow>
              {(worker.paidSalaryAmount ?? 0) > 0 && (
                <TableRow>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: '#0284c7' }}>
                      Paid Salary Amount (-) (ચૂકવેલ પગાર)
                    </Typography>
                    {worker.paymentMethod && (
                      <Typography variant="caption" sx={{ color: '#64748b', display: 'block' }}>
                        Mode: {worker.paymentMethod}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, color: '#0284c7' }}>
                    -{formatRupees(worker.paidSalaryAmount || 0)}
                  </TableCell>
                </TableRow>
              )}
              <TableRow sx={{ bgcolor: '#f1f5f9' }}>
                <TableCell sx={{ fontWeight: 800, fontSize: '1rem', color: '#1a365d' }}>
                  Net Remaining Salary (બાકી ચૂકવવાનો પગાર)
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 800, fontSize: '1.1rem', color: '#1a365d' }}>
                  {formatRupees(worker.remainingSalary)}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>

          <Box sx={{ mt: 5, display: 'flex', justifyContent: 'space-between' }}>
            <Box sx={{ textAlign: 'center' }}>
              <Box sx={{ height: 30 }} />
              <Typography variant="caption" sx={{ borderTop: '1px solid #94a3b8', pt: 0.5, px: 2 }}>
                Worker Signature (કારીગર સહી)
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'center' }}>
              <Box sx={{ height: 30 }} />
              <Typography variant="caption" sx={{ borderTop: '1px solid #94a3b8', pt: 0.5, px: 2 }}>
                For FENI CREATION
              </Typography>
            </Box>
          </Box>
        </Paper>
      </DialogContent>
    </Dialog>
  );
};

