
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Plus, Tag, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Discount {
  id: string;
  code: string;
  amount: number;
  type: "percentage" | "fixed";
  status: "active" | "expired" | "scheduled";
  usage_count: number;
}

const sampleDiscounts: Discount[] = [
  {
    id: "1",
    code: "SUMMER20",
    amount: 20,
    type: "percentage",
    status: "active",
    usage_count: 145,
  },
  {
    id: "2",
    code: "WELCOME10",
    amount: 10,
    type: "percentage",
    status: "active",
    usage_count: 89,
  },
  {
    id: "3",
    code: "FREESHIP",
    amount: 15,
    type: "fixed",
    status: "expired",
    usage_count: 203,
  },
  {
    id: "4",
    code: "HOLIDAY",
    amount: 25,
    type: "percentage",
    status: "scheduled",
    usage_count: 0,
  },
];

export default function Discounts() {
  const [discounts] = useState<Discount[]>(sampleDiscounts);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredDiscounts = discounts.filter((discount) =>
    discount.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDiscount = (discount: Discount) => {
    if (discount.type === "percentage") {
      return `${discount.amount}%`;
    } else {
      return `$${discount.amount.toFixed(2)}`;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "expired":
        return "bg-gray-100 text-gray-800";
      case "scheduled":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold tracking-tight">Discount Codes</h2>
        <div className="flex gap-3 w-full sm:w-auto">
          <div className="relative flex-grow sm:flex-grow-0">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-shopify-light-text" />
            <Input
              type="search"
              placeholder="Search discounts..."
              className="pl-8 w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button className="bg-shopify-blue hover:bg-shopify-dark-blue">
            <Plus className="mr-2 h-4 w-4" /> Create Discount
          </Button>
        </div>
      </div>
      
      <Card>
        <CardHeader className="pt-6">
          <CardTitle>All Discount Codes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs border-b border-gray-200">
                  <th className="font-medium pb-3 pl-4">Discount Code</th>
                  <th className="font-medium pb-3">Value</th>
                  <th className="font-medium pb-3">Status</th>
                  <th className="font-medium pb-3">Usage</th>
                  <th className="font-medium pb-3 pr-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredDiscounts.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-gray-500">
                      {searchTerm ? 'No discounts match your search.' : 'No discounts found.'}
                    </td>
                  </tr>
                ) : (
                  filteredDiscounts.map((discount) => (
                    <tr key={discount.id} className="border-b border-gray-100 last:border-0">
                      <td className="py-3 pl-4">
                        <div className="flex items-center">
                          <div className="mr-3 bg-shopify-gray rounded p-1.5">
                            <Tag className="h-5 w-5 text-shopify-light-text" />
                          </div>
                          <span className="font-medium">{discount.code}</span>
                        </div>
                      </td>
                      <td className="py-3">
                        <span className="font-medium">{formatDiscount(discount)}</span>
                        <span className="ml-1 text-shopify-light-text text-sm">
                          {discount.type === "percentage" ? "off" : "discount"}
                        </span>
                      </td>
                      <td className="py-3">
                        <Badge variant="outline" className={getStatusColor(discount.status)}>
                          {discount.status.charAt(0).toUpperCase() + discount.status.slice(1)}
                        </Badge>
                      </td>
                      <td className="py-3">{discount.usage_count} uses</td>
                      <td className="py-3 text-right pr-4">
                        <Button variant="ghost" size="sm">
                          Edit
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
