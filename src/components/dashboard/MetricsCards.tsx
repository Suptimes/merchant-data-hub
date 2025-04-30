
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, Package, ShoppingCart, Users, TrendingUp } from "lucide-react";

export default function MetricsCards() {
  const metrics = [
    {
      title: "Total Revenue",
      value: "$12,426.89",
      change: "+4.3%",
      trend: "up",
      icon: BarChart3,
    },
    {
      title: "Orders",
      value: "243",
      change: "+10.2%",
      trend: "up",
      icon: ShoppingCart,
    },
    {
      title: "Customers",
      value: "1,249",
      change: "+25.8%",
      trend: "up",
      icon: Users,
    },
    {
      title: "Products",
      value: "89",
      change: "0%",
      trend: "neutral",
      icon: Package,
    },
  ];

  return (
    <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
      {metrics.map((metric) => (
        <Card key={metric.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-shopify-light-text">
              {metric.title}
            </CardTitle>
            <metric.icon className="h-4 w-4 text-shopify-light-text" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-shopify-text">{metric.value}</div>
            <div className="flex items-center text-sm mt-1">
              {metric.trend === "up" && (
                <TrendingUp className="mr-1 h-4 w-4 text-green-500" />
              )}
              <span
                className={
                  metric.trend === "up"
                    ? "text-green-500"
                    : metric.trend === "down"
                    ? "text-red-500"
                    : "text-shopify-light-text"
                }
              >
                {metric.change} from last month
              </span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
