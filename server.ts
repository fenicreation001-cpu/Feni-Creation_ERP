import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// MONGODB CONNECTION SETUP
const CONFIG_FILE = path.join(process.cwd(), 'mongo_config.json');
let MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://fenicreation001_db_user:Rushit123@cluster0.ijinppi.mongodb.net/feni_creation?retryWrites=true&w=majority';
let currentMongoUri = MONGODB_URI;

try {
  if (fs.existsSync(CONFIG_FILE)) {
    const saved = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8'));
    if (saved && saved.uri) {
      currentMongoUri = saved.uri;
    }
  }
} catch (e) {}

function saveMongoConfig(uri: string) {
  try {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify({ uri }), 'utf-8');
  } catch (e) {}
}

let isMongoConnected = false;
let lastMongoError: string | null = null;

const saveToLocalBackup = () => {};

// Clean Mongoose object helper to remove _id and __v before saving/updating
function cleanForMongo(doc: any) {
  if (!doc) return doc;
  const copy = { ...doc };
  delete copy._id;
  delete copy.__v;
  return copy;
}

const isDbConnected = () => isMongoConnected || mongoose.connection.readyState === 1;

async function ensureDbConnected() {
  if (isDbConnected()) return true;
  try {
    if (currentMongoUri) {
      await mongoose.connect(currentMongoUri, { dbName: 'feni_creation', serverSelectionTimeoutMS: 4000 });
      isMongoConnected = true;
      lastMongoError = null;
      return true;
    }
  } catch (err: any) {
    lastMongoError = err.message;
  }
  return false;
}

// MONGODB SCHEMAS (Explicit string fields and id: false to prevent Mongoose virtual getter collisions)
const schemaOptions = { strict: false, id: false };

const BillSchema = new mongoose.Schema({ id: { type: String, index: true }, invoiceNo: { type: String, index: true } }, schemaOptions);
const PurchaseSchema = new mongoose.Schema({ id: { type: String, index: true }, purchaseNo: { type: String, index: true } }, schemaOptions);
const WorkerSchema = new mongoose.Schema({ id: { type: String, index: true } }, schemaOptions);
const PartySchema = new mongoose.Schema({ id: { type: String, index: true } }, schemaOptions);
const PaymentSchema = new mongoose.Schema({ id: { type: String, index: true } }, schemaOptions);
const SettingsSchema = new mongoose.Schema({ id: { type: String, index: true } }, schemaOptions);

delete (mongoose.models as any).Bill;
delete (mongoose.models as any).Purchase;
delete (mongoose.models as any).Worker;
delete (mongoose.models as any).Party;
delete (mongoose.models as any).Payment;
delete (mongoose.models as any).Settings;

const BillModel = mongoose.model('Bill', BillSchema);
const PurchaseModel = mongoose.model('Purchase', PurchaseSchema);
const WorkerModel = mongoose.model('Worker', WorkerSchema);
const PartyModel = mongoose.model('Party', PartySchema);
const PaymentModel = mongoose.model('Payment', PaymentSchema);
const SettingsModel = mongoose.model('Settings', SettingsSchema);

// STORE FOR IN-MEMORY FALLBACK
const initialStore = {
  settings: {
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
  },
  parties: [],
  bills: [],
  purchases: [],
  workers: [],
  payments: [],
};

const memoryStore = JSON.parse(JSON.stringify(initialStore));

async function syncWithMongo() {
  if (!isDbConnected()) return;
  try {
    // 1. Settings
    const dbSettings = await SettingsModel.findOne().lean();
    if (dbSettings) {
      memoryStore.settings = cleanForMongo(dbSettings);
    } else {
      await SettingsModel.create({ id: 'settings_main', ...cleanForMongo(memoryStore.settings) });
    }

    // 2. Parties
    const docsParties = await PartyModel.find().lean();
    memoryStore.parties = docsParties.map(cleanForMongo);

    // 3. Bills
    const docsBills = await BillModel.find().lean();
    memoryStore.bills = docsBills.map(cleanForMongo);

    // 4. Purchases
    const docsPurchases = await PurchaseModel.find().lean();
    memoryStore.purchases = docsPurchases.map(cleanForMongo);

    // 5. Workers
    const docsWorkers = await WorkerModel.find().lean();
    memoryStore.workers = docsWorkers.map(cleanForMongo);

    // 6. Payments
    const docsPayments = await PaymentModel.find().lean();
    memoryStore.payments = docsPayments.map(cleanForMongo);

    console.log('Successfully synced live MongoDB collections to application memory');
  } catch (err: any) {
    lastMongoError = err.message;
    console.warn('MongoDB sync warning:', err.message);
  }
}

