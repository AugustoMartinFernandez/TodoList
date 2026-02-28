"use client";

import { createContext, useContext, useState, ReactNode, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertTriangle, Info, RotateCcw } from 'lucide-react';

type NotificationType = 'success' | 'error' | 'info';

interface NotificationAction {
  label: string;
  onClick: () => void;
}

interface NotificationContextProps {
  notify: (message: string, type: NotificationType, action?: NotificationAction) => void;
}

const NotificationContext = createContext<NotificationContextProps | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notification, setNotification] = useState<{ message: string; type: NotificationType; action?: NotificationAction } | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const notify = (message: string, type: NotificationType, action?: NotificationAction) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    
    setNotification({ message, type, action });
    
    // Le damos 5 segundos si tiene acción de deshacer, sino 3 segundos normales
    timerRef.current = setTimeout(() => {
      setNotification(null);
    }, action ? 5000 : 3000);
  };

  const handleAction = () => {
    if (notification?.action) {
      notification.action.onClick();
      setNotification(null); // Ocultar notificación al usar la acción
      if (timerRef.current) clearTimeout(timerRef.current);
    }
  };

  return (
    <NotificationContext.Provider value={{ notify }}>
      {children}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -100 }}
            transition={{ type: "spring", bounce: 0.4, duration: 0.6 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-[9999] px-4 w-full max-w-sm"
            drag="y"
            dragConstraints={{ top: -100, bottom: 0 }}
            onDragEnd={(e, info) => {
              if (info.offset.y < -20) {
                setNotification(null);
                if (timerRef.current) clearTimeout(timerRef.current);
              }
            }}
          >
            <div className={`flex items-center justify-between px-4 py-3 rounded-2xl shadow-2xl border backdrop-blur-xl ${
              notification.type === 'success' ? 'bg-green-500/95 border-green-400 text-white' : 
              notification.type === 'error' ? 'bg-red-500/95 border-red-400 text-white' : 
              'bg-slate-800/95 border-slate-700 text-white'
            }`}>
              <div className="flex items-center gap-3">
                {notification.type === 'success' ? <CheckCircle2 className="w-6 h-6 shrink-0" /> : 
                 notification.type === 'error' ? <AlertTriangle className="w-6 h-6 shrink-0" /> : 
                 <Info className="w-6 h-6 shrink-0" />}
                <span className="font-semibold text-sm tracking-wide">{notification.message}</span>
              </div>
              
              {notification.action && (
                <button 
                  onClick={handleAction}
                  className="flex items-center gap-1.5 ml-3 px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors active:scale-95 shrink-0"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  {notification.action.label}
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </NotificationContext.Provider>
  );
}

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) throw new Error("useNotification debe usarse dentro de un NotificationProvider");
  return context;
};