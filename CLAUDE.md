# CLAUDE.md

## Estructura del Proyecto

Este proyecto está construido sobre Next.js y utiliza Prisma como ORM. A continuación se detalla la organización de los directorios principales:

### Directorios Clave

- `prisma/`: Contiene el esquema de la base de datos y las migraciones.
- `public/`: Archivos estáticos como imágenes y fuentes.
- `src/`: El código fuente principal de la aplicación.
  - `app/`: Rutas, páginas y componentes del App Router de Next.js.
    - `api/`: Endpoints de la API del backend.

## Scripts Disponibles

- `npm run dev`: Ejecuta la aplicación en modo desarrollo.
- `npm run build`: Construye la aplicación para producción.
- `npm run start`: Inicia la aplicación construida en producción.
- `npm run lint`: Ejecuta el linter para verificar la calidad del código.

## Arquitectura y Filosofía

La aplicación sigue una arquitectura modular centrada en el `src/app`. Utilizamos el App Router de Next.js para un renderizado eficiente tanto en el servidor como en el cliente.

### Ejemplo de Ruta API (clientes)

Actualmente estás trabajando en `src/app/api/clientes/[id]/route.ts`. Este archivo maneja las peticiones HTTP para un cliente específico.

```typescript
import { NextResponse } from 'next/server';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const id = params.id;
  // Lógica para obtener el cliente de la base de datos...
  return NextResponse.json({ id, name: 'Cliente Ejemplo' });
}
```

La filosofía es mantener el código limpio, tipado con TypeScript, e interactuar con la base de datos de forma segura mediante Prisma.
## Mini-Curso de Backend Fundamentals

Este es un breve resumen de conceptos clave para el desarrollo backend:

### 1. Introducción al Backend
El backend es la "sala de máquinas" de una aplicación. Se encarga de la lógica de negocio, interactuar con la base de datos, y autenticar usuarios.

### 2. APIs (Application Programming Interfaces)
Permiten que el frontend y el backend se comuniquen. Las APIs REST son muy comunes, definiendo endpoints (URLs) para operaciones CRUD (Crear, Leer, Actualizar, Borrar).

### 3. Bases de Datos y ORMs
Las bases de datos (como PostgreSQL o MySQL) guardan la información. Un ORM (como Prisma) te permite interactuar con la base de datos usando código, en lugar de SQL puro.

### 4. Autenticación y Seguridad
Procesos para identificar usuarios y proteger la información, usualmente mediante JWT (JSON Web Tokens) o sesiones.

## Stack Tecnológico y Dependencias

Este proyecto utiliza tecnologías modernas para el frontend y el backend:

### Frontend
- **Framework:** Next.js (versión 16.2.6), utilizando el App Router para la gestión de rutas y renderizado.
- **Interfaz de Usuario:** React 19, con componentes de Base UI y shadcn.
- **Estilos:** Tailwind CSS 4 para un diseño rápido y responsivo, junto con `tailwind-merge` y `clsx` para gestionar clases condicionalmente.
- **Formularios:** React Hook Form junto con Zod para validación de esquemas.
- **Tablas:** TanStack Table para la visualización de datos complejos.
- **Gráficos:** Recharts.
- **Iconos:** Lucide React.

### Backend y Base de Datos
- **ORM:** Prisma (versión 6.19.3) para interactuar con la base de datos de manera tipada.
- **Base de Datos:** Neon (PostgreSQL serverless).

### Otras Herramientas
- **Generación de PDFs:** @react-pdf/renderer.
- **Manejo de Archivos:** file-saver.

## Áreas de Mejora Potenciales

- **Optimización de Rendimiento:** Analizar el bundle size y considerar la carga diferida de componentes grandes como los gráficos o el generador de PDFs si no se usan frecuentemente.
- **Accesibilidad:** Asegurar que los componentes de la interfaz cumplan con los estándares WCAG utilizando las capacidades de Base UI y shadcn.
- **Pruebas:** Considerar la adición de pruebas unitarias o de integración para la lógica crítica de negocio y la API.
