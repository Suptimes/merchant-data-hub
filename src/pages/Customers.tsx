
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Plus, Search, Users } from "lucide-react";

export default function Customers() {
  const customers = [
    { id: 1, name: "John Smith", email: "john.smith@example.com", orders: 5, spent: "$432.95" },
    { id: 2, name: "Sarah Johnson", email: "sarah.j@example.com", orders: 3, spent: "$245.85" },
    { id: 3, name: "Michael Brown", email: "m.brown@example.com", orders: 12, spent: "$1,432.50" },
    { id: 4, name: "Emily Davis", email: "emily.davis@example.com", orders: 2, spent: "$129.98" },
    { id: 5, name: "David Wilson", email: "d.wilson@example.com", orders: 7, spent: "$654.30" },
    { id: 6, name: "Linda Thompson", email: "l.thompson@example.com", orders: 4, spent: "$321.45" },
  ];

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
            />
          </div>
          <Button className="bg-shopify-blue hover:bg-shopify-dark-blue">
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
                {customers.map((customer) => (
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
                    <td className="py-3">{customer.orders}</td>
                    <td className="py-3">{customer.spent}</td>
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
