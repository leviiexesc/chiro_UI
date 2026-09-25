import React, { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { Topbar } from './components/Topbar';
import { Login } from './pages/Login';
import { Overview } from './pages/Overview';
import { Licenses } from './pages/Licenses';
import { Products } from './pages/Products';
import { Devices } from './pages/Devices';
import { AuditLogs } from './pages/AuditLogs';
import { Settings } from './pages/Settings';
import { FreeKey } from './pages/FreeKey';
import { useAuth } from './context/AuthContext';
import { Loader2 } from 'lucide-react';

export const App: React.FC = () => {
  const { isAuthenticated, loading } = useAuth();
  const [currentTab, setCurrentTab] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [globalSearch, setGlobalSearch] = useState('');

  // Modal control state lifted here so Topbar quick-actions work across pages
  const [createLicenseOpen, setCreateLicenseOpen] = useState(false);
  const [batchLicenseOpen, setBatchLicenseOpen] = useState(false);

  // === Public route: /free-key - no login required ===
  if (window.location.pathname === '/free-key') {
    return <FreeKey />;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-[#0a0d14]">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-600 to-blue-500 flex items-center justify-center mb-4 shadow-xl shadow-cyan-500/25">
          <Loader2 className="w-6 h-6 text-white animate-spin" />
        </div>
        <p className="text-sm font-mono text-gray-400">Authenticating session...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login />;
  }

  const handleNavigate = (tab: string) => {
    setCurrentTab(tab);
    setSidebarOpen(false);
  };

  const renderPage = () => {
    switch (currentTab) {
      case 'overview':
        return (
          <Overview
            onNavigate={handleNavigate}
            onOpenGenerate={() => {
              setCurrentTab('licenses');
              setTimeout(() => setCreateLicenseOpen(true), 50);
            }}
            onOpenBatch={() => {
              setCurrentTab('licenses');
              setTimeout(() => setBatchLicenseOpen(true), 50);
            }}
          />
        );
      case 'licenses':
        return (
          <Licenses
            initialSearch={globalSearch}
            createModalOpen={createLicenseOpen}
            onCloseCreateModal={() => setCreateLicenseOpen(false)}
            batchModalOpen={batchLicenseOpen}
            onCloseBatchModal={() => setBatchLicenseOpen(false)}
          />
        );
      case 'products':
        return <Products />;
      case 'devices':
        return <Devices initialSearch={globalSearch} />;
      case 'audit-logs':
        return <AuditLogs />;
      case 'settings':
        return <Settings />;
      default:
        return (
          <Overview
            onNavigate={handleNavigate}
            onOpenGenerate={() => setCreateLicenseOpen(true)}
            onOpenBatch={() => setBatchLicenseOpen(true)}
          />
        );
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-[#0a0d14] cyber-grid">
      <Sidebar
        currentTab={currentTab}
        onSelectTab={handleNavigate}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main column: offset by sidebar width on desktop */}
      <div className="flex flex-col flex-1 min-w-0 lg:ml-64 transition-all duration-300">
        <Topbar
          onToggleSidebar={() => setSidebarOpen(true)}
          searchQuery={globalSearch}
          onSearchChange={(q) => {
            setGlobalSearch(q);
            if (q.length > 0 && currentTab === 'overview') {
              setCurrentTab('licenses');
            }
          }}
        />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 animate-fade-in">
          {renderPage()}
        </main>
      </div>
    </div>
  );
};

