// ============================================================
// SERVICIO DE AUTENTICACIÓN CON SUPABASE AUTH
// ============================================================
// Este servicio maneja toda la lógica de autenticación usando
// Supabase Auth nativo con validaciones y manejo de errores
// ============================================================

import { supabase } from './supabaseClient';
import type { User, AuthError } from '@supabase/supabase-js';

// ============================================================
// TIPOS
// ============================================================

export interface UserProfile {
    id: string;
    username: string;
    email: string;
    sports: string[];
    tolerance: 'low' | 'moderate' | 'high';
    created_at: string;
    updated_at: string;
}

export interface SignUpData {
    email: string;
    password: string;
    username: string;
    sports?: string[];
    tolerance?: 'low' | 'moderate' | 'high';
}

export interface SignInData {
    email: string;
    password: string;
}

export interface AuthResult {
    success: boolean;
    user?: User;
    profile?: UserProfile;
    error?: string;
    errorType?: 'EMAIL_EXISTS' | 'USERNAME_EXISTS' | 'WEAK_PASSWORD' | 'INVALID_CREDENTIALS' | 'NETWORK_ERROR' | 'UNKNOWN';
}

// ============================================================
// VALIDACIONES
// ============================================================

/**
 * Valida el formato y fortaleza de la contraseña
 * Requisitos: +8 caracteres, 1 número, 1 mayúscula, 1 minúscula
 */
export const validatePassword = (password: string): { valid: boolean; error?: string } => {
    if (password.length < 8) {
        return { valid: false, error: 'La contraseña debe tener al menos 8 caracteres' };
    }

    if (!/[A-Z]/.test(password)) {
        return { valid: false, error: 'La contraseña debe contener al menos una mayúscula' };
    }

    if (!/[a-z]/.test(password)) {
        return { valid: false, error: 'La contraseña debe contener al menos una minúscula' };
    }

    if (!/[0-9]/.test(password)) {
        return { valid: false, error: 'La contraseña debe contener al menos un número' };
    }

    return { valid: true };
};

/**
 * Valida el formato del email
 */
export const validateEmail = (email: string): { valid: boolean; error?: string } => {
    const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

    if (!emailRegex.test(email)) {
        return { valid: false, error: 'El formato del email no es válido' };
    }

    return { valid: true };
};

/**
 * Valida el username
 */
export const validateUsername = (username: string): { valid: boolean; error?: string } => {
    if (username.length < 2 || username.length > 50) {
        return { valid: false, error: 'El username debe tener entre 2 y 50 caracteres' };
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
        return { valid: false, error: 'El username solo puede contener letras, números y guiones bajos' };
    }

    return { valid: true };
};

// ============================================================
// FUNCIONES AUXILIARES
// ============================================================

/**
 * Verifica si un username está disponible
 */
export const isUsernameAvailable = async (username: string): Promise<boolean> => {
    try {
        const { data, error } = await supabase
            .rpc('is_username_available', { check_username: username });

        if (error) {
            console.error('Error verificando username:', error);
            return false;
        }

        return data === true;
    } catch (error) {
        console.error('Error en isUsernameAvailable:', error);
        return false;
    }
};

/**
 * Obtiene el perfil del usuario actual
 */
export const getCurrentUserProfile = async (): Promise<UserProfile | null> => {
    try {
        // Obtener usuario actual
        const { data: { user }, error: userError } = await supabase.auth.getUser();

        if (userError) {
            // Si es un error de sesión faltante, es normal (usuario no logueado)
            if (userError.message?.includes('session') || userError.message?.includes('Auth session missing')) {
                return null;
            }
            console.error('Error obteniendo usuario:', userError);
            return null;
        }

        if (!user) {
            return null;
        }

        // Obtener perfil de la tabla profiles
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

        if (error) {
            console.error('Error obteniendo perfil:', error);
            return null;
        }

        return data as UserProfile;
    } catch (error: any) {
        // Si es un error de sesión faltante, es normal (usuario no logueado)
        if (error?.message?.includes('session') || error?.message?.includes('Auth session missing')) {
            return null;
        }
        console.error('Error en getCurrentUserProfile:', error);
        return null;
    }
};

// ============================================================
// REGISTRO (SIGN UP)
// ============================================================

