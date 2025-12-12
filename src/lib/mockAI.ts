import type { Item, Bill } from './db';

/**
 * MockAI - Local AI processing without external APIs
 * Uses regex heuristics and templates for all AI features
 */

// ============================================
// VOICE/TEXT BILLING PARSER
// ============================================

interface ParsedBillItem {
  name: string;
  quantity: number;
  size?: string;
  color?: string;
  matchedItem?: Item;
  confidence: number;
}

export const parseBillFromText = (text: string, inventory: Item[]): ParsedBillItem[] => {
  const results: ParsedBillItem[] = [];
  const normalizedText = text.toLowerCase().trim();

  // Common patterns:
  // "2 blue shirts size L"
  // "3 pants medium black"
  // "1 saree"
  // "5 kg rice"

  const quantityPattern = /(\d+)\s*(kg|pcs?|pieces?|items?|nos?|units?)?\s*/gi;
  const sizePattern = /\b(xs|s|m|l|xl|xxl|small|medium|large|extra\s*large|free\s*size)\b/gi;
  const colorPattern = /\b(red|blue|green|black|white|yellow|pink|purple|orange|brown|grey|gray|navy|maroon|beige|cream)\b/gi;

  // Extract quantity
  const quantityMatch = normalizedText.match(/^(\d+)/);
  const quantity = quantityMatch ? parseInt(quantityMatch[1]) : 1;

  // Extract size
  const sizeMatch = normalizedText.match(sizePattern);
  const size = sizeMatch ? normalizeSize(sizeMatch[0]) : undefined;

  // Extract color
  const colorMatch = normalizedText.match(colorPattern);
  const color = colorMatch ? colorMatch[0].charAt(0).toUpperCase() + colorMatch[0].slice(1) : undefined;

  // Find matching inventory items
  const searchTerms = normalizedText
    .replace(quantityPattern, '')
    .replace(sizePattern, '')
    .replace(colorPattern, '')
    .split(/\s+/)
    .filter(term => term.length > 2);

  for (const item of inventory) {
    const itemName = item.name.toLowerCase();
    const itemCategory = item.category.toLowerCase();
    
    let matchScore = 0;
    for (const term of searchTerms) {
      if (itemName.includes(term)) matchScore += 2;
      if (itemCategory.includes(term)) matchScore += 1;
    }

    if (matchScore > 0) {
      results.push({
        name: item.name,
        quantity,
        size,
        color,
        matchedItem: item,
        confidence: Math.min(matchScore / searchTerms.length, 1)
      });
    }
  }

  // Sort by confidence
  results.sort((a, b) => b.confidence - a.confidence);

  return results.slice(0, 5);
};

const normalizeSize = (size: string): string => {
  const s = size.toLowerCase().replace(/\s+/g, '');
  const sizeMap: Record<string, string> = {
    'xs': 'XS', 'extrasmall': 'XS',
    's': 'S', 'small': 'S',
    'm': 'M', 'medium': 'M',
    'l': 'L', 'large': 'L',
    'xl': 'XL', 'extralarge': 'XL',
    'xxl': 'XXL', 'freesize': 'Free Size'
  };
  return sizeMap[s] || size.toUpperCase();
};

// ============================================
// MARKETING MESSAGE GENERATOR
// ============================================

interface MarketingContext {
  shopName: string;
  occasion?: string;
  discount?: number;
  products?: string[];
  customerName?: string;
}

