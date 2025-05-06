
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface OrderDetailsProps {
  orderId: string;
}

interface OrderItem {
  id: string;
  product_id: string;
  order_id: string;
  quantity: number;
  price: number;
  products: {
    name: string;
    sku: string;
    image_url: string | null;
  };
}

interface OrderDetails {
  id: string;
  status: string;
  amount: number;
  created_at: string;
  updated_at: string;
  customer_id: string;
  items: number;
  customers: {
    name: string;
    email: string;
  };
  order_items: OrderItem[];
}

export default function OrderDetails({ orderId }: OrderDetailsProps) {
  const [loading, setLoading] = useState(true);
  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null);

  useEffect(() => {
    fetchOrderDetails();
  }, [orderId]);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          customers(name, email),
          order_items(
            *,
            products(name, sku, image_url)
          )
        `)
        .eq('id', orderId)
        .single();

      if (error) throw error;
      setOrderDetails(data);
    } catch (error) {
      console.error('Error fetching order details:', error);
      toast.error('Failed to load order details');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(date);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  if (loading) {
    return <div className="py-8 flex justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-shopify-blue"></div>
    </div>;
  }

  if (!orderDetails) {
    return <div className="text-center py-4">Order not found</div>;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="text-sm font-medium text-gray-500">Order Information</h3>
          <div className="mt-2 space-y-2">
            <p><span className="font-medium">ID:</span> {orderDetails.id}</p>
            <p><span className="font-medium">Date:</span> {formatDate(orderDetails.created_at)}</p>
            <p>
              <span className="font-medium">Status:</span> 
              <Badge className="ml-2" variant="outline">
                {orderDetails.status.charAt(0).toUpperCase() + orderDetails.status.slice(1)}
              </Badge>
            </p>
            <p><span className="font-medium">Total:</span> {formatCurrency(orderDetails.amount)}</p>
          </div>
        </div>
        <div>
          <h3 className="text-sm font-medium text-gray-500">Customer Information</h3>
          <div className="mt-2 space-y-2">
            <p><span className="font-medium">Name:</span> {orderDetails.customers?.name}</p>
            <p><span className="font-medium">Email:</span> {orderDetails.customers?.email}</p>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-medium text-gray-500 mb-2">Order Items</h3>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead>Quantity</TableHead>
              <TableHead>Price</TableHead>
              <TableHead className="text-right">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orderDetails.order_items?.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">{item.products.name}</TableCell>
                <TableCell>{item.products.sku}</TableCell>
                <TableCell>{item.quantity}</TableCell>
                <TableCell>{formatCurrency(item.price)}</TableCell>
                <TableCell className="text-right">{formatCurrency(item.price * item.quantity)}</TableCell>
              </TableRow>
            ))}
            <TableRow>
              <TableCell colSpan={4} className="text-right font-medium">Total</TableCell>
              <TableCell className="text-right font-medium">{formatCurrency(orderDetails.amount)}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
