# monorepo-imports

Scope: always

## Regla
Se prohibe la duplicacion de codigo de logica de negocio.

Toda importacion de modulos, funciones centrales o utilidades de dominio debe hacerse desde su ubicacion original dentro del monorepo, usando:

- rutas relativas correctas, o
- aliases de proyecto configurados.

No se permite copiar y pegar implementaciones de modulos existentes para reutilizarlas en otra carpeta.

## Aplicacion practica
- Si una funcion ya existe en modulos del Hito 2 (u otro modulo fuente), debe importarse desde ahi.
- Si la ruta actual dificulta el import, ajustar rutas o alias; no duplicar codigo.
- Si se detecta codigo duplicado de negocio, debe refactorizarse para consumir el modulo original.
