import React, { useState, useEffect } from 'react';
import { 
  Server, 
  Wifi, 
  WifiOff, 
  Laptop, 
  Database, 
  ShieldCheck, 
  RefreshCw, 
  Copy, 
  Check, 
  HardDrive, 
  Activity, 
  Clock, 
  Zap, 
  ArrowRight,
  TrendingUp,
  ReceiptText,
  Layers
} from 'lucide-react';
import { getServerIp, setServerIp, getApiBase, flushOfflineQueue } from '../db/db';

export default function ServerMonitorPanel({ 
  isServerConnected, 
  bills = [], 
  dishes = [], 
  offlineQueueCount = 0,
  activeCounter = 'Counter 1'
}) {
  const [serverStats, setServerStats] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedIp, setCopiedIp] = useState('');
  const [inputIp, setInputIp] = useState(getServerIp());
  const [ipSaveSuccess, setIpSaveSuccess] = useState(false);
  const [snapshotMsg, setSnapshotMsg] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);

  const fetchServerStats = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${getApiBase()}/server/status`);
      const data = await res.json();
      if (data.success) {
        setServerStats(data);
      }
    } catch (err) {
      console.warn('Failed to fetch server stats:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchServerStats();
    const interval = setInterval(fetchServerStats, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleCopy = (ip) => {
    navigator.clipboard.writeText(ip);
    setCopiedIp(ip);
    setTimeout(() => setCopiedIp(''), 2500);
  };

  const handleSaveServerIp = (e) => {
    e.preventDefault();
    if (!inputIp) return;
    setServerIp(inputIp.trim());
    setIpSaveSuccess(true);
    setTimeout(() => setIpSaveSuccess(false), 3000);
    fetchServerStats();
  };

  const handleTriggerSnapshot = async () => {
    try {
      const res = await fetch(`${getApiBase()}/database/snapshot`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setSnapshotMsg('✅ Immediate disk snapshot backup created successfully!');
      } else {
        setSnapshotMsg('⚠️ Snapshot error: ' + (data.error || 'Failed'));
      }
      setTimeout(() => setSnapshotMsg(''), 4000);
    } catch (err) {
      setSnapshotMsg('❌ Server offline - cannot create remote snapshot');
      setTimeout(() => setSnapshotMsg(''), 4000);
    }
  };

  const handleManualSync = async () => {
    setIsSyncing(true);
    await flushOfflineQueue();
    await fetchServerStats();
    setIsSyncing(false);
  };

  const todayStr = new Date().toISOString().split('T')[0];
  const todayBills = bills.filter((b) => b && b.createdAt && b.createdAt.startsWith(todayStr));
  const todayTotalRevenue = todayBills.reduce((sum, b) => sum + (parseFloat(b.finalTotal || b.grandTotal || 0) || 0), 0);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-6 space-y-6">
      {/* Top Banner Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="p-3.5 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-lg shadow-indigo-500/20 text-white">
            <Server className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-white">LAN Master Server & Terminal Hub</h1>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold flex items-center gap-1 ${
                isServerConnected 
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                  : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
              }`}>
                <span className={`w-2 h-2 rounded-full ${isServerConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
                {isServerConnected ? 'MASTER ENGINE ONLINE' : 'LOCAL OFFLINE MODE'}
              </span>
            </div>
            <p className="text-sm text-slate-400 mt-0.5">
              Centralized real-time sync controller for Karuna Hotel POS across all counter laptops
            </p>
            {serverStats?.serverIps && serverStats.serverIps.length > 0 && (
              <div className="mt-2.5 flex items-center gap-2 bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 px-3 py-1.5 rounded-xl text-xs font-mono font-bold w-fit">
                <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                <span>Type on Counter Laptops:</span>
                <span className="text-white text-sm bg-emerald-900/90 px-2 py-0.5 rounded border border-emerald-400 select-all">{serverStats.serverIps[0]}</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {offlineQueueCount > 0 && (
            <button
              onClick={handleManualSync}
              disabled={isSyncing}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-medium rounded-xl text-sm shadow-lg transition-all animate-pulse"
            >
              <Zap className="w-4 h-4" />
              {isSyncing ? 'Syncing Bills...' : `Force Sync (${offlineQueueCount} Offline Bills)`}
            </button>
          )}

          <button
            onClick={fetchServerStats}
            disabled={isLoading}
            className="flex items-center gap-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium rounded-xl text-sm border border-slate-700 transition"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-indigo-400' : ''}`} />
            Refresh Hub
          </button>
        </div>
      </div>

      {/* Snapshot Alert Banner if any */}
      {snapshotMsg && (
        <div className="p-4 rounded-xl bg-indigo-950/60 border border-indigo-500/40 text-indigo-200 text-sm flex items-center gap-2 animate-fade-in">
          <HardDrive className="w-4 h-4 text-indigo-400" />
          {snapshotMsg}
        </div>
      )}

      {/* Grid: Server Stats & Health Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-5 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Master Server Status</span>
            <div className={`p-2 rounded-xl ${isServerConnected ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
              {isServerConnected ? <Wifi className="w-5 h-5" /> : <WifiOff className="w-5 h-5" />}
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-bold text-white">{isServerConnected ? 'Active (Port 3001)' : 'Unreachable'}</p>
            <p className="text-xs text-slate-400 mt-1">
              {isServerConnected ? 'WebSocket LAN sync ready' : 'Counters running on local Dexie DB'}
            </p>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Connected Terminals</span>
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
              <Laptop className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-bold text-white">{serverStats?.clientCount ?? (isServerConnected ? 1 : 0)} Online</p>
            <p className="text-xs text-slate-400 mt-1">
              Active counter laptops on local network
            </p>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Today's Total Bills</span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
              <ReceiptText className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-bold text-white">{todayBills.length} Invoices</p>
            <p className="text-xs text-slate-400 mt-1">
              ₹{todayTotalRevenue.toLocaleString('en-IN')} revenue settled today
            </p>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Local Offline Buffer</span>
            <div className={`p-2 rounded-xl ${offlineQueueCount > 0 ? 'bg-amber-500/10 text-amber-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
              <Database className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-bold text-white">{offlineQueueCount} Queued Bills</p>
            <p className="text-xs text-slate-400 mt-1">
              {offlineQueueCount > 0 ? 'Pending sync to master database' : 'All local bills fully synced'}
            </p>
          </div>
        </div>
      </div>

      {/* Main 2-Column Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Connected Terminals & LAN Connection IPs */}
        <div className="lg:col-span-2 space-y-6">
          {/* Active Terminals Roster */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-xl">
                  <Laptop className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Multi-Counter Terminal Roster</h2>
                  <p className="text-xs text-slate-400">Real-time status of all counter POS laptops on LAN</p>
                </div>
              </div>
              <span className="text-xs bg-slate-800 text-slate-300 px-3 py-1 rounded-full border border-slate-700">
                Auto-Refresh (5s)
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              {/* Counter 1 Card */}
              {(() => {
                const c1 = serverStats?.terminals?.find((t) => t.name?.toLowerCase().includes('counter 1') || t.counterId === 'C1');
                const isOnline = !!c1;
                return (
                  <div className={`border rounded-xl p-4 relative overflow-hidden transition-all ${
                    isOnline ? 'bg-indigo-950/30 border-indigo-500/40 shadow-sm' : 'bg-slate-950/70 border-slate-800'
                  }`}>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-indigo-400 uppercase">Counter 1</span>
                      <span className={`w-2.5 h-2.5 rounded-full ${isOnline ? 'bg-emerald-400 animate-ping' : 'bg-slate-600'}`} />
                    </div>
                    <h3 className="font-semibold text-white mt-1">Breakfast & Snacks</h3>
                    <p className="text-xs text-slate-400 mt-0.5">Prefix: <span className="font-mono text-indigo-300">INV-C1-...</span></p>
                    <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                      <span>{isOnline ? `IP: ${c1.ip}` : 'Type: Touch / POS'}</span>
                      <span className={isOnline ? 'text-emerald-400 font-bold' : 'text-slate-500 font-medium'}>
                        {isOnline ? '🟢 Connected' : '⚪ Offline'}
                      </span>
                    </div>
                  </div>
                );
              })()}

              {/* Counter 2 Card */}
              {(() => {
                const c2 = serverStats?.terminals?.find((t) => t.name?.toLowerCase().includes('counter 2') || t.counterId === 'C2');
                const isOnline = !!c2;
                return (
                  <div className={`border rounded-xl p-4 relative overflow-hidden transition-all ${
                    isOnline ? 'bg-purple-950/30 border-purple-500/40 shadow-sm' : 'bg-slate-950/70 border-slate-800'
                  }`}>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-purple-400 uppercase">Counter 2</span>
                      <span className={`w-2.5 h-2.5 rounded-full ${isOnline ? 'bg-emerald-400 animate-ping' : 'bg-slate-600'}`} />
                    </div>
                    <h3 className="font-semibold text-white mt-1">Sweets & Mithai</h3>
                    <p className="text-xs text-slate-400 mt-0.5">Prefix: <span className="font-mono text-purple-300">INV-C2-...</span></p>
                    <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                      <span>{isOnline ? `IP: ${c2.ip}` : 'Type: Weight Scale'}</span>
                      <span className={isOnline ? 'text-emerald-400 font-bold' : 'text-slate-500 font-medium'}>
                        {isOnline ? '🟢 Connected' : '⚪ Offline'}
                      </span>
                    </div>
                  </div>
                );
              })()}

              {/* Counter 3 Card */}
              {(() => {
                const c3 = serverStats?.terminals?.find((t) => t.name?.toLowerCase().includes('counter 3') || t.counterId === 'C3');
                const isOnline = !!c3;
                return (
                  <div className={`border rounded-xl p-4 relative overflow-hidden transition-all ${
                    isOnline ? 'bg-amber-950/30 border-amber-500/40 shadow-sm' : 'bg-slate-950/70 border-slate-800'
                  }`}>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-amber-400 uppercase">Counter 3</span>
                      <span className={`w-2.5 h-2.5 rounded-full ${isOnline ? 'bg-emerald-400 animate-ping' : 'bg-slate-600'}`} />
                    </div>
                    <h3 className="font-semibold text-white mt-1">Parcels & Fast Food</h3>
                    <p className="text-xs text-slate-400 mt-0.5">Prefix: <span className="font-mono text-amber-300">INV-C3-...</span></p>
                    <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                      <span>{isOnline ? `IP: ${c3.ip}` : 'Type: Fast Token'}</span>
                      <span className={isOnline ? 'text-emerald-400 font-bold' : 'text-slate-500 font-medium'}>
                        {isOnline ? '🟢 Connected' : '⚪ Offline'}
                      </span>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Active Live Connected Sockets list from server */}
            {serverStats?.terminals && serverStats.terminals.length > 0 && (
              <div className="mt-4 pt-4 border-t border-slate-800">
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Live Connected Sockets</h4>
                <div className="space-y-2">
                  {serverStats.terminals.map((t, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/50 border border-slate-800 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-400" />
                        <span className="font-medium text-white">{t.name || 'POS Terminal'}</span>
                        <span className="text-slate-500 font-mono">({t.ip})</span>
                      </div>
                      <span className="text-slate-400 font-mono text-[11px]">
                        Last ping: {new Date(t.lastPing).toLocaleTimeString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Master Server LAN IP Addresses for CAT6 Cable Connection */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
              <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl">
                <Wifi className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">LAN Cable Master IP Addresses</h2>
                <p className="text-xs text-slate-400">Use these IP addresses to connect other laptops to this Master PC</p>
              </div>
            </div>

            <div className="space-y-3">
              {serverStats?.serverIps && serverStats.serverIps.length > 0 ? (
                serverStats.serverIps.map((ip, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
                    <div className="flex items-center gap-3">
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                      <div>
                        <span className="text-sm font-mono font-semibold text-emerald-400">{ip}</span>
                        <p className="text-xs text-slate-500">Ethernet / Wi-Fi Network Interface</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleCopy(ip)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-lg border border-slate-700 transition"
                    >
                      {copiedIp === ip ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-400">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy IP</span>
                        </>
                      )}
                    </button>
                  </div>
                ))
              ) : (
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-sm font-mono text-slate-400">
                  Server running on <span className="text-emerald-400">127.0.0.1 (localhost)</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Server Connection Configuration & Backups */}
        <div className="space-y-6">
          {/* Target Server IP Setting on this Laptop */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
              <div className="p-2 bg-purple-500/10 text-purple-400 rounded-xl">
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-white">Target Master Server IP</h3>
                <p className="text-xs text-slate-400">Configure where this terminal connects</p>
              </div>
            </div>

            <form onSubmit={handleSaveServerIp} className="space-y-3">
              <div>
                <label className="text-xs font-medium text-slate-400 mb-1 block">Master Server IP / Hostname</label>
                <input
                  type="text"
                  value={inputIp}
                  onChange={(e) => setInputIp(e.target.value)}
                  placeholder="e.g. 192.168.1.100 or localhost"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setInputIp('localhost')}
                  className="px-2.5 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg"
                >
                  Set Localhost
                </button>
                <button
                  type="button"
                  onClick={() => setInputIp('192.168.1.100')}
                  className="px-2.5 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg"
                >
                  Set 192.168.1.100
                </button>
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-xl text-sm transition shadow-md shadow-indigo-600/20"
              >
                Save & Connect
              </button>

              {ipSaveSuccess && (
                <p className="text-xs text-emerald-400 font-medium text-center">
                  ✅ Server IP updated! Reconnecting WebSocket...
                </p>
              )}
            </form>
          </div>

          {/* Database Backup & Health Controls */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
              <div className="p-2 bg-blue-500/10 text-blue-400 rounded-xl">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-white">Automated Master Backup</h3>
                <p className="text-xs text-slate-400">Hourly snapshot rotation on Server Disk</p>
              </div>
            </div>

            <div className="space-y-2 text-xs text-slate-400">
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span>Auto-Backup Schedule:</span>
                <span className="text-slate-200 font-medium">Hourly (30 snapshots)</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span>Backup Location:</span>
                <span className="text-indigo-400 font-mono">data/backups/</span>
              </div>
              <div className="flex justify-between py-1">
                <span>Menu Items Cached:</span>
                <span className="text-slate-200 font-medium">{dishes.length} Dishes</span>
              </div>
            </div>

            <button
              onClick={handleTriggerSnapshot}
              className="w-full flex items-center justify-center gap-2 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-xl border border-slate-700 transition"
            >
              <HardDrive className="w-4 h-4 text-indigo-400" />
              Create Manual Disk Snapshot Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
