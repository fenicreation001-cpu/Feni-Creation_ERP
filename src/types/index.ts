export interface BillItem {
  id: string;
  challanNo?: string;
  designNo?: string;
  description: string;
  hsnCode?: string;
  quantity: number;
  unit: string;
  rate: number;
  shortage?: number;
  discountPercent?: number;
  discountAmount?: number;
  amount: number;
}

export interface Bill {
  id: string;
  challanNo?: string;
  invoiceNo: string;
  partyId: string;
  partyName: string;
  partyGstin?: string;
  partyMobile?: string;
  partyAddress?: string;
  date: string;
  dueDate?: string;
  items: BillItem[];
  subtotal: number;
  cgst: number; // 2.5%
  sgst: number; // 2.5%
  totalTax: number; // 5.0%
  totalAmount: number;
  paidAmount: number;
  pendingAmount: number;
  status: 'Paid' | 'Pending' | 'Received' | 'Partial';
  notes?: string;
  extraCharges?: number;
  paymentMethod?: string;
  paymentDate?: string;
  chequeNo?: string;
  chequeDate?: string;
  chequeBank?: string;
}

export interface PurchaseItem {
  id?: string;
  challanDate?: string;
  challanNo?: string;
  description: string;
  quantity: number;
  unit?: string;
  rate: number;
  amount: number;
}

export interface Purchase {
  id: string;
  purchaseNo: string;
  supplierId: string;
  supplierName: string;
  supplierGstin?: string;
  date: string;
  materialName?: string;
  items: PurchaseItem[];
  subtotal: number;
  cgst: number;
  sgst: number;
  totalAmount: number;
  paidAmount: number;
  pendingAmount: number;
  status: 'Paid' | 'Pending' | 'Partial';
  notes?: string;
  paymentDate?: string;
  chequeNo?: string;
  paymentMethod?: string;
}

export interface AdvanceEntry {
  id: string;
  date: string; // e.g. '2026-05-10'
  amount: number; // e.g. 2000
  notes?: string; // e.g. 'Cash' or 'UPI'
}

export interface Worker {
  id: string;
  name: string;
  gujaratiName?: string;
  mobile: string;
  role: string;
  monthlySalary: number;
  advancePaid: number;
  advances?: AdvanceEntry[];
  bonus: number;
  paidSalaryAmount?: number;
  paymentMethod?: string;
  days?: number;
  remainingSalary: number;
  status: 'Paid' | 'Pending' | 'Partial' | 'Active';
  joiningDate: string;
}

export interface Party {
  id: string;
  name: string;
  contactPerson?: string;
  type: 'Textile Party' | 'Material Party';
  mobile: string;
  gstin?: string;
  address?: string;
  openingBalance?: number;
  createdAt: string;
}

export interface Payment {
  id: string;
  date: string;
  partyId: string;
  partyName: string;
  type: 'Received' | 'Paid';
  refInvoiceNo?: string;
  amount: number;
  paymentMethod: 'Cash' | 'UPI' | 'Bank Transfer' | 'Cheque';
  notes?: string;
}

export interface CompanySettings {
  companyName: string;
  tagline: string;
  gstin: string;
  email: string;
  phone: string;
  address: string;
  bankName: string;
  accountNo: string;
  ifscCode: string;
  hsnCode?: string;
  termsAndConditions?: string;
  logoUrl?: string;
  gujaratiSupport: boolean;
}

export interface ChartDataPoint {
  month: string;
  sales: number;
  purchase: number;
  salary: number;
}

export interface Activity {
  id: string;
  type: string;
  ref: string;
  party: string;
  amount: number;
  date: string;
  status: string;
}

export interface DashboardStats {
  totalSales: number;
  totalPurchase: number;
  totalWorkerSalary: number;
  pendingPayment: number;
  monthlyIncome: number;
  chartData: ChartDataPoint[];
  recentActivities: Activity[];
  isMongoConnected: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'Admin' | 'Staff';
}
