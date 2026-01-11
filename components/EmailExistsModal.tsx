import React from 'react';

interface EmailExistsModalProps {
    email: string;
    onLogin: () => void;
    onResetPassword: () => void;
    onCancel: () => void;
}

const EmailExistsModal: React.FC<EmailExistsModalProps> = ({ email, onLogin, onResetPassword, onCancel }) => {
    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
            <div className="bg-slate-900 border-2 border-orange-500/50 rounded-2xl max-w-md w-full shadow-2xl shadow-orange-500/20 animate-in zoom-in duration-300">
                {/* Header */}
                <div className="bg-gradient-to-r from-orange-500 to-red-500 p-6 rounded-t-2xl text-center">
                    <div className="w-16 h-16 bg-white/20 rounded-full mx-auto mb-4 flex items-center justify-center">
                        <span className="text-4xl">⚠️</span>
                    </div>
                    <h3 className="text-2xl font-bold text-white">
                        Email ya registrado
                    </h3>
                </div>

                {/* Content */}
                <div className="p-6 space-y-4">
                    <p className="text-slate-300 text-center">
                        El email <strong className="text-white font-mono break-all">{email}</strong> ya está asociado a una cuenta.
                    </p>

                    <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
                        <p className="text-slate-400 text-sm text-center">
                            ¿Qué deseas hacer?
                        </p>
                    </div>

                    {/* Actions */}
                    <div className="space-y-3">
                        {/* Login */}
                        <button
                            onClick={onLogin}
                            className="w-full bg-gradient-to-r from-teal-500 to-purple-600 text-white py-3 px-4 rounded-xl font-semibold hover:shadow-lg hover:shadow-purple-500/50 transition-all duration-300 hover:scale-[1.02] flex items-center justify-center gap-2"
                        >
                            <span>🔓</span>
                            <span>Iniciar sesión con esta cuenta</span>
                        </button>

                        {/* Reset Password */}
                        <button
                            onClick={onResetPassword}
                            className="w-full bg-slate-800 border-2 border-orange-500/50 text-orange-400 py-3 px-4 rounded-xl font-semibold hover:bg-slate-700 hover:border-orange-500 transition-all duration-300 flex items-center justify-center gap-2"
                        >
                            <span>🔑</span>
                            <span>Recuperar mi contraseña</span>
                        </button>

                        {/* Cancel */}
                        <button
                            onClick={onCancel}
                            className="w-full bg-transparent border border-slate-700 text-slate-400 py-3 px-4 rounded-xl font-semibold hover:bg-slate-800 hover:text-white transition-all duration-300"
                        >
                            Usar otro email
                        </button>
                    </div>

                    {/* Help text */}
                    <p className="text-slate-500 text-xs text-center mt-4">
                        Si no recuerdas haber creado una cuenta, intenta recuperar tu contraseña
                    </p>
                </div>
            </div>
        </div>
    );
};

export default EmailExistsModal;
