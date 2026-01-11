// Sistema de límite de emails de soporte con Supabase
import { supabase } from './supabaseClient';

const SUPPORT_EMAILS_KEY = 'sportweather_support_emails';
const MAX_EMAILS_PER_PERIOD = 2;
const PERIOD_DAYS = 7;

interface EmailRecord {
    email: string;
    timestamp: number;
}

interface SupabaseEmailRecord {
    id: string;
    email: string;
    sent_at: string;
    created_at: string;
}

// Helper para verificar si Supabase está configurado
const isSupabaseConfigured = (): boolean => {
    return !!(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY);
};

// ==================== SUPABASE FUNCTIONS ====================

// Limpiar registros antiguos en Supabase
const cleanOldRecordsSupabase = async (): Promise<void> => {
    const periodMs = PERIOD_DAYS * 24 * 60 * 60 * 1000;
    const cutoffDate = new Date(Date.now() - periodMs).toISOString();

    try {
        const { error } = await supabase
            .from('support_email_limits')
            .delete()
            .lt('sent_at', cutoffDate);

        if (error) {
            console.error('Error limpiando registros antiguos:', error);
        } else {
            console.log('✅ Registros antiguos limpiados en Supabase');
        }
    } catch (error) {
        console.error('Error en cleanOldRecordsSupabase:', error);
    }
};

// Verificar si un email puede enviar más mensajes (Supabase)
const canSendEmailSupabase = async (email: string): Promise<{ allowed: boolean; remaining: number; resetDate: Date | null }> => {
    try {
        // Limpiar registros antiguos primero
        await cleanOldRecordsSupabase();

        // Calcular fecha límite (7 días atrás)
        const periodMs = PERIOD_DAYS * 24 * 60 * 60 * 1000;
        const cutoffDate = new Date(Date.now() - periodMs).toISOString();

        // Obtener registros del período
        const { data: records, error } = await supabase
            .from('support_email_limits')
            .select('*')
            .eq('email', email.toLowerCase())
            .gte('sent_at', cutoffDate)
            .order('sent_at', { ascending: true });

        if (error) {
            console.error('Error consultando límites en Supabase:', error);
            throw error;
        }

        const emailsSent = records?.length || 0;
        const remaining = Math.max(0, MAX_EMAILS_PER_PERIOD - emailsSent);

        // Calcular fecha de reset
        let resetDate: Date | null = null;
        if (records && records.length > 0) {
            const oldestRecord = records[0];
            resetDate = new Date(new Date(oldestRecord.sent_at).getTime() + periodMs);
        }

        return {
            allowed: emailsSent < MAX_EMAILS_PER_PERIOD,
            remaining,
            resetDate
        };
    } catch (error) {
        console.error('Error en canSendEmailSupabase:', error);
        throw error;
    }
};

// Registrar que se envió un email (Supabase)
const recordEmailSentSupabase = async (email: string): Promise<void> => {
    try {
        const { error } = await supabase
            .from('support_email_limits')
            .insert([{
                email: email.toLowerCase(),
                sent_at: new Date().toISOString()
            }]);

        if (error) {
            console.error('Error registrando email en Supabase:', error);
            throw error;
        }

        console.log(`📧 Email registrado en Supabase para: ${email}`);
    } catch (error) {
        console.error('Error en recordEmailSentSupabase:', error);
        throw error;
    }
};

// ==================== LOCALSTORAGE FUNCTIONS (Fallback) ====================

// Obtener todos los registros de emails enviados (localStorage)
const getEmailRecordsLocal = (): EmailRecord[] => {
    try {
        const data = localStorage.getItem(SUPPORT_EMAILS_KEY);
        return data ? JSON.parse(data) : [];
    } catch (error) {
        console.error('Error leyendo registros de emails:', error);
        return [];
    }
};

// Guardar registros de emails (localStorage)
const saveEmailRecordsLocal = (records: EmailRecord[]): void => {
    try {
        localStorage.setItem(SUPPORT_EMAILS_KEY, JSON.stringify(records));
    } catch (error) {
        console.error('Error guardando registros de emails:', error);
    }
};

// Limpiar registros antiguos (localStorage)
const cleanOldRecordsLocal = (records: EmailRecord[]): EmailRecord[] => {
    const now = Date.now();
    const periodMs = PERIOD_DAYS * 24 * 60 * 60 * 1000;

    return records.filter(record => {
        const age = now - record.timestamp;
        return age < periodMs;
    });
};

