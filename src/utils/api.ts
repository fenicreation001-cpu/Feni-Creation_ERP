import { Bill, CompanySettings, Party, Payment, Purchase, Worker } from '../types';

// API BASE URL from environment variable (e.g. VITE_API_BASE_URL) if deployed separately
const API_BASE = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');

// Default Initial Company Settings
const defaultSettings: CompanySettings = {
  companyName: 'FENI CREATION',
  tagline: 'Embroidery & Textile Manufacturing',
  gstin: '24ABCDE1234F1Z5',
  email: 'fenicreation001@gmail.com',
  phone: '+91 98765 43210',
  address: 'Plot No. 124, GIDC Industrial Estate, Varachha, Surat - 395006, Gujarat, India',
  bankName: 'State Bank of India',
  accountNo: '39485726102',
  ifscCode: 'SBIN0001234',
  hsnCode: '9988',
  termsAndConditions: '1. Any complaint regarding and should brought to our notice in written within 2 days.\n2. We are not responsible for Payment to unauthorized.\n3. Interest at 2.0 % per month charged on account not paid within due course.\n4. Subject to Surat Jurisdiction.',
  logoUrl: '',
  gujaratiSupport: true,
};

// Client-side Local Storage helpers
const getLocal = <T>(key: string, fallback: T): T => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch {
    return fallback;
  }
};

const setLocal = <T>(key: string, value: T): void => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
};

// Safe fetch wrapper that handles non-JSON / HTML responses (e.g. Netlify static server fallback)
async function safeFetchJson<T>(url: string, options?: RequestInit): Promise<T | null> {
  try {
    const fullUrl = API_BASE ? `${API_BASE}${url}` : url;
    const response = await fetch(fullUrl, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options?.headers || {}),
      },
    });

    const contentType = response.headers.get('content-type') || '';
    if (response.ok && contentType.includes('application/json')) {
      return (await response.json()) as T;
    }
  } catch (err) {
    console.warn(`API request to ${url} failed or returned non-JSON. Falling back to local storage mode.`, err);
  }
  return null;
}

