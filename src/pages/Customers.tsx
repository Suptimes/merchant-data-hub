
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Plus, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Customer {
  id: string;
  name: string;
  email: string;
}

interface OrderSummary {
  customer_id: string;
  order_count: number;
  total_spent: number;
}

export default function Customers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [orderSummaries, setOrderSummaries] = useState<Record<string, OrderSummary>>({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchCustomers = async () => {
      setLoading(true);
      try {
        // Fetch customers
        const { data: customerData, error: customerError } = await supabase
          .from('customers')
          .select('*')
          .order('name');
        
        if (customerError) {
          throw customerError;
        }
        
        setCustomers(customerData || []);
        
        // Fetch order summaries for each customer
        const { data: orderData, error: orderError } = await supabase
          .from('orders')
          .select('customer_id, amount');
        
        if (orderError) {
          throw orderError;
        }
        
        // Process order data
        const summaries: Record<string, OrderSummary> = {};
        
        orderData?.forEach(order => {
          if (!summaries[order.customer_id]) {
            summaries[order.customer_id] = {
              customer_id: order.customer_id,
              order_count: 0,
              total_spent: 0
            };
          }
          
          summaries[order.customer_id].order_count += 1;
          summaries[order.customer_id].total_spent += Number(order.amount);
        });
        
        setOrderSummaries(summaries);
      } catch (error) {
        console.error('Error fetching customers:', error);
        toast.error("Failed to load customers");
      } finally {
        setLoading(false);
      }
    };

    fetchCustomers();
  }, []);

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatCurrency = (amount: number) => {
    return `$${amount.toFixed(2)}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold tracking-tight">Customers</h2>
        <div className="flex gap-3 w-full sm:w-auto">
          <div className="relative flex-grow sm:flex-grow-0">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-shopify-light-text" />
            <Input
              type="search"
              placeholder="Search customers..."
              className="pl-8 w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button 
            className="bg-shopify-blue hover:bg-shopify-dark-blue"
            onClick={() => {
              toast.info("Add customer feature coming soon");
            }}
          >
            <Plus className="mr-2 h-4 w-4" /> Add Customer
          </Button>
        </div>
      </div>
      
      <Card>
        <CardHeader className="pt-6">
          <CardTitle>All Customers</CardTitle>
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
                    <th className="font-medium pb-3 pl-4">Customer</th>
                    <th className="font-medium pb-3">Email</th>
                    <th className="font-medium pb-3">Orders</th>
                    <th className="font-medium pb-3">Total Spent</th>
                    <th className="font-medium pb-3 pr-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCustomers.map((customer) => (
                    <tr key={customer.id} className="border-b border-gray-100 last:border-0">
                      <td className="py-3 pl-4">
                        <div className="flex items-center">
                          <div className="mr-3 h-8 w-8 rounded-full bg-shopify-gray flex items-center justify-center">
                            <span className="text-shopify-blue font-medium">
                              {customer.name[0]}
                            </span>
                          </div>
                          <span className="font-medium">{customer.name}</span>
                        </div>
                      </td>
                      <td className="py-3 text-sm">{customer.email}</td>
                      <td className="py-3">{orderSummaries[customer.id]?.order_count || 0}</td>
                      <td className="py-3">
                        {orderSummaries[customer.id] 
                          ? formatCurrency(orderSummaries[customer.id].total_spent) 
                          : "$0.00"}
                      </td>
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
