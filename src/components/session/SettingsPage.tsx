import React, { useState, useRef } from 'react';
import { useTradeStore } from '../../stores/tradeStore';
import { Card, Button } from '../common';
import { isSupabaseConfigured } from '../../lib/supabase';
import { Download, Upload, Cloud, CloudOff, Trash2 } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { 
    exportData, 
    importData, 
    syncWithSupabase, 
    loadFromSupabase,
    trades,
    sessions,
    isLoading,
    error,
    clearError,
  } = useTradeStore();

  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    const data = exportData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `orderflow-journal-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportError(null);
    setImportSuccess(false);

    try {
      const text = await file.text();
      await importData(text);
      setImportSuccess(true);
      setTimeout(() => setImportSuccess(false), 3000);
    } catch (err) {
      setImportError('Failed to import data. Please check the file format.');
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClearData = () => {
    if (confirm('Are you sure you want to clear all data? This cannot be undone.')) {
      if (confirm('This will delete ALL trades and sessions. Are you absolutely sure?')) {
        localStorage.removeItem('orderflow-journal-storage');
        window.location.reload();
      }
    }
  };

  const supabaseConfigured = isSupabaseConfigured();

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold">Settings</h1>

      {/* Data Stats */}
      <Card title="Your Data">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-[#262626] rounded-lg p-4 text-center">
            <div className="text-3xl font-bold text-blue-400">{trades.length}</div>
            <div className="text-sm text-gray-400">Total Trades</div>
          </div>
          <div className="bg-[#262626] rounded-lg p-4 text-center">
            <div className="text-3xl font-bold text-purple-400">{sessions.length}</div>
            <div className="text-sm text-gray-400">Trading Sessions</div>
          </div>
        </div>
        <p className="text-sm text-gray-500">
          Data is stored locally in your browser. Export regularly to backup.
        </p>
      </Card>

      {/* Export/Import */}
      <Card title="Export & Import">
        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-400 mb-3">
              Export your data as a JSON file for backup or transfer to another device.
            </p>
            <Button onClick={handleExport} className="flex items-center gap-2">
              <Download size={18} />
              Export Data
            </Button>
          </div>

          <div className="border-t border-[#404040] pt-4">
            <p className="text-sm text-gray-400 mb-3">
              Import data from a previously exported JSON file. This will merge with existing data.
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleImport}
              className="hidden"
              id="import-file"
            />
            <Button
              variant="secondary"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2"
            >
              <Upload size={18} />
              Import Data
            </Button>
            {importError && (
              <p className="text-red-400 text-sm mt-2">{importError}</p>
            )}
            {importSuccess && (
              <p className="text-green-400 text-sm mt-2">Data imported successfully!</p>
            )}
          </div>
        </div>
      </Card>

      {/* Cloud Sync */}
      <Card title="Cloud Sync (Supabase)">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            {supabaseConfigured ? (
              <>
                <Cloud className="text-green-400" size={24} />
                <div>
                  <div className="font-medium text-green-400">Connected</div>
                  <div className="text-sm text-gray-400">Supabase is configured</div>
                </div>
              </>
            ) : (
              <>
                <CloudOff className="text-gray-500" size={24} />
                <div>
                  <div className="font-medium text-gray-400">Not Connected</div>
                  <div className="text-sm text-gray-500">Set up Supabase for cloud sync</div>
                </div>
              </>
            )}
          </div>

          {supabaseConfigured && (
            <div className="flex gap-3">
              <Button
                variant="secondary"
                onClick={syncWithSupabase}
                disabled={isLoading}
                className="flex items-center gap-2"
              >
                <Upload size={18} />
                Push to Cloud
              </Button>
              <Button
                variant="secondary"
                onClick={loadFromSupabase}
                disabled={isLoading}
                className="flex items-center gap-2"
              >
                <Download size={18} />
                Pull from Cloud
              </Button>
            </div>
          )}

          {!supabaseConfigured && (
            <div className="bg-[#262626] rounded-lg p-4 text-sm">
              <p className="text-gray-400 mb-2">To enable cloud sync:</p>
              <ol className="list-decimal list-inside text-gray-500 space-y-1">
                <li>Create a free Supabase project at supabase.com</li>
                <li>Run the SQL schema (see docs)</li>
                <li>Add environment variables:
                  <code className="block mt-1 text-xs bg-[#1a1a1a] p-2 rounded">
                    VITE_SUPABASE_URL=your_url<br/>
                    VITE_SUPABASE_ANON_KEY=your_key
                  </code>
                </li>
              </ol>
            </div>
          )}

          {error && (
            <div className="bg-red-900/30 text-red-400 p-3 rounded-lg flex items-center justify-between">
              <span>{error}</span>
              <button onClick={clearError} className="text-red-400 hover:text-red-300">
                ✕
              </button>
            </div>
          )}
        </div>
      </Card>

      {/* Danger Zone */}
      <Card title="Danger Zone" className="border-red-900/50">
        <div className="space-y-4">
          <p className="text-sm text-gray-400">
            Permanently delete all your trading data. This action cannot be undone.
          </p>
          <Button
            variant="danger"
            onClick={handleClearData}
            className="flex items-center gap-2"
          >
            <Trash2 size={18} />
            Clear All Data
          </Button>
        </div>
      </Card>

      {/* Keyboard Shortcuts Reference */}
      <Card title="Keyboard Shortcuts">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-400">New Trade</span>
            <kbd className="px-2 py-1 bg-[#262626] rounded text-xs">N</kbd>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Dashboard</span>
            <kbd className="px-2 py-1 bg-[#262626] rounded text-xs">D</kbd>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Analytics</span>
            <kbd className="px-2 py-1 bg-[#262626] rounded text-xs">A</kbd>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">History</span>
            <kbd className="px-2 py-1 bg-[#262626] rounded text-xs">H</kbd>
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-4">
          Note: Keyboard shortcuts work when no input is focused.
        </p>
      </Card>
    </div>
  );
};
