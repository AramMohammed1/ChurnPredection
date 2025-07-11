
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from "recharts";
import { TrendingUp } from "lucide-react";

export const RevenueChart = () => {
  const revenueData = [
    { month: "Jan", revenue: 185000, target: 180000 },
    { month: "Feb", revenue: 192000, target: 185000 },
    { month: "Mar", revenue: 178000, target: 190000 },
    { month: "Apr", revenue: 245000, target: 195000 },
    { month: "May", revenue: 267000, target: 200000 },
    { month: "Jun", revenue: 284000, target: 205000 }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-blue-500" />
          Revenue Trends
        </CardTitle>
        <CardDescription>
          Monthly revenue performance vs. targets
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={revenueData}>
              <defs>
                <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`} />
              <Tooltip 
                formatter={(value, name) => [
                  `$${Number(value).toLocaleString()}`, 
                  name === "revenue" ? "Actual Revenue" : "Target"
                ]} 
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#3B82F6"
                strokeWidth={2}
                fill="url(#revenueGradient)"
              />
              <Line
                type="monotone"
                dataKey="target"
                stroke="#10B981"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={{ fill: "#10B981", strokeWidth: 2, r: 3 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};
