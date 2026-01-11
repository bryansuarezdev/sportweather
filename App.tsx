
import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import Layout from './components/Layout';
import Onboarding from './components/Onboarding';
import Dashboard from './components/Dashboard';
import Support from './components/Support';
import AuthCallback from './components/AuthCallback';
import ResetPasswordPage from './components/ResetPasswordPage';
import ProtectedRoute from './components/ProtectedRoute';
import { UserProfile } from './types';
import { getCurrentUserProfile, deleteUserAccount } from './services/authService';
import { supabase } from './services/supabaseClient';

const App: React.FC = () => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      // 1. Manejar redirecciones de enlaces antiguos (Compatibilidad)
      if (window.location.hash.includes('type=recovery')) {
        window.location.href = `${window.location.origin}/reset-password${window.location.hash}`;
        return;
      }

      // 2. Cargar usuario si no estamos en una redirección
      const savedUser = await getCurrentUserProfile();
      if (savedUser) setUser(savedUser);
      setLoading(false);
    };
    init();
  }, []);

  const handleOnboardingComplete = (profile: UserProfile) => {
    setUser(profile);
  };

  const handleLogin = (profile: UserProfile) => {
    setUser(profile);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  const handleDelete = async () => {
    if (user && window.confirm('¿Estás seguro de que quieres eliminar tu cuenta permanentemente? Esta acción no se puede deshacer.')) {
      const result = await deleteUserAccount();

      if (result.success) {
        console.log('✅ Cuenta eliminada exitosamente');
        setUser(null);
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

  return (
    <BrowserRouter>
      <Routes>
        {/* Ruta pública: Login/Registro */}
        <Route
          path="/"
          element={
            user ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <Layout user={user} onLogout={handleLogout} onViewSupport={() => { }} onViewHome={() => { }}>
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
              </Layout>
            )
          }
        />

        {/* Ruta de callback de autenticación */}
        <Route
          path="/auth/callback"
          element={
            <AuthCallbackWrapper onSuccess={(profile) => setUser(profile)} />
          }
        />

        {/* Ruta de recuperación de contraseña */}
        <Route
          path="/reset-password"
          element={<ResetPasswordPageWrapper />}
        />

        {/* Rutas protegidas */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute user={user}>
              <DashboardWrapper user={user!} onLogout={handleLogout} onDelete={handleDelete} />
            </ProtectedRoute>
          }
        />

        <Route
          path="/support"
          element={
            <ProtectedRoute user={user}>
              <SupportWrapper user={user!} onLogout={handleLogout} />
            </ProtectedRoute>
          }
        />

        {/* Ruta 404 - Redirigir al inicio */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

// Wrappers para manejar navegación
const AuthCallbackWrapper: React.FC<{ onSuccess: (profile: UserProfile) => void }> = ({ onSuccess }) => {
  const navigate = useNavigate();

  return (
    <AuthCallback
      onSuccess={(profile) => {
        onSuccess(profile);
        navigate('/dashboard', { replace: true });
      }}
    />
  );
};

const ResetPasswordPageWrapper: React.FC = () => {
  const navigate = useNavigate();

  return (
    <ResetPasswordPage
      onSuccess={() => {
        navigate('/', { replace: true });
      }}
    />
  );
};

const DashboardWrapper: React.FC<{ user: UserProfile; onLogout: () => void; onDelete: () => void }> = ({ user, onLogout, onDelete }) => {
  const navigate = useNavigate();

  return (
    <Layout
      user={user}
      onLogout={onLogout}
      onViewSupport={() => navigate('/support')}
      onViewHome={() => navigate('/dashboard')}
    >
      <Dashboard user={user} />
      <div className="pt-12 flex justify-center pb-8">
        <button onClick={onDelete} className="text-slate-600 hover:text-red-500 text-sm flex items-center gap-2 transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
          Borrar Perfil y Datos
        </button>
      </div>
    </Layout>
  );
};

const SupportWrapper: React.FC<{ user: UserProfile; onLogout: () => void }> = ({ user, onLogout }) => {
  const navigate = useNavigate();

  return (
    <Layout
      user={user}
      onLogout={onLogout}
      onViewSupport={() => navigate('/support')}
      onViewHome={() => navigate('/dashboard')}
    >
      <Support user={user} onBack={() => navigate('/dashboard')} />
    </Layout>
  );
};

export default App;
