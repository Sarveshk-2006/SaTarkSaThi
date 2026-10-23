import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { getActiveUserId, setActiveUserId as setStorageActiveUserId, getAuthToken } from '../api/client';
import { api } from '../api/endpoints';
import { AlertTriangle, CheckCircle2, Bell, X, PhoneCall, ShieldAlert, Radio } from 'lucide-react';

export interface LiveAlertPayload {
  alert_id?: number;
  incident_id?: string;
  threat_title: string;
  risk_level: string;
  message_content: string;
  recommended_action?: string;
  delivered_at?: string;
  delivery_channel?: string;
}

interface NotificationContextType {
  activeUserId: string;
  switchUser: (id: string) => void;
  activeProfileName: string;
  activeProfileRole: string;
  liveAlert: LiveAlertPayload | null;
  clearLiveAlert: () => void;
  acknowledgeCurrentAlert: () => Promise<void>;
  isWsConnected: boolean;
  manualTriggerDemoNotification: (payload: LiveAlertPayload) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

// Web Audio chime generator for incoming alerts
function playAlertChime(isCritical: boolean = false) {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = isCritical ? 'sawtooth' : 'sine';
    osc.frequency.setValueAtTime(isCritical ? 880 : 587.33, ctx.currentTime); // A5 or D5
    osc.frequency.exponentialRampToValueAtTime(isCritical ? 440 : 880, ctx.currentTime + 0.3);

    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.4);
  } catch (e) {
    // Audio autoplay might be restricted by browser policy before interaction
  }
}

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [activeUserId, setActiveUserIdState] = useState<string>(getActiveUserId());
  const [liveAlert, setLiveAlert] = useState<LiveAlertPayload | null>(null);
  const [isWsConnected, setIsWsConnected] = useState<boolean>(false);
  const [isAcknowledging, setIsAcknowledging] = useState<boolean>(false);

  const activeProfileName = activeUserId === '2' ? 'Aarav Sharma' : 'Rajesh Sharma';
  const activeProfileRole = activeUserId === '2' ? 'Trusted Guardian' : 'Protected Member';

  const switchUser = (newId: string) => {
    setStorageActiveUserId(newId);
    setActiveUserIdState(newId);
    window.location.reload(); // Refresh to reload data under new identity
  };

  const clearLiveAlert = () => {
    setLiveAlert(null);
  };

  const acknowledgeCurrentAlert = async () => {
    if (!liveAlert?.alert_id) {
      clearLiveAlert();
      return;
    }
    setIsAcknowledging(true);
    try {
      await api.acknowledgeAlert(liveAlert.alert_id);
      setLiveAlert(null);
    } catch (err) {
      console.error('Failed to acknowledge alert:', err);
      setLiveAlert(null);
    } finally {
      setIsAcknowledging(false);
    }
  };

  const manualTriggerDemoNotification = useCallback((payload: LiveAlertPayload) => {
    setLiveAlert(payload);
    playAlertChime(payload.risk_level === 'CRITICAL');
  }, []);

  // WebSocket Connection
  useEffect(() => {
    let ws: WebSocket | null = null;
    let reconnectTimeout: any = null;

    const connectWebSocket = () => {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.hostname || '127.0.0.1';
      const wsHost = window.location.port === '5173' ? `${host}:8000` : (window.location.host || `${host}:8000`);
      const token = getAuthToken();
      const queryParams = new URLSearchParams({ user_id: activeUserId });
      if (token) {
        queryParams.set('token', token);
      }
      const wsUrl = `${protocol}//${wsHost}/api/ws/alerts?${queryParams.toString()}`;

      try {
        ws = new WebSocket(wsUrl);

        ws.onopen = () => {
          setIsWsConnected(true);
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'FAMILY_ALERT_NOTIFICATION' || data.threat_title) {
              setLiveAlert({
                alert_id: data.alert_id,
                incident_id: data.incident_id,
                threat_title: data.threat_title,
                risk_level: data.risk_level || 'HIGH',
                message_content: data.message_content,
                recommended_action: data.recommended_action,
                delivered_at: data.delivered_at || new Date().toISOString(),
                delivery_channel: data.delivery_channel || 'IN_APP_SIMULATION'
              });
              playAlertChime(data.risk_level === 'CRITICAL');
            }
          } catch (e) {
            console.error('Error parsing WebSocket alert:', e);
          }
        };

        ws.onclose = () => {
          setIsWsConnected(false);
          // Auto reconnect after 4 seconds
          reconnectTimeout = setTimeout(connectWebSocket, 4000);
        };

        ws.onerror = () => {
          setIsWsConnected(false);
          ws?.close();
        };
      } catch (err) {
        setIsWsConnected(false);
        reconnectTimeout = setTimeout(connectWebSocket, 4000);
      }
    };

    connectWebSocket();

    return () => {
      clearTimeout(reconnectTimeout);
      if (ws) {
        ws.close();
      }
    };
  }, [activeUserId]);

  return (
    <NotificationContext.Provider
      value={{
        activeUserId,
        switchUser,
        activeProfileName,
        activeProfileRole,
        liveAlert,
        clearLiveAlert,
        acknowledgeCurrentAlert,
        isWsConnected,
        manualTriggerDemoNotification
      }}
    >
      {children}

      {/* Live Push Alert Modal / Floating Banner for Family Guardian */}
      {liveAlert && (
        <div className="fixed top-5 right-5 left-5 md:left-auto md:w-[480px] z-50 animate-bounce-short">
          <div className="bg-slate-900/95 border-2 border-red-500/80 rounded-2xl shadow-2xl shadow-red-950/60 p-5 backdrop-blur-xl text-white">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-xl bg-red-500/20 text-red-400 border border-red-500/30 animate-pulse">
                  <ShieldAlert className="w-6 h-6 text-red-400" />
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase bg-red-500/30 text-red-300 border border-red-500/40">
                      LIVE IN-APP ALERT
                    </span>
                    <span className="text-[11px] font-mono text-slate-400">
                      ID: {liveAlert.incident_id || 'SA-RECENT'}
                    </span>
                  </div>
                  <h4 className="text-base font-bold text-white mt-0.5">
                    {liveAlert.threat_title}
                  </h4>
                </div>
              </div>
              <button
                onClick={clearLiveAlert}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
                title="Dismiss banner"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-sm text-slate-200 bg-slate-800/60 p-3 rounded-xl border border-slate-700/50 mb-3 leading-relaxed">
              {liveAlert.message_content}
            </p>

            <div className="text-xs text-amber-300 bg-amber-500/10 border border-amber-500/20 p-2.5 rounded-xl mb-4 flex items-start gap-2">
              <PhoneCall className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold">Recommended Action: </span>
                {liveAlert.recommended_action || 'Call family member immediately to check their safety.'}
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 pt-1 border-t border-slate-800 text-xs">
              <span className="text-slate-400 flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                Simulated Delivery ({activeProfileRole})
              </span>
              <button
                onClick={acknowledgeCurrentAlert}
                disabled={isAcknowledging}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-semibold flex items-center gap-2 shadow-lg shadow-red-900/40 transition-all cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                {isAcknowledging ? 'Acknowledging...' : 'Acknowledge Alert'}
              </button>
            </div>
          </div>
        </div>
      )}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};