export const apiClient = {
  // SETTINGS
  async getSettings(): Promise<CompanySettings> {
    const remote = await safeFetchJson<CompanySettings>('/api/settings');
    if (remote && remote.companyName) {
      setLocal('feni_settings', remote);
      return remote;
    }
    return getLocal<CompanySettings>('feni_settings', defaultSettings);
  },

  async updateSettings(settings: CompanySettings): Promise<CompanySettings> {
    const remote = await safeFetchJson<{ success: boolean; data: CompanySettings }>('/api/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
    const updated = remote?.data || settings;
    setLocal('feni_settings', updated);
    return updated;
  },

  // PARTIES
  async getParties(): Promise<Party[]> {
    const remote = await safeFetchJson<Party[]>('/api/parties');
    if (remote && Array.isArray(remote)) {
      setLocal('feni_parties', remote);
      return remote;
    }
    return getLocal<Party[]>('feni_parties', []);
  },

  async saveParty(party: Partial<Party>): Promise<Party> {
    const isEdit = !!party.id;
    const method = isEdit ? 'PUT' : 'POST';
    const endpoint = isEdit ? `/api/parties/${party.id}` : '/api/parties';

    const remote = await safeFetchJson<Party>(endpoint, {
      method,
      body: JSON.stringify(party),
    });

    const current = getLocal<Party[]>('feni_parties', []);
    let updatedItem: Party;

    if (remote && remote.id) {
      updatedItem = remote;
    } else {
      updatedItem = {
        id: party.id || 'p_' + Date.now(),
        name: party.name || '',
        contactPerson: party.contactPerson || '',
        type: party.type || 'Textile Party',
        mobile: party.mobile || '',
        gstin: party.gstin || '',
        address: party.address || '',
        openingBalance: party.openingBalance || 0,
        createdAt: party.createdAt || new Date().toISOString().split('T')[0],
      };
    }

    const nextList = isEdit
      ? current.map((p) => (p.id === updatedItem.id ? updatedItem : p))
      : [updatedItem, ...current];

    setLocal('feni_parties', nextList);
    return updatedItem;
  },

  async deleteParty(id: string): Promise<boolean> {
    await safeFetchJson(`/api/parties/${id}`, { method: 'DELETE' });
    const current = getLocal<Party[]>('feni_parties', []);
    setLocal('feni_parties', current.filter((p) => p.id !== id));
    return true;
  },

  // BILLS
  async getBills(): Promise<Bill[]> {
    const remote = await safeFetchJson<Bill[]>('/api/bills');
    if (remote && Array.isArray(remote)) {
      setLocal('feni_bills', remote);
      return remote;
    }
    return getLocal<Bill[]>('feni_bills', []);
  },

  async saveBill(bill: Partial<Bill>): Promise<Bill> {
    const isEdit = !!bill.id;
    const method = isEdit ? 'PUT' : 'POST';
    const endpoint = isEdit ? `/api/bills/${bill.id}` : '/api/bills';

    const remote = await safeFetchJson<Bill>(endpoint, {
      method,
      body: JSON.stringify(bill),
    });

    const current = getLocal<Bill[]>('feni_bills', []);
    let updatedItem: Bill;

    if (remote && remote.id) {
      updatedItem = remote;
    } else {
      updatedItem = {
        id: bill.id || 'b_' + Date.now(),
        invoiceNo: bill.invoiceNo || 'FC-' + Date.now(),
        partyId: bill.partyId || '',
        partyName: bill.partyName || '',
        date: bill.date || new Date().toISOString().split('T')[0],
        dueDate: bill.dueDate || '',
        items: bill.items || [],
        subtotal: bill.subtotal || 0,
        taxRate: bill.taxRate || 0,
        totalTax: bill.totalTax || 0,
        totalAmount: bill.totalAmount || 0,
        paidAmount: bill.paidAmount || 0,
        pendingAmount: bill.pendingAmount || 0,
        status: bill.status || 'Pending',
        notes: bill.notes || '',
        chargeAmount: bill.chargeAmount || 0,
        createdAt: bill.createdAt || new Date().toISOString(),
      };
    }

    const nextList = isEdit
      ? current.map((b) => (b.id === updatedItem.id ? updatedItem : b))
      : [updatedItem, ...current];

    setLocal('feni_bills', nextList);
    return updatedItem;
  },

  async deleteBill(id: string): Promise<boolean> {
    await safeFetchJson(`/api/bills/${id}`, { method: 'DELETE' });
    const current = getLocal<Bill[]>('feni_bills', []);
    setLocal('feni_bills', current.filter((b) => b.id !== id));
    return true;
  },

  // PURCHASES
  async getPurchases(): Promise<Purchase[]> {
    const remote = await safeFetchJson<Purchase[]>('/api/purchases');
    if (remote && Array.isArray(remote)) {
      setLocal('feni_purchases', remote);
      return remote;
    }
    return getLocal<Purchase[]>('feni_purchases', []);
  },

  async savePurchase(purchase: Partial<Purchase>): Promise<Purchase> {
    const isEdit = !!purchase.id;
    const method = isEdit ? 'PUT' : 'POST';
    const endpoint = isEdit ? `/api/purchases/${purchase.id}` : '/api/purchases';

    const remote = await safeFetchJson<Purchase>(endpoint, {
      method,
      body: JSON.stringify(purchase),
    });

    const current = getLocal<Purchase[]>('feni_purchases', []);
    let updatedItem: Purchase;

    if (remote && remote.id) {
      updatedItem = remote;
    } else {
      updatedItem = {
        id: purchase.id || 'pur_' + Date.now(),
        purchaseNo: purchase.purchaseNo || 'PUR-' + Date.now(),
        supplierId: purchase.supplierId || '',
        supplierName: purchase.supplierName || '',
        supplierGstin: purchase.supplierGstin || '',
        date: purchase.date || new Date().toISOString().split('T')[0],
        items: purchase.items || [],
        subtotal: purchase.subtotal || 0,
        taxRate: purchase.taxRate || 0,
        totalTax: purchase.totalTax || 0,
        totalAmount: purchase.totalAmount || 0,
        paidAmount: purchase.paidAmount || 0,
        pendingAmount: purchase.pendingAmount || 0,
        status: purchase.status || 'Pending',
        paymentMethod: purchase.paymentMethod || 'Cash',
        notes: purchase.notes || '',
        createdAt: purchase.createdAt || new Date().toISOString(),
      };
    }

    const nextList = isEdit
      ? current.map((p) => (p.id === updatedItem.id ? updatedItem : p))
      : [updatedItem, ...current];

    setLocal('feni_purchases', nextList);
    return updatedItem;
  },

  async deletePurchase(id: string): Promise<boolean> {
    await safeFetchJson(`/api/purchases/${id}`, { method: 'DELETE' });
    const current = getLocal<Purchase[]>('feni_purchases', []);
    setLocal('feni_purchases', current.filter((p) => p.id !== id));
    return true;
  },

  // WORKERS
  async getWorkers(): Promise<Worker[]> {
    const remote = await safeFetchJson<Worker[]>('/api/workers');
    if (remote && Array.isArray(remote)) {
      setLocal('feni_workers', remote);
      return remote;
    }
    return getLocal<Worker[]>('feni_workers', []);
  },

  async saveWorker(worker: Partial<Worker>): Promise<Worker> {
    const isEdit = !!worker.id;
    const method = isEdit ? 'PUT' : 'POST';
    const endpoint = isEdit ? `/api/workers/${worker.id}` : '/api/workers';

    const remote = await safeFetchJson<Worker>(endpoint, {
      method,
      body: JSON.stringify(worker),
    });

    const current = getLocal<Worker[]>('feni_workers', []);
    let updatedItem: Worker;

    if (remote && remote.id) {
      updatedItem = remote;
    } else {
      const monthlySalary = Number(worker.monthlySalary || 0);
      const advancePaid = Number(worker.advancePaid || 0);
      const bonus = Number(worker.bonus || 0);
      const paidSalaryAmount = Number(worker.paidSalaryAmount || 0);
      const days = Number(worker.days ?? 30);
      const totalPayable = monthlySalary + bonus;
      const totalPaidDeducted = advancePaid + paidSalaryAmount;
      const remainingSalary = totalPayable - totalPaidDeducted;
      let status: 'Paid' | 'Pending' | 'Partial' | 'Active' = 'Pending';
      if (remainingSalary <= 0) status = 'Paid';
      else if (totalPaidDeducted > 0) status = 'Partial';

      updatedItem = {
        id: worker.id || 'w_' + Date.now(),
        name: worker.name || '',
        gujaratiName: worker.gujaratiName || '',
        role: worker.role || 'Embroidery Machine Operator',
        mobile: worker.mobile || '',
        joiningDate: worker.joiningDate || new Date().toISOString().split('T')[0],
        monthlySalary,
        advancePaid,
        advances: worker.advances || [],
        bonus,
        paidSalaryAmount,
        paymentMethod: worker.paymentMethod || 'Cash',
        days,
        remainingSalary,
        status,
      };
    }

    const nextList = isEdit
      ? current.map((w) => (w.id === updatedItem.id ? updatedItem : w))
      : [updatedItem, ...current];

    setLocal('feni_workers', nextList);
    return updatedItem;
  },

  async deleteWorker(id: string): Promise<boolean> {
    await safeFetchJson(`/api/workers/${id}`, { method: 'DELETE' });
    const current = getLocal<Worker[]>('feni_workers', []);
    setLocal('feni_workers', current.filter((w) => w.id !== id));
    return true;
  },

  // PAYMENTS
  async getPayments(): Promise<Payment[]> {
    const remote = await safeFetchJson<Payment[]>('/api/payments');
    if (remote && Array.isArray(remote)) {
      setLocal('feni_payments', remote);
      return remote;
    }
    return getLocal<Payment[]>('feni_payments', []);
  },

  async savePayment(payment: Partial<Payment>): Promise<Payment> {
    const isEdit = !!payment.id;
    const method = isEdit ? 'PUT' : 'POST';
    const endpoint = isEdit ? `/api/payments/${payment.id}` : '/api/payments';

    const remote = await safeFetchJson<Payment>(endpoint, {
      method,
      body: JSON.stringify(payment),
    });

    const current = getLocal<Payment[]>('feni_payments', []);
    let updatedItem: Payment;

    if (remote && remote.id) {
      updatedItem = remote;
    } else {
      updatedItem = {
        id: payment.id || 'pay_' + Date.now(),
        date: payment.date || new Date().toISOString().split('T')[0],
        partyId: payment.partyId || '',
        partyName: payment.partyName || '',
        type: payment.type || 'Received',
        refInvoiceNo: payment.refInvoiceNo || '',
        amount: Number(payment.amount || 0),
        paymentMethod: payment.paymentMethod || 'UPI',
        notes: payment.notes || '',
        createdAt: payment.createdAt || new Date().toISOString(),
      };
    }

    const nextList = isEdit
      ? current.map((p) => (p.id === updatedItem.id ? updatedItem : p))
      : [updatedItem, ...current];

    setLocal('feni_payments', nextList);
    return updatedItem;
  },

  async deletePayment(id: string): Promise<boolean> {
    await safeFetchJson(`/api/payments/${id}`, { method: 'DELETE' });
    const current = getLocal<Payment[]>('feni_payments', []);
    setLocal('feni_payments', current.filter((p) => p.id !== id));
    return true;
  },

  // DASHBOARD STATS
  async getDashboardStats() {
    const remote = await safeFetchJson<any>('/api/dashboard/stats');
    if (remote && remote.totalSales !== undefined) {
      return remote;
    }

    const bills = getLocal<Bill[]>('feni_bills', []);
    const purchases = getLocal<Purchase[]>('feni_purchases', []);
    const workers = getLocal<Worker[]>('feni_workers', []);

    const totalSales = bills.reduce((acc, b) => acc + (b.totalAmount || 0), 0);
    const totalPurchase = purchases.reduce((acc, p) => acc + (p.totalAmount || 0), 0);
    const totalWorkerSalary = workers.reduce((acc, w) => acc + (w.monthlySalary || 0), 0);
    const pendingPayment = bills.reduce((acc, b) => acc + (b.pendingAmount || 0), 0);
    const monthlyIncome = totalSales - totalPurchase - totalWorkerSalary;

    return {
      totalSales,
      totalPurchase,
      totalWorkerSalary,
      pendingPayment,
      monthlyIncome,
      chartData: [
        { month: 'Jan', sales: 120000, purchase: 45000, salary: 35000 },
        { month: 'Feb', sales: 145000, purchase: 52000, salary: 38000 },
        { month: 'Mar', sales: 160000, purchase: 60000, salary: 40000 },
        { month: 'Apr', sales: 135000, purchase: 48000, salary: 42000 },
        { month: 'May', sales: 180000, purchase: 70000, salary: 45000 },
        { month: 'Jun', sales: 195000, purchase: 75000, salary: 48000 },
        { month: 'Jul', sales: totalSales || 118650, purchase: totalPurchase || 38850, salary: totalWorkerSalary || 52000 },
      ],
      recentActivities: bills.slice(0, 5).map((b) => ({
        id: b.id,
        type: 'Bill Generated',
        ref: b.invoiceNo,
        party: b.partyName,
        amount: b.totalAmount,
        date: b.date,
        status: b.status,
      })),
      isMongoConnected: false,
    };
  },
};
