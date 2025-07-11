
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Activity } from "lucide-react";

export const EngagementMetrics = () => {
  const engagementData = [
    { channel: "Email", open_rate: 24.5, click_rate: 3.2, conversion: 1.8 },
    { channel: "SMS", open_rate: 89.2, click_rate: 12.1, conversion: 4.3 },
    { channel: "Push", open_rate: 45.7, click_rate: 6.8, conversion: 2.1 },
    { channel: "Social", open_rate: 32.1, click_rate: 4.5, conversion: 1.2 },
    { channel: "In-App", open_rate: 78.3, click_rate: 15.4, conversion: 8.7 }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-purple-500" />
          Engagement Performance
        </CardTitle>
        <CardDescription>
          Customer engagement across different channels
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={engagementData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="channel" />
              <YAxis />
              <Tooltip 
                formatter={(value, name) => [
                  `${Number(value).toFixed(1)}%`, 
                  name.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())
                ]} 
              />
              <Bar dataKey="open_rate" fill="#8B5CF6" name="Open Rate" />
              <Bar dataKey="click_rate" fill="#3B82F6" name="Click Rate" />
              <Bar dataKey="conversion" fill="#10B981" name="Conversion Rate" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};
