// src/hooks/useDatabase.ts
import { useState, useEffect, useCallback } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { 
  db, 
  type Item, 
  type Customer, 
  type Bill, 
  type Vendor, 
  type Purchase,
  type Expense,
  type Staff,
  type Attendance,
  type Settings,
  type AppUser,
  initializeSettings,
  getCurrentUser,
  getLowStockItems,
  getDailySales
} from '@/lib/db';

// ============================================
// ITEMS HOOK
// ============================================

export const useItems = () => {
  const items = useLiveQuery(() => db.items.toArray()) || [];
  const lowStockItems = useLiveQuery(() => getLowStockItems()) || [];

  const addItem = useCallback(async (item: Omit<Item, 'id' | 'createdAt' | 'updatedAt'>) => {
    const id = `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    await db.items.add({
      ...item,
      id,
      createdAt: Date.now(),
      updatedAt: Date.now()
    });
    return id;
  }, []);

  const updateItem = useCallback(async (id: string, updates: Partial<Item>) => {
    await db.items.update(id, { ...updates, updatedAt: Date.now() });
  }, []);

  const deleteItem = useCallback(async (id: string) => {
    await db.items.delete(id);
  }, []);

  return { items, lowStockItems, addItem, updateItem, deleteItem };
};

// ============================================
// CUSTOMERS HOOK
// ============================================

export const useCustomers = () => {
  const customers = useLiveQuery(() => db.customers.orderBy('name').toArray()) || [];

  const addCustomer = useCallback(async (customer: Omit<Customer, 'id' | 'createdAt' | 'totalPurchases' | 'outstandingAmount'>) => {
    const id = `cust_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    await db.customers.add({
      ...customer,
      id,
      totalPurchases: 0,
      outstandingAmount: 0,
      createdAt: Date.now()
    });
    return id;
  }, []);

  const updateCustomer = useCallback(async (id: string, updates: Partial<Customer>) => {
    await db.customers.update(id, updates);
  }, []);

  const deleteCustomer = useCallback(async (id: string) => {
    await db.customers.delete(id);
  }, []);

  const updateCustomerPurchase = useCallback(async (id: string, amount: number, outstanding: number = 0) => {
    const customer = await db.customers.get(id);
    if (customer) {
      await db.customers.update(id, {
        totalPurchases: customer.totalPurchases + amount,
        outstandingAmount: customer.outstandingAmount + outstanding,
        lastVisit: Date.now()
      });
    }
  }, []);

  return { customers, addCustomer, updateCustomer, deleteCustomer, updateCustomerPurchase };
};

// ============================================
// BILLS HOOK
// ============================================

export const useBills = () => {
  const bills = useLiveQuery(() => db.bills.orderBy('createdAt').reverse().toArray()) || [];
  const pendingBills = useLiveQuery(() => 
    db.bills.where('syncStatus').equals('pending').toArray()
  ) || [];

  const [todaySales, setTodaySales] = useState({ totalSales: 0, billCount: 0, bills: [] as Bill[] });

  useEffect(() => {
    getDailySales(new Date()).then(setTodaySales);
  }, [bills.length]);

  const addBill = useCallback(async (bill: Omit<Bill, 'id'>) => {
    const id = `bill_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    await db.bills.add({ ...bill, id });
    return id;
  }, []);

  const updateBill = useCallback(async (id: string, updates: Partial<Bill>) => {
    await db.bills.update(id, updates);
  }, []);

  const markBillSynced = useCallback(async (id: string) => {
    await db.bills.update(id, { syncStatus: 'synced' });
  }, []);

  return { bills, pendingBills, todaySales, addBill, updateBill, markBillSynced };
};

// ============================================
// VENDORS HOOK
// ============================================

export const useVendors = () => {
  const vendors = useLiveQuery(() => db.vendors.toArray()) || [];

  const addVendor = useCallback(async (vendor: Omit<Vendor, 'id' | 'createdAt'>) => {
    const id = `vendor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    await db.vendors.add({ ...vendor, id, createdAt: Date.now() });
    return id;
  }, []);

  const updateVendor = useCallback(async (id: string, updates: Partial<Vendor>) => {
    await db.vendors.update(id, updates);
  }, []);

  const deleteVendor = useCallback(async (id: string) => {
    await db.vendors.delete(id);
  }, []);

  return { vendors, addVendor, updateVendor, deleteVendor };
};

// ============================================
// PURCHASES HOOK
// ============================================

export const usePurchases = () => {
  const purchases = useLiveQuery(() => db.purchases.orderBy('createdAt').reverse().toArray()) || [];

  const addPurchase = useCallback(async (purchase: Omit<Purchase, 'id' | 'createdAt'>) => {
    const id = `purchase_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    await db.purchases.add({ ...purchase, id, createdAt: Date.now() });
    return id;
  }, []);

  const updatePurchase = useCallback(async (id: string, updates: Partial<Purchase>) => {
    await db.purchases.update(id, updates);
  }, []);

  return { purchases, addPurchase, updatePurchase };
};

// ============================================
// EXPENSES HOOK
// ============================================

export const useExpenses = () => {
  const expenses = useLiveQuery(() => db.expenses.orderBy('createdAt').reverse().toArray()) || [];

  const addExpense = useCallback(async (expense: Omit<Expense, 'id' | 'createdAt'>) => {
    const id = `expense_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    await db.expenses.add({ ...expense, id, createdAt: Date.now() });
    return id;
  }, []);

  const deleteExpense = useCallback(async (id: string) => {
    await db.expenses.delete(id);
  }, []);

  return { expenses, addExpense, deleteExpense };
};

