"use client";
import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence, Reorder } from "framer-motion";
import { Calendar } from "lucide-react";
import { createClient } from "@/src/utils/supabase/client";
import { Database } from "@/src/types/database.types";

import CreateTaskForm from "@/src/components/dashboard/CreateTaskForm";
import FilterCarousel from "@/src/components/dashboard/FilterCarousel";
import TaskItem from "@/src/components/dashboard/TaskItem";
import { useNotification } from "@/src/context/NotificationContext";
import { usePomodoro } from "@/src/context/PomodoroContext";

type TaskRow = Database['public']['Tables']['tasks']['Row'];
type Task = TaskRow & { position?: number };
type Priority = 'baja' | 'normal' | 'alta';
type FilterType = 'todas' | 'hoy' | 'proximas' | 'urgentes';

export default function DashboardPage() {
  const supabase = createClient();
  const { notify } = useNotification();
  const { focusTask, closePomodoro } = usePomodoro();
  
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<FilterType>('todas');
  
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
        .order('position', { ascending: false })
        .order('created_at', { ascending: false });
        
      if (error) notify("No pudimos cargar tus tareas", "error");
      else setTasks(data || []);
      
      setIsLoading(false);
    };
    fetchTasks();
  }, [supabase, notify]);

  const cyclePriority = () => {
    const order: Priority[] = ['normal', 'alta', 'baja'];
    const nextIndex = (order.indexOf(newTaskPriority) + 1) % order.length;
    setNewTaskPriority(order[nextIndex]);
  };

  const priorityColors = {
    normal: "text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800",
    alta: "text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20",
    baja: "text-blue-500 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/20"
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

    const maxPosition = tasks.length > 0 ? Math.max(...tasks.map(t => t.position || 0)) : 0;
    const newPosition = maxPosition + 1;

    const tempTask: Task = {
      id: crypto.randomUUID(),
      user_id: user.id,
      title: title,
      is_completed: false,
      priority: currentPriority,
      due_date: currentDate,
      created_at: new Date().toISOString(),
      position: newPosition,
    };
    
    setTasks((prev) => [tempTask, ...prev]);
    const { data: savedTask, error } = await supabase
      .from('tasks')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .insert([{ user_id: user.id, title: title, priority: currentPriority, due_date: currentDate, position: newPosition } as any])
      .select()
      .single();

    if (error) {
      setTasks((prev) => prev.filter((t) => t.id !== tempTask.id));
      notify("Error al guardar la tarea", "error");
    } else if (savedTask) {
      setTasks((prev) => prev.map((t) => t.id === tempTask.id ? savedTask : t));
      notify("Tarea creada", "success");
    }
    setIsAdding(false);
  };

  const handleReorder = async (reorderedFilteredTasks: Task[]) => {
    const currentPositions = [...reorderedFilteredTasks]
      .map(t => t.position || 0)
      .sort((a, b) => b - a);

    const updatedTasks = reorderedFilteredTasks.map((t, index) => ({
      ...t,
      position: currentPositions[index]
    }));

    setTasks(prev => {
      const newTasks = [...prev];
      updatedTasks.forEach(ut => {
        const idx = newTasks.findIndex(t => t.id === ut.id);
        if (idx !== -1) newTasks[idx] = ut;
      });
      return newTasks.sort((a, b) => {
        if ((b.position || 0) !== (a.position || 0)) return (b.position || 0) - (a.position || 0);
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
    });

    try {
      await Promise.all(
        updatedTasks.map(task => 
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          supabase.from('tasks').update({ position: task.position } as any).eq('id', task.id)
        )
      );
    } catch {
      notify("Error de sincronización al reordenar", "error");
    }
  };

  const toggleTask = async (task: Task) => {
    const newStatus = !task.is_completed;
    setTasks((prev) => prev.map((t) => t.id === task.id ? { ...t, is_completed: newStatus } : t));

    if (newStatus && focusTask?.id === task.id) {
      closePomodoro();
    }

    const { error } = await supabase.from('tasks').update({ is_completed: newStatus }).eq('id', task.id);
    if (error) {
      setTasks((prev) => prev.map((t) => t.id === task.id ? { ...t, is_completed: !newStatus } : t));
      notify("Error al actualizar", "error");
    }
  };

  const editTask = async (task: Task, newTitle: string, newPriority: Priority, newDate: string | null) => {
    const oldTask = { ...task };
    setTasks((prev) => prev.map((t) => t.id === task.id ? { ...t, title: newTitle, priority: newPriority, due_date: newDate } : t));

    const { error } = await supabase.from('tasks').update({ title: newTitle, priority: newPriority, due_date: newDate }).eq('id', task.id);
    if (error) {
      setTasks((prev) => prev.map((t) => t.id === task.id ? oldTask : t));
      notify("Error al editar la tarea", "error");
    } else {
      notify("Tarea actualizada", "success");
    }
  };

  const deleteTask = async (task: Task) => {
    setTasks((prev) => prev.filter((t) => t.id !== task.id));
    
    if (focusTask?.id === task.id) {
      closePomodoro();
    }

    const timeoutId = setTimeout(async () => {
      const { error } = await supabase.from('tasks').delete().eq('id', task.id);
      if (error) {
        setTasks((prev) => [task, ...prev].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
        notify("Error al borrar definitivamente", "error");
      }
    }, 5000);

    notify("Tarea eliminada", "success", {
      label: "Deshacer",
      onClick: () => {
        clearTimeout(timeoutId);
        setTasks((prev) => [task, ...prev].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
        notify("Tarea restaurada", "info");
      }
    });
  };

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

  return (
    <div className="space-y-6 md:space-y-8 pb-32">
      <header className="px-1">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold text-xs tracking-wider uppercase mb-2">
          <Calendar className="w-4 h-4" />
          {new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}
        </motion.div>
        <motion.h1 initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          {greeting}{userName ? `, ${userName}` : ''}! <span className="text-2xl">👋</span>
        </motion.h1>
      </header>

      <CreateTaskForm 
        newTaskTitle={newTaskTitle} setNewTaskTitle={setNewTaskTitle}
        newTaskPriority={newTaskPriority} cyclePriority={cyclePriority}
        newTaskDate={newTaskDate} setNewTaskDate={setNewTaskDate}
        isAdding={isAdding} handleAddTask={handleAddTask} priorityColors={priorityColors}
      />

      <FilterCarousel activeFilter={activeFilter} setActiveFilter={setActiveFilter} />

      <div className="space-y-3 min-h-[50vh]">
        {isLoading ? (
          [1, 2, 3].map((i) => (
            <div key={i} className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-4 flex items-center gap-4 animate-pulse">
              <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-800" />
              <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-3/4" />
            </div>
          ))
        ) : filteredTasks.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-12 text-center">
            <div className="w-20 h-20 bg-indigo-50 dark:bg-indigo-500/10 rounded-full flex items-center justify-center mx-auto mb-4 text-4xl">
              {activeFilter === 'urgentes' ? '🔥' : activeFilter === 'hoy' ? '☕' : '🎯'}
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              {activeFilter === 'urgentes' ? '¡Qué alivio!' : activeFilter === 'hoy' ? 'Día libre' : 'Todo al día'}
            </h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
              {activeFilter === 'urgentes' ? 'No hay fuegos que apagar.' : activeFilter === 'hoy' ? 'Completaste todo lo de hoy.' : 'No hay tareas en esta vista.'}
            </p>
          </motion.div>
        ) : (
          <Reorder.Group as="div" axis="y" values={filteredTasks} onReorder={handleReorder} className="space-y-3">
            <AnimatePresence mode="popLayout">
              {filteredTasks.map((task) => (
                <TaskItem 
                  key={task.id} 
                  task={task} 
                  onToggle={toggleTask} 
                  onDelete={deleteTask} 
                  onEdit={editTask}
                />
              ))}
            </AnimatePresence>
          </Reorder.Group>
        )}
      </div>
    </div>
  );
}
