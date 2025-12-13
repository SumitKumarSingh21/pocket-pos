import { useState, useMemo } from 'react';
import { 
  Plus, Minus, Trash2, Search, User, ShoppingCart, 
  Percent, CreditCard, Banknote, Smartphone, Receipt,
  Share2, Download, Mic, MicOff, X, Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useItems, useCustomers, useBills, useSettings } from '@/hooks/useDatabase';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { generateInvoicePDF, shareInvoiceViaWhatsApp, downloadPDF } from '@/lib/pdfGenerator';
import { getNextInvoiceNumber, deductStock, type Bill, type BillItem, type Item, type ItemVariant } from '@/lib/db';
import { supabase } from '@/integrations/supabase/client';

interface CartItem {
  itemId: string;
  name: string;
  variant?: { size: string; color: string };
  quantity: number;
  unitPrice: number;
  gstRate: number;
  discount: number;
}

export default function BillingPage() {
  const { items } = useItems();
  const { customers, updateCustomerPurchase } = useCustomers();
  const { addBill } = useBills();
  const { settings } = useSettings();
  const { toast } = useToast();
  
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [discountPercent, setDiscountPercent] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'upi' | 'card' | 'credit'>('cash');
  const [showItemDialog, setShowItemDialog] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<ItemVariant | null>(null);
  const [itemQty, setItemQty] = useState(1);
  const [processing, setProcessing] = useState(false);
  const [aiProcessing, setAiProcessing] = useState(false);
  
  const { isListening, transcript, isSupported, startListening, stopListening, resetTranscript } = useSpeechRecognition();

  // Search and filter items
  const filteredItems = useMemo(() => {
    if (!searchQuery) return items.slice(0, 20);
    const query = searchQuery.toLowerCase();
    return items.filter(item => 
      item.name.toLowerCase().includes(query) ||
      item.category.toLowerCase().includes(query)
    );
  }, [items, searchQuery]);

  // Calculate totals
  const subtotal = cart.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
  const discountAmount = (subtotal * discountPercent) / 100;
  const taxableAmount = subtotal - discountAmount;
  const taxAmount = cart.reduce((sum, item) => {
    const itemTotal = item.unitPrice * item.quantity;
    const itemDiscount = (itemTotal * discountPercent) / 100;
    return sum + ((itemTotal - itemDiscount) * item.gstRate) / 100;
  }, 0);
  const totalAmount = taxableAmount + taxAmount;

  const selectedCustomer = customers.find(c => c.id === selectedCustomerId);

  // Handle voice billing with real AI
  const handleVoiceBilling = async () => {
    if (isListening) {
      stopListening();
      if (transcript) {
        setAiProcessing(true);
        try {
          // Call AI edge function for intelligent parsing
          const { data, error } = await supabase.functions.invoke('ai-voice-billing', {
            body: { 
              text: transcript, 
              inventory: items.map(item => ({
                id: item.id,
                name: item.name,
                category: item.category,
                basePrice: item.basePrice,
                variants: item.variants
              }))
            }
          });

          if (error) throw error;

          if (data?.success && data.items?.length > 0) {
            let addedCount = 0;
            for (const parsedItem of data.items) {
              const matchedItem = items.find(i => i.id === parsedItem.itemId);
              if (matchedItem) {
                handleAddToCart(matchedItem, parsedItem.quantity || 1, parsedItem.size, parsedItem.color);
                addedCount++;
              }
            }
            
            if (addedCount > 0) {
              toast({ title: `Added ${addedCount} item(s) via AI voice billing` });
            } else {
              toast({ title: 'No matching items found', variant: 'destructive' });
            }

            // Set customer if AI detected one
            if (data.customerName) {
              const matchedCustomer = customers.find(c => 
                c.name.toLowerCase().includes(data.customerName.toLowerCase())
              );
              if (matchedCustomer) {
                setSelectedCustomerId(matchedCustomer.id);
              }
            }
          } else {
            toast({ title: 'Could not parse voice input', variant: 'destructive' });
          }
        } catch (err) {
          console.error('AI voice billing error:', err);
          toast({ title: 'AI processing failed', description: 'Please try again', variant: 'destructive' });
        } finally {
          setAiProcessing(false);
          resetTranscript();
        }
      }
    } else {
      startListening();
    }
  };

  const handleAddToCart = (item: Item, qty: number = 1, size?: string, color?: string) => {
    const variant = size && color 
      ? item.variants.find(v => v.size === size && v.color === color)
      : item.variants[0];

    if (!variant) {
      toast({ title: 'Variant not found', variant: 'destructive' });
      return;
    }

    const price = variant.price || item.basePrice;
    const existingIndex = cart.findIndex(c => 
      c.itemId === item.id && 
      c.variant?.size === variant.size && 
      c.variant?.color === variant.color
    );

    if (existingIndex >= 0) {
      const newCart = [...cart];
      newCart[existingIndex].quantity += qty;
      setCart(newCart);
    } else {
      setCart([...cart, {
        itemId: item.id,
        name: item.name,
        variant: { size: variant.size, color: variant.color },
        quantity: qty,
        unitPrice: price,
        gstRate: item.gstRate,
        discount: 0
      }]);
    }

    setShowItemDialog(false);
    setSelectedItem(null);
    setSelectedVariant(null);
    setItemQty(1);
  };

  const updateCartQty = (index: number, delta: number) => {
    const newCart = [...cart];
    newCart[index].quantity += delta;
    if (newCart[index].quantity <= 0) {
      newCart.splice(index, 1);
    }
    setCart(newCart);
  };

  const removeFromCart = (index: number) => {
    setCart(cart.filter((_, i) => i !== index));
  };

  const handleSaveBill = async (shareWhatsApp: boolean = false) => {
    if (cart.length === 0) {
      toast({ title: 'Add items to cart first', variant: 'destructive' });
      return;
    }

    setProcessing(true);
    try {
      const invoiceNumber = await getNextInvoiceNumber();
      
      const billItems: BillItem[] = cart.map(item => {
        const itemTotal = item.unitPrice * item.quantity;
        const itemDiscount = (itemTotal * discountPercent) / 100;
        const gstAmount = ((itemTotal - itemDiscount) * item.gstRate) / 100;
        return {
          itemId: item.itemId,
          name: item.name,
          variant: item.variant,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          gstRate: item.gstRate,
          gstAmount,
          discount: itemDiscount,
          total: itemTotal - itemDiscount + gstAmount
        };
      });

      const bill: Omit<Bill, 'id'> = {
        invoiceNumber,
        customerId: selectedCustomerId || undefined,
        customerName: selectedCustomer?.name,
        customerPhone: selectedCustomer?.phone,
        items: billItems,
        subtotal,
        discountAmount,
        discountPercent,
        taxAmount,
        totalAmount,
        paidAmount: paymentMethod === 'credit' ? 0 : totalAmount,
        paymentMethod,
        status: 'completed',
        syncStatus: 'pending',
        createdAt: Date.now(),
        createdBy: 'owner'
      };

      await addBill(bill);
      await deductStock(billItems);

      if (selectedCustomerId) {
        const outstanding = paymentMethod === 'credit' ? totalAmount : 0;
        await updateCustomerPurchase(selectedCustomerId, totalAmount, outstanding);
      }

      // Generate PDF
      if (settings) {
        const pdfBlob = await generateInvoicePDF({ ...bill, id: '' } as Bill, settings);
        
        if (shareWhatsApp || (settings.autoWhatsApp && selectedCustomer?.phone)) {
          await shareInvoiceViaWhatsApp(pdfBlob, { ...bill, id: '' } as Bill, settings);
        } else {
          downloadPDF(pdfBlob, `${invoiceNumber}.pdf`);
        }
      }

      toast({ title: `Bill ${invoiceNumber} saved!` });
      
      // Reset form
      setCart([]);
      setSelectedCustomerId('');
      setDiscountPercent(0);
      setPaymentMethod('cash');
    } catch (error) {
      console.error('Error saving bill:', error);
      toast({ title: 'Failed to save bill', variant: 'destructive' });
    }
    setProcessing(false);
  };

  return (
    <div className="space-y-4 pb-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">New Bill</h2>
        {isSupported && (
          <Button
            variant={isListening ? 'destructive' : 'outline'}
            size="icon"
            onClick={handleVoiceBilling}
            disabled={aiProcessing}
          >
            {aiProcessing ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : isListening ? (
              <MicOff className="h-5 w-5" />
            ) : (
              <Mic className="h-5 w-5" />
            )}
          </Button>
        )}
      </div>

      {(isListening || aiProcessing) && (
        <Card className="bg-primary/5 border-primary/30">
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">
              {aiProcessing ? 'AI is processing...' : 'Listening...'}
            </p>
            <p className="font-medium">{transcript || 'Say item name and quantity (e.g., "2 blue shirts large size")'}</p>
          </CardContent>
        </Card>
      )}

      {/* Customer Selection */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center gap-2">
            <User className="h-5 w-5 text-muted-foreground" />
            <Select value={selectedCustomerId} onValueChange={setSelectedCustomerId}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Select customer (optional)" />
              </SelectTrigger>
              <SelectContent className="bg-popover z-50">
                <SelectItem value="">Walk-in Customer</SelectItem>
                {customers.map(customer => (
                  <SelectItem key={customer.id} value={customer.id}>
                    {customer.name} - {customer.phone}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Search & Add Items */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Items
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Quick Add Items */}
          <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
            {filteredItems.map(item => (
              <Button
                key={item.id}
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={() => {
                  if (item.variants.length > 1) {
                    setSelectedItem(item);
                    setShowItemDialog(true);
                  } else {
                    handleAddToCart(item);
                  }
                }}
              >
                {item.name} - ₹{item.basePrice}
              </Button>
            ))}
          </div>

          {/* Cart Items */}
          {cart.length > 0 && (
            <div className="border-t pt-3 space-y-2">
              {cart.map((item, index) => (
                <div key={index} className="flex items-center justify-between gap-2 p-2 bg-muted/50 rounded-lg">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{item.name}</p>
                    {item.variant && (
                      <p className="text-xs text-muted-foreground">
                        {item.variant.size} / {item.variant.color}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">₹{item.unitPrice} × {item.quantity}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => updateCartQty(index, -1)}>
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="w-8 text-center font-medium">{item.quantity}</span>
                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => updateCartQty(index, 1)}>
                      <Plus className="h-3 w-3" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => removeFromCart(index)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Discount */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center gap-2">
            <Percent className="h-5 w-5 text-muted-foreground" />
            <span className="text-sm">Discount</span>
            <div className="flex-1" />
            <div className="flex gap-1">
              {[0, 5, 10, 15, 20].map(d => (
                <Button
                  key={d}
                  variant={discountPercent === d ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setDiscountPercent(d)}
                >
                  {d}%
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Method */}
      <Card>
        <CardContent className="pt-4">
          <p className="text-sm font-medium mb-2">Payment Method</p>
          <div className="grid grid-cols-4 gap-2">
            {[
              { id: 'cash', label: 'Cash', icon: Banknote },
              { id: 'upi', label: 'UPI', icon: Smartphone },
              { id: 'card', label: 'Card', icon: CreditCard },
              { id: 'credit', label: 'Credit', icon: Receipt },
            ].map(({ id, label, icon: Icon }) => (
              <Button
                key={id}
                variant={paymentMethod === id ? 'default' : 'outline'}
                className="flex-col h-auto py-3"
                onClick={() => setPaymentMethod(id as any)}
              >
                <Icon className="h-5 w-5 mb-1" />
                <span className="text-xs">{label}</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Bill Summary */}
      <Card>
        <CardContent className="pt-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span>₹{subtotal.toFixed(2)}</span>
          </div>
          {discountAmount > 0 && (
            <div className="flex justify-between text-sm text-green-600">
              <span>Discount ({discountPercent}%)</span>
              <span>-₹{discountAmount.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">GST</span>
            <span>₹{taxAmount.toFixed(2)}</span>
          </div>
          <div className="border-t pt-2 flex justify-between font-bold text-lg">
            <span>Total</span>
            <span>₹{totalAmount.toFixed(2)}</span>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-3">
        <Button
          variant="outline"
          size="lg"
          className="h-14"
          disabled={cart.length === 0 || processing}
          onClick={() => handleSaveBill(false)}
        >
          <Download className="h-5 w-5 mr-2" />
          Save & Download
        </Button>
        <Button
          size="lg"
          className="h-14"
          disabled={cart.length === 0 || processing}
          onClick={() => handleSaveBill(true)}
        >
          <Share2 className="h-5 w-5 mr-2" />
          Save & Share
        </Button>
      </div>

      {/* Variant Selection Dialog */}
      <Dialog open={showItemDialog} onOpenChange={setShowItemDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{selectedItem?.name}</DialogTitle>
          </DialogHeader>
          {selectedItem && (
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium mb-2">Select Size & Color</p>
                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                  {selectedItem.variants.map((variant, i) => (
                    <Button
                      key={i}
                      variant={selectedVariant === variant ? 'default' : 'outline'}
                      size="sm"
                      className="justify-start"
                      disabled={variant.stock === 0}
                      onClick={() => setSelectedVariant(variant)}
                    >
                      <span className="truncate">{variant.size}/{variant.color}</span>
                      <Badge variant="secondary" className="ml-auto">{variant.stock}</Badge>
                    </Button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-sm font-medium mb-2">Quantity</p>
                <div className="flex items-center gap-3">
                  <Button variant="outline" size="icon" onClick={() => setItemQty(Math.max(1, itemQty - 1))}>
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="text-xl font-bold w-12 text-center">{itemQty}</span>
                  <Button variant="outline" size="icon" onClick={() => setItemQty(itemQty + 1)}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <Button
                className="w-full"
                disabled={!selectedVariant}
                onClick={() => {
                  if (selectedVariant) {
                    handleAddToCart(selectedItem, itemQty, selectedVariant.size, selectedVariant.color);
                  }
                }}
              >
                Add to Cart - ₹{((selectedVariant?.price || selectedItem.basePrice) * itemQty).toFixed(2)}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
