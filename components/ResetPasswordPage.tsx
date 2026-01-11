import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import { updatePassword } from '../services/authService';

interface ResetPasswordPageProps {
    onSuccess: () => void;
}

const ResetPasswordPage: React.FC<ResetPasswordPageProps> = ({ onSuccess }) => {
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [isValidToken, setIsValidToken] = useState(false);
    const [success, setSuccess] = useState(false);
    const [countdown, setCountdown] = useState(10);

    useEffect(() => {
        // Verificar si hay un token de recuperación o una sesión activa de recuperación
        const checkRecoveryToken = async () => {
            // 1. Revisar el hash (por si acaso aún está ahí)
            const hashParams = new URLSearchParams(window.location.hash.substring(1));
            const type = hashParams.get('type');

            if (type === 'recovery') {
                setIsValidToken(true);
                return;
            }

            // 2. Si el hash ya no está, preguntar a Supabase si tenemos sesión activa
            const { data: { session } } = await supabase.auth.getSession();

            // Si hay sesión, es que Supabase ya procesó el link correctamente
            if (session) {
                console.log('🔐 Sesión de recuperación detectada');
                setIsValidToken(true);
            } else {
                setError('Link de recuperación inválido o expirado. Por favor, solicita uno nuevo.');
            }
        };

        checkRecoveryToken();
    }, []);

    // Countdown cuando la contraseña se cambia exitosamente
    useEffect(() => {
        if (success) {
            const timer = setInterval(() => {
                setCountdown((prev) => {
                    if (prev <= 1) {
                        clearInterval(timer);
                        // Intentar cerrar la pestaña/ventana
                        window.close();
                        // Si no se puede cerrar (algunas restricciones del navegador), redirigir
                        setTimeout(() => {
                            onSuccess();
                        }, 500);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);

            return () => clearInterval(timer);
        }
    }, [success, onSuccess]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        // Validaciones
        if (newPassword.length < 8) {
            setError('La contraseña debe tener al menos 8 caracteres');
            return;
        }

        if (newPassword !== confirmPassword) {
            setError('Las contraseñas no coinciden');
            return;
        }

        if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(newPassword)) {
            setError('La contraseña debe contener al menos una mayúscula, una minúscula y un número');
            return;
        }

        setLoading(true);

        try {
            const result = await updatePassword(newPassword);

            if (result.success) {
                setSuccess(true);
                setLoading(false);
            } else {
                setError(result.error || 'Error al cambiar la contraseña');
                setLoading(false);
            }
        } catch (err) {
            setError('Error inesperado. Por favor intenta de nuevo.');
            setLoading(false);
        }
    };

    if (!isValidToken && !error) {
        return (
            <div className="min-h-screen bg-[#0b1215] flex items-center justify-center p-4">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500 mx-auto"></div>
                    <p className="text-slate-400 mt-4">Verificando...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0b1215] flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-8">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-red-500 rounded-full mx-auto mb-4 flex items-center justify-center">
                        <span className="text-3xl">🔑</span>
                    </div>
                    <h2 className="text-3xl font-black text-white mb-2">
                        Nueva Contraseña
                    </h2>
                    <p className="text-slate-400 text-sm">
                        Crea una contraseña segura para tu cuenta
                    </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Nueva contraseña */}
                    <div>
                        <label className="block text-slate-300 text-sm font-medium mb-2">
                            Nueva Contraseña
                        </label>
                        <input
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="w-full bg-[#0b1215] border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-teal-500 focus:outline-none transition-colors"
                            placeholder="Mínimo 8 caracteres"
                            required
                        />
                    </div>

                    {/* Confirmar contraseña */}
                    <div>
                        <label className="block text-slate-300 text-sm font-medium mb-2">
                            Confirmar Contraseña
                        </label>
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full bg-[#0b1215] border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-teal-500 focus:outline-none transition-colors"
                            placeholder="Repite tu contraseña"
                            required
                        />
                    </div>

                    {/* Requisitos */}
                    <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
                        <p className="text-slate-400 text-xs font-semibold mb-2">
                            Requisitos de la contraseña:
                        </p>
                        <ul className="text-slate-500 text-xs space-y-1">
                            <li className={newPassword.length >= 8 ? 'text-teal-400' : ''}>
                                ✓ Mínimo 8 caracteres
                            </li>
                            <li className={/[A-Z]/.test(newPassword) ? 'text-teal-400' : ''}>
                                ✓ Al menos una mayúscula
                            </li>
                            <li className={/[a-z]/.test(newPassword) ? 'text-teal-400' : ''}>
                                ✓ Al menos una minúscula
                            </li>
                            <li className={/\d/.test(newPassword) ? 'text-teal-400' : ''}>
                                ✓ Al menos un número
                            </li>
                        </ul>
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/50 rounded-xl p-4">
                            <p className="text-red-400 text-sm text-center">
                                {error}
                            </p>
                        </div>
                    )}

                    {/* Success */}
                    {success && (
                        <div className="bg-teal-500/10 border border-teal-500/50 rounded-xl p-6 space-y-3">
                            <div className="text-center">
                                <div className="w-16 h-16 bg-teal-500/20 rounded-full mx-auto mb-4 flex items-center justify-center">
                                    <span className="text-4xl">✅</span>
                                </div>
                                <p className="text-teal-400 text-lg font-bold mb-2">
                                    ¡Contraseña actualizada exitosamente!
                                </p>
                                <p className="text-teal-300 text-sm mb-4">
                                    Tu contraseña ha sido cambiada correctamente
                                </p>
                            </div>

                            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
                                <p className="text-slate-300 text-sm text-center mb-2">
                                    Esta ventana se cerrará automáticamente en:
                                </p>
                                <div className="text-center">
                                    <span className="text-5xl font-black text-teal-400 tabular-nums">
                                        {countdown}
                                    </span>
                                    <p className="text-slate-400 text-xs mt-1">segundos</p>
                                </div>
                            </div>

                            <p className="text-slate-500 text-xs text-center">
                                Puedes cerrar esta ventana manualmente si lo prefieres
                            </p>
                        </div>
                    )}

                    {/* Submit */}
                    <button
                        type="submit"
                        disabled={loading || !isValidToken}
                        className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white py-4 rounded-xl font-bold hover:shadow-lg hover:shadow-orange-500/50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <>
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                <span>Actualizando...</span>
                            </>
                        ) : (
                            <>
                                <span>🔒</span>
                                <span>Cambiar Contraseña</span>
                            </>
                        )}
                    </button>
                </form>

                {/* Help */}
                {!success && (
                    <p className="text-slate-500 text-xs text-center mt-6">
                        Después de cambiar tu contraseña, esta ventana se cerrará automáticamente
                    </p>
                )}
            </div>
        </div>
    );
};

export default ResetPasswordPage;
