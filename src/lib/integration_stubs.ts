/**
 * INTEGRATION STUBS
 * 
 * This file contains all external API integrations as stubs.
 * Each function returns realistic mock data and includes TODO comments
 * showing how to replace with real endpoints.
 * 
 * NO EXTERNAL APIs ARE CALLED - All data is processed locally.
 */

// ============================================
// AUTH STUBS
// ============================================

/**
 * Sign in with OTP
 * TODO: Replace with real endpoint
 * Method: POST
 * Path: /api/auth/verify-otp
 * Payload: { phone: string, otp: string }
 */
export const auth = {
  signInWithOtp: async (phone: string, otp: string): Promise<{
    success: boolean;
    user?: { id: string; phone: string; role: 'owner' | 'staff'; name: string };
    error?: string;
  }> => {
    // Mock: Accept OTP 123456 for any phone
    await new Promise(r => setTimeout(r, 500));
    
    if (otp === '123456') {
      return {
        success: true,
        user: {
          id: `user_${Date.now()}`,
          phone,
          role: 'owner',
          name: 'Shop Owner'
        }
      };
    }
    
    return { success: false, error: 'Invalid OTP' };
  },

  sendOtp: async (phone: string): Promise<{ success: boolean; message: string }> => {
    // TODO: Replace with real SMS endpoint
    // Method: POST, Path: /api/auth/send-otp, Payload: { phone }
    await new Promise(r => setTimeout(r, 300));
    return { success: true, message: 'OTP sent (use 123456 for demo)' };
  }
};

// ============================================
// SYNC STUBS
// ============================================

/**
 * Sync pending bills to cloud
 * TODO: Replace with real endpoint
 * Method: POST
 * Path: /api/sync/bills
 * Payload: { bills: Bill[], lastSyncTimestamp: number }
 */
export const sync = {
  syncPendingBills: async (bills: any[]): Promise<{
    success: boolean;
    syncedIds: string[];
    failedIds: string[];
    serverTimestamp: number;
  }> => {
    await new Promise(r => setTimeout(r, 800));
    
    return {
      success: true,
      syncedIds: bills.map(b => b.id),
      failedIds: [],
      serverTimestamp: Date.now()
    };
  },

  syncInventory: async (items: any[]): Promise<{ success: boolean; syncedCount: number }> => {
    // TODO: POST /api/sync/inventory
    await new Promise(r => setTimeout(r, 500));
    return { success: true, syncedCount: items.length };
  },

  syncCustomers: async (customers: any[]): Promise<{ success: boolean; syncedCount: number }> => {
    // TODO: POST /api/sync/customers
    await new Promise(r => setTimeout(r, 500));
    return { success: true, syncedCount: customers.length };
  }
};

// ============================================
// STORAGE STUBS
// ============================================

/**
 * Upload PDF to cloud storage
 * TODO: Replace with real endpoint
 * Method: POST (multipart/form-data)
 * Path: /api/storage/upload
 * Payload: FormData with file
 */
export const storage = {
  uploadPdf: async (pdfBlob: Blob, filename: string): Promise<{
    success: boolean;
    url?: string;
    error?: string;
  }> => {
    await new Promise(r => setTimeout(r, 600));
    
    // Mock: Return a fake URL
    return {
      success: true,
      url: `https://storage.revonn.app/invoices/${filename}`
    };
  },

  uploadBackup: async (backupData: any): Promise<{ success: boolean; backupId: string }> => {
    // TODO: POST /api/storage/backup
    await new Promise(r => setTimeout(r, 1000));
    return { success: true, backupId: `backup_${Date.now()}` };
  }
};

// ============================================
// WHATSAPP STUBS
// ============================================

/**
 * Send invoice via WhatsApp Cloud API
 * TODO: Replace with real WhatsApp Business API endpoint
 * Method: POST
 * Path: /api/whatsapp/send-invoice
 * Payload: { phone: string, pdfUrl: string, message: string }
 */
export const whatsapp = {
  sendInvoice: async (phone: string, pdfUrl: string, message: string): Promise<{
    success: boolean;
    messageId?: string;
    error?: string;
  }> => {
    // This stub is not used - we use device share intent instead
    await new Promise(r => setTimeout(r, 300));
    return {
      success: true,
      messageId: `msg_${Date.now()}`
    };
  },

  sendBroadcast: async (phones: string[], message: string): Promise<{
    success: boolean;
    sentCount: number;
    failedCount: number;
  }> => {
    // TODO: POST /api/whatsapp/broadcast
    await new Promise(r => setTimeout(r, phones.length * 100));
    return { success: true, sentCount: phones.length, failedCount: 0 };
  }
};

// ============================================
// AI STUBS
// ============================================

/**
 * Parse voice/text billing input using AI
 * TODO: Replace with real AI endpoint
 * Method: POST
 * Path: /api/ai/parse-bill
 * Payload: { text: string, inventory: Item[] }
 */
export const ai = {
  parseBill: async (text: string, inventory: any[]): Promise<{
    success: boolean;
    items: Array<{ itemId: string; name: string; quantity: number; size?: string; color?: string }>;
    customerName?: string;
    confidence: number;
  }> => {
    // This is handled locally by MockAI - stub for future cloud AI
    await new Promise(r => setTimeout(r, 200));
    return {
      success: true,
      items: [],
      confidence: 0.85
    };
  },

  generateMarketing: async (context: {
    shopName: string;
    occasion?: string;
    discount?: number;
    products?: string[];
  }): Promise<{ success: boolean; message: string }> => {
    // This is handled locally by MockAI - stub for future cloud AI
    await new Promise(r => setTimeout(r, 300));
    return {
      success: true,
      message: `🎉 Special offer at ${context.shopName}!`
    };
  },

  getInsights: async (salesData: any[]): Promise<{
    success: boolean;
    insights: string[];
    predictions: any;
  }> => {
    // TODO: POST /api/ai/insights
    await new Promise(r => setTimeout(r, 500));
    return {
      success: true,
      insights: ['Sales are trending up!'],
      predictions: {}
    };
  }
};

// ============================================
// COMBINED SYNC FUNCTION
// ============================================

export const syncPending = async (): Promise<{
  success: boolean;
  message: string;
  details: {
    bills: number;
    inventory: number;
    customers: number;
  };
}> => {
  // Simulate comprehensive sync
  await new Promise(r => setTimeout(r, 1500));
  
  return {
    success: true,
    message: 'All pending data synced successfully (demo)',
    details: {
      bills: 0,
      inventory: 0,
      customers: 0
    }
  };
};
