
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search, ShoppingCart, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Link, useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import OrderDetails from "@/components/orders/OrderDetails";
import OrderForm from "@/components/orders/OrderForm";

interface Order {
  id: string;
  customer_name?: string;
  date?: string;
  total?: number; // Make total optional
  amount: number; // Add amount property
  status: "paid" | "pending" | "failed" | "refunded";
  items: number;
  customer_id: string;
  created_at: string;
  updated_at: string;
  customers?: {
    name: string;
    email: string;
  };
}

export default function Orders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select(`
          *,
          customers(name, email)
        `)
        .order('created_at', { ascending: false });

      if (ordersError) throw ordersError;

      const formattedOrders = ordersData.map(order => ({
        ...order,
        customer_name: order.customers?.name || 'Unknown',
        date: order.created_at,
        total: order.amount, // Map amount to total for backward compatibility
      }));

      setOrders(formattedOrders);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const filteredOrders = orders.filter((order) =>
    (order.customer_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    order.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(date);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "failed":
        return "bg-red-100 text-red-800";
      case "refunded":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const handleShowDetails = (order: Order) => {
    setSelectedOrder(order);
    setShowDetails(true);
  };

  const handleEditOrder = (order: Order) => {
    setSelectedOrder(order);
    setShowEdit(true);
  };

  const handleOrderUpdated = () => {
    setShowEdit(false);
    fetchOrders();
    toast.success('Order updated successfully');
  };

  const handleOrderCreated = () => {
    setShowEdit(false);
    fetchOrders();
    toast.success('Order created successfully');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold tracking-tight">Orders</h2>
        <div className="flex gap-3 w-full sm:w-auto">
          <div className="relative flex-grow sm:flex-grow-0">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-shopify-light-text" />
            <Input
              type="search"
              placeholder="Search by order ID or customer..."
              className="pl-8 w-full md:w-80"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button 
            className="bg-shopify-blue hover:bg-shopify-dark-blue"
            onClick={() => {
              setSelectedOrder(null);
              setShowEdit(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4" /> New Order
          </Button>
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
                    <th className="font-medium pb-3">Date</th>
                    <th className="font-medium pb-3">Customer</th>
                    <th className="font-medium pb-3">Total</th>
                    <th className="font-medium pb-3">Status</th>
                    <th className="font-medium pb-3 pr-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-6 text-center text-gray-500">
                        {searchTerm ? 'No orders match your search.' : 'No orders found.'}
                      </td>
                    </tr>
                  ) : (
                    filteredOrders.map((order) => (
                      <tr key={order.id} className="border-b border-gray-100 last:border-0">
                        <td className="py-3 pl-4">
                          <div className="flex items-center">
                            <div className="mr-3 bg-shopify-gray rounded p-1.5">
                              <ShoppingCart className="h-5 w-5 text-shopify-light-text" />
                            </div>
                            <span className="font-medium">{order.id}</span>
                          </div>
                        </td>
                        <td className="py-3">{formatDate(order.date || order.created_at)}</td>
                        <td className="py-3">{order.customer_name}</td>
                        <td className="py-3 font-medium">{formatCurrency(order.amount)}</td>
                        <td className="py-3">
                          <Badge variant="outline" className={cn(getStatusColor(order.status))}>
                            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                          </Badge>
                        </td>
                        <td className="py-3 text-right pr-4 flex justify-end space-x-2">
                          <Button variant="ghost" size="sm" onClick={() => handleShowDetails(order)}>
                            Details
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleEditOrder(order)}>
                            Edit
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Order Details Dialog */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Order Details</DialogTitle>
            <DialogDescription>
              View detailed information about this order.
            </DialogDescription>
          </DialogHeader>
          {selectedOrder && <OrderDetails orderId={selectedOrder.id} />}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetails(false)}>Close</Button>
            <Button onClick={() => {
              setShowDetails(false);
              handleEditOrder(selectedOrder!);
            }}>Edit Order</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Order Edit Dialog */}
      <Dialog open={showEdit} onOpenChange={setShowEdit}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedOrder ? 'Edit Order' : 'Create New Order'}</DialogTitle>
          </DialogHeader>
          <OrderForm 
            order={selectedOrder} 
            onSuccess={selectedOrder ? handleOrderUpdated : handleOrderCreated} 
            onCancel={() => setShowEdit(false)} 
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
