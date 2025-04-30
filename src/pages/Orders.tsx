
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Search, ShoppingCart } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Order {
  id: string;
  customer_id: string;
  customer_name: string;
  status: "processing" | "shipped" | "delivered";
  created_at: string;
  amount: number;
  items: number;
}

export default function Orders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      try {
        // Fetch orders with customer information
        const { data, error } = await supabase
          .from('orders')
          .select(`
            *,
            customers:customer_id (name)
          `)
          .order('created_at', { ascending: false });
        
        if (error) {
          throw error;
        }
        
        // Transform data to match expected format
        const formattedOrders: Order[] = data?.map(order => ({
          id: order.id,
          customer_id: order.customer_id,
          customer_name: order.customers?.name || 'Unknown',
          status: order.status,
          created_at: order.created_at,
          amount: order.amount,
          items: order.items
        })) || [];
        
        setOrders(formattedOrders);
      } catch (error) {
        console.error('Error fetching orders:', error);
        toast.error("Failed to load orders");
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  const filteredOrders = orders.filter(order =>
    order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.customer_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatCurrency = (amount: number) => {
    return `$${amount.toFixed(2)}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold tracking-tight">Orders</h2>
        <div className="relative flex-grow sm:flex-grow-0">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-shopify-light-text" />
          <Input
            type="search"
            placeholder="Search orders..."
            className="pl-8 w-full"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      
      <Card>
        <CardHeader className="pt-6">
          <CardTitle>All Orders</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            {loading ? (
              <div className="py-8 flex justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-shopify-blue"></div>
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="text-left text-xs border-b border-gray-200">
                    <th className="font-medium pb-3 pl-4">Order</th>
                    <th className="font-medium pb-3">Customer</th>
                    <th className="font-medium pb-3">Date</th>
                    <th className="font-medium pb-3">Status</th>
                    <th className="font-medium pb-3">Items</th>
                    <th className="font-medium pb-3">Total</th>
                    <th className="font-medium pb-3 pr-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map((order) => (
                    <tr key={order.id} className="border-b border-gray-100 last:border-0">
                      <td className="py-3 pl-4">
                        <div className="flex items-center">
                          <div className="mr-3 bg-shopify-gray rounded p-1.5">
                            <ShoppingCart className="h-5 w-5 text-shopify-light-text" />
                          </div>
                          <span className="font-medium">{order.id}</span>
                        </div>
                      </td>
                      <td className="py-3">{order.customer_name}</td>
                      <td className="py-3 text-sm text-shopify-light-text">{formatDate(order.created_at)}</td>
                      <td className="py-3">
                        <Badge
                          variant="outline"
                          className={cn(
                            "font-medium text-xs",
                            order.status === "processing" && "border-amber-500 text-amber-500",
                            order.status === "shipped" && "border-blue-500 text-blue-500",
                            order.status === "delivered" && "border-green-500 text-green-500"
                          )}
                        >
                          {order.status}
                        </Badge>
                      </td>
                      <td className="py-3">{order.items}</td>
                      <td className="py-3 font-medium">{formatCurrency(order.amount)}</td>
                      <td className="py-3 pr-4 text-right">
                        <Button variant="ghost" size="sm">
                          View
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
