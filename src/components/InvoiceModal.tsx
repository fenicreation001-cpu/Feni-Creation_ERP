import React, { useRef, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogActions,
  Button,
  Box,
  ToggleButtonGroup,
  ToggleButton,
  Typography,
} from '@mui/material';
import {
  Print as PrintIcon,
  PictureAsPdf as PdfIcon,
  Close as CloseIcon,
  Style as StyleIcon,
  WhatsApp as WhatsAppIcon,
} from '@mui/icons-material';
import { Bill, CompanySettings } from '../types';
import { formatDate, numberToWords } from '../utils/formatters';
import html2pdf from 'html2pdf.js';

interface InvoiceModalProps {
  open: boolean;
  onClose: () => void;
  bill: Bill | null;
  settings: CompanySettings;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({
  open,
  onClose,
  bill,
  settings,
}) => {
  const printRef = useRef<HTMLDivElement>(null);
  const [template, setTemplate] = useState<'freight' | 'classic'>('freight');

  if (!bill) return null;

  const handlePrint = () => {
    window.print();
  };

  // Calculate totals
  const items = bill.items || [];
  const totalQty = items.reduce((acc, item) => acc + (Number(item.quantity) || 0), 0);
  
  // Calculate exact subtotal from items
  const calculatedSubtotal = items.reduce((acc, item) => acc + (Number(item.amount) || 0), 0);
  const subtotal = calculatedSubtotal > 0 ? calculatedSubtotal : (bill.subtotal || 0);

  const discountPercent = (bill as any).discount || 0;
  const discountAmount = subtotal * (discountPercent / 100);
  const amountAfterDiscount = subtotal - discountAmount;

  // Calculate 2.5% CGST + 2.5% SGST (Total 5%)
  const cgst = Number((amountAfterDiscount * 0.025).toFixed(2));
  const sgst = Number((amountAfterDiscount * 0.025).toFixed(2));
  const totalTax = Number((cgst + sgst).toFixed(2));
  const extraCharges = Number(bill.extraCharges || 0);

  // Exact Tax Invoice Total
  const totalAmount = bill.totalAmount !== undefined && bill.totalAmount > 0 
    ? bill.totalAmount 
    : Number((amountAfterDiscount + totalTax - extraCharges).toFixed(2));

  // Minimum rows for clean paper structure
  const minRows = 8;
  const emptyRowsCount = Math.max(0, minRows - items.length);

  const handleDownloadPdf = async () => {
    if (!printRef.current) return;
    let cloneContainer: HTMLDivElement | null = null;
    try {
      if (document.fonts && document.fonts.ready) {
        await document.fonts.ready;
      }

      const element = printRef.current;
      
      // Create offscreen container at exact fixed printable width (750px) at 0,0 behind everything
      cloneContainer = document.createElement('div');
      cloneContainer.style.position = 'fixed';
      cloneContainer.style.left = '0';
      cloneContainer.style.top = '0';
      cloneContainer.style.width = '750px';
      cloneContainer.style.backgroundColor = '#ffffff';
      cloneContainer.style.zIndex = '-9999';
      cloneContainer.style.pointerEvents = 'none';

      const clone = element.cloneNode(true) as HTMLDivElement;
      clone.style.width = '750px';
      clone.style.maxWidth = '750px';
      clone.style.margin = '0';
      clone.style.padding = '0';
      clone.style.boxShadow = 'none';
      
      cloneContainer.appendChild(clone);
      document.body.appendChild(cloneContainer);

      const opt = {
        margin: [4, 4, 4, 4] as [number, number, number, number],
        filename: `Tax_Invoice_${bill.invoiceNo}.pdf`,
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: {
          scale: 2.5,
          useCORS: true,
          allowTaint: true,
          letterRendering: true,
          logging: false,
          backgroundColor: '#ffffff',
          windowWidth: 750,
          scrollX: 0,
          scrollY: 0,
          x: 0,
          y: 0,
        },
        jsPDF: {
          unit: 'mm',
          format: 'a4',
          orientation: 'portrait' as const,
        },
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] },
      };

      await html2pdf().set(opt).from(clone).save();
    } catch (e) {
      console.error('PDF generation error:', e);
    } finally {
      if (cloneContainer && document.body.contains(cloneContainer)) {
        document.body.removeChild(cloneContainer);
      }
    }
  };

  const handleShareWhatsApp = () => {
    const text =
      `📄 *TAX INVOICE - ${settings.companyName || 'FENI CREATION'}*\n\n` +
      `*Invoice No:* #${bill.invoiceNo}\n` +
      `*Date:* ${formatDate(bill.date)}\n` +
      `*Party Name:* ${bill.partyName}\n` +
      `*Total Amount:* ₹${totalAmount.toLocaleString('en-IN')}\n` +
      `*Paid Amount:* ₹${bill.paidAmount ? Number(bill.paidAmount).toLocaleString('en-IN') : '0'}\n` +
      `*Pending Balance:* ₹${(totalAmount - (Number(bill.paidAmount) || 0)).toLocaleString('en-IN')}\n\n` +
      `Thank you for doing business with us! 🙏`;

    const waUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(waUrl, '_blank');
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogActions sx={{ p: 1.5, justifyContent: 'space-between', bgcolor: '#f8fafc', borderBottom: '1px solid #cbd5e1' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Button variant="contained" color="primary" startIcon={<PrintIcon />} onClick={handlePrint} sx={{ fontWeight: 700 }}>
            Print Invoice
          </Button>
          <Button variant="outlined" color="secondary" startIcon={<PdfIcon />} onClick={handleDownloadPdf} sx={{ fontWeight: 700 }}>
            Download PDF
          </Button>
          <Button
            variant="outlined"
            startIcon={<WhatsAppIcon />}
            onClick={handleShareWhatsApp}
            sx={{
              fontWeight: 700,
              color: '#16a34a',
              borderColor: '#86efac',
              bgcolor: '#f0fdf4',
              '&:hover': { bgcolor: '#dcfce7', borderColor: '#4ade80' },
            }}
          >
            Share WhatsApp
          </Button>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <StyleIcon fontSize="small" sx={{ color: 'text.secondary', display: { xs: 'none', sm: 'inline' } }} />
          <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.secondary', display: { xs: 'none', sm: 'inline' } }}>
            Design:
          </Typography>
          <ToggleButtonGroup
            value={template}
            exclusive
            onChange={(_, val) => val && setTemplate(val)}
            size="small"
            sx={{ bgcolor: '#fff' }}
          >
            <ToggleButton value="freight" sx={{ fontWeight: 700, fontSize: '11px', px: 1.5 }}>
              Freight Tools Style
            </ToggleButton>
            <ToggleButton value="classic" sx={{ fontWeight: 700, fontSize: '11px', px: 1.5 }}>
              Classic FCB Style
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>

        <Button onClick={onClose} color="inherit" startIcon={<CloseIcon />}>
          Close
        </Button>
      </DialogActions>

      <DialogContent sx={{ p: { xs: 1, sm: 3 }, bgcolor: '#e2e8f0', display: 'flex', justifyContent: 'center' }}>
        {/* CSS Print Styles for A4 Output */}
        <style>{`
          @media print {
            body * {
              visibility: hidden !important;
            }
            #printable-a4-invoice, #printable-a4-invoice * {
              visibility: visible !important;
            }
            #printable-a4-invoice {
              position: absolute !important;
              left: 0 !important;
              top: 0 !important;
              width: 100% !important;
              max-width: none !important;
              box-shadow: none !important;
              margin: 0 !important;
              padding: 0 !important;
              box-sizing: border-box !important;
              border: 1px solid #000000 !important;
            }
            @page {
              size: A4 portrait;
              margin: 4mm;
            }
          }
        `}</style>

        {/* Dynamic A4 Document Layout */}
        <div
          id="printable-a4-invoice"
          ref={printRef}
          style={{
            width: '750px',
            backgroundColor: '#ffffff',
            color: '#000000',
            fontFamily: "'Noto Sans Gujarati', 'Mukta', 'Hind Vadodara', Arial, Helvetica, sans-serif",
            fontSize: '11px',
            border: '1px solid #000000',
            boxSizing: 'border-box',
            padding: '0',
            margin: '12px auto',
            boxShadow: '0 10px 25px rgba(0,0,0,0.25)',
          }}
        >
          {template === 'freight' ? (
            /* ========================================================= */
            /* FREIGHT TOOLS DESIGN (Matching User's Reference Image)    */
            /* ========================================================= */
            <div style={{ width: '750px', boxSizing: 'border-box' }}>
              {/* Header Top Table */}
              <table style={{ width: '750px', tableLayout: 'fixed', borderCollapse: 'collapse', borderSpacing: '0', backgroundColor: '#ffffff' }}>
                <colgroup>
                  <col style={{ width: '460px' }} />
                  <col style={{ width: '290px' }} />
                </colgroup>
                <tbody>
                  <tr>
                    <td style={{ padding: '10px 12px 6px 12px', verticalAlign: 'top' }}>
                      <div
                        style={{
                          fontSize: '20px',
                          fontWeight: 'bold',
                          color: '#1e1b4b',
                          letterSpacing: '0.5px',
                          fontFamily: 'Arial, Helvetica, sans-serif',
                          textTransform: 'uppercase',
                          lineHeight: '22px',
                          margin: '0 0 4px 0',
                        }}
                      >
                        {settings.companyName || 'FENI CREATION'}
                      </div>

                      {/* Teal Banner Bar */}
                      <table style={{ borderCollapse: 'collapse', borderSpacing: '0', backgroundColor: '#008b8b', marginBottom: '6px' }}>
                        <tbody>
                          <tr>
                            <td style={{ color: '#ffffff', fontSize: '11px', fontWeight: 'bold', padding: '3px 8px', lineHeight: '14px', whiteSpace: 'nowrap' }}>
                              {settings.tagline || 'Embroidery & Textile Manufacturing'}
                            </td>
                          </tr>
                        </tbody>
                      </table>

                      {/* Address Lines */}
                      <div style={{ fontSize: '11px', color: '#1e293b', lineHeight: '15px' }}>
                        {settings.address || 'Plot No. 124, GIDC Industrial Estate, Varachha, Surat - 395006, Gujarat, India'}
                      </div>
                    </td>

                    <td style={{ padding: '10px 12px 6px 12px', verticalAlign: 'top', textAlign: 'right' }}>
                      {/* Logo Graphic */}
                      <div style={{ minHeight: '38px', marginBottom: '4px' }}>
                        {settings.logoUrl ? (
                          <img src={settings.logoUrl} alt="Logo" style={{ maxHeight: '38px', maxWidth: '140px', objectFit: 'contain', float: 'right' }} />
                        ) : (
                          <div style={{ display: 'inline-block', float: 'right' }}>
                            <table style={{ borderCollapse: 'collapse', borderSpacing: '0' }}>
                              <tbody>
                                <tr>
                                  <td style={{ verticalAlign: 'middle', paddingRight: '6px' }}>
                                    <svg width="34" height="34" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                                      <path d="M50 10 L85 30 L85 70 L50 90 L15 70 L15 30 Z" stroke="#008b8b" strokeWidth="6" fill="none" />
                                      <path d="M50 10 L50 90 M15 30 L85 70 M85 30 L15 70" stroke="#008b8b" strokeWidth="4" />
                                      <circle cx="50" cy="50" r="10" fill="#1e1b4b" />
                                    </svg>
                                  </td>
                                  <td style={{ verticalAlign: 'middle', textAlign: 'left', lineHeight: '12px' }}>
                                    <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#1e1b4b', letterSpacing: '0.5px', lineHeight: '14px' }}>LOGOTEXT</div>
                                    <div style={{ fontSize: '8px', color: '#64748b', letterSpacing: '1px', marginTop: '1px', lineHeight: '10px' }}>SLOGANHERE</div>
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                      <div style={{ clear: 'both' }}></div>

                      {/* Contact Rows */}
                      <div style={{ fontSize: '11px', lineHeight: '16px', color: '#0f172a', textAlign: 'right' }}>
                        <div><b>Tel :</b> {settings.phone || '+91 98765 43210'}</div>
                        <div><b>Web :</b> {settings.email || 'fenicreation001@gmail.com'}</div>
                        <div><b>Web :</b> info@gft.com</div>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* TAX INVOICE Header Box */}
              <div
                style={{
                  width: '750px',
                  boxSizing: 'border-box',
                  textAlign: 'center',
                  fontWeight: 'bold',
                  fontSize: '13px',
                  padding: '4px 0',
                  borderTop: '1px solid #000000',
                  borderBottom: '1px solid #000000',
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                  backgroundColor: '#ffffff',
                  lineHeight: '16px',
                }}
              >
                TAX INVOICE
              </div>

              {/* Party & Invoice Details Table (2 Columns) */}
              <table style={{ width: '750px', tableLayout: 'fixed', borderCollapse: 'collapse', borderSpacing: '0', borderBottom: '1px solid #000000' }}>
                <colgroup>
                  <col style={{ width: '460px' }} />
                  <col style={{ width: '290px' }} />
                </colgroup>
                <tbody>
                  <tr>
                    {/* Left Column: Party Details */}
                    <td style={{ borderRight: '1px solid #000000', padding: '6px 10px', verticalAlign: 'top' }}>
                      <table style={{ width: '440px', tableLayout: 'fixed', borderCollapse: 'collapse', borderSpacing: '0', fontSize: '11px', lineHeight: '17px' }}>
                        <tbody>
                          <tr>
                            <td style={{ width: '85px', fontWeight: 'bold', verticalAlign: 'top', lineHeight: '17px' }}>Party Name</td>
                            <td style={{ fontWeight: 'bold', verticalAlign: 'top', lineHeight: '17px' }}>: {bill.partyName}</td>
                          </tr>
                          <tr>
                            <td style={{ fontWeight: 'bold', verticalAlign: 'top', lineHeight: '17px' }}>Name</td>
                            <td style={{ verticalAlign: 'top', lineHeight: '17px' }}>: {bill.notes || 'સાડી નું કાપડ'}</td>
                          </tr>
                          <tr>
                            <td style={{ fontWeight: 'bold', verticalAlign: 'top', lineHeight: '17px' }}>Address</td>
                            <td style={{ verticalAlign: 'top', lineHeight: '17px' }}>: {bill.partyAddress || 'Sumel Business Park 7, Kochi, Kerala - 380023'}</td>
                          </tr>
                          <tr>
                            <td style={{ fontWeight: 'bold', verticalAlign: 'top', lineHeight: '17px' }}>GSTIN</td>
                            <td style={{ verticalAlign: 'top', lineHeight: '17px' }}>: {bill.partyGstin || '32AABBA7990B1ZB'}</td>
                          </tr>
                          <tr>
                            <td style={{ fontWeight: 'bold', verticalAlign: 'top', lineHeight: '17px' }}>Phone</td>
                            <td style={{ verticalAlign: 'top', lineHeight: '17px' }}>: {bill.partyMobile || '9878799879'}</td>
                          </tr>
                        </tbody>
                      </table>
                    </td>

                    {/* Right Column: Invoice Metadata */}
                    <td style={{ padding: '6px 10px', verticalAlign: 'top' }}>
                      <table style={{ width: '270px', tableLayout: 'fixed', borderCollapse: 'collapse', borderSpacing: '0', fontSize: '11px', lineHeight: '17px' }}>
                        <tbody>
                          <tr>
                            <td style={{ width: '90px', fontWeight: 'bold', verticalAlign: 'top', lineHeight: '17px' }}>Invoice</td>
                            <td style={{ fontWeight: 'bold', textAlign: 'right', verticalAlign: 'top', lineHeight: '17px' }}>{bill.invoiceNo}</td>
                          </tr>
                          <tr>
                            <td style={{ fontWeight: 'bold', verticalAlign: 'top', lineHeight: '17px' }}>Invoice Date</td>
                            <td style={{ textAlign: 'right', verticalAlign: 'top', lineHeight: '17px' }}>{formatDate(bill.date)}</td>
                          </tr>
                          <tr>
                            <td style={{ fontWeight: 'bold', verticalAlign: 'top', lineHeight: '17px' }}>Party Ch. No</td>
                            <td style={{ textAlign: 'right', verticalAlign: 'top', lineHeight: '17px' }}>{bill.challanNo || items[0]?.challanNo || '1015'}</td>
                          </tr>
                          <tr>
                            <td style={{ fontWeight: 'bold', verticalAlign: 'top', lineHeight: '17px' }}>Party Ch. Date</td>
                            <td style={{ textAlign: 'right', verticalAlign: 'top', lineHeight: '17px' }}>{formatDate(bill.dueDate || bill.date)}</td>
                          </tr>
                        </tbody>
                      </table>
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* Main Product Table (Pure HTML Table Structure) */}
              <table style={{ width: '750px', tableLayout: 'fixed', borderCollapse: 'collapse', borderSpacing: '0', fontSize: '11px', emptyCells: 'show' }}>
                <colgroup>
                  <col style={{ width: '38px' }} />
                  <col style={{ width: '242px' }} />
                  <col style={{ width: '60px' }} />
                  <col style={{ width: '50px' }} />
                  <col style={{ width: '60px' }} />
                  <col style={{ width: '100px' }} />
                  <col style={{ width: '40px' }} />
                  <col style={{ width: '80px' }} />
                  <col style={{ width: '80px' }} />
                </colgroup>
                <thead>
                  <tr style={{ height: '22px' }}>
                    <th rowSpan={2} style={{ borderRight: '1px solid #000000', borderBottom: '1px solid #000000', verticalAlign: 'middle', textAlign: 'center', fontWeight: 'bold', padding: '4px 2px', lineHeight: '14px' }}>Sr.<br />No.</th>
                    <th rowSpan={2} style={{ borderRight: '1px solid #000000', borderBottom: '1px solid #000000', verticalAlign: 'middle', textAlign: 'left', fontWeight: 'bold', padding: '4px 6px', lineHeight: '14px' }}>Description</th>
                    <th rowSpan={2} style={{ borderRight: '1px solid #000000', borderBottom: '1px solid #000000', verticalAlign: 'middle', textAlign: 'center', fontWeight: 'bold', padding: '4px 2px', lineHeight: '14px' }}>HSN</th>
                    <th rowSpan={2} style={{ borderRight: '1px solid #000000', borderBottom: '1px solid #000000', verticalAlign: 'middle', textAlign: 'center', fontWeight: 'bold', padding: '4px 2px', lineHeight: '14px' }}>Qty</th>
                    <th rowSpan={2} style={{ borderRight: '1px solid #000000', borderBottom: '1px solid #000000', verticalAlign: 'middle', textAlign: 'center', fontWeight: 'bold', padding: '4px 2px', lineHeight: '14px' }}>Rate</th>
                    <th rowSpan={2} style={{ borderRight: '1px solid #000000', borderBottom: '1px solid #000000', verticalAlign: 'middle', textAlign: 'center', fontWeight: 'bold', padding: '4px 2px', lineHeight: '14px' }}>Taxable Value</th>
                    <th colSpan={2} style={{ borderRight: '1px solid #000000', borderBottom: '1px solid #000000', verticalAlign: 'middle', textAlign: 'center', fontWeight: 'bold', padding: '4px 2px', lineHeight: '14px' }}>IGST / GST</th>
                    <th rowSpan={2} style={{ borderBottom: '1px solid #000000', verticalAlign: 'middle', textAlign: 'center', fontWeight: 'bold', padding: '4px 2px', lineHeight: '14px' }}>Total</th>
                  </tr>
                  <tr style={{ height: '18px' }}>
                    <th style={{ borderRight: '1px solid #000000', borderBottom: '1px solid #000000', verticalAlign: 'middle', textAlign: 'center', fontWeight: 'bold', padding: '3px 2px', lineHeight: '14px' }}>%</th>
                    <th style={{ borderRight: '1px solid #000000', borderBottom: '1px solid #000000', verticalAlign: 'middle', textAlign: 'center', fontWeight: 'bold', padding: '3px 2px', lineHeight: '14px' }}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, index) => {
                    const itemQty = Number(item.quantity) || 0;
                    const itemRate = Number(item.rate) || 0;
                    const itemTaxable = itemQty * itemRate;
                    const itemTaxAmt = itemTaxable * 0.05;
                    const itemTotal = itemTaxable + itemTaxAmt;

                    return (
                      <tr key={index} style={{ height: '24px', borderBottom: '1px solid #000000' }}>
                        <td style={{ borderRight: '1px solid #000000', textAlign: 'center', padding: '3px 2px', verticalAlign: 'middle', lineHeight: '15px' }}>{index + 1}</td>
                        <td style={{ borderRight: '1px solid #000000', padding: '3px 6px', fontWeight: 'bold', verticalAlign: 'middle', lineHeight: '15px' }}>
                          {item.description}
                        </td>
                        <td style={{ borderRight: '1px solid #000000', textAlign: 'center', padding: '3px 2px', verticalAlign: 'middle', lineHeight: '15px' }}>
                          {item.hsnCode || settings.hsnCode || '9988'}
                        </td>
                        <td style={{ borderRight: '1px solid #000000', textAlign: 'center', padding: '3px 2px', verticalAlign: 'middle', lineHeight: '15px' }}>{item.quantity}</td>
                        <td style={{ borderRight: '1px solid #000000', textAlign: 'center', padding: '3px 2px', verticalAlign: 'middle', lineHeight: '15px' }}>{item.rate}</td>
                        <td style={{ borderRight: '1px solid #000000', textAlign: 'right', padding: '3px 6px', verticalAlign: 'middle', lineHeight: '15px' }}>
                          {itemTaxable.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td style={{ borderRight: '1px solid #000000', textAlign: 'center', padding: '3px 2px', verticalAlign: 'middle', lineHeight: '15px' }}>5%</td>
                        <td style={{ borderRight: '1px solid #000000', textAlign: 'right', padding: '3px 4px', verticalAlign: 'middle', lineHeight: '15px' }}>
                          {itemTaxAmt.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td style={{ textAlign: 'right', padding: '3px 6px', fontWeight: 'bold', verticalAlign: 'middle', lineHeight: '15px' }}>
                          {itemTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                      </tr>
                    );
                  })}

                  {/* Empty rows filler for paper feel */}
                  {Array.from({ length: emptyRowsCount }).map((_, idx) => (
                    <tr key={`empty-${idx}`} style={{ height: '24px', borderBottom: '1px solid #000000' }}>
                      <td style={{ borderRight: '1px solid #000000', height: '24px', lineHeight: '15px' }}>&nbsp;</td>
                      <td style={{ borderRight: '1px solid #000000', height: '24px', lineHeight: '15px' }}>&nbsp;</td>
                      <td style={{ borderRight: '1px solid #000000', height: '24px', lineHeight: '15px' }}>&nbsp;</td>
                      <td style={{ borderRight: '1px solid #000000', height: '24px', lineHeight: '15px' }}>&nbsp;</td>
                      <td style={{ borderRight: '1px solid #000000', height: '24px', lineHeight: '15px' }}>&nbsp;</td>
                      <td style={{ borderRight: '1px solid #000000', height: '24px', lineHeight: '15px' }}>&nbsp;</td>
                      <td style={{ borderRight: '1px solid #000000', height: '24px', lineHeight: '15px' }}>&nbsp;</td>
                      <td style={{ borderRight: '1px solid #000000', height: '24px', lineHeight: '15px' }}>&nbsp;</td>
                      <td style={{ height: '24px', lineHeight: '15px' }}>&nbsp;</td>
                    </tr>
                  ))}

                  {/* Table Total Row */}
                  <tr style={{ borderTop: '1px solid #000000', borderBottom: '1px solid #000000', height: '26px', fontWeight: 'bold' }}>
                    <td colSpan={3} style={{ borderRight: '1px solid #000000', textAlign: 'center', verticalAlign: 'middle', lineHeight: '16px' }}>
                      Total
                    </td>
                    <td style={{ borderRight: '1px solid #000000', textAlign: 'center', verticalAlign: 'middle', lineHeight: '16px' }}>{totalQty}</td>
                    <td style={{ borderRight: '1px solid #000000', verticalAlign: 'middle', lineHeight: '16px' }}>&nbsp;</td>
                    <td style={{ borderRight: '1px solid #000000', textAlign: 'right', paddingRight: '6px', verticalAlign: 'middle', lineHeight: '16px' }}>
                      {subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td style={{ borderRight: '1px solid #000000', verticalAlign: 'middle', lineHeight: '16px' }}>&nbsp;</td>
                    <td style={{ borderRight: '1px solid #000000', textAlign: 'right', paddingRight: '4px', verticalAlign: 'middle', lineHeight: '16px' }}>
                      {totalTax.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td style={{ textAlign: 'right', paddingRight: '6px', verticalAlign: 'middle', lineHeight: '16px' }}>
                      {totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* Bottom Structured Master Table */}
              <table style={{ width: '750px', tableLayout: 'fixed', borderCollapse: 'collapse', borderSpacing: '0', fontSize: '11px', emptyCells: 'show' }}>
                <colgroup>
                  <col style={{ width: '460px' }} />
                  <col style={{ width: '290px' }} />
                </colgroup>
                <tbody>
                  {/* Row 1: Words & Bank Details (left) + Tax Summary (right) */}
                  <tr>
                    <td style={{ verticalAlign: 'top', borderRight: '1px solid #000000', borderBottom: '1px solid #000000', padding: '0' }}>
                      <table style={{ width: '460px', tableLayout: 'fixed', borderCollapse: 'collapse', borderSpacing: '0' }}>
                        <tbody>
                          <tr>
                            <td style={{ borderBottom: '1px solid #000000', padding: '6px 8px', textAlign: 'center' }}>
                              <div style={{ fontWeight: 'bold', fontSize: '11px', lineHeight: '15px' }}>Total in words</div>
                              <div style={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', color: '#008b8b', marginTop: '2px', lineHeight: '15px' }}>
                                {numberToWords(totalAmount)}
                              </div>
                            </td>
                          </tr>
                          <tr>
                            <td style={{ borderBottom: '1px solid #000000', padding: '4px 0', textAlign: 'center', fontWeight: 'bold', fontSize: '11px', lineHeight: '15px' }}>
                              Bank Details
                            </td>
                          </tr>
                          <tr>
                            <td style={{ padding: '6px 10px' }}>
                              <table style={{ width: '440px', tableLayout: 'fixed', borderCollapse: 'collapse', borderSpacing: '0', fontSize: '11px', lineHeight: '17px' }}>
                                <tbody>
                                  <tr>
                                    <td style={{ width: '90px', fontWeight: 'bold', lineHeight: '17px' }}>Name</td>
                                    <td style={{ lineHeight: '17px' }}>: {settings.bankName || 'State Bank of India'}</td>
                                  </tr>
                                  <tr>
                                    <td style={{ fontWeight: 'bold', lineHeight: '17px' }}>Acc. Number</td>
                                    <td style={{ lineHeight: '17px' }}>: {settings.accountNo || '39485726102'}</td>
                                  </tr>
                                  <tr>
                                    <td style={{ fontWeight: 'bold', lineHeight: '17px' }}>IFSC</td>
                                    <td style={{ lineHeight: '17px' }}>: {settings.ifscCode || 'SBIN0001234'}</td>
                                  </tr>
                                  <tr>
                                    <td style={{ fontWeight: 'bold', lineHeight: '17px' }}>Branch</td>
                                    <td style={{ lineHeight: '17px' }}>: Surate</td>
                                  </tr>
                                </tbody>
                              </table>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </td>

                    {/* Taxable Amount / Total Tax / Total Amount After Tax */}
                    <td style={{ verticalAlign: 'top', borderBottom: '1px solid #000000', padding: '0' }}>
                      <table style={{ width: '290px', tableLayout: 'fixed', borderCollapse: 'collapse', borderSpacing: '0', fontSize: '11px' }}>
                        <tbody>
                          <tr>
                            <td style={{ padding: '6px 8px', fontWeight: 'bold', verticalAlign: 'middle', lineHeight: '16px', borderBottom: '1px solid #000000' }}>Taxable Amount</td>
                            <td style={{ padding: '6px 8px', textAlign: 'right', verticalAlign: 'middle', lineHeight: '16px', borderBottom: '1px solid #000000' }}>
                              {subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                          </tr>
                          <tr>
                            <td style={{ padding: '6px 8px', fontWeight: 'bold', verticalAlign: 'middle', lineHeight: '16px', borderBottom: '1px solid #000000' }}>Total Tax</td>
                            <td style={{ padding: '6px 8px', textAlign: 'right', verticalAlign: 'middle', lineHeight: '16px', borderBottom: '1px solid #000000' }}>
                              {totalTax.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                          </tr>
                          <tr>
                            <td style={{ padding: '8px 8px', fontWeight: 'bold', verticalAlign: 'middle', lineHeight: '18px' }}>Total Amount After Tax</td>
                            <td style={{ padding: '8px 8px', textAlign: 'right', fontSize: '13px', fontWeight: 'bold', verticalAlign: 'middle', lineHeight: '18px' }}>
                              ₹{totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </td>
                  </tr>

                  {/* Row 2: Terms and Conditions (left) + Authorised Signatory (right) */}
                  <tr>
                    <td style={{ verticalAlign: 'top', borderRight: '1px solid #000000', padding: '0' }}>
                      <table style={{ width: '460px', tableLayout: 'fixed', borderCollapse: 'collapse', borderSpacing: '0' }}>
                        <tbody>
                          <tr>
                            <td style={{ borderBottom: '1px solid #000000', padding: '4px 0', textAlign: 'center', fontWeight: 'bold', fontSize: '11px', lineHeight: '15px' }}>
                              Terms and Conditions
                            </td>
                          </tr>
                          <tr>
                            <td style={{ padding: '6px 10px', fontSize: '10px', lineHeight: '15px' }}>
                              1. Any complaint regarding and should brought to our notice in written within 2 days.<br />
                              2. We are not responsible for Payment to unauthorized.<br />
                              3. Interest at 2.0 % per month charged on account not paid within due course.<br />
                              4. Subject to Surat Jurisdiction.
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </td>

                    <td style={{ verticalAlign: 'top', padding: '0' }}>
                      <table style={{ width: '290px', tableLayout: 'fixed', borderCollapse: 'collapse', borderSpacing: '0' }}>
                        <tbody>
                          <tr>
                            <td style={{ borderBottom: '1px solid #000000', padding: '4px 0', textAlign: 'center', fontWeight: 'bold', fontSize: '10px', textTransform: 'uppercase', lineHeight: '15px' }}>
                              Authorised Signatory
                            </td>
                          </tr>
                          <tr>
                            <td style={{ padding: '40px 8px 10px 8px', textAlign: 'center', fontSize: '10px', fontWeight: 'bold', lineHeight: '15px' }}>
                              Sign. Of Receiver
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          ) : (
            /* ========================================================= */
            /* CLASSIC FCB DESIGN (Traditional Ledger Style)              */
            /* ========================================================= */
            <div style={{ width: '750px', boxSizing: 'border-box' }}>
              {/* Top Header */}
              <div style={{ textAlign: 'center', padding: '6px 12px 4px 12px', borderBottom: '1px solid #000000' }}>
                <div style={{ fontSize: '11px', fontWeight: 'bold', letterSpacing: '0.5px', lineHeight: '14px' }}>
                  || SHREE GANESHAY NAMAH ||
                </div>
                <div style={{ fontSize: '22px', fontWeight: 'bold', margin: '2px 0 1px 0', textTransform: 'uppercase', letterSpacing: '0.5px', lineHeight: '26px' }}>
                  {settings.companyName || 'FENI CREATION'}
                </div>
                <div style={{ fontSize: '11px', lineHeight: '15px' }}>
                  {settings.address || 'Plot No.19, 2nd Floor, Laxmi Textile Compound, A.K Road, Varachha, Surat - 394161'}
                </div>
                <div style={{ fontSize: '11px', fontWeight: 'bold', marginTop: '2px', lineHeight: '15px' }}>
                  GST NO. : {settings.gstin || '24BAMPV2618G2ZI'} &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; Mob. {settings.phone || '+91 7265800782 || +91 8160663175'}
                </div>
              </div>

              {/* Title Bar */}
              <div
                style={{
                  width: '750px',
                  boxSizing: 'border-box',
                  textAlign: 'center',
                  fontWeight: 'bold',
                  fontSize: '13px',
                  padding: '3px 0',
                  borderBottom: '1px solid #000000',
                  letterSpacing: '1px',
                  backgroundColor: '#ffffff',
                  lineHeight: '16px',
                }}
              >
                TAX INVOICE
              </div>

              {/* Details Section (2 Columns) */}
              <table style={{ width: '750px', tableLayout: 'fixed', borderCollapse: 'collapse', borderSpacing: '0', borderBottom: '1px solid #000000' }}>
                <colgroup>
                  <col style={{ width: '435px' }} />
                  <col style={{ width: '315px' }} />
                </colgroup>
                <tbody>
                  <tr>
                    {/* Left Column: Party Details */}
                    <td style={{ borderRight: '1px solid #000000', padding: '6px 10px', verticalAlign: 'top' }}>
                      <table style={{ width: '415px', tableLayout: 'fixed', borderCollapse: 'collapse', borderSpacing: '0', fontSize: '11px', lineHeight: '17px' }}>
                        <tbody>
                          <tr>
                            <td style={{ width: '85px', fontWeight: 'bold', verticalAlign: 'top', lineHeight: '17px' }}>Party Name</td>
                            <td style={{ width: '10px', fontWeight: 'bold', verticalAlign: 'top', textAlign: 'center', lineHeight: '17px' }}>:</td>
                            <td style={{ fontWeight: 'bold', verticalAlign: 'top', lineHeight: '17px' }}>{bill.partyName}</td>
                          </tr>
                          <tr>
                            <td style={{ fontWeight: 'bold', verticalAlign: 'top', lineHeight: '17px' }}>GST No.</td>
                            <td style={{ fontWeight: 'bold', verticalAlign: 'top', textAlign: 'center', lineHeight: '17px' }}>:</td>
                            <td style={{ verticalAlign: 'top', lineHeight: '17px' }}>{bill.partyGstin || '-'}</td>
                          </tr>
                          <tr>
                            <td style={{ fontWeight: 'bold', verticalAlign: 'top', lineHeight: '17px' }}>Contact No.</td>
                            <td style={{ fontWeight: 'bold', verticalAlign: 'top', textAlign: 'center', lineHeight: '17px' }}>:</td>
                            <td style={{ verticalAlign: 'top', lineHeight: '17px' }}>{bill.partyMobile || '-'}</td>
                          </tr>
                          <tr>
                            <td style={{ fontWeight: 'bold', verticalAlign: 'top', lineHeight: '17px' }}>Address</td>
                            <td style={{ fontWeight: 'bold', verticalAlign: 'top', textAlign: 'center', lineHeight: '17px' }}>:</td>
                            <td style={{ verticalAlign: 'top', lineHeight: '17px' }}>{bill.partyAddress || 'Surat, Gujarat'}</td>
                          </tr>
                        </tbody>
                      </table>
                    </td>

                    {/* Right Column: Invoice Details */}
                    <td style={{ padding: '6px 10px', verticalAlign: 'top' }}>
                      <table style={{ width: '295px', tableLayout: 'fixed', borderCollapse: 'collapse', borderSpacing: '0', fontSize: '11px', lineHeight: '17px' }}>
                        <tbody>
                          <tr>
                            <td style={{ width: '100px', fontWeight: 'bold', lineHeight: '17px' }}>Invoice No.</td>
                            <td style={{ width: '10px', fontWeight: 'bold', textAlign: 'center', lineHeight: '17px' }}>:</td>
                            <td style={{ fontWeight: 'bold', lineHeight: '17px' }}>{bill.invoiceNo}</td>
                          </tr>
                          <tr>
                            <td style={{ fontWeight: 'bold', lineHeight: '17px' }}>Date</td>
                            <td style={{ fontWeight: 'bold', textAlign: 'center', lineHeight: '17px' }}>:</td>
                            <td style={{ lineHeight: '17px' }}>{formatDate(bill.date)}</td>
                          </tr>
                          <tr>
                            <td style={{ fontWeight: 'bold', lineHeight: '17px' }}>Party Ch. No</td>
                            <td style={{ fontWeight: 'bold', textAlign: 'center', lineHeight: '17px' }}>:</td>
                            <td style={{ lineHeight: '17px' }}>{bill.challanNo || items[0]?.challanNo || '-'}</td>
                          </tr>
                          <tr>
                            <td style={{ fontWeight: 'bold', lineHeight: '17px' }}>Party Ch. Date</td>
                            <td style={{ fontWeight: 'bold', textAlign: 'center', lineHeight: '17px' }}>:</td>
                            <td style={{ lineHeight: '17px' }}>-</td>
                          </tr>
                          <tr>
                            <td style={{ fontWeight: 'bold', lineHeight: '17px' }}>Party Due Date</td>
                            <td style={{ fontWeight: 'bold', textAlign: 'center', lineHeight: '17px' }}>:</td>
                            <td style={{ lineHeight: '17px' }}>{formatDate(bill.dueDate)}</td>
                          </tr>
                        </tbody>
                      </table>
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* Ledger Items Table */}
              <table style={{ width: '750px', tableLayout: 'fixed', borderCollapse: 'collapse', borderSpacing: '0', fontSize: '11px', emptyCells: 'show' }}>
                <colgroup>
                  <col style={{ width: '40px' }} />
                  <col style={{ width: '285px' }} />
                  <col style={{ width: '70px' }} />
                  <col style={{ width: '55px' }} />
                  <col style={{ width: '65px' }} />
                  <col style={{ width: '55px' }} />
                  <col style={{ width: '180px' }} />
                </colgroup>
                <thead>
                  <tr style={{ backgroundColor: '#d1d5db', height: '22px' }}>
                    <th style={{ borderRight: '1px solid #000000', borderBottom: '1px solid #000000', padding: '4px', textAlign: 'center', fontWeight: 'bold', lineHeight: '14px' }}>Sr. No.</th>
                    <th style={{ borderRight: '1px solid #000000', borderBottom: '1px solid #000000', padding: '4px 6px', textAlign: 'center', fontWeight: 'bold', lineHeight: '14px' }}>Description</th>
                    <th style={{ borderRight: '1px solid #000000', borderBottom: '1px solid #000000', padding: '4px', textAlign: 'center', fontWeight: 'bold', lineHeight: '14px' }}>HSN Code</th>
                    <th style={{ borderRight: '1px solid #000000', borderBottom: '1px solid #000000', padding: '4px', textAlign: 'center', fontWeight: 'bold', lineHeight: '14px' }}>Qty</th>
                    <th style={{ borderRight: '1px solid #000000', borderBottom: '1px solid #000000', padding: '4px', textAlign: 'center', fontWeight: 'bold', lineHeight: '14px' }}>Rate</th>
                    <th style={{ borderRight: '1px solid #000000', borderBottom: '1px solid #000000', padding: '4px', textAlign: 'center', fontWeight: 'bold', lineHeight: '14px' }}>Short</th>
                    <th style={{ borderBottom: '1px solid #000000', padding: '4px 6px', textAlign: 'center', fontWeight: 'bold', lineHeight: '14px' }}>Total Amt</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, index) => (
                    <tr key={index} style={{ height: '24px', borderBottom: '1px solid #000000' }}>
                      <td style={{ borderRight: '1px solid #000000', textAlign: 'center', padding: '3px 2px', verticalAlign: 'middle', lineHeight: '15px' }}>{index + 1}</td>
                      <td style={{ borderRight: '1px solid #000000', padding: '3px 6px', verticalAlign: 'middle', lineHeight: '15px' }}>
                        {item.description}
                        {item.designNo && <span style={{ fontSize: '10px', fontWeight: 'bold', display: 'inline-block', marginLeft: '6px' }}>(Design: {item.designNo})</span>}
                      </td>
                      <td style={{ borderRight: '1px solid #000000', textAlign: 'center', padding: '3px 2px', verticalAlign: 'middle', lineHeight: '15px' }}>{item.hsnCode || settings.hsnCode || '9988'}</td>
                      <td style={{ borderRight: '1px solid #000000', textAlign: 'center', padding: '3px 2px', verticalAlign: 'middle', lineHeight: '15px' }}>{item.quantity}</td>
                      <td style={{ borderRight: '1px solid #000000', textAlign: 'center', padding: '3px 2px', verticalAlign: 'middle', lineHeight: '15px' }}>{item.rate}</td>
                      <td style={{ borderRight: '1px solid #000000', textAlign: 'center', padding: '3px 2px', verticalAlign: 'middle', lineHeight: '15px' }}>{item.shortage || 0}</td>
                      <td style={{ textAlign: 'right', padding: '3px 6px', fontWeight: 'bold', verticalAlign: 'middle', lineHeight: '15px' }}>
                        {item.amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}

                  {/* Render empty rows to maintain standard ledger vertical grid lines */}
                  {Array.from({ length: emptyRowsCount }).map((_, idx) => (
                    <tr key={`empty-${idx}`} style={{ height: '24px', borderBottom: '1px solid #000000' }}>
                      <td style={{ borderRight: '1px solid #000000', height: '24px', lineHeight: '15px' }}>&nbsp;</td>
                      <td style={{ borderRight: '1px solid #000000', height: '24px', lineHeight: '15px' }}>&nbsp;</td>
                      <td style={{ borderRight: '1px solid #000000', height: '24px', lineHeight: '15px' }}>&nbsp;</td>
                      <td style={{ borderRight: '1px solid #000000', height: '24px', lineHeight: '15px' }}>&nbsp;</td>
                      <td style={{ borderRight: '1px solid #000000', height: '24px', lineHeight: '15px' }}>&nbsp;</td>
                      <td style={{ borderRight: '1px solid #000000', height: '24px', lineHeight: '15px' }}>&nbsp;</td>
                      <td style={{ height: '24px', lineHeight: '15px' }}>&nbsp;</td>
                    </tr>
                  ))}

                  {/* Ledger Total Row */}
                  <tr style={{ borderTop: '1px solid #000000', borderBottom: '1px solid #000000', height: '26px', fontWeight: 'bold', backgroundColor: '#d1d5db' }}>
                    <td colSpan={3} style={{ borderRight: '1px solid #000000', textAlign: 'center', verticalAlign: 'middle', lineHeight: '16px' }}>
                      Total
                    </td>
                    <td style={{ borderRight: '1px solid #000000', textAlign: 'center', verticalAlign: 'middle', lineHeight: '16px' }}>
                      {totalQty}
                    </td>
                    <td style={{ borderRight: '1px solid #000000', verticalAlign: 'middle', lineHeight: '16px' }}>&nbsp;</td>
                    <td style={{ borderRight: '1px solid #000000', verticalAlign: 'middle', lineHeight: '16px' }}>&nbsp;</td>
                    <td style={{ textAlign: 'right', paddingRight: '8px', verticalAlign: 'middle', lineHeight: '16px' }}>
                      {subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* Bottom Section (2 Columns) */}
              <table style={{ width: '750px', tableLayout: 'fixed', borderCollapse: 'collapse', borderSpacing: '0', borderTop: '1px solid #000000' }}>
                <colgroup>
                  <col style={{ width: '415px' }} />
                  <col style={{ width: '335px' }} />
                </colgroup>
                <tbody>
                  <tr>
                    {/* Left Box: Words, Bank Details, Terms */}
                    <td style={{ borderRight: '1px solid #000000', padding: '6px 8px', verticalAlign: 'top' }}>
                      <div>
                        <div style={{ fontWeight: 'bold', fontSize: '11px', lineHeight: '15px' }}>Total Invoice Amount in Words :</div>
                        <div style={{ fontStyle: 'italic', fontWeight: 'bold', fontSize: '11px', margin: '2px 0 8px 0', lineHeight: '15px' }}>
                          {numberToWords(totalAmount)}
                        </div>

                        <div style={{ fontWeight: 'bold', fontSize: '11px', marginTop: '4px', lineHeight: '15px' }}>Bank Details :</div>
                        <table style={{ width: '395px', tableLayout: 'fixed', borderCollapse: 'collapse', borderSpacing: '0', fontSize: '11px', margin: '2px 0 8px 0', lineHeight: '16px' }}>
                          <tbody>
                            <tr>
                              <td style={{ width: '85px', fontWeight: 'bold', lineHeight: '16px' }}>Bank Name</td>
                              <td style={{ width: '10px', textAlign: 'center', lineHeight: '16px' }}>:</td>
                              <td style={{ fontWeight: 'bold', lineHeight: '16px' }}>{settings.bankName || 'State Bank of India'}</td>
                            </tr>
                            <tr>
                              <td style={{ fontWeight: 'bold', lineHeight: '16px' }}>Bank A/C No.</td>
                              <td style={{ textAlign: 'center', lineHeight: '16px' }}>:</td>
                              <td style={{ fontWeight: 'bold', lineHeight: '16px' }}>{settings.accountNo || '39485726102'}</td>
                            </tr>
                            <tr>
                              <td style={{ fontWeight: 'bold', lineHeight: '16px' }}>IFSC Code</td>
                              <td style={{ textAlign: 'center', lineHeight: '16px' }}>:</td>
                              <td style={{ fontWeight: 'bold', lineHeight: '16px' }}>{settings.ifscCode || 'SBIN0001234'}</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>

                      <div style={{ marginTop: '8px' }}>
                        <div style={{ fontWeight: 'bold', fontSize: '11px', lineHeight: '15px' }}>Terms and Conditions :</div>
                        <div style={{ padding: '2px 0 0 0', fontSize: '10px', lineHeight: '14px' }}>
                          1. Any complaint regarding and should brought to our notice in written within 2 days.<br />
                          2. We are not responsible for Payment to unauthorized.<br />
                          3. Interest at 2.0 % per month charged on account not paid within due course.<br />
                          4. Subject to Surat Jurisdiction.
                        </div>
                      </div>
                    </td>

                    {/* Right Box: Calculations & Signature */}
                    <td style={{ verticalAlign: 'top', padding: '0' }}>
                      <div style={{ padding: '4px 8px' }}>
                        <table style={{ width: '315px', tableLayout: 'fixed', borderCollapse: 'collapse', borderSpacing: '0', fontSize: '11px', lineHeight: '17px' }}>
                          <tbody>
                            <tr>
                              <td style={{ fontWeight: 'bold', lineHeight: '17px' }}>Discount</td>
                              <td style={{ width: '10px', textAlign: 'center', lineHeight: '17px' }}>:</td>
                              <td style={{ width: '50px', textAlign: 'right', lineHeight: '17px' }}>{discountPercent > 0 ? `${discountPercent.toFixed(2)}%` : '0.00%'}</td>
                              <td style={{ textAlign: 'right', fontWeight: 'bold', lineHeight: '17px' }}>
                                {discountAmount > 0
                                  ? discountAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                                  : '0.00'}
                              </td>
                            </tr>
                            <tr>
                              <td style={{ fontWeight: 'bold', lineHeight: '17px' }}>Add : CGST</td>
                              <td style={{ textAlign: 'center', lineHeight: '17px' }}>:</td>
                              <td style={{ textAlign: 'right', lineHeight: '17px' }}>2.50%</td>
                              <td style={{ textAlign: 'right', lineHeight: '17px' }}>{cgst.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                            </tr>
                            <tr>
                              <td style={{ fontWeight: 'bold', lineHeight: '17px' }}>Add : SGST</td>
                              <td style={{ textAlign: 'center', lineHeight: '17px' }}>:</td>
                              <td style={{ textAlign: 'right', lineHeight: '17px' }}>2.50%</td>
                              <td style={{ textAlign: 'right', lineHeight: '17px' }}>{sgst.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                            </tr>
                            <tr>
                              <td style={{ fontWeight: 'bold', lineHeight: '17px' }}>Add : IGST</td>
                              <td style={{ textAlign: 'center', lineHeight: '17px' }}>:</td>
                              <td style={{ textAlign: 'right', lineHeight: '17px' }}>0.00%</td>
                              <td style={{ textAlign: 'right', lineHeight: '17px' }}>0.00</td>
                            </tr>
                            <tr style={{ borderTop: '1px solid #000000', borderBottom: '1px solid #000000' }}>
                              <td colSpan={2} style={{ fontWeight: 'bold', padding: '3px 0', lineHeight: '17px' }}>Tax Amount : GST</td>
                              <td style={{ textAlign: 'center', lineHeight: '17px' }}>:</td>
                              <td style={{ textAlign: 'right', fontWeight: 'bold', padding: '3px 0', lineHeight: '17px' }}>
                                {totalTax.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </td>
                            </tr>
                            <tr style={{ borderBottom: '1px solid #000000', fontWeight: 'bold' }}>
                              <td colSpan={2} style={{ padding: '4px 0', lineHeight: '17px' }}>Total Amount After Tax</td>
                              <td style={{ textAlign: 'center', lineHeight: '17px' }}>:</td>
                              <td style={{ textAlign: 'right', fontSize: '12px', padding: '4px 0', lineHeight: '17px' }}>
                                {totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>

                      {/* Signatures Footer */}
                      <div style={{ padding: '10px 8px 8px 8px' }}>
                        <div style={{ textAlign: 'right', fontWeight: 'bold', fontSize: '11px', marginBottom: '28px', lineHeight: '15px' }}>
                          For, {settings.companyName || 'Feni Creation'}
                        </div>
                        <table style={{ width: '315px', tableLayout: 'fixed', borderCollapse: 'collapse', borderSpacing: '0', fontSize: '11px' }}>
                          <tbody>
                            <tr>
                              <td style={{ textAlign: 'left', lineHeight: '15px' }}>(Sign. Of Receiver)</td>
                              <td style={{ textAlign: 'right', fontWeight: 'bold', lineHeight: '15px' }}>Authorised Signatory</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};


