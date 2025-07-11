
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { AlertTriangle, Users, TrendingDown, Target } from "lucide-react";

export const ChurnPrediction = () => {
  const churnCustomers = [
    {
      id: "CUST_001",
      name: "Sarah Johnson",
      email: "sarah.j@email.com",
      churnProbability: 87,
      lastPurchase: "45 days ago",
      totalSpent: "$2,340",
      riskFactors: ["Low engagement", "Declining orders", "No recent activity"]
    },
    {
      id: "CUST_002", 
      name: "Michael Chen",
      email: "m.chen@email.com",
      churnProbability: 73,
      lastPurchase: "32 days ago",
      totalSpent: "$1,890",
      riskFactors: ["Price sensitivity", "Support tickets", "Competitor activity"]
    },
    {
      id: "CUST_003",
      name: "Emma Davis",
      email: "emma.davis@email.com", 
      churnProbability: 64,
      lastPurchase: "28 days ago",
      totalSpent: "$3,120",
      riskFactors: ["Reduced frequency", "Lower basket size"]
    }
  ];

  const getChurnColor = (probability: number) => {
    if (probability >= 80) return "text-red-600 bg-red-50 border-red-200";
    if (probability >= 60) return "text-amber-600 bg-amber-50 border-amber-200";
    return "text-green-600 bg-green-50 border-green-200";
  };

  const getChurnLabel = (probability: number) => {
    if (probability >= 80) return "High Risk";
    if (probability >= 60) return "Medium Risk";
    return "Low Risk";
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Risk Customers</CardTitle>
            <AlertTriangle className="w-4 h-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">127</div>
            <p className="text-xs text-slate-500 mt-1">Churn probability '>' 80%</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">At-Risk Revenue</CardTitle>
            <TrendingDown className="w-4 h-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">$284K</div>
            <p className="text-xs text-slate-500 mt-1">Potential revenue loss</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Retention Rate</CardTitle>
            <Target className="w-4 h-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">84.2%</div>
            <p className="text-xs text-slate-500 mt-1">Last 12 months</p>
          </CardContent>
        </Card>
      </div>

      {/* High-Risk Customers */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-red-500" />
            High-Risk Customers
          </CardTitle>
          <CardDescription>
            Customers with highest churn probability requiring immediate attention
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {churnCustomers.map((customer) => (
              <div key={customer.id} className="p-4 border rounded-lg hover:bg-slate-50 transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-medium text-slate-900">{customer.name}</h4>
                    <p className="text-sm text-slate-500">{customer.email}</p>
                  </div>
                  <Badge className={getChurnColor(customer.churnProbability)}>
                    {getChurnLabel(customer.churnProbability)}
                  </Badge>
                </div>

                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Churn Probability</span>
                      <span className="font-medium">{customer.churnProbability}%</span>
                    </div>
                    <Progress value={customer.churnProbability} className="h-2" />
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-slate-500">Last Purchase:</span>
                      <div className="font-medium">{customer.lastPurchase}</div>
                    </div>
                    <div>
                      <span className="text-slate-500">Total Spent:</span>
                      <div className="font-medium">{customer.totalSpent}</div>
                    </div>
                  </div>

                  <div>
                    <span className="text-slate-500 text-sm">Risk Factors:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {customer.riskFactors.map((factor, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {factor}
                        </Badge>
                      ))}
                    </div>
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
