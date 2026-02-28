"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { motion } from "framer-motion";
import { User, Lock, ShieldCheck, Mail, CheckCircle2, AlertCircle, ArrowLeft, Camera, Loader2 } from "lucide-react";
import { createClient } from "@/src/utils/supabase/client";
import { useNotification } from "@/src/context/NotificationContext";
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from "recharts";
import Link from "next/link";
import { Database } from "@/src/types/database.types";
import Image from "next/image";

type Task = Database['public']['Tables']['tasks']['Row'];

interface CustomTooltipProps {
  active?: boolean;
  payload?: { value: number }[];
  label?: string;
}

const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900/95 backdrop-blur-md border border-slate-700 p-3 rounded-2xl shadow-xl text-white">
        <p className="font-bold text-sm mb-1">{label}</p>
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-indigo-400" />
          <span className="font-medium text-sm">{payload[0].value} completadas</span>
        </div>
      </div>
    );
  }
  return null;
};

export default function ProfilePage() {
  const supabase = createClient();
  const { notify } = useNotification();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  
  // Estados de edición y carga
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState("");
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  
  // Estados de contraseña
  const [newPassword, setNewPassword] = useState("");
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserName(user.user_metadata?.full_name || "Usuario");
        setTempName(user.user_metadata?.full_name || "Usuario");
        setUserEmail(user.email || "");
        
        // Prioridad: 1. avatar_url (custom) -> 2. picture (Google) -> null (Iniciales)
        const profilePic = user.user_metadata?.avatar_url || user.user_metadata?.picture || null;
        setAvatarUrl(profilePic);
        
        const { data } = await supabase.from('tasks').select('*');
        if (data) setTasks(data);
      }
      setIsLoading(false);
    };
    fetchUserData();
  }, [supabase]);

  // ----------------------------------------------------------------
  // LÓGICA DE AVATAR (ANTI-ERRORES Y UPLOAD)
  // ----------------------------------------------------------------
  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      if (!event.target.files || event.target.files.length === 0) return;
      
      const file = event.target.files[0];
      const MAX_SIZE_MB = 15;
      const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

      // Anti-Error 1: Tipo de archivo
      if (!file.type.startsWith('image/')) {
        notify("Solo se permiten archivos de imagen (JPG, PNG, etc)", "error");
        return;
      }

      // Anti-Error 2: Límite de peso
      if (file.size > MAX_SIZE_BYTES) {
        notify(`La imagen es muy pesada (Máximo ${MAX_SIZE_MB}MB)`, "error");
        return;
      }

      setIsUploadingAvatar(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      // Subir a Supabase Storage
      const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file);

      if (uploadError) throw uploadError;

      // Obtener URL Pública
      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath);

      // Guardar URL en los metadatos del usuario
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
      if (fileInputRef.current) fileInputRef.current.value = ""; // Resetear input
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
      setTempName(userName); // Revertir
    } else {
      setUserName(tempName);
      notify("Nombre actualizado correctamente", "success");
    }
    setIsEditingName(false);
  };

  const handleUpdatePassword = async () => {
    if (!isPasswordValid) return;
    setIsUpdatingPassword(true);
    
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    
    if (error) {
      notify("Error al actualizar la contraseña", "error");
    } else {
      notify("Contraseña protegida con éxito", "success");
      setNewPassword(""); 
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
    return <div className="flex h-[50vh] items-center justify-center animate-pulse"><div className="w-10 h-10 bg-indigo-200 rounded-full" /></div>;
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 md:space-y-8 pb-32">
      <header className="px-1 flex items-center justify-between">
        <div>
          <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-indigo-600 font-bold text-xs tracking-wider uppercase mb-2 hover:text-indigo-800 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Volver
          </Link>
          <motion.h1 initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
            Mi Perfil
          </motion.h1>
        </div>
      </header>

      {/* TARJETA DE USUARIO */}
      <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center gap-6">
        
        {/* AVATAR INTERACTIVO */}
        <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
          <div className="w-24 h-24 shrink-0 rounded-full overflow-hidden bg-linear-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white text-4xl font-black shadow-lg shadow-indigo-200 relative">
            {avatarUrl ? (
              <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              userName.charAt(0).toUpperCase()
            )}
            
            {/* OVERLAY DE CARGA O HOVER */}
            <div className={`absolute inset-0 bg-slate-900/40 flex items-center justify-center transition-opacity duration-300 ${isUploadingAvatar ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
              {isUploadingAvatar ? (
                <Loader2 className="w-8 h-8 text-white animate-spin" />
              ) : (
                <Camera className="w-8 h-8 text-white" />
              )}
            </div>
          </div>
          
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleAvatarUpload} 
            accept="image/*" 
            className="hidden" 
          />
        </div>

        <div className="flex-1 w-full text-center sm:text-left">
          {isEditingName ? (
            <div className="flex items-center gap-2 max-w-sm mx-auto sm:mx-0">
              <input 
                type="text" 
                value={tempName} 
                onChange={(e) => setTempName(e.target.value)}
                autoFocus
                onKeyDown={(e) => { if (e.key === 'Enter') handleUpdateName(); if (e.key === 'Escape') setIsEditingName(false); }}
                className="w-full bg-slate-50 border border-indigo-200 text-slate-900 font-bold text-xl rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              />
              <button onClick={handleUpdateName} className="p-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all"><CheckCircle2 className="w-5 h-5" /></button>
            </div>
          ) : (
            <h2 
              onClick={() => setIsEditingName(true)} 
              className="text-2xl font-bold text-slate-900 cursor-pointer hover:text-indigo-600 transition-colors group flex items-center justify-center sm:justify-start gap-2"
              title="Click para editar"
            >
              {userName}
              <User className="w-5 h-5 opacity-0 group-hover:opacity-100 text-indigo-400 transition-opacity" />
            </h2>
          )}
          <div className="flex items-center justify-center sm:justify-start gap-1.5 mt-2 text-slate-500">
            <Mail className="w-4 h-4" />
            <span className="text-sm font-medium">{userEmail}</span>
          </div>
        </div>
      </motion.section>

      {/* GRÁFICO DE ESTADÍSTICAS PREMIUM */}
      <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
        <div className="flex items-center gap-2 mb-6">
          <div className="p-2 bg-indigo-50 rounded-xl"><CheckCircle2 className="w-5 h-5 text-indigo-600" /></div>
          <h3 className="text-lg font-bold text-slate-900">Productividad Semanal</h3>
        </div>
        
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weeklyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }} 
                dy={10}
              />
              <Tooltip cursor={{ fill: '#f1f5f9', radius: 8 }} content={<CustomTooltip />} />
              <Bar dataKey="completadas" radius={[6, 6, 6, 6]} maxBarSize={40} animationDuration={1500}>
                {weeklyData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.name === 'Hoy' ? '#4f46e5' : '#818cf8'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.section>

      {/* SEGURIDAD - ANTI ERRORES */}
      <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 bg-rose-50 rounded-xl"><ShieldCheck className="w-5 h-5 text-rose-500" /></div>
          <h3 className="text-lg font-bold text-slate-900">Seguridad de la Cuenta</h3>
        </div>
        
        <div className="space-y-3 max-w-md">
          <label className="text-sm font-semibold text-slate-700 block">Nueva Contraseña</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Lock className="w-5 h-5" />
            </div>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="••••••••"
              className={`w-full pl-10 pr-4 py-3 bg-slate-50 border rounded-xl text-slate-900 font-medium outline-none transition-all ${
                newPassword.length > 0 && !isPasswordValid ? 'border-red-300 focus:border-red-500 focus:ring-red-200' : 
                isPasswordValid ? 'border-green-300 focus:border-green-500 focus:ring-green-200' : 
                'border-slate-200 focus:border-indigo-500 focus:ring-indigo-200'
              } focus:ring-2`}
            />
          </div>
          
          <div className="h-5 flex items-center transition-all">
            {newPassword.length > 0 && (
              isPasswordValid ? (
                <span className="flex items-center gap-1 text-xs font-bold text-green-600"><CheckCircle2 className="w-3.5 h-3.5" /> Contraseña segura</span>
              ) : (
                <span className="flex items-center gap-1 text-xs font-bold text-red-500"><AlertCircle className="w-3.5 h-3.5" /> Mínimo 6 caracteres</span>
              )
            )}
          </div>

          <button 
            onClick={handleUpdatePassword}
            disabled={!isPasswordValid || isUpdatingPassword}
            className="w-full sm:w-auto px-6 py-3 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold rounded-xl transition-all active:scale-95"
          >
            {isUpdatingPassword ? 'Guardando...' : 'Actualizar Contraseña'}
          </button>
        </div>
      </motion.section>
    </div>
  );
}