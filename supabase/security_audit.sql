-- ============================================================
-- AUDITORÍA DE SEGURIDAD - SPORTWEATHER
-- ============================================================
-- Este script verifica que todas las políticas de seguridad
-- estén correctamente configuradas en Supabase.
-- Ejecutar periódicamente para garantizar la integridad.
-- ============================================================

-- ============================================================
-- 1. VERIFICAR QUE RLS ESTÉ ACTIVADO EN TODAS LAS TABLAS
-- ============================================================

SELECT 
  '🔒 VERIFICACIÓN DE ROW LEVEL SECURITY (RLS)' as audit_section,
  '' as separator;

SELECT 
  tablename,
  CASE 
    WHEN rowsecurity = true THEN '✅ ACTIVADO'
    ELSE '❌ DESACTIVADO - ¡CRÍTICO!'
  END as estado_rls
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- Resultado esperado:
-- profiles              ✅ ACTIVADO
-- support_email_limits  ✅ ACTIVADO
-- city_access_logs      ✅ ACTIVADO

-- ============================================================
-- 2. VERIFICAR POLÍTICAS RLS POR TABLA
-- ============================================================

SELECT 
  '' as separator,
  '📋 POLÍTICAS RLS CONFIGURADAS' as audit_section,
  '' as separator;

SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd as operacion,
  CASE 
    WHEN qual IS NOT NULL THEN '✅ Con condición USING'
    ELSE '⚠️ Sin condición'
  END as tiene_using,
  CASE 
    WHEN with_check IS NOT NULL THEN '✅ Con condición CHECK'
    ELSE '⚠️ Sin condición'
  END as tiene_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Resultado esperado para cada tabla:
-- PROFILES: 5 políticas (SELECT x2, INSERT, UPDATE, DELETE)
-- SUPPORT_EMAIL_LIMITS: 3 políticas (SELECT, INSERT, DELETE)
-- CITY_ACCESS_LOGS: 4 políticas (SELECT, INSERT, UPDATE, DELETE)

-- ============================================================
-- 3. VERIFICAR FUNCIONES DE SEGURIDAD
-- ============================================================

SELECT 
  '' as separator,
  '⚙️ FUNCIONES DE SEGURIDAD' as audit_section,
  '' as separator;

SELECT 
  routine_name as funcion,
  routine_type as tipo,
  data_type as retorna,
  CASE 
    WHEN security_type = 'DEFINER' THEN '⚠️ DEFINER (revisar permisos)'
    WHEN security_type = 'INVOKER' THEN '✅ INVOKER (seguro)'
    ELSE security_type
  END as modo_seguridad
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

-- Resultado esperado: 5 funciones

-- ============================================================
-- 4. VERIFICAR TRIGGERS ACTIVOS
-- ============================================================

SELECT 
  '' as separator,
  '🔔 TRIGGERS CONFIGURADOS' as audit_section,
  '' as separator;

SELECT 
  trigger_name,
  event_object_table as tabla,
  action_timing as momento,
  event_manipulation as evento,
  CASE 
    WHEN action_statement LIKE '%handle_new_user%' THEN '✅ Creación de perfil'
    WHEN action_statement LIKE '%handle_updated_at%' THEN '✅ Actualización de timestamp'
    ELSE action_statement
  END as accion
FROM information_schema.triggers
WHERE trigger_schema = 'public' OR event_object_schema = 'auth'
ORDER BY event_object_table, trigger_name;

-- Resultado esperado:
-- on_auth_user_created (auth.users) → handle_new_user
-- on_profiles_updated (profiles) → handle_updated_at

-- ============================================================
-- 5. VERIFICAR CONSTRAINTS DE VALIDACIÓN
-- ============================================================

SELECT 
  '' as separator,
  '✔️ CONSTRAINTS DE VALIDACIÓN' as audit_section,
  '' as separator;

SELECT 
  tc.table_name as tabla,
  tc.constraint_name as constraint,
  tc.constraint_type as tipo,
  CASE 
    WHEN cc.check_clause IS NOT NULL THEN SUBSTRING(cc.check_clause, 1, 100)
    ELSE 'N/A'
  END as regla
FROM information_schema.table_constraints tc
LEFT JOIN information_schema.check_constraints cc 
  ON tc.constraint_name = cc.constraint_name
WHERE tc.table_schema = 'public'
  AND tc.constraint_type IN ('CHECK', 'UNIQUE', 'PRIMARY KEY', 'FOREIGN KEY')
ORDER BY tc.table_name, tc.constraint_type, tc.constraint_name;

-- Resultado esperado para PROFILES:
-- ✅ username_length (CHECK)
-- ✅ valid_tolerance (CHECK)
-- ✅ valid_email (CHECK)
-- ✅ username UNIQUE
-- ✅ email UNIQUE

-- ============================================================
-- 6. VERIFICAR ÍNDICES PARA PERFORMANCE
-- ============================================================

SELECT 
  '' as separator,
  '📊 ÍNDICES CONFIGURADOS' as audit_section,
  '' as separator;