/**
 * Registra un nuevo usuario con Supabase Auth
 * 
 * Flujo:
 * 1. Valida email, password y username
 * 2. Verifica que el email no esté ya registrado
 * 3. Verifica que el username esté disponible
 * 4. Crea el usuario en auth.users con signUp
 * 5. El trigger automático crea el perfil en public.profiles
 * 6. Actualiza el perfil con sports y tolerance
 */
export const signUp = async (data: SignUpData): Promise<AuthResult> => {
    try {
        // 1. Validar email
        const emailValidation = validateEmail(data.email);
        if (!emailValidation.valid) {
            return {
                success: false,
                error: emailValidation.error,
                errorType: 'WEAK_PASSWORD'
            };
        }

        // 2. Validar password
        const passwordValidation = validatePassword(data.password);
        if (!passwordValidation.valid) {
            return {
                success: false,
                error: passwordValidation.error,
                errorType: 'WEAK_PASSWORD'
            };
        }

        // 3. Validar username
        const usernameValidation = validateUsername(data.username);
        if (!usernameValidation.valid) {
            return {
                success: false,
                error: usernameValidation.error,
                errorType: 'USERNAME_EXISTS'
            };
        }

        // 4. Verificar si el email ya existe en profiles
        const { data: existingProfile, error: checkError } = await supabase
            .from('profiles')
            .select('email')
            .eq('email', data.email.toLowerCase())
            .maybeSingle();

        if (checkError && checkError.code !== 'PGRST116') {
            console.error('Error verificando email:', checkError);
        }

        if (existingProfile) {
            return {
                success: false,
                error: 'Este email ya está registrado. ¿Quieres iniciar sesión o recuperar tu contraseña?',
                errorType: 'EMAIL_EXISTS'
            };
        }

        // 5. Verificar disponibilidad de username
        const usernameAvailable = await isUsernameAvailable(data.username);
        if (!usernameAvailable) {
            return {
                success: false,
                error: `El username "${data.username}" ya está en uso`,
                errorType: 'USERNAME_EXISTS'
            };
        }

        // 6. Crear usuario en Supabase Auth
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email: data.email,
            password: data.password,
            options: {
                data: {
                    username: data.username,
                    sports: data.sports || [],
                    tolerance: data.tolerance || 'moderate'
                }
            }
        });

        // 7. Manejar errores de autenticación
        if (authError) {
            console.error('Error en signUp:', authError);

            // Email ya existe (incluso si no está confirmado)
            if (authError.message.includes('already registered') ||
                authError.message.includes('already exists') ||
                authError.message.includes('User already registered') ||
                authError.status === 422) {
                return {
                    success: false,
                    error: 'Este email ya está registrado. ¿Quieres iniciar sesión o recuperar tu contraseña?',
                    errorType: 'EMAIL_EXISTS'
                };
            }

            // Contraseña débil
            if (authError.message.includes('password')) {
                return {
                    success: false,
                    error: 'La contraseña no cumple con los requisitos de seguridad',
                    errorType: 'WEAK_PASSWORD'
                };
            }

            return {
                success: false,
                error: authError.message,
                errorType: 'UNKNOWN'
            };
        }

        if (!authData.user) {
            return {
                success: false,
                error: 'No se pudo crear el usuario',
                errorType: 'UNKNOWN'
            };
        }

        console.log('✅ Usuario creado en auth.users:', authData.user.email);

        // 8. Esperar a que el trigger cree el perfil (máximo 5 segundos)
        let profile = null;
        let attempts = 0;
        const maxAttempts = 10;

        while (!profile && attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 500)); // Esperar 500ms

            const { data: profileData } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', authData.user.id)
                .maybeSingle();

            if (profileData) {
                profile = profileData;
                console.log('✅ Perfil encontrado en profiles');
                break;
            }

            attempts++;
        }

        if (!profile) {
            console.warn('⚠️ Perfil no encontrado después de esperar, continuando...');
        }

        // 9. Actualizar perfil con sports y tolerance
        if (data.sports || data.tolerance) {
            console.log('📝 Actualizando perfil con:', { sports: data.sports, tolerance: data.tolerance });

            const { data: updatedProfile, error: updateError } = await supabase
                .from('profiles')
                .update({
                    sports: data.sports || [],
                    tolerance: data.tolerance || 'moderate'
                })
                .eq('id', authData.user.id)
                .select()
                .single();

            if (updateError) {
                console.error('❌ Error actualizando perfil:', updateError);
            } else {
                console.log('✅ Perfil actualizado:', updatedProfile);
                profile = updatedProfile;
            }
        }

        // 10. Obtener perfil completo final
        if (!profile) {
            profile = await getCurrentUserProfile();
        }

        console.log('✅ Registro completado exitosamente');

        return {
            success: true,
            user: authData.user,
            profile: profile || undefined
        };

    } catch (error: any) {
        console.error('❌ Error inesperado en signUp:', error);
        return {
            success: false,
            error: 'Error de conexión. Por favor intenta de nuevo.',
            errorType: 'NETWORK_ERROR'
        };
    }
};