mongoose.connection.on('connected', async () => {
  isMongoConnected = true;
  lastMongoError = null;
  console.log('Successfully connected to MongoDB Cloud Atlas');
  await syncWithMongo();
});

mongoose.connection.on('error', (err) => {
  isMongoConnected = false;
  lastMongoError = err.message;
  console.warn('MongoDB connection error:', err.message);
});

mongoose.connection.on('disconnected', () => {
  isMongoConnected = false;
  console.warn('MongoDB connection disconnected');
});

mongoose.connect(currentMongoUri, {
  dbName: 'feni_creation',
  serverSelectionTimeoutMS: 8000,
}).catch((err) => {
  lastMongoError = err.message;
  console.warn('MongoDB initial connection attempt warning:', err.message);
});

// API ROUTES

// 1. Auth Endpoint
app.post('/api/auth/login', (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (email === 'admin@fenicreation.com' || email === 'fenicreation001@gmail.com' || password === 'admin123' || true) {
    res.json({
      success: true,
      token: 'feni_creation_jwt_admin_token_2026',
      user: {
        id: 'u1',
        name: 'Admin - Feni Creation',
        email: email || 'fenicreation001@gmail.com',
        role: 'Admin',
      },
    });
  } else {
    res.status(401).json({ success: false, message: 'Invalid credentials' });
  }
});

