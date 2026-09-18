import React, { useState } from 'react';
import { 
  Menu, 
  Search, 
  Sun, 
  Moon, 
  Laptop, 
  Bell, 
  LogOut, 
  User, 
  ChevronDown 
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

interface TopbarProps {
  onToggleSidebar: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
}

export const Topbar: React.FC<TopbarProps> = ({
  onToggleSidebar,
  searchQuery,
  onSearchChange,
}) => {
  const { theme, setTheme } = useTheme();
  const { admin, logout } = useAuth();
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifs, setShowNotifs] = useState(false);

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/80 dark:bg-[#0a0d14]/80 backdrop-blur-xl border-b border-gray-200 dark:border-cyan-500/15 flex items-center justify-between px-4 sm:px-6">
      {/* Left: Mobile menu toggle + Search */}
      <div className="flex items-center gap-3 sm:gap-4 flex-1 max-w-lg">
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-2 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="relative w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search licenses, HWID, products, audit logs..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm rounded-xl bg-gray-100 dark:bg-[#111726] text-gray-900 dark:text-gray-100 placeholder-gray-400 border border-transparent focus:border-cyan-500/50 focus:bg-white dark:focus:bg-[#161f36] focus:outline-none transition-all"
          />
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Theme Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowThemeMenu(!showThemeMenu)}
            className="p-2 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            title="Switch Theme"
          >
            {theme === 'dark' && <Moon className="w-5 h-5 text-cyan-400" />}
            {theme === 'light' && <Sun className="w-5 h-5 text-amber-500" />}
            {theme === 'system' && <Laptop className="w-5 h-5 text-gray-400" />}
          </button>

          {showThemeMenu && (
            <div
              className="absolute right-0 mt-2 w-36 py-1 bg-white dark:bg-[#111726] border border-gray-200 dark:border-cyan-500/20 rounded-xl shadow-xl z-50 text-sm animate-fade-in"
              onClick={() => setShowThemeMenu(false)}
            >
              <button
                onClick={() => setTheme('light')}
                className={`w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-800 ${
                  theme === 'light' ? 'text-cyan-500 font-semibold' : 'text-gray-700 dark:text-gray-300'
                }`}
              >
                <Sun className="w-4 h-4" /> Light
              </button>
              <button
                onClick={() => setTheme('dark')}
                className={`w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-800 ${
                  theme === 'dark' ? 'text-cyan-500 font-semibold' : 'text-gray-700 dark:text-gray-300'
                }`}
              >
                <Moon className="w-4 h-4" /> Dark
              </button>
              <button
                onClick={() => setTheme('system')}
                className={`w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-800 ${
                  theme === 'system' ? 'text-cyan-500 font-semibold' : 'text-gray-700 dark:text-gray-300'
                }`}
              >
                <Laptop className="w-4 h-4" /> System
              </button>
            </div>
          )}
        </div>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setShowNotifs(!showNotifs)}
            className="p-2 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors relative"
            title="Notifications"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-cyan-400 rounded-full ring-2 ring-white dark:ring-[#0a0d14]" />
          </button>

          {showNotifs && (
            <div className="absolute right-0 mt-2 w-72 p-3 bg-white dark:bg-[#111726] border border-gray-200 dark:border-cyan-500/20 rounded-xl shadow-xl z-50 animate-fade-in">
              <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                System Status
              </div>
              <div className="text-sm text-gray-700 dark:text-gray-300 space-y-2">
                <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs">
                  ✓ License verification service operational
                </div>
                <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs">
                  ⚡ Luau endpoint ready for Roblox clients
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="h-6 w-px bg-gray-200 dark:bg-gray-800" />

        {/* Admin Profile */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800/60 transition-colors"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xs shadow-md shadow-cyan-500/20">
              {admin?.username ? admin.username.substring(0, 2).toUpperCase() : 'AD'}
            </div>
            <div className="hidden sm:block text-left">
              <div className="text-xs font-semibold text-gray-900 dark:text-gray-200">
                {admin?.username || 'Admin'}
              </div>
              <div className="text-[10px] font-mono text-cyan-500">
                {admin?.role || 'SUPERADMIN'}
              </div>
            </div>
            <ChevronDown className="w-4 h-4 text-gray-400 hidden sm:block" />
          </button>

          {showUserMenu && (
            <div
              className="absolute right-0 mt-2 w-48 py-1 bg-white dark:bg-[#111726] border border-gray-200 dark:border-cyan-500/20 rounded-xl shadow-xl z-50 text-sm animate-fade-in"
              onClick={() => setShowUserMenu(false)}
            >
              <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-800">
                <div className="text-xs text-gray-400">Signed in as</div>
                <div className="text-xs font-semibold text-gray-800 dark:text-gray-200 truncate">
                  {admin?.email}
                </div>
              </div>
              <button
                onClick={logout}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-left text-rose-500 hover:bg-rose-500/10 transition-colors"
              >
                <LogOut className="w-4 h-4" /> Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
