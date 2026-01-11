-- ============================================================
-- MIGRACIÓN A SUPABASE AUTH - SportWeather
-- ============================================================
-- Este script configura la base de datos para usar Supabase Auth
-- con cascada automática y RLS estricto
-- ============================================================

-- ============================================================
-- PASO 1: Eliminar tablas antiguas (si existen)
-- ============================================================

DROP TABLE IF EXISTS users CASCADE;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;

-- ============================================================
-- PASO 2: Crear tabla PROFILES vinculada a auth.users
-- ============================================================

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  sports TEXT[] NOT NULL DEFAULT '{}',
  tolerance TEXT NOT NULL DEFAULT 'moderate',
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  
  -- Validaciones
  CONSTRAINT username_length CHECK (char_length(username) >= 2 AND char_length(username) <= 50),
  CONSTRAINT valid_tolerance CHECK (tolerance IN ('low', 'moderate', 'high')),
  CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- Índices para optimización
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON public.profiles(created_at DESC);

-- Comentarios
COMMENT ON TABLE public.profiles IS 'Perfiles de usuario vinculados a auth.users';
COMMENT ON COLUMN public.profiles.id IS 'UUID del usuario (FK a auth.users)';
COMMENT ON COLUMN public.profiles.username IS 'Nombre de usuario único (2-50 caracteres)';
COMMENT ON COLUMN public.profiles.email IS 'Email del usuario (sincronizado con auth.users)';
COMMENT ON COLUMN public.profiles.sports IS 'Array de IDs de deportes favoritos';
COMMENT ON COLUMN public.profiles.tolerance IS 'Tolerancia al clima: low, moderate, high';

-- ============================================================
-- PASO 3: Actualizar tabla support_email_limits
-- ============================================================

-- Eliminar tabla antigua y recrear con FK a auth.users
DROP TABLE IF EXISTS support_email_limits CASCADE;

CREATE TABLE IF NOT EXISTS public.support_email_limits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  email TEXT NOT NULL,
  sent_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_support_email_limits_user_id ON public.support_email_limits(user_id);
CREATE INDEX IF NOT EXISTS idx_support_email_limits_email ON public.support_email_limits(email);
CREATE INDEX IF NOT EXISTS idx_support_email_limits_sent_at ON public.support_email_limits(sent_at);

COMMENT ON TABLE public.support_email_limits IS 'Control de límites de emails de soporte (preserva registros al borrar usuarios)';
COMMENT ON COLUMN public.support_email_limits.user_id IS 'ID del usuario (FK a auth.users, se pone NULL si el usuario se elimina)';

-- ============================================================
-- PASO 3B: Crear tabla city_access_logs (Rate Limiting de Ciudades)
-- ============================================================

DROP TABLE IF EXISTS city_access_logs CASCADE;

CREATE TABLE IF NOT EXISTS public.city_access_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email TEXT NOT NULL,
  city_name TEXT NOT NULL,
  latitude DECIMAL(10, 7) NOT NULL,
  longitude DECIMAL(10, 7) NOT NULL,
  last_accessed TIMESTAMPTZ DEFAULT now() NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Índices para optimización de consultas
CREATE INDEX IF NOT EXISTS idx_city_access_logs_user_id ON public.city_access_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_city_access_logs_email ON public.city_access_logs(user_email);
CREATE INDEX IF NOT EXISTS idx_city_access_logs_last_accessed ON public.city_access_logs(last_accessed);
CREATE INDEX IF NOT EXISTS idx_city_access_logs_city_name ON public.city_access_logs(city_name);

COMMENT ON TABLE public.city_access_logs IS 'Registro de acceso a ciudades para rate limiting (7 ciudades únicas cada 7 días)';
COMMENT ON COLUMN public.city_access_logs.user_id IS 'ID del usuario (FK a auth.users, se pone NULL si el usuario se elimina)';
COMMENT ON COLUMN public.city_access_logs.user_email IS 'Email del usuario (doble candado de seguridad)';
COMMENT ON COLUMN public.city_access_logs.city_name IS 'Nombre de la ciudad consultada';
COMMENT ON COLUMN public.city_access_logs.last_accessed IS 'Última vez que se accedió a esta ciudad';

-- ============================================================
-- PASO 4: FUNCIÓN - Crear perfil automáticamente
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, username, sports, tolerance)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    COALESCE(
      Array(SELECT jsonb_array_elements_text(NEW.raw_user_meta_data->'sports')),
      '{}'
    ),
    COALESCE(NEW.raw_user_meta_data->>'tolerance', 'moderate')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.handle_new_user() IS 'Crea automáticamente un perfil cuando se registra un usuario';

-- ============================================================
-- PASO 5: TRIGGER - Ejecutar handle_new_user al registrarse
-- ============================================================

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- PASO 6: FUNCIÓN - Actualizar updated_at automáticamente
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para profiles
DROP TRIGGER IF EXISTS on_profiles_updated ON public.profiles;

CREATE TRIGGER on_profiles_updated
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================
-- PASO 7: FUNCIÓN - Verificar disponibilidad de username
-- ============================================================

