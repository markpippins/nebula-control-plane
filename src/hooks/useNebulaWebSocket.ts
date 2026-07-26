import { useEffect, useState, useRef, useCallback } from 'react';
import { WebSocketEvent } from '../types/nebula';

export interface WebSocketStatus {
  connected: boolean;
  activeClients: number;
  lastEvent: WebSocketEvent | null;
  error: string | null;
}

export function useNebulaWebSocket(onEvent?: (event: WebSocketEvent) => void) {
  const [status, setStatus] = useState<WebSocketStatus>({
    connected: false,
    activeClients: 1,
    lastEvent: null,
    error: null,
  });

  const socketRef = useRef<WebSocket | null>(null);
  const callbackRef = useRef(onEvent);
  callbackRef.current = onEvent;

  const connect = useCallback(() => {
    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws`;

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
        // Try reconnecting after 3s
        setTimeout(() => {
          connect();
        }, 3000);
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

  return { status, sendPing };
}
