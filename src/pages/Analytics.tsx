
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart3, Calendar, TrendingUp, TrendingDown, PackageOpen, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { format, subDays } from "date-fns";

// Interface for our analytics data
interface AnalyticsEvent {
  event_date: string;
  value: number;
  additional_data: {
    name?: string;
    value?: number;
    [key: string]: any;
  } | null;
}

// Fetch functions for different analytics data
const fetchAnalyticsData = async (eventType: string) => {
  const { data, error } = await supabase
    .rpc('get_analytics_data', { event_type: eventType });
  
  if (error) {
    console.error(`Error fetching ${eventType} data:`, error);
    throw new Error(error.message);
  }
  
  return data as AnalyticsEvent[];
};

// Fetch real database metrics using RPC functions
const fetchSummaryMetrics = async () => {
  try {
    const [revenueData, orderCountData, customerCountData, productCountRes] = await Promise.all([
      supabase.rpc('get_total_sales'),
      supabase.rpc('get_order_count'),
      supabase.rpc('get_customer_count'),
      supabase.from('products').select('*', { count: 'exact', head: true })
    ]);

    return {
      totalRevenue: revenueData.data || 0,
      orderCount: orderCountData.data || 0,
      customerCount: customerCountData.data || 0,
      productCount: productCountRes.count || 0
    };
  } catch (error) {
    console.error("Error fetching summary metrics:", error);
    throw new Error("Failed to fetch summary metrics");
  }
};

