
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface Order {
  id: string;
  customer: string;
  status: "processing" | "shipped" | "delivered";
  date: string;
  amount: string;
}

const recentOrders: Order[] = [
  {
    id: "ORD-5392",
    customer: "John Smith",
    status: "processing",
    date: "Apr 29, 2023",
    amount: "$129.99",
  },
  {
    id: "ORD-5391",
    customer: "Sarah Johnson",
    status: "shipped",
    date: "Apr 28, 2023",
    amount: "$79.95",
  },
  {
    id: "ORD-5390",
    customer: "Michael Brown",
    status: "delivered",
    date: "Apr 28, 2023",
    amount: "$249.00",
  },
  {
    id: "ORD-5389",
    customer: "Emily Davis",
    status: "processing",
    date: "Apr 27, 2023",
    amount: "$65.49",
  },
  {
    id: "ORD-5388",
    customer: "David Wilson",
    status: "delivered",
    date: "Apr 27, 2023",
    amount: "$189.99",
  },
];

export default function RecentOrders() {
  return (
    <Card className="col-span-full md:col-span-2">
      <CardHeader>
        <CardTitle>Recent Orders</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-xs border-b border-gray-200">
                <th className="font-medium pb-2 pl-4">Order</th>
                <th className="font-medium pb-2">Customer</th>
                <th className="font-medium pb-2">Status</th>
                <th className="font-medium pb-2">Date</th>
                <th className="font-medium pb-2 pr-4 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map((order) => (
                <tr key={order.id} className="border-b border-gray-100 last:border-0">
                  <td className="py-2 pl-4 text-sm">{order.id}</td>
                  <td className="py-2 text-sm">{order.customer}</td>
                  <td className="py-2">
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
                  <td className="py-2 text-sm text-shopify-light-text">{order.date}</td>
                  <td className="py-2 pr-4 text-sm font-medium text-right">{order.amount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
