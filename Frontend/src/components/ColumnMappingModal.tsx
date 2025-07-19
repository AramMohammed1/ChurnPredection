import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle, Info } from "lucide-react";
import { ColumnMapping, RequiredColumn, CSVValidationResponse } from "@/services/uploadService";

interface ColumnMappingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (mapping: ColumnMapping) => void;
  csvColumns: string[];
  requiredColumns: RequiredColumn[];
  isLoading?: boolean;
}

export const ColumnMappingModal = ({
  isOpen,
  onClose,
  onConfirm,
  csvColumns,
  requiredColumns,
  isLoading = false
}: ColumnMappingModalProps) => {
  const [mapping, setMapping] = useState<ColumnMapping>({
    customer_id: '',
    customer_name: '',
    purchase_date: '',
    product_price: '',
    quantity: '',
    total_purchase_amount: '',
    returns: '',
    age: '',
    gender: '',
    payment_method: '',
    product_category: '',
    churn: ''
  });

  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Auto-map columns based on name similarity
  useEffect(() => {
    if (csvColumns.length > 0) {
      const autoMapping: Partial<ColumnMapping> = {};
      
      csvColumns.forEach(csvCol => {
        const lowerCol = csvCol.toLowerCase();
        
        // Auto-map based on common patterns
        if (lowerCol.includes('customer') && lowerCol.includes('id')) {
          autoMapping.customer_id = csvCol;
        } else if (lowerCol.includes('customer') && lowerCol.includes('name')) {
          autoMapping.customer_name = csvCol;
        } else if (lowerCol.includes('purchase') && lowerCol.includes('date')) {
          autoMapping.purchase_date = csvCol;
        } else if (lowerCol.includes('product') && lowerCol.includes('price')) {
          autoMapping.product_price = csvCol;
        } else if (lowerCol.includes('quantity')) {
          autoMapping.quantity = csvCol;
        } else if (lowerCol.includes('total') && lowerCol.includes('amount')) {
          autoMapping.total_purchase_amount = csvCol;
        } else if (lowerCol.includes('return')) {
          autoMapping.returns = csvCol;
        } else if (lowerCol.includes('age')) {
          autoMapping.age = csvCol;
        } else if (lowerCol.includes('gender')) {
          autoMapping.gender = csvCol;
        } else if (lowerCol.includes('payment') && lowerCol.includes('method')) {
          autoMapping.payment_method = csvCol;
        } else if (lowerCol.includes('product') && lowerCol.includes('category')) {
          autoMapping.product_category = csvCol;
        } else if (lowerCol.includes('churn')) {
          autoMapping.churn = csvCol;
        }
      });
      
      setMapping(prev => ({ ...prev, ...autoMapping }));
    }
  }, [csvColumns]);

  const validateMapping = (): string[] => {
    const errors: string[] = [];
    
    requiredColumns.forEach(column => {
      if (column.required && !mapping[column.key]) {
        errors.push(`${column.label} is required`);
      }
    });
    
    return errors;
  };

  const handleConfirm = () => {
    const errors = validateMapping();
    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }
    
    // All fields are required now
    const cleanMapping: ColumnMapping = {
      customer_id: mapping.customer_id,
      customer_name: mapping.customer_name,
      purchase_date: mapping.purchase_date,
      product_price: mapping.product_price,
      quantity: mapping.quantity,
      total_purchase_amount: mapping.total_purchase_amount,
      returns: mapping.returns,
      age: mapping.age,
      gender: mapping.gender,
      payment_method: mapping.payment_method,
      product_category: mapping.product_category,
      churn: mapping.churn,
    };
    
    onConfirm(cleanMapping);
  };

  const handleReset = () => {
    setMapping({
      customer_id: '',
      customer_name: '',
      purchase_date: '',
      product_price: '',
      quantity: '',
      total_purchase_amount: '',
      returns: '',
      age: '',
      gender: '',
      payment_method: '',
      product_category: '',
      churn: ''
    });
    setValidationErrors([]);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="w-5 h-5" />
            Map CSV Columns
          </CardTitle>
          <CardDescription>
            Map your CSV columns to the required system columns. Required fields are marked with an asterisk (*).
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Available CSV Columns */}
          <div className="bg-slate-50 p-4 rounded-lg">
            <h3 className="font-medium text-slate-900 mb-2">Available CSV Columns</h3>
            <div className="flex flex-wrap gap-2">
              {csvColumns.map((column, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {column}
                </Badge>
              ))}
            </div>
          </div>

          {/* Validation Errors */}
          {validationErrors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-red-500" />
                <h4 className="font-medium text-red-900">Required Fields Missing</h4>
              </div>
              <ul className="text-sm text-red-700 space-y-1">
                {validationErrors.map((error, index) => (
                  <li key={index}>• {error}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Column Mapping */}
          <div className="space-y-4">
            {requiredColumns.map((column) => (
              <div key={column.key} className="flex items-center gap-4">
                <div className="flex-1">
                  <Label htmlFor={column.key} className="flex items-center gap-2">
                    {column.label}
                    {column.required && <span className="text-red-500">*</span>}
                  </Label>
                  <p className="text-xs text-slate-500 mt-1">{column.description}</p>
                </div>
                
                <div className="w-64">
                  <Select
                    value={mapping[column.key] || 'none'}
                    onValueChange={(value) => 
                      setMapping(prev => ({ ...prev, [column.key]: value === 'none' ? '' : value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select column" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {csvColumns.map((csvCol, index) => (
                        <SelectItem key={index} value={csvCol}>
                          {csvCol}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {mapping[column.key] && (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                )}
              </div>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={handleReset}>
              Reset Mapping
            </Button>
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              onClick={handleConfirm} 
              disabled={isLoading || validationErrors.length > 0}
            >
              {isLoading ? 'Uploading...' : 'Confirm & Upload'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}; 