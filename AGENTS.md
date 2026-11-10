# Instrucciones para agentes

## Lectura obligatoria al inicio de cada sesión

Antes de investigar o modificar el repositorio, leer completos estos archivos:

1. `memory-bank/projectbrief.md` para entender el negocio, los servicios y las reglas comerciales.
2. `memory-bank/techContext.md` para distinguir la implementación actual de las propuestas y conocer las restricciones técnicas.
3. `memory-bank/progress.md` para retomar el estado y los siguientes pasos sin asumir que el trabajo anterior está terminado.

`CONTEXT.md` es además la fuente canónica cuando la tarea dependa de hechos o condiciones de negocio. Si hay contradicciones, no inventar una resolución: prevalece `CONTEXT.md` y se corrige la memoria del proyecto.

## Flujo obligatorio antes de cada commit

1. Revisar `git status` y el diff completo para identificar cambios propios, cambios preexistentes y archivos generados; conservar los cambios ajenos.
2. Comprobar que el cambio respeta `CONTEXT.md`, los contratos existentes y las reglas de `.agents/rules/`. Aclarar cualquier discrepancia comercial antes de modificar condiciones.
3. Ejecutar las comprobaciones enfocadas del área modificada (pruebas, lint, tipos o compilación según corresponda) y registrar cualquier comprobación que no se haya podido ejecutar.
4. Revisar el diff preparado para el commit y confirmar que solo contiene los archivos intencionados, sin secretos, datos de clientes, resultados generados ni cambios accidentales.
5. Actualizar `memory-bank/progress.md` si cambió el estado o los próximos pasos; volver a revisar el diff preparado después de esa actualización.

No crear un commit hasta completar estos pasos. No incluir ni descartar silenciosamente cambios preexistentes del usuario.

## Rutas protegidas

No modificar, eliminar, renombrar ni reemplazar los siguientes elementos sin confirmación explícita del usuario:

- `CONTEXT.md`, fuente canónica del briefing de negocio.
- `data/` y `results.csv`, que pueden contener datos de entrada o resultados de trabajo.
- Archivos `.env`, `.env.*`, credenciales, tokens, claves privadas o configuraciones que los contengan.
- `infra/` y las configuraciones de despliegue, infraestructura o producción.

Si una tarea necesita cambiar una ruta protegida, detener ese cambio y pedir confirmación concreta. No copiar secretos ni datos personales a documentación, logs o prompts.
# AGENTS.md

## Protocolo de Operacion para Agentes de Codigo

Este documento define reglas obligatorias para cualquier agente que trabaje en este monorepo.

## 1) Lectura Inicial Obligatoria

Al iniciar cada sesion, el agente DEBE leer estos archivos antes de proponer o ejecutar cambios:

1. memory-bank/projectbrief.md
2. memory-bank/techContext.md
3. memory-bank/progress.md

Si alguno no existe o esta desactualizado, el agente debe reportarlo antes de continuar.

## 2) Flujo Pre-Commit Obligatorio

Antes de cualquier commit, el agente DEBE ejecutar y validar estos pasos en orden:

### Paso 1: Verificar tipado y compilacion TypeScript

- Ejecutar el chequeo de tipos global o por paquete:
  - npx tsc --noEmit
  - o el script de tipado definido en el paquete correspondiente.
- Si hay errores, no continuar al siguiente paso hasta corregirlos o escalar el bloqueo.

### Paso 2: Ejecutar linter y formateador

- Ejecutar linter y/o formateador del paquete afectado.
- Ejemplos:
  - npm run lint
  - npm run format
- Resolver errores y advertencias criticas antes de continuar.

### Paso 3: Probar builds locales de UIs obligatorias

- Ejecutar build local de:
  - ./uis/website
  - ./uis/backoffice
- Si algun build falla, detener el flujo de commit, documentar la causa y proponer correccion.

### Paso 4: Actualizar memoria de progreso

- Actualizar memory-bank/progress.md reflejando:
  - Cambios implementados.
  - Resultado de validaciones (tipado, lint, build).
  - Riesgos pendientes o tareas siguientes.

Sin este paso, el trabajo se considera incompleto.

## 3) Archivos y Carpetas Protegidos

El agente NO DEBE modificar estos elementos sin autorizacion expresa del desarrollador:

1. package.json de la raiz del monorepo.
2. Archivos de entorno y secretos:
   - .env
   - .env.*
   - cualquier archivo con credenciales, tokens o llaves.
3. Logica central compartida en:
   - packages/shared/
   - shared/
4. Configuracion de infraestructura y despliegue en:
   - infra/
   - workflows/
5. Configuracion interna/plataforma en:
   - internal/
   - mcps/
6. Scripts globales en:
   - scripts/

Si una tarea requiere tocar alguno de estos elementos, el agente debe solicitar aprobacion explicita antes de editar.

## 4) Criterio de Seguridad Operativa

- Nunca asumir permisos para cambios estructurales.
- Nunca omitir validaciones del flujo pre-commit.
- Siempre dejar trazabilidad tecnica de lo hecho en memory-bank/progress.md.
