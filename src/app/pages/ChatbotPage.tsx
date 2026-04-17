import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Send, Bot, User, MessageSquare, Database, TrendingUp, AlertCircle, BarChart3, Sparkles, FileText, Upload as UploadIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface Dataset {
  filename: string;
  uploadedAt: string;
  columnNames: string[];
  totalRows: number;
  rows: any[];
}

export function ChatbotPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [dataset, setDataset] = useState<Dataset | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const storedDataset = localStorage.getItem('dataset');
    if (storedDataset) {
      setDataset(JSON.parse(storedDataset));
    }

    const welcomeMessage = storedDataset 
      ? `👋 Hello! I'm your AI Analytics Assistant for IntelliBoard.\n\nI can see you've uploaded **${JSON.parse(storedDataset).filename}**. I can help you:\n\n✨ Summarize your dataset\n📊 Calculate statistics (averages, min, max)\n📈 Analyze trends and patterns\n🔍 Detect anomalies and outliers\n💡 Generate insights and recommendations\n🎯 Answer specific questions about your data\n\nTry asking: "Summarize my dataset" or "What are the key insights?"`
      : `👋 Hello! I'm your AI Analytics Assistant for IntelliBoard.\n\n⚠️ **No dataset found!** Please upload a CSV file first.\n\nOnce you upload data, I can help you with:\n• Dataset summaries\n• Statistical analysis\n• Trend detection\n• Anomaly identification\n• Insights generation\n• And much more!\n\nGo to **Upload Data** to get started!`;

    setMessages([
      {
        role: 'assistant',
        content: welcomeMessage,
        timestamp: new Date().toLocaleTimeString(),
      },
    ]);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const getNumericColumns = () => {
    if (!dataset || dataset.rows.length === 0) return [];
    const firstRow = dataset.rows[0];
    return dataset.columnNames.filter(col => !isNaN(parseFloat(firstRow[col])));
  };

  const calculateStats = (columnName: string) => {
    if (!dataset) return { avg: 0, min: 0, max: 0, sum: 0, count: 0, median: 0 };
    const values = dataset.rows
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

  const generateResponse = (question: string): string => {
    if (!dataset) {
      return '⚠️ **No Dataset Found**\n\nPlease upload a dataset first using the "Upload Data" page. Once you have data loaded, come back here and I\'ll be happy to answer your questions!';
    }

    const lowerQuestion = question.toLowerCase();
    const numericCols = getNumericColumns();

    // Summarize dataset
    if (lowerQuestion.includes('summarize') || lowerQuestion.includes('summary') || lowerQuestion.includes('overview')) {
      return `📊 **Dataset Summary**\n\n` +
        `📁 **File:** ${dataset.filename}\n` +
        `📅 **Uploaded:** ${dataset.uploadedAt}\n` +
        `📝 **Total Rows:** ${dataset.totalRows.toLocaleString()}\n` +
        `📋 **Total Columns:** ${dataset.columnNames.length}\n` +
        `🔢 **Numeric Columns:** ${numericCols.length}\n\n` +
        `**Column Names:**\n${dataset.columnNames.map((col, i) => `${i + 1}. ${col}`).join('\n')}\n\n` +
        `**Analysis:** The dataset contains ${dataset.totalRows} records with ${dataset.columnNames.length} different fields. ` +
        `${numericCols.length > 0 ? `There are ${numericCols.length} numeric columns available for statistical analysis.` : 'The data is primarily categorical.'}`;
    }

    // Average values
    if (lowerQuestion.includes('average') || lowerQuestion.includes('mean')) {
      if (numericCols.length === 0) {
        return '❌ No numeric columns found in the dataset to calculate averages.';
      }
      let response = '📈 **Average Values**\n\n';
      numericCols.forEach(col => {
        const stats = calculateStats(col);
        response += `• **${col}:** ${stats.avg.toFixed(2)} (median: ${stats.median.toFixed(2)})\n`;
      });
      return response + '\n💡 The average (mean) shows the central tendency of your data.';
    }

    // Statistics for all columns
    if (lowerQuestion.includes('statistics') || lowerQuestion.includes('stats')) {
      if (numericCols.length === 0) {
        return '❌ No numeric columns found for statistical analysis.';
      }
      let response = '📊 **Statistical Analysis**\n\n';
      numericCols.forEach(col => {
        const stats = calculateStats(col);
        response += `**${col}:**\n`;
        response += `  • Average: ${stats.avg.toFixed(2)}\n`;
        response += `  • Median: ${stats.median.toFixed(2)}\n`;
        response += `  • Min: ${stats.min.toFixed(2)}\n`;
        response += `  • Max: ${stats.max.toFixed(2)}\n`;
        response += `  • Sum: ${stats.sum.toFixed(2)}\n`;
        response += `  • Count: ${stats.count}\n\n`;
      });
      return response;
    }

    // Highest values
    if (lowerQuestion.includes('highest') || lowerQuestion.includes('maximum') || lowerQuestion.includes('max')) {
      if (numericCols.length === 0) {
        return '❌ No numeric columns found in the dataset.';
      }
      let maxCol = numericCols[0];
      let maxValue = calculateStats(maxCol).max;
      
      numericCols.forEach(col => {
        const stats = calculateStats(col);
        if (stats.max > maxValue) {
          maxValue = stats.max;
          maxCol = col;
        }
      });
      
      return `🎯 **Highest Values Analysis**\n\n` +
        `The column **"${maxCol}"** has the highest maximum value of **${maxValue.toFixed(2)}**.\n\n` +
        `**All Maximum Values:**\n` +
        numericCols.map(col => {
          const stats = calculateStats(col);
          return `• ${col}: ${stats.max.toFixed(2)}`;
        }).join('\n');
    }

    // Lowest values
    if (lowerQuestion.includes('lowest') || lowerQuestion.includes('minimum') || lowerQuestion.includes('min')) {
      if (numericCols.length === 0) {
        return '❌ No numeric columns found in the dataset.';
      }
      let response = '📉 **Minimum Values**\n\n';
      numericCols.forEach(col => {
        const stats = calculateStats(col);
        response += `• **${col}:** ${stats.min.toFixed(2)}\n`;
      });
      return response;
    }

    // Anomaly detection
    if (lowerQuestion.includes('anomal') || lowerQuestion.includes('outlier')) {
      if (numericCols.length === 0) {
        return '❌ No numeric columns found for anomaly detection.';
      }
      
      let response = '🔍 **Anomaly Detection Analysis**\n\n';
      let totalAnomalies = 0;
      
      numericCols.slice(0, 5).forEach(col => {
        const stats = calculateStats(col);
        const values = dataset.rows.map(row => parseFloat(row[col])).filter(val => !isNaN(val));
        const stdDev = Math.sqrt(
          values.map(val => Math.pow(val - stats.avg, 2)).reduce((a, b) => a + b, 0) / values.length
        );
        
        const anomalies = dataset.rows.filter(row => {
          const val = parseFloat(row[col]);
          return !isNaN(val) && Math.abs(val - stats.avg) > 2 * stdDev;
        });
        
        totalAnomalies += anomalies.length;
        const percentage = ((anomalies.length / stats.count) * 100).toFixed(1);
        
        response += `• **${col}:** ${anomalies.length} anomalies (${percentage}% of data)\n`;
        response += `  Range: ${stats.min.toFixed(2)} - ${stats.max.toFixed(2)}\n`;
        response += `  Threshold: ±2 standard deviations from mean\n\n`;
      });
      
      response += `\n💡 **Total anomalies detected:** ${totalAnomalies}\n`;
      response += `📊 Anomalies are values that fall outside 2 standard deviations from the mean.`;
      
      return response;
    }

    // Insights and analysis
    if (lowerQuestion.includes('insight') || lowerQuestion.includes('analysis') || lowerQuestion.includes('findings')) {
      const dataQuality = dataset.totalRows > 1000 ? 'excellent' : dataset.totalRows > 500 ? 'good' : 'moderate';
      
      return `💡 **AI-Generated Insights**\n\n` +
        `📊 **Dataset:** ${dataset.filename}\n\n` +
        `**1. Data Quality & Size**\n` +
        `• Sample size: ${dataset.totalRows.toLocaleString()} records (${dataQuality} for analysis)\n` +
        `• Data completeness: Analyzing ${dataset.columnNames.length} dimensions\n\n` +
        `**2. Data Structure**\n` +
        `• Numeric fields: ${numericCols.length} columns available for quantitative analysis\n` +
        `• Categorical fields: ${dataset.columnNames.length - numericCols.length} columns for segmentation\n\n` +
        `**3. Recommended Next Steps**\n` +
        `${numericCols.length > 0 ? 
          `• Analyze correlations between ${numericCols.slice(0, 2).join(' and ')}\n` +
          `• Check for trends and patterns\n` +
          `• Identify outliers and anomalies\n` : 
          '• Focus on frequency distributions\n' +
          '• Analyze categorical patterns\n'}` +
        `• Use the AI Prediction Model for forecasting\n\n` +
        `💬 Ask me specific questions like "Show averages" or "Detect anomalies" for deeper insights!`;
    }

    // Column information
    if (lowerQuestion.includes('column') || lowerQuestion.includes('field')) {
      return `📋 **Column Information**\n\n` +
        `**All Columns (${dataset.columnNames.length}):**\n` +
        `${dataset.columnNames.map((col, i) => `${i + 1}. ${col}`).join('\n')}\n\n` +
        `**Numeric Columns (${numericCols.length}):**\n` +
        `${numericCols.length > 0 ? numericCols.map((col, i) => `${i + 1}. ${col}`).join('\n') : 'None found'}\n\n` +
        `**Categorical Columns (${dataset.columnNames.length - numericCols.length}):**\n` +
        `${dataset.columnNames.filter(c => !numericCols.includes(c)).map((col, i) => `${i + 1}. ${col}`).join('\n')}\n\n` +
        `💬 You can ask me for statistics about any specific column!`;
    }

    // Trend analysis
    if (lowerQuestion.includes('trend') || lowerQuestion.includes('pattern')) {
      if (numericCols.length === 0) {
        return '❌ No numeric data available for trend analysis.';
      }
      
      let response = '📈 **Trend Analysis**\n\n';
      
      numericCols.slice(0, 5).forEach(col => {
        const stats = calculateStats(col);
        const firstValues = dataset.rows.slice(0, Math.min(10, dataset.rows.length)).map(r => parseFloat(r[col])).filter(v => !isNaN(v));
        const lastValues = dataset.rows.slice(-Math.min(10, dataset.rows.length)).map(r => parseFloat(r[col])).filter(v => !isNaN(v));
        const firstAvg = firstValues.reduce((a, b) => a + b, 0) / firstValues.length;
        const lastAvg = lastValues.reduce((a, b) => a + b, 0) / lastValues.length;
        const change = ((lastAvg - firstAvg) / firstAvg * 100);
        const trend = lastAvg > firstAvg ? '📈 Increasing' : lastAvg < firstAvg ? '📉 Decreasing' : '➡️ Stable';
        
        response += `**${col}:**\n`;
        response += `  • Trend: ${trend}\n`;
        response += `  • Change: ${change.toFixed(1)}%\n`;
        response += `  • Average: ${stats.avg.toFixed(2)}\n`;
        response += `  • Range: ${stats.min.toFixed(2)} - ${stats.max.toFixed(2)}\n\n`;
      });
      
      return response + '💡 Trends are calculated by comparing first 10 and last 10 records.';
    }

    // Correlation
    if (lowerQuestion.includes('correlat') || lowerQuestion.includes('relationship')) {
      if (numericCols.length < 2) {
        return '❌ Need at least 2 numeric columns to analyze correlations.';
      }
      
      return `🔗 **Correlation Analysis**\n\n` +
        `Found ${numericCols.length} numeric columns for correlation analysis:\n` +
        `${numericCols.join(', ')}\n\n` +
        `💡 **Recommendation:**\n` +
        `Use the AI Prediction Model page to visualize relationships between:\n` +
        `• ${numericCols[0]} and ${numericCols[1]}\n` +
        `${numericCols.length > 2 ? `• ${numericCols[1]} and ${numericCols[2]}\n` : ''}` +
        `\nYou can also ask: "How do ${numericCols[0]} and ${numericCols[1]} relate?"`;
    }

    // Help / What can you do
    if (lowerQuestion.includes('help') || lowerQuestion.includes('what can you') || lowerQuestion.includes('how to')) {
      return `🤖 **AI Assistant Capabilities**\n\n` +
        `I can help you with:\n\n` +
        `📊 **Data Analysis:**\n` +
        `• "Summarize my dataset"\n` +
        `• "Show statistics"\n` +
        `• "Calculate averages"\n\n` +
        `🔍 **Detection:**\n` +
        `• "Detect anomalies"\n` +
        `• "Find outliers"\n` +
        `• "Which column has highest values?"\n\n` +
        `📈 **Insights:**\n` +
        `• "Analyze trends"\n` +
        `• "Generate insights"\n` +
        `• "What patterns do you see?"\n\n` +
        `📋 **Information:**\n` +
        `• "List all columns"\n` +
        `• "Show data structure"\n` +
        `• "What are the numeric fields?"\n\n` +
        `💬 Just ask me anything about your data!`;
    }

    // Default response
    return `🤔 I analyzed your question about **${dataset.filename}**.\n\n` +
      `The dataset contains ${dataset.totalRows} rows and ${dataset.columnNames.length} columns.\n\n` +
      `Try asking me:\n` +
      `• "Summarize my dataset"\n` +
      `• "Show average values"\n` +
      `• "Which column has the highest values?"\n` +
      `• "Detect anomalies"\n` +
      `• "Analyze trends"\n` +
      `• "Generate insights"\n\n` +
      `Or ask "help" to see all my capabilities!`;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage: Message = { 
      role: 'user', 
      content: input, 
      timestamp: new Date().toLocaleTimeString() 
    };
    setMessages(prev => [...prev, userMessage]);

    setIsTyping(true);
    setTimeout(() => {
      const aiResponse: Message = {
        role: 'assistant',
        content: generateResponse(input),
        timestamp: new Date().toLocaleTimeString(),
      };
      setMessages(prev => [...prev, aiResponse]);
      setIsTyping(false);
    }, 800);

    setInput('');
  };

  const quickQuestions = [
    { text: 'Summarize dataset', icon: FileText, query: 'Summarize this dataset' },
    { text: 'Show statistics', icon: BarChart3, query: 'Show me all statistics' },
    { text: 'Detect anomalies', icon: AlertCircle, query: 'Detect anomalies in the data' },
    { text: 'Analyze trends', icon: TrendingUp, query: 'Analyze trends in the dataset' },
    { text: 'Generate insights', icon: Sparkles, query: 'Generate key insights' },
    { text: 'Show columns', icon: Database, query: 'List all columns' },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <MessageSquare className="h-8 w-8 text-indigo-600" />
          AI Chatbot
        </h1>
        <p className="text-gray-600 mt-2">
          Ask questions about your uploaded dataset and get intelligent AI-powered answers
        </p>
      </div>

      {/* Dataset Status */}
      {dataset ? (
        <Card className="shadow-md border-green-200 bg-green-50">
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <Database className="h-6 w-6 text-green-600" />
              <div>
                <p className="font-semibold text-green-900">Dataset Loaded: {dataset.filename}</p>
                <p className="text-sm text-green-700">
                  {dataset.totalRows} rows × {dataset.columnNames.length} columns
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="shadow-md border-orange-200 bg-orange-50">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-6 w-6 text-orange-600" />
                <div>
                  <p className="font-semibold text-orange-900">No Dataset Found</p>
                  <p className="text-sm text-orange-700">Please upload a CSV file to start chatting</p>
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
      )}

      {/* Chat Interface */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-indigo-600" />
            Chat with AI Assistant
          </CardTitle>
          <CardDescription>
            Powered by IntelliBoard AI - Get instant insights about your data
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="h-[500px] overflow-y-auto p-6 space-y-4 bg-gray-50">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {message.role === 'assistant' && (
                  <div className="bg-gradient-to-br from-indigo-600 to-purple-600 p-2 rounded-full h-10 w-10 flex items-center justify-center flex-shrink-0 shadow-lg">
                    <Bot className="h-5 w-5 text-white" />
                  </div>
                )}
                <div className="flex flex-col gap-1 max-w-[75%]">
                  <div
                    className={`rounded-2xl px-5 py-3 shadow-md ${
                      message.role === 'user'
                        ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white'
                        : 'bg-white text-gray-900 border border-gray-200'
                    }`}
                  >
                    <p className="whitespace-pre-wrap text-sm leading-relaxed">{message.content}</p>
                  </div>
                  <span className={`text-xs text-gray-500 px-2 ${message.role === 'user' ? 'text-right' : 'text-left'}`}>
                    {message.timestamp}
                  </span>
                </div>
                {message.role === 'user' && (
                  <div className="bg-indigo-100 p-2 rounded-full h-10 w-10 flex items-center justify-center flex-shrink-0">
                    <User className="h-5 w-5 text-indigo-700" />
                  </div>
                )}
              </div>
            ))}
            {isTyping && (
              <div className="flex gap-3 justify-start">
                <div className="bg-gradient-to-br from-indigo-600 to-purple-600 p-2 rounded-full h-10 w-10 flex items-center justify-center flex-shrink-0 shadow-lg">
                  <Bot className="h-5 w-5 text-white animate-pulse" />
                </div>
                <div className="bg-white border border-gray-200 rounded-2xl px-5 py-3 shadow-md">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="border-t bg-white p-4">
            <form onSubmit={handleSubmit} className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask a question about your dataset..."
                className="flex-1"
                disabled={!dataset}
              />
              <Button 
                type="submit" 
                size="icon"
                disabled={!dataset}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
              >
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </CardContent>
      </Card>

      {/* Quick Questions */}
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="text-lg">Quick Questions</CardTitle>
          <CardDescription>Click any question to ask the AI assistant</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {quickQuestions.map((q, index) => {
              const Icon = q.icon;
              return (
                <Button
                  key={index}
                  variant="outline"
                  onClick={() => setInput(q.query)}
                  disabled={!dataset}
                  className="justify-start h-auto py-3"
                >
                  <Icon className="h-4 w-4 mr-2 flex-shrink-0" />
                  <span className="text-sm">{q.text}</span>
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