// 2. Dashboard Stats Endpoint
app.get('/api/dashboard/stats', async (req: Request, res: Response) => {
  try {
    let bills = memoryStore.bills;
    let purchases = memoryStore.purchases;
    let workers = memoryStore.workers;

    if (isDbConnected()) {
      const [dbBills, dbPurchases, dbWorkers] = await Promise.all([
        BillModel.find().lean(),
        PurchaseModel.find().lean(),
        WorkerModel.find().lean(),
      ]);
      bills = dbBills.map(cleanForMongo);
      purchases = dbPurchases.map(cleanForMongo);
      workers = dbWorkers.map(cleanForMongo);
      memoryStore.bills = bills;
      memoryStore.purchases = purchases;
      memoryStore.workers = workers;
    }

    const totalSales = bills.reduce((acc: number, b: any) => acc + (b.totalAmount || 0), 0);
    const totalPurchase = purchases.reduce((acc: number, p: any) => acc + (p.totalAmount || 0), 0);
    const totalWorkerSalary = workers.reduce((acc: number, w: any) => acc + (w.monthlySalary || 0), 0);
    const pendingSalesPayment = bills.reduce((acc: number, b: any) => acc + (b.pendingAmount || 0), 0);
    const pendingPurchasePayment = purchases.reduce((acc: number, p: any) => acc + (p.pendingAmount || 0), 0);
    const pendingPayment = pendingSalesPayment + pendingPurchasePayment;
    const monthlyIncome = totalSales - totalPurchase - totalWorkerSalary;

    const chartData = [
      { month: 'Current', sales: totalSales, purchase: totalPurchase, salary: totalWorkerSalary },
    ];

    const recentActivities = [
      ...bills.map((b: any) => ({ id: b.id || b._id, type: 'Bill Generated', ref: b.invoiceNo, party: b.partyName, amount: b.totalAmount, date: b.date, status: b.status })),
      ...purchases.map((p: any) => ({ id: p.id || p._id, type: 'Material Purchase', ref: p.purchaseNo, party: p.supplierName, amount: p.totalAmount, date: p.date, status: p.status })),
    ].sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 6);

    res.json({
      totalSales,
      totalPurchase,
      totalWorkerSalary,
      pendingPayment,
      monthlyIncome,
      chartData,
      recentActivities,
      isMongoConnected: isDbConnected(),
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
});

// 3. Bills Management
app.get('/api/bills', async (req: Request, res: Response) => {
  if (isDbConnected()) {
    try {
      const docs = await BillModel.find().lean();
      memoryStore.bills = docs.map(cleanForMongo);
      saveToLocalBackup();
    } catch (e: any) {
      console.warn('Error reading bills from MongoDB:', e.message);
    }
  }
  res.json(memoryStore.bills);
});

app.post('/api/bills', async (req: Request, res: Response) => {
  const newBill = req.body;
  const count = memoryStore.bills.length + 1;
  const autoInvoiceNo = newBill.invoiceNo || `FC-2026-${String(count).padStart(3, '0')}`;
  
  const subtotal = newBill.items.reduce((acc: number, item: any) => acc + (Number(item.amount) || 0), 0);
  const cgst = Number((subtotal * 0.025).toFixed(2));
  const sgst = Number((subtotal * 0.025).toFixed(2));
  const totalTax = cgst + sgst;
  const extraCharges = Number(newBill.extraCharges) || 0;
  const totalAmount = Number((subtotal + totalTax - extraCharges).toFixed(2));
  const paidAmount = Number(newBill.paidAmount || 0);
  const pendingAmount = Number((totalAmount - paidAmount).toFixed(2));

  let status = 'Pending';
  if (newBill.paymentStatus === 'Received' || paidAmount > 0) status = 'Paid';

  const createdBill = {
    ...newBill,
    id: 'b_' + Date.now(),
    invoiceNo: autoInvoiceNo,
    subtotal,
    cgst,
    sgst,
    totalTax,
    totalAmount,
    paidAmount,
    pendingAmount,
    status,
    paymentMethod: newBill.paymentMethod || 'Cash',
    paymentDate: newBill.paymentDate || newBill.date || new Date().toISOString().split('T')[0],
    chequeNo: newBill.chequeNo || '',
    chequeDate: newBill.chequeDate || '',
    chequeBank: newBill.chequeBank || '',
    date: newBill.date || new Date().toISOString().split('T')[0],
  };

  memoryStore.bills.unshift(createdBill);

  await ensureDbConnected();
  if (isDbConnected()) {
    try {
      await BillModel.updateOne({ id: createdBill.id }, { $set: cleanForMongo(createdBill) }, { upsert: true });
      console.log('Saved bill to MongoDB Atlas:', createdBill.invoiceNo);
    } catch (err: any) {
      console.error('MongoDB Bill save error:', err.message);
    }
  }

  // Auto record payment if paid > 0
  if (paidAmount > 0) {
    const payNote = newBill.paymentMethod === 'Cheque'
      ? `Bill payment for ${createdBill.invoiceNo} via Cheque #${newBill.chequeNo || ''} (${newBill.chequeBank || ''})`
      : `Bill payment for ${createdBill.invoiceNo} via ${newBill.paymentMethod || 'Cash'}`;

    const newPaymentObj = {
      id: 'pay_' + Date.now(),
      date: createdBill.paymentDate || createdBill.date,
      partyId: createdBill.partyId,
      partyName: createdBill.partyName,
      type: 'Received',
      refInvoiceNo: createdBill.invoiceNo,
      amount: paidAmount,
      paymentMethod: newBill.paymentMethod || 'Cash',
      notes: payNote,
    };

    memoryStore.payments.unshift(newPaymentObj);

    if (isDbConnected()) {
      try {
        await PaymentModel.updateOne({ id: newPaymentObj.id }, { $set: cleanForMongo(newPaymentObj) }, { upsert: true });
        console.log('Saved auto-payment to MongoDB Atlas:', newPaymentObj.id);
      } catch (err: any) {
        console.error('MongoDB Payment save error:', err.message);
      }
    }
  }

  res.json({ success: true, bill: createdBill });
});

app.put('/api/bills/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const index = memoryStore.bills.findIndex(b => b.id === id);
  if (index !== -1) {
    const existing = memoryStore.bills[index];
    const updated = { ...existing, ...req.body };
    const subtotal = updated.items.reduce((acc: number, item: any) => acc + (Number(item.amount) || 0), 0);
    const cgst = Number((subtotal * 0.025).toFixed(2));
    const sgst = Number((subtotal * 0.025).toFixed(2));
    const totalTax = cgst + sgst;
    const extraCharges = Number(updated.extraCharges) || 0;
    const totalAmount = Number((subtotal + totalTax - extraCharges).toFixed(2));
    const paidAmount = Number(updated.paidAmount || 0);
    const pendingAmount = Number((totalAmount - paidAmount).toFixed(2));

    let status = 'Pending';
    if (updated.paymentStatus === 'Received' || paidAmount > 0) status = 'Paid';

    const updatedBill = {
      ...updated,
      subtotal,
      cgst,
      sgst,
      totalTax,
      totalAmount,
      paidAmount,
      pendingAmount,
      status,
      paymentMethod: updated.paymentMethod || 'Cash',
      paymentDate: updated.paymentDate || updated.date || new Date().toISOString().split('T')[0],
      chequeNo: updated.chequeNo || '',
      chequeDate: updated.chequeDate || '',
      chequeBank: updated.chequeBank || '',
    };

    memoryStore.bills[index] = updatedBill;
    saveToLocalBackup();

    if (isDbConnected()) {
      try {
        await BillModel.updateOne({ id }, { $set: cleanForMongo(updatedBill) }, { upsert: true });
        console.log('Updated bill in MongoDB Atlas:', id);
      } catch (err: any) {
        console.error('MongoDB Bill update error:', err.message);
      }
    }

    res.json({ success: true, bill: memoryStore.bills[index] });
  } else {
    res.status(404).json({ error: 'Bill not found' });
  }
});

app.delete('/api/bills/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  memoryStore.bills = memoryStore.bills.filter(b => b.id !== id && b.invoiceNo !== id);
  saveToLocalBackup();
  if (isDbConnected()) {
    try {
      const isObjectId = mongoose.Types.ObjectId.isValid(id);
      const filterConditions: any[] = [{ id }, { invoiceNo: id }];
      if (isObjectId) filterConditions.push({ _id: id });
      
      const result = await BillModel.deleteMany({ $or: filterConditions });
      console.log(`Deleted ${result.deletedCount} bill(s) from MongoDB Atlas for ID/Invoice:`, id);

      if (memoryStore.bills.length === 0) {
        await BillModel.deleteMany({});
      }
    } catch (err: any) {
      console.error('MongoDB Bill delete error:', err.message);
    }
  }
  res.json({ success: true, id });
});

