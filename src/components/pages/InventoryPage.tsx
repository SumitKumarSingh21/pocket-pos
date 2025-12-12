import { useState } from 'react';
import { Plus, Search, Package, AlertTriangle, Edit2, Trash2, TrendingUp, TrendingDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useItems } from '@/hooks/useDatabase';
import type { Item, ItemVariant } from '@/lib/db';

const categories = ['Clothing', 'Footwear', 'Accessories', 'Electronics', 'Grocery', 'Other'];
const sizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'Free Size'];
const colors = ['Black', 'White', 'Blue', 'Red', 'Green', 'Yellow', 'Pink', 'Brown', 'Grey', 'Navy', 'Maroon'];
const gstRates = [0, 5, 12, 18, 28];

export default function InventoryPage() {
  const { items, lowStockItems, addItem, updateItem, deleteItem } = useItems();
  const { toast } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    category: 'Clothing',
    basePrice: '',
    gstRate: 5,
    hsnCode: '',
    unit: 'pcs',
    lowStockThreshold: '5',
    variants: [{ size: 'M', color: 'Black', sku: '', stock: 0, price: undefined as number | undefined }] as ItemVariant[]
  });

  const filteredItems = items.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const resetForm = () => {
    setFormData({
      name: '',
      category: 'Clothing',
      basePrice: '',
      gstRate: 5,
      hsnCode: '',
      unit: 'pcs',
      lowStockThreshold: '5',
      variants: [{ size: 'M', color: 'Black', sku: '', stock: 0, price: undefined }]
    });
    setEditingItem(null);
  };

  const handleAddVariant = () => {
    setFormData(prev => ({
      ...prev,
      variants: [...prev.variants, { size: 'M', color: 'Black', sku: '', stock: 0, price: undefined }]
    }));
  };

  const handleRemoveVariant = (index: number) => {
    setFormData(prev => ({
      ...prev,
      variants: prev.variants.filter((_, i) => i !== index)
    }));
  };

  const handleVariantChange = (index: number, field: keyof ItemVariant, value: any) => {
    setFormData(prev => {
      const newVariants = [...prev.variants];
      newVariants[index] = { ...newVariants[index], [field]: value };
      return { ...prev, variants: newVariants };
    });
  };

  const handleSaveItem = async () => {
    if (!formData.name || !formData.basePrice) {
      toast({ title: 'Name and price are required', variant: 'destructive' });
      return;
    }

    const totalStock = formData.variants.reduce((sum, v) => sum + v.stock, 0);

    const itemData = {
      name: formData.name,
      category: formData.category,
      basePrice: parseFloat(formData.basePrice),
      gstRate: formData.gstRate,
      hsnCode: formData.hsnCode || undefined,
      unit: formData.unit,
      variants: formData.variants,
      totalStock,
      lowStockThreshold: parseInt(formData.lowStockThreshold) || 5
    };

    try {
      if (editingItem) {
        await updateItem(editingItem.id, itemData);
        toast({ title: 'Item updated!' });
      } else {
        await addItem(itemData);
        toast({ title: 'Item added!' });
      }
      setShowAddDialog(false);
      resetForm();
    } catch (error) {
      toast({ title: 'Failed to save item', variant: 'destructive' });
    }
  };

  const handleEditItem = (item: Item) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      category: item.category,
      basePrice: item.basePrice.toString(),
      gstRate: item.gstRate,
      hsnCode: item.hsnCode || '',
      unit: item.unit,
      lowStockThreshold: item.lowStockThreshold.toString(),
      variants: item.variants
    });
    setShowAddDialog(true);
  };

  const handleDeleteItem = async (id: string) => {
    await deleteItem(id);
    toast({ title: 'Item deleted' });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Inventory</h2>
        <Dialog open={showAddDialog} onOpenChange={(open) => { setShowAddDialog(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Item
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingItem ? 'Edit Item' : 'Add New Item'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Item Name *</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Cotton T-Shirt"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium">Category</label>
                  <Select value={formData.category} onValueChange={(v) => setFormData(prev => ({ ...prev, category: v }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-popover z-50">
                      {categories.map(cat => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Base Price *</label>
                  <Input
                    type="number"
                    value={formData.basePrice}
                    onChange={(e) => setFormData(prev => ({ ...prev, basePrice: e.target.value }))}
                    placeholder="₹"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium">GST Rate</label>
                  <Select value={formData.gstRate.toString()} onValueChange={(v) => setFormData(prev => ({ ...prev, gstRate: parseInt(v) }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-popover z-50">
                      {gstRates.map(rate => (
                        <SelectItem key={rate} value={rate.toString()}>{rate}%</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Low Stock Alert</label>
                  <Input
                    type="number"
                    value={formData.lowStockThreshold}
                    onChange={(e) => setFormData(prev => ({ ...prev, lowStockThreshold: e.target.value }))}
                  />
                </div>
              </div>
              
              {/* Variants */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium">Variants</label>
                  <Button variant="outline" size="sm" onClick={handleAddVariant}>
                    <Plus className="h-3 w-3 mr-1" />
                    Add
                  </Button>
                </div>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {formData.variants.map((variant, index) => (
                    <div key={index} className="flex gap-2 items-center p-2 bg-muted/50 rounded">
                      <Select value={variant.size} onValueChange={(v) => handleVariantChange(index, 'size', v)}>
                        <SelectTrigger className="w-20">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-popover z-50">
                          {sizes.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <Select value={variant.color} onValueChange={(v) => handleVariantChange(index, 'color', v)}>
                        <SelectTrigger className="w-24">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-popover z-50">
                          {colors.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <Input
                        type="number"
                        placeholder="Stock"
                        className="w-16"
                        value={variant.stock}
                        onChange={(e) => handleVariantChange(index, 'stock', parseInt(e.target.value) || 0)}
                      />
                      {formData.variants.length > 1 && (
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleRemoveVariant(index)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <Button className="w-full" onClick={handleSaveItem}>
                {editingItem ? 'Update Item' : 'Add Item'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search items..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="pt-4 text-center">
            <Package className="h-6 w-6 mx-auto text-primary mb-1" />
            <p className="text-xl font-bold">{items.length}</p>
            <p className="text-xs text-muted-foreground">Total Items</p>
          </CardContent>
        </Card>
        <Card className={lowStockItems.length > 0 ? 'border-warning/50' : ''}>
          <CardContent className="pt-4 text-center">
            <AlertTriangle className={`h-6 w-6 mx-auto mb-1 ${lowStockItems.length > 0 ? 'text-warning' : 'text-muted-foreground'}`} />
            <p className={`text-xl font-bold ${lowStockItems.length > 0 ? 'text-warning' : ''}`}>{lowStockItems.length}</p>
            <p className="text-xs text-muted-foreground">Low Stock</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <TrendingUp className="h-6 w-6 mx-auto text-accent mb-1" />
            <p className="text-xl font-bold">{items.reduce((s, i) => s + i.totalStock, 0)}</p>
            <p className="text-xs text-muted-foreground">Total Units</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="all">
        <TabsList className="grid grid-cols-2 w-full">
          <TabsTrigger value="all">All Items</TabsTrigger>
          <TabsTrigger value="lowstock">Low Stock ({lowStockItems.length})</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="space-y-2 mt-4">
          {filteredItems.length === 0 ? (
            <Card>
              <CardContent className="pt-8 pb-8 text-center text-muted-foreground">
                <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No items found</p>
                <Button variant="link" onClick={() => setShowAddDialog(true)}>Add your first item</Button>
              </CardContent>
            </Card>
          ) : (
            filteredItems.map(item => (
              <ItemCard key={item.id} item={item} onEdit={handleEditItem} onDelete={handleDeleteItem} />
            ))
          )}
        </TabsContent>

        <TabsContent value="lowstock" className="space-y-2 mt-4">
          {lowStockItems.length === 0 ? (
            <Card>
              <CardContent className="pt-8 pb-8 text-center text-muted-foreground">
                <p>All items have sufficient stock!</p>
              </CardContent>
            </Card>
          ) : (
            lowStockItems.map(item => (
              <ItemCard key={item.id} item={item} onEdit={handleEditItem} onDelete={handleDeleteItem} isLowStock />
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ItemCard({ item, onEdit, onDelete, isLowStock }: { 
  item: Item; 
  onEdit: (item: Item) => void; 
  onDelete: (id: string) => void;
  isLowStock?: boolean;
}) {
  return (
    <Card className={isLowStock ? 'border-warning/50 bg-warning/5' : ''}>
      <CardContent className="pt-4">
        <div className="flex justify-between items-start">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-medium truncate">{item.name}</h3>
              {isLowStock && <AlertTriangle className="h-4 w-4 text-warning flex-shrink-0" />}
            </div>
            <p className="text-sm text-muted-foreground">{item.category}</p>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="secondary">₹{item.basePrice}</Badge>
              <Badge variant="outline">{item.gstRate}% GST</Badge>
              <Badge variant={item.totalStock <= item.lowStockThreshold ? 'destructive' : 'default'}>
                {item.totalStock} in stock
              </Badge>
            </div>
          </div>
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" onClick={() => onEdit(item)}>
              <Edit2 className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="text-destructive" onClick={() => onDelete(item.id)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
        {item.variants.length > 1 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {item.variants.slice(0, 4).map((v, i) => (
              <Badge key={i} variant="outline" className="text-xs">
                {v.size}/{v.color}: {v.stock}
              </Badge>
            ))}
            {item.variants.length > 4 && (
              <Badge variant="outline" className="text-xs">+{item.variants.length - 4} more</Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