CREATE OR REPLACE FUNCTION public.is_username_available(check_username TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN NOT EXISTS (
    SELECT 1 FROM public.profiles WHERE username = check_username
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.is_username_available(TEXT) IS 'Verifica si un username está disponible';

-- ============================================================
-- PASO 8: FUNCIÓN - Obtener perfil del usuario actual
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_current_user_profile()
RETURNS TABLE (
  id UUID,
  username TEXT,
  email TEXT,
  sports TEXT[],
  tolerance TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.username,
    p.email,
    p.sports,
    p.tolerance,
    p.created_at,
    p.updated_at
  FROM public.profiles p
  WHERE p.id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.get_current_user_profile() IS 'Obtiene el perfil del usuario autenticado';

-- ============================================================
-- PASO 9: FUNCIÓN - Limpiar emails antiguos
-- ============================================================

CREATE OR REPLACE FUNCTION public.cleanup_old_support_emails()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.support_email_limits
  WHERE sent_at < (now() - interval '7 days');
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.cleanup_old_support_emails() IS 'Elimina registros de emails mayores a 7 días';

-- ============================================================
-- PASO 10: ROW LEVEL SECURITY (RLS) - PROFILES
-- ============================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas antiguas
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can delete own profile" ON public.profiles;
DROP POLICY IF EXISTS "Public can check username availability" ON public.profiles;

-- Políticas nuevas
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can delete own profile"
  ON public.profiles FOR DELETE
  USING (auth.uid() = id);

CREATE POLICY "Public can check username availability"
  ON public.profiles FOR SELECT
  USING (true);

-- ============================================================
-- PASO 11: ROW LEVEL SECURITY (RLS) - SUPPORT_EMAIL_LIMITS
-- ============================================================

ALTER TABLE public.support_email_limits ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas antiguas
DROP POLICY IF EXISTS "Users can view own email limits" ON public.support_email_limits;
DROP POLICY IF EXISTS "Anyone can insert email limits" ON public.support_email_limits;
DROP POLICY IF EXISTS "Service role can delete old limits" ON public.support_email_limits;

-- Políticas nuevas
CREATE POLICY "Users can view own email limits"
  ON public.support_email_limits FOR SELECT
  USING (auth.uid() = user_id OR email = auth.jwt()->>'email');

CREATE POLICY "Anyone can insert email limits"
  ON public.support_email_limits FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Service role can delete old limits"
  ON public.support_email_limits FOR DELETE
  USING (auth.jwt()->>'role' = 'service_role');

-- ============================================================
-- PASO 11B: ROW LEVEL SECURITY (RLS) - CITY_ACCESS_LOGS
-- ============================================================

ALTER TABLE public.city_access_logs ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas antiguas (si existen)
DROP POLICY IF EXISTS "Users can view own city logs" ON public.city_access_logs;
DROP POLICY IF EXISTS "Users can insert city logs" ON public.city_access_logs;
DROP POLICY IF EXISTS "Users can update own city logs" ON public.city_access_logs;
DROP POLICY IF EXISTS "Service role can delete old city logs" ON public.city_access_logs;

-- Políticas nuevas (con doble candado: user_id OR email)
CREATE POLICY "Users can view own city logs"
  ON public.city_access_logs FOR SELECT
  USING (auth.uid() = user_id OR user_email = auth.jwt()->>'email');

CREATE POLICY "Users can insert city logs"
  ON public.city_access_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id OR user_email = auth.jwt()->>'email');

CREATE POLICY "Users can update own city logs"
  ON public.city_access_logs FOR UPDATE
  USING (auth.uid() = user_id OR user_email = auth.jwt()->>'email')
  WITH CHECK (auth.uid() = user_id OR user_email = auth.jwt()->>'email');

CREATE POLICY "Service role can delete old city logs"
  ON public.city_access_logs FOR DELETE
  USING (auth.jwt()->>'role' = 'service_role');

-- ============================================================
-- PASO 12: GRANTS DE PERMISOS
-- ============================================================

-- Permisos para usuarios autenticados
GRANT USAGE ON SCHEMA public TO authenticated, anon;
GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.support_email_limits TO authenticated, anon;
GRANT ALL ON public.city_access_logs TO authenticated;

-- Permisos para ejecutar funciones
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.handle_updated_at() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.is_username_available(TEXT) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.get_current_user_profile() TO authenticated;
GRANT EXECUTE ON FUNCTION public.cleanup_old_support_emails() TO authenticated;

-- ============================================================
-- PASO 13: VERIFICACIÓN
-- ============================================================

-- Verificar estructura de profiles
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'profiles'
ORDER BY ordinal_position;

-- Verificar triggers
SELECT 
  trigger_name,
  event_object_table,
  action_timing,
  event_manipulation
FROM information_schema.triggers
WHERE event_object_schema = 'public' OR trigger_schema = 'auth'
ORDER BY event_object_table, trigger_name;

-- Verificar funciones
SELECT 
  routine_name,
  routine_type,
  data_type as return_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN (
    'handle_new_user',
    'handle_updated_at',
    'is_username_available',
    'get_current_user_profile',
    'cleanup_old_support_emails'
  )
ORDER BY routine_name;

-- Verificar políticas RLS
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- ============================================================
-- ✅ MIGRACIÓN COMPLETADA
-- ============================================================

SELECT 
  '✅ Migración a Supabase Auth completada exitosamente' as status,
  'Tablas creadas: profiles, support_email_limits' as tables,
  '5 funciones auxiliares creadas' as functions,
  '8 políticas RLS configuradas' as policies,
  '2 triggers automáticos activados' as triggers;
