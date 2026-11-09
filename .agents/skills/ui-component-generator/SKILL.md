# ui-component-generator

## Objetivo unico
Guiar la creacion estandarizada de componentes React reutilizables en:

- ./uis/website
- ./uis/backoffice

## Inputs requeridos
1. Nombre del componente.
2. Props tipadas con TypeScript.
3. Variante de estilo Tailwind.

## Output esperado
Generar codigo fuente del componente .tsx que cumpla con:

- export nombrado del componente.
- export de las props del componente.
- interfaz accesible con cumplimiento WCAG AA.

## Criterios de aceptacion verificables
- [ ] Tipado estricto sin uso de any.
- [ ] Uso exclusivo de estilos Tailwind.
- [ ] Presencia de atributos aria-label en elementos interactivos.
