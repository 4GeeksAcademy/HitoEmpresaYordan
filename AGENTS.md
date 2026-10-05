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