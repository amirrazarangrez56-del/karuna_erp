import React, { useState } from 'react';
import { 
  ShoppingCart, 
  CheckCircle, 
  Package, 
  ShieldCheck, 
  Utensils, 
  Monitor, 
  ChevronDown, 
  ChevronUp,
  Check, 
  Wifi, 
  WifiOff, 
  Server,
  Zap,
  Lock,
  RefreshCw,
  Edit2,
  ZoomIn,
  ZoomOut
} from 'lucide-react';
import { getServerIp, setServerIp } from '../db/db';

export const AVAILABLE_COUNTERS = [
  { id: 'counter-1', name: 'Counter 1 (Breakfast & Snacks)', shortName: 'Counter 1', prefix: 'INV-C1', tagColor: 'bg-indigo-500' },
  { id: 'counter-2', name: 'Counter 2 (Sweets & Mithai)', shortName: 'Counter 2', prefix: 'INV-C2', tagColor: 'bg-purple-500' },
  { id: 'counter-3', name: 'Counter 3 (Parcels & Fast Food)', shortName: 'Counter 3', prefix: 'INV-C3', tagColor: 'bg-amber-500' },
  { id: 'master', name: 'Master Server / Owner PC', shortName: 'Master PC', prefix: 'INV-M', tagColor: 'bg-emerald-500' }
];

