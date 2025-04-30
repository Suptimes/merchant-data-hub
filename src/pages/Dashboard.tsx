
import MetricsCards from "@/components/dashboard/MetricsCards";
import RecentOrders from "@/components/dashboard/RecentOrders";
import SalesChart from "@/components/dashboard/SalesChart";
import TopProducts from "@/components/dashboard/TopProducts";

export default function Dashboard() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
        <div className="flex items-center space-x-2">
          <div className="text-sm text-shopify-light-text">Today: {new Date().toLocaleDateString()}</div>
        </div>
      </div>

      <MetricsCards />
      
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
        <SalesChart />
      </div>
      
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
        <RecentOrders />
        <TopProducts />
      </div>
    </div>
  );
}