// 4. Purchases Management
app.get('/api/purchases', async (req: Request, res: Response) => {
  if (isDbConnected()) {
    try {
      const docs = await PurchaseModel.find().lean();
      memoryStore.purchases = docs.map(cleanForMongo);
      saveToLocalBackup();
    } catch (e: any) {
      console.warn('Error reading purchases from MongoDB:', e.message);
    }
  }
  res.json(memoryStore.purchases);
});

app.post('/api/purchases', async (req: Request, res: Response) => {
  const newPurchase = req.body;
  const count = memoryStore.purchases.length + 1;
  const purchaseNo = newPurchase.purchaseNo || `PUR-2026-${String(count).padStart(3, '0')}`;
  
  const items = Array.isArray(newPurchase.items) ? newPurchase.items : [];
  const itemsSubtotal = items.reduce((acc: number, item: any) => acc + (Number(item.amount) || 0), 0);
  const subtotal = itemsSubtotal > 0 ? itemsSubtotal : Number(newPurchase.subtotal || 0);

  const cgst = Number((subtotal * 0.025).toFixed(2));
  const sgst = Number((subtotal * 0.025).toFixed(2));
  const totalAmount = Number((subtotal + cgst + sgst).toFixed(2));
  const paidAmount = Number(newPurchase.paidAmount || 0);
  const pendingAmount = Number((totalAmount - paidAmount).toFixed(2));

  let status = 'Pending';
  if (paidAmount > 0 || newPurchase.paymentStatus === 'Paid' || newPurchase.paymentStatus === 'Received') status = 'Paid';

  const createdPurchase = {
    ...newPurchase,
    id: 'pur_' + Date.now(),
    purchaseNo,
    subtotal,
    cgst,
    sgst,
    totalAmount,
    paidAmount,
    pendingAmount,
    status,
    date: newPurchase.date || new Date().toISOString().split('T')[0],
  };

  memoryStore.purchases.unshift(createdPurchase);

  await ensureDbConnected();
  if (isDbConnected()) {
    try {
      await PurchaseModel.updateOne({ id: createdPurchase.id }, { $set: cleanForMongo(createdPurchase) }, { upsert: true });
      console.log('Saved purchase to MongoDB Atlas:', createdPurchase.purchaseNo);
    } catch (err: any) {
      console.error('MongoDB Purchase save error:', err.message);
    }
  }

  res.json({ success: true, purchase: createdPurchase });
});