// Verificar si un email puede enviar más mensajes (localStorage)
const canSendEmailLocal = (email: string): { allowed: boolean; remaining: number; resetDate: Date | null } => {
    let records = getEmailRecordsLocal();

    // Limpiar registros antiguos
    records = cleanOldRecordsLocal(records);
    saveEmailRecordsLocal(records);

    // Contar emails enviados por este correo en el período
    const userRecords = records.filter(record => record.email.toLowerCase() === email.toLowerCase());
    const emailsSent = userRecords.length;
    const remaining = Math.max(0, MAX_EMAILS_PER_PERIOD - emailsSent);

    // Calcular fecha de reset
    let resetDate: Date | null = null;
    if (userRecords.length > 0) {
        const oldestRecord = userRecords.reduce((oldest, current) =>
            current.timestamp < oldest.timestamp ? current : oldest
        );
        resetDate = new Date(oldestRecord.timestamp + (PERIOD_DAYS * 24 * 60 * 60 * 1000));
    }

    return {
        allowed: emailsSent < MAX_EMAILS_PER_PERIOD,
        remaining,
        resetDate
    };
};

// Registrar que se envió un email (localStorage)
const recordEmailSentLocal = (email: string): void => {
    let records = getEmailRecordsLocal();

    // Limpiar registros antiguos
    records = cleanOldRecordsLocal(records);

    // Agregar nuevo registro
    records.push({
        email: email.toLowerCase(),
        timestamp: Date.now()
    });

    saveEmailRecordsLocal(records);

    console.log(`📧 Email registrado en localStorage para: ${email}`);
};

// ==================== PUBLIC API (Con fallback) ====================

// Verificar si un email puede enviar más mensajes
export const canSendEmail = async (email: string): Promise<{ allowed: boolean; remaining: number; resetDate: Date | null }> => {
    if (isSupabaseConfigured()) {
        try {
            return await canSendEmailSupabase(email);
        } catch (error) {
            console.warn('⚠️ Error en Supabase, usando localStorage como fallback');
            return canSendEmailLocal(email);
        }
    } else {
        console.warn('⚠️ Supabase no configurado, usando localStorage');
        return canSendEmailLocal(email);
    }
};

// Registrar que se envió un email
export const recordEmailSent = async (email: string): Promise<void> => {
    if (isSupabaseConfigured()) {
        try {
            await recordEmailSentSupabase(email);

            // Obtener estadísticas actualizadas
            const { allowed, remaining } = await canSendEmailSupabase(email);
            console.log(`📊 Total de emails en período: ${MAX_EMAILS_PER_PERIOD - remaining}/${MAX_EMAILS_PER_PERIOD}`);
        } catch (error) {
            console.warn('⚠️ Error en Supabase, usando localStorage como fallback');
            recordEmailSentLocal(email);
            const { remaining } = canSendEmailLocal(email);
            console.log(`📊 Total de emails en período (local): ${MAX_EMAILS_PER_PERIOD - remaining}/${MAX_EMAILS_PER_PERIOD}`);
        }
    } else {
        console.warn('⚠️ Supabase no configurado, usando localStorage');
        recordEmailSentLocal(email);
        const { remaining } = canSendEmailLocal(email);
        console.log(`📊 Total de emails en período (local): ${MAX_EMAILS_PER_PERIOD - remaining}/${MAX_EMAILS_PER_PERIOD}`);
    }
};

// Obtener información de límite para mostrar al usuario
export const getEmailLimitInfo = async (email: string): Promise<string> => {
    const { allowed, remaining, resetDate } = await canSendEmail(email);

    if (allowed) {
        if (remaining === MAX_EMAILS_PER_PERIOD) {
            return `Puedes enviar hasta ${MAX_EMAILS_PER_PERIOD} mensajes cada ${PERIOD_DAYS} días.`;
        } else {
            return `Te quedan ${remaining} mensaje${remaining === 1 ? '' : 's'} disponible${remaining === 1 ? '' : 's'} en este período.`;
        }
    } else {
        if (resetDate) {
            const days = Math.ceil((resetDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
            return `Has alcanzado el límite de ${MAX_EMAILS_PER_PERIOD} mensajes. Podrás enviar más en ${days} día${days === 1 ? '' : 's'}.`;
        } else {
            return `Has alcanzado el límite de ${MAX_EMAILS_PER_PERIOD} mensajes cada ${PERIOD_DAYS} días.`;
        }
    }
};
