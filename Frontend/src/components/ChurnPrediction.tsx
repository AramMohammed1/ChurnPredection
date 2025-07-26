import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Users, TrendingDown, Target, Loader2, RefreshCw, X } from "lucide-react";
import { useEffect, useState } from "react";
import { churnService, ChurnData, Customer, ChurnPredictionResponse, ProgressResponse } from "@/services/churnService";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell } from "recharts";
import { authService } from "@/services/authService";

interface ChurnCustomer {
  id: string;
  name: string;
  email: string;
  churnProbability: number;
  lastPurchase: string;
  totalSpent: string;
  customerId: number;
}

interface ChurnPredictionProps {
  onSessionEnd?: () => void;
}

export const ChurnPrediction = ({ onSessionEnd }: ChurnPredictionProps) => {
  const [churnData, setChurnData] = useState<ChurnData | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<ProgressResponse | null>(null);
  const [taskId, setTaskId] = useState<string | null>(null);
  const [pollInterval, setPollInterval] = useState<NodeJS.Timeout | null>(null);

  const CHURN_CACHE_KEY = "churnPredictionData";
  const CUSTOMER_CACHE_KEY = "churnPredictionCustomers";
  const CACHE_EXPIRY_KEY = "churnPredictionExpiry";
  const CACHE_DURATION = 60 * 60 * 1000;

  // Listen for session end (logout) and cleanup polling
  useEffect(() => {
    if (!onSessionEnd) return;
    return () => {
      if (pollInterval) {
        clearInterval(pollInterval);
        setPollInterval(null);
      }
      setTaskId(null);
      setProgress(null);
      setChurnData(null);
      setCustomers([]);
    };
  }, [onSessionEnd, pollInterval]);

  useEffect(() => {
    const cachedChurn = localStorage.getItem(CHURN_CACHE_KEY);
    const cachedCustomers = localStorage.getItem(CUSTOMER_CACHE_KEY);
    const expiry = localStorage.getItem(CACHE_EXPIRY_KEY);

    if (
      cachedChurn &&
      cachedCustomers &&
      expiry &&
      Date.now() < Number(expiry)
    ) {
      setChurnData(JSON.parse(cachedChurn));
      setCustomers(JSON.parse(cachedCustomers));
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Start batch prediction
        const user = await authService.getCurrentUser();
        const taskResponse = await churnService.startBatchPrediction(`user_data_${user.id}`);
        setTaskId(taskResponse.task_id);
        
        // Start polling for progress
        const interval = setInterval(async () => {
          try {
            const progressData = await churnService.getProgress(taskResponse.task_id);
            setProgress(progressData);

            if (progressData.status === 'done' && progressData.result) {
              clearInterval(interval);
              setPollInterval(null);
              setChurnData(progressData.result);
              
              // Fetch all customer details in one call
              const user = await authService.getCurrentUser();
              console.log("occored one time")
              const allCustomers = await churnService.getAllCustomers(`user_data_${user.id}`);
              setCustomers(allCustomers);

              // Cache results
              localStorage.setItem(CHURN_CACHE_KEY, JSON.stringify(progressData.result));
              localStorage.setItem(CUSTOMER_CACHE_KEY, JSON.stringify(allCustomers));
              localStorage.setItem(CACHE_EXPIRY_KEY, (Date.now() + CACHE_DURATION).toString());

              setLoading(false);
            } else if (progressData.status === 'failed' || progressData.status === 'cancelled') {
              clearInterval(interval);
              setPollInterval(null);
              if (
                progressData.error &&
                (
                  progressData.error.includes("psycopg2.errors.UndefinedTable") ||
                  (typeof progressData.error === "object" && progressData.error.code === "UndefinedTable")
                )
              ) {
                setError("Data not found please insert your data first in Data tab");
                setLoading(false);
                return;
              }
              else{
                setError(progressData.error || 'Prediction failed 17');
                setLoading(false);
              }
            }
          } catch (err) {
            console.error('Error polling progress:', err);
          }
        }, 1000); // Poll every second
        
        setPollInterval(interval);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to start prediction');
        setLoading(false);
        console.error('Error starting prediction:', err);
      }
    };

    fetchData();

    // Cleanup function to clear intervals on unmount
    return () => {
      if (pollInterval) {
        clearInterval(pollInterval);
      }
    };
  }, []);

  const handleCancel = async () => {
    if (!taskId) return;
    
    try {
      await churnService.cancelTask(taskId);
      if (pollInterval) {
        clearInterval(pollInterval);
        setPollInterval(null);
      }
      setLoading(false);
      setRefreshing(false);
      setError('Prediction was cancelled');
      setTaskId(null);
    } catch (err) {
      console.error('Error cancelling task:', err);
      setError('Failed to cancel prediction');
    }
  };

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      setError(null);
      
      // Clear cache
      localStorage.removeItem(CHURN_CACHE_KEY);
      localStorage.removeItem(CUSTOMER_CACHE_KEY);
      localStorage.removeItem(CACHE_EXPIRY_KEY);
      
      // Start new batch prediction
      const user = await authService.getCurrentUser();
      const taskResponse = await churnService.startBatchPrediction(`user_data_${user.id}`);
      setTaskId(taskResponse.task_id);
      
      // Start polling for progress
      const interval = setInterval(async () => {
        try {
          const progressData = await churnService.getProgress(taskResponse.task_id);
          setProgress(progressData);
          
          if (progressData.status === 'done' && progressData.result) {
            clearInterval(interval);
            setPollInterval(null);
            setChurnData(progressData.result);
            
            // Fetch all customer details in one call
            const user = await authService.getCurrentUser();
            const allCustomers = await churnService.getAllCustomers(`user_data_${user.id}`);
            setCustomers(allCustomers);

            // Cache new results
            localStorage.setItem(CHURN_CACHE_KEY, JSON.stringify(progressData.result));
            localStorage.setItem(CUSTOMER_CACHE_KEY, JSON.stringify(allCustomers));
            localStorage.setItem(CACHE_EXPIRY_KEY, (Date.now() + CACHE_DURATION).toString());

            setRefreshing(false);
          } else if (progressData.status === 'failed' || progressData.status === 'cancelled') {
            clearInterval(interval);
            setPollInterval(null);
            setError(progressData.error || 'Prediction failed');
            setRefreshing(false);
          }
        } catch (err) {
          console.error('Error polling progress:', err);
          setError('Failed to get prediction progress');
          setRefreshing(false);
          clearInterval(interval);
          setPollInterval(null);
        }
      }, 1000); // Poll every second
      
      setPollInterval(interval);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start prediction');
      setRefreshing(false);
      console.error('Error starting prediction:', err);
    }
  };

  const getChurnColor = (probability: number) => {
    if (probability >= 50) return "text-red-600 bg-red-50 border-red-200";
    if (probability >= 20) return "text-amber-600 bg-amber-50 border-amber-200";
    return "text-green-600 bg-green-50 border-green-200";
  };

  const getChurnLabel = (probability: number) => {
    if (probability >= 50) return "High Risk";
    if (probability >= 20) return "Medium Risk";
    return "Low Risk";
  };

  const processChurnCustomers = (): ChurnCustomer[] => {
    if (!churnData || !customers.length) return [];

    const churnCustomers: ChurnCustomer[] = [];
    
    Object.entries(churnData).forEach(([customerIdStr, data]) => {
      const customerId = parseInt(customerIdStr);
      const customer = customers.find(c => Number(c['Customer ID']) === customerId);
      
      if (customer && data.prediction.length > 0) {
        const prediction = data.prediction[0]; // Get the first prediction
        const churnProbability = Math.round(prediction.churn_probability * 100);
        
        churnCustomers.push({
          id: `${customerId.toString().padStart(3, '0')}`,
          name: customer['Customer Name'] || `Customer ${customerId}`,
          email: customer['Email'] || `${customer['Customer Name'].toLowerCase().replace(' ', '')}@email.com`,
          churnProbability,
          lastPurchase: customer['Purchase Date'],
          totalSpent: String(customer['Total Purchase Amount']),
          customerId
        });
      }
    });

    // Sort by churn probability (highest first) and take top 10
    return churnCustomers
      .sort((a, b) => b.churnProbability - a.churnProbability)
      .slice(0, 10);
  };

  const calculateSummaryStats = () => {
    if (!churnData) return { highRiskCount: 0, atRiskRevenue: 0, retentionRate: 84.2 };
    const allPredictions = Object.values(churnData).flatMap(data => data.prediction);
    const highRiskCount = allPredictions.filter(p => p.churn_probability > 0.5).length;
    
    // Calculate at-risk revenue (simplified calculation)
    const highRiskCustomers = allPredictions.filter(p => p.churn_probability > 0.5);
    const atRiskRevenue = highRiskCustomers.length * 2500; //should be calculated in a way    
    return {
      highRiskCount,
      atRiskRevenue: Math.round(atRiskRevenue / 1000), // In thousands
      retentionRate: customers.length > 0
        ? Math.round(
            ((customers.length - allPredictions.filter(p => p.churn_probability > 0.5).length) / customers.length) * 1000
          ) / 10 
        : 0
    };
  };

  // --- Churn Probability Histogram Data ---
  const getChurnHistogramData = () => {
    if (!churnData) return [];
    const allProbs = Object.values(churnData).flatMap(data => data.prediction.map(p => p.churn_probability * 100));
    const bins = Array(10).fill(0);
    allProbs.forEach(prob => {
      const idx = Math.min(9, Math.floor(prob / 10));
      bins[idx]++;
    });
    return bins.map((count, i) => ({
      range: `${i * 10}-${i * 10 + 10}%`,
      count
    }));
  };
  const churnHistogramData = getChurnHistogramData();

  // --- Churn Distribution (Binary Classification Result) ---
  const getChurnBinaryDistribution = () => {
    if (!churnData) return [];
    let churn = 0, noChurn = 0;
    Object.values(churnData).forEach(data => {
      // Assume the first prediction is the relevant one
      if (data.prediction[0]?.churn_prediction) churn++;
      else noChurn++;
    });
    return [
      { name: "Churn", value: churn },
      { name: "No Churn", value: noChurn }
    ];
  };
  const churnBinaryData = getChurnBinaryDistribution();
  const pieColors = ["#ef4444", "#22c55e"];

  // --- Customer Segmentation by Churn Risk ---
  const getChurnRiskSegmentation = () => {
    if (!churnData) return [];
    let high = 0, medium = 0, low = 0;
    Object.values(churnData).forEach(data => {
      data.prediction.forEach(p => {
        const prob = p.churn_probability * 100;
        if (prob > 50) high++;
        else if (prob > 20) medium++;
        else low++;
      });
    });
    // Sort order: Low, Medium, High
    return [
      { risk: 'Low', count: low },
      { risk: 'Medium', count: medium },
      { risk: 'High', count: high }
    ];
  };
  const churnRiskSegmentation = getChurnRiskSegmentation();
  const riskColors = {
    High: '#ef4444',
    Medium: '#f59e42',
    Low: '#22c55e'
  };

  // Helper to format last purchase days
  const formatLastPurchase = (date: any) => {
    if (!date) return 'Unknown';
    const purchaseDate = new Date(date);
    if (isNaN(purchaseDate.getTime())) return 'Unknown';
    const now = new Date();
    // Zero out the time for both dates to compare only the days
    purchaseDate.setHours(0, 0, 0, 0);
    now.setHours(0, 0, 0, 0);
    const diffTime = now.getTime() - purchaseDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return '1 day ago';
    if (diffDays > 1) return `${diffDays} days ago`;
    return 'Unknown';
  };

  if (loading) {
    const progressPercentage = progress ? Math.round((progress.processed / progress.total) * 100) : 0;
    
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Churn Prediction</h2>
            <p className="text-slate-600">Monitor customer churn risk and take proactive measures</p>
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={handleCancel} 
              disabled={!taskId}
              className="flex items-center gap-2"
              variant="destructive"
            >
              <X className="w-4 h-4" />
              Cancel
            </Button>
            <Button 
              onClick={handleRefresh} 
              disabled={refreshing || loading}
              className="flex items-center gap-2"
              variant="outline"
            >
              {refreshing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              {refreshing ? 'Refreshing...' : 'Refresh Results'}
            </Button>
          </div>
        </div>
        
        <div className="flex flex-col items-center justify-center h-64 space-y-6">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Analyzing Customer Data</h3>
            <p className="text-slate-600 mb-4">Processing customer records for churn prediction...</p>
          </div>
          
          <div className="w-full max-w-md space-y-2">
            <div className="flex justify-between text-sm text-slate-600">
              <span>Progress</span>
              <span>{progressPercentage}%</span>
            </div>
            <Progress value={progressPercentage} className="h-3" />
            {progress && (
              <div className="text-center text-sm text-slate-500">
                {progress.processed} of {progress.total} customers processed
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Churn Prediction</h2>
            <p className="text-slate-600">Monitor customer churn risk and take proactive measures</p>
          </div>
          <Button 
            onClick={handleRefresh} 
            disabled={refreshing || loading}
            className="flex items-center gap-2"
            variant="outline"
          >
            {refreshing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            {refreshing ? 'Refreshing...' : 'Refresh Results'}
          </Button>
        </div>
        
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-red-600 mb-2">Error Loading Data</h3>
            <p className="text-slate-600">{error}</p>
            <p className="text-sm text-slate-500 mt-2">Some error occurred Loading Data Please try again</p>
            <Button 
              onClick={handleRefresh} 
              className="mt-4"
              variant="outline"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const processedCustomers = processChurnCustomers();
  const summaryStats = calculateSummaryStats();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Churn Prediction</h2>
          <p className="text-slate-600">Monitor customer churn risk and take proactive measures</p>
        </div>
        <Button 
          onClick={handleRefresh} 
          disabled={refreshing || loading}
          className="flex items-center gap-2"
          variant="outline"
        >
          {refreshing ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4" />
          )}
          {refreshing ? 'Refreshing...' : 'Refresh Results'}
        </Button>
      </div>

      {/* Refresh Progress Indicator */}
      {refreshing && progress && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                <div>
                  <h4 className="font-medium text-blue-900">Refreshing Churn Predictions</h4>
                  <p className="text-sm text-blue-700">Processing customer data...</p>
                </div>
              </div>
              <Button 
                onClick={handleCancel} 
                disabled={!taskId}
                size="sm"
                variant="destructive"
                className="flex items-center gap-2"
              >
                <X className="w-3 h-3" />
                Cancel
              </Button>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-blue-700">
                <span>Progress</span>
                <span>{Math.round((progress.processed / progress.total) * 100)}%</span>
              </div>
              <Progress value={Math.round((progress.processed / progress.total) * 100)} className="h-2" />
              <div className="text-center text-sm text-blue-600">
                {progress.processed} of {progress.total} customers processed
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      {/* Summary Cards */}
      <div className="grid md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Risk Customers</CardTitle>
            <AlertTriangle className="w-4 h-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{summaryStats.highRiskCount}</div>
            <p className="text-xs text-slate-500 mt-1">Churn probability &gt; 50%</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">At-Risk Revenue</CardTitle>
            <TrendingDown className="w-4 h-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">${summaryStats.atRiskRevenue}K</div>
            <p className="text-xs text-slate-500 mt-1">Potential revenue loss</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Retention Rate</CardTitle>
            <Target className="w-4 h-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{summaryStats.retentionRate}%</div>
            <p className="text-xs text-slate-500 mt-1">Last 12 months</p>
          </CardContent>
        </Card>
      </div>

      {/* Churn Probability Histogram */}
      <Card>
        <CardHeader>
          <CardTitle>Churn Probability Distribution</CardTitle>
          <CardDescription>Histogram of predicted churn probabilities for all customers.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={churnHistogramData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="range" />
                <YAxis allowDecimals={false} label={{ value: 'Customers', angle: -90, position: 'insideLeft' }} />
                <Tooltip formatter={(value) => [value, 'Customers']} />
                <Bar dataKey="count" fill="#3B82F6" name="Customers" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Churn Distribution (Binary Classification Result) + Customer Segmentation by Churn Risk */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Churn Distribution (Binary Classification Result) */}
        <Card>
          <CardHeader>
            <CardTitle>Churn Distribution (Binary Classification Result)</CardTitle>
            <CardDescription>Number of customers predicted to churn vs. not churn.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={churnBinaryData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {churnBinaryData.map((entry, idx) => (
                      <Cell key={`cell-${idx}`} fill={pieColors[idx % pieColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value, name) => [value, name]} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Customer Segmentation by Churn Risk */}
        <Card>
          <CardHeader>
            <CardTitle>Customer Segmentation by Churn Risk</CardTitle>
            <CardDescription>Number of customers in each churn risk segment.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={churnRiskSegmentation}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="risk" />
                  <YAxis allowDecimals={false} label={{ value: 'Customers', angle: -90, position: 'insideLeft' }} />
                  <Tooltip formatter={(value) => [value, 'Customers']} />
                  <Bar dataKey="count">
                    {churnRiskSegmentation.map((entry, idx) => (
                      <Cell key={`cell-${entry.risk}`} fill={riskColors[entry.risk]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
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
          {processedCustomers.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <Users className="w-12 h-12 mx-auto mb-4 text-slate-300" />
              <p>No high-risk customers found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {processedCustomers.map((customer) => (
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
                        <div className="font-medium">{formatLastPurchase(customer.lastPurchase)}</div>
                      </div>
                      <div>
                        <span className="text-slate-500">Total Spent:</span>
                        <div className="font-medium">{customer.totalSpent}$</div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};