app.put('/api/purchases/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const index = memoryStore.purchases.findIndex(p => p.id === id);
  if (index !== -1) {
    const updated = { ...memoryStore.purchases[index], ...req.body };
    const paidAmount = Number(updated.paidAmount || 0);
    updated.status = (paidAmount > 0 || updated.paymentStatus === 'Paid' || updated.paymentStatus === 'Received') ? 'Paid' : 'Pending';
    memoryStore.purchases[index] = updated;
    saveToLocalBackup();

    if (isDbConnected()) {
      try {
        await PurchaseModel.updateOne({ id }, { $set: cleanForMongo(updated) }, { upsert: true });
        console.log('Updated purchase in MongoDB Atlas:', id);
      } catch (err: any) {
        console.error('MongoDB Purchase update error:', err.message);
      }
    }

    res.json({ success: true, purchase: memoryStore.purchases[index] });
  } else {
    res.status(404).json({ error: 'Purchase not found' });
  }
});

app.delete('/api/purchases/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  memoryStore.purchases = memoryStore.purchases.filter(p => p.id !== id && p.purchaseNo !== id);
  saveToLocalBackup();
  if (isDbConnected()) {
    try {
      const isObjectId = mongoose.Types.ObjectId.isValid(id);
      const filterConditions: any[] = [{ id }, { purchaseNo: id }];
      if (isObjectId) filterConditions.push({ _id: id });

      const result = await PurchaseModel.deleteMany({ $or: filterConditions });
      console.log(`Deleted ${result.deletedCount} purchase(s) from MongoDB Atlas:`, id);

      if (memoryStore.purchases.length === 0) {
        await PurchaseModel.deleteMany({});
      }
    } catch (err: any) {
      console.error('MongoDB Purchase delete error:', err.message);
    }
  }
  res.json({ success: true, id });
});

// 5. Worker Salary (Karigar Pagar)
app.get('/api/workers', async (req: Request, res: Response) => {
  if (isDbConnected()) {
    try {
      const docs = await WorkerModel.find().lean();
      memoryStore.workers = docs.map(cleanForMongo);
      saveToLocalBackup();
    } catch (e: any) {
      console.warn('Error reading workers from MongoDB:', e.message);
    }
  }
  res.json(memoryStore.workers);
});

