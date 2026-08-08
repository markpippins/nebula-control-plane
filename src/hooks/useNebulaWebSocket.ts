import { useEffect, useState, useRef, useCallback } from 'react';
import { WebSocketEvent } from '../types/nebula';
import { getApiConfig } from '../services/apiClient';

export interface WebSocketStatus {
  connected: boolean;
  activeClients: number;
  lastEvent: WebSocketEvent | null;
  error: string | null;
  currentWsUrl: string;
}

export function useNebulaWebSocket(onEvent?: (event: WebSocketEvent) => void) {
  const [status, setStatus] = useState<WebSocketStatus>({
    connected: false,
    activeClients: 1,
    lastEvent: null,
    error: null,
    currentWsUrl: '',
  });

  const socketRef = useRef<WebSocket | null>(null);
  const callbackRef = useRef(onEvent);
  callbackRef.current = onEvent;

  const connect = useCallback(() => {
    try {
      if (socketRef.current) {
        socketRef.current.close();
      }

      const apiCfg = getApiConfig();
      let wsUrl = apiCfg.wsUrl;

      if (!wsUrl) {
        wsUrl = 'ws://localhost:3200/api/events/stream?sender=nebula-control-plane';
      }

      setStatus((prev) => ({ ...prev, currentWsUrl: wsUrl }));

      const ws = new WebSocket(wsUrl);
      socketRef.current = ws;

      ws.onopen = () => {
        setStatus((prev) => ({ ...prev, connected: true, error: null }));
      };

      ws.onmessage = (event) => {
        try {
          const parsed: WebSocketEvent = JSON.parse(event.data);
          if (parsed.type === 'CONNECTED' || parsed.type === 'CLIENT_JOINED' || parsed.type === 'CLIENT_LEFT') {
            const payload = parsed.payload as any;
            if (payload?.activeClients) {
              setStatus((prev) => ({ ...prev, activeClients: payload.activeClients }));
            }
          }

          setStatus((prev) => ({ ...prev, lastEvent: parsed }));
          if (callbackRef.current) {
            callbackRef.current(parsed);
          }
        } catch (e) {
          console.error('[WS Parse Error]', e);
        }
      };

      ws.onerror = () => {
        setStatus((prev) => ({ ...prev, connected: false, error: 'WebSocket Connection Error' }));
      };

      ws.onclose = () => {
        setStatus((prev) => ({ ...prev, connected: false }));
      };
    } catch (err: any) {
      setStatus((prev) => ({ ...prev, connected: false, error: err.message }));
    }
  }, []);

  useEffect(() => {
    connect();
    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, [connect]);

  const sendPing = useCallback(() => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ type: 'PING' }));
    }
  }, []);

  return { status, sendPing, reconnect: connect };
}
