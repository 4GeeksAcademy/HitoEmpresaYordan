"""Caché en memoria con expiración por TTL e invalidación manual.

Estrategia
----------
- Almacenamiento en un dict simple con bloqueo de hilo (threading.Lock).
- Cada entrada guarda: valor serializado, timestamp de creación/actualización.
- TTL fijo por grupo de claves (key_prefix). Por defecto 60 segundos.
- La invalidación se hace por key_prefix completo (ej. invalidar todo
  "suppliers:" cuando ocurre un POST/PUT/DELETE sobre proveedores).
- NO cachear datos privados ni de sesión. Las claves incluyen el key_prefix
  del recurso (público), nunca información del usuario autenticado.
"""

from __future__ import annotations

import threading
import time
from collections.abc import Callable
from typing import Any, TypeVar

F = TypeVar("F", bound=Callable[..., Any])

# ──────────────────────────────────────────────
# Configuración por recurso
# ──────────────────────────────────────────────

CACHE_TTL_SECONDS: dict[str, int] = {
    "suppliers:list": 30,  # 30 s — la lista de proveedores cambia con poca frecuencia
    "incidents:summary": 15,  # 15 s — el resumen de incidencias puede cambiar al crear/modificar
}

DEFAULT_TTL = 60


def _ttl_for(key: str) -> int:
    """Retorna el TTL en segundos para una clave con el formato ``grupo:subclave``."""
    for prefix, ttl in CACHE_TTL_SECONDS.items():
        if key.startswith(prefix):
            return ttl
    return DEFAULT_TTL


# ──────────────────────────────────────────────
# Almacenamiento thread‑safe
# ──────────────────────────────────────────────

_cache: dict[str, tuple[float, Any]] = {}  # key -> (expires_at, value)
_lock = threading.Lock()

# Cache hit / miss counters (para el reporte)
_hits = 0
_misses = 0


def cached(key: str) -> Any | None:
    """Retorna el valor cacheado si existe y no ha expirado, o None."""
    global _hits, _misses
    now = time.monotonic()
    with _lock:
        entry = _cache.get(key)
        if entry is not None:
            expires_at, value = entry
            if now < expires_at:
                _hits += 1
                return value
            # Expirado — eliminar
            del _cache[key]
    _misses += 1
    return None


def store(key: str, value: Any) -> None:
    """Almacena un valor en caché con el TTL correspondiente a la clave."""
    ttl = _ttl_for(key)
    expires_at = time.monotonic() + ttl
    with _lock:
        _cache[key] = (expires_at, value)


def invalidate(prefix: str) -> int:
    """Elimina todas las entradas cuya clave comience con ``prefix``.

    Retorna la cantidad de entradas eliminadas (útil para depuración).
    """
    removed = 0
    with _lock:
        keys_to_delete = [k for k in _cache if k.startswith(prefix)]
        for k in keys_to_delete:
            del _cache[k]
            removed += 1
    return removed


def invalidate_all() -> int:
    """Vacíar toda la caché (para tests o recarga manual)."""
    global _hits, _misses
    with _lock:
        count = len(_cache)
        _cache.clear()
        _hits = 0
        _misses = 0
    return count


def stats() -> dict[str, Any]:
    """Retorna estadísticas de la caché (para el reporte)."""
    with _lock:
        total = _hits + _misses
        hit_rate = (_hits / total * 100) if total > 0 else 0.0
        return {
            "hits": _hits,
            "misses": _misses,
            "hit_rate_pct": round(hit_rate, 1),
            "size": len(_cache),
            "keys": list(_cache.keys()),
        }


# ──────────────────────────────────────────────
# Decorador de conveniencia
# ──────────────────────────────────────────────


def cache_result(key: str) -> Callable[[F], F]:
    """Decorador para cachear el resultado de una función síncrona.

    Uso::

        @cache_result("suppliers:list")
        def list_suppliers(...):
            ...
    """

    def decorator(func: F) -> F:
        def wrapper(*args: Any, **kwargs: Any) -> Any:
            cached_value = cached(key)
            if cached_value is not None:
                return cached_value
            result = func(*args, **kwargs)
            store(key, result)
            return result

        return wrapper  # type: ignore[return-value]

    return decorator