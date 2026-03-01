"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { User, Lock, ShieldCheck, CheckCircle2, AlertCircle, ArrowLeft, Camera, Loader2, BarChart3, Pencil, Eye, EyeOff, AlertTriangle } from "lucide-react";
import { createClient } from "@/src/utils/supabase/client";
import { useNotification } from "@/src/context/NotificationContext";
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from "recharts";
import Link from "next/link";
import { Database } from "@/src/types/database.types";
import { useTheme } from "next-themes";

type Task = Database['public']['Tables']['tasks']['Row'];

interface CustomTooltipProps {
  active?: boolean;
  payload?: { value: number }[];
  label?: string;
}

const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900/95 dark:bg-slate-800/95 backdrop-blur-md border border-slate-700 dark:border-slate-600 p-3 rounded-xl shadow-xl text-white">
        <p className="font-bold text-sm mb-1">{label}</p>
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-blue-400" />
          <span className="font-medium text-sm">{payload[0].value} completadas</span>
        </div>
      </div>
    );
  }
  return null;
};

// --- CONSTANTES DE SEGURIDAD ---
const MAX_PASSWORD_CHANGES = 3;
const DAYS_LIMIT = 30;

export default function ProfilePage() {
  const supabase = createClient();
  const { notify } = useNotification();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { resolvedTheme } = useTheme();

  const [isLoading, setIsLoading] = useState(true);
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [authProvider, setAuthProvider] = useState<string>("email");
  const [tasks, setTasks] = useState<Task[]>([]);
  
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState("");
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  
  const [newPassword, setNewPassword] = useState("");
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // --- ESTADOS DE RATE LIMITING ---
  const [passwordChangesLog, setPasswordChangesLog] = useState<string[]>([]);
  const [changesRemaining, setChangesRemaining] = useState(MAX_PASSWORD_CHANGES);

  // --- ESTADO PARA PORTADA DINÁMICA ---
  const [coverUrl, setCoverUrl] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserName(user.user_metadata?.full_name || "Usuario");
        setTempName(user.user_metadata?.full_name || "Usuario");
        setUserEmail(user.email || "");
        
        const profilePic = user.user_metadata?.avatar_url || user.user_metadata?.picture || null;
        setAvatarUrl(profilePic);
        
        const provider = user.app_metadata?.provider || "email";
        setAuthProvider(provider);
        
        const { data } = await supabase.from('tasks').select('*');
        if (data) setTasks(data);

        if (provider !== "google") {
          const logKey = `pwd_log_${user.id}`;
          const savedLog = localStorage.getItem(logKey);
          if (savedLog) {
            const parsedLog: string[] = JSON.parse(savedLog);
            const now = new Date();
            const validLog = parsedLog.filter(dateStr => {
              const changeDate = new Date(dateStr);
              const diffTime = Math.abs(now.getTime() - changeDate.getTime());
              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
              return diffDays <= DAYS_LIMIT;
            });
            
            setPasswordChangesLog(validLog);
            setChangesRemaining(MAX_PASSWORD_CHANGES - validLog.length);
            localStorage.setItem(logKey, JSON.stringify(validLog));
          }
        }
      }
      setIsLoading(false);
    };

    // --- LÓGICA DE PORTADA ALEATORIA ---
    const fetchRandomCover = async () => {
      try {
        const { data, error } = await supabase.storage.from('covers').list();
        if (data && data.length > 0) {
          // Filtramos placeholders ocultos que a veces crea Supabase
          const validFiles = data.filter(file => file.name !== '.emptyFolderPlaceholder' && file.name.match(/\.(jpeg|jpg|gif|png|webp)$/i));
          if (validFiles.length > 0) {
            const randomIndex = Math.floor(Math.random() * validFiles.length);
            const randomFile = validFiles[randomIndex];
            const { data: { publicUrl } } = supabase.storage.from('covers').getPublicUrl(randomFile.name);
            setCoverUrl(publicUrl);
          }
        }
      } catch (error) {
        console.error("Error al cargar la portada aleatoria:", error);
      }
    };

    fetchUserData();
    fetchRandomCover();
  }, [supabase]);

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      if (!event.target.files || event.target.files.length === 0) return;
      
      const file = event.target.files[0];
      const MAX_SIZE_MB = 15;
      const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

      if (!file.type.startsWith('image/')) {
        notify("Solo se permiten archivos de imagen (JPG, PNG, etc)", "error");
        return;
      }

      if (file.size > MAX_SIZE_BYTES) {
        notify(`La imagen es muy pesada (Máximo ${MAX_SIZE_MB}MB)`, "error");
        return;
      }

      setIsUploadingAvatar(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file);
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath);

      const { error: updateError } = await supabase.auth.updateUser({
        data: { avatar_url: publicUrl }
      });
      if (updateError) throw updateError;

      setAvatarUrl(publicUrl);
      notify("Foto de perfil actualizada", "success");
    } catch (error) {
      notify("Hubo un error al subir la imagen", "error");
      console.error(error);
    } finally {
      setIsUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = ""; 
    }
  };

  const isPasswordValid = newPassword.length >= 6;

  const handleUpdateName = async () => {
    if (!tempName.trim() || tempName === userName) {
      setIsEditingName(false);
      return;
    }
    
    const { error } = await supabase.auth.updateUser({
      data: { full_name: tempName }
    });

    if (error) {
      notify("Error al actualizar el nombre", "error");
      setTempName(userName); 
    } else {
      setUserName(tempName);
      notify("Nombre actualizado correctamente", "success");
    }
    setIsEditingName(false);
  };

  const handleUpdatePassword = async () => {
    if (!isPasswordValid || changesRemaining <= 0 || authProvider === 'google') return;
    setIsUpdatingPassword(true);
    
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    
    if (error) {
      notify("Error al actualizar la contraseña", "error");
    } else {
      notify("Contraseña protegida con éxito", "success");
      setNewPassword(""); 
      setShowPassword(false);

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const newLog = [...passwordChangesLog, new Date().toISOString()];
        setPasswordChangesLog(newLog);
        setChangesRemaining(MAX_PASSWORD_CHANGES - newLog.length);
        localStorage.setItem(`pwd_log_${user.id}`, JSON.stringify(newLog));
      }
    }
    setIsUpdatingPassword(false);
  };

  const weeklyData = useMemo(() => {
    const data = [];
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    
    const daysMap = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      
      const completedOnThisDay = tasks.filter(task => {
        if (!task.is_completed) return false;
        const taskDate = new Date(task.created_at);
        return taskDate.toDateString() === d.toDateString();
      }).length;

      data.push({
        name: i === 0 ? 'Hoy' : daysMap[d.getDay()],
        completadas: completedOnThisDay,
      });
    }
    return data;
  }, [tasks]);

  if (isLoading) {
    return <div className="flex h-[50vh] items-center justify-center animate-pulse"><div className="w-10 h-10 bg-slate-200 dark:bg-slate-800 rounded-full" /></div>;
  }

  return (
    <div className="pb-32 -mx-4 md:mx-0">
      
      {/* 1. FOTO DE PORTADA (COVER PHOTO DINÁMICO) */}
      <div className="relative h-48 md:h-64 bg-slate-200 dark:bg-slate-800 w-full overflow-hidden md:rounded-t-2xl group transition-all duration-700">
        {coverUrl ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src={coverUrl} 
              alt="Portada dinámica" 
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
            />
            {/* Overlay sutil para legibilidad de textos (Volver) */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/10 dark:from-black/60 dark:to-black/30"></div>
          </>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-blue-400 dark:from-blue-900 dark:to-indigo-900 opacity-90"></div>
        )}
        
        {/* Botón Volver integrado en la portada */}
        <div className="absolute top-4 left-4 z-10">
           <Link href="/dashboard" className="inline-flex items-center gap-2 text-white/90 hover:text-white font-semibold text-sm px-3 py-1.5 rounded-lg bg-black/30 hover:bg-black/50 backdrop-blur-md transition-colors border border-white/10 shadow-sm">
              <ArrowLeft className="w-4 h-4" /> Volver
            </Link>
        </div>
      </div>

      {/* 2. CONTENEDOR PRINCIPAL DEL PERFIL */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* CABECERA: AVATAR + NOMBRE */}
        <div className="relative -mt-16 sm:-mt-20 flex flex-col sm:flex-row items-center sm:items-end gap-4 sm:gap-6 mb-8">
          <div className="relative group cursor-pointer z-10" onClick={() => fileInputRef.current?.click()}>
            <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-full overflow-hidden bg-white dark:bg-slate-900 border-4 border-slate-50 dark:border-slate-950 flex items-center justify-center text-slate-400 text-5xl font-black shadow-md relative transition-transform group-hover:scale-105 duration-300">
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                userName.charAt(0).toUpperCase()
              )}
              <div className={`absolute inset-0 bg-slate-900/40 flex items-center justify-center transition-opacity duration-300 ${isUploadingAvatar ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                {isUploadingAvatar ? <Loader2 className="w-8 h-8 text-white animate-spin" /> : <Camera className="w-8 h-8 text-white" />}
              </div>
            </div>
            <input type="file" ref={fileInputRef} onChange={handleAvatarUpload} accept="image/*" className="hidden" />
          </div>

          <div className="flex-1 text-center sm:text-left pb-2 sm:pb-4">
            {isEditingName ? (
              <div className="flex items-center gap-2 max-w-sm mx-auto sm:mx-0">
                <input 
                  type="text" value={tempName} onChange={(e) => setTempName(e.target.value)} autoFocus
                  onKeyDown={(e) => { if (e.key === 'Enter') handleUpdateName(); if (e.key === 'Escape') setIsEditingName(false); }}
                  className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white font-bold text-2xl sm:text-3xl rounded-lg px-3 py-1 outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                />
                <button onClick={handleUpdateName} className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all"><CheckCircle2 className="w-5 h-5" /></button>
              </div>
            ) : (
              <h1 
                onClick={() => setIsEditingName(true)} 
                className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors group flex items-center justify-center sm:justify-start gap-2"
                title="Click para editar"
              >
                {userName}
                <Pencil className="w-5 h-5 opacity-0 group-hover:opacity-100 text-blue-500 transition-opacity" />
              </h1>
            )}
            <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">{userEmail}</p>
          </div>
        </div>

        <hr className="border-slate-200 dark:border-slate-800 mb-8" />

        {/* 3. COLUMNAS DE INFORMACIÓN */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          <div className="md:col-span-1 space-y-6">
            <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm transition-all hover:shadow-md">
              <h3 className="font-bold text-slate-900 dark:text-white mb-4 text-lg">Resumen</h3>
              <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300 mb-3">
                <CheckCircle2 className="w-5 h-5 text-blue-500 dark:text-blue-400" />
                <span><strong>{tasks.filter(t => t.is_completed).length}</strong> tareas completadas</span>
              </div>
              <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
                <BarChart3 className="w-5 h-5 text-blue-500 dark:text-blue-400" />
                <span><strong>{tasks.length}</strong> tareas en total</span>
              </div>
            </div>
          </div>

          <div className="md:col-span-2 space-y-6">
            
            <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm transition-all hover:shadow-md">
              <h3 className="font-bold text-slate-900 dark:text-white mb-4 text-lg">Productividad semanal</h3>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weeklyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={resolvedTheme === 'dark' ? '#334155' : '#e2e8f0'} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: resolvedTheme === 'dark' ? '#94a3b8' : '#64748b', fontSize: 12, fontWeight: 500 }} dy={10} />
                    <Tooltip cursor={{ fill: resolvedTheme === 'dark' ? '#1e293b' : '#f1f5f9', radius: 4 }} content={<CustomTooltip />} />
                    <Bar dataKey="completadas" radius={[4, 4, 0, 0]} maxBarSize={40} animationDuration={1000}>
                      {weeklyData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.name === 'Hoy' ? '#2563eb' : (resolvedTheme === 'dark' ? '#3b82f680' : '#93c5fd')} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* TARJETA DE SEGURIDAD */}
            <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm transition-all hover:shadow-md">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-6 h-6 text-slate-400" />
                  <h3 className="font-bold text-slate-900 dark:text-white text-lg">Seguridad</h3>
                </div>
                {authProvider !== 'google' && (
                  <div className={`text-xs font-bold px-2.5 py-1 rounded-md ${changesRemaining > 0 ? 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400' : 'bg-red-50 dark:bg-red-500/10 text-red-500 dark:text-red-400'}`}>
                    {changesRemaining} cambios disponibles
                  </div>
                )}
              </div>
              
              <div className="space-y-4 max-w-md">
                {authProvider === 'google' ? (
                  <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 p-5 rounded-lg flex items-start gap-4">
                    <div className="bg-white dark:bg-slate-800 p-2 rounded-full shadow-sm shrink-0">
                      <svg className="w-6 h-6" viewBox="0 0 24 24">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-white">Cuenta vinculada a Google</h4>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">Tu identidad y seguridad están protegidas directamente por los servidores de Google. No necesitas gestionar contraseñas adicionales aquí.</p>
                    </div>
                  </div>
                ) : changesRemaining <= 0 ? (
                  <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 p-4 rounded-lg flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-bold text-red-800 dark:text-red-300">Límite alcanzado</h4>
                      <p className="text-xs text-red-600 dark:text-red-400 mt-1">Por razones de seguridad, solo puedes cambiar tu contraseña 3 veces cada 30 días.</p>
                    </div>
                  </div>
                ) : (
                  <>
                    <div>
                      <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">Nueva contraseña</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                          <Lock className="w-5 h-5" />
                        </div>
                        <input
                          type={showPassword ? "text" : "password"}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="Mínimo 6 caracteres"
                          className={`w-full pl-10 pr-12 py-2.5 bg-slate-50 dark:bg-slate-800/50 border rounded-lg text-slate-900 dark:text-white outline-none transition-all ${
                            newPassword.length > 0 && !isPasswordValid 
                              ? 'border-red-300 dark:border-red-500/50 focus:border-red-500 focus:ring-red-200 dark:focus:ring-red-500/20' 
                              : isPasswordValid 
                                ? 'border-green-300 dark:border-green-500/50 focus:border-green-500 focus:ring-green-200 dark:focus:ring-green-500/20' 
                                : 'border-slate-200 dark:border-slate-700 focus:border-blue-500 focus:ring-blue-200 dark:focus:ring-blue-500/20'
                          } focus:ring-2`}
                        />
                        <button 
                          type="button" 
                          onClick={() => setShowPassword(!showPassword)} 
                          className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                        >
                          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                      <div className="h-5 mt-1 flex items-center transition-all">
                        {newPassword.length > 0 && (
                          isPasswordValid ? (
                            <span className="flex items-center gap-1 text-xs font-bold text-green-600 dark:text-green-400"><CheckCircle2 className="w-3.5 h-3.5" /> Contraseña segura</span>
                          ) : (
                            <span className="flex items-center gap-1 text-xs font-bold text-red-500 dark:text-red-400"><AlertCircle className="w-3.5 h-3.5" /> Mínimo 6 caracteres</span>
                          )
                        )}
                      </div>
                    </div>
                    
                    <button 
                      onClick={handleUpdatePassword}
                      disabled={!isPasswordValid || isUpdatingPassword}
                      className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:text-slate-400 dark:disabled:text-slate-500 text-white font-semibold rounded-lg transition-all active:scale-95 flex items-center gap-2"
                    >
                      {isUpdatingPassword ? <><Loader2 className="w-4 h-4 animate-spin"/> Guardando...</> : 'Cambiar contraseña'}
                    </button>
                  </>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
