
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Search, ShoppingCart } from "lucide-react";

export default function Orders() {
  const orders = [
    {
      id: "ORD-5392",
      customer: "John Smith",
      status: "processing",
      date: "Apr 29, 2023",
      amount: "$129.99",
      items: 2
    },
    {
      id: "ORD-5391",
      customer: "Sarah Johnson",
      status: "shipped",
      date: "Apr 28, 2023",
      amount: "$79.95",
      items: 1
    },
    {
      id: "ORD-5390",
      customer: "Michael Brown",
      status: "delivered",
      date: "Apr 28, 2023",
      amount: "$249.00",
      items: 3
    },
    {
      id: "ORD-5389",
      customer: "Emily Davis",
      status: "processing",
      date: "Apr 27, 2023",
      amount: "$65.49",
      items: 1
    },
    {
      id: "ORD-5388",
      customer: "David Wilson",
      status: "delivered",
      date: "Apr 27, 2023",
      amount: "$189.99",
      items: 2
    },
    {
      id: "ORD-5387",
      customer: "Linda Thompson",
      status: "shipped",
      date: "Apr 26, 2023",
      amount: "$124.50",
      items: 2
    },
    {
      id: "ORD-5386",
      customer: "Robert Martinez",
      status: "processing",
      date: "Apr 26, 2023",
      amount: "$32.99",
      items: 1
    },
  ];

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
          />
        </div>
      </div>
      
      <Card>
        <CardHeader className="pt-6">
          <CardTitle>All Orders</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
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
                {orders.map((order) => (
                  <tr key={order.id} className="border-b border-gray-100 last:border-0">
                    <td className="py-3 pl-4">
                      <div className="flex items-center">
                        <div className="mr-3 bg-shopify-gray rounded p-1.5">
                          <ShoppingCart className="h-5 w-5 text-shopify-light-text" />
                        </div>
                        <span className="font-medium">{order.id}</span>
                      </div>
                    </td>
                    <td className="py-3">{order.customer}</td>
                    <td className="py-3 text-sm text-shopify-light-text">{order.date}</td>
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
                    <td className="py-3 font-medium">{order.amount}</td>
                    <td className="py-3 pr-4 text-right">
                      <Button variant="ghost" size="sm">
                        View
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
