
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  DollarSign, 
  Users, 
  ShoppingCart, 
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react";

export const KPICards = () => {
  const kpis = [
    {
      title: "Total Revenue",
      value: "$2,847,392",
      change: "+12.3%",
      trend: "up",
      icon: DollarSign,
      description: "Last 30 days"
    },
    {
      title: "Active Customers",
      value: "14,892",
      change: "+8.7%",
      trend: "up",
      icon: Users,
      description: "Monthly active users"
    },
    {
      title: "Conversion Rate",
      value: "3.24%",
      change: "-0.5%",
      trend: "down",
      icon: ShoppingCart,
      description: "Overall conversion"
    },
    {
      title: "Avg. Order Value",
      value: "$127.45",
      change: "+5.2%",
      trend: "up",
      icon: TrendingUp,
      description: "Per transaction"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {kpis.map((kpi) => (
        <Card key={kpi.title} className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">
              {kpi.title}
            </CardTitle>
            <kpi.icon className="w-4 h-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{kpi.value}</div>
            <div className="flex items-center justify-between mt-2">
              <p className="text-xs text-slate-500">{kpi.description}</p>
              <Badge 
                variant={kpi.trend === "up" ? "default" : "destructive"}
                className="flex items-center gap-1"
              >
                {kpi.trend === "up" ? (
                  <ArrowUpRight className="w-3 h-3" />
                ) : (
                  <ArrowDownRight className="w-3 h-3" />
                )}
                {kpi.change}
              </Badge>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
