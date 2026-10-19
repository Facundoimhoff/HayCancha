# Respuestas automáticas de @gridplay.app

Requisito: Instagram como **cuenta profesional** vinculada a la **página de Facebook** de GridPlay.

## 1. Meta Business Suite (gratis, sin límite)

Entrá a <https://business.facebook.com> → **Bandeja de entrada** → ícono de engranaje o **Automatizaciones**. Activá cada una para **Instagram**.

### Respuesta instantánea
```
¡Hola! 👋 Gracias por escribirle a GridPlay.
¿Sos jugador o tenés un club?
⚽ Si querés reservar: gridplay-x.vercel.app
🏟️ Si tenés un club: escribí CLUB y te cuento cómo probarlo 30 días gratis.
Si es otra consulta, dejala acá y te respondemos en el día.
```

### Preguntas frecuentes (máximo 4)
| Pregunta | Respuesta |
|---|---|
| ¿Cómo reservo una cancha? | Entrás a gridplay-x.vercel.app, buscás tu club, elegís el horario libre y confirmás. Es gratis para jugadores y la cancha la pagás en el club. |
| ¿Mi club está en GridPlay? | Buscalo por ciudad en gridplay-x.vercel.app. Si no está, pasale nuestro Instagram al dueño: puede probarlo 30 días gratis. |
| Tengo un club, ¿cómo lo sumo? | Creás tu cuenta en gridplay-x.vercel.app/registro-club, cargás tus canchas y listo. 30 días gratis, sin tarjeta. Si querés, te ayudamos por acá. |
| ¿Cuánto cuesta para clubes? | Los primeros 30 días son gratis y sin tarjeta. Después, el plan es de $50.000 por mes, sin comisiones por reserva ni costo de alta. |

### Palabras clave
| Palabras | Respuesta |
|---|---|
| CLUB | Creás tu cuenta en gridplay-x.vercel.app/registro-club, cargás tus canchas y listo. 30 días gratis, sin tarjeta. ¿De qué ciudad sos y cuántas canchas tenés? Así te ayudo a cargarlo. |
| PRECIO, CUÁNTO, CUANTO | Los primeros 30 días son gratis y sin tarjeta. Después, el plan es de $50.000 por mes, sin comisiones por reserva ni costo de alta. |
| RESERVAR, TURNO | Entrás a gridplay-x.vercel.app, buscás tu club, elegís el horario libre y confirmás. Gratis para jugadores. |
| LINK | Acá tenés: gridplay-x.vercel.app 👉 Reservás en segundos, sin llamar. |

### Mensaje de ausencia (de 23 a 9)
```
¡Gracias por escribirnos! Ahora estamos fuera de horario, pero mañana a primera hora te respondemos. Si querés reservar, podés hacerlo ya mismo en gridplay-x.vercel.app ⚽
```

## 2. ManyChat: comentario "CLUB" → mensaje privado

Los 6 posteos para clubes del calendario dicen "Comentá CLUB y te mando cómo probarlo gratis". **Activalo antes del 26 de octubre** (el primer posteo que lo usa).

1. Entrá a <https://manychat.com>, conectá la cuenta de Instagram y revisá en **Pricing** cuántos contactos incluye el plan gratis. Si son 25, saltá al plan B de abajo.
2. **Automation → New Automation → "User comments on your Post or Reel"**:
   - *Any post or reel* (o elegí los posteos para clubes).
   - *Keywords*: `CLUB`, `club`, `Club`.
   - Activá **Reply to comments publicly** con varias respuestas: "¡Te escribimos por privado! 📩" / "¡Listo, revisá tus mensajes!" / "¡Ahí te mandamos todo por DM!".
3. Mensaje privado:
```
¡Hola! 🙌 Vimos que comentaste CLUB.
Con GridPlay tu club recibe reservas online, sin cuaderno ni mensajes a toda hora.
👉 Creá tu cuenta acá: gridplay-x.vercel.app/registro-club
30 días gratis, sin tarjeta. ¿De qué ciudad sos? Si querés, te ayudo a cargar tus canchas.
```
4. (Opcional) **"User replies to your Story"** para la encuesta "¿Tu club tiene reservas online?" con el mismo mensaje.
5. Publicá la automatización y probala comentando CLUB desde otra cuenta.

**Plan B (si ManyChat gratis no alcanza):** respondé a mano los comentarios con "¡Te escribimos por privado!" y mandá el mensaje del paso 3, o cambiá en las descripciones "Comentá CLUB" por "Escribinos CLUB por mensaje directo" (la palabra clave de Meta responde sola).

> El precio de $50.000 tiene que coincidir con `PRECIO_PLAN_FULL` en Render. Si cambia, actualizá las respuestas.
