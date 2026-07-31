// Indian Currency Formatter (₹)
export const formatCurrency = (amount: number | string): string => {
  const num = typeof amount === 'string' ? parseFloat(amount) || 0 : amount;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  }).format(num);
};

// Simple Indian Rupee Number Formatter
export const formatRupees = (amount: number): string => {
  return '₹' + amount.toLocaleString('en-IN', { maximumFractionDigits: 2 });
};

// Date Formatter (DD/MM/YYYY)
export const formatDate = (dateString?: string): string => {
  if (!dateString) return '-';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return dateString;
  }
};

// Month-Wise Formatter (e.g., May 2026 / મે ૨૦૨૬)
export const formatSalaryMonth = (dateString?: string, lang: string = 'en'): string => {
  if (!dateString) return '-';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    const monthNamesEn = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const monthNamesGu = ['જાન્યુઆરી', 'ફેબ્રુઆરી', 'માર્ચ', 'એપ્રિલ', 'મે', 'જૂન', 'જુલાઈ', 'ઓગસ્ટ', 'સપ્ટેમ્બર', 'ઓક્ટોબર', 'નવેમ્બર', 'ડિસેમ્બર'];
    const monthIndex = d.getMonth();
    const year = d.getFullYear();
    if (lang === 'gu') {
      return `${monthNamesGu[monthIndex]} ${year}`;
    }
    return `${monthNamesEn[monthIndex]} ${year}`;
  } catch {
    return dateString;
  }
};

// Role / Designation Gujarati Translator
export const translateRole = (role?: string, lang: string = 'en'): string => {
  if (!role) return '-';
  if (lang !== 'gu') return role;

  const roleMap: Record<string, string> = {
    'Embroidery Machine Operator': 'એમ્બ્રોઈડરી મશીન ઓપરેટર',
    'Master Tailor / Cutting': 'માસ્ટર દરજી / કટિંગ',
    'Thread Trimming & Packing': 'દોરા કટિંગ અને પેકિંગ',
    'Helper / Dispatch': 'હેલ્પર / ડિસ્પેચ',
    'Supervisor': 'સુપરવાઈઝર',
    'Master / Designer': 'માસ્ટર / ડિઝાઇનર',
    'Threading / Finishing': 'થ્રેડિંગ / ફિનિશિંગ',
    'Cutting Master': 'કટિંગ માસ્ટર',
    'Packing / Dispatch': 'પેકિંગ / ડિસ્પેચ',
    'Manager': 'મેનેજર',
    'Tailor / Stitching': 'સિલાઈ કારીગર',
    'Accountant': 'એકાઉન્ટન્ટ',
    'Helper': 'હેલ્પર',
  };

  return roleMap[role] || role;
};

// Status Gujarati Translator
export const translateStatus = (status?: string, lang: string = 'en'): string => {
  if (!status) return '-';
  if (lang !== 'gu') return status;

  const statusMap: Record<string, string> = {
    'Active': 'સક્રિય',
    'Inactive': 'નિષ્ક્રિય',
    'Pending': 'બાકી',
    'Partial': 'અંશતઃ ચૂકવેલ',
    'Paid': 'ચૂકવેલ',
    'Unpaid': 'અણચૂકવેલ',
    'Completed': 'પૂર્ણ',
    'Cancelled': 'રદ કરેલ',
    'Draft': 'ડ્રાફ્ટ',
    'Received': 'મળેલ',
  };

  return statusMap[status] || status;
};

// Convert number to words (Indian Format)
export const numberToWords = (num: number): string => {
  if (isNaN(num) || num === 0) return 'Zero Rupees Only';
  const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const inWords = (n: number): string => {
    if (n < 20) return a[n];
    if (n < 100) return b[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + a[n % 10] : ' ');
    if (n < 1000) return a[Math.floor(n / 100)] + 'Hundred ' + (n % 100 !== 0 ? 'and ' + inWords(n % 100) : '');
    if (n < 100000) return inWords(Math.floor(n / 1000)) + 'Thousand ' + (n % 1000 !== 0 ? inWords(n % 1000) : '');
    if (n < 10000000) return inWords(Math.floor(n / 100000)) + 'Lakh ' + (n % 100000 !== 0 ? inWords(n % 100000) : '');
    return inWords(Math.floor(n / 10000000)) + 'Crore ' + (n % 10000000 !== 0 ? inWords(n % 10000000) : '');
  };

  const rupees = Math.floor(Math.abs(num));
  const words = inWords(rupees).trim();
  return (words ? words : 'Zero') + ' Rupees Only';
};

// Gujarati Terms Dictionary for Billing & Garment Textile Industry
export const gujaratiDictionary: Record<string, { en: string; gu: string }> = {
  dashboard: { en: 'Dashboard', gu: 'ડેશબોર્ડ' },
  billing: { en: 'Billing Management', gu: 'બિલિંગ મેનેજમેન્ટ' },
  purchase: { en: 'Material Purchase', gu: 'ખરીદી મેનેજમેન્ટ' },
  workers: { en: 'Worker Salary (Karigar Pagar)', gu: 'કારીગર પગાર' },
  parties: { en: 'Party Management', gu: 'પાર્ટી મેનેજમેન્ટ' },
  payments: { en: 'Payment Management', gu: 'ચુકવણી મેનેજમેન્ટ' },
  reports: { en: 'Reports & Export', gu: 'રિપોર્ટ્સ અને એક્સપોર્ટ' },
  settings: { en: 'Settings', gu: 'સેટિંગ્સ' },
  totalSales: { en: 'Total Sales', gu: 'કુલ વેચાણ' },
  totalPurchase: { en: 'Total Purchase', gu: 'કુલ ખરીદી' },
  totalSalary: { en: 'Total Worker Salary', gu: 'કુલ કારીગર પગાર' },
  pendingPayment: { en: 'Pending Payment', gu: 'બાકી ચૂકવણી' },
  monthlyIncome: { en: 'Monthly Income', gu: 'માસિક આવક' },
  advancePayment: { en: 'Advance Payment (Upad)', gu: 'ઉપાડ (એડવાન્સ)' },
  remainingSalary: { en: 'Remaining Salary', gu: 'બાકી પગાર' },
  bonus: { en: 'Bonus', gu: 'બોનસ' },
  invoiceNo: { en: 'Invoice No.', gu: 'ઇનવોઇસ નં.' },
  gstin: { en: 'GSTIN Number', gu: 'જીએસટી નંબર' },
  cgst: { en: 'CGST (2.5%)', gu: 'સીજીએસટી (૨.૫%)' },
  sgst: { en: 'SGST (2.5%)', gu: 'એસજીએસટી (૨.૫%)' },
  printInvoice: { en: 'Print Invoice', gu: 'પ્રિન્ટ ઇનવોઇસ' },
  downloadPdf: { en: 'Download PDF', gu: 'પીડીએફ ડાઉનલોડ' },
};
