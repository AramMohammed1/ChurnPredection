
import { useState, useRef, useEffect } from "react";
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
  Settings,
  Clock,
  FileUp
} from "lucide-react";
import { uploadService, UploadProgress, ColumnMapping, CSVValidationResponse, UploadHistoryEntry } from "@/services/uploadService";
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
  const [tableName, setTableName] = useState("");
  const [uploadHistory, setUploadHistory] = useState<UploadHistoryEntry[]>([]);
  
  // API Import states
  const [isImporting, setIsImporting] = useState(false);
  const [importStatus, setImportStatus] = useState<'idle' | 'importing' | 'success' | 'error'>('idle');
  const [importMessage, setImportMessage] = useState("");

  // Load upload history on component mount
  useEffect(() => {
    const loadUploadHistory = async () => {
      try {
        const history = await uploadService.getUploadHistory();
        console.log('Upload history received:', history); // Debug log
        setUploadHistory(history);
      } catch (error) {
        console.error('Error loading upload history:', error);
      }
    };
    
    loadUploadHistory();
  }, []);

  const formatTimeAgo = (dateString: string): string => {
    console.log('formatTimeAgo called with:', dateString); // Debug log
    
    if (!dateString) {
      return 'Unknown';
    }
    
    try {
      const date = new Date(dateString);
      
      // Check if the date is valid
      if (isNaN(date.getTime())) {
        console.warn('Invalid date string:', dateString);
        return 'Invalid date';
      }
      
      const now = new Date();
      const diffInMs = now.getTime() - date.getTime();
      
      // Handle future dates
      if (diffInMs < 0) {
        return 'Just now';
      }
      
      const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
      const diffInDays = Math.floor(diffInHours / 24);

      if (diffInDays > 0) {
        return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
      } else if (diffInHours > 0) {
        return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
      } else {
        const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
        if (diffInMinutes > 0) {
          return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
        } else {
          return 'Just now';
        }
      }
    } catch (error) {
      console.error('Error formatting time ago:', error, 'Date string:', dateString);
      return 'Error';
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

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
        tableName,
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
      
      // Refresh upload history after successful upload
      const history = await uploadService.getUploadHistory();
      setUploadHistory(history);
    } catch (error) {
      setUploadStatus('error');
      setUploadMessage(error instanceof Error ? error.message : "Upload failed");
      
      // Refresh upload history after failed upload
      const history = await uploadService.getUploadHistory();
      setUploadHistory(history);
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

  const handleApiImport = async () => {
    if (!endpoint || !apiKey) {
      setImportMessage("Please provide both API endpoint and API key");
      setImportStatus('error');
      return;
    }

    setIsImporting(true);
    setImportStatus('importing');
    setImportMessage("");

    try {
      const result = await uploadService.importFromAPI(endpoint, apiKey);
      
      setImportStatus('success');
      setImportMessage(`Successfully imported ${result.records_count} records from API`);
      
      // Clear form
      setEndpoint("");
      setApiKey("");
      
      // Refresh upload history
      const history = await uploadService.getUploadHistory();
      setUploadHistory(history);
    } catch (error) {
      setImportStatus('error');
      setImportMessage(error instanceof Error ? error.message : "API import failed");
    } finally {
      setIsImporting(false);
    }
  };

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
                Connect to your external API and import data directly into your database
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* API Documentation */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">API Requirements</h4>
                <div className="text-sm text-blue-800 space-y-2">
                  <p><strong>Authentication:</strong> Bearer token authentication</p>
                  <p><strong>Response Format:</strong> JSON array of objects with the following required fields:</p>
                  <div className="ml-4 space-y-1">
                    <p>• Customer ID (number)</p>
                    <p>• Customer Name (string)</p>
                    <p>• Purchase Date (string, YYYY-MM-DD format)</p>
                    <p>• Product Price (number)</p>
                    <p>• Quantity (number)</p>
                    <p>• Total Purchase Amount (number)</p>
                    <p>• Returns (number)</p>
                    <p>• Age (number)</p>
                    <p>• Gender (string: "Male" or "Female") - raw categorical value</p>
                    <p>• Payment Method (string: "Credit Card", "PayPal", etc.) - raw categorical value</p>
                    <p>• Product Category (string: "Electronics", "Clothing", etc.) - raw categorical value</p>
                    <p>• Churn (number: 0 or 1)</p>
                  </div>
                  <p className="mt-2 text-blue-700"><strong>Note:</strong> Categorical data should be returned in raw format. The system will automatically handle one-hot encoding during processing.</p>
                  <p className="mt-2"><strong>Example Response:</strong></p>
                  <pre className="bg-blue-100 p-2 rounded text-xs overflow-x-auto">
{`[
  {
    "Customer ID": 1,
    "Customer Name": "John Doe",
    "Purchase Date": "2024-01-15",
    "Product Price": 29.99,
    "Quantity": 2,
    "Total Purchase Amount": 59.98,
    "Returns": 0,
    "Age": 35,
    "Gender": "Male",
    "Payment Method": "Credit Card",
    "Product Category": "Electronics",
    "Churn": 0
  }
]`}
                  </pre>
                </div>
              </div>

              {/* API Connection Form */}
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label htmlFor="api-endpoint">API Endpoint</Label>
                  <Input
                    id="api-endpoint"
                    placeholder="https://api.yourstore.com/v1/customers"
                    value={endpoint}
                    onChange={(e) => setEndpoint(e.target.value)}
                    disabled={isImporting}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="api-key">API Key</Label>
                  <Input
                    id="api-key"
                    placeholder="Enter your API key"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    disabled={isImporting}
                  />
                </div>

                <Button 
                  onClick={handleApiImport} 
                  disabled={isImporting || !endpoint || !apiKey}
                  className="w-fit"
                >
                  {isImporting ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Importing...
                    </>
                  ) : (
                    <>
                      <Database className="w-4 h-4 mr-2" />
                      Import Data
                    </>
                  )}
                </Button>

                {importMessage && (
                  <div className={`p-3 rounded-md text-sm ${
                    importStatus === 'error' 
                      ? 'bg-red-100 text-red-700' 
                      : importStatus === 'success'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-blue-100 text-blue-700'
                  }`}>
                    {importMessage}
                  </div>
                )}
              </div>

            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="status" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="w-5 h-5" />
                Upload History
              </CardTitle>
              <CardDescription>
                Track your data upload history and monitor sync status
              </CardDescription>
            </CardHeader>
            <CardContent>
              {uploadHistory.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <FileUp className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                  <p>No upload history found</p>
                  <p className="text-sm">Upload your first CSV file to see history here</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {uploadHistory.map((entry) => (
                    <div key={entry.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          {entry.status === "success" ? (
                            <CheckCircle className="w-5 h-5 text-green-500" />
                          ) : (
                            <AlertCircle className="w-5 h-5 text-red-500" />
                          )}
                          <div>
                            <h4 className="font-medium">{entry.filename}</h4>
                            <div className="flex items-center gap-4 text-sm text-slate-500">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {formatTimeAgo(entry.uploadTime)}
                              </span>
                              <span>Size: {formatFileSize(entry.fileSize)}</span>
                            </div>
                            {entry.errorMessage && (
                              <p className="text-xs text-red-600 mt-1">{entry.errorMessage}</p>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="text-sm font-medium">
                            {entry.recordsCount ? entry.recordsCount.toLocaleString() : '0'}
                          </div>
                          <div className="text-xs text-slate-500">records</div>
                        </div>
                        <Badge 
                          variant={entry.status === "success" ? "default" : "destructive"}
                        >
                          {entry.status.toLocaleUpperCase()}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
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
