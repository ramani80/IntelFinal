import { Link, useLocation } from 'react-router-dom';
import { Brain, Upload, BarChart3, Sparkles, Wand2, FileText, Settings, LogOut, MessageSquare } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button } from './ui/button';

export function Sidebar() {
  const location = useLocation();
  const { logout, user } = useAuth();

  const menuItems = [
    { path: '/dashboard', label: 'Dashboard', icon: BarChart3 },
    { path: '/upload', label: 'Upload Data', icon: Upload },
    { path: '/data-cleaning', label: 'Smart Data Cleaning', icon: Sparkles },
    { path: '/ai-insights', label: 'AI Data Insights', icon: Brain },
    { path: '/ai-prediction', label: 'AI Prediction Model', icon: Wand2 },
    { path: '/chatbot', label: 'AI Chatbot', icon: MessageSquare },
    { path: '/reports', label: 'Reports', icon: FileText },
    { path: '/settings', label: 'Settings', icon: Settings },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="w-64 bg-gradient-to-b from-gray-900 via-gray-900 to-gray-800 dark:from-gray-950 dark:via-gray-950 dark:to-gray-900 text-white min-h-screen flex flex-col shadow-xl">
      {/* Logo & Branding */}
      <div className="p-6 border-b border-gray-700 dark:border-gray-800">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-2.5 rounded-xl shadow-lg">
            <Brain className="h-7 w-7" />
          </div>
          <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              IntelliBoard
            </h1>
            <p className="text-xs text-gray-400">AI Analytics Platform</p>
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <div className="flex-1 p-4">
        <nav className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                  isActive(item.path)
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/30'
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="text-sm font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* User Profile Section */}
      <div className="p-4 border-t border-gray-700 dark:border-gray-800">
        <div className="mb-3 px-4 py-3 bg-gray-800 dark:bg-gray-900 rounded-lg">
          <p className="text-xs text-gray-400 mb-1">Logged in as</p>
          <p className="text-sm font-medium truncate">{user?.name}</p>
          <p className="text-xs text-gray-500 truncate">{user?.email}</p>
        </div>
        <Button
          onClick={logout}
          variant="outline"
          className="w-full flex items-center justify-center gap-2 border-gray-700 hover:bg-gray-800"
        >
          <LogOut className="h-4 w-4" />
          <span className="text-sm">Logout</span>
        </Button>
      </div>
    </div>
  );
}