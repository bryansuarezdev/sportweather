import React, { useState } from 'react';
import { signUp, signIn, validatePassword, validateEmail, validateUsername, isUsernameAvailable } from '../services/authService';
import type { SignUpData, SignInData } from '../services/authService';

interface AuthFormProps {
    onSuccess: () => void;
}

type AuthMode = 'signin' | 'signup';

const AuthForm: React.FC<AuthFormProps> = ({ onSuccess }) => {
    const [mode, setMode] = useState<AuthMode>('signin');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Form data
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [username, setUsername] = useState('');

    // Validation states
    const [emailError, setEmailError] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [usernameError, setUsernameError] = useState('');
    const [usernameChecking, setUsernameChecking] = useState(false);

    // ============================================================
    // VALIDACIONES EN TIEMPO REAL
    // ============================================================

    const handleEmailBlur = () => {
        const validation = validateEmail(email);
        setEmailError(validation.valid ? '' : validation.error || '');
    };

    const handlePasswordBlur = () => {
        if (mode === 'signup') {
            const validation = validatePassword(password);
            setPasswordError(validation.valid ? '' : validation.error || '');
        }
    };

    const handleUsernameBlur = async () => {
        if (mode === 'signup' && username) {
            // Validar formato
            const validation = validateUsername(username);
            if (!validation.valid) {
                setUsernameError(validation.error || '');
                return;
            }

            // Verificar disponibilidad
            setUsernameChecking(true);
            const available = await isUsernameAvailable(username);
            setUsernameChecking(false);

            if (!available) {
                setUsernameError(`El username "${username}" ya está en uso`);
            } else {
                setUsernameError('');
            }
        }
    };

    // ============================================================
    // MANEJO DE FORMULARIO
    // ============================================================

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            if (mode === 'signup') {
                // ========== REGISTRO ==========

                // Validar email
                const emailValidation = validateEmail(email);
                if (!emailValidation.valid) {
                    setEmailError(emailValidation.error || '');
                    setLoading(false);
                    return;
                }

                // Validar password
                const passwordValidation = validatePassword(password);
                if (!passwordValidation.valid) {
                    setPasswordError(passwordValidation.error || '');
                    setLoading(false);
                    return;
                }

                // Validar confirmación de password
                if (password !== confirmPassword) {
                    setPasswordError('Las contraseñas no coinciden');
                    setLoading(false);
                    return;
                }

                // Validar username
                const usernameValidation = validateUsername(username);
                if (!usernameValidation.valid) {
                    setUsernameError(usernameValidation.error || '');
                    setLoading(false);
                    return;
                }

                // Verificar disponibilidad de username
                const available = await isUsernameAvailable(username);
                if (!available) {
                    setUsernameError(`El username "${username}" ya está en uso`);
                    setLoading(false);
                    return;
                }

                // Registrar usuario
                const signUpData: SignUpData = {
                    email,
                    password,
                    username,
                    sports: [],
                    tolerance: 'moderate'
                };

                const result = await signUp(signUpData);

                if (!result.success) {
                    // Manejar errores específicos
                    if (result.errorType === 'EMAIL_EXISTS') {
                        setError(result.error || 'Este email ya está registrado');
                        // Sugerir cambiar a login
                        setTimeout(() => {
                            if (window.confirm('¿Quieres iniciar sesión con este email?')) {
                                setMode('signin');
                                setError('');
                            }
                        }, 1000);
                    } else if (result.errorType === 'USERNAME_EXISTS') {
                        setUsernameError(result.error || 'Username no disponible');
                    } else {
                        setError(result.error || 'Error al registrar usuario');
                    }
                    setLoading(false);
                    return;
                }

                // Éxito
                console.log('✅ Registro exitoso');
                onSuccess();

            } else {
                // ========== LOGIN ==========

                const signInData: SignInData = {
                    email,
                    password
                };

                const result = await signIn(signInData);

                if (!result.success) {
                    if (result.errorType === 'INVALID_CREDENTIALS') {
                        setError('Email o contraseña incorrectos');
                    } else {
                        setError(result.error || 'Error al iniciar sesión');
                    }
                    setLoading(false);
                    return;
                }

                // Éxito
                console.log('✅ Login exitoso');
                onSuccess();
            }

        } catch (err: any) {
            console.error('Error en formulario:', err);
            setError('Error inesperado. Por favor intenta de nuevo.');
            setLoading(false);
        }
    };

    // ============================================================
    // CAMBIAR MODO (LOGIN <-> REGISTRO)
    // ============================================================

    const toggleMode = () => {
        setMode(mode === 'signin' ? 'signup' : 'signin');
        setError('');
        setEmailError('');
        setPasswordError('');
        setUsernameError('');
        setPassword('');
        setConfirmPassword('');
    };

    // ============================================================
    // RENDER
    // ============================================================

    return (
        <div className="auth-form-container">
            <div className="auth-form-card">
                <h2 className="auth-form-title">
                    {mode === 'signin' ? '🌤️ Iniciar Sesión' : '🌤️ Crear Cuenta'}
                </h2>

                {error && (
                    <div className="auth-error-message">
                        ⚠️ {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="auth-form">
                    {/* USERNAME (solo en registro) */}
                    {mode === 'signup' && (
                        <div className="form-group">
                            <label htmlFor="username">
                                Username *
                                {usernameChecking && <span className="checking-text"> (verificando...)</span>}
                            </label>
                            <input
                                id="username"
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                onBlur={handleUsernameBlur}
                                placeholder="tu_username"
                                required
                                disabled={loading}
                                className={usernameError ? 'input-error' : ''}
                            />
                            {usernameError && (
                                <span className="field-error">{usernameError}</span>
                            )}
                            <span className="field-hint">
                                2-50 caracteres, solo letras, números y guiones bajos
                            </span>
                        </div>
                    )}

                    {/* EMAIL */}
                    <div className="form-group">
                        <label htmlFor="email">Email *</label>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            onBlur={handleEmailBlur}
                            placeholder="tu@email.com"
                            required
                            disabled={loading}
                            className={emailError ? 'input-error' : ''}
                        />
                        {emailError && (
                            <span className="field-error">{emailError}</span>
                        )}
                    </div>

                    {/* PASSWORD */}
                    <div className="form-group">
                        <label htmlFor="password">Contraseña *</label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            onBlur={handlePasswordBlur}
                            placeholder="••••••••"
                            required
                            disabled={loading}
                            className={passwordError ? 'input-error' : ''}
                        />
                        {passwordError && (
                            <span className="field-error">{passwordError}</span>
                        )}
                        {mode === 'signup' && (
                            <span className="field-hint">
                                Mínimo 8 caracteres, 1 mayúscula, 1 minúscula y 1 número
                            </span>
                        )}
                    </div>

                    {/* CONFIRM PASSWORD (solo en registro) */}
                    {mode === 'signup' && (
                        <div className="form-group">
                            <label htmlFor="confirmPassword">Confirmar Contraseña *</label>
                            <input
                                id="confirmPassword"
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="••••••••"
                                required
                                disabled={loading}
                                className={password !== confirmPassword && confirmPassword ? 'input-error' : ''}
                            />
                            {password !== confirmPassword && confirmPassword && (
                                <span className="field-error">Las contraseñas no coinciden</span>
                            )}
                        </div>
                    )}

                    {/* SUBMIT BUTTON */}
                    <button
                        type="submit"
                        disabled={loading || usernameChecking}
                        className="auth-submit-button"
                    >
                        {loading ? (
                            <>⏳ {mode === 'signin' ? 'Iniciando sesión...' : 'Creando cuenta...'}</>
                        ) : (
                            <>{mode === 'signin' ? '🔓 Iniciar Sesión' : '✨ Crear Cuenta'}</>
                        )}
                    </button>
                </form>

                {/* TOGGLE MODE */}
                <div className="auth-toggle">
                    <p>
                        {mode === 'signin' ? '¿No tienes cuenta?' : '¿Ya tienes cuenta?'}
                        {' '}
                        <button
                            type="button"
                            onClick={toggleMode}
                            disabled={loading}
                            className="auth-toggle-button"
                        >
                            {mode === 'signin' ? 'Regístrate aquí' : 'Inicia sesión aquí'}
                        </button>
                    </p>
                </div>

                {/* FORGOT PASSWORD (solo en login) */}
                {mode === 'signin' && (
                    <div className="auth-forgot-password">
                        <button
                            type="button"
                            onClick={() => alert('Funcionalidad de recuperación de contraseña próximamente')}
                            className="forgot-password-button"
                        >
                            ¿Olvidaste tu contraseña?
                        </button>
                    </div>
                )}
            </div>

            <style>{`
        .auth-form-container {
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
          padding: 20px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }

        .auth-form-card {
          background: white;
          border-radius: 16px;
          padding: 40px;
          max-width: 450px;
          width: 100%;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        }

        .auth-form-title {
          font-size: 28px;
          font-weight: bold;
          text-align: center;
          margin-bottom: 30px;
          color: #333;
        }

        .auth-error-message {
          background: #fee;
          border: 1px solid #fcc;
          color: #c33;
          padding: 12px;
          border-radius: 8px;
          margin-bottom: 20px;
          font-size: 14px;
        }

        .auth-form {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .form-group label {
          font-weight: 600;
          color: #555;
          font-size: 14px;
        }

        .checking-text {
          font-weight: normal;
          color: #999;
          font-size: 12px;
        }

        .form-group input {
          padding: 12px;
          border: 2px solid #ddd;
          border-radius: 8px;
          font-size: 16px;
          transition: border-color 0.3s;
        }

        .form-group input:focus {
          outline: none;
          border-color: #667eea;
        }

        .form-group input:disabled {
          background: #f5f5f5;
          cursor: not-allowed;
        }

        .input-error {
          border-color: #f44 !important;
        }

        .field-error {
          color: #f44;
          font-size: 13px;
          margin-top: -2px;
        }

        .field-hint {
          color: #999;
          font-size: 12px;
          margin-top: -2px;
        }

        .auth-submit-button {
          padding: 14px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: transform 0.2s, box-shadow 0.2s;
          margin-top: 10px;
        }

        .auth-submit-button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
        }

        .auth-submit-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .auth-toggle {
          text-align: center;
          margin-top: 20px;
          color: #666;
          font-size: 14px;
        }

        .auth-toggle-button {
          background: none;
          border: none;
          color: #667eea;
          font-weight: 600;
          cursor: pointer;
          text-decoration: underline;
        }

        .auth-toggle-button:hover:not(:disabled) {
          color: #764ba2;
        }

        .auth-forgot-password {
          text-align: center;
          margin-top: 10px;
        }

        .forgot-password-button {
          background: none;
          border: none;
          color: #999;
          font-size: 13px;
          cursor: pointer;
          text-decoration: underline;
        }

        .forgot-password-button:hover {
          color: #667eea;
        }
      `}</style>
        </div>
    );
};

export default AuthForm;
