
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { DollarSign, TrendingUp, Clock, Target, Star, RefreshCw, Loader2, AlertTriangle } from "lucide-react";
import { cltvService, CLTVResponse, CLTVSegmentsResponse, CLTVCustomer } from "@/services/cltvService";
import { useToast } from "@/hooks/use-toast";

interface CLTVAnalysisProps {
  onSessionEnd?: () => void;
}

export const CLTVAnalysis = ({ onSessionEnd }: CLTVAnalysisProps) => {
  const [cltvData, setCltvData] = useState<CLTVResponse | null>(null);
  const [segmentsData, setSegmentsData] = useState<CLTVSegmentsResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const { toast } = useToast();

  // Cache keys and duration
  const CLTV_CACHE_KEY = "cltvData";
  const CLTV_SEGMENTS_CACHE_KEY = "cltvSegmentsData";
  const CLTV_CACHE_EXPIRY_KEY = "cltvExpiry";
  const CACHE_DURATION = 60 * 60 * 1000; // 1 hour

  // Listen for session end (logout) and cleanup
  useEffect(() => {
    if (!onSessionEnd) return;
    return () => {
      setCltvData(null);
      setSegmentsData(null);
    };
  }, [onSessionEnd]);

  // Auto-load CLTV data when component mounts
  useEffect(() => {
    calculateCLTV();
  }, []);

  const calculateCLTV = async () => {
    setLoading(true);
    setError("");

    try {
      // Check cache first
      const cachedCLTV = localStorage.getItem(CLTV_CACHE_KEY);
      const cachedSegments = localStorage.getItem(CLTV_SEGMENTS_CACHE_KEY);
      const expiry = localStorage.getItem(CLTV_CACHE_EXPIRY_KEY);

      if (
        cachedCLTV &&
        cachedSegments &&
        expiry &&
        Date.now() < Number(expiry)
      ) {
        try {
          setCltvData(JSON.parse(cachedCLTV));
          setSegmentsData(JSON.parse(cachedSegments));
          setLoading(false);
          return;
        } catch (error) {
          console.error('Error parsing cached CLTV data:', error);
          // Clear invalid cache and continue with fresh data
          localStorage.removeItem(CLTV_CACHE_KEY);
          localStorage.removeItem(CLTV_SEGMENTS_CACHE_KEY);
          localStorage.removeItem(CLTV_CACHE_EXPIRY_KEY);
        }
      }

      // Fetch fresh data
      const [cltvResponse, segmentsResponse] = await Promise.all([
        cltvService.calculateCLTV(100),
        cltvService.getCLTVSegments()
      ]);

      setCltvData(cltvResponse);
      setSegmentsData(segmentsResponse);

      // Cache the results
      localStorage.setItem(CLTV_CACHE_KEY, JSON.stringify(cltvResponse));
      localStorage.setItem(CLTV_SEGMENTS_CACHE_KEY, JSON.stringify(segmentsResponse));
      localStorage.setItem(CLTV_CACHE_EXPIRY_KEY, (Date.now() + CACHE_DURATION).toString());

      toast({
        title: "Success",
        description: "CLTV analysis completed successfully",
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to calculate CLTV";
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    // Clear cache and reload
    localStorage.removeItem(CLTV_CACHE_KEY);
    localStorage.removeItem(CLTV_SEGMENTS_CACHE_KEY);
    localStorage.removeItem(CLTV_CACHE_EXPIRY_KEY);
    calculateCLTV();
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('en-US').format(value);
  };

  const formatPercentage = (value: number) => {
    return `${(value * 100).toFixed(1)}%`;
  };

  // Prepare chart data
  const segmentCLTV = segmentsData?.segments?.map(segment => ({
    segment: segment.segment,
    cltv: segment.average_cltv || 0,
    customers: segment.customer_count || 0,
    revenue: segment.total_revenue || 0
  })) || [];

  const topCustomers = cltvData?.top_customers?.slice(0, 5).map(customer => ({
    id: `CUST_${customer.customer_id}`,
    name: customer.customer_name || `Customer ${customer.customer_id}`,
    customerId: customer.customer_id,
    currentCLTV: formatCurrency(customer.cltv || 0),
    timeToValue: `${Math.round(12 / (customer.purchase_frequency || 1))} months`,
    totalSpent: formatCurrency(customer.total_price || 0),
    transactions: customer.total_transaction || 0
  })) || [];

  return (
    <div className="space-y-6">
      {/* Action Section */}
      <Card>
        <CardHeader>
          <CardTitle>CLTV Analysis</CardTitle>
          <CardDescription>
            Calculate Customer Lifetime Value for your data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-center">
            <Button 
              onClick={calculateCLTV} 
              disabled={loading}
              className="flex items-center gap-2"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              {loading ? "Calculating..." : "Calculate CLTV"}
            </Button>
            <Button 
              onClick={handleRefresh} 
              disabled={loading}
              variant="outline"
              className="flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </Button>
            {error && (
              <div className="flex-1 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {cltvData && (
        <>
          {/* CLTV Summary Cards */}
          <div className="grid md:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Average CLTV</CardTitle>
                <DollarSign className="w-4 h-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(cltvData.summary.average_cltv || 0)}
                </div>
                <p className="text-xs text-slate-500 mt-1">Across all customers</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <TrendingUp className="w-4 h-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {formatCurrency(cltvData.summary.total_revenue || 0)}
                </div>
                <p className="text-xs text-slate-500 mt-1">From all customers</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Churn Rate</CardTitle>
                <AlertTriangle className="w-4 h-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {formatPercentage(cltvData.summary.churn_rate || 0)}
                </div>
                <p className="text-xs text-slate-500 mt-1">Predicted churn rate</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
                <Target className="w-4 h-4 text-amber-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-amber-600">
                  {formatNumber(cltvData.summary.total_customers || 0)}
                </div>
                <p className="text-xs text-slate-500 mt-1">In database</p>
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
                Customers with highest lifetime value
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topCustomers.map((customer) => (
                  <div key={customer.id} className="p-4 border rounded-lg hover:bg-slate-50 transition-colors">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-medium text-slate-900">{customer.name}</h4>
                        <p className="text-sm text-slate-500">Customer ID: {customer.customerId}</p>
                      </div>
                      
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-3">
                      <div>
                        <span className="text-slate-500">Total Spent:</span>
                        <div className="font-medium text-blue-600">{customer.totalSpent}</div>
                      </div>
                      <div>
                        <span className="text-slate-500">Predicted CLTV:</span>
                        <div className="font-medium text-green-600">{customer.currentCLTV}</div>
                      </div>
                      <div>
                        <span className="text-slate-500">Transactions:</span>
                        <div className="font-medium">{customer.transactions}</div>
                      </div>
                      <div>
                        <span className="text-slate-500">Time to Value:</span>
                        <div className="font-medium">{customer.timeToValue}</div>
                      </div>
                    </div>

                    
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {!cltvData && !loading && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <DollarSign className="w-12 h-12 text-slate-300 mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">No CLTV Data</h3>
            <p className="text-slate-500 text-center max-w-md">
              Click "Calculate CLTV" to analyze your customer lifetime value data.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
