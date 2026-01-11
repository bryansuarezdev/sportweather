
import React, { useState } from 'react';
import { UserProfile, ToleranceLevel } from '../types';
import { MANDATORY_SPORTS } from '../constants';
import { signIn, signUp, validatePassword, resetPassword } from '../services/authService';
import EmailConfirmationPending from './EmailConfirmationPending';
import EmailExistsModal from './EmailExistsModal';
import PasswordRecoveryPending from './PasswordRecoveryPending';

interface OnboardingProps {
  onComplete: (profile: UserProfile) => void;
  onLogin: (profile: UserProfile) => void;
}

const Onboarding: React.FC<OnboardingProps> = ({ onComplete, onLogin }) => {
  const [isLoginMode, setIsLoginMode] = useState(false);
  const [step, setStep] = useState(1);
  const [emailPendingConfirmation, setEmailPendingConfirmation] = useState<string | null>(null);
  const [passwordRecoveryEmail, setPasswordRecoveryEmail] = useState<string | null>(null);
  const [showEmailExistsModal, setShowEmailExistsModal] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    tolerance: 'moderate' as ToleranceLevel,
    selectedSports: [] as string[],
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateStep1 = () => {
    const newErrors: Record<string, string> = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (formData.username.length < 2) newErrors.username = 'Mínimo 2 caracteres';
    if (!emailRegex.test(formData.email)) newErrors.email = 'Email inválido';

    // Usar la validación de password de authService
    const passwordValidation = validatePassword(formData.password);
    if (!passwordValidation.valid) {
      newErrors.password = passwordValidation.error || 'Contraseña inválida';
    }

    if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'No coinciden';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    try {
      const result = await signIn({
        email: formData.email,
        password: formData.password
      });

      if (result.success && result.profile) {
        onLogin(result.profile as UserProfile);
      } else {
        if (result.errorType === 'INVALID_CREDENTIALS') {
          // Verificar si es por email no confirmado
          if (result.error && result.error.includes('Email not confirmed')) {
            setErrors({
              login: `📧 Tu email aún no ha sido confirmado.
              
Por favor, revisa tu bandeja de entrada (${formData.email}) y haz click en el enlace de confirmación.

💡 Si no ves el email, revisa tu carpeta de spam.`
            });
          } else {
            setErrors({ login: 'Email o contraseña incorrectos' });
          }
        } else {
          setErrors({ login: result.error || 'Error al iniciar sesión' });
        }
        setFormData({ ...formData, password: '' });
      }
    } catch (error: any) {
      setFormData({ ...formData, password: '' });
      setErrors({ login: 'Error al iniciar sesión. Intenta de nuevo.' });
    }
  };

  const toggleSport = (sportId: string) => {
    setFormData(prev => ({
      ...prev,
      selectedSports: prev.selectedSports.includes(sportId)
        ? prev.selectedSports.filter(id => id !== sportId)
        : [...prev.selectedSports, sportId]
    }));
  };

  const handleNext = async () => {
    if (step === 1 && validateStep1()) {
      setStep(2);
    } else if (step === 2) {
      if (formData.selectedSports.length === 0) {
        setErrors({ sports: 'Selecciona al menos un deporte' });
      } else {
        setErrors({});
        setStep(3);
      }
    } else if (step === 3) {
      try {
        const result = await signUp({
          email: formData.email,
          password: formData.password,
          username: formData.username,
          sports: formData.selectedSports,
          tolerance: formData.tolerance
        });

        if (result.success) {
          // Verificar si el usuario necesita confirmar su email
          if (result.user && !result.user.email_confirmed_at) {
            // Email no confirmado - mostrar pantalla de confirmación
            setEmailPendingConfirmation(formData.email);
          } else if (result.profile) {
            // Email confirmado o confirmación desactivada - continuar
            onComplete(result.profile as UserProfile);
          } else {
            setErrors({
              general: 'Error al obtener el perfil. Por favor intenta iniciar sesión.'
            });
          }
        } else {
          if (result.errorType === 'EMAIL_EXISTS') {
            // Mostrar modal con opciones
            setShowEmailExistsModal(true);
            setFormData({
              ...formData,
              password: '',
              confirmPassword: ''
            });
          } else if (result.errorType === 'USERNAME_EXISTS') {
            setErrors({
              username: 'Este nombre de usuario ya está en uso. Elige otro.'
            });
            setFormData({
              ...formData,
              password: '',
              confirmPassword: ''
            });
            setStep(1);
          } else {
            setErrors({
              general: result.error || 'Error al registrar usuario'
            });
          }
        }
      } catch (error: any) {
        setErrors({
          general: 'Error inesperado. Por favor intenta de nuevo.'
        });
      }
    }
  };

  // Mostrar pantalla de recuperación de contraseña si está pendiente
  if (passwordRecoveryEmail) {
    return (
      <PasswordRecoveryPending
        email={passwordRecoveryEmail}
        onBackToLogin={() => {
          setPasswordRecoveryEmail(null);
          setIsLoginMode(true);
        }}
      />
    );
  }

  // Mostrar pantalla de confirmación de email si está pendiente
  if (emailPendingConfirmation) {
    return (
      <EmailConfirmationPending
        email={emailPendingConfirmation}
        onBackToLogin={() => {
          setEmailPendingConfirmation(null);
          setIsLoginMode(true);
        }}
      />
    );
  }

  if (isLoginMode) {
    return (
      <div className="max-w-xl mx-auto py-12 px-6 bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl relative overflow-hidden animate-in fade-in duration-500">
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-black text-white mb-2">Bienvenido de nuevo</h2>
          <p className="text-slate-400 text-sm">Ingresa tus credenciales para acceder</p>
        </div>
        <form onSubmit={handleLogin} className="space-y-4">
          <input
            type="email"
            placeholder="Correo electrónico"
            required
            className="w-full bg-[#0b1215] border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-teal-500 focus:outline-none transition-colors"
            value={formData.email}
            onChange={e => setFormData({ ...formData, email: e.target.value })}
          />
          <input
            type="password"
            placeholder="Contraseña"
            required
            className="w-full bg-[#0b1215] border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-teal-500 focus:outline-none transition-colors"
            value={formData.password}
            onChange={e => setFormData({ ...formData, password: e.target.value })}
          />

          {errors.login && (
            <div className="space-y-2">
              {errors.login === 'USER_NOT_FOUND' ? (
                <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-4 space-y-3">
                  <p className="text-orange-400 text-sm font-medium text-center">
                    ⚠️ Usuario o correo no registrado
                  </p>
                  <p className="text-orange-300 text-xs text-center">
                    No encontramos una cuenta con este correo electrónico.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setIsLoginMode(false);
                      setErrors({});
                    }}
                    className="w-full bg-orange-500 hover:bg-orange-400 text-white font-bold py-3 px-4 rounded-lg text-sm transition-all flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                    </svg>
                    Crear Cuenta Nueva
                  </button>
                </div>
              ) : (
                <p className="text-red-500 text-xs text-center font-bold bg-red-500/10 py-2 rounded-lg">
                  {errors.login}
                </p>
              )}
            </div>
          )}
          <button
            type="submit"
            className="w-full bg-teal-500 hover:bg-teal-400 text-[#0b1215] font-black py-4 rounded-xl transition-all shadow-xl shadow-teal-500/10 active:scale-95"
          >
            Iniciar Sesión
          </button>

          {/* Forgot Password Button */}
          <button
            type="button"
            onClick={async () => {
              if (!formData.email) {
                setErrors({ login: 'Por favor ingresa tu email primero' });
                return;
              }

              const result = await resetPassword(formData.email);
              if (result.success) {
                setPasswordRecoveryEmail(formData.email);
                setErrors({});
              } else {
                setErrors({ login: result.error || 'Error al enviar email de recuperación' });
              }
            }}
            className="w-full text-slate-500 hover:text-teal-400 text-sm font-medium transition-colors"
          >
            ¿Olvidaste tu contraseña?
          </button>

          <p className="text-center text-slate-500 text-sm">
            ¿No tienes cuenta? <button type="button" onClick={() => { setIsLoginMode(false); setErrors({}); }} className="text-teal-400 font-bold hover:underline">Regístrate</button>
          </p>
        </form>
      </div>
    );
  }

  return (
    <>
      <div className="max-w-xl mx-auto py-12 px-6 bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl relative overflow-hidden animate-in slide-in-from-bottom-4 duration-500">
        <div className="absolute top-0 inset-x-0 h-1.5 bg-slate-800">
          <div
            className="h-full bg-teal-500 transition-all duration-500 ease-out"
            style={{ width: `${(step / 3) * 100}%` }}
          ></div>
        </div>

        <div className="mb-8 text-center">
          <h2 className="text-3xl font-black text-white mb-2">
            {step === 1 ? 'Crea tu cuenta' : step === 2 ? 'Tus Deportes' : 'Ajustes finales'}
          </h2>
          <p className="text-slate-400 text-sm">
            {step === 1 ? 'Paso 1: Credenciales de acceso' : step === 2 ? 'Paso 2: ¿Qué deportes practicas?' : 'Paso 3: Nivel de exigencia climática'}
          </p>
        </div>

        <div className="space-y-6">
          {step === 1 && (
            <div className="space-y-4">
              <div className="space-y-1">
                <input
                  type="text"
                  placeholder="Nombre de usuario"
                  className="w-full bg-[#0b1215] border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-teal-500 focus:outline-none transition-colors"
                  value={formData.username}
                  onChange={e => setFormData({ ...formData, username: e.target.value })}
                />
                {errors.username && <p className="text-red-500 text-[10px] ml-1 uppercase font-bold">{errors.username}</p>}
              </div>
              <div className="space-y-1">
                <input
                  type="email"
                  placeholder="Correo electrónico"
                  className={`w-full bg-[#0b1215] border rounded-xl px-4 py-3 text-white focus:outline-none transition-colors ${errors.email ? 'border-red-500 focus:border-red-500' : 'border-slate-800 focus:border-teal-500'
                    }`}
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                />
                {errors.email && (
                  <div className="space-y-2">
                    <p className="text-red-500 text-[10px] ml-1 uppercase font-bold">{errors.email}</p>
                    {errors.email.includes('ya está registrado') && (
                      <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 space-y-2">
                        <p className="text-red-400 text-xs font-medium">
                          ⚠️ Este correo ya tiene una cuenta asociada
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            setIsLoginMode(true);
                            setErrors({});
                          }}
                          className="w-full bg-red-500 hover:bg-red-400 text-white font-bold py-2 px-4 rounded-lg text-xs transition-all"
                        >
                          Ir a Iniciar Sesión →
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <input
                    type="password"
                    placeholder="Contraseña"
                    className="w-full bg-[#0b1215] border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-teal-500 focus:outline-none transition-colors"
                    value={formData.password}
                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                  />
                  {errors.password && <p className="text-red-500 text-[10px] ml-1 uppercase font-bold leading-tight">{errors.password}</p>}
                </div>
                <div className="space-y-1">
                  <input
                    type="password"
                    placeholder="Repetir contraseña"
                    className="w-full bg-[#0b1215] border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-teal-500 focus:outline-none transition-colors"
                    value={formData.confirmPassword}
                    onChange={e => setFormData({ ...formData, confirmPassword: e.target.value })}
                  />
                  {errors.confirmPassword && <p className="text-red-500 text-[10px] ml-1 uppercase font-bold">{errors.confirmPassword}</p>}
                </div>
              </div>
              <p className="text-center text-slate-500 text-sm">
                ¿Ya tienes cuenta? <button type="button" onClick={() => setIsLoginMode(true)} className="text-teal-400 font-bold hover:underline">Inicia Sesión</button>
              </p>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <p className="text-slate-500 text-xs italic text-center">Selecciona los deportes que practicas para recibir recomendaciones:</p>
              <div className="grid grid-cols-2 gap-3 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
                {MANDATORY_SPORTS.map(sport => {
                  const isSelected = formData.selectedSports.includes(sport.id);
                  return (
                    <button
                      key={sport.id}
                      onClick={() => toggleSport(sport.id)}
                      className={`p-3 rounded-xl flex items-center gap-3 border transition-all text-left ${isSelected
                        ? 'bg-teal-500/20 border-teal-500 text-teal-400 shadow-[0_0_15px_rgba(20,184,166,0.1)]'
                        : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:border-slate-500'
                        }`}
                    >
                      <span className="text-xl">{sport.icon}</span>
                      <span className="font-medium text-sm">{sport.name}</span>
                    </button>
                  );
                })}
              </div>
              {errors.sports && <p className="text-red-500 text-center text-xs font-bold uppercase">{errors.sports}</p>}
            </div>
          )}

          {step === 3 && (
            <div className="space-y-8 py-4">
              <div className="space-y-4">
                <label className="text-white font-bold block text-center">Tolerancia al Clima</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['low', 'moderate', 'high'] as ToleranceLevel[]).map(level => (
                    <button
                      key={level}
                      onClick={() => setFormData({ ...formData, tolerance: level })}
                      className={`py-3 rounded-xl font-bold text-xs uppercase transition-all ${formData.tolerance === level
                        ? 'bg-teal-500 text-[#0b1215] shadow-lg shadow-teal-500/20'
                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                        }`}
                    >
                      {level === 'low' ? 'Baja' : level === 'moderate' ? 'Media' : 'Alta'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          <button
            onClick={handleNext}
            className="w-full bg-teal-500 hover:bg-teal-400 text-[#0b1215] font-black py-4 rounded-xl transition-all shadow-xl shadow-teal-500/10 active:scale-95 flex items-center justify-center gap-2"
          >
            {step === 3 ? 'Finalizar Registro' : 'Continuar'}
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
          </button>

          {step > 1 && (
            <button onClick={() => setStep(step - 1)} className="w-full text-slate-500 hover:text-white text-sm font-medium">Volver</button>
          )}
        </div>
      </div>

      {/* Modal de email existente */}
      {
        showEmailExistsModal && (
          <EmailExistsModal
            email={formData.email}
            onLogin={() => {
              setShowEmailExistsModal(false);
              setIsLoginMode(true);
              setStep(1);
              setFormData({
                ...formData,
                password: '',
                confirmPassword: ''
              });
            }}
            onResetPassword={async () => {
              const result = await resetPassword(formData.email);
              if (result.success) {
                setShowEmailExistsModal(false);
                setPasswordRecoveryEmail(formData.email);
                setStep(1);
                setFormData({
                  username: '',
                  email: '',
                  password: '',
                  confirmPassword: '',
                  tolerance: 'moderate' as ToleranceLevel,
                  selectedSports: [] as string[],
                });
                setErrors({});
              } else {
                alert(`❌ Error: ${result.error}`);
              }
            }}
            onCancel={() => {
              setShowEmailExistsModal(false);
              setStep(1);
              setFormData({
                username: '',
                email: '',
                password: '',
                confirmPassword: '',
                tolerance: 'moderate' as ToleranceLevel,
                selectedSports: [] as string[],
              });
            }}
          />
        )}
    </>
  );
};

export default Onboarding;
