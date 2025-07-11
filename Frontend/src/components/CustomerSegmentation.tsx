
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { Users, Crown, Star, Heart, AlertCircle } from "lucide-react";

export const CustomerSegmentation = () => {
  const segments = [
    {
      name: "Champions",
      count: 1247,
      percentage: 12.4,
      color: "#10B981",
      icon: Crown,
      description: "High value, highly engaged",
      avgSpent: "$2,340",
      frequency: "Weekly"
    },
    {
      name: "Loyal Customers", 
      count: 2891,
      percentage: 28.7,
      color: "#3B82F6",
      icon: Heart,
      description: "Regular purchasers",
      avgSpent: "$1,580",
      frequency: "Bi-weekly"
    },
    {
      name: "Potential Loyalists",
      count: 3456,
      percentage: 34.2,
      color: "#8B5CF6",
      icon: Star,
      description: "Recent customers with potential",
      avgSpent: "$890",
      frequency: "Monthly"
    },
    {
      name: "At Risk",
      count: 1234,
      percentage: 12.2,
      color: "#F59E0B",
      icon: AlertCircle,
      description: "Declining engagement",
      avgSpent: "$1,200",
      frequency: "Quarterly"
    },
    {
      name: "New Customers",
      count: 1278,
      percentage: 12.5,
      color: "#06B6D4",
      icon: Users,
      description: "Recent first-time buyers",
      avgSpent: "$450", 
      frequency: "One-time"
    }
  ];

  const behaviorData = [
    { segment: "Champions", purchases: 24, engagement: 95, satisfaction: 92 },
    { segment: "Loyal", purchases: 18, engagement: 85, satisfaction: 88 },
    { segment: "Potential", purchases: 8, engagement: 65, satisfaction: 78 },
    { segment: "At Risk", purchases: 3, engagement: 35, satisfaction: 65 },
    { segment: "New", purchases: 2, engagement: 75, satisfaction: 82 }
  ];

  return (
    <div className="space-y-6">
      {/* Segment Overview */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Customer Distribution</CardTitle>
            <CardDescription>Breakdown of customers by segment</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={segments}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="percentage"
                  >
                    {segments.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value}%`, "Percentage"]} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Behavioral Analysis</CardTitle>
            <CardDescription>Purchase frequency and engagement by segment</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={behaviorData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="segment" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="purchases" fill="#3B82F6" name="Avg. Purchases/Year" />
                  <Bar dataKey="engagement" fill="#10B981" name="Engagement Score" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Segment Details */}
      <Card>
        <CardHeader>
          <CardTitle>Segment Profiles</CardTitle>
          <CardDescription>Detailed breakdown of each customer segment</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {segments.map((segment) => (
              <div key={segment.name} className="p-4 border rounded-lg hover:bg-slate-50 transition-colors">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-10 h-10 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: `${segment.color}15` }}
                    >
                      <segment.icon className="w-5 h-5" style={{ color: segment.color }} />
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-900">{segment.name}</h4>
                      <p className="text-sm text-slate-500">{segment.description}</p>
                    </div>
                  </div>
                  <Badge style={{ backgroundColor: `${segment.color}15`, color: segment.color }}>
                    {segment.percentage}%
                  </Badge>
                </div>

                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-slate-500">Customers:</span>
                    <div className="font-medium">{segment.count.toLocaleString()}</div>
                  </div>
                  <div>
                    <span className="text-slate-500">Avg. Spent:</span>
                    <div className="font-medium">{segment.avgSpent}</div>
                  </div>
                  <div>
                    <span className="text-slate-500">Purchase Frequency:</span>
                    <div className="font-medium">{segment.frequency}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
