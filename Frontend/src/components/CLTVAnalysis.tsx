
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { DollarSign, TrendingUp, Clock, Target, Star } from "lucide-react";

export const CLTVAnalysis = () => {
  const cltvTrend = [
    { month: "Jan", cltv: 1200, cohort: "New" },
    { month: "Feb", cltv: 1350, cohort: "New" },
    { month: "Mar", cltv: 1480, cohort: "New" },
    { month: "Apr", cltv: 1620, cohort: "New" },
    { month: "May", cltv: 1750, cohort: "New" },
    { month: "Jun", cltv: 1890, cohort: "New" }
  ];

  const segmentCLTV = [
    { segment: "Champions", cltv: 3240, predicted: 4100, customers: 1247 },
    { segment: "Loyal", cltv: 2180, predicted: 2650, customers: 2891 },
    { segment: "Potential", cltv: 890, predicted: 1450, customers: 3456 },
    { segment: "At Risk", cltv: 1200, predicted: 800, customers: 1234 },
    { segment: "New", cltv: 450, predicted: 1200, customers: 1278 }
  ];

  const topCustomers = [
    {
      id: "CUST_VIP_001",
      name: "Alexandra Thompson",
      currentCLTV: "$8,450",
      predictedCLTV: "$12,300",
      confidence: 92,
      segment: "Champion",
      timeToValue: "6 months"
    },
    {
      id: "CUST_VIP_002", 
      name: "Robert Kumar",
      currentCLTV: "$6,890",
      predictedCLTV: "$9,800",
      confidence: 88,
      segment: "Champion",
      timeToValue: "8 months"
    },
    {
      id: "CUST_VIP_003",
      name: "Maria Rodriguez",
      currentCLTV: "$5,670",
      predictedCLTV: "$8,900",
      confidence: 85,
      segment: "Loyal",
      timeToValue: "10 months"
    }
  ];

  return (
    <div className="space-y-6">
      {/* CLTV Summary Cards */}
      <div className="grid md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average CLTV</CardTitle>
            <DollarSign className="w-4 h-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">$1,847</div>
            <p className="text-xs text-slate-500 mt-1">Across all customers</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">CLTV Growth</CardTitle>
            <TrendingUp className="w-4 h-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">+23.4%</div>
            <p className="text-xs text-slate-500 mt-1">Year over year</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Payback Period</CardTitle>
            <Clock className="w-4 h-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">4.2 mo</div>
            <p className="text-xs text-slate-500 mt-1">Average time to ROI</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High-Value Rate</CardTitle>
            <Target className="w-4 h-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">18.3%</div>
            <p className="text-xs text-slate-500 mt-1">CLTV '>' $2,500</p>
          </CardContent>
        </Card>
      </div>

      {/* CLTV Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>CLTV Trend Analysis</CardTitle>
            <CardDescription>Customer lifetime value progression over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={cltvTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`$${value}`, "CLTV"]} />
                  <Line 
                    type="monotone" 
                    dataKey="cltv" 
                    stroke="#3B82F6" 
                    strokeWidth={3}
                    dot={{ fill: "#3B82F6", strokeWidth: 2, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>CLTV by Segment</CardTitle>
            <CardDescription>Current vs. predicted lifetime value</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={segmentCLTV}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="segment" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`$${value}`, ""]} />
                  <Bar dataKey="cltv" fill="#3B82F6" name="Current CLTV" />
                  <Bar dataKey="predicted" fill="#10B981" name="Predicted CLTV" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Value Customers */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="w-5 h-5 text-yellow-500" />
            High-Value Customers
          </CardTitle>
          <CardDescription>
            Customers with highest predicted lifetime value
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {topCustomers.map((customer) => (
              <div key={customer.id} className="p-4 border rounded-lg hover:bg-slate-50 transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-medium text-slate-900">{customer.name}</h4>
                    <p className="text-sm text-slate-500">{customer.id}</p>
                  </div>
                  <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
                    {customer.segment}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-3">
                  <div>
                    <span className="text-slate-500">Current CLTV:</span>
                    <div className="font-medium text-blue-600">{customer.currentCLTV}</div>
                  </div>
                  <div>
                    <span className="text-slate-500">Predicted CLTV:</span>
                    <div className="font-medium text-green-600">{customer.predictedCLTV}</div>
                  </div>
                  <div>
                    <span className="text-slate-500">Confidence:</span>
                    <div className="font-medium">{customer.confidence}%</div>
                  </div>
                  <div>
                    <span className="text-slate-500">Time to Value:</span>
                    <div className="font-medium">{customer.timeToValue}</div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Prediction Confidence</span>
                    <span className="font-medium">{customer.confidence}%</span>
                  </div>
                  <Progress value={customer.confidence} className="h-2" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