// ============================================================
// INICIO DE SESIÓN (SIGN IN)
// ============================================================

/**
 * Inicia sesión con email y contraseña
 */
export const signIn = async (data: SignInData): Promise<AuthResult> => {
    try {
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email: data.email,
            password: data.password
        });

        if (authError) {
            console.error('Error en signIn:', authError);

            // Email no confirmado
            if (authError.message.includes('Email not confirmed') || authError.message.includes('not confirmed')) {
                return {
                    success: false,
                    error: 'Email not confirmed',
                    errorType: 'INVALID_CREDENTIALS'
                };
            }

            // Credenciales inválidas
            if (authError.message.includes('Invalid') || authError.message.includes('credentials')) {
                return {
                    success: false,
                    error: 'Email o contraseña incorrectos',
                    errorType: 'INVALID_CREDENTIALS'
                };
            }

            return {
                success: false,
                error: authError.message,
                errorType: 'UNKNOWN'
            };
        }

        if (!authData.user) {
            return {
                success: false,
                error: 'No se pudo iniciar sesión',
                errorType: 'UNKNOWN'
            };
        }

        // Obtener perfil
        const profile = await getCurrentUserProfile();

        console.log('✅ Sesión iniciada:', authData.user.email);

        return {
            success: true,
            user: authData.user,
            profile: profile || undefined
        };

    } catch (error: any) {
        console.error('Error inesperado en signIn:', error);
        return {
            success: false,
            error: 'Error de conexión. Por favor intenta de nuevo.',
            errorType: 'NETWORK_ERROR'
        };
    }
};

// ============================================================
// CERRAR SESIÓN (SIGN OUT)
// ============================================================

/**
 * Cierra la sesión del usuario actual
 */
export const signOut = async (): Promise<{ success: boolean; error?: string }> => {
    try {
        const { error } = await supabase.auth.signOut();

        if (error) {
            console.error('Error en signOut:', error);
            return {
                success: false,
                error: error.message
            };
        }

        console.log('✅ Sesión cerrada');

        return { success: true };

    } catch (error: any) {
        console.error('Error inesperado en signOut:', error);
        return {
            success: false,
            error: 'Error al cerrar sesión'
        };
    }
};

// ============================================================
// OBTENER USUARIO ACTUAL
// ============================================================

/**
 * Obtiene el usuario actualmente autenticado
 */
export const getCurrentUser = async (): Promise<User | null> => {
    try {
        const { data: { user }, error } = await supabase.auth.getUser();

        if (error) {
            console.error('Error obteniendo usuario:', error);
            return null;
        }

        return user;
    } catch (error) {
        console.error('Error inesperado en getCurrentUser:', error);
        return null;
    }
};

// ============================================================
// ACTUALIZAR PERFIL
// ============================================================

/**
 * Actualiza el perfil del usuario actual
 */
export const updateProfile = async (
    updates: Partial<Omit<UserProfile, 'id' | 'email' | 'created_at' | 'updated_at'>>
): Promise<{ success: boolean; profile?: UserProfile; error?: string }> => {
    try {
        const user = await getCurrentUser();

        if (!user) {
            return {
                success: false,
                error: 'No hay usuario autenticado'
            };
        }

        const { data, error } = await supabase
            .from('profiles')
            .update(updates)
            .eq('id', user.id)
            .select()
            .single();

        if (error) {
            console.error('Error actualizando perfil:', error);
            return {
                success: false,
                error: error.message
            };
        }

        console.log('✅ Perfil actualizado');

        return {
            success: true,
            profile: data as UserProfile
        };

    } catch (error: any) {
        console.error('Error inesperado en updateProfile:', error);
        return {
            success: false,
            error: 'Error al actualizar perfil'
        };
    }
};

// ============================================================
// RECUPERACIÓN DE CONTRASEÑA
// ============================================================

