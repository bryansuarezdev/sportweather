// ============================================================
// EDGE FUNCTION: DELETE USER ACCOUNT
// ============================================================
// Esta función elimina completamente la cuenta de un usuario
// usando la SERVICE_ROLE_KEY para acceder a auth.admin
// ============================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    // Manejar preflight request
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        // 1. Obtener el token de autorización
        const authHeader = req.headers.get('Authorization')
        if (!authHeader) {
            return new Response(
                JSON.stringify({ error: 'No authorization header' }),
                {
                    status: 401,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                }
            )
        }

        // 2. Crear cliente de Supabase con SERVICE_ROLE_KEY
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
            {
                auth: {
                    autoRefreshToken: false,
                    persistSession: false
                }
            }
        )

        // 3. Crear cliente normal para verificar el usuario
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            {
                global: {
                    headers: { Authorization: authHeader }
                }
            }
        )

        // 4. Obtener el usuario actual
        const { data: { user }, error: userError } = await supabaseClient.auth.getUser()

        if (userError || !user) {
            return new Response(
                JSON.stringify({ error: 'Usuario no autenticado' }),
                {
                    status: 401,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                }
            )
        }

        console.log(`🗑️ Eliminando cuenta del usuario: ${user.id}`)

        // 5. Eliminar el usuario de auth.users
        // Esto también eliminará automáticamente:
        // - El perfil en public.profiles (ON DELETE CASCADE)
        // - Los registros en support_email_limits (ON DELETE CASCADE)
        const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user.id)

        if (deleteError) {
            console.error('Error eliminando usuario:', deleteError)
            return new Response(
                JSON.stringify({
                    error: 'Error al eliminar la cuenta',
                    details: deleteError.message
                }),
                {
                    status: 500,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                }
            )
        }

        console.log(`✅ Cuenta eliminada exitosamente: ${user.id}`)

        // 6. Retornar éxito
        return new Response(
            JSON.stringify({
                success: true,
                message: 'Cuenta eliminada exitosamente',
                userId: user.id
            }),
            {
                status: 200,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
        )

    } catch (error) {
        console.error('Error inesperado:', error)
        return new Response(
            JSON.stringify({
                error: 'Error interno del servidor',
                details: error.message
            }),
            {
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
        )
    }
})

/* ============================================================
 * INSTRUCCIONES DE DESPLIEGUE
 * ============================================================
 * 
 * 1. Instalar Supabase CLI:
 *    npm install -g supabase
 * 
 * 2. Inicializar proyecto (si no lo has hecho):
 *    supabase init
 * 
 * 3. Crear la función:
 *    supabase functions new delete-user-account
 * 
 * 4. Copiar este código en:
 *    supabase/functions/delete-user-account/index.ts
 * 
 * 5. Desplegar la función:
 *    supabase functions deploy delete-user-account --no-verify-jwt
 * 
 * 6. La URL de la función será:
 *    https://[tu-proyecto].supabase.co/functions/v1/delete-user-account
 * 
 * ============================================================
 * USO DESDE EL FRONTEND
 * ============================================================
 * 
 * import { supabase } from './supabaseClient';
 * 
 * const deleteAccount = async () => {
 *   const { data: { session } } = await supabase.auth.getSession();
 *   
 *   if (!session) {
 *     console.error('No hay sesión activa');
 *     return;
 *   }
 * 
 *   const response = await fetch(
 *     'https://[tu-proyecto].supabase.co/functions/v1/delete-user-account',
 *     {
 *       method: 'POST',
 *       headers: {
 *         'Authorization': `Bearer ${session.access_token}`,
 *         'Content-Type': 'application/json'
 *       }
 *     }
 *   );
 * 
 *   const result = await response.json();
 *   
 *   if (result.success) {
 *     console.log('✅ Cuenta eliminada');
 *     // Redirigir al usuario a la página de inicio
 *   } else {
 *     console.error('❌ Error:', result.error);
 *   }
 * };
 * 
 * ============================================================
 */