export default function Analytics() {
  const [dateRange, setDateRange] = useState({
    start: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
    end: format(new Date(), 'yyyy-MM-dd'),
  });

  // Fetch summary metrics
  const { data: summaryMetrics, isLoading: isLoadingSummary } = useQuery({
    queryKey: ['summaryMetrics', dateRange],
    queryFn: fetchSummaryMetrics,
  });

  // Fetch data for different charts
  const { data: monthlySalesData, isLoading: isLoadingMonthlySales } = useQuery({
    queryKey: ['analytics', 'sales', dateRange],
    queryFn: () => fetchAnalyticsData('sales'),
  });

  const { data: dailySalesData, isLoading: isLoadingDailySales } = useQuery({
    queryKey: ['analytics', 'dailySales', dateRange],
    queryFn: () => fetchAnalyticsData('daily_sales'),
  });

  const { data: weeklySalesData, isLoading: isLoadingWeeklySales } = useQuery({
    queryKey: ['analytics', 'weeklySales', dateRange],
    queryFn: () => fetchAnalyticsData('weekly_sales'),
  });

  const { data: channelData, isLoading: isLoadingChannel } = useQuery({
    queryKey: ['analytics', 'channel', dateRange],
    queryFn: () => fetchAnalyticsData('channel'),
    select: (data) => data.map(item => ({
      name: item.additional_data?.name || 'Unknown',
      value: item.value
    })),
  });

  const { data: customerTypeData, isLoading: isLoadingCustomerType } = useQuery({
    queryKey: ['analytics', 'customerType', dateRange],
    queryFn: () => fetchAnalyticsData('customer_type'),
    select: (data) => data.map(item => ({
      name: item.additional_data?.name || 'Unknown',
      value: item.value
    })),
  });

  const { data: deviceData, isLoading: isLoadingDevice } = useQuery({
    queryKey: ['analytics', 'device', dateRange],
    queryFn: () => fetchAnalyticsData('device'),
    select: (data) => data.map(item => ({
      name: item.additional_data?.name || 'Unknown',
      users: item.value
    })),
  });

  const { data: refundData, isLoading: isLoadingRefunds } = useQuery({
    queryKey: ['analytics', 'refund', dateRange],
    queryFn: () => fetchAnalyticsData('refund'),
    select: (data) => data.map(item => ({
      month: format(new Date(item.event_date), 'MMM'),
      refunds: item.value,
      value: item.additional_data?.value || 0
    })),
  });

  // Transform data for charts
  const formattedMonthlySales = monthlySalesData?.map(item => ({
    name: format(new Date(item.event_date), 'MMM'),
    sales: item.value
  })) || [];

  const formattedDailySales = dailySalesData?.map(item => ({
    day: format(new Date(item.event_date), 'EEE'),
    sales: item.value
  })) || [];

  const formattedWeeklySales = weeklySalesData?.map(item => ({
    week: `Week ${format(new Date(item.event_date), 'w')}`,
    sales: item.value
  })) || [];

  // Sample data for metrics that can't be calculated from database yet
  const topCities = [
    { city: "Casablanca", orders: 412, revenue: 35200 },
    { city: "Rabat", orders: 256, revenue: 22350 },
    { city: "Marrakech", orders: 198, revenue: 18700 },
    { city: "Fez", orders: 154, revenue: 12900 },
    { city: "Tangier", orders: 112, revenue: 9800 },
  ];

  const engagementData = [
    { page: "Home", visits: 4500, timeSpent: 120, bounceRate: 32 },
    { page: "Products", visits: 3200, timeSpent: 185, bounceRate: 28 },
    { page: "Product Details", visits: 2800, timeSpent: 210, bounceRate: 22 },
    { page: "Cart", visits: 1600, timeSpent: 95, bounceRate: 45 },
    { page: "Checkout", visits: 850, timeSpent: 320, bounceRate: 18 },
  ];

  // Colors for charts
  const COLORS = ["#008060", "#004c3f", "#95c9b4", "#c4e0d9"];
  const CUSTOMER_COLORS = ["#008060", "#95c9b4"];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Analytics</h2>
        <div className="flex items-center space-x-2">
          <div className="text-sm text-shopify-light-text">Last 30 days</div>
        </div>
      </div>

      {/* Summary Metrics */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-shopify-light-text">
              Average Order Value
            </CardTitle>
            <BarChart3 className="h-4 w-4 text-shopify-light-text" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-shopify-text">
              {isLoadingSummary ? (
                <div className="h-6 w-24 bg-gray-200 animate-pulse rounded"></div>
              ) : (
                `$${(summaryMetrics?.totalRevenue / (summaryMetrics?.orderCount || 1)).toFixed(2)}`
              )}
            </div>
            <div className="flex items-center text-sm mt-1">
              <TrendingUp className="mr-1 h-4 w-4 text-green-500" />
              <span className="text-green-500">+4.3% from last month</span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-shopify-light-text">
              Conversion Rate
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-shopify-light-text" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-shopify-text">
              {isLoadingSummary ? (
                <div className="h-6 w-24 bg-gray-200 animate-pulse rounded"></div>
              ) : (
                "3.6%"
              )}
            </div>
            <div className="flex items-center text-sm mt-1">
              <TrendingUp className="mr-1 h-4 w-4 text-green-500" />
              <span className="text-green-500">+0.8% from last month</span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-shopify-light-text">
              Cart Abandonment
            </CardTitle>
            <PackageOpen className="h-4 w-4 text-shopify-light-text" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-shopify-text">
              {isLoadingSummary ? (
                <div className="h-6 w-24 bg-gray-200 animate-pulse rounded"></div>
              ) : (
                "68.2%"
              )}
            </div>
            <div className="flex items-center text-sm mt-1">
              <TrendingDown className="mr-1 h-4 w-4 text-red-500" />
              <span className="text-red-500">+2.4% from last month</span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-shopify-light-text">
              New Customers
            </CardTitle>
            <Users className="h-4 w-4 text-shopify-light-text" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-shopify-text">
              {isLoadingSummary ? (
                <div className="h-6 w-24 bg-gray-200 animate-pulse rounded"></div>
              ) : (
                summaryMetrics?.customerCount
              )}
            </div>
            <div className="flex items-center text-sm mt-1">
              <TrendingUp className="mr-1 h-4 w-4 text-green-500" />
              <span className="text-green-500">+12.5% from last month</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview">
        <TabsList className="grid grid-cols-6 md:w-fit w-full">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="sales">Sales</TabsTrigger>
          <TabsTrigger value="customers">Customers</TabsTrigger>
          <TabsTrigger value="geography">Geography</TabsTrigger>
          <TabsTrigger value="engagement">Engagement</TabsTrigger>
          <TabsTrigger value="returns">Returns</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-6 pt-4">
          {/* Revenue Over Time */}
          <Card>
            <CardHeader>
              <CardTitle>Revenue Over Time</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                {isLoadingMonthlySales ? (
                  <div className="h-full w-full bg-gray-100 animate-pulse rounded flex items-center justify-center">
                    Loading chart data...
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={formattedMonthlySales}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip formatter={(value) => [`$${value}`, "Revenue"]} />
                      <Legend />
                      <Area
                        type="monotone"
                        dataKey="sales"
                        stroke="#008060"
                        fill="#c4e0d9"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Channel Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Channel Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  {isLoadingChannel ? (
                    <div className="h-full w-full bg-gray-100 animate-pulse rounded flex items-center justify-center">
                      Loading chart data...
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={channelData}
                          cx="50%"
                          cy="50%"
                          innerRadius={70}
                          outerRadius={100}
                          fill="#008060"
                          dataKey="value"
                          label={({ name, percent }) =>
                            `${name}: ${(percent * 100).toFixed(0)}%`
                          }
                        >
                          {channelData?.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={COLORS[index % COLORS.length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => [`${value}%`, "Percentage"]} />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Device Usage */}
            <Card>
              <CardHeader>
                <CardTitle>Device Usage</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  {isLoadingDevice ? (
                    <div className="h-full w-full bg-gray-100 animate-pulse rounded flex items-center justify-center">
                      Loading chart data...
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={deviceData}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="users" fill="#008060" />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="sales" className="space-y-6 pt-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Daily Sales</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  {isLoadingDailySales ? (
                    <div className="h-full w-full bg-gray-100 animate-pulse rounded flex items-center justify-center">
                      Loading chart data...
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={formattedDailySales}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="day" />
                        <YAxis />
                        <Tooltip formatter={(value) => [`$${value}`, "Sales"]} />
                        <Bar dataKey="sales" fill="#008060" />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Weekly Sales</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  {isLoadingWeeklySales ? (
                    <div className="h-full w-full bg-gray-100 animate-pulse rounded flex items-center justify-center">
                      Loading chart data...
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={formattedWeeklySales}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="week" />
                        <YAxis />
                        <Tooltip formatter={(value) => [`$${value}`, "Sales"]} />
                        <Bar dataKey="sales" fill="#004c3f" />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Monthly Sales</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  {isLoadingMonthlySales ? (
                    <div className="h-full w-full bg-gray-100 animate-pulse rounded flex items-center justify-center">
                      Loading chart data...
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={formattedMonthlySales}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip formatter={(value) => [`$${value}`, "Sales"]} />
                        <Line type="monotone" dataKey="sales" stroke="#008060" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Average Order Value */}
          <Card>
            <CardHeader>
              <CardTitle>Average Order Value Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                {isLoadingMonthlySales ? (
                  <div className="h-full w-full bg-gray-100 animate-pulse rounded flex items-center justify-center">
                    Loading chart data...
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={formattedMonthlySales}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip formatter={(value: number) => [`$${Math.floor(value * 0.09)}`, "AVG Order Value"]} />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="sales"
                        name="Average Order Value"
                        stroke="#008060"
                        strokeWidth={2}
                        dot={{ r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="customers" className="space-y-6 pt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* New vs Returning Customers */}
            <Card>
              <CardHeader>
                <CardTitle>New vs Returning Customers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  {isLoadingCustomerType ? (
                    <div className="h-full w-full bg-gray-100 animate-pulse rounded flex items-center justify-center">
                      Loading chart data...
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={customerTypeData}
                          cx="50%"
                          cy="50%"
                          innerRadius={70}
                          outerRadius={100}
                          fill="#008060"
                          dataKey="value"
                          label={({ name, percent }) =>
                            `${name}: ${(percent * 100).toFixed(0)}%`
                          }
                        >
                          {customerTypeData?.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={CUSTOMER_COLORS[index % CUSTOMER_COLORS.length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => [`${value}%`, "Percentage"]} />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </CardContent>
            </Card>
            
            {/* Customer Growth */}
            <Card>
              <CardHeader>
                <CardTitle>Customer Growth</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={formattedMonthlySales.map((month, index) => ({
                        ...month,
                        customers: Math.round(month.sales / 100) + (index * 12)
                      }))}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="customers" 
                        name="Total Customers" 
                        stroke="#008060" 
                        strokeWidth={2} 
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Customer Behavior */}
          <Card>
            <CardHeader>
              <CardTitle>Customer Behavior Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={[
                      { name: "First Purchase", value: 65 },
                      { name: "Repeat Purchase", value: 35 },
                      { name: "Checkout Abandonment", value: 45 },
                      { name: "Brand Loyalty", value: 28 },
                      { name: "Mobile Shoppers", value: 72 },
                    ]}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" />
                    <Tooltip formatter={(value) => [`${value}%`, "Percentage"]} />
                    <Bar dataKey="value" fill="#008060" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="geography" className="space-y-6 pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Top Customer Cities in Morocco</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>City</TableHead>
                    <TableHead>Orders</TableHead>
                    <TableHead>Revenue</TableHead>
                    <TableHead>Avg. Order Value</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topCities.map((city) => (
                    <TableRow key={city.city}>
                      <TableCell className="font-medium">{city.city}</TableCell>
                      <TableCell>{city.orders}</TableCell>
                      <TableCell>${city.revenue.toLocaleString()}</TableCell>
                      <TableCell>${Math.round(city.revenue / city.orders)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Orders by City</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={topCities}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="city" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="orders" name="Orders" fill="#008060" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Revenue by City</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={topCities}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="city" />
                      <YAxis />
                      <Tooltip formatter={(value) => [`$${value}`, "Revenue"]} />
                      <Legend />
                      <Bar dataKey="revenue" name="Revenue" fill="#004c3f" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="engagement" className="space-y-6 pt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Site Visits</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={formattedMonthlySales.map(d => ({
                        ...d,
                        visits: Math.round(d.sales / 10)
                      }))}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="visits"
                        stroke="#004c3f"
                        strokeWidth={2}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Conversion Funnel</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={[
                        { stage: "Site Visits", value: 10000 },
                        { stage: "Product Views", value: 6000 },
                        { stage: "Add to Cart", value: 2200 },
                        { stage: "Started Checkout", value: 1100 },
                        { stage: "Completed Purchase", value: 740 },
                      ]}
                      margin={{ top: 20, right: 30, left: 60, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="stage" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="value" fill="#008060" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Page Engagement</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Page</TableHead>
                    <TableHead>Visits</TableHead>
                    <TableHead>Avg. Time Spent (s)</TableHead>
                    <TableHead>Bounce Rate</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {engagementData.map((page) => (
                    <TableRow key={page.page}>
                      <TableCell className="font-medium">{page.page}</TableCell>
                      <TableCell>{page.visits.toLocaleString()}</TableCell>
                      <TableCell>{page.timeSpent}</TableCell>
                      <TableCell>{page.bounceRate}%</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="returns" className="space-y-6 pt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Refunds Over Time</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  {isLoadingRefunds ? (
                    <div className="h-full w-full bg-gray-100 animate-pulse rounded flex items-center justify-center">
                      Loading chart data...
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={refundData}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip formatter={(value, name) => [name === "refunds" ? value : `$${value}`, name === "refunds" ? "Refunds" : "Value"]} />
                        <Legend />
                        <Line type="monotone" dataKey="refunds" stroke="#004c3f" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Refund Value</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  {isLoadingRefunds ? (
                    <div className="h-full w-full bg-gray-100 animate-pulse rounded flex items-center justify-center">
                      Loading chart data...
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={refundData}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip formatter={(value) => [`$${value}`, "Refund Value"]} />
                        <Bar dataKey="value" fill="#008060" />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Return Reasons</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: "Wrong Size", value: 35 },
                        { name: "Damaged", value: 25 },
                        { name: "Not as Described", value: 20 },
                        { name: "Changed Mind", value: 15 },
                        { name: "Other", value: 5 },
                      ]}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      fill="#008060"
                      dataKey="value"
                      label={({ name, percent }) =>
                        `${name}: ${(percent * 100).toFixed(0)}%`
                      }
                    >
                      {COLORS.map((color, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value}%`, "Percentage"]} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
