# Estado y próximos pasos

## Estado actual

Actualizado: 2026-10-05.

- El contexto empresarial de Nexova está definido en `CONTEXT.md`, con tres líneas de servicio, tarifas, términos de pago, SLA y reglas de escalamiento y aprobación.
- El monorepo contiene una API FastAPI de análisis y exportación de CSV de incidentes, una biblioteca Python compartida para el análisis, una aplicación Next.js de seguimiento de talento, páginas HTML y un backoffice.
- `uis/website/` ya contiene una app Next.js 16.3.8 independiente con landing corporativa, componentes reutilizables y calculadora orientativa de los tres servicios. `npm run build` y `npm run lint` pasan; `npm audit --omit=dev` informa cero vulnerabilidades.
- `uis/backoffice/` conserva su flujo de análisis CSV y ahora presenta un resumen de condiciones de servicio y SLA en `/`. La interfaz usa la API existente; no se añadió otro backend.
- Smoke test local: las rutas `/` del website y del backoffice, y los activos de imagen/favicon del website, respondieron HTTP 200.
- Comandos locales: `cd uis/website && npm run dev` para el website; desde la raíz, `python3 -m http.server 5500 --bind 0.0.0.0 --directory uis/backoffice` para el backoffice. El puerto 5500 coincide con los orígenes CORS locales declarados por la API. Los dos servidores de vista previa están activos en `http://localhost:3000` y `http://localhost:5500`.
- Existe una propuesta de arquitectura de backend modular monolítica en `docs/ARCHITECTURE_PROPOSAL.md`; debe tratarse como orientación, no como implementación concluida.
- La documentación de raíz aún describe en partes la plantilla original y no está completamente actualizada al contexto Nexova.
- La rama de trabajo es `feature/agent-memory-bank`. El último commit existente registra la finalización del script de análisis y su salida. El árbol de trabajo ya tenía cambios locales en `CONTEXT.md` antes de esta tarea; deben conservarse.

## Próximos pasos sugeridos

1. Definir el canal de contacto y el flujo de recepción de solicitudes antes de añadir formularios de negocio o persistencia; esos datos no están especificados en `CONTEXT.md`.
2. Alinear la documentación de raíz con Nexova y sustituir referencias heredadas de la plantilla solo después de verificar qué archivos siguen siendo vigentes.
3. Definir los contratos de datos para las operaciones de headhunting, soporte y formación sin asumir un esquema de persistencia.
4. Añadir pruebas específicas para validación, reglas comerciales y contratos de la API al ampliar cada flujo.
5. Diseñar controles de privacidad, acceso, persistencia, despliegue y observabilidad antes de usar datos reales de clientes o producción.

Actualizar esta página al completar hitos o cambiar decisiones técnicas. No registrar aquí secretos ni datos personales de clientes o candidatos.