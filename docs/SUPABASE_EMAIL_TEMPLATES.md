# 📧 SUPABASE EMAIL TEMPLATES - SportWeather

## 📋 Índice

1. [Configuración Inicial](#configuración-inicial)
2. [Template 1: Confirmación de Cuenta](#template-1-confirmación-de-cuenta)
3. [Template 2: Recuperación de Contraseña](#template-2-recuperación-de-contraseña)
4. [Template 3: Cambio de Email](#template-3-cambio-de-email)
5. [Template 4: Notificación - Contraseña Cambiada](#template-4-notificación---contraseña-cambiada)
6. [Template 5: Notificación - Email Cambiado](#template-5-notificación---email-cambiado)

---

## 🔧 Configuración Inicial

### **Paso 1: Acceder a Email Templates**

1. Ve a [app.supabase.com](https://app.supabase.com)
2. Selecciona tu proyecto **SportWeather**
3. Ve a **Authentication** → **Email Templates**

### **Paso 2: Configurar URL Configuration**

1. Ve a **Authentication** → **URL Configuration**
2. Configura:
   - **Site URL:** `http://localhost:3000` (desarrollo) o `https://tu-dominio.com` (producción)
   - **Redirect URLs:** 
     ```
     http://localhost:3000
     http://localhost:3000/#
     http://localhost:3000/*
     https://tu-dominio.com
     https://tu-dominio.com/#
     https://tu-dominio.com/*
     ```

---

## 📧 TEMPLATE 1: Confirmación de Cuenta

### **Configuración:**
- **Nombre:** Confirm signup
- **Cuándo se envía:** Cuando un usuario se registra por primera vez

### **Subject:**
```
¡Bienvenido a SportWeather! Confirma tu cuenta 🌤️
```

### **Body (HTML):**

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #0f172a;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0f172a; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); border-radius: 16px; overflow: hidden; box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; text-align: center;">
              <h1 style="margin: 0; color: white; font-size: 32px; font-weight: bold;">
                🌤️ SportWeather
              </h1>
              <p style="margin: 10px 0 0 0; color: rgba(255, 255, 255, 0.9); font-size: 16px;">
                Tu asistente personal de deportes y clima
              </p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 20px 0; color: white; font-size: 24px; font-weight: bold;">
                ¡Bienvenido! 👋
              </h2>
              
              <p style="margin: 0 0 20px 0; color: #cbd5e1; font-size: 16px; line-height: 1.6;">
                Gracias por registrarte en <strong style="color: white;">SportWeather</strong>. Estás a un paso de recibir recomendaciones personalizadas sobre qué deporte practicar según el clima.
              </p>

              <p style="margin: 0 0 30px 0; color: #cbd5e1; font-size: 16px; line-height: 1.6;">
                Para activar tu cuenta y comenzar, confirma tu dirección de email haciendo click en el botón:
              </p>

              <!-- Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 20px 0;">
                    <a href="{{ .ConfirmationURL }}" 
                       style="display: inline-block; 
                              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                              color: white; 
                              padding: 16px 40px; 
                              text-decoration: none; 
                              border-radius: 12px; 
                              font-weight: bold;
                              font-size: 16px;
                              box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);">
                      ✅ Confirmar mi cuenta
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Alternative link -->
              <p style="margin: 30px 0 10px 0; color: #94a3b8; font-size: 14px;">
                Si no puedes hacer click en el botón, copia y pega este enlace en tu navegador:
              </p>
              
              <div style="background-color: #1e293b; 
                          border: 1px solid #334155; 
                          border-radius: 8px; 
                          padding: 12px; 
                          margin: 0 0 30px 0;">
                <p style="margin: 0; 
                          color: #64748b; 
                          font-size: 12px; 
                          word-break: break-all; 
                          font-family: monospace;">
                  {{ .ConfirmationURL }}
                </p>
              </div>

              <!-- Features -->
              <div style="background-color: #1e293b; 
                          border-left: 4px solid #667eea; 
                          border-radius: 8px; 
                          padding: 20px; 
                          margin: 0 0 30px 0;">
                <p style="margin: 0 0 15px 0; color: white; font-weight: bold; font-size: 16px;">
                  ¿Qué puedes hacer con SportWeather?
                </p>
                <ul style="margin: 0; padding-left: 20px; color: #cbd5e1; font-size: 14px; line-height: 1.8;">
                  <li>⚽ Selecciona tus deportes favoritos</li>
                  <li>🌦️ Recibe pronósticos de 7 días</li>
                  <li>🎯 Obtén recomendaciones personalizadas</li>
                  <li>📍 Busca cualquier ciudad del mundo</li>
                </ul>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #0f172a; padding: 30px; border-top: 1px solid #334155;">
              <p style="margin: 0 0 10px 0; color: #64748b; font-size: 12px; text-align: center;">
                Si no creaste esta cuenta, puedes ignorar este email de forma segura.
              </p>
              <p style="margin: 0; color: #64748b; font-size: 12px; text-align: center;">
                © 2026 SportWeather. Hecho con ❤️ y ☕
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
```

---

## 🔐 TEMPLATE 2: Recuperación de Contraseña

### **Configuración:**
- **Nombre:** Reset Password
- **Cuándo se envía:** Cuando un usuario solicita recuperar su contraseña

### **Subject:**
```
Recupera tu contraseña de SportWeather 🔐
```

### **Body (HTML):**

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #0f172a;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0f172a; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); border-radius: 16px; overflow: hidden; box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #f59e0b 0%, #dc2626 100%); padding: 40px; text-align: center;">
              <h1 style="margin: 0; color: white; font-size: 32px; font-weight: bold;">
                🔐 SportWeather
              </h1>
              <p style="margin: 10px 0 0 0; color: rgba(255, 255, 255, 0.9); font-size: 16px;">
                Recuperación de contraseña
              </p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 20px 0; color: white; font-size: 24px; font-weight: bold;">
                ¿Olvidaste tu contraseña? 🤔
              </h2>
              
              <p style="margin: 0 0 20px 0; color: #cbd5e1; font-size: 16px; line-height: 1.6;">
                No te preocupes, nos pasa a todos. Recibimos una solicitud para restablecer la contraseña de tu cuenta en <strong style="color: white;">SportWeather</strong>.
              </p>

              <p style="margin: 0 0 30px 0; color: #cbd5e1; font-size: 16px; line-height: 1.6;">
                Haz click en el botón para crear una nueva contraseña:
              </p>

              <!-- Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 20px 0;">
                    <a href="{{ .ConfirmationURL }}" 
                       style="display: inline-block; 
                              background: linear-gradient(135deg, #f59e0b 0%, #dc2626 100%); 
                              color: white; 
                              padding: 16px 40px; 
                              text-decoration: none; 
                              border-radius: 12px; 
                              font-weight: bold;
                              font-size: 16px;
                              box-shadow: 0 4px 12px rgba(245, 158, 11, 0.4);">
                      🔑 Restablecer mi contraseña
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Alternative link -->
              <p style="margin: 30px 0 10px 0; color: #94a3b8; font-size: 14px;">
                Si no puedes hacer click en el botón, copia y pega este enlace en tu navegador:
              </p>
              
              <div style="background-color: #1e293b; 
                          border: 1px solid #334155; 
                          border-radius: 8px; 
                          padding: 12px; 
                          margin: 0 0 30px 0;">
                <p style="margin: 0; 
                          color: #64748b; 
                          font-size: 12px; 
                          word-break: break-all; 
                          font-family: monospace;">
                  {{ .ConfirmationURL }}
                </p>
              </div>

              <!-- Security notice -->
              <div style="background-color: #dc2626/10; 
                          border-left: 4px solid #dc2626; 
                          border-radius: 8px; 
                          padding: 20px; 
                          margin: 0 0 30px 0;">
                <p style="margin: 0 0 10px 0; color: #fca5a5; font-weight: bold; font-size: 16px;">
                  ⚠️ Importante
                </p>
                <ul style="margin: 0; padding-left: 20px; color: #fecaca; font-size: 14px; line-height: 1.8;">
                  <li>Este enlace expira en <strong>1 hora</strong></li>
                  <li>Solo puedes usarlo <strong>una vez</strong></li>
                  <li>Si no solicitaste este cambio, ignora este email</li>
                </ul>
              </div>

              <!-- Tips -->
              <div style="background-color: #1e293b; 
                          border-left: 4px solid #667eea; 
                          border-radius: 8px; 
                          padding: 20px;">
                <p style="margin: 0 0 10px 0; color: white; font-weight: bold; font-size: 16px;">
                  💡 Consejos de seguridad
                </p>
                <ul style="margin: 0; padding-left: 20px; color: #cbd5e1; font-size: 14px; line-height: 1.8;">
                  <li>Usa una contraseña única y fuerte</li>
                  <li>Mínimo 8 caracteres</li>
                  <li>Incluye mayúsculas, minúsculas y números</li>
                  <li>No compartas tu contraseña con nadie</li>
                </ul>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #0f172a; padding: 30px; border-top: 1px solid #334155;">
              <p style="margin: 0 0 10px 0; color: #64748b; font-size: 12px; text-align: center;">
                Si no solicitaste restablecer tu contraseña, puedes ignorar este email de forma segura.
              </p>
              <p style="margin: 0; color: #64748b; font-size: 12px; text-align: center;">
                © 2026 SportWeather. Hecho con ❤️ y ☕
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
```

---

## 📬 TEMPLATE 3: Cambio de Email

### **Configuración:**
- **Nombre:** Change Email Address
- **Cuándo se envía:** Cuando un usuario cambia su dirección de email

### **Subject:**
```
Confirma tu nuevo email en SportWeather 📧
```

### **Body (HTML):**

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #0f172a;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0f172a; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); border-radius: 16px; overflow: hidden; box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); padding: 40px; text-align: center;">
              <h1 style="margin: 0; color: white; font-size: 32px; font-weight: bold;">
                📧 SportWeather
              </h1>
              <p style="margin: 10px 0 0 0; color: rgba(255, 255, 255, 0.9); font-size: 16px;">
                Cambio de dirección de email
              </p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 20px 0; color: white; font-size: 24px; font-weight: bold;">
                Confirma tu nuevo email 📬
              </h2>
              
              <p style="margin: 0 0 20px 0; color: #cbd5e1; font-size: 16px; line-height: 1.6;">
                Recibimos una solicitud para cambiar la dirección de email de tu cuenta en <strong style="color: white;">SportWeather</strong>.
              </p>

              <p style="margin: 0 0 30px 0; color: #cbd5e1; font-size: 16px; line-height: 1.6;">
                Para confirmar este cambio, haz click en el botón:
              </p>

              <!-- Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 20px 0;">
                    <a href="{{ .ConfirmationURL }}" 
                       style="display: inline-block; 
                              background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); 
                              color: white; 
                              padding: 16px 40px; 
                              text-decoration: none; 
                              border-radius: 12px; 
                              font-weight: bold;
                              font-size: 16px;
                              box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);">
                      ✅ Confirmar nuevo email
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Alternative link -->
              <p style="margin: 30px 0 10px 0; color: #94a3b8; font-size: 14px;">
                Si no puedes hacer click en el botón, copia y pega este enlace en tu navegador:
              </p>
              
              <div style="background-color: #1e293b; 
                          border: 1px solid #334155; 
                          border-radius: 8px; 
                          padding: 12px; 
                          margin: 0 0 30px 0;">
                <p style="margin: 0; 
                          color: #64748b; 
                          font-size: 12px; 
                          word-break: break-all; 
                          font-family: monospace;">
                  {{ .ConfirmationURL }}
                </p>
              </div>

              <!-- Security notice -->
              <div style="background-color: #f59e0b/10; 
                          border-left: 4px solid #f59e0b; 
                          border-radius: 8px; 
                          padding: 20px;">
                <p style="margin: 0 0 10px 0; color: #fbbf24; font-weight: bold; font-size: 16px;">
                  ⚠️ Importante
                </p>
                <p style="margin: 0; color: #fcd34d; font-size: 14px; line-height: 1.6;">
                  Si no solicitaste este cambio, <strong>ignora este email</strong> y tu dirección de email no será modificada.
                </p>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #0f172a; padding: 30px; border-top: 1px solid #334155;">
              <p style="margin: 0 0 10px 0; color: #64748b; font-size: 12px; text-align: center;">
                Si no solicitaste cambiar tu email, contacta a soporte inmediatamente.
              </p>
              <p style="margin: 0; color: #64748b; font-size: 12px; text-align: center;">
                © 2026 SportWeather. Hecho con ❤️ y ☕
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
```

---

## 🔔 TEMPLATE 4: Notificación - Contraseña Cambiada

### **Uso:**
Este template es una notificación de seguridad que se envía **después** de que la contraseña ha sido cambiada. Sirve para alertar al usuario en caso de que él no haya realizado el cambio.

### **Subject:**
```
⚠️ Alerta de Seguridad: Tu contraseña fue cambiada
```

### **Body (HTML):**

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #0f172a;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0f172a; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #1e293b; border-radius: 16px; overflow: hidden; border: 1px solid #334155;">
          
          <!-- Warning Header -->
          <tr>
            <td style="background-color: #0f172a; padding: 40px; text-align: center; border-bottom: 2px solid #ef4444;">
              <div style="font-size: 60px; margin-bottom: 20px;">⚠️</div>
              <h1 style="margin: 0; color: #ef4444; font-size: 28px; font-weight: bold;">
                ¿No fuiste tú?
              </h1>
              <p style="margin: 15px 0 0 0; color: #cbd5e1; font-size: 16px;">
                Si **NO** cambiaste tu contraseña, tu cuenta podría estar comprometida.
              </p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px 0; color: #cbd5e1; font-size: 16px; line-height: 1.6;">
                Hola,
              </p>
              <p style="margin: 0 0 20px 0; color: #cbd5e1; font-size: 16px; line-height: 1.6;">
                Te informamos que la contraseña de tu cuenta en **SportWeather** acaba de ser actualizada exitosamente.
              </p>

              <!-- Recovery Action Box -->
              <div style="background-color: #ef4444; border-radius: 12px; padding: 30px; text-align: center; margin: 30px 0;">
                <p style="margin: 0 0 20px 0; color: white; font-weight: bold; font-size: 18px;">
                  Si tú no realizaste este cambio:
                </p>
                <!-- IMPORTANTE: El link debe ir a tu app donde el usuario pueda pedir otro reset -->
                <a href="http://localhost:3000" 
                   style="display: inline-block; 
                          background-color: white; 
                          color: #ef4444; 
                          padding: 16px 30px; 
                          text-decoration: none; 
                          border-radius: 8px; 
                          font-weight: bold;
                          font-size: 16px;">
                  🔒 Recuperar mi cuenta AHORA
                </a>
              </div>

              <div style="background-color: #0f172a; border-radius: 8px; padding: 20px;">
                <p style="margin: 0 0 10px 0; color: white; font-weight: bold; font-size: 14px;">
                  💡 Consejos inmediatos:
                </p>
                <ul style="margin: 0; padding-left: 20px; color: #94a3b8; font-size: 13px; line-height: 1.6;">
                  <li>Asegúrate de que tu nueva contraseña sea única y fuerte</li>
                  <li>Cambia la contraseña de tu correo electrónico si crees que fue vulnerado</li>
                  <li>Si necesitas ayuda adicional, contacta a nuestro equipo de soporte</li>
                </ul>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #0f172a; padding: 30px; border-top: 1px solid #334155; text-align: center;">
              <p style="margin: 0; color: #64748b; font-size: 12px;">
                Este es un mensaje automático de seguridad. No respondas a este correo.
              </p>
              <p style="margin: 10px 0 0 0; color: #64748b; font-size: 12px;">
                © 2026 SportWeather.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
```

---

## 🔔 TEMPLATE 5: Notificación - Email Cambiado

### **Subject:**
```
⚠️ Alerta de Seguridad: Tu email de SportWeather fue cambiado
```

### **Body (HTML):**

Similar al anterior, pero indicando que el email ha sido modificado. El botón de recuperación debe llevar a `http://localhost:3000` para que el usuario pueda contactar a soporte o intentar recuperar el acceso.


---

## ✅ Checklist de Configuración

- [ ] Template "Confirm signup" configurado
- [ ] Template "Reset Password" configurado
- [ ] Template "Change Email Address" configurado
- [ ] Site URL configurada
- [ ] Redirect URLs agregadas
- [ ] "Confirm email" activado/desactivado según necesidad
- [ ] Templates probados con emails reales

---

**Creado:** 2026-01-09  
**Versión:** 1.0  
**Autor:** SportWeather Team
