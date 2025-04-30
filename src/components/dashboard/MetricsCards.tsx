
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, Package, ShoppingCart, Users, TrendingUp, TrendingDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Metric {
  title: string;
  value: string;
  change: string;
  trend: "up" | "down" | "neutral";
  icon: any;
}

export default function MetricsCards() {
  const [metrics, setMetrics] = useState<Metric[]>([
    {
      title: "Total Revenue",
      value: "Loading...",
      change: "0%",
      trend: "neutral",
      icon: BarChart3,
    },
    {
      title: "Orders",
      value: "Loading...",
      change: "0%",
      trend: "neutral",
      icon: ShoppingCart,
    },
    {
      title: "Customers",
      value: "Loading...",
      change: "0%",
      trend: "neutral",
      icon: Users,
    },
    {
      title: "Products",
      value: "Loading...",
      change: "0%",
      trend: "neutral",
      icon: Package,
    },
  ]);
  
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      setLoading(true);
      try {
        // Fetch all metrics we need
        const { data: revenueData, error: revenueError } = await supabase
          .rpc('get_total_sales');
        
        const { data: orderCountData, error: orderCountError } = await supabase
          .rpc('get_order_count');
        
        const { data: customerCountData, error: customerCountError } = await supabase
          .rpc('get_customer_count');
        
        const { count: productCount, error: productCountError } = await supabase
          .from('products')
          .select('*', { count: 'exact', head: true });
        
        if (revenueError || orderCountError || customerCountError || productCountError) {
          throw new Error("Error fetching metrics data");
        }
        
        // Update metrics with real data
        setMetrics([
          {
            title: "Total Revenue",
            value: `$${Number(revenueData || 0).toFixed(2)}`,
            change: "+4.3%",
            trend: "up",
            icon: BarChart3,
          },
          {
            title: "Orders",
            value: String(orderCountData || 0),
            change: "+10.2%",
            trend: "up",
            icon: ShoppingCart,
          },
          {
            title: "Customers",
            value: String(customerCountData || 0),
            change: "+25.8%",
            trend: "up",
            icon: Users,
          },
          {
            title: "Products",
            value: String(productCount || 0),
            change: "0%",
            trend: "neutral",
            icon: Package,
          },
        ]);
      } catch (error) {
        console.error('Error fetching metrics:', error);
        toast.error("Failed to load dashboard metrics");
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, []);

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
            <div className="text-2xl font-bold text-shopify-text">
              {loading ? 
                <div className="h-6 w-24 bg-gray-200 animate-pulse rounded"></div> 
                : metric.value
              }
            </div>
            <div className="flex items-center text-sm mt-1">
              {metric.trend === "up" ? (
                <TrendingUp className="mr-1 h-4 w-4 text-green-500" />
              ) : metric.trend === "down" ? (
                <TrendingDown className="mr-1 h-4 w-4 text-red-500" />
              ) : null}
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
