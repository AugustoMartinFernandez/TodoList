"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, Circle, CheckCircle2, Sparkles, Calendar, Loader2, Flag, CalendarDays, Inbox, Sun, Flame, X } from "lucide-react";
import { createClient } from "@/src/utils/supabase/client";
import { sileo } from "sileo";
import { Database } from "@/src/types/database.types";

type Task = Database['public']['Tables']['tasks']['Row'];
type Priority = 'baja' | 'normal' | 'alta';
type FilterType = 'todas' | 'hoy' | 'proximas' | 'urgentes';

export default function DashboardPage() {
  const supabase = createClient();
  
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<FilterType>('todas');
  
  // Estados del Formulario
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState<Priority>('normal');
  const [newTaskDate, setNewTaskDate] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  
  const [userName, setUserName] = useState("");
  const [greeting, setGreeting] = useState("¡Hola!");

  useEffect(() => {
    const initUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.user_metadata?.full_name) {
        setUserName(user.user_metadata.full_name.split(" ")[0]);
      }
      
      const hour = new Date().getHours();
      if (hour >= 5 && hour < 12) setGreeting("¡Buen día");
      else if (hour >= 12 && hour < 20) setGreeting("¡Buenas tardes");
      else setGreeting("¡Buenas noches");
    };
    initUser();
  }, [supabase]);

  useEffect(() => {
    const fetchTasks = async () => {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (error) sileo.error({ title: "No pudimos cargar tus tareas" });
      else setTasks(data || []);
      
      setIsLoading(false);
    };
    fetchTasks();
  }, [supabase]);

  const cyclePriority = () => {
    const order: Priority[] = ['normal', 'alta', 'baja'];
    const nextIndex = (order.indexOf(newTaskPriority) + 1) % order.length;
    setNewTaskPriority(order[nextIndex]);
  };

  const priorityColors = {
    normal: "text-slate-400 bg-slate-100",
    alta: "text-red-500 bg-red-50 border-red-200",
    baja: "text-blue-500 bg-blue-50 border-blue-200"
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    const title = newTaskTitle.trim();
    if (!title || isAdding) return;

    setIsAdding(true);
    setNewTaskTitle(""); 
    const currentPriority = newTaskPriority;
    const currentDate = newTaskDate || null;
    
    setNewTaskPriority('normal');
    setNewTaskDate("");

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const tempTask: Task = {
      id: crypto.randomUUID(),
      user_id: user.id,
      title: title,
      is_completed: false,
      priority: currentPriority,
      due_date: currentDate,
      created_at: new Date().toISOString(),
    };
    
    setTasks((prev) => [tempTask, ...prev]);

    const { data: savedTask, error } = await supabase
      .from('tasks')
      .insert([{ user_id: user.id, title: title, priority: currentPriority, due_date: currentDate }])
      .select()
      .single();

    if (error) {
      setTasks((prev) => prev.filter((t) => t.id !== tempTask.id));
      sileo.error({ title: "Error al guardar la tarea" });
    } else if (savedTask) {
      setTasks((prev) => prev.map((t) => t.id === tempTask.id ? savedTask : t));
    }
    setIsAdding(false);
  };

  const toggleTask = async (task: Task) => {
    const newStatus = !task.is_completed;
    setTasks((prev) => prev.map((t) => t.id === task.id ? { ...t, is_completed: newStatus } : t));

    const { error } = await supabase.from('tasks').update({ is_completed: newStatus }).eq('id', task.id);
    if (error) {
      setTasks((prev) => prev.map((t) => t.id === task.id ? { ...t, is_completed: !newStatus } : t));
      sileo.error({ title: "Error al actualizar" });
    }
  };

  const deleteTask = async (task: Task) => {
    setTasks((prev) => prev.filter((t) => t.id !== task.id));
    const { error } = await supabase.from('tasks').delete().eq('id', task.id);
    if (error) {
      setTasks((prev) => [task, ...prev].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
      sileo.error({ title: "No se pudo borrar" });
    }
  };

  // Lógica de Filtrado
  const filteredTasks = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return tasks.filter((task) => {
      if (activeFilter === 'todas') return true;
      if (activeFilter === 'urgentes') return task.priority === 'alta';
      
      if (activeFilter === 'hoy' || activeFilter === 'proximas') {
        if (!task.due_date) return false;
        const [year, month, day] = task.due_date.split('-');
        const taskDate = new Date(Number(year), Number(month) - 1, Number(day));
        
        if (activeFilter === 'hoy') return taskDate.getTime() <= today.getTime();
        if (activeFilter === 'proximas') return taskDate.getTime() > today.getTime();
      }
      return true;
    });
  }, [tasks, activeFilter]);

  const filters = [
    { id: 'todas', label: 'Todas', icon: Inbox },
    { id: 'hoy', label: 'Hoy', icon: Sun },
    { id: 'proximas', label: 'Próximas', icon: CalendarDays },
    { id: 'urgentes', label: 'Urgentes', icon: Flame },
  ] as const;

  return (
    <div className="space-y-6 md:space-y-8 pb-10">
      <header className="px-1">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2 text-indigo-600 font-bold text-xs tracking-wider uppercase mb-2">
          <Calendar className="w-4 h-4" />
          {new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}
        </motion.div>
        <motion.h1 initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
          {greeting}{userName ? `, ${userName}` : ''}! <span className="text-2xl">👋</span>
        </motion.h1>
      </header>

      {/* INPUT CREADOR PRO */}
      <motion.form 
        initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}
        onSubmit={handleAddTask} 
        className="flex flex-col bg-white border border-slate-200 shadow-sm rounded-2xl overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-indigo-500 transition-all"
      >
        <div className="flex items-center p-1">
          <div className="pl-4 pr-2 text-slate-400">
            <Sparkles className="w-5 h-5 text-indigo-400" />
          </div>
          <input
            id="mobile-task-input"
            type="text"
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            placeholder="¿Qué tenés en mente para hoy?"
            className="flex-1 py-4 bg-transparent outline-none text-slate-700 placeholder:text-slate-400 font-medium"
            disabled={isAdding}
          />
        </div>
        
        <div className="flex items-center justify-between px-4 pb-3 pt-1 bg-slate-50/50 border-t border-slate-100">
          <div className="flex items-center gap-2">
            <button 
              type="button" 
              onClick={cyclePriority}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                newTaskPriority === 'normal' ? 'border-transparent text-slate-500 hover:bg-slate-200' : priorityColors[newTaskPriority]
              }`}
            >
              <Flag className="w-3.5 h-3.5" />
              <span className="capitalize">{newTaskPriority}</span>
            </button>
            
            <div className="relative flex items-center">
              <input 
                type="date" 
                value={newTaskDate}
                onChange={(e) => setNewTaskDate(e.target.value)}
                onClick={(e) => {
                  try { if ('showPicker' in HTMLInputElement.prototype) e.currentTarget.showPicker(); } catch (err) {}
                }}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                newTaskDate ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'border-transparent text-slate-500 hover:bg-slate-200'
              }`}>
                <CalendarDays className="w-3.5 h-3.5" />
                <span>
                  {newTaskDate ? (() => {
                    const [year, month, day] = newTaskDate.split('-');
                    return new Date(Number(year), Number(month) - 1, Number(day)).toLocaleDateString('es-AR', { month: 'short', day: 'numeric' });
                  })() : 'Fecha'}
                </span>
              </div>
              {newTaskDate && (
                <button type="button" onClick={() => setNewTaskDate("")} className="absolute right-1 z-20 p-1 text-indigo-400 hover:text-indigo-600 bg-indigo-50 rounded-full">
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          <button type="submit" disabled={!newTaskTitle.trim() || isAdding} className="p-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-xl transition-colors active:scale-95 shadow-sm">
            {isAdding ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
          </button>
        </div>
      </motion.form>

      {/* TABS DE FILTRADO PREMIUM (SMOOTH SCROLL) */}
      <div className="relative mb-6 mt-4">
        <div className="flex items-center gap-2.5 overflow-x-auto scrollbar-hide overscroll-x-contain pb-2 -mx-4 px-4 md:mx-0 md:px-0">
          {filters.map((filter) => {
            const isActive = activeFilter === filter.id;
            return (
              <motion.button
                key={filter.id}
                onClick={() => setActiveFilter(filter.id)}
                whileTap={{ scale: 0.94 }}
                className={`shrink-0 relative flex items-center gap-2 px-4 py-2 rounded-full text-[13px] font-semibold transition-all duration-300 border ${
                  isActive 
                    ? 'text-white border-transparent' 
                    : 'text-slate-500 bg-white border-slate-200 shadow-sm hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                {isActive && (
                  <motion.div 
                    layoutId="activeFilterTab" 
                    className="absolute inset-0 bg-indigo-600 rounded-full -z-10 shadow-lg shadow-indigo-600/30" 
                    transition={{ type: "spring", stiffness: 450, damping: 30 }} 
                  />
                )}
                <filter.icon className={`w-4 h-4 relative z-10 transition-transform duration-300 ${isActive ? 'scale-110 text-white' : 'text-slate-400'}`} />
                <span className="relative z-10 tracking-wide">{filter.label}</span>
              </motion.button>
            );
          })}
          {/* Spacer fantasma: Fuerza el margen derecho en móviles para que el último botón no quede cortado */}
          <div className="w-1 shrink-0 md:hidden" />
        </div>
      </div>

      {/* LISTA DE TAREAS */}
      <div className="space-y-3 min-h-[50vh]">
        {isLoading ? (
          [1, 2, 3].map((i) => (
            <div key={i} className="bg-white border border-slate-100 rounded-2xl p-4 flex items-center gap-4 animate-pulse">
              <div className="w-6 h-6 rounded-full bg-slate-200" />
              <div className="h-4 bg-slate-200 rounded w-3/4" />
            </div>
          ))
        ) : filteredTasks.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-12 text-center">
            <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4 text-4xl">
              {activeFilter === 'urgentes' ? '🔥' : activeFilter === 'hoy' ? '☕' : '🎯'}
            </div>
            <h3 className="text-lg font-bold text-slate-900">
              {activeFilter === 'urgentes' ? '¡Qué alivio!' : activeFilter === 'hoy' ? 'Día libre' : 'Todo al día'}
            </h3>
            <p className="text-slate-500 text-sm mt-1">
              {activeFilter === 'urgentes' ? 'No hay fuegos que apagar.' : activeFilter === 'hoy' ? 'Completaste todo lo de hoy.' : 'No hay tareas en esta vista.'}
            </p>
          </motion.div>
        ) : (
          <AnimatePresence mode="popLayout">
            {filteredTasks.map((task) => (
              <motion.div
                layout
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                key={task.id}
                className={`group flex items-center justify-between p-4 bg-white border border-slate-200 shadow-sm hover:shadow-md rounded-2xl transition-all ${
                  task.is_completed ? 'bg-slate-50 border-slate-100 opacity-60' : ''
                }`}
              >
                <div className="flex items-center gap-3 flex-1 overflow-hidden cursor-pointer touch-manipulation" onClick={() => toggleTask(task)}>
                  <button className={`flex-shrink-0 transition-colors ${task.is_completed ? 'text-green-500' : 'text-slate-300 hover:text-indigo-400'}`}>
                    {task.is_completed ? <CheckCircle2 className="w-6 h-6" /> : <Circle className="w-6 h-6" />}
                  </button>
                  <div className="flex flex-col flex-1 overflow-hidden">
                    <span className={`font-medium truncate transition-all ${task.is_completed ? 'text-slate-400 line-through' : 'text-slate-700'}`}>
                      {task.title}
                    </span>
                    {(!task.is_completed && (task.priority !== 'normal' || task.due_date)) && (
                      <div className="flex items-center gap-2 mt-1">
                        {task.priority !== 'normal' && (
                          <span className={`flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider ${task.priority === 'alta' ? 'text-red-500' : 'text-blue-500'}`}>
                            <Flag className="w-3 h-3" /> {task.priority}
                          </span>
                        )}
                        {task.due_date && (
                          <span className="flex items-center gap-1 text-[11px] font-medium text-slate-500">
                            <CalendarDays className="w-3 h-3" /> 
                            {new Date(task.due_date + 'T00:00:00').toLocaleDateString('es-AR', { month: 'short', day: 'numeric' })}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                
                <button 
                  onClick={() => deleteTask(task)}
                  className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors md:opacity-0 group-hover:opacity-100 focus:opacity-100"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
