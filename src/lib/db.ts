import Dexie, { type Table } from 'dexie';

// ============================================
// DATABASE TYPES
// ============================================

export interface Item {
  id: string;
  name: string;
  category: string;
  basePrice: number;
  gstRate: number; // 0, 5, 12, 18, 28
  hsnCode?: string;
  unit: string;
  variants: ItemVariant[];
  totalStock: number;
  lowStockThreshold: number;
  createdAt: number;
  updatedAt: number;
}

export interface ItemVariant {
  size: string;
  color: string;
  sku: string;
  stock: number;
  price?: number; // Override base price
}

export interface Customer {
  id: string;
  name: string;
  phone: string; // E.164 format
  email?: string;
  address?: string;
  tag: 'new' | 'regular' | 'vip';
  totalPurchases: number;
  outstandingAmount: number;
  lastVisit?: number;
  createdAt: number;
}

export interface Bill {
  id: string;
  invoiceNumber: string;
  customerId?: string;
  customerName?: string;
  customerPhone?: string;
  items: BillItem[];
  subtotal: number;
  discountAmount: number;
  discountPercent: number;
  taxAmount: number;
  totalAmount: number;
  paidAmount: number;
  paymentMethod: 'cash' | 'upi' | 'card' | 'credit';
  status: 'completed' | 'pending' | 'cancelled';
  syncStatus: 'synced' | 'pending';
  createdAt: number;
  createdBy: string;
}

export interface BillItem {
  itemId: string;
  name: string;
  variant?: { size: string; color: string };
  quantity: number;
  unitPrice: number;
  gstRate: number;
  gstAmount: number;
  discount: number;
  total: number;
}

export interface Vendor {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  gstNumber?: string;
  createdAt: number;
}

export interface Purchase {
  id: string;
  vendorId: string;
  vendorName: string;
  items: PurchaseItem[];
  totalAmount: number;
  paidAmount: number;
  status: 'received' | 'pending' | 'partial';
  invoiceNumber?: string;
  createdAt: number;
}

export interface PurchaseItem {
  itemId: string;
  name: string;
  variant?: { size: string; color: string };
  quantity: number;
  costPrice: number;
  total: number;
}

export interface Expense {
  id: string;
  category: string;
  description: string;
  amount: number;
  paymentMethod: 'cash' | 'upi' | 'card';
  date: number;
  createdAt: number;
}

export interface Staff {
  id: string;
  name: string;
  phone: string;
  role: 'staff' | 'manager';
  salary: number;
  joiningDate: number;
  permissions: string[];
  isActive: boolean;
  createdAt: number;
}

export interface Attendance {
  id: string;
  staffId: string;
  date: string; // YYYY-MM-DD
  checkIn?: number;
  checkOut?: number;
  status: 'present' | 'absent' | 'late' | 'half-day';
  notes?: string;
}

export interface Settings {
  id: string;
  shopName: string;
  gstin?: string;
  address?: string;
  phone?: string;
  email?: string;
  invoicePrefix: string;
  invoiceCounter: number;
  autoWhatsApp: boolean;
  useMockAI: boolean;
  thermalPrinterWidth: 58 | 80;
  lastBackup?: number;
}

export interface AppUser {
  id: string;
  phone: string;
  name: string;
  role: 'owner' | 'staff';
  staffId?: string;
  isLoggedIn: boolean;
  loginAt: number;
}

// ============================================
// DATABASE CLASS
// ============================================

class RevonnDatabase extends Dexie {
  items!: Table<Item>;
  customers!: Table<Customer>;
  bills!: Table<Bill>;
  vendors!: Table<Vendor>;
  purchases!: Table<Purchase>;
  expenses!: Table<Expense>;
  staff!: Table<Staff>;
  attendance!: Table<Attendance>;
  settings!: Table<Settings>;
  users!: Table<AppUser>;

  constructor() {
    super('RevonnDB');
    
    this.version(1).stores({
      items: 'id, name, category, createdAt',
      customers: 'id, name, phone, tag, createdAt',
      bills: 'id, invoiceNumber, customerId, status, syncStatus, createdAt',
      vendors: 'id, name, phone, createdAt',
      purchases: 'id, vendorId, status, createdAt',
      expenses: 'id, category, date, createdAt',
      staff: 'id, phone, isActive, createdAt',
      attendance: 'id, staffId, date',
      settings: 'id',
      users: 'id, phone, isLoggedIn'
    });
  }
}

export const db = new RevonnDatabase();

// ============================================
// INITIALIZATION & HELPERS
// ============================================

export const initializeSettings = async (): Promise<Settings> => {
  let settings = await db.settings.get('default');
  
  if (!settings) {
    settings = {
      id: 'default',
      shopName: 'My Shop',
      invoicePrefix: 'INV',
      invoiceCounter: 1,
      autoWhatsApp: false,
      useMockAI: true,
      thermalPrinterWidth: 58
    };
    await db.settings.add(settings);
  }
  
  return settings;
};

