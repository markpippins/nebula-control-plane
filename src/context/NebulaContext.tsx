import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { CountsSummary, WebSocketEvent } from '../types/nebula';
import { apiRequest, getApiConfig, setApiConfig, ApiConfig } from '../services/apiClient';
import { useNebulaWebSocket } from '../hooks/useNebulaWebSocket';

export type NavTab =
  | 'dashboard'
  | 'cpf'
  | 'systems'
  | 'kanban'
  | 'harvests'
  | 'questions'
  | 'execution'
  | 'audit'
  | 'knowledge'
  | 'opregistry'
  | 'plansdocs'
  | 'settings';

export type ThemeMode = 'light' | 'dark' | 'steel';

interface NebulaContextType {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
  searchOpen: boolean;
  setSearchOpen: (open: boolean) => void;
  apiConfig: ApiConfig;
  updateApiConfig: (config: Partial<ApiConfig>) => void;
  counts: CountsSummary | null;
  refreshCounts: () => void;
  wsConnected: boolean;
  activeWsClients: number;
  activityLogs: { id: string; type: string; message: string; timestamp: string }[];
  addActivityLog: (type: string, message: string) => void;
  triggerRefresh: number; // Increment to signal child components to re-fetch
}

const NebulaContext = createContext<NebulaContextType | undefined>(undefined);

export const NebulaProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem('nebula_theme') as ThemeMode | null;
    return saved && ['light', 'dark', 'steel'].includes(saved) ? saved : 'dark';
  });
  const [searchOpen, setSearchOpen] = useState<boolean>(false);
  const [apiConfig, setApiConfigState] = useState<ApiConfig>(getApiConfig());
  const [counts, setCounts] = useState<CountsSummary | null>(null);
  const [activityLogs, setActivityLogs] = useState<
    { id: string; type: string; message: string; timestamp: string }[]
  >([
    {
      id: 'init-1',
      type: 'SYSTEM',
      message: 'Nebula IDE Process Control Engine initialized',
      timestamp: new Date().toLocaleTimeString(),
    },
  ]);
  const [triggerRefresh, setTriggerRefresh] = useState<number>(0);

  // Apply theme classes to html root
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('light', 'dark', 'steel');
    if (theme === 'light') {
      root.classList.add('light');
    } else if (theme === 'dark') {
      root.classList.add('dark');
    } else if (theme === 'steel') {
      root.classList.add('dark', 'steel');
    }
    localStorage.setItem('nebula_theme', theme);
  }, [theme]);

  const setTheme = (newTheme: ThemeMode) => {
    setThemeState(newTheme);
  };

  const toggleTheme = () => {
    setThemeState((prev) => {
      if (prev === 'light') return 'dark';
      if (prev === 'dark') return 'steel';
      return 'light';
    });
  };

  const updateApiConfig = (newCfg: Partial<ApiConfig>) => {
    setApiConfig(newCfg);
    setApiConfigState(getApiConfig());
    refreshCounts();
    if (reconnectWs) {
      reconnectWs();
    }
  };

  const refreshCounts = useCallback(async () => {
    try {
      const data = await apiRequest<CountsSummary>('/counts');
      setCounts(data);
    } catch (e) {
      console.warn('[NebulaContext] Failed to load counts', e);
    }
  }, []);

  const addActivityLog = useCallback((type: string, message: string) => {
    setActivityLogs((prev) => [
      {
        id: `act-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        type,
        message,
        timestamp: new Date().toLocaleTimeString(),
      },
      ...prev.slice(0, 49),
    ]);
  }, []);

  // Handle WebSocket Event Broadcasts
  const handleWsEvent = useCallback(
    (event: WebSocketEvent) => {
      if (event.type === 'CONNECTED' || event.type === 'PING' || event.type === 'PONG') return;

      addActivityLog(event.type, `Real-time sync event received: ${event.type}`);
      setTriggerRefresh((prev) => prev + 1);
      refreshCounts();
    },
    [addActivityLog, refreshCounts]
  );

  const { status: wsStatus, reconnect: reconnectWs } = useNebulaWebSocket(handleWsEvent);

  useEffect(() => {
    refreshCounts();
  }, [refreshCounts]);

  return (
    <NebulaContext.Provider
      value={{
        activeTab,
        setActiveTab,
        theme,
        setTheme,
        toggleTheme,
        searchOpen,
        setSearchOpen,
        apiConfig,
        updateApiConfig,
        counts,
        refreshCounts,
        wsConnected: wsStatus.connected,
        activeWsClients: wsStatus.activeClients,
        activityLogs,
        addActivityLog,
        triggerRefresh,
      }}
    >
      {children}
    </NebulaContext.Provider>
  );
};

export const useNebula = () => {
  const context = useContext(NebulaContext);
  if (!context) throw new Error('useNebula must be used within NebulaProvider');
  return context;
};
