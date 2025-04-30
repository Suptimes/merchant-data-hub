
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Percent, Plus, Search } from "lucide-react";

export default function Discounts() {
  const discounts = [
    {
      id: "SUMMER25",
      description: "Summer Sale",
      type: "percentage",
      value: "25%",
      status: "active",
      used: 154,
      expires: "Jul 31, 2023"
    },
    {
      id: "WELCOME10",
      description: "New Customer Discount",
      type: "percentage",
      value: "10%",
      status: "active",
      used: 278,
      expires: "No expiration"
    },
    {
      id: "FLASH50",
      description: "Flash Sale",
      type: "percentage",
      value: "50%",
      status: "expired",
      used: 67,
      expires: "Apr 15, 2023"
    },
    {
      id: "FREESHIP",
      description: "Free Shipping",
      type: "shipping",
      value: "Free",
      status: "active",
      used: 432,
      expires: "No expiration"
    },
    {
      id: "BUNDLE20",
      description: "Bundle Discount",
      type: "percentage",
      value: "20%",
      status: "scheduled",
      used: 0,
      expires: "Starts May 15, 2023"
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold tracking-tight">Discounts</h2>
        <div className="flex gap-3 w-full sm:w-auto">
          <div className="relative flex-grow sm:flex-grow-0">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-shopify-light-text" />
            <Input
              type="search"
              placeholder="Search discounts..."
              className="pl-8 w-full"
            />
          </div>
          <Button className="bg-shopify-blue hover:bg-shopify-dark-blue">
            <Plus className="mr-2 h-4 w-4" /> Create Discount
          </Button>
        </div>
      </div>
      
      <Card>
        <CardHeader className="pt-6">
          <CardTitle>All Discounts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs border-b border-gray-200">
                  <th className="font-medium pb-3 pl-4">Code</th>
                  <th className="font-medium pb-3">Description</th>
                  <th className="font-medium pb-3">Value</th>
                  <th className="font-medium pb-3">Used</th>
                  <th className="font-medium pb-3">Status</th>
                  <th className="font-medium pb-3">Expires</th>
                  <th className="font-medium pb-3 pr-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {discounts.map((discount) => (
                  <tr key={discount.id} className="border-b border-gray-100 last:border-0">
                    <td className="py-3 pl-4">
                      <div className="flex items-center">
                        <div className="mr-3 bg-shopify-gray rounded p-1.5">
                          <Percent className="h-5 w-5 text-shopify-light-text" />
                        </div>
                        <span className="font-medium">{discount.id}</span>
                      </div>
                    </td>
                    <td className="py-3 text-sm">{discount.description}</td>
                    <td className="py-3">{discount.value}</td>
                    <td className="py-3">{discount.used}</td>
                    <td className="py-3">
                      <Badge
                        variant="outline"
                        className={
                          discount.status === "active"
                            ? "border-green-500 text-green-500"
                            : discount.status === "expired"
                            ? "border-red-500 text-red-500"
                            : "border-amber-500 text-amber-500"
                        }
                      >
                        {discount.status}
                      </Badge>
                    </td>
                    <td className="py-3 text-sm text-shopify-light-text">{discount.expires}</td>
                    <td className="py-3 pr-4 text-right">
                      <Button variant="ghost" size="sm">
                        Edit
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
