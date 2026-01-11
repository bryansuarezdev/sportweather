import React, { useEffect, useState } from 'react';

interface PasswordRecoveryPendingProps {
    email: string;
    onBackToLogin: () => void;
}

const PasswordRecoveryPending: React.FC<PasswordRecoveryPendingProps> = ({ email, onBackToLogin }) => {
    const [countdown, setCountdown] = useState(5);

    useEffect(() => {
        // Countdown timer
        const timer = setInterval(() => {
            setCountdown((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    // Redirigir al login después del countdown
                    setTimeout(() => {
                        onBackToLogin();
                    }, 500);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [onBackToLogin]);

    return (
        <div className="min-h-screen bg-[#0b1215] flex items-center justify-center p-4">
            <div className="max-w-lg w-full bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-8 animate-in zoom-in duration-500">
                {/* Icon */}
                <div className="w-20 h-20 bg-gradient-to-br from-orange-400 to-red-500 rounded-full mx-auto mb-6 flex items-center justify-center animate-bounce">
                    <span className="text-4xl">📧</span>
                </div>

                {/* Title */}
                <h2 className="text-3xl font-black text-white text-center mb-4">
                    ¡Revisa tu correo!
                </h2>

                {/* Description */}
                <div className="space-y-4 mb-8">
                    <p className="text-slate-300 text-center">
                        Hemos enviado un enlace de recuperación a:
                    </p>
                    <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
                        <p className="text-teal-400 font-mono text-center break-all font-semibold">
                            {email}
                        </p>
                    </div>
                </div>

                {/* Instructions */}
                <div className="bg-gradient-to-br from-orange-500/10 to-red-500/10 border border-orange-500/30 rounded-xl p-6 space-y-3 mb-6">
                    <p className="text-slate-300 text-sm font-semibold text-center mb-3">
                        📋 Sigue estos pasos:
                    </p>
                    <ol className="text-slate-400 text-sm space-y-2 list-decimal list-inside">
                        <li>Abre tu bandeja de entrada</li>
                        <li>Busca el email de SportWeather</li>
                        <li>Haz click en el enlace de recuperación</li>
                        <li>Crea tu nueva contraseña</li>
                    </ol>
                </div>

                {/* Tips */}
                <div className="bg-slate-800/30 border border-slate-700 rounded-xl p-4 space-y-2 mb-6">
                    <p className="text-slate-400 text-xs">
                        💡 <strong className="text-slate-300">Tip:</strong> Si no ves el email en unos minutos:
                    </p>
                    <ul className="text-slate-500 text-xs space-y-1 ml-4">
                        <li>• Revisa tu carpeta de spam o correo no deseado</li>
                        <li>• Verifica que el email sea correcto</li>
                        <li>• El enlace expira en 1 hora</li>
                    </ul>
                </div>

                {/* Countdown */}
                <div className="text-center mb-6">
                    <p className="text-slate-500 text-sm">
                        Volviendo al inicio de sesión en{' '}
                        <span className="text-teal-400 font-bold text-lg">{countdown}</span> segundos...
                    </p>
                </div>

                {/* Manual return button */}
                <button
                    onClick={onBackToLogin}
                    className="w-full bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 py-3 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-2"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    <span>Volver ahora</span>
                </button>
            </div>
        </div>
    );
};

export default PasswordRecoveryPending;
