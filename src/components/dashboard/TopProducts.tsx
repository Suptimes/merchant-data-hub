
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface TopProduct {
  name: string;
  sales: number;
  percentage: number;
}

const topProducts: TopProduct[] = [
  {
    name: "Wireless Headphones",
    sales: 899,
    percentage: 100,
  },
  {
    name: "Smart Watch Series 4",
    sales: 745,
    percentage: 83,
  },
  {
    name: "Laptop Pro 15\"",
    sales: 532,
    percentage: 59,
  },
  {
    name: "Bluetooth Speaker",
    sales: 450,
    percentage: 50,
  },
  {
    name: "USB-C Adapter",
    sales: 389,
    percentage: 43,
  },
];

export default function TopProducts() {
  return (
    <Card className="col-span-full md:col-span-1">
      <CardHeader>
        <CardTitle>Top Products</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {topProducts.map((product) => (
            <div key={product.name} className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">{product.name}</p>
                <span className="text-sm text-shopify-light-text">{product.sales} sold</span>
              </div>
              <Progress value={product.percentage} className="h-2 bg-shopify-gray" indicatorClassName="bg-shopify-blue" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
