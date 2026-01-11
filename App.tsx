
import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import Onboarding from './components/Onboarding';
import Dashboard from './components/Dashboard';
import Support from './components/Support';
import AuthCallback from './components/AuthCallback';
import ResetPasswordPage from './components/ResetPasswordPage';
import { UserProfile } from './types';
import { getCurrentUserProfile, deleteUserAccount } from './services/authService';
import { supabase } from './services/supabaseClient';

type ViewMode = 'main' | 'support';

const App: React.FC = () => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<ViewMode>('main');

  // Detectar si es un callback de confirmación de email
  const isAuthCallback = window.location.hash.includes('access_token') && window.location.hash.includes('type=signup');

  // Detectar si es un callback de recuperación de contraseña
  const isPasswordRecovery = window.location.hash.includes('type=recovery');

  useEffect(() => {
    const init = async () => {
      // Solo cargar usuario si NO es un callback
      if (!isAuthCallback && !isPasswordRecovery) {
        const savedUser = await getCurrentUserProfile();
        if (savedUser) setUser(savedUser);
      }
      setLoading(false);
    };
    init();
  }, [isAuthCallback, isPasswordRecovery]);

  const handleOnboardingComplete = async (profile: UserProfile, password?: string) => {
    try {
      // El onboarding ya maneja el registro con authService
      setUser(profile);
      setView('main');
    } catch (error) {
      // Re-lanzar el error para que Onboarding lo maneje
      throw error;
    }
  };

  const handleLogin = (profile: UserProfile) => {
    // Solo establecer el usuario, no intentar guardarlo de nuevo
    setUser(profile);
    setView('main');
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setView('main');
  };

  const handleDelete = async () => {
    if (user && window.confirm('¿Estás seguro de que quieres eliminar tu cuenta permanentemente? Esta acción no se puede deshacer.')) {
      const result = await deleteUserAccount();

      if (result.success) {
        console.log('✅ Cuenta eliminada exitosamente');
        setUser(null);
        setView('main');
      } else {
        console.error('❌ Error al eliminar cuenta:', result.error);
        alert(`Error al eliminar la cuenta: ${result.error}`);
      }
    }
  };

  if (loading) {
    return (
      <div className="bg-[#0b1215] min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-10 h-10 bg-teal-500 rounded animate-bounce mx-auto"></div>
          <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">SportWeather</p>
        </div>
      </div>
    );
  }

  // Si es un callback de confirmación de email, mostrar AuthCallback
  if (isAuthCallback) {
    return (
      <AuthCallback
        onSuccess={(profile) => {
          setUser(profile);
          window.location.hash = ''; // Limpiar el hash de la URL
        }}
      />
    );
  }

  // Si es un callback de recuperación de contraseña, mostrar ResetPasswordPage
  if (isPasswordRecovery) {
    return (
      <ResetPasswordPage
        onSuccess={() => {
          // Limpiar el hash y forzar re-render para mostrar el login
          window.location.hash = '';
          // Forzar actualización del estado para volver a la pantalla de login
          window.location.reload();
        }}
      />
    );
  }

  return (
    <Layout
      user={user}
      onLogout={handleLogout}
      onViewSupport={() => setView('support')}
      onViewHome={() => setView('main')}
    >
      {view === 'support' ? (
        user ? (
          <Support user={user} onBack={() => setView('main')} />
        ) : (
          <div className="max-w-xl mx-auto py-12 px-6 bg-slate-900 border border-slate-800 rounded-3xl text-center space-y-6">
            <div className="w-20 h-20 bg-orange-500/20 rounded-full flex items-center justify-center mx-auto text-orange-400">
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
            </div>
            <h2 className="text-3xl font-black text-white">Inicia sesión para contactar a soporte</h2>
            <p className="text-slate-400">
              Para evitar spam, necesitas tener una cuenta activa para enviar mensajes al equipo de soporte.
            </p>

            {/* Contacto alternativo */}
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
              <p className="text-slate-400 text-sm mb-2">
                ¿No puedes acceder a tu cuenta?
              </p>
              <p className="text-slate-300 text-sm">
                Escríbenos directamente a:
              </p>
              <div className="flex items-center justify-center gap-2 mt-2">
                <a
                  href="mailto:bryan.end.dev@gmail.com"
                  className="text-teal-400 font-semibold hover:text-teal-300 transition-colors"
                >
                  bryan.end.dev@gmail.com
                </a>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText('bryan.end.dev@gmail.com');
                    const btn = document.getElementById('copy-email-btn');
                    if (btn) {
                      btn.textContent = '✓';
                      setTimeout(() => { btn.textContent = '📋'; }, 2000);
                    }
                  }}
                  id="copy-email-btn"
                  className="text-slate-400 hover:text-teal-400 transition-colors p-1 hover:bg-slate-700/50 rounded"
                  title="Copiar email"
                >
                  📋
                </button>
              </div>
            </div>

            <button
              onClick={() => setView('main')}
              className="bg-teal-500 text-[#0b1215] font-bold px-8 py-3 rounded-xl hover:bg-teal-400 transition-all"
            >
              Volver al inicio
            </button>
          </div>
        )
      ) : !user ? (
        <div className="min-h-[70vh] flex flex-col items-center justify-center">
          <div className="max-w-4xl text-center space-y-12">
            <div className="space-y-4">
              <span className="bg-teal-500/10 text-teal-400 px-4 py-1 rounded-full text-xs font-black uppercase tracking-widest">v1.1 Advanced Access</span>
              <h1 className="text-5xl md:text-7xl font-black text-white leading-tight">
                Eleva tu entrenamiento con <span className="text-teal-400">SportWeather</span>
              </h1>
              <p className="text-slate-400 text-lg md:text-xl max-w-2xl mx-auto">
                Accede para ver tus recomendaciones personalizadas o regístrate para empezar.
              </p>
            </div>
            <Onboarding onComplete={handleOnboardingComplete} onLogin={handleLogin} />
          </div>
        </div>
      ) : (
        <Dashboard user={user} />
      )}

      {user && view === 'main' && (
        <div className="pt-12 flex justify-center pb-8">
          <button onClick={handleDelete} className="text-slate-600 hover:text-red-500 text-sm flex items-center gap-2 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            Borrar Perfil y Datos
          </button>
        </div>
      )}
    </Layout>
  );
};

export default App;
