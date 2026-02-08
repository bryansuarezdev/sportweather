// ============================================================
// UTILIDAD DE LIMPIEZA AUTOMÁTICA DE LOCALSTORAGE
// ============================================================
// Este módulo gestiona la limpieza periódica del localStorage
// para evitar acumulación de datos obsoletos y memory leaks
// ============================================================

interface StorageCleanupConfig {
  // Tiempo en milisegundos antes de considerar un item como expirado
  maxAge: number;
  // Claves que NUNCA deben ser limpiadas
  protectedKeys: string[];
  // Prefijos de claves que deben limpiarse con prioridad
  cleanablePrefixes: string[];
}

const DEFAULT_CONFIG: StorageCleanupConfig = {
  maxAge: 24 * 60 * 60 * 1000, // 24 horas por defecto
  protectedKeys: [
    'sb-', // Prefijo de Supabase (sesión)
  ],
  cleanablePrefixes: [
    'weather_cache_',
    'city_search_',
    'temp_',
  ],
};

/**
 * Limpieza selectiva del localStorage
 * Solo limpia datos temporales, NO la sesión de Supabase
 */
export const cleanupLocalStorage = (config: Partial<StorageCleanupConfig> = {}): void => {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  
  try {
    const keysToRemove: string[] = [];
    const now = Date.now();
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;
      
      // Nunca eliminar claves protegidas (como las de Supabase)
      const isProtected = finalConfig.protectedKeys.some(prefix => key.startsWith(prefix));
      if (isProtected) continue;
      
      // Verificar si es una clave limpiable
      const isCleanable = finalConfig.cleanablePrefixes.some(prefix => key.startsWith(prefix));
      
      if (isCleanable) {
        try {
          const value = localStorage.getItem(key);
          if (value) {
            const parsed = JSON.parse(value);
            // Si tiene timestamp y ha expirado, eliminar
            if (parsed.timestamp && (now - parsed.timestamp) > finalConfig.maxAge) {
              keysToRemove.push(key);
            }
          }
        } catch {
          // Si no se puede parsear, eliminar por seguridad
          keysToRemove.push(key);
        }
      }
    }
    
    // Eliminar claves marcadas
    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
      console.log(`🧹 Limpiado: ${key}`);
    });
    
    if (keysToRemove.length > 0) {
      console.log(`✅ Limpieza de localStorage completada: ${keysToRemove.length} items eliminados`);
    }
  } catch (error) {
    console.warn('⚠️ Error durante limpieza de localStorage:', error);
  }
};

/**
 * Inicia la limpieza automática periódica
 * @param intervalMs - Intervalo en milisegundos (por defecto 30 minutos)
 * @returns Función para detener la limpieza
 */
export const startPeriodicCleanup = (intervalMs: number = 30 * 60 * 1000): (() => void) => {
  // Ejecutar limpieza inicial
  cleanupLocalStorage();
  
  // Configurar intervalo
  const intervalId = setInterval(() => {
    cleanupLocalStorage();
  }, intervalMs);
  
  console.log(`🔄 Limpieza automática de localStorage activada (cada ${intervalMs / 60000} minutos)`);
  
  // Retornar función de limpieza
  return () => {
    clearInterval(intervalId);
    console.log('⏹️ Limpieza automática de localStorage desactivada');
  };
};

/**
 * Verifica el tamaño actual del localStorage
 */
export const getLocalStorageSize = (): { used: number; usedMB: string } => {
  let total = 0;
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key) {
      const value = localStorage.getItem(key) || '';
      total += key.length + value.length;
    }
  }
  return {
    used: total,
    usedMB: (total / (1024 * 1024)).toFixed(2) + ' MB',
  };
};

/**
 * Limpieza de emergencia cuando localStorage está lleno
 */
export const emergencyCleanup = (): void => {
  console.warn('🚨 Ejecutando limpieza de emergencia del localStorage...');
  
  const keysToRemove: string[] = [];
  
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key) continue;
    
    // Solo mantener claves de Supabase (sesión)
    if (!key.startsWith('sb-')) {
      keysToRemove.push(key);
    }
  }
  
  keysToRemove.forEach(key => localStorage.removeItem(key));
  console.log(`🚨 Limpieza de emergencia: ${keysToRemove.length} items eliminados`);
};
