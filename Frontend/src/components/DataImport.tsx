
import { useState, useRef } from "react";
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
  AlertTriangle,
  Link,
  RefreshCw,
  X,
  Settings
} from "lucide-react";
import { uploadService, UploadProgress, ColumnMapping, CSVValidationResponse } from "@/services/uploadService";
import { ColumnMappingModal } from "@/components/ColumnMappingModal";

export const DataImport = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [apiKey, setApiKey] = useState("");
  const [endpoint, setEndpoint] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [uploadMessage, setUploadMessage] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showColumnMapping, setShowColumnMapping] = useState(false);
  const [csvColumns, setCsvColumns] = useState<string[]>([]);
  const [columnMapping, setColumnMapping] = useState<ColumnMapping | null>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const validation = uploadService.validateCSVFile(file);
      if (validation.isValid) {
        setSelectedFile(file);
        setUploadStatus('idle');
        setUploadMessage("");
        
        // Get CSV columns for mapping
        try {
          const csvValidation = await uploadService.validateCSVColumns(file);
          setCsvColumns(csvValidation.columns);
          setShowColumnMapping(true);
        } catch (error) {
          console.error('Error reading CSV columns:', error);
          setUploadMessage("Error reading CSV file structure");
          setUploadStatus('error');
        }
      } else {
        setUploadMessage(validation.error || "Invalid file");
        setUploadStatus('error');
      }
    }
  };

  const handleFileUpload = async () => {
    if (!selectedFile) {
      setUploadMessage("Please select a file first");
      setUploadStatus('error');
      return;
    }

    setIsUploading(true);
    setUploadStatus('uploading');
    setUploadProgress(0);
    setUploadMessage("");

    try {
      await uploadService.uploadCSV(
        selectedFile,
        'ecommerce',
        columnMapping,
        (progress: UploadProgress) => {
          setUploadProgress(progress.percentage);
        }
      );

      setUploadStatus('success');
      setUploadMessage("File uploaded successfully!");
      setSelectedFile(null);
      setColumnMapping(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      setUploadStatus('error');
      setUploadMessage(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file) {
      const validation = uploadService.validateCSVFile(file);
      if (validation.isValid) {
        setSelectedFile(file);
        setUploadStatus('idle');
        setUploadMessage("");
      } else {
        setUploadMessage(validation.error || "Invalid file");
        setUploadStatus('error');
      }
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
  };

  const removeSelectedFile = () => {
    setSelectedFile(null);
    setUploadStatus('idle');
    setUploadMessage("");
    setColumnMapping(null);
    setShowColumnMapping(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleColumnMappingConfirm = (mapping: ColumnMapping) => {
    setColumnMapping(mapping);
    setShowColumnMapping(false);
    setUploadStatus('idle');
    setUploadMessage("Column mapping completed. Ready to upload.");
  };

  const handleColumnMappingClose = () => {
    setShowColumnMapping(false);
    setSelectedFile(null);
    setColumnMapping(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
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
              <div 
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  uploadStatus === 'error' 
                    ? 'border-red-300 bg-red-50' 
                    : uploadStatus === 'success'
                    ? 'border-green-300 bg-green-50'
                    : 'border-slate-300 hover:border-slate-400'
                }`}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                
                {selectedFile ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-center gap-2">
                      <FileText className="w-8 h-8 text-blue-500" />
                      <span className="font-medium text-slate-900">{selectedFile.name}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={removeSelectedFile}
                        className="h-6 w-6 p-0"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                    <p className="text-sm text-slate-500">
                      Size: {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                    
                    {/* Column Mapping Status */}
                    {columnMapping ? (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-2">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <span className="text-sm font-medium text-green-900">Columns Mapped</span>
                        </div>
                        <p className="text-xs text-green-700">
                          {Object.values(columnMapping).filter(Boolean).length} columns mapped
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowColumnMapping(true)}
                          className="mt-2"
                        >
                          <Settings className="w-3 h-3 mr-1" />
                          Edit Mapping
                        </Button>
                      </div>
                    ) : (
                      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-2">
                          <AlertTriangle className="w-4 h-4 text-amber-500" />
                          <span className="text-sm font-medium text-amber-900">Column Mapping Required</span>
                        </div>
                        <p className="text-xs text-amber-700 mb-2">
                          Map your CSV columns to the required system columns
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowColumnMapping(true)}
                        >
                          <Settings className="w-3 h-3 mr-1" />
                          Map Columns
                        </Button>
                      </div>
                    )}
                    
                    <Button 
                      onClick={handleFileUpload} 
                      disabled={isUploading || !columnMapping}
                    >
                      {isUploading ? (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                          Uploading... {uploadProgress}%
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4 mr-2" />
                          Upload File
                        </>
                      )}
                    </Button>
                  </div>
                ) : (
                  <>
                    <Upload className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-slate-900 mb-2">
                      Drop your CSV files here
                    </h3>
                    <p className="text-slate-500 mb-4">
                      or click to browse and select files
                    </p>
                    <Button onClick={() => fileInputRef.current?.click()}>
                      <Upload className="w-4 h-4 mr-2" />
                      Select Files
                    </Button>
                  </>
                )}

                {uploadMessage && (
                  <div className={`mt-4 p-3 rounded-md text-sm ${
                    uploadStatus === 'error' 
                      ? 'bg-red-100 text-red-700' 
                      : uploadStatus === 'success'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-blue-100 text-blue-700'
                  }`}>
                    {uploadMessage}
                  </div>
                )}
              </div>

              <div className="grid md:grid-cols-1 gap-4">
                <Card className="border-blue-200 bg-blue-50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm text-blue-900">Expected CSV Format</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-blue-700 mb-2">
                      Your CSV should include these columns:
                    </p>
                    <div className="text-xs text-blue-700 space-y-1">
                      <p><strong>Required:</strong> Customer ID, Customer Name, Purchase Date, Product Price, Quantity, Total Purchase Amount</p>
                      <p><strong>Optional:</strong> Returns, Age, Gender, Payment Method, Product Category, Churn</p>
                      <p><strong>Example:</strong> Customer ID, Customer Name, Purchase Date, Product Price, Quantity, Total Purchase Amount, Returns, Age, Gender, Payment Method, Product Category, Churn</p>
                    </div>
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
      
      {/* Column Mapping Modal */}
      <ColumnMappingModal
        isOpen={showColumnMapping}
        onClose={handleColumnMappingClose}
        onConfirm={handleColumnMappingConfirm}
        csvColumns={csvColumns}
        requiredColumns={uploadService.getRequiredColumns()}
        isLoading={isUploading}
      />
    </div>
  );
};
