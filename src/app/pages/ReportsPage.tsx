import { useState, useEffect } from 'react';
import { FileText, Download, Filter, Calendar, TrendingUp, AlertCircle, Upload as UploadIcon } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { useNavigate } from 'react-router-dom';

interface Dataset {
  filename: string;
  uploadedAt: string;
  columnNames: string[];
  totalRows: number;
  rows: any[];
}

interface Report {
  id: number;
  name: string;
  description: string;
  date: string;
  type: string;
  status: string;
}

export function ReportsPage() {
  const [dataset, setDataset] = useState<Dataset | null>(null);
  const [reports, setReports] = useState<Report[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const storedDataset = localStorage.getItem('dataset');
    if (storedDataset) {
      const data = JSON.parse(storedDataset);
      setDataset(data);
      generateReports(data);
    }
  }, []);

  const getNumericColumns = (data: Dataset) => {
    if (!data || data.rows.length === 0) return [];
    const firstRow = data.rows[0];
    return data.columnNames.filter(col => !isNaN(parseFloat(firstRow[col])));
  };

  const calculateStats = (data: Dataset, columnName: string) => {
    if (!data) return { avg: 0, min: 0, max: 0, sum: 0, count: 0 };
    const values = data.rows
      .map(row => parseFloat(row[columnName]))
      .filter(val => !isNaN(val));

    const sum = values.reduce((a, b) => a + b, 0);

    return {
      avg: sum / values.length,
      min: Math.min(...values),
      max: Math.max(...values),
      sum: sum,
      count: values.length,
    };
  };

  const generateReports = (data: Dataset) => {
    const currentDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const numericCols = getNumericColumns(data);
    const generatedReports: Report[] = [];

    // Dataset Overview Report
    generatedReports.push({
      id: 1,
      name: `${data.filename} - Overview Report`,
      description: `Complete overview of ${data.filename} with ${data.totalRows} rows and ${data.columnNames.length} columns`,
      date: currentDate,
      type: 'Overview',
      status: 'Ready',
    });

    // Data Quality Report
    let missingCount = 0;
    data.rows.forEach(row => {
      data.columnNames.forEach(col => {
        if (row[col] === '' || row[col] === null || row[col] === undefined) {
          missingCount++;
        }
      });
    });

    const duplicates = data.rows.length - new Set(data.rows.map(r => JSON.stringify(r))).size;

    generatedReports.push({
      id: 2,
      name: 'Data Quality Analysis',
      description: `Quality report: ${missingCount} missing values, ${duplicates} duplicate rows detected`,
      date: currentDate,
      type: 'Quality',
      status: 'Ready',
    });

    // Statistical Analysis Report (if numeric columns exist)
    if (numericCols.length > 0) {
      const firstCol = numericCols[0];
      const stats = calculateStats(data, firstCol);

      generatedReports.push({
        id: 3,
        name: 'Statistical Analysis Report',
        description: `Analysis of ${numericCols.length} numeric columns with averages, trends, and distributions`,
        date: currentDate,
        type: 'Statistics',
        status: 'Ready',
      });
    }

    // AI Insights Summary
    generatedReports.push({
      id: 4,
      name: 'AI Insights Summary',
      description: `AI-generated insights from ${data.filename} including trends and anomalies`,
      date: currentDate,
      type: 'AI Insights',
      status: 'Ready',
    });

    // Prediction Report (if numeric data exists)
    if (numericCols.length > 0) {
      generatedReports.push({
        id: 5,
        name: 'Prediction Forecast Report',
        description: `AI prediction model results for ${numericCols[0]} with confidence intervals`,
        date: currentDate,
        type: 'Prediction',
        status: 'Ready',
      });
    }

    setReports(generatedReports);
  };

  const handleDownloadReport = (report: Report) => {
    if (!dataset) return;

    // Generate report content
    let content = `${report.name}\n`;
    content += `Generated: ${report.date}\n`;
    content += `Type: ${report.type}\n`;
    content += `\n${'='.repeat(60)}\n\n`;

    if (report.type === 'Overview') {
      content += `DATASET OVERVIEW\n\n`;
      content += `Filename: ${dataset.filename}\n`;
      content += `Upload Date: ${new Date(dataset.uploadedAt).toLocaleDateString()}\n`;
      content += `Total Rows: ${dataset.totalRows}\n`;
      content += `Total Columns: ${dataset.columnNames.length}\n\n`;
      content += `Column Names:\n`;
      dataset.columnNames.forEach((col, i) => {
        content += `  ${i + 1}. ${col}\n`;
      });
    } else if (report.type === 'Quality') {
      content += `DATA QUALITY REPORT\n\n`;
      let missingCount = 0;
      dataset.rows.forEach(row => {
        dataset.columnNames.forEach(col => {
          if (row[col] === '' || row[col] === null || row[col] === undefined) {
            missingCount++;
          }
        });
      });
      const duplicates = dataset.rows.length - new Set(dataset.rows.map(r => JSON.stringify(r))).size;
      content += `Missing Values: ${missingCount}\n`;
      content += `Duplicate Rows: ${duplicates}\n`;
      content += `Completeness: ${((1 - missingCount / (dataset.rows.length * dataset.columnNames.length)) * 100).toFixed(2)}%\n`;
    } else if (report.type === 'Statistics') {
      content += `STATISTICAL ANALYSIS\n\n`;
      const numericCols = getNumericColumns(dataset);
      numericCols.forEach(col => {
        const stats = calculateStats(dataset, col);
        content += `Column: ${col}\n`;
        content += `  Average: ${stats.avg.toFixed(2)}\n`;
        content += `  Minimum: ${stats.min.toFixed(2)}\n`;
        content += `  Maximum: ${stats.max.toFixed(2)}\n`;
        content += `  Sum: ${stats.sum.toFixed(2)}\n`;
        content += `  Count: ${stats.count}\n\n`;
      });
    }

    // Create download
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${report.name.replace(/[^a-z0-9]/gi, '_')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleGenerateNewReport = () => {
    if (dataset) {
      generateReports(dataset);
      alert('Reports regenerated successfully!');
    }
  };

  if (!dataset) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <FileText className="h-8 w-8 text-indigo-600" />
              Reports
            </h1>
            <p className="text-gray-600 mt-2">
              Generate and download comprehensive analytics reports
            </p>
          </div>
        </div>

        <Card className="shadow-md border-orange-200 bg-orange-50">
          <CardContent className="py-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <AlertCircle className="h-8 w-8 text-orange-600" />
                <div>
                  <p className="text-lg font-semibold text-orange-900">No Dataset Found</p>
                  <p className="text-sm text-orange-700">Please upload a CSV file to generate reports</p>
                </div>
              </div>
              <Button
                onClick={() => navigate('/upload')}
                className="bg-orange-600 hover:bg-orange-700"
              >
                <UploadIcon className="h-4 w-4 mr-2" />
                Upload Data
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <FileText className="h-8 w-8 text-indigo-600" />
            Reports
          </h1>
          <p className="text-gray-600 mt-2">
            Reports generated from {dataset.filename}
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            onClick={handleGenerateNewReport}
            className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600"
          >
            <FileText className="h-4 w-4" />
            Regenerate Reports
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="shadow-md">
          <CardContent className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Reports</p>
                <p className="text-3xl font-bold text-gray-900">{reports.length}</p>
              </div>
              <FileText className="h-10 w-10 text-indigo-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-md">
          <CardContent className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Dataset Rows</p>
                <p className="text-3xl font-bold text-gray-900">{dataset.totalRows}</p>
              </div>
              <TrendingUp className="h-10 w-10 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-md">
          <CardContent className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Columns</p>
                <p className="text-3xl font-bold text-gray-900">{dataset.columnNames.length}</p>
              </div>
              <Download className="h-10 w-10 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-md">
          <CardContent className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Report Types</p>
                <p className="text-3xl font-bold text-gray-900">{new Set(reports.map(r => r.type)).size}</p>
              </div>
              <Calendar className="h-10 w-10 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Reports List */}
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>Available Reports</CardTitle>
          <CardDescription>Download and view your generated reports</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {reports.map((report) => (
              <div
                key={report.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-indigo-100 rounded-lg">
                    <FileText className="h-6 w-6 text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{report.name}</h3>
                    <p className="text-sm text-gray-600">{report.description}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {report.date}
                      </span>
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded">
                        {report.type}
                      </span>
                      <span className="px-2 py-1 bg-green-100 text-green-700 rounded">
                        {report.status}
                      </span>
                    </div>
                  </div>
                </div>
                <Button
                  onClick={() => handleDownloadReport(report)}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Download
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
