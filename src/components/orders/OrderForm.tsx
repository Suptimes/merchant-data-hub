
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, Plus } from "lucide-react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

interface OrderFormProps {
  order: Order | null;
  onSuccess: () => void;
  onCancel: () => void;
}

interface Order {
  id: string;
  customer_id: string;
  status: string;
  amount: number;
  items: number;
}

interface Customer {
  id: string;
  name: string;
  email: string;
}

interface Product {
  id: string;
  name: string;
  price: number;
  sku: string;
  inventory: number;
}

interface OrderItem {
  id?: string;
  product_id: string;
  product_name?: string;
  quantity: number;
  price: number;
}

const formSchema = z.object({
  customer_id: z.string().min(1, { message: "Customer is required" }),
  status: z.string().min(1, { message: "Status is required" }),
  items: z.array(z.object({
    product_id: z.string().min(1, { message: "Product is required" }),
    quantity: z.number().min(1, { message: "Quantity must be at least 1" }),
    price: z.number().positive({ message: "Price must be positive" }),
  }))
});

export default function OrderForm({ order, onSuccess, onCancel }: OrderFormProps) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      customer_id: order?.customer_id || "",
      status: order?.status || "pending",
      items: [],
    },
  });

  useEffect(() => {
    fetchCustomers();
    fetchProducts();
    if (order) {
      fetchOrderItems();
    } else {
      // Add an empty item for new orders
      addItem();
    }
  }, [order]);

  const fetchCustomers = async () => {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('name');
      
      if (error) throw error;
      setCustomers(data || []);
    } catch (error) {
      console.error('Error fetching customers:', error);
      toast.error('Failed to load customers');
    }
  };

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('name');
      
      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Failed to load products');
    }
  };

  const fetchOrderItems = async () => {
    try {
      if (!order) return;
      
      const { data, error } = await supabase
        .from('order_items')
        .select(`
          *,
          products(name)
        `)
        .eq('order_id', order.id);
      
      if (error) throw error;
      
      const formattedItems = data?.map(item => ({
        id: item.id,
        product_id: item.product_id,
        product_name: item.products.name,
        quantity: item.quantity,
        price: item.price,
      }));
      
      setOrderItems(formattedItems || []);
      form.setValue('items', formattedItems || []);
    } catch (error) {
      console.error('Error fetching order items:', error);
      toast.error('Failed to load order items');
    }
  };

  const addItem = () => {
    const newItem = {
      product_id: "",
      quantity: 1,
      price: 0,
    };
    setOrderItems([...orderItems, newItem]);
  };

  const removeItem = (index: number) => {
    const newItems = [...orderItems];
    newItems.splice(index, 1);
    setOrderItems(newItems);
  };

  const updateItem = (index: number, field: string, value: any) => {
    const newItems = [...orderItems];
    
    // If changing product, update price automatically
    if (field === 'product_id') {
      const product = products.find(p => p.id === value);
      if (product) {
        newItems[index] = {
          ...newItems[index],
          [field]: value,
          price: product.price,
          product_name: product.name,
        };
      }
    } else {
      newItems[index] = {
        ...newItems[index],
        [field]: value,
      };
    }
    
    setOrderItems(newItems);
    form.setValue('items', newItems);
  };

  const calculateTotal = () => {
    return orderItems.reduce((total, item) => total + (item.quantity * item.price), 0);
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setLoading(true);
      
      // Make sure we have items
      if (orderItems.length === 0) {
        toast.error('At least one item is required');
        return;
      }

      // Check if all items have products
      for (const item of orderItems) {
        if (!item.product_id) {
          toast.error('All items must have a product selected');
          return;
        }
      }

      const total = calculateTotal();
      
      if (order) {
        // Update existing order
        const { error: orderError } = await supabase
          .from('orders')
          .update({
            customer_id: values.customer_id,
            status: values.status,
            amount: total,
            items: orderItems.length,
            updated_at: new Date().toISOString(),
          })
          .eq('id', order.id);
        
        if (orderError) throw orderError;

        // Delete existing items
        const { error: deleteError } = await supabase
          .from('order_items')
          .delete()
          .eq('order_id', order.id);
        
        if (deleteError) throw deleteError;

        // Add new items
        const orderItemsData = orderItems.map(item => ({
          order_id: order.id,
          product_id: item.product_id,
          quantity: item.quantity,
          price: item.price,
        }));

        const { error: itemsError } = await supabase
          .from('order_items')
          .insert(orderItemsData);
        
        if (itemsError) throw itemsError;

      } else {
        // Generate order ID (e.g., ORD-001)
        const timestamp = Date.now();
        const orderId = `ORD-${timestamp.toString().slice(-6)}`;
        
        // Create new order
        const { error: orderError } = await supabase
          .from('orders')
          .insert({
            id: orderId,
            customer_id: values.customer_id,
            status: values.status,
            amount: total,
            items: orderItems.length,
          });
        
        if (orderError) throw orderError;

        // Add items
        const orderItemsData = orderItems.map(item => ({
          order_id: orderId,
          product_id: item.product_id,
          quantity: item.quantity,
          price: item.price,
        }));

        const { error: itemsError } = await supabase
          .from('order_items')
          .insert(orderItemsData);
        
        if (itemsError) throw itemsError;
      }

      toast.success(order ? 'Order updated successfully' : 'Order created successfully');
      onSuccess();
    } catch (error) {
      console.error('Error saving order:', error);
      toast.error(order ? 'Failed to update order' : 'Failed to create order');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="customer_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Customer</FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a customer" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {customers.map((customer) => (
                      <SelectItem key={customer.id} value={customer.id}>
                        {customer.name} ({customer.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                    <SelectItem value="refunded">Refunded</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-md font-medium">Order Items</h3>
            <Button 
              type="button" 
              variant="outline" 
              size="sm"
              onClick={addItem}
            >
              <Plus className="mr-2 h-4 w-4" /> Add Item
            </Button>
          </div>

          {orderItems.length === 0 ? (
            <div className="text-center py-4 border rounded-md bg-gray-50">
              No items added. Click "Add Item" to add products to this order.
            </div>
          ) : (
            <div className="space-y-4">
              {orderItems.map((item, index) => (
                <div key={index} className="grid grid-cols-9 gap-3 items-center border rounded-md p-3">
                  <div className="col-span-4">
                    <FormItem>
                      <FormLabel className="text-xs">Product</FormLabel>
                      <Select 
                        value={item.product_id} 
                        onValueChange={(value) => updateItem(index, 'product_id', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select product" />
                        </SelectTrigger>
                        <SelectContent>
                          {products.map((product) => (
                            <SelectItem key={product.id} value={product.id}>
                              {product.name} (${product.price})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormItem>
                  </div>
                  <div className="col-span-2">
                    <FormItem>
                      <FormLabel className="text-xs">Quantity</FormLabel>
                      <Input 
                        type="number" 
                        min="1"
                        value={item.quantity} 
                        onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 0)}
                      />
                    </FormItem>
                  </div>
                  <div className="col-span-2">
                    <FormItem>
                      <FormLabel className="text-xs">Price</FormLabel>
                      <Input 
                        type="number"
                        step="0.01" 
                        min="0"
                        value={item.price} 
                        onChange={(e) => updateItem(index, 'price', parseFloat(e.target.value) || 0)}
                      />
                    </FormItem>
                  </div>
                  <div className="col-span-1 flex justify-end items-end pb-1">
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="sm"
                      onClick={() => removeItem(index)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}

              <div className="flex justify-end items-center pt-2 border-t">
                <div className="font-medium">Total: ${calculateTotal().toFixed(2)}</div>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end space-x-3">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                {order ? 'Updating...' : 'Creating...'}
              </>
            ) : (
              <>{order ? 'Update Order' : 'Create Order'}</>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
