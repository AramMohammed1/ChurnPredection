
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  Upload, 
  Database, 
  FileText, 
  CheckCircle, 
  AlertCircle,
  Link,
  RefreshCw
} from "lucide-react";

export const DataImport = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [apiKey, setApiKey] = useState("");
  const [endpoint, setEndpoint] = useState("");

  const handleFileUpload = () => {
    setIsUploading(true);
    // Simulate upload progress
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsUploading(false);
          return 100;
        }
        return prev + 10;
      });
    }, 200);
  };

  const dataSources = [
    {
      name: "Customer Data",
      status: "connected",
      lastSync: "2 hours ago",
      records: "14,892"
    },
    {
      name: "Order History", 
      status: "connected",
      lastSync: "1 hour ago",
      records: "47,123"
    },
    {
      name: "Product Catalog",
      status: "disconnected",
      lastSync: "Never",
      records: "0"
    }
  ];

  return (
    <div className="space-y-6">
      <Tabs defaultValue="upload" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="upload">CSV Upload</TabsTrigger>
          <TabsTrigger value="api">API Connection</TabsTrigger>
          <TabsTrigger value="status">Data Sources</TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="w-5 h-5" />
                Upload Customer Data
              </CardTitle>
              <CardDescription>
                Upload your customer, order, and product data in CSV format
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center hover:border-slate-400 transition-colors">
                <Upload className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-900 mb-2">
                  Drop your CSV files here
                </h3>
                <p className="text-slate-500 mb-4">
                  or click to browse and select files
                </p>
                <Button onClick={handleFileUpload} disabled={isUploading}>
                  {isUploading ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Uploading... {uploadProgress}%
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Select Files
                    </>
                  )}
                </Button>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <Card className="border-blue-200 bg-blue-50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm text-blue-900">Customers</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-blue-700">
                      ID, Name, Email, Signup Date, Segment
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-green-200 bg-green-50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm text-green-900">Orders</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-green-700">
                      Order ID, Customer ID, Date, Amount, Status
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-purple-200 bg-purple-50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm text-purple-900">Products</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-purple-700">
                      Product ID, Name, Category, Price, Inventory
                    </p>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="api" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Link className="w-5 h-5" />
                API Integration
              </CardTitle>
              <CardDescription>
                Connect to your e-commerce platform or database API
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label htmlFor="api-endpoint">API Endpoint</Label>
                  <Input
                    id="api-endpoint"
                    placeholder="https://api.yourstore.com/v1"
                    value={endpoint}
                    onChange={(e) => setEndpoint(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="api-key">API Key</Label>
                  <Input
                    id="api-key"
                    type="password"
                    placeholder="Enter your API key"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                  />
                </div>

                <Button className="w-fit">
                  <Database className="w-4 h-4 mr-2" />
                  Test Connection
                </Button>
              </div>

              <div className="mt-6">
                <h4 className="font-medium mb-3">Supported Platforms</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {["Shopify", "WooCommerce", "Magento", "BigCommerce"].map((platform) => (
                    <Badge key={platform} variant="outline" className="justify-center py-2">
                      {platform}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="status" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="w-5 h-5" />
                Data Source Status
              </CardTitle>
              <CardDescription>
                Monitor your connected data sources and sync status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {dataSources.map((source) => (
                  <div key={source.name} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        {source.status === "connected" ? (
                          <CheckCircle className="w-5 h-5 text-green-500" />
                        ) : (
                          <AlertCircle className="w-5 h-5 text-red-500" />
                        )}
                        <div>
                          <h4 className="font-medium">{source.name}</h4>
                          <p className="text-sm text-slate-500">
                            Last sync: {source.lastSync}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-sm font-medium">{source.records}</div>
                        <div className="text-xs text-slate-500">records</div>
                      </div>
                      <Badge 
                        variant={source.status === "connected" ? "default" : "destructive"}
                      >
                        {source.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
