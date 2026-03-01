"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Timer, Download, AlertTriangle, Loader2, Trash2, FileJson } from "lucide-react";
import Link from "next/link";
import { usePomodoro } from "@/src/context/PomodoroContext";
import { createClient } from "@/src/utils/supabase/client";
import { useNotification } from "@/src/context/NotificationContext";

export default function SettingsPage() {
  const { settings, updateSettings } = usePomodoro();
  const supabase = createClient();
  const { notify } = useNotification();

  const [mounted, setMounted] = useState(false);
  const [localSettings, setLocalSettings] = useState(settings);
  
  const [isExporting, setIsExporting] = useState(false);
  const [isDeletingCompleted, setIsDeletingCompleted] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    setMounted(true);
    setLocalSettings(settings);
  }, [settings]);

  const handleSliderChange = (key: keyof typeof settings, value: number) => {
    setLocalSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSliderRelease = () => {
    updateSettings(localSettings);
    notify("Tiempos actualizados", "success");
  };

  const handleExportData = async () => {
    setIsExporting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No hay usuario activo");

      const { data: tasks, error } = await supabase.from('tasks').select('*');
      if (error) throw error;

      const exportData = {
        user: user.email,
        exportDate: new Date().toISOString(),
        totalTasks: tasks.length,
        tasks: tasks
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `todopro_backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      notify("Datos exportados correctamente", "success");
    } catch (error) {
      notify("Error al exportar los datos", "error");
      console.error(error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleDeleteCompleted = async () => {
    setIsDeletingCompleted(true);
    try {
      const { error } = await supabase.from('tasks').delete().eq('is_completed', true);
      if (error) throw error;
      
      notify("Tareas completadas eliminadas", "success");
      setShowDeleteConfirm(false);
    // SOLUCIÓN AL LINTER: Eliminamos la variable 'error' del catch
    } catch {
      notify("Error al eliminar las tareas", "error");
    } finally {
      setIsDeletingCompleted(false);
    }
  };

  if (!mounted) return null;

  return (
    <div className="pb-32 -mx-4 md:mx-0">
      
      {/* HEADER */}
      <div className="bg-slate-100 dark:bg-slate-800/50 pt-8 pb-6 px-4 sm:px-6 lg:px-8 md:rounded-t-2xl border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-3xl mx-auto">
          <Link href="/dashboard" className="inline-flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 font-semibold text-sm transition-colors mb-4">
            <ArrowLeft className="w-4 h-4" /> Volver al panel
          </Link>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Ajustes</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Personalizá tu experiencia y gestioná tus datos.</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 space-y-8">
        
        {/* TARJETA 1: POMODORO */}
        <section className="bg-white dark:bg-slate-900 rounded-2xl p-6 md:p-8 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl">
              <Timer className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Tiempos de Enfoque</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">Configurá cuánto dura cada etapa de tu flujo de trabajo.</p>
            </div>
          </div>

          <div className="space-y-8">
            {/* Slider Trabajo */}
            <div>
              <div className="flex justify-between items-end mb-2">
                <label className="font-semibold text-slate-700 dark:text-slate-200">Pomodoro (Trabajo)</label>
                <span className="text-lg font-bold text-indigo-600 dark:text-indigo-400">{localSettings.workTime} min</span>
              </div>
              <input 
                type="range" min="15" max="60" step="5"
                value={localSettings.workTime}
                onChange={(e) => handleSliderChange('workTime', parseInt(e.target.value))}
                onMouseUp={handleSliderRelease} onTouchEnd={handleSliderRelease}
                className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600 dark:accent-indigo-500"
              />
            </div>

            {/* Slider Descanso Corto */}
            <div>
              <div className="flex justify-between items-end mb-2">
                <label className="font-semibold text-slate-700 dark:text-slate-200">Descanso Corto</label>
                <span className="text-lg font-bold text-green-600 dark:text-green-400">{localSettings.shortBreak} min</span>
              </div>
              <input 
                type="range" min="3" max="15" step="1"
                value={localSettings.shortBreak}
                onChange={(e) => handleSliderChange('shortBreak', parseInt(e.target.value))}
                onMouseUp={handleSliderRelease} onTouchEnd={handleSliderRelease}
                className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-green-600 dark:accent-green-500"
              />
            </div>

            {/* Slider Descanso Largo */}
            <div>
              <div className="flex justify-between items-end mb-2">
                <label className="font-semibold text-slate-700 dark:text-slate-200">Descanso Largo</label>
                <span className="text-lg font-bold text-blue-600 dark:text-blue-400">{localSettings.longBreak} min</span>
              </div>
              <input 
                type="range" min="15" max="45" step="5"
                value={localSettings.longBreak}
                onChange={(e) => handleSliderChange('longBreak', parseInt(e.target.value))}
                onMouseUp={handleSliderRelease} onTouchEnd={handleSliderRelease}
                className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600 dark:accent-blue-500"
              />
            </div>
          </div>
        </section>

        {/* RESTO DE TARJETAS MANTENIDAS IGUAL */}
        <section className="bg-white dark:bg-slate-900 rounded-2xl p-6 md:p-8 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 bg-blue-50 dark:bg-blue-500/10 rounded-xl">
              <Download className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Exportar Datos</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">Descargá una copia de seguridad de todas tus tareas.</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700/50">
            <div className="flex items-center gap-3">
              <FileJson className="w-8 h-8 text-slate-400" />
              <div>
                <p className="font-semibold text-slate-800 dark:text-slate-200">Copia de seguridad (.json)</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Incluye tareas pendientes y completadas.</p>
              </div>
            </div>
            <button 
              onClick={handleExportData}
              disabled={isExporting}
              className="w-full sm:w-auto px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-all disabled:opacity-70 flex items-center justify-center gap-2"
            >
              {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              {isExporting ? 'Generando...' : 'Descargar JSON'}
            </button>
          </div>
        </section>

        <section className="bg-red-50/50 dark:bg-red-950/10 rounded-2xl p-6 md:p-8 border border-red-100 dark:border-red-900/30 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 bg-red-100 dark:bg-red-500/20 rounded-xl">
              <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-red-700 dark:text-red-400">Zona de Peligro</h2>
              <p className="text-sm text-red-600/80 dark:text-red-400/80">Acciones destructivas para tu cuenta.</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-white dark:bg-slate-900 rounded-xl border border-red-100 dark:border-red-900/30">
              <div>
                <p className="font-semibold text-slate-900 dark:text-white">Limpiar historial</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Elimina definitivamente todas las tareas que ya marcaste como completadas.</p>
              </div>
              
              <AnimatePresence mode="wait">
                {!showDeleteConfirm ? (
                  <motion.button 
                    key="btn-delete"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    onClick={() => setShowDeleteConfirm(true)}
                    className="w-full sm:w-auto px-5 py-2.5 bg-white dark:bg-slate-800 border-2 border-red-200 dark:border-red-900/50 hover:bg-red-50 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 font-semibold rounded-lg transition-all flex items-center justify-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" /> Borrar completadas
                  </motion.button>
                ) : (
                  <motion.div 
                    key="btn-confirm"
                    initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                    className="flex items-center gap-2 w-full sm:w-auto"
                  >
                    <button onClick={() => setShowDeleteConfirm(false)} className="px-4 py-2.5 text-sm font-semibold text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all">
                      Cancelar
                    </button>
                    <button 
                      onClick={handleDeleteCompleted} disabled={isDeletingCompleted}
                      className="flex-1 sm:flex-none px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-all flex items-center justify-center gap-2"
                    >
                      {isDeletingCompleted ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Sí, eliminar'}
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}