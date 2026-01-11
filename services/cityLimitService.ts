// Sistema de límite de búsqueda de ciudades con Supabase
// Límite: 7 ciudades diferentes cada 7 días (por user_id + email)
import { supabase } from './supabaseClient';

const MAX_CITIES_PER_PERIOD = 7;
const PERIOD_DAYS = 7;

interface CityAccessRecord {
  id: string;
  user_id: string | null;
  user_email: string;
  city_name: string;
  latitude: number;
  longitude: number;
  last_accessed: string;
  created_at: string;
}

interface CityLimitResult {
  allowed: boolean;
  remaining: number;
  resetDate: Date | null;
  message?: string;
  isCurrentLocation?: boolean;
}

// Helper para verificar si Supabase está configurado
const isSupabaseConfigured = (): boolean => {
  return !!(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY);
};

// ==================== SUPABASE FUNCTIONS ====================

/**
 * Verifica si un usuario puede buscar una ciudad específica
 * @param userId - UUID del usuario autenticado
 * @param userEmail - Email del usuario
 * @param cityName - Nombre de la ciudad a buscar
 * @param isCurrentLocation - Si es true, siempre permite (ubicación GPS)
 */
export const canAccessCity = async (
  userId: string,
  userEmail: string,
  cityName: string,
  isCurrentLocation: boolean = false
): Promise<CityLimitResult> => {
  if (!isSupabaseConfigured()) {
    console.warn('⚠️ Supabase no configurado, permitiendo acceso sin límites');
    return { allowed: true, remaining: MAX_CITIES_PER_PERIOD, resetDate: null };
  }

  // La ubicación actual SIEMPRE está permitida (no gasta cupo)
  if (isCurrentLocation) {
    console.log('📍 Ubicación actual detectada - Acceso libre');
    return { 
      allowed: true, 
      remaining: MAX_CITIES_PER_PERIOD, 
      resetDate: null,
      isCurrentLocation: true 
    };
  }

  try {
    // Limpiar registros antiguos primero
    await cleanOldCityRecords();

    const periodMs = PERIOD_DAYS * 24 * 60 * 60 * 1000;
    const cutoffDate = new Date(Date.now() - periodMs).toISOString();

    // 1. Verificar si ya buscó esta ciudad en los últimos 7 días (por ID o Email)
    const { data: existingCity, error: checkError } = await supabase
      .from('city_access_logs')
      .select('*')
      .or(`user_id.eq.${userId},user_email.eq.${userEmail.toLowerCase()}`)
      .ilike('city_name', cityName)
      .gte('last_accessed', cutoffDate)
      .limit(1);

    if (checkError) {
      console.error('Error verificando ciudad existente:', checkError);
      throw checkError;
    }

    // Si ya buscó esta ciudad, permitir sin gastar cupo
    if (existingCity && existingCity.length > 0) {
      console.log(`✅ Ciudad "${cityName}" ya registrada - Acceso permitido`);
      return {
        allowed: true,
        remaining: MAX_CITIES_PER_PERIOD,
        resetDate: null,
        message: 'Ciudad ya consultada previamente'
      };
    }

    // 2. Contar ciudades DISTINTAS en el período (por ID o Email - doble candado)
    const { data: records, error: countError } = await supabase
      .from('city_access_logs')
      .select('city_name')
      .or(`user_id.eq.${userId},user_email.eq.${userEmail.toLowerCase()}`)
      .gte('last_accessed', cutoffDate);

    if (countError) {
      console.error('Error contando ciudades:', countError);
      throw countError;
    }

    // Contar ciudades únicas
    const uniqueCities = new Set(records?.map(r => r.city_name.toLowerCase()) || []);
    const cityCount = uniqueCities.size;
    const remaining = Math.max(0, MAX_CITIES_PER_PERIOD - cityCount);

    console.log(`📊 Ciudades únicas consultadas: ${cityCount}/${MAX_CITIES_PER_PERIOD}`);

    // Calcular fecha de reset (basada en el registro más antiguo)
    let resetDate: Date | null = null;
    if (records && records.length > 0) {
      const { data: oldestRecord } = await supabase
        .from('city_access_logs')
        .select('last_accessed')
        .or(`user_id.eq.${userId},user_email.eq.${userEmail.toLowerCase()}`)
        .gte('last_accessed', cutoffDate)
        .order('last_accessed', { ascending: true })
        .limit(1)
        .single();

      if (oldestRecord) {
        resetDate = new Date(new Date(oldestRecord.last_accessed).getTime() + periodMs);
      }
    }

    // 3. Decidir si puede buscar una ciudad nueva
    if (cityCount < MAX_CITIES_PER_PERIOD) {
      return {
        allowed: true,
        remaining: remaining - 1, // -1 porque va a gastar uno
        resetDate,
        message: `Te quedan ${remaining - 1} ciudades nuevas esta semana`
      };
    } else {
      const daysUntilReset = resetDate 
        ? Math.ceil((resetDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
        : PERIOD_DAYS;

      return {
        allowed: false,
        remaining: 0,
        resetDate,
        message: `Has alcanzado el límite de ${MAX_CITIES_PER_PERIOD} ciudades. Podrás explorar más en ${daysUntilReset} día${daysUntilReset === 1 ? '' : 's'}.`
      };
    }
  } catch (error) {
    console.error('Error en canAccessCity:', error);
    // En caso de error, permitir acceso (fail-safe)
    return { allowed: true, remaining: MAX_CITIES_PER_PERIOD, resetDate: null };
  }
};

/**
 * Registra que un usuario accedió a una ciudad
 */
export const recordCityAccess = async (
  userId: string,
  userEmail: string,
  cityName: string,
  latitude: number,
  longitude: number,
  isCurrentLocation: boolean = false
): Promise<void> => {
  if (!isSupabaseConfigured()) {
    console.warn('⚠️ Supabase no configurado, no se registra el acceso');
    return;
  }

  // No registrar la ubicación actual (no gasta cupo)
  if (isCurrentLocation) {
    console.log('📍 Ubicación actual - No se registra en límites');
    return;
  }

  try {
    const periodMs = PERIOD_DAYS * 24 * 60 * 60 * 1000;
    const cutoffDate = new Date(Date.now() - periodMs).toISOString();

    // Verificar si ya existe un registro de esta ciudad en el período
    const { data: existing } = await supabase
      .from('city_access_logs')
      .select('id')
      .or(`user_id.eq.${userId},user_email.eq.${userEmail.toLowerCase()}`)
      .ilike('city_name', cityName)
      .gte('last_accessed', cutoffDate)
      .limit(1)
      .single();

    if (existing) {
      // Actualizar la fecha de último acceso
      const { error: updateError } = await supabase
        .from('city_access_logs')
        .update({ last_accessed: new Date().toISOString() })
        .eq('id', existing.id);

      if (updateError) {
        console.error('Error actualizando acceso a ciudad:', updateError);
      } else {
        console.log(`🔄 Actualizado acceso a "${cityName}"`);
      }
    } else {
      // Insertar nuevo registro
      const { error: insertError } = await supabase
        .from('city_access_logs')
        .insert([{
          user_id: userId,
          user_email: userEmail.toLowerCase(),
          city_name: cityName,
          latitude,
          longitude,
          last_accessed: new Date().toISOString()
        }]);

      if (insertError) {
        console.error('Error registrando acceso a ciudad:', insertError);
        throw insertError;
      }

      console.log(`✅ Registrado acceso a nueva ciudad: "${cityName}"`);
    }
  } catch (error) {
    console.error('Error en recordCityAccess:', error);
    throw error;
  }
};

/**
 * Limpia registros de ciudades mayores a 7 días
 */
const cleanOldCityRecords = async (): Promise<void> => {
  const periodMs = PERIOD_DAYS * 24 * 60 * 60 * 1000;
  const cutoffDate = new Date(Date.now() - periodMs).toISOString();

  try {
    const { error } = await supabase
      .from('city_access_logs')
      .delete()
      .lt('last_accessed', cutoffDate);

    if (error) {
      console.error('Error limpiando registros antiguos de ciudades:', error);
    }
  } catch (error) {
    console.error('Error en cleanOldCityRecords:', error);
  }
};

/**
 * Obtiene información de límite para mostrar al usuario
 */
export const getCityLimitInfo = async (userId: string, userEmail: string): Promise<string> => {
  if (!isSupabaseConfigured()) {
    return `Puedes explorar hasta ${MAX_CITIES_PER_PERIOD} ciudades diferentes cada ${PERIOD_DAYS} días.`;
  }

  try {
    const periodMs = PERIOD_DAYS * 24 * 60 * 60 * 1000;
    const cutoffDate = new Date(Date.now() - periodMs).toISOString();

    const { data: records } = await supabase
      .from('city_access_logs')
      .select('city_name, last_accessed')
      .or(`user_id.eq.${userId},user_email.eq.${userEmail.toLowerCase()}`)
      .gte('last_accessed', cutoffDate);

    const uniqueCities = new Set(records?.map(r => r.city_name.toLowerCase()) || []);
    const cityCount = uniqueCities.size;
    const remaining = Math.max(0, MAX_CITIES_PER_PERIOD - cityCount);

    if (remaining === MAX_CITIES_PER_PERIOD) {
      return `Puedes explorar hasta ${MAX_CITIES_PER_PERIOD} ciudades diferentes cada ${PERIOD_DAYS} días.`;
    } else if (remaining > 0) {
      return `Te quedan ${remaining} ciudad${remaining === 1 ? '' : 'es'} nueva${remaining === 1 ? '' : 's'} disponible${remaining === 1 ? '' : 's'} esta semana.`;
    } else {
      // Calcular cuándo se resetea
      if (records && records.length > 0) {
        const oldestDate = new Date(Math.min(...records.map(r => new Date(r.last_accessed).getTime())));
        const resetDate = new Date(oldestDate.getTime() + periodMs);
        const days = Math.ceil((resetDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        return `Has alcanzado el límite de ${MAX_CITIES_PER_PERIOD} ciudades. Podrás explorar más en ${days} día${days === 1 ? '' : 's'}.`;
      }
      return `Has alcanzado el límite de ${MAX_CITIES_PER_PERIOD} ciudades cada ${PERIOD_DAYS} días.`;
    }
  } catch (error) {
    console.error('Error obteniendo info de límites:', error);
    return `Puedes explorar hasta ${MAX_CITIES_PER_PERIOD} ciudades diferentes cada ${PERIOD_DAYS} días.`;
  }
};
