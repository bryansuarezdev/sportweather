import React, { useState, useEffect } from 'react';

interface EmailConfirmationPendingProps {
    email: string;
    onBackToLogin: () => void;
}

const EmailConfirmationPending: React.FC<EmailConfirmationPendingProps> = ({ email, onBackToLogin }) => {
    const [countdown, setCountdown] = useState(60);

    useEffect(() => {
        // Contador que disminuye cada segundo
        const timer = setInterval(() => {
            setCountdown((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    // Intentar cerrar la ventana/pestaña
                    window.close();
                    // Si no se puede cerrar (por seguridad del navegador), volver al login
                    setTimeout(() => {
                        onBackToLogin();
                    }, 100);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        // Limpiar el intervalo cuando el componente se desmonte
        return () => clearInterval(timer);
    }, [onBackToLogin]);

    return (
        <div className="max-w-xl mx-auto py-12 px-6 bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl relative overflow-hidden animate-in fade-in duration-500">
            {/* Background gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-teal-500/5 via-transparent to-purple-500/5 pointer-events-none" />

            <div className="relative z-10">
                {/* Icon */}
                <div className="flex justify-center mb-6">
                    <div className="w-20 h-20 bg-gradient-to-br from-teal-400 to-purple-500 rounded-full flex items-center justify-center animate-pulse">
                        <span className="text-4xl">📧</span>
                    </div>
                </div>

                {/* Title */}
                <h2 className="text-3xl font-black text-white mb-3 text-center">
                    ¡Revisa tu email!
                </h2>

                {/* Subtitle */}
                <p className="text-slate-400 text-center mb-6">
                    Estás a un paso de comenzar
                </p>

                {/* Countdown Timer */}
                <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-3 mb-6 text-center">
                    <p className="text-slate-400 text-sm">
                        Esta pantalla se cerrará automáticamente en{' '}
                        <span className="text-teal-400 font-bold text-lg">{countdown}</span> segundos
                    </p>
                </div>

                {/* Main message */}
                <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6 mb-6">
                    <p className="text-white text-center mb-4">
                        Hemos enviado un email de confirmación a:
                    </p>

                    <div className="bg-slate-900 border border-teal-500/30 rounded-xl p-4 mb-4">
                        <p className="text-teal-400 font-mono text-center break-all">
                            {email}
                        </p>
                    </div>

                    <div className="space-y-3 text-sm text-slate-300">
                        <div className="flex items-start gap-3">
                            <span className="text-xl">1️⃣</span>
                            <p>Abre tu bandeja de entrada</p>
                        </div>
                        <div className="flex items-start gap-3">
                            <span className="text-xl">2️⃣</span>
                            <p>Busca el email de <strong className="text-white">SportWeather</strong></p>
                        </div>
                        <div className="flex items-start gap-3">
                            <span className="text-xl">3️⃣</span>
                            <p>Haz click en el botón <strong className="text-white">"Confirmar mi cuenta"</strong></p>
                        </div>
                    </div>
                </div>

                {/* Tips */}
                <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-4 mb-6">
                    <p className="text-orange-400 text-sm flex items-center gap-2">
                        <span>💡</span>
                        <strong>Tip:</strong>
                    </p>
                    <p className="text-orange-300 text-sm mt-2">
                        Si no ves el email en unos minutos, revisa tu carpeta de <strong>spam</strong> o <strong>correo no deseado</strong>.
                    </p>
                </div>

                {/* Actions */}
                <div className="space-y-3">
                    <button
                        onClick={onBackToLogin}
                        className="w-full bg-gradient-to-r from-teal-500 to-purple-600 text-white py-3 rounded-xl font-semibold hover:shadow-lg hover:shadow-purple-500/50 transition-all duration-300 hover:scale-[1.02]"
                    >
                        ✅ Ya confirmé mi email - Iniciar sesión
                    </button>

                    <button
                        onClick={() => window.location.reload()}
                        className="w-full bg-slate-800 border border-slate-700 text-slate-300 py-3 rounded-xl font-semibold hover:bg-slate-700 transition-all duration-300"
                    >
                        🔄 Intentar de nuevo
                    </button>
                </div>

                {/* Footer */}
                <div className="mt-6 text-center">
                    <p className="text-slate-500 text-xs">
                        ¿Problemas? Contacta a soporte en el menú principal
                    </p>
                </div>
            </div>
        </div>
    );
};

export default EmailConfirmationPending;

