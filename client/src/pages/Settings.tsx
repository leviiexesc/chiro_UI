import React, { useState } from 'react';
import {
  Settings as SettingsIcon,
  Lock,
  KeyRound,
  Moon,
  Sun,
  Laptop,
  Save,
  Loader2,
  AlertCircle,
  CheckCircle,
  Copy,
  Check,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { api, getErrorMessage } from '../services/api';
import { useToast } from '../components/Toast';

export const Settings: React.FC = () => {
  const { admin } = useAuth();
  const { theme, setTheme } = useTheme();
  const toast = useToast();

  const [pwForm, setPwForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [pwSubmitting, setPwSubmitting] = useState(false);
  const [pwError, setPwError] = useState<string | null>(null);
  const [pwSuccess, setPwSuccess] = useState(false);

  const [copiedEndpoint, setCopiedEndpoint] = useState<string | null>(null);

  const apiBase = window.location.origin + '/api/v1/client';

  const endpoints = [
    { label: 'Verify License', method: 'POST', path: `${apiBase}/verify`, desc: 'Check license validity and HWID' },
    { label: 'Activate License', method: 'POST', path: `${apiBase}/activate`, desc: 'Bind HWID to license slot' },
    { label: 'Reset HWID', method: 'POST', path: `${apiBase}/reset-hwid`, desc: 'Admin-initiated HWID reset (requires admin token)' },
  ];

  const luauSnippet = `-- Chiro UI License Verification (Luau / Roblox)
local HttpService = game:GetService("HttpService")

local API_BASE = "${window.location.origin}/api/v1/client"
local LICENSE_KEY = "CHIRO-XXXX-XXXX-XXXX" -- Replace with your key
local HWID = game:GetService("RbxAnalyticsService"):GetClientId()

local function verifyLicense()
  local success, response = pcall(function()
    return HttpService:RequestAsync({
      Url = API_BASE .. "/verify",
      Method = "POST",
      Headers = { ["Content-Type"] = "application/json" },
      Body = HttpService:JSONEncode({
        key = LICENSE_KEY,
        hwid = HWID,
        productSlug = "chiro-ui-pro-cyber",
      }),
    })
  end)

  if not success then
    return false, "Network error"
  end

  local data = HttpService:JSONDecode(response.Body)
  if data.success then
    return true, data.data
  else
    return false, data.error and data.error.message or "Unknown error"
  end
end

local ok, result = verifyLicense()
if ok then
  print("[Chiro UI] License valid. Welcome back!")
  -- Load your UI here
else
  warn("[Chiro UI] License invalid: " .. tostring(result))
end`;

  const handleCopyEndpoint = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedEndpoint(text);
    setTimeout(() => setCopiedEndpoint(null), 2000);
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwError(null);
    setPwSuccess(false);

    if (pwForm.newPassword !== pwForm.confirmPassword) {
      setPwError('New passwords do not match.');
      return;
    }
    if (pwForm.newPassword.length < 8) {
      setPwError('New password must be at least 8 characters.');
      return;
    }

    setPwSubmitting(true);
    try {
      await api.changePassword({
        currentPassword: pwForm.currentPassword,
        newPassword: pwForm.newPassword,
      });
      setPwSuccess(true);
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      toast.success('Password Changed', 'Your admin password has been updated successfully.');
    } catch (err) {
      setPwError(getErrorMessage(err));
    } finally {
      setPwSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Settings</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Account security, theme preferences, and API integration reference
        </p>
      </div>

      {/* Account Section */}
      <div className="glass-panel rounded-2xl p-6 border border-gray-200 dark:border-cyan-500/15 space-y-5">
        <div className="flex items-center gap-3 pb-4 border-b border-gray-100 dark:border-gray-800">
          <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400">
            <SettingsIcon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-bold text-gray-900 dark:text-white">Administrator Account</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">Your current session information</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Username</p>
            <p className="mt-1 font-mono font-bold text-gray-900 dark:text-cyan-400">{admin?.username}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Email</p>
            <p className="mt-1 font-mono text-gray-900 dark:text-gray-300">{admin?.email}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Role</p>
            <p className="mt-1 font-mono font-bold text-purple-500">{admin?.role}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Last Login</p>
            <p className="mt-1 font-mono text-gray-600 dark:text-gray-400">
              {admin?.lastLoginAt ? new Date(admin.lastLoginAt).toLocaleString() : 'Current session'}
            </p>
          </div>
        </div>
      </div>

      {/* Change Password */}
      <div className="glass-panel rounded-2xl p-6 border border-gray-200 dark:border-cyan-500/15">
        <div className="flex items-center gap-3 pb-4 border-b border-gray-100 dark:border-gray-800 mb-5">
          <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-bold text-gray-900 dark:text-white">Change Master Password</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">Update your admin authentication credential</p>
          </div>
        </div>

        {pwSuccess && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-3 text-emerald-400 text-sm">
            <CheckCircle className="w-5 h-5 shrink-0" />
            Password updated successfully!
          </div>
        )}

        {pwError && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-3 text-rose-400 text-sm">
            <AlertCircle className="w-5 h-5 shrink-0" />
            {pwError}
          </div>
        )}

        <form onSubmit={handlePasswordChange} className="space-y-4">
          {(['currentPassword', 'newPassword', 'confirmPassword'] as const).map((field) => (
            <div key={field}>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300 mb-1.5">
                {field === 'currentPassword' ? 'Current Password' : field === 'newPassword' ? 'New Password' : 'Confirm New Password'}
              </label>
              <input
                type="password"
                required
                placeholder="••••••••••••"
                value={pwForm[field]}
                onChange={(e) => setPwForm({ ...pwForm, [field]: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl bg-gray-100 dark:bg-[#161f36] border border-transparent focus:border-cyan-500/50 focus:outline-none text-sm"
              />
            </div>
          ))}

          <button
            type="submit"
            disabled={pwSubmitting}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-sm font-semibold shadow-md shadow-cyan-500/20 disabled:opacity-50"
          >
            {pwSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Update Password
          </button>
        </form>
      </div>

      {/* Theme Settings */}
      <div className="glass-panel rounded-2xl p-6 border border-gray-200 dark:border-cyan-500/15">
        <div className="flex items-center gap-3 pb-4 border-b border-gray-100 dark:border-gray-800 mb-5">
          <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
            <Moon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-bold text-gray-900 dark:text-white">Interface Theme</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">Choose your preferred visual mode</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {(['dark', 'light', 'system'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTheme(t)}
              className={`p-4 rounded-xl border-2 text-center transition-all ${
                theme === t
                  ? 'border-cyan-500 bg-cyan-500/10'
                  : 'border-gray-200 dark:border-gray-800 hover:border-cyan-500/40'
              }`}
            >
              <div className="flex justify-center mb-2">
                {t === 'dark' && <Moon className={`w-6 h-6 ${theme === 'dark' ? 'text-cyan-400' : 'text-gray-400'}`} />}
                {t === 'light' && <Sun className={`w-6 h-6 ${theme === 'light' ? 'text-amber-400' : 'text-gray-400'}`} />}
                {t === 'system' && <Laptop className={`w-6 h-6 ${theme === 'system' ? 'text-purple-400' : 'text-gray-400'}`} />}
              </div>
              <p className="text-sm font-semibold capitalize text-gray-700 dark:text-gray-300">{t}</p>
            </button>
          ))}
        </div>
      </div>

      {/* API Reference */}
      <div className="glass-panel rounded-2xl p-6 border border-gray-200 dark:border-cyan-500/15">
        <div className="flex items-center gap-3 pb-4 border-b border-gray-100 dark:border-gray-800 mb-5">
          <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
            <KeyRound className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-bold text-gray-900 dark:text-white">Luau / Roblox API Reference</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">Endpoints for Chiro UI Luau client integration</p>
          </div>
        </div>

        <div className="space-y-3 mb-6">
          {endpoints.map((ep) => (
            <div key={ep.path} className="p-3 rounded-xl bg-gray-50 dark:bg-[#111726] border border-gray-200 dark:border-gray-800">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="px-2 py-0.5 rounded text-[11px] font-bold font-mono bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shrink-0">
                    {ep.method}
                  </span>
                  <span className="font-mono text-xs text-gray-700 dark:text-gray-300 truncate">{ep.path}</span>
                </div>
                <button
                  onClick={() => handleCopyEndpoint(ep.path)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-cyan-400 hover:bg-cyan-500/10 transition-colors shrink-0"
                >
                  {copiedEndpoint === ep.path ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">{ep.desc}</p>
            </div>
          ))}
        </div>

        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400 mb-2">
            Luau Integration Snippet
          </div>
          <div className="relative">
            <pre className="p-4 rounded-xl bg-gray-900 text-xs font-mono text-cyan-300 overflow-x-auto border border-gray-800 leading-relaxed">
              {luauSnippet}
            </pre>
            <button
              onClick={() => handleCopyEndpoint(luauSnippet)}
              className="absolute top-3 right-3 p-1.5 rounded-lg text-gray-400 hover:text-cyan-400 hover:bg-cyan-500/10 transition-colors bg-gray-800/80"
            >
              {copiedEndpoint === luauSnippet ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