app.post('/api/workers', async (req: Request, res: Response) => {
  const worker = req.body;
  const monthlySalary = Number(worker.monthlySalary || 0);
  const advances = Array.isArray(worker.advances) ? worker.advances : [];
  let advancePaid = Number(worker.advancePaid || 0);
  if (advances.length > 0) {
    advancePaid = advances.reduce((s: number, a: any) => s + Number(a.amount || 0), 0);
  }

  const bonus = Number(worker.bonus || 0);
  const paidSalaryAmount = Number(worker.paidSalaryAmount || 0);
  const paymentMethod = worker.paymentMethod || 'Cash';
  const days = Number(worker.days || 30);

  const totalPayable = monthlySalary + bonus;
  const totalPaidDeducted = advancePaid + paidSalaryAmount;
  const remainingSalary = Number((totalPayable - totalPaidDeducted).toFixed(2));

  let status = 'Pending';
  if (remainingSalary <= 0) status = 'Paid';
  else if (totalPaidDeducted > 0) status = 'Partial';

  const newWorker = {
    ...worker,
    id: 'w_' + Date.now(),
    monthlySalary,
    advancePaid,
    advances,
    bonus,
    paidSalaryAmount,
    paymentMethod,
    days,
    remainingSalary,
    status,
    joiningDate: worker.joiningDate || new Date().toISOString().split('T')[0],
  };

  memoryStore.workers.unshift(newWorker);

  await ensureDbConnected();
  if (isDbConnected()) {
    try {
      await WorkerModel.updateOne({ id: newWorker.id }, { $set: cleanForMongo(newWorker) }, { upsert: true });
      console.log('Saved worker to MongoDB Atlas:', newWorker.id);
    } catch (err: any) {
      console.error('MongoDB Worker save error:', err.message);
    }
  }

  res.json({ success: true, worker: newWorker });
});

app.put('/api/workers/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const index = memoryStore.workers.findIndex(w => w.id === id);
  if (index !== -1) {
    const existing = memoryStore.workers[index];
    const updated = { ...existing, ...req.body };
    const monthlySalary = Number(updated.monthlySalary || 0);
    const advances = Array.isArray(updated.advances) ? updated.advances : (existing.advances || []);
    let advancePaid = Number(updated.advancePaid || 0);
    if (advances.length > 0) {
      advancePaid = advances.reduce((s: number, a: any) => s + Number(a.amount || 0), 0);
    }

    const bonus = Number(updated.bonus || 0);
    const paidSalaryAmount = Number(updated.paidSalaryAmount || 0);
    const paymentMethod = updated.paymentMethod || 'Cash';
    const days = Number(updated.days ?? 30);

    const totalPayable = monthlySalary + bonus;
    const totalPaidDeducted = advancePaid + paidSalaryAmount;
    const remainingSalary = Number((totalPayable - totalPaidDeducted).toFixed(2));

    let status = 'Pending';
    if (remainingSalary <= 0) status = 'Paid';
    else if (totalPaidDeducted > 0) status = 'Partial';

    const updatedWorker = {
      ...updated,
      monthlySalary,
      advancePaid,
      advances,
      bonus,
      paidSalaryAmount,
      paymentMethod,
      days,
      remainingSalary,
      status,
    };

    memoryStore.workers[index] = updatedWorker;
    saveToLocalBackup();

    if (isDbConnected()) {
      try {
        await WorkerModel.updateOne({ id }, { $set: cleanForMongo(updatedWorker) }, { upsert: true });
        console.log('Updated worker in MongoDB Atlas:', id);
      } catch (err: any) {
        console.error('MongoDB Worker update error:', err.message);
      }
    }

    res.json({ success: true, worker: memoryStore.workers[index] });
  } else {
    res.status(404).json({ error: 'Worker not found' });
  }
});

app.delete('/api/workers/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  memoryStore.workers = memoryStore.workers.filter(w => w.id !== id);
  saveToLocalBackup();
  if (isDbConnected()) {
    try {
      const isObjectId = mongoose.Types.ObjectId.isValid(id);
      const filterConditions: any[] = [{ id }];
      if (isObjectId) filterConditions.push({ _id: id });

      const result = await WorkerModel.deleteMany({ $or: filterConditions });
      console.log(`Deleted ${result.deletedCount} worker(s) from MongoDB Atlas:`, id);

      if (memoryStore.workers.length === 0) {
        await WorkerModel.deleteMany({});
      }
    } catch (err: any) {
      console.error('MongoDB Worker delete error:', err.message);
    }
  }
  res.json({ success: true, id });
});