/**
 * Envía un email para recuperar la contraseña
 * Verifica que el email exista antes de enviar el correo
 */
export const resetPassword = async (email: string): Promise<{ success: boolean; error?: string; notRegistered?: boolean }> => {
    try {
        // 1. Validar formato del email
        const emailValidation = validateEmail(email);
        if (!emailValidation.valid) {
            return {
                success: false,
                error: emailValidation.error
            };
        }

        // 2. Verificar si el email existe en la base de datos
        const { data: existingProfile, error: checkError } = await supabase
            .from('profiles')
            .select('email')
            .eq('email', email.toLowerCase())
            .maybeSingle();

        if (checkError && checkError.code !== 'PGRST116') {
            console.error('Error verificando email:', checkError);
            return {
                success: false,
                error: 'Error al verificar el email. Por favor intenta de nuevo.'
            };
        }

        // 3. Si el email NO existe, informar al usuario
        if (!existingProfile) {
            console.warn('⚠️ Intento de recuperación para email no registrado:', email);
            return {
                success: false,
                error: 'Este correo no está registrado. ¿Quieres crear una cuenta?',
                notRegistered: true
            };
        }

        // 4. Si existe, enviar el correo de recuperación
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/#type=recovery`
        });

        if (error) {
            console.error('Error en resetPasswordForEmail:', error);
            return {
                success: false,
                error: 'Error al enviar el correo de recuperación. Por favor intenta de nuevo.'
            };
        }

        console.log('✅ Email de recuperación enviado a:', email);

        return { success: true };

    } catch (error: any) {
        console.error('Error inesperado en resetPassword:', error);
        return {
            success: false,
            error: 'Error al procesar la solicitud. Por favor intenta de nuevo.'
        };
    }
};

/**
 * Actualiza la contraseña del usuario
 */
export const updatePassword = async (newPassword: string): Promise<{ success: boolean; error?: string }> => {
    try {
        // Validar nueva contraseña
        const validation = validatePassword(newPassword);
        if (!validation.valid) {
            return {
                success: false,
                error: validation.error
            };
        }

        const { error } = await supabase.auth.updateUser({
            password: newPassword
        });

        if (error) {
            console.error('Error en updatePassword:', error);
            return {
                success: false,
                error: error.message
            };
        }

        console.log('✅ Contraseña actualizada');

        return { success: true };

    } catch (error: any) {
        console.error('Error inesperado en updatePassword:', error);
        return {
            success: false,
            error: 'Error al actualizar contraseña'
        };
    }
};

// ============================================================
// ELIMINAR CUENTA
// ============================================================

/**
 * Elimina completamente la cuenta del usuario
 * Usa la Edge Function para borrar el usuario de auth.users
 * con SERVICE_ROLE_KEY, lo cual también elimina en cascada:
 * - El perfil en public.profiles
 * - Otros datos relacionados
 */
export const deleteUserAccount = async (): Promise<{ success: boolean; error?: string }> => {
    try {
        // 1. Obtener sesión actual
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError || !session) {
            return {
                success: false,
                error: 'No hay sesión activa'
            };
        }

        console.log(`🗑️ Llamando a Edge Function para eliminar cuenta...`);

        // 2. Llamar a la Edge Function
        const functionsUrl = import.meta.env.VITE_SUPABASE_FUNCTIONS_URL ||
            `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`;

        const response = await fetch(
            `${functionsUrl}/delete-user-account`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${session.access_token}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        const result = await response.json();

        if (!response.ok || !result.success) {
            console.error('Error en Edge Function:', result.error);
            return {
                success: false,
                error: result.error || 'Error al eliminar la cuenta'
            };
        }

        console.log('✅ Cuenta eliminada completamente de auth.users y profiles');

        // 3. Cerrar sesión local (la sesión ya fue invalidada en el servidor)
        await supabase.auth.signOut();

        return { success: true };

    } catch (error: any) {
        console.error('Error inesperado en deleteUserAccount:', error);
        return {
            success: false,
            error: 'Error al eliminar la cuenta'
        };
    }
};

// ============================================================
// SUSCRIPCIÓN A CAMBIOS DE AUTENTICACIÓN
// ============================================================

/**
 * Suscribe a cambios en el estado de autenticación
 */
export const onAuthStateChange = (callback: (user: User | null) => void) => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        callback(session?.user ?? null);
    });

    return subscription;
};
