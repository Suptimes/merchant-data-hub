
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search, ShoppingCart } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface Order {
  id: string;
  customer_name: string;
  date: string;
  total: number;
  status: "paid" | "pending" | "failed" | "refunded";
  items: number;
}

const sampleOrders: Order[] = [
  {
    id: "ORD-001",
    customer_name: "John Doe",
    date: "2023-05-28",
    total: 125.95,
    status: "paid",
    items: 3,
  },
  {
    id: "ORD-002",
    customer_name: "Jane Smith",
    date: "2023-05-27",
    total: 85.50,
    status: "pending",
    items: 2,
  },
  {
    id: "ORD-003",
    customer_name: "Robert Johnson",
    date: "2023-05-26",
    total: 220.00,
    status: "paid",
    items: 5,
  },
  {
    id: "ORD-004",
    customer_name: "Emily Wilson",
    date: "2023-05-25",
    total: 45.95,
    status: "refunded",
    items: 1,
  },
  {
    id: "ORD-005",
    customer_name: "Michael Brown",
    date: "2023-05-24",
    total: 175.25,
    status: "paid",
    items: 4,
  },
];

export default function Orders() {
  const [orders] = useState<Order[]>(sampleOrders);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredOrders = orders.filter((order) =>
    order.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold tracking-tight">Orders</h2>
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
      </div>

      <Card>
        <CardHeader className="pt-6">
          <CardTitle>Recent Orders</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
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
                      <td className="py-3">{formatDate(order.date)}</td>
                      <td className="py-3">{order.customer_name}</td>
                      <td className="py-3 font-medium">{formatCurrency(order.total)}</td>
                      <td className="py-3">
                        <Badge variant="outline" className={cn(getStatusColor(order.status))}>
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </Badge>
                      </td>
                      <td className="py-3 text-right pr-4">
                        <Button variant="ghost" size="sm">
                          Details
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
