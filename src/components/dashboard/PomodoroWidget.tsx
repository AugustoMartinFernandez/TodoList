"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Flame, Pause, Play, Square, Minimize2, Coffee } from "lucide-react";
import { usePomodoro } from "@/src/context/PomodoroContext";

export default function PomodoroWidget() {
  const { focusTask, timeLeft, isTimerRunning, isMinimized, mode, startSession, toggleTimer, stopTimer, toggleMinimize, closePomodoro, settings } = usePomodoro();

  if (!focusTask) return null;

  const formatTime = (seconds: number) => {
    return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
  };

  return (
    <AnimatePresence mode="wait">
      {isMinimized ? (
        <motion.div 
          key="pomodoro-minimized"
          layoutId="pomodoro-wrapper"
          initial={{ opacity: 0, y: -20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }} 
          exit={{ opacity: 0, scale: 0.8 }}
          onClick={toggleMinimize}
          className="fixed top-4 left-4 md:top-20 md:left-8 z-[100] cursor-pointer group"
        >
          <div className="bg-black/90 backdrop-blur-xl border border-white/10 shadow-2xl shadow-black/40 rounded-full px-4 py-2.5 flex items-center gap-3 transition-transform group-hover:scale-105">
            <div className={`w-2 h-2 rounded-full ${isTimerRunning ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'}`} />
            <span className="text-white font-mono font-bold tracking-wider text-sm">
              {formatTime(timeLeft)}
            </span>
            <div className="w-px h-4 bg-white/20" />
            <span className="text-white/80 text-xs font-medium truncate max-w-[100px] md:max-w-[150px]">
              {focusTask.title.replace(/#\w+/g, '').trim()}
            </span>
          </div>
        </motion.div>
      ) : (
        <motion.div 
          key="pomodoro-maximized"
          layoutId="pomodoro-wrapper"
          initial={{ opacity: 0, y: 50, scale: 0.9 }} 
          animate={{ opacity: 1, y: 0, scale: 1 }} 
          exit={{ opacity: 0, y: 50, scale: 0.9 }}
          className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[100] w-[90%] md:w-auto min-w-[320px] bg-slate-900 text-white rounded-3xl shadow-2xl p-5 border border-slate-700 flex flex-col items-center gap-4"
        >
          <div className="flex justify-between w-full items-center mb-1">
            <button type="button" onClick={toggleMinimize} className="p-1.5 text-slate-400 hover:text-white bg-slate-800 rounded-full transition-colors" title="Minimizar a pastilla">
              <Minimize2 className="w-4 h-4" />
            </button>
            <button type="button" onClick={closePomodoro} className="p-1.5 text-slate-400 hover:text-white bg-slate-800 rounded-full transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-2 w-full pr-2">
            <Flame className="w-5 h-5 text-orange-500" />
            <span className="font-semibold text-sm truncate">{focusTask.title.replace(/#\w+/g, '').trim()}</span>
          </div>

          {mode === 'config' ? (
            <div className="flex flex-col gap-3 w-full">
              <span className="text-xs text-slate-400 font-medium uppercase tracking-wider text-center">¿Qué querés hacer?</span>
              <div className="grid grid-cols-3 gap-2">
                {/* BOTÓN TRABAJO */}
                <button onClick={() => startSession(settings.workTime)} className="py-2 bg-indigo-600/20 hover:bg-indigo-600 border border-indigo-500/30 hover:border-transparent rounded-xl transition-all flex flex-col items-center justify-center gap-1 group">
                  <span className="text-[10px] text-indigo-300 font-bold uppercase tracking-wider group-hover:text-white">Pomodoro</span>
                  <span className="text-sm font-bold text-white">{settings.workTime}m</span>
                </button>
                {/* BOTÓN DESCANSO CORTO */}
                <button onClick={() => startSession(settings.shortBreak)} className="py-2 bg-green-600/20 hover:bg-green-600 border border-green-500/30 hover:border-transparent rounded-xl transition-all flex flex-col items-center justify-center gap-1 group">
                  <span className="text-[10px] text-green-300 font-bold uppercase tracking-wider group-hover:text-white flex items-center gap-1"><Coffee className="w-3 h-3"/> Corto</span>
                  <span className="text-sm font-bold text-white">{settings.shortBreak}m</span>
                </button>
                {/* BOTÓN DESCANSO LARGO */}
                <button onClick={() => startSession(settings.longBreak)} className="py-2 bg-blue-600/20 hover:bg-blue-600 border border-blue-500/30 hover:border-transparent rounded-xl transition-all flex flex-col items-center justify-center gap-1 group">
                  <span className="text-[10px] text-blue-300 font-bold uppercase tracking-wider group-hover:text-white flex items-center gap-1"><Coffee className="w-3 h-3"/> Largo</span>
                  <span className="text-sm font-bold text-white">{settings.longBreak}m</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between w-full mt-2">
              <span className="text-5xl font-black font-mono tracking-tight text-indigo-400">
                {formatTime(timeLeft)}
              </span>
              <div className="flex gap-2">
                <button type="button" onClick={toggleTimer} className={`p-3 rounded-2xl transition-colors text-white shadow-lg ${isTimerRunning ? 'bg-amber-500 hover:bg-amber-400 shadow-amber-500/30' : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/30'}`}>
                  {isTimerRunning ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current" />}
                </button>
                <button type="button" onClick={stopTimer} className="p-3 bg-slate-800 hover:bg-slate-700 rounded-2xl transition-colors text-slate-300">
                  <Square className="w-6 h-6 fill-current" />
                </button>
              </div>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}