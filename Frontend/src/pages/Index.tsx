
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  BarChart3, 
  Users, 
  TrendingUp, 
  DollarSign, 
  Upload,
  AlertTriangle,
  Target,
  PieChart,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Database
} from "lucide-react";
import { AuthModal } from "@/components/AuthModal";
import { KPICards } from "@/components/KPICards";
import { ChurnPrediction } from "@/components/ChurnPrediction";
import { CustomerSegmentation } from "@/components/CustomerSegmentation";
import { CLTVAnalysis } from "@/components/CLTVAnalysis";
import { DataImport } from "@/components/DataImport";
import { RevenueChart } from "@/components/RevenueChart";
import { EngagementMetrics } from "@/components/EngagementMetrics";

const Index = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
        <div className="w-full max-w-6xl">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <div className="mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl mb-4">
                <BarChart3 className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-5xl font-bold text-white mb-4">
                AI-Powered E-commerce Analytics
              </h1>
              <p className="text-xl text-slate-300 max-w-2xl mx-auto">
                Unlock powerful insights with machine learning. Predict churn, segment customers, 
                and maximize lifetime value with our advanced analytics platform.
              </p>
            </div>
            
            <div className="flex gap-4 justify-center mb-8">
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                onClick={() => setShowAuthModal(true)}
              >
                Get Started
                <ArrowUpRight className="ml-2 w-4 h-4" />
              </Button>
              <Button size="lg" variant="outline" className="text-black border-white hover:from-white-900 to-white-100  hover:text-slate-900">
                View Demo
              </Button>
            </div>

            {/* Feature Cards */}
            <div className="grid md:grid-cols-3 gap-6 mt-12">
              <Card className="bg-slate-800/50 border-slate-700 hover:bg-slate-800/70 transition-colors">
                <CardHeader className="text-center">
                  <AlertTriangle className="w-8 h-8 text-red-400 mx-auto mb-2" />
                  <CardTitle className="text-white">Churn Prediction</CardTitle>
                  <CardDescription className="text-slate-400">
                    Identify at-risk customers before they leave
                  </CardDescription>
                </CardHeader>
              </Card>
              
              <Card className="bg-slate-800/50 border-slate-700 hover:bg-slate-800/70 transition-colors">
                <CardHeader className="text-center">
                  <Target className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                  <CardTitle className="text-white">Customer Segmentation</CardTitle>
                  <CardDescription className="text-slate-400">
                    Group customers by behavior and value
                  </CardDescription>
                </CardHeader>
              </Card>
              
              <Card className="bg-slate-800/50 border-slate-700 hover:bg-slate-800/70 transition-colors">
                <CardHeader className="text-center">
                  <DollarSign className="w-8 h-8 text-green-400 mx-auto mb-2" />
                  <CardTitle className="text-white">Lifetime Value</CardTitle>
                  <CardDescription className="text-slate-400">
                    Calculate and optimize customer CLTV
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          </div>
        </div>

        <AuthModal 
          isOpen={showAuthModal} 
          onClose={() => setShowAuthModal(false)}
          onAuthenticated={() => {
            setIsAuthenticated(true);
            setShowAuthModal(false);
          }}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-semibold text-slate-900">EcommerceAI</h1>
          </div>
          
          <div className="flex items-center gap-4">
            <Badge variant="outline" className="text-green-600 border-green-200">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
              Connected
            </Badge>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setIsAuthenticated(false)}
            >
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto p-6">
        {/* KPI Cards */}
        <KPICards />

        {/* Analytics Tabs */}
        <Tabs defaultValue="overview" className="mt-8">
          <TabsList className="grid w-full grid-cols-6 lg:w-auto lg:grid-cols-none lg:inline-flex">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <Activity className="w-4 h-4" />
              <span className="hidden sm:inline">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="churn" className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              <span className="hidden sm:inline">Churn</span>
            </TabsTrigger>
            <TabsTrigger value="segments" className="flex items-center gap-2">
              <PieChart className="w-4 h-4" />
              <span className="hidden sm:inline">Segments</span>
            </TabsTrigger>
            <TabsTrigger value="cltv" className="flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              <span className="hidden sm:inline">CLTV</span>
            </TabsTrigger>
            <TabsTrigger value="import" className="flex items-center gap-2">
              <Database className="w-4 h-4" />
              <span className="hidden sm:inline">Data</span>
            </TabsTrigger>
            <TabsTrigger value="insights" className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              <span className="hidden sm:inline">Insights</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6">
            <div className="grid lg:grid-cols-2 gap-6">
              <RevenueChart />
              <EngagementMetrics />
            </div>
          </TabsContent>

          <TabsContent value="churn" className="mt-6">
            <ChurnPrediction />
          </TabsContent>

          <TabsContent value="segments" className="mt-6">
            <CustomerSegmentation />
          </TabsContent>

          <TabsContent value="cltv" className="mt-6">
            <CLTVAnalysis />
          </TabsContent>

          <TabsContent value="import" className="mt-6">
            <DataImport />
          </TabsContent>

          <TabsContent value="insights" className="mt-6">
            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-blue-500" />
                    AI-Powered Insights
                  </CardTitle>
                  <CardDescription>
                    Actionable recommendations based on your data
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                      <h4 className="font-medium text-blue-900">Revenue Opportunity</h4>
                      <p className="text-blue-700 text-sm mt-1">
                        Focus on high-value customers in the "Champions" segment. They have 3.2x higher CLTV.
                      </p>
                    </div>
                    <div className="p-4 bg-amber-50 rounded-lg border-l-4 border-amber-500">
                      <h4 className="font-medium text-amber-900">Churn Risk Alert</h4>
                      <p className="text-amber-700 text-sm mt-1">
                        127 customers show high churn probability. Consider targeted retention campaigns.
                      </p>
                    </div>
                    <div className="p-4 bg-green-50 rounded-lg border-l-4 border-green-500">
                      <h4 className="font-medium text-green-900">Engagement Success</h4>
                      <p className="text-green-700 text-sm mt-1">
                        Email campaigns show 23% higher engagement for personalized content.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Index;