SELECT 
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- Resultado esperado:
-- PROFILES: idx_profiles_username, idx_profiles_email, idx_profiles_created_at
-- SUPPORT_EMAIL_LIMITS: idx_support_email_limits_user_id, idx_support_email_limits_email, idx_support_email_limits_sent_at
-- CITY_ACCESS_LOGS: idx_city_access_logs_user_id, idx_city_access_logs_email, idx_city_access_logs_last_accessed, idx_city_access_logs_city_name

-- ============================================================
-- 7. VERIFICAR PERMISOS GRANT
-- ============================================================

SELECT 
  '' as separator,
  '🔑 PERMISOS DE ACCESO (GRANTS)' as audit_section,
  '' as separator;

SELECT 
  grantee as rol,
  table_schema as schema,
  table_name as tabla,
  STRING_AGG(privilege_type, ', ') as permisos
FROM information_schema.table_privileges
WHERE table_schema = 'public'
  AND grantee IN ('authenticated', 'anon', 'postgres')
GROUP BY grantee, table_schema, table_name
ORDER BY table_name, grantee;

-- Resultado esperado:
-- authenticated → ALL en profiles, support_email_limits, city_access_logs
-- anon → ALL en support_email_limits (para usuarios no logueados)

-- ============================================================
-- 8. DETECTAR POSIBLES VULNERABILIDADES
-- ============================================================

SELECT 
  '' as separator,
  '⚠️ DETECCIÓN DE VULNERABILIDADES' as audit_section,
  '' as separator;

-- Verificar tablas SIN RLS activado (CRÍTICO)
SELECT 
  '❌ TABLAS SIN RLS' as alerta,
  tablename as tabla_vulnerable
FROM pg_tables 
WHERE schemaname = 'public'
  AND rowsecurity = false;

-- Si devuelve filas, es CRÍTICO

-- Verificar políticas que permiten TODO sin condiciones
SELECT 
  '⚠️ POLÍTICAS PERMISIVAS' as alerta,
  tablename as tabla,
  policyname as politica
FROM pg_policies
WHERE schemaname = 'public'
  AND qual IS NULL 
  AND cmd != 'INSERT'; -- INSERT puede no tener USING

-- Revisar manualmente si es intencional

-- ============================================================
-- 9. ESTADÍSTICAS DE USO (OPCIONAL)
-- ============================================================

SELECT 
  '' as separator,
  '📈 ESTADÍSTICAS DE DATOS' as audit_section,
  '' as separator;

-- Contar registros por tabla
SELECT 'profiles' as tabla, COUNT(*) as total_registros FROM profiles
UNION ALL
SELECT 'support_email_limits', COUNT(*) FROM support_email_limits
UNION ALL
SELECT 'city_access_logs', COUNT(*) FROM city_access_logs;

-- Registros antiguos en city_access_logs (deberían limpiarse automáticamente)
SELECT 
  '🗑️ REGISTROS ANTIGUOS (>7 días)' as info,
  COUNT(*) as cantidad
FROM city_access_logs
WHERE last_accessed < (NOW() - INTERVAL '7 days');

-- Registros antiguos en support_email_limits
SELECT 
  '🗑️ EMAILS ANTIGUOS (>7 días)' as info,
  COUNT(*) as cantidad
FROM support_email_limits
WHERE sent_at < (NOW() - INTERVAL '7 days');

-- ============================================================
-- 10. RESUMEN FINAL
-- ============================================================

SELECT 
  '' as separator,
  '✅ RESUMEN DE AUDITORÍA' as audit_section,
  '' as separator;

SELECT 
  'Total de tablas con RLS' as metrica,
  COUNT(*) as valor
FROM pg_tables 
WHERE schemaname = 'public' AND rowsecurity = true
UNION ALL
SELECT 
  'Total de políticas RLS',
  COUNT(*)
FROM pg_policies
WHERE schemaname = 'public'
UNION ALL
SELECT 
  'Total de funciones de seguridad',
  COUNT(*)
FROM information_schema.routines
WHERE routine_schema = 'public'
UNION ALL
SELECT 
  'Total de triggers activos',
  COUNT(*)
FROM information_schema.triggers
WHERE trigger_schema = 'public' OR event_object_schema = 'auth'
UNION ALL
SELECT 
  'Total de constraints CHECK',
  COUNT(*)
FROM information_schema.table_constraints
WHERE table_schema = 'public' AND constraint_type = 'CHECK';

-- ============================================================
-- ✅ AUDITORÍA COMPLETADA
-- ============================================================

SELECT 
  '' as separator,
  '🎉 AUDITORÍA FINALIZADA' as resultado,
  NOW() as fecha_ejecucion,
  '' as separator;

-- INSTRUCCIONES:
-- 1. Ejecuta este script completo en el SQL Editor de Supabase
-- 2. Revisa cada sección y verifica que los resultados coincidan con lo esperado
-- 3. Si encuentras ❌ o ⚠️, investiga y corrige
-- 4. Guarda los resultados para comparar en futuras auditorías
-- 5. Ejecuta este script al menos 1 vez al mes o después de cambios importantes
