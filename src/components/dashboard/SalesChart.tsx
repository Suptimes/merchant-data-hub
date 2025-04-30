
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

const data = [
  { name: "Jan", sales: 4000, visits: 2400 },
  { name: "Feb", sales: 3000, visits: 1398 },
  { name: "Mar", sales: 2000, visits: 9800 },
  { name: "Apr", sales: 2780, visits: 3908 },
  { name: "May", sales: 1890, visits: 4800 },
  { name: "Jun", sales: 2390, visits: 3800 },
  { name: "Jul", sales: 3490, visits: 4300 },
];

export default function SalesChart() {
  return (
    <Card className="col-span-full">
      <CardHeader>
        <CardTitle>Sales Overview</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={data}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="sales"
                stroke="#008060"
                strokeWidth={2}
                activeDot={{ r: 8 }}
              />
              <Line type="monotone" dataKey="visits" stroke="#637381" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