const marketingTemplates = {
  general: [
    "🎉 Exciting news from {shopName}! Visit us today for amazing deals on {products}. Limited stock available!",
    "✨ {shopName} presents exclusive offers just for you! Check out our latest collection. Visit now!",
    "🛍️ Shop at {shopName} and save big! Fresh arrivals waiting for you. Don't miss out!",
  ],
  discount: [
    "🔥 FLAT {discount}% OFF at {shopName}! Hurry, offer valid for limited time only. Shop now!",
    "💥 Mega Sale Alert! Get {discount}% discount on all items at {shopName}. Visit today!",
    "🎊 Special {discount}% OFF for our valued customers! Shop at {shopName} now.",
  ],
  festival: [
    "🪔 {occasion} Special! Celebrate with {shopName}. Exclusive festival collection now available!",
    "🎉 Happy {occasion}! {shopName} wishes you joy & offers special discounts. Visit us!",
    "✨ This {occasion}, make it special with {shopName}! New arrivals + great prices.",
  ],
  reminder: [
    "👋 Hi {customerName}! We miss you at {shopName}. Visit us for exciting new arrivals!",
    "🌟 {customerName}, it's been a while! {shopName} has amazing new stock just for you.",
    "💝 Special customer alert! {customerName}, check out what's new at {shopName}.",
  ]
};

export const generateMarketingMessage = (context: MarketingContext): string => {
  let templates: string[];
  
  if (context.customerName) {
    templates = marketingTemplates.reminder;
  } else if (context.occasion) {
    templates = marketingTemplates.festival;
  } else if (context.discount) {
    templates = marketingTemplates.discount;
  } else {
    templates = marketingTemplates.general;
  }

  const template = templates[Math.floor(Math.random() * templates.length)];
  
  return template
    .replace('{shopName}', context.shopName)
    .replace('{discount}', String(context.discount || 10))
    .replace('{occasion}', context.occasion || 'Festival')
    .replace('{products}', context.products?.join(', ') || 'our products')
    .replace('{customerName}', context.customerName || 'Customer');
};

// ============================================
// INVENTORY PREDICTIONS
// ============================================

interface ItemSalesData {
  itemId: string;
  name: string;
  totalSold: number;
  totalRevenue: number;
  daysInPeriod: number;
  avgDailySales: number;
  currentStock: number;
  daysUntilStockout: number;
}

export const analyzeFastMovingItems = (
  bills: Bill[],
  items: Item[],
  periodDays: number = 30
): ItemSalesData[] => {
  const salesMap = new Map<string, { quantity: number; revenue: number }>();

  // Calculate sales per item
  bills.forEach(bill => {
    bill.items.forEach(item => {
      const existing = salesMap.get(item.itemId) || { quantity: 0, revenue: 0 };
      existing.quantity += item.quantity;
      existing.revenue += item.total;
      salesMap.set(item.itemId, existing);
    });
  });

  // Build analysis data
  const analysis: ItemSalesData[] = items.map(item => {
    const sales = salesMap.get(item.id) || { quantity: 0, revenue: 0 };
    const avgDailySales = sales.quantity / periodDays;
    
    return {
      itemId: item.id,
      name: item.name,
      totalSold: sales.quantity,
      totalRevenue: sales.revenue,
      daysInPeriod: periodDays,
      avgDailySales,
      currentStock: item.totalStock,
      daysUntilStockout: avgDailySales > 0 ? Math.floor(item.totalStock / avgDailySales) : 999
    };
  });

  // Sort by sales volume (fast moving first)
  return analysis.sort((a, b) => b.totalSold - a.totalSold);
};

export const getSlowMovingItems = (
  bills: Bill[],
  items: Item[],
  periodDays: number = 30
): ItemSalesData[] => {
  const analysis = analyzeFastMovingItems(bills, items, periodDays);
  // Filter items with stock but low sales
  return analysis
    .filter(item => item.currentStock > 0 && item.avgDailySales < 0.5)
    .sort((a, b) => a.totalSold - b.totalSold);
};

export const getLowStockPredictions = (
  bills: Bill[],
  items: Item[],
  thresholdDays: number = 7
): ItemSalesData[] => {
  const analysis = analyzeFastMovingItems(bills, items, 30);
  return analysis.filter(item => item.daysUntilStockout <= thresholdDays && item.daysUntilStockout > 0);
};

// ============================================
// GST HELPER
// ============================================

const gstRates: Record<string, number> = {
  'clothing': 5,
  'apparel': 5,
  'footwear': 5,
  'textile': 5,
  'electronics': 18,
  'mobile': 18,
  'accessories': 18,
  'jewelry': 3,
  'gold': 3,
  'silver': 3,
  'food': 5,
  'grocery': 0,
  'medicine': 5,
  'cosmetics': 18,
  'furniture': 18,
  'default': 18
};

