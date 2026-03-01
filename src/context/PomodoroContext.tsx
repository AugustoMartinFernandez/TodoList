"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { sileo } from 'sileo';
import { Database } from '@/src/types/database.types';

type Task = Database['public']['Tables']['tasks']['Row'];

// INTERFAZ DE SETTINGS (Soluciona el error en SettingsPage)
export interface PomodoroSettings {
  workTime: number;
  shortBreak: number;
  longBreak: number;
}

interface PomodoroContextType {
  focusTask: Task | null;
  timeLeft: number;
  isTimerRunning: boolean;
  isMinimized: boolean;
  mode: 'config' | 'running';
  settings: PomodoroSettings;
  openPomodoro: (task: Task) => void;
  startSession: (minutes: number) => void;
  toggleTimer: () => void;
  stopTimer: () => void;
  toggleMinimize: () => void;
  closePomodoro: () => void;
  updateSettings: (newSettings: PomodoroSettings) => void;
}

// VALORES POR DEFECTO ESTÁNDAR
const defaultSettings: PomodoroSettings = {
  workTime: 25,
  shortBreak: 5,
  longBreak: 15,
};

const PomodoroContext = createContext<PomodoroContextType | undefined>(undefined);

export function PomodoroProvider({ children }: { children: React.ReactNode }) {
  const [focusTask, setFocusTask] = useState<Task | null>(null);
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [mode, setMode] = useState<'config' | 'running'>('config');
  
  // INICIALIZACIÓN PEREZOSA (Evita errores de hidratación y set-state-in-effect)
  const [settings, setSettings] = useState<PomodoroSettings>(() => {
    if (typeof window === 'undefined') return defaultSettings;
    const savedSettings = localStorage.getItem('pomodoroSettingsV2');
    if (savedSettings) {
      try {
        return JSON.parse(savedSettings);
      } catch (e) {
        console.error('Error parsing pomodoro settings', e);
        return defaultSettings;
      }
    }
    return defaultSettings;
  });

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTimerRunning && timeLeft > 0) {
      interval = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    } else if (timeLeft === 0 && isTimerRunning) {
      setTimeout(() => {
        setIsTimerRunning(false);
        setIsMinimized(false);
        sileo.success({ title: "¡Tiempo terminado!", description: "Aprovecha para relajarte o cambiar de tarea." });
        try { navigator.vibrate([200, 100, 200]); } catch {}
      }, 0);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timeLeft]);

  // FUNCIÓN PARA ACTUALIZAR (Usada por SettingsPage)
  const updateSettings = (newSettings: PomodoroSettings) => {
    setSettings(newSettings);
    if (typeof window !== 'undefined') {
      localStorage.setItem('pomodoroSettingsV2', JSON.stringify(newSettings));
    }
  };

  const openPomodoro = (task: Task) => {
    setFocusTask(task);
    setMode('config');
    setIsTimerRunning(false);
    setIsMinimized(false);
  };

  const startSession = (minutes: number) => {
    setTimeLeft(minutes * 60);
    setMode('running');
    setIsTimerRunning(true);
  };

  const toggleTimer = () => setIsTimerRunning(!isTimerRunning);
  const stopTimer = () => { setIsTimerRunning(false); setMode('config'); };
  const toggleMinimize = () => setIsMinimized(!isMinimized);
  const closePomodoro = () => { setFocusTask(null); setIsTimerRunning(false); };

  return (
    <PomodoroContext.Provider value={{ 
      focusTask, timeLeft, isTimerRunning, isMinimized, mode, settings, 
      openPomodoro, startSession, toggleTimer, stopTimer, toggleMinimize, closePomodoro, updateSettings 
    }}>
      {children}
    </PomodoroContext.Provider>
  );
}

export function usePomodoro() {
  const context = useContext(PomodoroContext);
  if (!context) throw new Error('usePomodoro must be used within a PomodoroProvider');
  return context;
}