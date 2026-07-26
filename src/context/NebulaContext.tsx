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

interface NebulaContextType {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  theme: 'dark' | 'light';
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
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
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

  // Apply dark class to body/html
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const updateApiConfig = (newCfg: Partial<ApiConfig>) => {
    setApiConfig(newCfg);
    setApiConfigState(getApiConfig());
    refreshCounts();
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

  const { status: wsStatus } = useNebulaWebSocket(handleWsEvent);

  useEffect(() => {
    refreshCounts();
  }, [refreshCounts]);

  return (
    <NebulaContext.Provider
      value={{
        activeTab,
        setActiveTab,
        theme,
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