export const suggestGSTRate = (itemName: string, category: string): number => {
  const searchTerms = `${itemName} ${category}`.toLowerCase();
  
  for (const [keyword, rate] of Object.entries(gstRates)) {
    if (searchTerms.includes(keyword)) {
      return rate;
    }
  }
  
  return gstRates.default;
};

export const validateGSTInvoice = (bill: Bill): string[] => {
  const errors: string[] = [];

  // Check for missing HSN codes (for GST compliance)
  bill.items.forEach(item => {
    if (item.total > 50000 && !item.gstRate) {
      errors.push(`Item "${item.name}" exceeds ₹50,000 - HSN code recommended`);
    }
  });

  // Check if GST breakdown is correct
  const calculatedTax = bill.items.reduce((sum, item) => sum + item.gstAmount, 0);
  if (Math.abs(calculatedTax - bill.taxAmount) > 1) {
    errors.push('GST calculation mismatch detected');
  }

  return errors;
};

// ============================================
// SALES INSIGHTS
// ============================================

interface DailyInsight {
  date: string;
  totalSales: number;
  billCount: number;
  avgBillValue: number;
  topItem: string;
  comparison: string;
}

export const generateDailyInsight = (
  todayBills: Bill[],
  yesterdayBills: Bill[]
): DailyInsight => {
  const todayTotal = todayBills.reduce((sum, b) => sum + b.totalAmount, 0);
  const yesterdayTotal = yesterdayBills.reduce((sum, b) => sum + b.totalAmount, 0);
  
  // Find top selling item
  const itemCounts = new Map<string, { name: string; count: number }>();
  todayBills.forEach(bill => {
    bill.items.forEach(item => {
      const existing = itemCounts.get(item.itemId) || { name: item.name, count: 0 };
      existing.count += item.quantity;
      itemCounts.set(item.itemId, existing);
    });
  });
  
  const topItem = Array.from(itemCounts.values())
    .sort((a, b) => b.count - a.count)[0]?.name || 'N/A';

  // Calculate comparison
  let comparison: string;
  if (yesterdayTotal === 0) {
    comparison = 'No data from yesterday';
  } else {
    const change = ((todayTotal - yesterdayTotal) / yesterdayTotal) * 100;
    if (change > 0) {
      comparison = `📈 Up ${change.toFixed(1)}% vs yesterday`;
    } else if (change < 0) {
      comparison = `📉 Down ${Math.abs(change).toFixed(1)}% vs yesterday`;
    } else {
      comparison = 'Same as yesterday';
    }
  }

  return {
    date: new Date().toLocaleDateString('en-IN'),
    totalSales: todayTotal,
    billCount: todayBills.length,
    avgBillValue: todayBills.length > 0 ? todayTotal / todayBills.length : 0,
    topItem,
    comparison
  };
};

export const generateWeeklySummary = (bills: Bill[]): string[] => {
  const insights: string[] = [];
  const total = bills.reduce((sum, b) => sum + b.totalAmount, 0);
  const avgDaily = total / 7;

  insights.push(`📊 Weekly Sales: ₹${total.toLocaleString('en-IN')}`);
  insights.push(`📅 Daily Average: ₹${avgDaily.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`);
  insights.push(`🧾 Total Bills: ${bills.length}`);
  
  // Best day
  const dailySales = new Map<string, number>();
  bills.forEach(bill => {
    const date = new Date(bill.createdAt).toLocaleDateString('en-IN');
    dailySales.set(date, (dailySales.get(date) || 0) + bill.totalAmount);
  });
  
  const bestDay = Array.from(dailySales.entries()).sort((a, b) => b[1] - a[1])[0];
  if (bestDay) {
    insights.push(`🏆 Best Day: ${bestDay[0]} (₹${bestDay[1].toLocaleString('en-IN')})`);
  }

  return insights;
};
