# UML Flow SaaS (AI Diagramming Platform)

Esta es la evolución de nuestro MVP inicial de Diagramación a una **plataforma SaaS profesional completa** orientada a la edición, colaboración por turnos y generación inteligente de *Diagramas de Actividad (UML)* asistida por Inteligencia Artificial de Google (Gemini).

Construida con las tecnologías pioneras React, Konva.js (para la renderización acelerada por Canvas) y Zustand, más un soporte total Backend con PostgreSQL.

## Arquitectura Extendida

La plataforma SaaS implementa:
- **Modelo de Cuentas:** Login, Registro e Inicio de sesión persistente para organizar archivos lógicos en la nube (Postgres).
- **Entorno Unificado (UI Compartida):** Todo el sistema obedece a un esquema estético de "Paneles Oscuros / Draw.io moderno" (SaaS styling y utilitarios globales) manteniendo limpieza gráfica a 60 FPS.
- **Asistente de Inteligencia Artificial (Gemini):** ¿No quieres diagramar manualmente? Abre el panel de IA, describe el flujo, y nuestro motor acoplado a Google Gemini generará instantáneamente los contenedores y conexiones calculadas en milisegundos. (Requiere API Key de Google personal administrada de manera segura).
- **Control Táctico Empresarial (BPMN Engine):** Tu diagrama es más que un dibujo, es ejecutable.
  - *Modo Edición Interactiva*: Un robusto módulo constructor te permite armar formularios personalizados en cada "Actividad" (Inputs de texto, Fechas, Selección Múltiple) a lo Moodle o Typeform.
  - *Modo "Play" (Simulación)*: Invita usuarios a correr tu diagrama de flujo. Ellos simplemente deberán llenar el hermoso UI de tu formulario creado; detrás de cámaras las respuestas compilarán en Payloads de formato JSON que viajarán transparentemente a través del lienzo.
- **Workspace Colaborativo Compartido:** Posibilidad de invitar e involucrar de forma programática a correos de terceros a participar y coescribir dentro del lienzo infinito de tus diagramas guardados. Incluye Notificaciones En-Demanda.

---

## Manual de Usuario 📘

Sigue estas guías para aprovechar el máximo potencial de UML Flow SaaS.

### 1. Iniciar sesión y el Dashboard
1. Navega a `http://localhost:5173/`.
2. Entra a la opción **"Regístrate"** para crear tu primera cuenta.
3. Serás redirigido al **Dashboard principal** (Mis Diagramas). Desde aquí podrás ver los archivos de tu propiedad, los documentos donde se te ha invitado (Compartidos Conmigo) y un botón superior para Crear Nuevo Diagrama.

### 2. Configuración de API Key (Cerebro Gen AI)
Nuestra herramienta depende de Gemini para la auto-construcción.
1. Haz clic en el ícono de Engranaje (⚙️) al lado de tu nombre en la Cabecera.
2. Ingresa a **Configuración de la Cuenta**.
3. En el campo Google Gemini AI, introduce tu clave secreta de [Google AI Studio](https://aistudio.google.com/).
4. Esa clave viaja *encriptada 256 bits* a la base de datos, y **nadie en el navegador** puede interceptarla mas adelante. Haz clic en Guardar Cambios.

### 3. Modificando y Generando un Diagrama
1. Ingresa a uno de tus diagramas haciendo clic sobre él en el Dashboard.
2. **Uso Manual:** 
   - Arrastra Carriles y Nodos (Formas) desde el panel izquierdo hacia el centro cuadriculado.
   - Pulsa los íconos de conexión (Puntos Celestes Flotantes) para lanzar un cable a 90 grados hacia otra pieza.
   - Haz clic en Guardar (Cabecera Superior) para sincronizar todos tus objetos a la Nube.
3. **Uso con Inteligencia Artificial:**
   - Haz clic en el botón superior **"AI Assistant"**.
   - En el recuadro que se despliega, por ejemplo escribe: *"Crea un diagrama completo de un carrito de compras. Usa 2 carriles: Usuario y Pasarela de pago. Finaliza el nodo cuando el pago sea exitoso"*.
   - El entorno dibujará todas las iteraciones en caliente gracias al modelo *Flash*.

### 4. Invitando Colegas y Compartiendo el Espacio
1. Adentro del archivo desde el editor, localiza el texto **"Compartir"** iluminado en azul en la barra secundaria del encabezado central.
2. En la ventana flotante, escribe el **correo electrónico** del miembro con el que deseas colaborar. (Este compañero ya debe existir en la plataforma SaaS).
3. Envía la invitación. Él recibirá en su Cabecera Universal de notificaciones la alerta ("La Campana" se iluminará de rojo).
4. El colega ahora observará el diagrama enlistado en *"Compartidos Conmigo"* y podrán aplicar ediciones bajo el control del websockets.

> [!TIP]
> **El Botón Renombrar Documento:** Hemos prescindido de los popups; el título del documento en la barra top central es un `input` natural. Cliquea las palabras donde dice "Diagrama Nuevo", modifícalas y se reflejará instintivamente en la ventana.

---

## Arranque Rápido para Desarrolladores

```bash
# 1. Instalar dependencias del CLI React (Vite)
npm install

# 2. Levantar el Front-End (Puerto Automático VITE)
npm run dev
```

