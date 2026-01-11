import { UserProfile } from '../types';
import { supabase } from './supabaseClient';

const CURRENT_SESSION_KEY = 'sportweather_session';

// Helper para verificar si Supabase está configurado
const isSupabaseConfigured = (): boolean => {
  return !!(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY);
};

// Validar que Supabase esté configurado
const ensureSupabaseConfigured = () => {
  if (!isSupabaseConfigured()) {
    throw new Error(
      '⚠️ Supabase no está configurado. Por favor configura VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en .env.local'
    );
  }
};

// ==================== SUPABASE FUNCTIONS ====================

// Verificar si un email ya existe
export const checkEmailExists = async (email: string): Promise<boolean> => {
  ensureSupabaseConfigured();

  try {
    const { data, error } = await supabase
      .from('users')
      .select('id')
      .eq('email', email);

    if (error) throw error;

    return data && data.length > 0;
  } catch (error: any) {
    console.error('❌ Error checking email:', error?.message);
    throw error;
  }
};

// Verificar si un username ya existe
export const checkUsernameExists = async (username: string): Promise<boolean> => {
  ensureSupabaseConfigured();

  try {
    const { data, error } = await supabase
      .from('users')
      .select('id')
      .eq('username', username);

    if (error) throw error;

    return data && data.length > 0;
  } catch (error: any) {
    console.error('❌ Error checking username:', error?.message);
    throw error;
  }
};

// Registrar nuevo usuario (NO permite duplicados)
export const registerUser = async (profile: UserProfile, password?: string): Promise<void> => {
  ensureSupabaseConfigured();

  try {
    // Verificar si el email ya existe
    const emailExists = await checkEmailExists(profile.email);

    if (emailExists) {
      throw new Error('EMAIL_EXISTS');
    }

    // Verificar si el username ya existe
    const usernameExists = await checkUsernameExists(profile.username);

    if (usernameExists) {
      throw new Error('USERNAME_EXISTS');
    }

    // Crear nuevo usuario
    const { error } = await supabase
      .from('users')
      .insert([{
        email: profile.email,
        username: profile.username,
        sports: profile.sports,
        tolerance: profile.tolerance,
        password: password || null,
      }]);

    if (error) {
      // Si el error es de duplicado (por si acaso)
      if (error.code === '23505') {
        // Verificar qué campo está duplicado
        if (error.message.includes('username')) {
          throw new Error('USERNAME_EXISTS');
        } else {
          throw new Error('EMAIL_EXISTS');
        }
      }
      throw error;
    }

    // Guardar sesión en localStorage
    localStorage.setItem(CURRENT_SESSION_KEY, JSON.stringify(profile));
    console.log('✅ User registered successfully');
  } catch (error: any) {
    if (error.message === 'EMAIL_EXISTS' || error.message === 'USERNAME_EXISTS') {
      throw error; // Re-lanzar para que el componente lo maneje
    }
    console.error('❌ Error registering user:', {
      message: error?.message,
      details: error?.details,
      hint: error?.hint,
      code: error?.code,
    });
    throw error;
  }
};

// Actualizar perfil de usuario existente
export const updateProfile = async (profile: UserProfile, password?: string): Promise<void> => {
  ensureSupabaseConfigured();

  try {
    const { error } = await supabase
      .from('users')
      .update({
        username: profile.username,
        sports: profile.sports,
        tolerance: profile.tolerance,
        password: password || null,
      })
      .eq('email', profile.email);

    if (error) throw error;

    // Actualizar sesión en localStorage
    localStorage.setItem(CURRENT_SESSION_KEY, JSON.stringify(profile));
    console.log('✅ Profile updated successfully');
  } catch (error: any) {
    console.error('❌ Error updating profile:', error?.message);
    throw error;
  }
};

// Mantener saveProfile para compatibilidad (ahora usa registerUser)
export const saveProfile = async (profile: UserProfile, password?: string): Promise<void> => {
  return registerUser(profile, password);
};

export const getProfile = async (): Promise<UserProfile | null> => {
  // Obtener sesión actual de localStorage
  const localSession = localStorage.getItem(CURRENT_SESSION_KEY);
  if (localSession) {
    return JSON.parse(localSession);
  }

  return null;
};

export const loginUser = async (email: string, password?: string): Promise<UserProfile | null> => {
  ensureSupabaseConfigured();

  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email);

    // Si no hay datos o está vacío, el usuario no existe
    if (!data || data.length === 0) {
      console.log('❌ User not found in Supabase');
      throw new Error('User not found');
    }

    const userData = data[0];

    // Verificar contraseña si existe
    if (password && userData.password && userData.password !== password) {
      console.log('❌ Invalid password');
      throw new Error('Invalid password');
    }

    const profile: UserProfile = {
      id: userData.id,
      username: userData.username,
      email: userData.email,
      sports: userData.sports,
      tolerance: userData.tolerance,
    };

    localStorage.setItem(CURRENT_SESSION_KEY, JSON.stringify(profile));
    console.log('✅ User logged in from Supabase');
    return profile;
  } catch (error: any) {
    console.error('❌ Login error:', error?.message);
    throw error;
  }
};

export const logout = async (): Promise<void> => {
  localStorage.removeItem(CURRENT_SESSION_KEY);
  console.log('👋 User logged out');
};

export const deleteAccount = async (email: string): Promise<void> => {
  ensureSupabaseConfigured();

  try {
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('email', email);

    if (error) throw error;

    localStorage.removeItem(CURRENT_SESSION_KEY);
    console.log('✅ Account deleted from Supabase');
  } catch (error: any) {
    console.error('❌ Error deleting account:', error?.message);
    throw error;
  }
};
