import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { getCurrentUserProfile } from '../services/authService';
import { UserProfile } from '../types';

interface AuthCallbackProps {
    onSuccess: (profile: UserProfile) => void;
}

const AuthCallback: React.FC<AuthCallbackProps> = ({ onSuccess }) => {
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [message, setMessage] = useState('Verificando tu email...');

    useEffect(() => {
        handleEmailConfirmation();
    }, []);

    const handleEmailConfirmation = async () => {
        try {
            // Obtener el hash de la URL (contiene el token de confirmación)
            const hashParams = new URLSearchParams(window.location.hash.substring(1));
            const accessToken = hashParams.get('access_token');
            const type = hashParams.get('type');

            console.log('🔍 Callback detectado:', { type, hasToken: !!accessToken });

            if (type === 'signup' || type === 'email') {
                setMessage('✅ Email confirmado! Cargando tu perfil...');

                // Esperar un momento para que Supabase procese la confirmación
                await new Promise(resolve => setTimeout(resolve, 1000));

                // Obtener el usuario actual
                const { data: { user }, error: userError } = await supabase.auth.getUser();

                if (userError || !user) {
                    console.error('❌ Error obteniendo usuario:', userError);
                    setStatus('error');
                    setMessage('Error al obtener tu información. Por favor intenta iniciar sesión.');
                    return;
                }

                console.log('✅ Usuario obtenido:', user.email);

                // Obtener el perfil
                const profile = await getCurrentUserProfile();

                if (!profile) {
                    console.error('❌ No se pudo obtener el perfil');
                    setStatus('error');
                    setMessage('Error al cargar tu perfil. Por favor intenta iniciar sesión.');
                    return;
                }

                console.log('✅ Perfil obtenido:', profile);

                setStatus('success');
                setMessage('¡Todo listo! Redirigiendo...');

                // Esperar un momento antes de redirigir
                setTimeout(() => {
                    onSuccess(profile);
                }, 1500);

            } else if (type === 'recovery') {
                // Recuperación de contraseña
                setMessage('Redirigiendo para cambiar tu contraseña...');
                setTimeout(() => {
                    window.location.href = '/reset-password';
                }, 1500);

            } else {
                // Tipo desconocido o no hay confirmación
                setStatus('error');
                setMessage('Link inválido o expirado. Por favor intenta de nuevo.');
            }

        } catch (error) {
            console.error('❌ Error en callback:', error);
            setStatus('error');
            setMessage('Ocurrió un error. Por favor intenta iniciar sesión manualmente.');
        }
    };

    return (
        <div className="min-h-screen bg-[#0b1215] flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-8">
                {/* Icon */}
                <div className="flex justify-center mb-6">
                    {status === 'loading' && (
                        <div className="w-20 h-20 bg-gradient-to-br from-teal-400 to-purple-500 rounded-full flex items-center justify-center animate-pulse">
                            <span className="text-4xl">⏳</span>
                        </div>
                    )}
                    {status === 'success' && (
                        <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-teal-500 rounded-full flex items-center justify-center animate-bounce">
                            <span className="text-4xl">✅</span>
                        </div>
                    )}
                    {status === 'error' && (
                        <div className="w-20 h-20 bg-gradient-to-br from-red-400 to-orange-500 rounded-full flex items-center justify-center">
                            <span className="text-4xl">❌</span>
                        </div>
                    )}
                </div>

                {/* Message */}
                <h2 className="text-2xl font-bold text-white text-center mb-4">
                    {status === 'loading' && 'Verificando...'}
                    {status === 'success' && '¡Éxito!'}
                    {status === 'error' && 'Oops...'}
                </h2>

                <p className="text-slate-300 text-center mb-6">
                    {message}
                </p>

                {/* Loading spinner */}
                {status === 'loading' && (
                    <div className="flex justify-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500"></div>
                    </div>
                )}

                {/* Error action */}
                {status === 'error' && (
                    <button
                        onClick={() => window.location.href = '/'}
                        className="w-full bg-gradient-to-r from-teal-500 to-purple-600 text-white py-3 rounded-xl font-semibold hover:shadow-lg hover:shadow-purple-500/50 transition-all duration-300"
                    >
                        Volver al inicio
                    </button>
                )}

                {/* Success animation */}
                {status === 'success' && (
                    <div className="text-center">
                        <div className="inline-block animate-bounce">
                            <span className="text-6xl">🎉</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AuthCallback;