// ============================================
// STAFF HOOK
// ============================================

export const useStaff = () => {
  const staff = useLiveQuery(() => db.staff.toArray()) || [];
  const activeStaff = useLiveQuery(() => db.staff.where('isActive').equals(1).toArray()) || [];

  const addStaff = useCallback(async (staffMember: Omit<Staff, 'id' | 'createdAt'>) => {
    const id = `staff_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    await db.staff.add({ ...staffMember, id, createdAt: Date.now() });
    return id;
  }, []);

  const updateStaff = useCallback(async (id: string, updates: Partial<Staff>) => {
    await db.staff.update(id, updates);
  }, []);

  return { staff, activeStaff, addStaff, updateStaff };
};

// ============================================
// ATTENDANCE HOOK
// ============================================

export const useAttendance = () => {
  const attendance = useLiveQuery(() => db.attendance.toArray()) || [];

  const markAttendance = useCallback(async (
    staffId: string,
    status: 'present' | 'absent' | 'late' | 'half-day'
  ) => {
    const today = new Date().toISOString().split('T')[0];
    const existing = await db.attendance.where({ staffId, date: today }).first();

    if (existing) {
      await db.attendance.update(existing.id, { status, checkIn: Date.now() });
    } else {
      const id = `att_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      await db.attendance.add({
        id,
        staffId,
        date: today,
        checkIn: Date.now(),
        status
      });
    }
  }, []);

  const getStaffAttendance = useCallback(async (staffId: string, month: string) => {
    return db.attendance
      .where('staffId').equals(staffId)
      .and(a => a.date.startsWith(month))
      .toArray();
  }, []);

  return { attendance, markAttendance, getStaffAttendance };
};

// ============================================
// SETTINGS HOOK
// ============================================

export const useSettings = () => {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initializeSettings().then(s => {
      setSettings(s);
      setLoading(false);
    });
  }, []);

  const updateSettings = useCallback(async (updates: Partial<Settings>) => {
    await db.settings.update('default', updates);
    const newSettings = await db.settings.get('default');
    setSettings(newSettings!);
  }, []);

  return { settings, loading, updateSettings };
};

// ============================================
// AUTH HOOK (improved - preview-friendly)
// ============================================

export const useAuth = () => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        // 1) Check for a demo user in localStorage (quick manual preview)
        const demoJson = localStorage.getItem('demo_user');
        if (demoJson) {
          try {
            const parsed = JSON.parse(demoJson) as AppUser;
            if (!cancelled) {
              // Persist into db.users so other parts of app using db see it (optional)
              try {
                await db.users.clear();
                await db.users.add(parsed);
              } catch (err) {
                // ignore persistence errors
                console.warn('[useAuth] failed to persist demo_user into db:', err);
              }
              console.info('[useAuth] using demo_user from localStorage');
              setUser(parsed);
              setLoading(false);
              return;
            }
          } catch (err) {
            console.warn('[useAuth] demo_user parse failed', err);
          }
        }

        // 2) Try to get the real current user from the local DB
        const u = await getCurrentUser();
        if (u) {
          if (!cancelled) {
            console.info('[useAuth] found user in DB:', u);
            setUser(u);
            setLoading(false);
          }
          return;
        }

        // 3) If not found, check preview mode env var and create a lightweight demo user
        //    Set VITE_ENABLE_PREVIEW=true in your preview host (or .env.local for local testing)
        if (import.meta.env.VITE_ENABLE_PREVIEW === 'true') {
          const demoUser: AppUser = {
            id: 'demo_user',
            name: 'Preview User',
            email: 'preview@example.com',
            role: 'owner',
            isLoggedIn: true,
            loginAt: Date.now()
          } as AppUser;

          try {
            // persist demo user so other hooks using db.users can pick it up
            await db.users.clear();
            await db.users.add(demoUser);
            if (!cancelled) {
              console.info('[useAuth] created demo user for preview');
              setUser(demoUser);
              setLoading(false);
            }
            return;
          } catch (err) {
            console.warn('[useAuth] failed to persist demo user, continuing without it', err);
          }
        }

        // 4) Default: no user
        if (!cancelled) {
          console.info('[useAuth] no user found (not authenticated)');
          setUser(null);
          setLoading(false);
        }
      } catch (err) {
        console.error('[useAuth] initialization error', err);
        if (!cancelled) {
          setUser(null);
          setLoading(false);
        }
      }
    }

    init();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (userData: Omit<AppUser, 'isLoggedIn' | 'loginAt'>) => {
    // Clear any existing login and add the logged-in user to db
    await db.users.clear();

    const user: AppUser = {
      ...userData,
      isLoggedIn: true,
      loginAt: Date.now()
    } as AppUser;

    await db.users.add(user);
    setUser(user);
    return user;
  }, []);

  const logout = useCallback(async () => {
    await db.users.clear();
    // also remove demo_user localStorage if present (optional)
    if (localStorage.getItem('demo_user')) localStorage.removeItem('demo_user');
    setUser(null);
  }, []);

  return { user, loading, login, logout, isOwner: user?.role === 'owner' };
};
