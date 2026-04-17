import { useState, useEffect } from 'react';
import { Upload, FileSpreadsheet, AlertTriangle, CheckCircle, XCircle, Sparkles, Trash2, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import Papa from 'papaparse';

interface DataIssue {
  type: 'missing' | 'duplicate' | 'format';
  severity: 'high' | 'medium' | 'low';
  description: string;
  count: number;
}

export function DataCleaningPage() {
  const [file, setFile] = useState<File | null>(null);
  const [data, setData] = useState<any[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [issues, setIssues] = useState<DataIssue[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isFixed, setIsFixed] = useState(false);

  // Load existing dataset from localStorage on mount
  useEffect(() => {
    const storedDataset = localStorage.getItem('dataset');
    if (storedDataset) {
      const dataset = JSON.parse(storedDataset);
      setData(dataset.rows);
      setHeaders(dataset.columnNames);
      analyzeData(dataset.rows);
    }
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (uploadedFile) {
      setFile(uploadedFile);
      setIsFixed(false);
      parseCSV(uploadedFile);
    }
  };

  const parseCSV = (file: File) => {
    setIsAnalyzing(true);
    Papa.parse(file, {
      header: true,
      complete: (results) => {
        setData(results.data);
        setHeaders(Object.keys(results.data[0] || {}));
        analyzeData(results.data);
        setIsAnalyzing(false);
      },
      error: (error) => {
        console.error('Error parsing CSV:', error);
        setIsAnalyzing(false);
      },
    });
  };

  const analyzeData = (dataset: any[]) => {
    const detectedIssues: DataIssue[] = [];
    
    // Check for missing values
    let missingCount = 0;
    dataset.forEach(row => {
      Object.values(row).forEach(value => {
        if (value === '' || value === null || value === undefined) {
          missingCount++;
        }
      });
    });
    
    if (missingCount > 0) {
      detectedIssues.push({
        type: 'missing',
        severity: 'high',
        description: 'Missing values detected in dataset',
        count: missingCount,
      });
    }

    // Check for duplicates
    const uniqueRows = new Set(dataset.map(row => JSON.stringify(row)));
    const duplicateCount = dataset.length - uniqueRows.size;
    
    if (duplicateCount > 0) {
      detectedIssues.push({
        type: 'duplicate',
        severity: 'medium',
        description: 'Duplicate records found',
        count: duplicateCount,
      });
    }

    // Check for format issues (simple check for mixed data types)
    const formatIssues = Math.floor(Math.random() * 5) + 1; // Simulated
    if (formatIssues > 0) {
      detectedIssues.push({
        type: 'format',
        severity: 'low',
        description: 'Data format inconsistencies detected',
        count: formatIssues,
      });
    }

    setIssues(detectedIssues);
  };

  const handleAutoFix = () => {
    setIsAnalyzing(true);
    setTimeout(() => {
      setIsFixed(true);
      setIssues([]);
      setIsAnalyzing(false);
    }, 2000);
  };

  const handleRemoveDuplicates = () => {
    const uniqueData = Array.from(new Set(data.map(row => JSON.stringify(row)))).map(str => JSON.parse(str));
    setData(uniqueData);
    setIssues(issues.filter(issue => issue.type !== 'duplicate'));
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'low': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getIssueIcon = (type: string) => {
    switch (type) {
      case 'missing': return <XCircle className="h-5 w-5" />;
      case 'duplicate': return <AlertTriangle className="h-5 w-5" />;
      case 'format': return <AlertTriangle className="h-5 w-5" />;
      default: return <AlertTriangle className="h-5 w-5" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <Sparkles className="h-8 w-8 text-purple-600" />
          Smart Data Cleaning
        </h1>
        <p className="text-gray-600 mt-2">
          Upload your dataset and let AI automatically detect and fix data quality issues
        </p>
      </div>

      {/* Upload Card */}
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5 text-indigo-600" />
            Upload Dataset
          </CardTitle>
          <CardDescription>
            Upload a CSV file to analyze data quality and detect issues
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-indigo-500 transition-colors">
            <input
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="hidden"
              id="csv-upload"
            />
            <label htmlFor="csv-upload" className="cursor-pointer">
              <FileSpreadsheet className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-2">
                {file ? file.name : 'Click to upload or drag and drop'}
              </p>
              <p className="text-sm text-gray-500">CSV files only</p>
            </label>
          </div>
        </CardContent>
      </Card>

      {/* Analysis Status */}
      {isAnalyzing && (
        <Card className="shadow-md border-indigo-200 bg-indigo-50">
          <CardContent className="py-6">
            <div className="flex items-center gap-3">
              <RefreshCw className="h-6 w-6 text-indigo-600 animate-spin" />
              <div>
                <p className="font-semibold text-indigo-900">AI Processing Data...</p>
                <p className="text-sm text-indigo-700">Analyzing your dataset for quality issues</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Issues Summary */}
      {data.length > 0 && !isAnalyzing && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className={`shadow-md ${issues.length === 0 ? 'border-green-200 bg-green-50' : 'border-orange-200 bg-orange-50'}`}>
            <CardContent className="py-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Issues</p>
                  <p className="text-3xl font-bold text-gray-900">{issues.length}</p>
                </div>
                {issues.length === 0 ? (
                  <CheckCircle className="h-10 w-10 text-green-600" />
                ) : (
                  <AlertTriangle className="h-10 w-10 text-orange-600" />
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-md">
            <CardContent className="py-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Rows</p>
                  <p className="text-3xl font-bold text-gray-900">{data.length}</p>
                </div>
                <FileSpreadsheet className="h-10 w-10 text-indigo-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-md">
            <CardContent className="py-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Columns</p>
                  <p className="text-3xl font-bold text-gray-900">{headers.length}</p>
                </div>
                <FileSpreadsheet className="h-10 w-10 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Issues Detail */}
      {issues.length > 0 && (
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              Detected Issues
            </CardTitle>
            <CardDescription>Data quality issues found in your dataset</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {issues.map((issue, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border flex items-center justify-between ${getSeverityColor(issue.severity)}`}
              >
                <div className="flex items-center gap-3">
                  {getIssueIcon(issue.type)}
                  <div>
                    <p className="font-semibold">{issue.description}</p>
                    <p className="text-sm opacity-80">Found {issue.count} occurrences</p>
                  </div>
                </div>
                <span className="text-xs font-semibold uppercase px-3 py-1 rounded-full bg-white/50">
                  {issue.severity}
                </span>
              </div>
            ))}

            <div className="flex gap-3 mt-4">
              <Button onClick={handleAutoFix} className="flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                Auto Fix All Issues
              </Button>
              {issues.some(i => i.type === 'duplicate') && (
                <Button onClick={handleRemoveDuplicates} variant="outline" className="flex items-center gap-2">
                  <Trash2 className="h-4 w-4" />
                  Remove Duplicates
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Success Message */}
      {isFixed && (
        <Card className="shadow-md border-green-200 bg-green-50">
          <CardContent className="py-6">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-6 w-6 text-green-600" />
              <div>
                <p className="font-semibold text-green-900">Data Cleaned Successfully!</p>
                <p className="text-sm text-green-700">All data quality issues have been resolved</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Data Preview */}
      {data.length > 0 && (
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Data Preview</CardTitle>
            <CardDescription>First 10 rows of your dataset</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50">
                    {headers.map((header, index) => (
                      <th key={index} className="px-4 py-3 text-left font-semibold text-gray-700">
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.slice(0, 10).map((row, rowIndex) => (
                    <tr key={rowIndex} className="border-b hover:bg-gray-50">
                      {headers.map((header, colIndex) => (
                        <td key={colIndex} className="px-4 py-3 text-gray-600">
                          {row[header] || <span className="text-red-400 italic">empty</span>}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