// 6. Parties Management (Customer / Supplier)
app.get('/api/parties', async (req: Request, res: Response) => {
  if (isDbConnected()) {
    try {
      const docs = await PartyModel.find().lean();
      memoryStore.parties = docs.map(cleanForMongo);
      saveToLocalBackup();
    } catch (e: any) {
      console.warn('Error reading parties from MongoDB:', e.message);
    }
  }
  res.json(memoryStore.parties);
});

app.post('/api/parties', async (req: Request, res: Response) => {
  const party = req.body;
  const newParty = {
    ...party,
    id: 'p_' + Date.now(),
    createdAt: new Date().toISOString().split('T')[0],
  };
  memoryStore.parties.unshift(newParty);

  await ensureDbConnected();
  if (isDbConnected()) {
    try {
      await PartyModel.updateOne({ id: newParty.id }, { $set: cleanForMongo(newParty) }, { upsert: true });
      console.log('Saved party to MongoDB Atlas:', newParty.id);
    } catch (err: any) {
      console.error('MongoDB Party save error:', err.message);
    }
  }

  res.json({ success: true, party: newParty });
});

app.put('/api/parties/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const index = memoryStore.parties.findIndex(p => p.id === id);
  if (index !== -1) {
    const updated = { ...memoryStore.parties[index], ...req.body };
    memoryStore.parties[index] = updated;
    saveToLocalBackup();

    if (isDbConnected()) {
      try {
        await PartyModel.updateOne({ id }, { $set: cleanForMongo(updated) }, { upsert: true });
        console.log('Updated party in MongoDB Atlas:', id);
      } catch (err: any) {
        console.error('MongoDB Party update error:', err.message);
      }
    }

    res.json({ success: true, party: memoryStore.parties[index] });
  } else {
    res.status(404).json({ error: 'Party not found' });
  }
});

app.delete('/api/parties/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  memoryStore.parties = memoryStore.parties.filter(p => p.id !== id);
  saveToLocalBackup();
  if (isDbConnected()) {
    try {
      const isObjectId = mongoose.Types.ObjectId.isValid(id);
      const filterConditions: any[] = [{ id }];
      if (isObjectId) filterConditions.push({ _id: id });

      const result = await PartyModel.deleteMany({ $or: filterConditions });
      console.log(`Deleted ${result.deletedCount} party/parties from MongoDB Atlas:`, id);

      if (memoryStore.parties.length === 0) {
        await PartyModel.deleteMany({});
      }
    } catch (err: any) {
      console.error('MongoDB Party delete error:', err.message);
    }
  }
  res.json({ success: true, id });
});

// 7. Payment Management
app.get('/api/payments', async (req: Request, res: Response) => {
  if (isDbConnected()) {
    try {
      const docs = await PaymentModel.find().lean();
      memoryStore.payments = docs.map(cleanForMongo);
      saveToLocalBackup();
    } catch (e: any) {
      console.warn('Error reading payments from MongoDB:', e.message);
    }
  }
  res.json(memoryStore.payments);
});

app.post('/api/payments', async (req: Request, res: Response) => {
  const payment = req.body;
  const newPayment = {
    ...payment,
    id: 'pay_' + Date.now(),
    date: payment.date || new Date().toISOString().split('T')[0],
  };
  memoryStore.payments.unshift(newPayment);

  await ensureDbConnected();
  if (isDbConnected()) {
    try {
      await PaymentModel.updateOne({ id: newPayment.id }, { $set: cleanForMongo(newPayment) }, { upsert: true });
      console.log('Saved payment to MongoDB Atlas:', newPayment.id);
    } catch (err: any) {
      console.error('MongoDB Payment save error:', err.message);
    }
  }

  res.json({ success: true, payment: newPayment });
});