export default function Header({
  activeTab,
  setActiveTab,
  pendingCartCount,
  activeCounter = 'Counter 1 (Breakfast & Snacks)',
  onSelectCounter,
  isServerConnected = true,
  offlineQueueCount = 0,
  onForceSync,
  onRequestAdminTab,
  onToggleHeaderHidden,
  currentZoom = 100,
  canZoomIn = true,
  canZoomOut = false,
  onZoomIn,
  onZoomOut
}) {
  const [isCounterDropdownOpen, setIsCounterDropdownOpen] = useState(false);
  const [isLanModalOpen, setIsLanModalOpen] = useState(false);
  const [customServerIp, setCustomServerIp] = useState(getServerIp());
  const [ipSaveSuccess, setIpSaveSuccess] = useState(false);

  const tabs = [
    {
      id: 'pos',
      label: 'POS Billing',
      icon: ShoppingCart,
      activeColor: 'bg-indigo-600 text-white shadow-md shadow-indigo-200',
      inactiveColor: 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100',
      badge: pendingCartCount > 0 ? pendingCartCount : null
    },
    {
      id: 'settle',
      label: 'Settled Bills',
      icon: CheckCircle,
      activeColor: 'bg-emerald-600 text-white shadow-md shadow-emerald-200',
      inactiveColor: 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
    },
    {
      id: 'stock',
      label: 'Stock Master',
      icon: Package,
      activeColor: 'bg-amber-600 text-white shadow-md shadow-amber-200',
      inactiveColor: 'bg-amber-50 text-amber-700 hover:bg-amber-100'
    },
    {
      id: 'server',
      label: 'Server & LAN Hub',
      icon: Server,
      activeColor: 'bg-blue-600 text-white shadow-md shadow-blue-200',
      inactiveColor: 'bg-blue-50 text-blue-700 hover:bg-blue-100'
    },
    {
      id: 'admin',
      label: 'Owner Admin',
      icon: ShieldCheck,
      isProtected: true,
      activeColor: 'bg-purple-700 text-white shadow-md shadow-purple-200',
      inactiveColor: 'bg-purple-50 text-purple-700 hover:bg-purple-100'
    }
  ];

  const handleTabClick = (tab) => {
    if (tab.id === 'admin' && onRequestAdminTab) {
      onRequestAdminTab();
    } else {
      setActiveTab(tab.id);
    }
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm select-none">
      <div className="w-full px-4 py-2 flex items-center justify-between gap-3 pr-16 shrink-0">
        
        {/* Brand / Logo */}
        <div className="flex items-center space-x-3 shrink-0">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-slate-900 via-indigo-950 to-slate-800 flex items-center justify-center text-white shadow-md">
            <Utensils className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight text-slate-900 leading-tight">
              KARUNA HOTEL
            </h1>
            <p className="text-[10px] font-bold text-indigo-700 uppercase tracking-widest flex items-center gap-1">
              <span>Desktop POS Suite</span>
              <span className="text-slate-300">•</span>
              <span className="text-slate-500 font-mono text-[9px]">v1.0.0</span>
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center space-x-1.5 shrink-0">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab)}
                className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl font-bold text-xs transition-all duration-150 cursor-pointer ${
                  isActive ? tab.activeColor : tab.inactiveColor
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                {tab.isProtected && <Lock className="w-3 h-3 opacity-60 ml-0.5" />}
                {tab.badge && (
                  <span className="ml-1 px-1.5 py-0.5 text-[10px] font-black bg-rose-500 text-white rounded-full">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Right Section: Connection Status Badge & Counter Selector */}
        <div className="flex items-center space-x-2 shrink-0">

          {/* Zoom In / Zoom Out Controls */}
          {onZoomIn && onZoomOut && (
            <div className="flex items-center bg-slate-100 border border-slate-300 rounded-xl p-0.5 shadow-2xs space-x-0.5">
              <button
                type="button"
                onClick={onZoomOut}
                disabled={!canZoomOut}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  !canZoomOut
                    ? 'text-slate-300 cursor-not-allowed'
                    : 'text-slate-700 hover:bg-white hover:text-slate-900 active:bg-slate-200'
                }`}
                title="Zoom Out Tables (Smaller cards)"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>

              <span className="text-[11px] font-black text-slate-700 px-1 select-none min-w-[38px] text-center">
                {currentZoom}%
              </span>

              <button
                type="button"
                onClick={onZoomIn}
                disabled={!canZoomIn}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  !canZoomIn
                    ? 'text-slate-300 cursor-not-allowed'
                    : 'text-slate-700 hover:bg-white hover:text-slate-900 active:bg-slate-200'
                }`}
                title="Zoom In Tables (Larger cards)"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
          
          {/* Offline Queue Sync Button if any bills pending */}
          {offlineQueueCount > 0 && (
            <button
              onClick={onForceSync}
              className="flex items-center space-x-1.5 px-2.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition shadow-sm animate-pulse cursor-pointer"
              title="Click to sync offline bills to Master Server now"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Sync {offlineQueueCount} Offline</span>
            </button>
          )}

          {/* LAN Connection Status with Interactive IP Inspector */}
          <div className="relative">
            <button
              onClick={() => {
                setCustomServerIp(getServerIp());
                setIsLanModalOpen(!isLanModalOpen);
              }}
              className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl text-[11px] font-black border transition-all cursor-pointer shadow-xs ${
                isServerConnected
                  ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-300'
                  : 'bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-400 animate-pulse'
              }`}
              title="Click to view or change Master Server IP"
            >
              {isServerConnected ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-ping mr-0.5" />
                  <Wifi className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="hidden md:inline">LAN Sync:</span>
                  <span className="font-bold">Online</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-3.5 h-3.5 text-amber-600" />
                  <span>Local Offline Mode</span>
                </>
              )}
            </button>

            {isLanModalOpen && (
              <div className="absolute right-0 top-full mt-1.5 w-80 max-w-[calc(100vw-2rem)] bg-white border border-slate-200 rounded-2xl shadow-2xl p-3.5 z-50 animate-in fade-in zoom-in-95 duration-100">
                <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-slate-100">
                  <div className="flex items-center space-x-1.5">
                    <Server className="w-4 h-4 text-indigo-600" />
                    <span className="font-black text-xs text-slate-900">Master Server Connection</span>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    isServerConnected ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {isServerConnected ? '🟢 Connected' : '⚡ Local Offline'}
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div>
                    <label className="text-[10px] font-extrabold text-slate-500 uppercase block mb-1">
                      Master Server LAN IP:
                    </label>
                    <div className="flex items-center space-x-1.5">
                      <input
                        type="text"
                        value={customServerIp}
                        onChange={(e) => setCustomServerIp(e.target.value)}
                        placeholder="e.g. 10.120.45.133 or localhost"
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1.5 font-mono text-xs font-black text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                      <button
                        onClick={() => {
                          if (customServerIp && customServerIp.trim() !== '') {
                            setServerIp(customServerIp.trim());
                            setIpSaveSuccess(true);
                            setTimeout(() => {
                              setIpSaveSuccess(false);
                              setIsLanModalOpen(false);
                            }, 1200);
                          }
                        }}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-3 py-1.5 rounded-xl transition cursor-pointer shrink-0"
                      >
                        {ipSaveSuccess ? '✓ Set' : 'Connect'}
                      </button>
                    </div>

                    <div className="flex items-center space-x-1.5 pt-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setCustomServerIp('localhost');
                          setServerIp('localhost');
                          setIpSaveSuccess(true);
                          setTimeout(() => {
                            setIpSaveSuccess(false);
                            setIsLanModalOpen(false);
                          }, 1000);
                        }}
                        className="px-2 py-1 text-[10px] font-extrabold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg border border-slate-300 cursor-pointer"
                      >
                        ⚡ Owner PC (localhost)
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setCustomServerIp('10.120.45.133');
                          setServerIp('10.120.45.133');
                          setIpSaveSuccess(true);
                          setTimeout(() => {
                            setIpSaveSuccess(false);
                            setIsLanModalOpen(false);
                          }, 1000);
                        }}
                        className="px-2 py-1 text-[10px] font-extrabold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg border border-indigo-200 cursor-pointer"
                      >
                        📡 Counter PC (10.120.45.133)
                      </button>
                    </div>
                  </div>

                  <p className="text-[10px] text-slate-500 leading-tight pt-1">
                    Enter the IP of your Owner/Server computer so all counter billing updates instantly sync in real-time.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Counter Switcher Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsCounterDropdownOpen(!isCounterDropdownOpen)}
              className="bg-slate-900 hover:bg-slate-800 text-white px-3 py-1.5 rounded-xl text-xs font-black flex items-center space-x-2 cursor-pointer shadow-sm transition-all border border-slate-700"
              title="Switch Active Counter Terminal"
            >
              <Monitor className="w-3.5 h-3.5 text-indigo-400" />
              <span className="truncate max-w-[140px]">{activeCounter.split(' ')[0]} {activeCounter.split(' ')[1] || ''}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {isCounterDropdownOpen && (
              <div className="absolute right-0 top-full mt-1.5 w-72 bg-white border border-slate-200 rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider px-2.5 py-1 border-b border-slate-100">
                  Select Terminal Identity
                </div>
                <div className="space-y-1 mt-1.5">
                  {AVAILABLE_COUNTERS.map((cnt) => {
                    const isCur = activeCounter === cnt.name || activeCounter === cnt.shortName;
                    return (
                      <button
                        key={`cnt-btn-${cnt.id}`}
                        onClick={() => {
                          if (onSelectCounter) onSelectCounter(cnt.name);
                          setIsCounterDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-between ${
                          isCur
                            ? 'bg-indigo-600 text-white font-black shadow-sm'
                            : 'text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <div className="flex flex-col">
                          <span>{cnt.name}</span>
                          <span className={`text-[10px] font-mono ${isCur ? 'text-indigo-200' : 'text-slate-400'}`}>
                            Prefix: {cnt.prefix}-XXXX
                          </span>
                        </div>
                        {isCur && <Check className="w-4 h-4 text-white shrink-0 ml-1" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

        </div>

      </div>
    </header>
  );
}
