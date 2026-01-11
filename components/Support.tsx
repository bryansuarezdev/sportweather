
import React, { useState, useEffect } from 'react';
import { sendSupportEmail } from '../services/emailService';
import { getEmailLimitInfo } from '../services/emailLimitService';
import { UserProfile } from '../types';

const Support: React.FC<{ user: UserProfile; onBack: () => void }> = ({ user, onBack }) => {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [limitInfo, setLimitInfo] = useState('');
  const [formData, setFormData] = useState({
    name: user.username,
    email: user.email,
    subject: '',
    message: ''
  });

  // Actualizar información de límite cuando cambia el email
  useEffect(() => {
    const updateLimitInfo = async () => {
      if (formData.email) {
        const info = await getEmailLimitInfo(formData.email);
        setLimitInfo(info);
      } else {
        setLimitInfo('');
      }
    };

    updateLimitInfo();
  }, [formData.email]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await sendSupportEmail({
        userName: formData.name,
        userEmail: formData.email,
        subject: formData.subject,
        message: formData.message
      });

      setSubmitted(true);
    } catch (err: any) {
      console.error('Error enviando email:', err);

      if (err.message === 'EMAIL_NOT_CONFIGURED') {
        setError('El servicio de email no está configurado. Por favor contacta al administrador.');
      } else if (err.message === 'EMAIL_LIMIT_REACHED') {
        setError(`Has alcanzado el límite de 2 mensajes cada 7 días. ${limitInfo}`);
      } else {
        setError('Error al enviar el mensaje. Por favor intenta de nuevo.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="max-w-xl mx-auto py-12 px-6 bg-slate-900 border border-slate-800 rounded-3xl text-center space-y-6 animate-in zoom-in-95 duration-300">
        <div className="w-20 h-20 bg-teal-500/20 rounded-full flex items-center justify-center mx-auto text-teal-400">
          <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
        </div>
        <h2 className="text-3xl font-black text-white">¡Mensaje Enviado!</h2>
        <p className="text-slate-400">Hemos recibido tu consulta. El equipo de SportWeather te contactará pronto a <span className="text-teal-400 font-semibold">{formData.email}</span></p>
        <button
          onClick={() => {
            onBack();
            setSubmitted(false);
            setFormData({ name: '', email: '', subject: '', message: '' });
          }}
          className="bg-teal-500 text-[#0b1215] font-bold px-8 py-3 rounded-xl hover:bg-teal-400 transition-all"
        >
          Volver
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-12 px-6 bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl animate-in slide-in-from-bottom-4 duration-500">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-white mb-2">Soporte Técnico</h2>
          <p className="text-slate-400 text-sm">¿Tienes problemas o sugerencias? Escríbenos.</p>
        </div>
        <button onClick={onBack} className="text-slate-500 hover:text-white transition-colors">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>

      {error && (
        <div className="mb-6 bg-red-500/10 border border-red-500/30 rounded-lg p-4">
          <p className="text-red-400 text-sm font-medium">⚠️ {error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase ml-1">Nombre</label>
            <input
              required
              type="text"
              value={formData.name}
              disabled
              className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 text-slate-400 cursor-not-allowed"
              placeholder="Tu nombre"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase ml-1">Correo</label>
            <input
              required
              type="email"
              value={formData.email}
              disabled
              className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 text-slate-400 cursor-not-allowed"
              placeholder="email@ejemplo.com"
            />
            {limitInfo && (
              <p className={`text-xs ml-1 ${limitInfo.includes('alcanzado') ? 'text-red-400' : 'text-slate-500'}`}>
                ℹ️ {limitInfo}
              </p>
            )}
          </div>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-500 uppercase ml-1">Asunto</label>
          <input
            required
            type="text"
            value={formData.subject}
            onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
            className="w-full bg-[#0b1215] border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-teal-500 focus:outline-none transition-colors"
            placeholder="Ej: Error en el pronóstico"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-500 uppercase ml-1">Mensaje</label>
          <textarea
            required
            rows={4}
            value={formData.message}
            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
            className="w-full bg-[#0b1215] border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-teal-500 focus:outline-none transition-colors resize-none"
            placeholder="Describe tu problema o sugerencia..."
          />
        </div>

        <button
          disabled={loading}
          type="submit"
          className="w-full bg-teal-500 hover:bg-teal-400 disabled:opacity-50 disabled:cursor-not-allowed text-[#0b1215] font-black py-4 rounded-xl transition-all shadow-xl shadow-teal-500/10 active:scale-95 flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Enviando...
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
              Enviar al Administrador
            </>
          )}
        </button>
      </form>
    </div>
  );
};

export default Support;
