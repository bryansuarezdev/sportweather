# 🔒 Configuración de CORS Restrictivo en Supabase

## ¿Qué es CORS y por qué es importante?

**CORS (Cross-Origin Resource Sharing)** es un mecanismo de seguridad que controla qué dominios pueden hacer peticiones a tu backend de Supabase.

### 🚨 Problema sin CORS restrictivo:
Si dejas el wildcard `*` (permitir todos los orígenes), **cualquier sitio web** podría:
- Usar tu API de Supabase
- Consumir tus recursos
- Robar datos de tus usuarios
- Hacer spam a tu base de datos

### ✅ Solución con CORS restrictivo:
Solo **tus dominios autorizados** pueden acceder a Supabase.

---

## 📋 Pasos para Configurar CORS

### **Paso 1: Acceder a la Configuración**

1. Ve a [app.supabase.com](https://app.supabase.com)
2. Selecciona tu proyecto **SportWeather**
3. En el menú lateral, ve a **Settings** (⚙️)
4. Click en **API**

---

### **Paso 2: Localizar "Additional Settings"**

1. Scroll hacia abajo hasta encontrar la sección **"Additional Settings"**
2. Busca el campo **"Allowed Origins"** o **"CORS Origins"**

---

### **Paso 3: Configurar los Orígenes Permitidos**

#### **Para Desarrollo Local:**

Si solo estás en desarrollo, agrega:

```
http://localhost:3000
http://localhost:5173
http://127.0.0.1:3000
http://127.0.0.1:5173
```

> **Nota:** Vite usa el puerto `5173` por defecto, pero algunos proyectos usan `3000`.

---

#### **Para Producción:**

Cuando despliegues a Vercel/Netlify, agrega tu dominio de producción:

```
http://localhost:3000
http://localhost:5173
https://tu-app.vercel.app
https://www.tu-dominio.com
```

---

#### **Formato Correcto:**

✅ **CORRECTO:**
```
http://localhost:3000
https://sportweather.vercel.app
```

❌ **INCORRECTO:**
```
*
http://localhost:3000/*
localhost:3000
```

---

### **Paso 4: Eliminar el Wildcard**

Si ves un asterisco `*` en el campo, **ELIMÍNALO**. Este es el valor por defecto que permite todos los orígenes.

**Antes:**
```
*
```

**Después:**
```
http://localhost:3000
http://localhost:5173
```

---

### **Paso 5: Guardar Cambios**

1. Click en **"Save"** o **"Update"**
2. Espera la confirmación (puede tardar unos segundos)
3. Los cambios son **inmediatos**

---

## 🧪 Verificar que Funciona

### **Test 1: Desde tu app (debe funcionar)**

1. Abre tu app en `http://localhost:3000`
2. Intenta hacer login o cargar datos
3. **Resultado esperado:** ✅ Todo funciona normal

---

### **Test 2: Desde otro dominio (debe fallar)**

1. Abre la consola del navegador (F12)
2. Ve a la pestaña **Console**
3. Ejecuta este código:

```javascript
fetch('https://tu-proyecto.supabase.co/rest/v1/profiles', {
  headers: {
    'apikey': 'tu-anon-key',
    'Authorization': 'Bearer tu-anon-key'
  }
})
.then(r => r.json())
.then(console.log)
.catch(console.error);
```

4. **Resultado esperado:** ❌ Error CORS

```
Access to fetch at 'https://...' from origin 'https://otro-sitio.com' 
has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present.
```

---

## 🔄 Actualizar CORS al Desplegar

### **Cuando despliegues a Vercel:**

1. Despliega tu app normalmente
2. Copia la URL de producción (ej: `https://sportweather.vercel.app`)
3. Ve a Supabase → Settings → API → Allowed Origins
4. **Agrega** la nueva URL (no reemplaces localhost, agrégala)

**Configuración final:**
```
http://localhost:3000
http://localhost:5173
https://sportweather.vercel.app
```

---

### **Si usas un dominio personalizado:**

Agrega también tu dominio custom:

```
http://localhost:3000
http://localhost:5173
https://sportweather.vercel.app
https://www.sportweather.com
https://sportweather.com
```

> **Importante:** Agrega tanto `www.` como sin `www.`

---

## ⚠️ Problemas Comunes

### **Problema 1: "CORS error" después de configurar**

**Causa:** Olvidaste agregar `http://localhost:3000` o usaste el puerto incorrecto.

**Solución:**
1. Verifica en qué puerto corre tu app (mira la terminal)
2. Agrega ese puerto exacto a Allowed Origins
3. Incluye el protocolo `http://` o `https://`

---

### **Problema 2: Funciona en local pero no en producción**

**Causa:** No agregaste la URL de producción.

**Solución:**
1. Copia la URL exacta de Vercel/Netlify
2. Agrégala a Allowed Origins
3. Asegúrate de usar `https://` (no `http://`)

---

### **Problema 3: "Failed to fetch" en producción**

**Causa:** Puede ser CORS o las Redirect URLs de Auth.

**Solución:**
1. Verifica CORS (Settings → API → Allowed Origins)
2. Verifica Auth URLs (Authentication → URL Configuration)
3. Ambas deben tener tu dominio de producción

---

## 📊 Configuración Recomendada por Entorno

### **Desarrollo:**
```
http://localhost:3000
http://localhost:5173
http://127.0.0.1:3000
http://127.0.0.1:5173
```

### **Staging (opcional):**
```
http://localhost:3000
http://localhost:5173
https://sportweather-staging.vercel.app
```

### **Producción:**
```
http://localhost:3000
http://localhost:5173
https://sportweather.vercel.app
https://www.sportweather.com
https://sportweather.com
```

---

## 🔐 Beneficios de Seguridad

Con CORS restrictivo configurado:

✅ **Protección contra robo de API:**
- Nadie puede usar tu Supabase desde otros sitios

✅ **Prevención de scraping:**
- Bots no pueden extraer datos masivamente

✅ **Control de costos:**
- Solo tus apps consumen tus recursos de Supabase

✅ **Cumplimiento de seguridad:**
- Estándar de la industria para APIs públicas

---

## 📝 Checklist Final

Antes de considerar CORS completamente configurado:

- [ ] Eliminé el wildcard `*` de Allowed Origins
- [ ] Agregué `http://localhost:3000` para desarrollo
- [ ] Agregué `http://localhost:5173` (puerto de Vite)
- [ ] Probé que mi app funciona en local
- [ ] (Producción) Agregué mi dominio de Vercel/Netlify
- [ ] (Producción) Probé que funciona en producción
- [ ] Verifiqué que otros sitios NO pueden acceder a mi API

---

## 🎯 Próximos Pasos de Seguridad

Después de configurar CORS, considera implementar:

1. **Content Security Policy (CSP)** - Protección contra XSS
2. **Edge Functions** - Ocultar llamadas a APIs externas
3. **MFA** - Autenticación de dos factores

---

**Última actualización:** 2026-01-10  
**Nivel de Prioridad:** 🔴 ALTA  
**Dificultad:** 🟢 MUY FÁCIL (5 minutos)
