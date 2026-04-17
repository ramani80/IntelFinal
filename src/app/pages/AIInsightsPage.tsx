import { useState, useEffect } from 'react';
import { Brain, TrendingUp, TrendingDown, AlertCircle, Award, Zap, Target, BarChart3, Upload as UploadIcon } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Button } from '../components/ui/button';
import { useNavigate } from 'react-router-dom';

interface Insight {
  id: number;
  type: 'trend' | 'anomaly' | 'performance' | 'opportunity';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  value: string;
  icon: any;
  color: string;
}

interface Dataset {
  filename: string;
  uploadedAt: string;
  columnNames: string[];
  totalRows: number;
  rows: any[];
}

export function AIInsightsPage() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [dataset, setDataset] = useState<Dataset | null>(null);
  const [trendData, setTrendData] = useState<any[]>([]);
  const [categoryData, setCategoryData] = useState<any[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const storedDataset = localStorage.getItem('dataset');
    if (storedDataset) {
      const data = JSON.parse(storedDataset);
      setDataset(data);
      generateInsights(data);
    }
  }, []);

  const getNumericColumns = (data: Dataset) => {
    if (!data || data.rows.length === 0) return [];
    const firstRow = data.rows[0];
    return data.columnNames.filter(col => !isNaN(parseFloat(firstRow[col])));
  };

  const calculateStats = (data: Dataset, columnName: string) => {
    if (!data) return { avg: 0, min: 0, max: 0, sum: 0, count: 0, median: 0 };
    const values = data.rows
      .map(row => parseFloat(row[columnName]))
      .filter(val => !isNaN(val))
      .sort((a, b) => a - b);

    const sum = values.reduce((a, b) => a + b, 0);
    const median = values.length > 0 ? values[Math.floor(values.length / 2)] : 0;

    return {
      avg: sum / values.length,
      min: Math.min(...values),
      max: Math.max(...values),
      sum: sum,
      count: values.length,
      median: median,
    };
  };

  const generateInsights = (data: Dataset) => {
    setIsGenerating(true);
    setTimeout(() => {
      const numericCols = getNumericColumns(data);
      const generatedInsights: Insight[] = [];

      // Generate trend data from actual dataset
      if (numericCols.length > 0) {
        const firstNumCol = numericCols[0];
        const secondNumCol = numericCols.length > 1 ? numericCols[1] : numericCols[0];

        // Create trend chart data (sample 6 points)
        const step = Math.floor(data.rows.length / 6) || 1;
        const trends = [];
        for (let i = 0; i < 6; i++) {
          const index = Math.min(i * step, data.rows.length - 1);
          trends.push({
            month: `Point ${i + 1}`,
            [firstNumCol]: parseFloat(data.rows[index][firstNumCol]) || 0,
            [secondNumCol]: parseFloat(data.rows[index][secondNumCol]) || 0,
          });
        }
        setTrendData(trends);

        // Performance insight - highest performing column
        let maxCol = numericCols[0];
        let maxValue = calculateStats(data, maxCol).max;
        numericCols.forEach(col => {
          const stats = calculateStats(data, col);
          if (stats.max > maxValue) {
            maxValue = stats.max;
            maxCol = col;
          }
        });

        const maxStats = calculateStats(data, maxCol);
        const avgValue = maxStats.avg;
        const performancePercent = ((maxStats.max / avgValue - 1) * 100).toFixed(0);

        generatedInsights.push({
          id: 1,
          type: 'performance',
          title: `Highest Performing Column: ${maxCol}`,
          description: `"${maxCol}" shows exceptional performance with max value ${maxValue.toFixed(2)} (${performancePercent}% above average)`,
          impact: 'high',
          value: `+${performancePercent}%`,
          icon: Award,
          color: 'from-green-500 to-emerald-600',
        });

        // Trend insight - growth analysis
        const firstColStats = calculateStats(data, firstNumCol);
        const firstValues = data.rows.slice(0, 10).map(r => parseFloat(r[firstNumCol])).filter(v => !isNaN(v));
        const lastValues = data.rows.slice(-10).map(r => parseFloat(r[firstNumCol])).filter(v => !isNaN(v));
        const firstAvg = firstValues.reduce((a, b) => a + b, 0) / firstValues.length;
        const lastAvg = lastValues.reduce((a, b) => a + b, 0) / lastValues.length;
        const growthPercent = ((lastAvg - firstAvg) / firstAvg * 100).toFixed(0);
        const trendDirection = lastAvg > firstAvg ? 'positive' : 'negative';

        generatedInsights.push({
          id: 2,
          type: 'trend',
          title: `${trendDirection === 'positive' ? 'Positive' : 'Negative'} Growth Trend in ${firstNumCol}`,
          description: `"${firstNumCol}" has ${trendDirection === 'positive' ? 'increased' : 'decreased'} by ${Math.abs(parseFloat(growthPercent))}% comparing first and last 10 records`,
          impact: 'high',
          value: `${parseFloat(growthPercent) > 0 ? '+' : ''}${growthPercent}%`,
          icon: trendDirection === 'positive' ? TrendingUp : TrendingDown,
          color: trendDirection === 'positive' ? 'from-blue-500 to-indigo-600' : 'from-orange-500 to-red-600',
        });

        // Anomaly detection
        let totalAnomalies = 0;
        numericCols.slice(0, 3).forEach(col => {
          const stats = calculateStats(data, col);
          const values = data.rows.map(row => parseFloat(row[col])).filter(val => !isNaN(val));
          const stdDev = Math.sqrt(
            values.map(val => Math.pow(val - stats.avg, 2)).reduce((a, b) => a + b, 0) / values.length
          );
          const anomalies = data.rows.filter(row => {
            const val = parseFloat(row[col]);
            return !isNaN(val) && Math.abs(val - stats.avg) > 2 * stdDev;
          });
          totalAnomalies += anomalies.length;
        });

        if (totalAnomalies > 0) {
          generatedInsights.push({
            id: 3,
            type: 'anomaly',
            title: 'Anomalies Detected',
            description: `Found ${totalAnomalies} anomalies across numeric columns - values beyond 2 standard deviations from mean`,
            impact: 'medium',
            value: `${totalAnomalies} alerts`,
            icon: AlertCircle,
            color: 'from-orange-500 to-red-600',
          });
        }

        // Data quality insight
        let missingCount = 0;
        data.rows.forEach(row => {
          data.columnNames.forEach(col => {
            if (row[col] === '' || row[col] === null || row[col] === undefined) {
              missingCount++;
            }
          });
        });

        if (missingCount > 0) {
          const missingPercent = ((missingCount / (data.rows.length * data.columnNames.length)) * 100).toFixed(1);
          generatedInsights.push({
            id: 4,
            type: 'opportunity',
            title: 'Data Quality Opportunity',
            description: `${missingCount} missing values detected (${missingPercent}% of total cells) - consider data cleaning`,
            impact: 'medium',
            value: 'Action',
            icon: Target,
            color: 'from-purple-500 to-pink-600',
          });
        }

        // Dataset size insight
        const dataQuality = data.totalRows > 1000 ? 'excellent' : data.totalRows > 500 ? 'good' : 'moderate';
        generatedInsights.push({
          id: 5,
          type: 'trend',
          title: 'Dataset Size Analysis',
          description: `Dataset contains ${data.totalRows} records with ${dataQuality} sample size for statistical analysis`,
          impact: 'low',
          value: dataQuality,
          icon: Zap,
          color: 'from-yellow-500 to-orange-500',
        });

        // Correlation opportunity
        if (numericCols.length >= 2) {
          generatedInsights.push({
            id: 6,
            type: 'performance',
            title: 'Correlation Analysis Available',
            description: `${numericCols.length} numeric columns detected - advanced correlation analysis is possible`,
            impact: 'high',
            value: `${numericCols.length} cols`,
            icon: Award,
            color: 'from-teal-500 to-cyan-600',
          });
        }

        // Category distribution (if we have categorical data)
        const categoricalCols = data.columnNames.filter(c => !numericCols.includes(c));
        if (categoricalCols.length > 0) {
          const firstCatCol = categoricalCols[0];
          const categoryCount: Record<string, number> = {};
          data.rows.forEach(row => {
            const val = row[firstCatCol];
            if (val) {
              categoryCount[val] = (categoryCount[val] || 0) + 1;
            }
          });

          const catData = Object.entries(categoryCount)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([category, value]) => ({ category, value }));

          setCategoryData(catData);
        }
      }

      setInsights(generatedInsights);
      setIsGenerating(false);
    }, 2000);
  };

  const getImpactBadge = (impact: string) => {
    switch (impact) {
      case 'high':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'low':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  if (!dataset) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Brain className="h-8 w-8 text-indigo-600" />
            AI Data Insights
          </h1>
          <p className="text-gray-600 mt-2">
            AI-powered insights automatically generated from your data
          </p>
        </div>

        <Card className="shadow-md border-orange-200 bg-orange-50">
          <CardContent className="py-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <AlertCircle className="h-8 w-8 text-orange-600" />
                <div>
                  <p className="text-lg font-semibold text-orange-900">No Dataset Found</p>
                  <p className="text-sm text-orange-700">Please upload a CSV file to generate AI insights</p>
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
            <Brain className="h-8 w-8 text-indigo-600" />
            AI Data Insights
          </h1>
          <p className="text-gray-600 mt-2">
            AI-powered insights from {dataset.filename}
          </p>
        </div>
        <button
          onClick={() => generateInsights(dataset)}
          disabled={isGenerating}
          className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
        >
          {isGenerating ? 'Generating...' : 'Regenerate Insights'}
        </button>
      </div>

      {/* Loading State */}
      {isGenerating && (
        <Card className="shadow-md border-indigo-200 bg-gradient-to-r from-indigo-50 to-purple-50">
          <CardContent className="py-8">
            <div className="flex items-center justify-center gap-4">
              <Brain className="h-8 w-8 text-indigo-600 animate-pulse" />
              <div>
                <p className="text-lg font-semibold text-indigo-900">AI Analyzing Your Data...</p>
                <p className="text-sm text-indigo-700">Generating intelligent insights and recommendations</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Key Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="shadow-md bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
          <CardContent className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-700 font-medium">Total Insights</p>
                <p className="text-3xl font-bold text-blue-900">{insights.length}</p>
              </div>
              <Brain className="h-10 w-10 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-md bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
          <CardContent className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-700 font-medium">High Impact</p>
                <p className="text-3xl font-bold text-green-900">
                  {insights.filter(i => i.impact === 'high').length}
                </p>
              </div>
              <TrendingUp className="h-10 w-10 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-md bg-gradient-to-br from-orange-50 to-red-50 border-orange-200">
          <CardContent className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-orange-700 font-medium">Anomalies</p>
                <p className="text-3xl font-bold text-orange-900">
                  {insights.filter(i => i.type === 'anomaly').length}
                </p>
              </div>
              <AlertCircle className="h-10 w-10 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-md bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
          <CardContent className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-700 font-medium">Opportunities</p>
                <p className="text-3xl font-bold text-purple-900">
                  {insights.filter(i => i.type === 'opportunity').length}
                </p>
              </div>
              <Target className="h-10 w-10 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Insight Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {insights.map((insight) => {
          const Icon = insight.icon;
          return (
            <Card key={insight.id} className="shadow-lg hover:shadow-xl transition-shadow border-t-4 border-t-transparent hover:border-t-indigo-500">
              <CardHeader>
                <div className="flex items-start justify-between mb-3">
                  <div className={`p-3 rounded-xl bg-gradient-to-br ${insight.color} shadow-lg`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${getImpactBadge(insight.impact)}`}>
                    {insight.impact.toUpperCase()}
                  </span>
                </div>
                <CardTitle className="text-lg">{insight.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-sm mb-4">{insight.description}</p>
                <div className="flex items-center justify-between pt-4 border-t">
                  <span className="text-xs text-gray-500 uppercase font-semibold">
                    {insight.type}
                  </span>
                  <span className={`text-lg font-bold bg-gradient-to-r ${insight.color} bg-clip-text text-transparent`}>
                    {insight.value}
                  </span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Trend Charts */}
      {trendData.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Data Trend */}
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-indigo-600" />
                Data Trends
              </CardTitle>
              <CardDescription>Trends from your uploaded dataset</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  {Object.keys(trendData[0] || {}).filter(k => k !== 'month').map((key, index) => (
                    <Line
                      key={key}
                      type="monotone"
                      dataKey={key}
                      stroke={index === 0 ? "#6366f1" : "#8b5cf6"}
                      strokeWidth={2}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Category Distribution */}
          {categoryData.length > 0 && (
            <Card className="shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-purple-600" />
                  Category Distribution
                </CardTitle>
                <CardDescription>Top categories in your dataset</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={categoryData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="category" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="value" fill="#8b5cf6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