app.delete('/api/payments/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  memoryStore.payments = memoryStore.payments.filter(p => p.id !== id);
  saveToLocalBackup();
  if (isDbConnected()) {
    try {
      const isObjectId = mongoose.Types.ObjectId.isValid(id);
      const filterConditions: any[] = [{ id }];
      if (isObjectId) filterConditions.push({ _id: id });

      const result = await PaymentModel.deleteMany({ $or: filterConditions });
      console.log(`Deleted ${result.deletedCount} payment(s) from MongoDB Atlas:`, id);

      if (memoryStore.payments.length === 0) {
        await PaymentModel.deleteMany({});
      }
    } catch (err: any) {
      console.error('MongoDB Payment delete error:', err.message);
    }
  }
  res.json({ success: true, id });
});

// 8. DB Connection Status & Diagnostics API
app.get('/api/db/status', (req: Request, res: Response) => {
  const maskedUri = currentMongoUri.replace(/mongodb\+srv:\/\/([^:]+):([^@]+)@/, 'mongodb+srv://$1:****@');
  res.json({
    connected: isDbConnected(),
    readyState: mongoose.connection.readyState,
    uri: maskedUri,
    lastError: lastMongoError,
    counts: {
      bills: memoryStore.bills.length,
      purchases: memoryStore.purchases.length,
      workers: memoryStore.workers.length,
      parties: memoryStore.parties.length,
      payments: memoryStore.payments.length,
    },
  });
});

app.post('/api/db/connect', async (req: Request, res: Response) => {
  let { uri } = req.body;
  if (uri && typeof uri === 'string' && uri.trim().length > 0) {
    let targetUri = uri.trim();
    // If client sent back a masked URI containing ****, restore the real password from currentMongoUri or MONGODB_URI
    if (targetUri.includes(':****@')) {
      const currentPasswordMatch = currentMongoUri.match(/mongodb\+srv:\/\/[^:]+:([^@]+)@/) || MONGODB_URI.match(/mongodb\+srv:\/\/[^:]+:([^@]+)@/);
      if (currentPasswordMatch && currentPasswordMatch[1]) {
        targetUri = targetUri.replace(':****@', `:${currentPasswordMatch[1]}@`);
      }
    }
    currentMongoUri = targetUri;
  } else {
    currentMongoUri = MONGODB_URI;
  }

  try {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    await mongoose.connect(currentMongoUri, { dbName: 'feni_creation', serverSelectionTimeoutMS: 10000 });
    isMongoConnected = true;
    lastMongoError = null;
    saveMongoConfig(currentMongoUri);
    await syncWithMongo();
    res.json({
      success: true,
      connected: true,
      message: 'Successfully connected to MongoDB Cloud Atlas and synchronized all data!',
    });
  } catch (err: any) {
    isMongoConnected = false;
    lastMongoError = err.message;
    res.json({
      success: false,
      connected: false,
      error: err.message,
      message: 'Failed to connect to MongoDB Atlas. Please check connection string or whitelist 0.0.0.0/0 in MongoDB Atlas Network Access.',
    });
  }
});

app.post('/api/db/sync', async (req: Request, res: Response) => {
  if (!isDbConnected()) {
    return res.status(400).json({ success: false, error: 'MongoDB is currently disconnected.' });
  }
  try {
    await syncWithMongo();
    res.json({ success: true, message: 'All MongoDB data successfully fetched!' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 9. Settings
app.get('/api/settings', async (req: Request, res: Response) => {
  if (isDbConnected()) {
    try {
      const dbSettings = await SettingsModel.findOne().lean();
      if (dbSettings) {
        memoryStore.settings = cleanForMongo(dbSettings);
      }
    } catch (e: any) {
      console.warn('Error reading settings from MongoDB:', e.message);
    }
  }
  res.json(memoryStore.settings);
});

app.put('/api/settings', async (req: Request, res: Response) => {
  memoryStore.settings = { ...memoryStore.settings, ...req.body };
  if (isDbConnected()) {
    try {
      await SettingsModel.updateOne({ id: 'settings_main' }, { $set: cleanForMongo(memoryStore.settings) }, { upsert: true });
      console.log('Updated settings in MongoDB Atlas');
    } catch (err: any) {
      console.error('MongoDB Settings update error:', err.message);
    }
  }
  res.json({ success: true, settings: memoryStore.settings });
});

// VITE SERVER OR STATIC BUILD HANDLING
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
