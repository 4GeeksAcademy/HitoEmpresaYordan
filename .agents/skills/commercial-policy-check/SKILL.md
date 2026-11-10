---
name: commercial-policy-check
description: Verifica que una propuesta comercial o respuesta a un prospecto respete las condiciones vigentes de Nexova antes de enviarse.
---

# Validación de condiciones comerciales de Nexova

## Objetivo

Determinar si un borrador de oferta o respuesta comercial es consistente con `CONTEXT.md`, e identificar con precisión cualquier cifra, compromiso o excepción incorrectos, no sustentados o sujetos a aprobación. Esta skill valida; no negocia ni autoriza excepciones.

## Cuándo usarla

Antes de entregar una cotización, responder una objeción de prospecto o comunicar tarifas, pagos, plazos, garantías, condiciones de cancelación o conflictos de interés.

## Inputs

- **Borrador:** texto de oferta o respuesta que se quiere validar.
- **Servicio:** headhunting, outsourcing de soporte, formación o combinación.
- **Contexto de la solicitud:** datos necesarios para evaluar condiciones (por ejemplo, nivel del perfil, tamaño del grupo, número de agentes, duración, cliente nuevo o relación de más de dos años).
- **Aprobaciones disponibles:** persona que aprobó una excepción y alcance de esa aprobación; si no se proporciona, asumir que no hay aprobación.

Si faltan datos que determinan una condición, marcarlos como pendientes; no inferirlos.

## Procedimiento

1. Leer `CONTEXT.md` y extraer solo las condiciones aplicables al servicio y a la solicitud.
2. Contrastar cada importe, porcentaje, plazo, mínimo, garantía, penalidad y compromiso del borrador con esa fuente.
3. Comprobar las excepciones y aprobaciones requeridas: descuentos sobre el 22 % de headhunting, pagos alternativos, tamaños de grupo superiores a quince, ubicación restrictiva y conflictos de interés.
4. Informar el resultado como **APROBABLE**, **NO APROBABLE** o **PENDIENTE DE DATOS/APROBACIÓN**, con cada hallazgo vinculado a la condición correspondiente de `CONTEXT.md`.
5. Si hay errores, sugerir únicamente el ajuste necesario para alinearlo con la fuente; no inventar precios ni prometer aprobaciones.

## Criterios de aceptación

El borrador solo puede marcarse **APROBABLE** si se cumplen todos los criterios aplicables:

- Cada cifra y condición coincide con `CONTEXT.md`, incluidos la base de cálculo, periodicidad, población máxima y unidad de cobro.
- Headhunting usa 22 % del salario anual bruto y el calendario 30/30/40; los plazos se describen como promedios salvo garantía contractual explícita.
- Descuentos, pagos alternativos y compromisos con aprobación nombran la autorización requerida; sin evidencia de aprobación, quedan pendientes.
- Outsourcing respeta el rango mensual de USD 1.800 a USD 2.400 por agente, el mínimo de cinco agentes y el plazo mínimo de seis meses; la penalidad anticipada y los costes incluidos no se contradicen.
- Formación respeta los precios desde USD 3.500/6.200/8.900 para programas de 4/8/12 semanas y hasta 15 personas; grupos mayores requieren cotización personalizada.
- Las garantías, rondas adicionales, escalamiento por SLA, restricciones geográficas y conflictos de interés se presentan con sus condiciones, sin convertir promedios en promesas.
- Toda condición no verificable por falta de contexto se identifica como pendiente, nunca se completa mediante una suposición.

## Formato de salida

- **Resultado:** APROBABLE, NO APROBABLE o PENDIENTE DE DATOS/APROBACIÓN.
- **Hallazgos:** condición del borrador, regla aplicable de `CONTEXT.md` y corrección o dato requerido.
- **Texto corregido:** incluir solo si el borrador necesita cambios; conservar su intención sin ampliar compromisos.