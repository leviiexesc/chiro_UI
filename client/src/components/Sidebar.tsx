import React from 'react';
import { 
  LayoutDashboard, 
  Key, 
  Package, 
  Cpu, 
  FileText, 
  Settings, 
  ShieldCheck, 
  ShieldBan,
  X 
} from 'lucide-react';

interface SidebarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  isOpen,
  onClose,
}) => {
  const navItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'licenses', label: 'Licenses', icon: Key },
    { id: 'products', label: 'Products', icon: Package },
    { id: 'devices', label: 'Devices', icon: Cpu },
    { id: 'blacklist', label: 'Blacklist', icon: ShieldBan },
    { id: 'audit-logs', label: 'Audit Logs', icon: FileText },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Panel */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-white/95 dark:bg-[#0d121f]/95 backdrop-blur-xl border-r border-gray-200 dark:border-cyan-500/15 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200/80 dark:border-gray-800/80">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-500 flex items-center justify-center shadow-lg shadow-cyan-500/20 text-white">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <span className="font-extrabold text-base tracking-wider bg-gradient-to-r from-cyan-400 via-sky-300 to-blue-500 bg-clip-text text-transparent">
                CHIRO UI
              </span>
              <span className="block text-[10px] tracking-widest uppercase font-mono text-gray-500 dark:text-cyan-500/80">
                License Center
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg text-gray-400 hover:text-gray-200 hover:bg-gray-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onSelectTab(item.id);
                  onClose();
                }}
                className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group relative ${
                  isActive
                    ? 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 font-semibold shadow-inner'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800/60'
                }`}
              >
                {isActive && (
                  <span className="absolute left-0 top-2 bottom-2 w-1 bg-cyan-500 rounded-r-full shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
                )}
                <Icon
                  className={`w-5 h-5 transition-colors ${
                    isActive
                      ? 'text-cyan-600 dark:text-cyan-400'
                      : 'text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300'
                  }`}
                />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Footer info */}
        <div className="p-4 border-t border-gray-200/80 dark:border-gray-800/80">
          <div className="rounded-xl bg-gray-50 dark:bg-[#111726]/60 p-3 border border-gray-200/60 dark:border-cyan-500/10">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-xs font-mono font-medium text-emerald-600 dark:text-emerald-400">
                Core v2.4 Online
              </span>
            </div>
            <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1 font-mono">
              Roblox Luau / REST API
            </p>
          </div>
        </div>
      </aside>
    </>
  );
};
