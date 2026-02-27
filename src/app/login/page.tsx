"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Lock, Eye, EyeOff, Loader2, ArrowLeft, UserPlus, KeyRound, MailCheck, RefreshCw, AlertCircle } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { sileo } from "sileo";
import { z } from "zod";
import { createClient } from "@/src/utils/supabase/client";

// Esquemas de validación
const authSchema = z.object({
  email: z.string().email("Por favor, ingresá un email válido."),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres."),
});

const resetSchema = z.object({
  email: z.string().email("Por favor, ingresá un email válido."),
});

const updatePasswordSchema = z.object({
  password: z.string().min(6, "La nueva contraseña debe tener al menos 6 caracteres."),
});

type ViewState = 'login' | 'register' | 'forgot_password' | 'check_email' | 'update_password';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  
  const [view, setView] = useState<ViewState>('login');
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  
  // Lógica de Reenvío y Seguridad
  const [resendCountdown, setResendCountdown] = useState(0);
  const [isResending, setIsResending] = useState(false);

  // Timer para el botón de reenvío
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (resendCountdown > 0) {
      timer = setInterval(() => setResendCountdown(prev => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [resendCountdown]);

  // Detectar si venimos de un mail de recuperación
  useEffect(() => {
    if (searchParams.get("view") === "update_password") {
      setView("update_password");
    }
  }, [searchParams]);

  const handleResend = async () => {
    if (resendCountdown > 0 || isResending) return;
    
    setIsResending(true);
    try {
      if (view === 'register' || view === 'check_email') {
        // En Supabase, volver a llamar a signUp con el mismo mail dispara el reenvío
        const { error } = await supabase.auth.resend({
          type: 'signup',
          email,
          options: { emailRedirectTo: `${window.location.origin}/auth/callback` }
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth/callback?next=/login?view=update_password`,
        });
        if (error) throw error;
      }
      
      sileo.success({ title: "Email reenviado con éxito." });
      setResendCountdown(60); // Bloqueo de 60 segundos por seguridad
    } catch {
      sileo.error({ title: "No se pudo reenviar. Intentá más tarde." });
    } finally {
      setIsResending(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` }
    });
    if (error) {
      sileo.error({ title: "No se pudo conectar con Google." });
      setIsGoogleLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Validación Universal
      if (view === 'login' || view === 'register') {
        authSchema.parse({ email, password });
      } else if (view === 'forgot_password') {
        resetSchema.parse({ email });
      } else if (view === 'update_password') {
        updatePasswordSchema.parse({ password });
      }

      if (view === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          if (error.message.includes("Email not confirmed")) {
            setView('check_email');
            throw new Error("Confirmá tu email antes de entrar.");
          }
          throw error;
        }
        sileo.success({ title: "¡Bienvenido de nuevo!" });
        router.push("/dashboard");

      } else if (view === 'register') {
        const { error } = await supabase.auth.signUp({ 
          email, password,
          options: { emailRedirectTo: `${window.location.origin}/auth/callback` }
        });
        if (error) throw error;
        setView('check_email');

      } else if (view === 'forgot_password') {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth/callback?next=/login?view=update_password`,
        });
        if (error) throw error;
        setView('check_email');

      } else if (view === 'update_password') {
        const { error } = await supabase.auth.updateUser({ password });
        if (error) throw error;
        sileo.success({ title: "Contraseña actualizada." });
        router.push("/dashboard");
      }

    } catch (error: unknown) {
      if (error instanceof z.ZodError) {
        sileo.error({ title: error.issues[0].message });
      } else {
        const message = error instanceof Error || (typeof error === "object" && error && "message" in error)
          ? (error as { message: string }).message
          : "Ocurrió un error.";
        sileo.error({ title: message });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const viewConfig = {
    login: { icon: <Lock />, title: "Ingresar", subtitle: "Tus tareas te esperan." },
    register: { icon: <UserPlus />, title: "Crear Cuenta", subtitle: "Unite a la productividad." },
    forgot_password: { icon: <KeyRound />, title: "¿Olvidaste tu clave?", subtitle: "Te ayudamos a recuperarla." },
    check_email: { icon: <MailCheck />, title: "Confirmá tu identidad", subtitle: "Falta un solo paso." },
    update_password: { icon: <KeyRound />, title: "Nueva clave", subtitle: "Elegí una contraseña segura." }
  };

  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans overflow-hidden">
      
      <Link href="/" className="absolute top-8 left-4 md:left-8 flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors font-medium">
        <ArrowLeft className="w-5 h-5" /> Volver al inicio
      </Link>

      <motion.div layout className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-100 p-6 md:p-8 relative">
        <div className="text-center mb-8">
          <motion.div layout className="w-14 h-14 bg-indigo-100 rounded-2xl flex items-center justify-center text-indigo-600 mx-auto mb-4 shadow-sm">
            {viewConfig[view].icon}
          </motion.div>
          <motion.h1 layout className="text-2xl font-bold text-slate-900">{viewConfig[view].title}</motion.h1>
          <motion.p layout className="text-slate-500 mt-1">{viewConfig[view].subtitle}</motion.p>
        </div>

        <AnimatePresence mode="wait">
          {view === 'check_email' ? (
            <motion.div 
              key="check_email"
              initial={{ opacity: 0, x: 20 }} 
              animate={{ opacity: 1, x: 0 }} 
              exit={{ opacity: 0, x: -20 }}
              className="text-center space-y-6"
            >
              <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-xl text-indigo-700 text-sm leading-relaxed">
                Enviamos un enlace de seguridad a <br />
                <span className="font-bold">{email}</span>.
              </div>

              <div className="flex items-center justify-center gap-2 text-xs text-slate-400 bg-slate-50 py-2 rounded-lg">
                <AlertCircle className="w-4 h-4" />
                El enlace expira en 60 minutos.
              </div>

              <div className="space-y-3">
                <p className="text-sm text-slate-500">¿No recibiste nada? Revisá Spam o:</p>
                <button 
                  onClick={handleResend}
                  disabled={resendCountdown > 0 || isResending}
                  className="flex items-center justify-center gap-2 w-full py-3 px-4 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isResending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <RefreshCw className={`w-4 h-4 ${resendCountdown > 0 ? '' : 'text-indigo-600'}`} />
                  )}
                  {resendCountdown > 0 ? `Reenviar en ${resendCountdown}s` : "Reenviar email"}
                </button>
              </div>

              <button 
                onClick={() => setView('login')} 
                className="text-sm text-slate-400 hover:text-indigo-600 transition-colors"
              >
                Volver al ingreso
              </button>
            </motion.div>
          ) : (
            <>
            <motion.form 
              key="form"
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              onSubmit={handleSubmit} 
              className="space-y-4"
            >
              {view !== 'update_password' && (
                <div className="relative">
                  <Mail className="absolute left-3 top-3.5 w-5 h-5 text-slate-400" />
                  <input 
                    type="email" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    placeholder="tu@email.com" 
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:bg-white transition-all outline-none" 
                    required 
                  />
                </div>
              )}
              
              {view !== 'forgot_password' && (
                <div className="relative">
                  <Lock className="absolute left-3 top-3.5 w-5 h-5 text-slate-400" />
                  <input 
                    type={showPassword ? "text" : "password"} 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                    placeholder={view === 'update_password' ? "Nueva contraseña" : "Tu contraseña"} 
                    className="w-full pl-10 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:bg-white transition-all outline-none" 
                    required 
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3.5 text-slate-400 hover:text-slate-600 transition-colors">
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              )}

              <button 
                disabled={isLoading} 
                className="w-full py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 active:scale-[0.98] transition-all disabled:opacity-70 shadow-lg shadow-indigo-100"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                ) : (
                  view === 'update_password' ? "Actualizar contraseña" : "Continuar"
                )}
              </button>
            </motion.form>

            {(view === 'login' || view === 'register') && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4">
                <div className="relative flex items-center py-2">
                  <div className="grow border-t border-slate-200"></div>
                  <span className="shrink-0 mx-4 text-slate-400 text-sm">O continuá con</span>
                  <div className="grow border-t border-slate-200"></div>
                </div>
                <button 
                  type="button" 
                  onClick={handleGoogleLogin} 
                  disabled={isLoading || isGoogleLoading} 
                  className="w-full mt-2 flex items-center justify-center gap-3 py-3 px-4 bg-white border border-slate-200 text-slate-700 rounded-2xl font-medium hover:bg-slate-50 active:scale-95 transition-all shadow-sm disabled:opacity-50"
                >
                  {isGoogleLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                    </svg>
                  )}
                  Google
                </button>
              </motion.div>
            )}
            </>
          )}
        </AnimatePresence>

        {view === 'login' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-8 text-center space-y-4">
            <p className="text-sm text-slate-500">
              ¿No tenés cuenta?{" "}
              <button onClick={() => setView('register')} className="text-indigo-600 font-bold hover:underline">Registrate gratis</button>
            </p>
            <button onClick={() => setView('forgot_password')} className="text-xs text-slate-400 hover:text-slate-600 transition-colors">
              Olvidé mi contraseña
            </button>
          </motion.div>
        )}
      </motion.div>
    </main>
  );
}