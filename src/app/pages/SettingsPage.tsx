import { useState, useEffect } from 'react';
import { Settings, User, Bell, Shield, Database, Palette, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

interface UserSettings {
  emailNotifications: boolean;
  aiInsightsAlerts: boolean;
  dataQualityWarnings: boolean;
}

export function SettingsPage() {
  const { user, updateUser } = useAuth();
  const { theme, setTheme } = useTheme();
  const [name, setName] = useState(user?.name || '');
  const [settings, setSettings] = useState<UserSettings>({
    emailNotifications: true,
    aiInsightsAlerts: true,
    dataQualityWarnings: true,
  });

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saveMessage, setSaveMessage] = useState('');
  const [passwordMessage, setPasswordMessage] = useState('');

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('userSettings');
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }
  }, []);

  // Update name when user changes
  useEffect(() => {
    if (user?.name) {
      setName(user.name);
    }
  }, [user]);

  const handleSaveProfile = async () => {
    // Update user name in AuthContext and Supabase
    await updateUser({ name });

    // Save other settings to localStorage
    localStorage.setItem('userSettings', JSON.stringify(settings));

    setSaveMessage('Profile updated successfully!');
    setTimeout(() => setSaveMessage(''), 3000);
  };

  const handlePasswordChange = () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordMessage('Please fill in all password fields');
      setTimeout(() => setPasswordMessage(''), 3000);
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordMessage('New passwords do not match');
      setTimeout(() => setPasswordMessage(''), 3000);
      return;
    }

    if (newPassword.length < 6) {
      setPasswordMessage('Password must be at least 6 characters');
      setTimeout(() => setPasswordMessage(''), 3000);
      return;
    }

    // In a real app, this would call the backend
    setPasswordMessage('Password changed successfully!');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setTimeout(() => setPasswordMessage(''), 3000);
  };

  const handleToggleSetting = (key: keyof UserSettings) => {
    const newSettings = {
      ...settings,
      [key]: !settings[key as keyof typeof settings],
    };
    setSettings(newSettings);
    localStorage.setItem('userSettings', JSON.stringify(newSettings));
  };

  const handleThemeChange = (newTheme: 'light' | 'dark' | 'auto') => {
    setTheme(newTheme);
  };

  const handleClearCache = () => {
    // Clear all cached data except auth and dataset
    const auth = localStorage.getItem('auth');
    const dataset = localStorage.getItem('dataset');
    const userSettings = localStorage.getItem('userSettings');

    localStorage.clear();

    if (auth) localStorage.setItem('auth', auth);
    if (dataset) localStorage.setItem('dataset', dataset);
    if (userSettings) localStorage.setItem('userSettings', userSettings);

    alert('Cache cleared successfully!');
  };

  const handleExportData = () => {
    const dataset = localStorage.getItem('dataset');
    if (!dataset) {
      alert('No dataset to export');
      return;
    }

    const data = JSON.parse(dataset);
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${data.filename.replace('.csv', '')}_export.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const calculateStorageUsed = () => {
    let total = 0;
    for (let key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        total += localStorage[key].length + key.length;
      }
    }
    return (total / 1024 / 1024).toFixed(2); // Convert to MB
  };

  const storageUsed = parseFloat(calculateStorageUsed());
  const storageLimit = 10; // Assume 10MB limit
  const storagePercentage = (storageUsed / storageLimit) * 100;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <Settings className="h-8 w-8 text-indigo-600" />
          Settings
        </h1>
        <p className="text-gray-600 mt-2">
          Manage your account settings and preferences
        </p>
      </div>

      {/* Profile Settings */}
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-indigo-600" />
            Profile Information
          </CardTitle>
          <CardDescription>Update your account profile details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input id="email" type="email" value={user?.email} disabled />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              onClick={handleSaveProfile}
              className="bg-gradient-to-r from-indigo-600 to-purple-600"
            >
              Save Changes
            </Button>
            {saveMessage && (
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="h-4 w-4" />
                <span className="text-sm">{saveMessage}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-purple-600" />
            Notifications
          </CardTitle>
          <CardDescription>Configure your notification preferences</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <p className="font-medium text-gray-900">Email Notifications</p>
              <p className="text-sm text-gray-600">Receive insights and reports via email</p>
            </div>
            <input
              type="checkbox"
              checked={settings.emailNotifications}
              onChange={() => handleToggleSetting('emailNotifications')}
              className="h-5 w-5 text-indigo-600 rounded cursor-pointer"
            />
          </div>
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <p className="font-medium text-gray-900">AI Insights Alerts</p>
              <p className="text-sm text-gray-600">Get notified when new insights are available</p>
            </div>
            <input
              type="checkbox"
              checked={settings.aiInsightsAlerts}
              onChange={() => handleToggleSetting('aiInsightsAlerts')}
              className="h-5 w-5 text-indigo-600 rounded cursor-pointer"
            />
          </div>
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <p className="font-medium text-gray-900">Data Quality Warnings</p>
              <p className="text-sm text-gray-600">Alerts for data quality issues</p>
            </div>
            <input
              type="checkbox"
              checked={settings.dataQualityWarnings}
              onChange={() => handleToggleSetting('dataQualityWarnings')}
              className="h-5 w-5 text-indigo-600 rounded cursor-pointer"
            />
          </div>
        </CardContent>
      </Card>

      {/* Security */}
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-green-600" />
            Security
          </CardTitle>
          <CardDescription>Manage your account security settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="current-password">Current Password</Label>
            <Input
              id="current-password"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-password">New Password</Label>
            <Input
              id="new-password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirm New Password</Label>
            <Input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-3">
            <Button onClick={handlePasswordChange} variant="outline">
              Change Password
            </Button>
            {passwordMessage && (
              <span className={`text-sm ${passwordMessage.includes('success') ? 'text-green-600' : 'text-red-600'}`}>
                {passwordMessage}
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Data & Storage */}
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5 text-blue-600" />
            Data & Storage
          </CardTitle>
          <CardDescription>Manage your data and storage settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <p className="font-medium text-gray-900">Storage Used</p>
              <p className="text-sm text-gray-600">{storageUsed} MB of {storageLimit} MB</p>
            </div>
            <div className="w-48 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full ${storagePercentage > 80 ? 'bg-red-600' : 'bg-indigo-600'}`}
                style={{ width: `${Math.min(storagePercentage, 100)}%` }}
              ></div>
            </div>
          </div>
          <div className="flex gap-3">
            <Button onClick={handleClearCache} variant="outline">
              Clear Cache
            </Button>
            <Button onClick={handleExportData} variant="outline">
              Export Data
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Appearance */}
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5 text-pink-600" />
            Appearance
          </CardTitle>
          <CardDescription>Customize the look and feel</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <p className="font-medium text-gray-900">Theme</p>
              <p className="text-sm text-gray-600">Choose your preferred theme</p>
            </div>
            <select
              value={theme}
              onChange={(e) => handleThemeChange(e.target.value as 'light' | 'dark' | 'auto')}
              className="px-4 py-2 border rounded-lg cursor-pointer bg-white dark:bg-gray-800 dark:text-white"
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
              <option value="auto">Auto</option>
            </select>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
