
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { Users, Crown, Star, Heart, Shield, AlertCircle, RefreshCw, Loader2 } from "lucide-react";
import { segmentationService, SegmentationResponse, SegmentInfo, BehaviorAnalysis } from "@/services/segmentationService";
import { useToast } from "@/hooks/use-toast";

interface CustomerSegmentationProps {
  onSessionEnd?: () => void;
}

export const CustomerSegmentation = ({ onSessionEnd }: CustomerSegmentationProps) => {
  const [segmentationData, setSegmentationData] = useState<SegmentationResponse | null>(null);
  const [behaviorData, setBehaviorData] = useState<BehaviorAnalysis[]>([]);
  const [loading, setLoading] = useState(false);
  const [tableName, setTableName] = useState("customer_data"); // Default table name
  const { toast } = useToast();

  // Cache keys and duration
  const SEGMENTATION_CACHE_KEY = "segmentationData";
  const BEHAVIOR_CACHE_KEY = "segmentationBehaviorData";
  const SEGMENTATION_CACHE_EXPIRY_KEY = "segmentationExpiry";
  const CACHE_DURATION = 60 * 60 * 1000; // 1 hour

  // Listen for session end (logout) and cleanup
  useEffect(() => {
    if (!onSessionEnd) return;
    return () => {
      setSegmentationData(null);
      setBehaviorData([]);
    };
  }, [onSessionEnd]);

  const segmentIcons = {
    "Champions": Crown,
    "Loyal Customers": Heart,
    "Potential Loyalists": Star,
    "At Risk": AlertCircle,
    "New Customers": Users,
    "Need Attention": Shield,
  };

  const loadSegmentationData = async () => {
    setLoading(true);
    try {
      // Check cache first
      const cachedSegmentation = localStorage.getItem(SEGMENTATION_CACHE_KEY);
      const cachedBehavior = localStorage.getItem(BEHAVIOR_CACHE_KEY);
      const expiry = localStorage.getItem(SEGMENTATION_CACHE_EXPIRY_KEY);

      if (
        cachedSegmentation &&
        cachedBehavior &&
        expiry &&
        Date.now() < Number(expiry)
      ) {
        setSegmentationData(JSON.parse(cachedSegmentation));
        setBehaviorData(JSON.parse(cachedBehavior));
        setLoading(false);
        return;
      }

      // Fetch fresh data
      const data = await segmentationService.getSegments(tableName);
      setSegmentationData(data);
      setBehaviorData(data.behavior_analysis);

      // Cache the results
      localStorage.setItem(SEGMENTATION_CACHE_KEY, JSON.stringify(data));
      localStorage.setItem(BEHAVIOR_CACHE_KEY, JSON.stringify(data.behavior_analysis));
      localStorage.setItem(SEGMENTATION_CACHE_EXPIRY_KEY, (Date.now() + CACHE_DURATION).toString());

      toast({
        title: "Segmentation loaded",
        description: "Customer segments have been successfully loaded.",
      });
    } catch (error) {
      console.error('Error loading segmentation data:', error);
      toast({
        title: "Error",
        description: "Failed to load segmentation data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSegmentationData();
  }, [tableName]);

  const handleRefresh = () => {
    // Clear cache and reload
    localStorage.removeItem(SEGMENTATION_CACHE_KEY);
    localStorage.removeItem(BEHAVIOR_CACHE_KEY);
    localStorage.removeItem(SEGMENTATION_CACHE_EXPIRY_KEY);
    loadSegmentationData();
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center gap-3">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span>Loading segmentation data...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!segmentationData) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <p className="text-muted-foreground">No segmentation data available</p>
              <Button onClick={handleRefresh} className="mt-4">
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Convert segments object to array for pie chart
  const segmentsArray = Object.values(segmentationData.segments).map((segment: SegmentInfo) => ({
    name: segment.name,
    count: segment.count,
    percentage: segment.percentage,
    color: segment.color,
    icon: segmentIcons[segment.name as keyof typeof segmentIcons] || Users,
    description: segment.description,
    avgSpent: segment.avg_spent,
    frequency: getPurchaseFrequency(segment.avg_spent, segment.count)
  }));

  function getPurchaseFrequency(avgSpent: number, count: number): string {
    if (avgSpent > 2000) return "Weekly";
    if (avgSpent > 1000) return "Bi-weekly";
    if (avgSpent > 500) return "Monthly";
    if (avgSpent > 200) return "Quarterly";
    return "One-time";
  }

  return (
    <div className="space-y-6">
      {/* Header with refresh button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Customer Segmentation</h2>
          <p className="text-muted-foreground">AI-powered customer segmentation analysis</p>
        </div>
        <Button onClick={handleRefresh} disabled={loading}>
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4" />
          )}
          Refresh
        </Button>
      </div>

      {/* Segment Overview */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Customer Distribution</CardTitle>
            <CardDescription>Breakdown of customers by segment</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={segmentsArray}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    label = {({ name, percent }) => `${name}`}
                    dataKey="percentage"
                  >
                    {segmentsArray.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value,key) => [`${value}%`,`${key}`]} />
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
            <div className="h-80">
              <ResponsiveContainer width="100%" height="90%">
                <BarChart data={behaviorData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="segment"  label={{value: 'segment', angle: 0, position: 'insideBottom', offset: -2}}/>
                  <YAxis  label={{ value: 'frequency/Engagment', angle: -90, position: 'Left',offset: 5}}/>
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
            {segmentsArray.map((segment) => (
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
                    <div className="font-medium">${segment.avgSpent.toLocaleString()}</div>
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