export const getNextInvoiceNumber = async (): Promise<string> => {
  const settings = await initializeSettings();
  const number = `${settings.invoicePrefix}-${String(settings.invoiceCounter).padStart(5, '0')}`;
  await db.settings.update('default', { invoiceCounter: settings.invoiceCounter + 1 });
  return number;
};

export const getCurrentUser = async (): Promise<AppUser | null> => {
  const users = await db.users.where('isLoggedIn').equals(1).toArray();
  return users[0] || null;
};

// ============================================
// STOCK MANAGEMENT
// ============================================

export const deductStock = async (billItems: BillItem[]): Promise<void> => {
  for (const billItem of billItems) {
    const item = await db.items.get(billItem.itemId);
    if (!item) continue;

    if (billItem.variant) {
      const variantIndex = item.variants.findIndex(
        v => v.size === billItem.variant!.size && v.color === billItem.variant!.color
      );
      if (variantIndex >= 0) {
        item.variants[variantIndex].stock = Math.max(0, item.variants[variantIndex].stock - billItem.quantity);
      }
    }

    item.totalStock = item.variants.reduce((sum, v) => sum + v.stock, 0);
    item.updatedAt = Date.now();
    await db.items.put(item);
  }
};

export const addStock = async (purchaseItems: PurchaseItem[]): Promise<void> => {
  for (const pItem of purchaseItems) {
    const item = await db.items.get(pItem.itemId);
    if (!item) continue;

    if (pItem.variant) {
      const variantIndex = item.variants.findIndex(
        v => v.size === pItem.variant!.size && v.color === pItem.variant!.color
      );
      if (variantIndex >= 0) {
        item.variants[variantIndex].stock += pItem.quantity;
      }
    }

    item.totalStock = item.variants.reduce((sum, v) => sum + v.stock, 0);
    item.updatedAt = Date.now();
    await db.items.put(item);
  }
};

export const getLowStockItems = async (): Promise<Item[]> => {
  const items = await db.items.toArray();
  return items.filter(item => item.totalStock <= item.lowStockThreshold);
};

// ============================================
// SALES ANALYTICS
// ============================================

export const getSalesForPeriod = async (startDate: number, endDate: number): Promise<Bill[]> => {
  return db.bills
    .where('createdAt')
    .between(startDate, endDate)
    .and(bill => bill.status === 'completed')
    .toArray();
};

export const getDailySales = async (date: Date): Promise<{
  totalSales: number;
  billCount: number;
  bills: Bill[];
}> => {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const bills = await getSalesForPeriod(startOfDay.getTime(), endOfDay.getTime());
  
  return {
    totalSales: bills.reduce((sum, b) => sum + b.totalAmount, 0),
    billCount: bills.length,
    bills
  };
};

export const getItemWiseSales = async (startDate: number, endDate: number): Promise<Map<string, {
  name: string;
  quantity: number;
  revenue: number;
}>> => {
  const bills = await getSalesForPeriod(startDate, endDate);
  const itemSales = new Map<string, { name: string; quantity: number; revenue: number }>();

  bills.forEach(bill => {
    bill.items.forEach(item => {
      const existing = itemSales.get(item.itemId) || { name: item.name, quantity: 0, revenue: 0 };
      existing.quantity += item.quantity;
      existing.revenue += item.total;
      itemSales.set(item.itemId, existing);
    });
  });

  return itemSales;
};

// ============================================
// BACKUP & RESTORE
// ============================================

export const createBackup = async (): Promise<object> => {
  const [items, customers, bills, vendors, purchases, expenses, staff, attendance, settings] = await Promise.all([
    db.items.toArray(),
    db.customers.toArray(),
    db.bills.toArray(),
    db.vendors.toArray(),
    db.purchases.toArray(),
    db.expenses.toArray(),
    db.staff.toArray(),
    db.attendance.toArray(),
    db.settings.toArray()
  ]);

  return {
    version: 1,
    exportedAt: Date.now(),
    data: { items, customers, bills, vendors, purchases, expenses, staff, attendance, settings }
  };
};

export const restoreBackup = async (backup: any): Promise<void> => {
  const { data } = backup;
  
  await db.transaction('rw', [db.items, db.customers, db.bills, db.vendors, db.purchases, db.expenses, db.staff, db.attendance, db.settings], async () => {
    await db.items.clear();
    await db.customers.clear();
    await db.bills.clear();
    await db.vendors.clear();
    await db.purchases.clear();
    await db.expenses.clear();
    await db.staff.clear();
    await db.attendance.clear();
    await db.settings.clear();

    if (data.items) await db.items.bulkAdd(data.items);
    if (data.customers) await db.customers.bulkAdd(data.customers);
    if (data.bills) await db.bills.bulkAdd(data.bills);
    if (data.vendors) await db.vendors.bulkAdd(data.vendors);
    if (data.purchases) await db.purchases.bulkAdd(data.purchases);
    if (data.expenses) await db.expenses.bulkAdd(data.expenses);
    if (data.staff) await db.staff.bulkAdd(data.staff);
    if (data.attendance) await db.attendance.bulkAdd(data.attendance);
    if (data.settings) await db.settings.bulkAdd(data.settings);
  });
};
