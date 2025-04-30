
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Package, Plus, Search } from "lucide-react";

export default function Products() {
  const products = [
    { id: 1, name: "Wireless Headphones", sku: "WH-001", price: "$129.99", inventory: 45 },
    { id: 2, name: "Smart Watch Series 4", sku: "SW-004", price: "$249.99", inventory: 32 },
    { id: 3, name: "Laptop Pro 15\"", sku: "LP-015", price: "$1299.99", inventory: 12 },
    { id: 4, name: "Bluetooth Speaker", sku: "BS-010", price: "$79.99", inventory: 78 },
    { id: 5, name: "USB-C Adapter", sku: "USB-C-22", price: "$24.99", inventory: 124 },
    { id: 6, name: "Wireless Charging Pad", sku: "WCP-003", price: "$39.99", inventory: 56 },
    { id: 7, name: "Mechanical Keyboard", sku: "KB-001", price: "$149.99", inventory: 22 },
    { id: 8, name: "Ergonomic Mouse", sku: "EM-005", price: "$59.99", inventory: 41 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold tracking-tight">Products</h2>
        <div className="flex gap-3 w-full sm:w-auto">
          <div className="relative flex-grow sm:flex-grow-0">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-shopify-light-text" />
            <Input
              type="search"
              placeholder="Search products..."
              className="pl-8 w-full"
            />
          </div>
          <Button className="bg-shopify-blue hover:bg-shopify-dark-blue">
            <Plus className="mr-2 h-4 w-4" /> Add Product
          </Button>
        </div>
      </div>
      
      <Card>
        <CardHeader className="pt-6">
          <CardTitle>All Products</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs border-b border-gray-200">
                  <th className="font-medium pb-3 pl-4">Product</th>
                  <th className="font-medium pb-3">SKU</th>
                  <th className="font-medium pb-3">Price</th>
                  <th className="font-medium pb-3">Inventory</th>
                  <th className="font-medium pb-3 pr-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.id} className="border-b border-gray-100 last:border-0">
                    <td className="py-3 pl-4">
                      <div className="flex items-center">
                        <div className="mr-3 bg-shopify-gray rounded p-1.5">
                          <Package className="h-5 w-5 text-shopify-light-text" />
                        </div>
                        <span className="font-medium">{product.name}</span>
                      </div>
                    </td>
                    <td className="py-3 text-sm text-shopify-light-text">{product.sku}</td>
                    <td className="py-3">{product.price}</td>
                    <td className="py-3">{product.inventory}</td>
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
