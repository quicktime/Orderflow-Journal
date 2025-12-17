import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, NavLink, useNavigate } from 'react-router-dom';
import { SessionDashboard } from './components/session/SessionDashboard';
import { AnalyticsDashboard } from './components/analytics/AnalyticsDashboard';
import { HistoryPage } from './components/session/HistoryPage';
import { SettingsPage } from './components/session/SettingsPage';
import { 
  LayoutDashboard, 
  BarChart3, 
  History, 
  Settings,
  TrendingUp,
} from 'lucide-react';

const Navigation: React.FC = () => {
  const navigate = useNavigate();

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return;
      }

      switch (e.key.toLowerCase()) {
        case 'd':
          navigate('/');
          break;
        case 'a':
          navigate('/analytics');
          break;
        case 'h':
          navigate('/history');
          break;
        case 's':
          if (!e.metaKey && !e.ctrlKey) {
            navigate('/settings');
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate]);

  const navItems = [
    { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/analytics', icon: BarChart3, label: 'Analytics' },
    { path: '/history', icon: History, label: 'History' },
    { path: '/settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <nav className="bg-[#1a1a1a] border-b border-[#404040]">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <TrendingUp className="text-blue-500" size={24} />
            <span className="font-bold text-lg">Orderflow Journal</span>
          </div>

          {/* Nav Links */}
          <div className="flex items-center gap-1">
            {navItems.map(item => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-400 hover:text-white hover:bg-[#262626]'
                  }`
                }
              >
                <item.icon size={18} />
                <span className="hidden sm:inline">{item.label}</span>
              </NavLink>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
};

const AppContent: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#0f0f0f]">
      <Navigation />
      <main className="max-w-7xl mx-auto px-4 py-6">
        <Routes>
          <Route path="/" element={<SessionDashboard />} />
          <Route path="/analytics" element={<AnalyticsDashboard />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </main>
    </div>
  );
};

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;
