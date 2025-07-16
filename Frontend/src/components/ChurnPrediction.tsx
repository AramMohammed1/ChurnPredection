
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { AlertTriangle, Users, TrendingDown, Target, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { churnService, ChurnData, Customer, ChurnPredictionResponse, ProgressResponse } from "@/services/churnService";

interface ChurnCustomer {
  id: string;
  name: string;
  email: string;
  churnProbability: number;
  lastPurchase: string;
  totalSpent: string;
  customerId: number;
}

export const ChurnPrediction = () => {
  const [churnData, setChurnData] = useState<ChurnData | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<ProgressResponse | null>(null);
  const [taskId, setTaskId] = useState<string | null>(null);

  const CHURN_CACHE_KEY = "churnPredictionData";
  const CUSTOMER_CACHE_KEY = "churnPredictionCustomers";
  const CACHE_EXPIRY_KEY = "churnPredictionExpiry";
  const CACHE_DURATION = 60 * 60 * 1000; // 1 hour in ms

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
        const taskResponse = await churnService.startBatchPrediction();
        setTaskId(taskResponse.task_id);
        
        // Start polling for progress
        const pollInterval = setInterval(async () => {
          try {
            const progressData = await churnService.getProgress(taskResponse.task_id);
            setProgress(progressData);
            
            if (progressData.status === 'done' && progressData.result) {
              clearInterval(pollInterval);
              setChurnData(progressData.result);
              
              // Fetch customer details for the predicted customers
              const customerIds = Object.keys(progressData.result).map(id => parseInt(id));
              const customersResponse: any[] = await Promise.all(
                customerIds.map(id => churnService.getCustomerById(id).then(data => Array.isArray(data) ? data[0] : data))
              );
              setCustomers(customersResponse);

              // Cache results
              localStorage.setItem(CHURN_CACHE_KEY, JSON.stringify(progressData.result));
              localStorage.setItem(CUSTOMER_CACHE_KEY, JSON.stringify(customersResponse));
              localStorage.setItem(CACHE_EXPIRY_KEY, (Date.now() + CACHE_DURATION).toString());

              setLoading(false);
            } else if (progressData.status === 'failed') {
              clearInterval(pollInterval);
              setError(progressData.error || 'Prediction failed');
              setLoading(false);
            }
          } catch (err) {
            console.error('Error polling progress:', err);
          }
        }, 1000); // Poll every second
        
        // Cleanup interval on unmount
        return () => clearInterval(pollInterval);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to start prediction');
        setLoading(false);
        console.error('Error starting prediction:', err);
      }
    };

    fetchData();
  }, []);

  const handleRefresh = () => {
    localStorage.removeItem(CHURN_CACHE_KEY);
    localStorage.removeItem(CUSTOMER_CACHE_KEY);
    localStorage.removeItem(CACHE_EXPIRY_KEY);
    window.location.reload();
  };

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

  const processChurnCustomers = (): ChurnCustomer[] => {
    if (!churnData || !customers.length) return [];

    const churnCustomers: ChurnCustomer[] = [];
    
    Object.entries(churnData).forEach(([customerIdStr, data]) => {
      const customerId = parseInt(customerIdStr);
      const customer = customers.find(c => c['id'] === customerId);
      
      if (customer && data.prediction.length > 0) {
        const prediction = data.prediction[0]; // Get the first prediction
        const churnProbability = Math.round(prediction.churn_probability * 100);
        
        churnCustomers.push({
          id: `${customerId.toString().padStart(3, '0')}`,
          name: customer['name'] || `Customer ${customerId}`,
          email: customer['email'] || `customer${customerId}@email.com`,
          churnProbability,
          lastPurchase: customer['last_purchase_date'],
          totalSpent: customer['totalSpent'],
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

  if (loading) {
    const progressPercentage = progress ? Math.round((progress.processed / progress.total) * 100) : 0;
    
    return (
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
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-red-600 mb-2">Error Loading Data</h3>
          <p className="text-slate-600">{error}</p>
          <p className="text-sm text-slate-500 mt-2">Make sure the churn service is running on localhost:8000</p>
        </div>
      </div>
    );
  }

  const processedCustomers = processChurnCustomers();
  const summaryStats = calculateSummaryStats();

  return (
    <div className="space-y-6">
      <button onClick={handleRefresh} className="btn btn-secondary mb-4">Refresh Prediction</button>
      {/* Summary Cards */}
      <div className="grid md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Risk Customers</CardTitle>
            <AlertTriangle className="w-4 h-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{summaryStats.highRiskCount}</div>
            <p className="text-xs text-slate-500 mt-1">Churn probability &gt; 80%</p>
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
                        <div className="font-medium">{customer.lastPurchase}</div>
                      </div>
                      <div>
                        <span className="text-slate-500">Total Spent:</span>
                        <div className="font-medium">{customer.totalSpent}</div>
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