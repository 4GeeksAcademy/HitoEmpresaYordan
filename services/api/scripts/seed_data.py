#!/usr/bin/env python3
"""Seeder de datos realistas para la base de datos Nexova.

Puebla todas las tablas (TinyDB y Supabase/PostgreSQL) con un volumen
de datos variados y coherentes para que las consultas de lectura tengan
coste computable y permitan medir el impacto de las optimizaciones.

Uso:
    cd services/api
    python scripts/seed_data.py [--force] [--incidents N] [--suppliers N] [--records N]

    --force       : Recrea todos los datos desde cero (borra existentes)
    --incidents N : Número de incidencias a crear (defecto: 500)
    --suppliers N : Número de proveedores a crear (defecto: 100)
    --records N   : Número de candidaturas a crear (defecto: 200)
"""

from __future__ import annotations

import argparse
import logging
import random
import sys
from datetime import date, datetime, timedelta, timezone
from pathlib import Path

API_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(API_DIR))

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(message)s",
)
logger = logging.getLogger("seed_data")

# ──────────────────────────────────────────────
# Importaciones locales
# ──────────────────────────────────────────────
from database import (
    db,
    db_lock,
    incidents_table,
    records_table,
    record_notes_table,
    suppliers_table,
    users_table,
    profiles_table,
    init_db,
    _get_engine,
)
from models import (
    Country, Currency, SupplierCategory, SupplierStatus,
    utc_now,
)
from sqlmodel import Session, select

# ──────────────────────────────────────────────
# Catálogos de datos realistas
# ──────────────────────────────────────────────

PROVEEDORES_REALISTAS = [
    # (nombre, país, categorías, tarifa, moneda, email, notas)
    ("LinkedIn Talent Solutions", "USA", ["job_boards", "ats_software"], 4999.0, "USD",
     "enterprise@linkedin.com", "Contrato enterprise anual. 50 licencias recruiter."),
    ("Indeed Hiring", "USA", ["job_boards"], 2999.0, "USD",
     "enterprise@indeed.com", "Plan pay-per-click + sponsorship mensual."),
    ("InfoJobs Premium", "Spain", ["job_boards"], 1500.0, "EUR",
     "empresas@infojobs.net", "Paquete de 200 ofertas activas simultáneas."),
    ("Greenhouse ATS", "USA", ["ats_software", "assessment_tools"], 3499.0, "USD",
     "sales@greenhouse.io", "Suite completa con scorecards e informes."),
    ("Lever", "USA", ["ats_software"], 2999.0, "USD",
     "partners@lever.co", "Nurture workflows integrados con LinkedIn."),
    ("HackerRank for Work", "USA", ["assessment_tools"], 1200.0, "USD",
     "sales@hackerrank.com", "Tests técnicos personalizados. 30 tests/mes."),
    ("Codility", "USA", ["assessment_tools"], 850.0, "USD",
     "enterprise@codility.com", "Plan scale-up. 20 slots por cuatrimestre."),
    ("HackerRank", "USA", ["assessment_tools"], 1200.0, "USD",
     "billing@hackerrank.com", "Skill certifications incluidas."),
    ("Pluralsight Skills", "USA", ["training_platforms"], 2499.0, "USD",
     "corporate@pluralsight.com", "50 licencias con labs y proyectos."),
    ("Udemy Business", "USA", ["training_platforms"], 1999.0, "USD",
     "business@udemy.com", "Acceso a 20.000+ cursos. 100 licencias."),
    ("Coursera for Teams", "USA", ["training_platforms"], 2999.0, "USD",
     "teams@coursera.org", "Suscripción anual con certificados profesional."),
    ("Deel", "USA", ["payroll_and_hr_software"], 3500.0, "USD",
     "sales@deel.com", "Gestión de nóminas internacional + compliance."),
    ("Sage HR", "Spain", ["payroll_and_hr_software"], 800.0, "EUR",
     "clientes@sage.com", "Suite de RRHH local + gestor documental."),
    ("PayFit", "Spain", ["payroll_and_hr_software"], 650.0, "EUR",
     "hola@payfit.com", "Nómina y cotizaciones automatizadas."),
    ("Hireflix", "USA", ["video_interview"], 400.0, "USD",
     "support@hireflix.com", "Entrevistas asíncronas ilimitadas."),
    ("Zoom Video", "USA", ["video_interview"], 600.0, "USD",
     "sales@zoom.us", "Plan business con 10 hosts y sala de grabación."),
    ("HireRight", "USA", ["background_check"], 3500.0, "USD",
     "enterprise@hireright.com", "Verificaciones internacionales + educativas."),
    ("Checkr", "USA", ["background_check"], 2800.0, "USD",
     "sales@checkr.com", "Verificaciones EEUU y LATAM en 48h."),
    ("Servicio Office Print", "Spain", ["office_and_facilities"], 1200.0, "EUR",
     "comercial@servicioprint.es", "Suministro de material de oficina Valencia."),
    ("Office Depot", "USA", ["office_and_facilities"], 1500.0, "USD",
     "corporate@officedepot.com", "Material oficina Miami + mobiliario."),
    ("Amazon Business", "USA", ["it_and_software_licenses"], 0.0, "USD",
     "business@amazon.com", "Plan sin cuota fija. Pago por uso."),
    ("Microsoft 365 Enterprise", "USA", ["it_and_software_licenses"], 6200.0, "USD",
     "m365@microsoft.com", "60 licencias E3 + Power BI + Teams Phone."),
    ("Slack Enterprise", "USA", ["it_and_software_licenses"], 4320.0, "USD",
     "enterprise@slack.com", "Plan Enterprise Grid + 80 usuarios activos."),
    ("Notion Team", "USA", ["it_and_software_licenses"], 960.0, "USD",
     "teams@notion.so", "Wiki interna + wikis de proyecto ilimitadas."),
    ("HR Ferreiro Asesores", "Spain", ["payroll_and_hr_software"], 450.0, "EUR",
     "info@hrferreiro.es", "Asesoría laboral externalizada complementaria."),
    ("Workable", "USA", ["job_boards", "ats_software"], 2000.0, "USD",
     "sales@workable.com", "Publicación multicanal + ATS integrado."),
    ("Teamtailor", "Spain", ["ats_software", "job_boards"], 1400.0, "EUR",
     "hola@teamtailor.com", "Career page personalizada + CRM."),
    ("TestGorilla", "USA", ["assessment_tools"], 950.0, "USD",
     "sales@testgorilla.com", "Test psicométricos y de habilidades."),
    ("AlgoExpert", "USA", ["assessment_tools"], 600.0, "USD",
     "enterprise@algoexpert.com", "Sistema de entrevistas técnicas premium."),
    ("Criteria Corp", "USA", ["assessment_tools"], 1100.0, "USD",
     "sales@criteriacorp.com", "Test cognitivos y de personalidad."),
]

PROVEEDORES_SPAIN = [p for p in PROVEEDORES_REALISTAS if p[1] == "Spain"]
PROVEEDORES_USA = [p for p in PROVEEDORES_REALISTAS if p[1] == "USA"]

CATEGORIAS_RECORD = [
    # (position, stage, status)
    ("Senior Backend Engineer", "interview", "active"),
    ("Frontend Developer React", "screening", "active"),
    ("Data Scientist", "offer", "active"),
    ("DevOps Engineer", "technical_test", "active"),
    ("Product Manager", "screening", "active"),
    ("UX Designer", "interview", "active"),
    ("Full Stack Developer", "technical_test", "active"),
    ("QA Engineer", "screening", "pending"),
    ("Scrum Master", "offer", "active"),
    ("Technical Writer", "hired", "active"),
    ("Security Engineer", "screening", "active"),
    ("Mobile Developer iOS", "technical_test", "pending"),
    ("Mobile Developer Android", "interview", "active"),
    ("Data Engineer", "offer", "active"),
    ("Machine Learning Engineer", "technical_test", "active"),
    ("Solutions Architect", "screening", "active"),
    ("Cloud Engineer AWS", "interview", "active"),
    ("IT Support Specialist", "hired", "active"),
    ("Business Analyst", "screening", "pending"),
    ("Marketing Lead", "offer", "active"),
]

NOMBRES_CANDIDATOS = [
    ("María", "García López"), ("Carlos", "Martínez Ruiz"), ("Ana", "Fernández Pérez"),
    ("José", "Rodríguez Sánchez"), ("Laura", "González Díaz"), ("David", "López Hernández"),
    ("Elena", "Martín Gómez"), ("Javier", "Pérez Morales"), ("Sara", "Sánchez Ramírez"),
    ("Pablo", "Díaz García"), ("Marta", "Ruiz Torres"), ("Daniel", "Jiménez Vargas"),
    ("Cristina", "Vázquez Molina"), ("Fernando", "Moreno Rojas"), ("Isabel", "Muñoz Ortiz"),
    ("Alejandro", "Álvarez Romero"), ("Raquel", "Romero Navarro"), ("Sergio", "Navarro Ramos"),
    ("Patricia", "Torres Gil"), ("Manuel", "Domínguez Iglesias"), ("Beatriz", "Gil Serrano"),
    ("Álvaro", "Gallego Delgado"), ("Lucía", "Ramos Castro"), ("Jorge", "Ortega Méndez"),
    ("Natalia", "Blanco Suárez"), ("Roberto", "Herrero Gallardo"), ("Silvia", "Cruz Ferrer"),
    ("Adrián", "Mendoza Cortés"), ("Carmen", "Aguilar Vera"), ("Hugo", "Campos Peña"),
    ("Irene", "Santana Vega"), ("Víctor", "Crespo Flores"), ("Paula", "Nieto Cabrera"),
    ("Óscar", "Rivas Pardo"), ("Rosa", "Moya Santana"), ("Rubén", "Pons Calvo"),
    ("Mónica", "Esteban Roca"), ("Iván", "Valero Macías"), ("Nuria", "Lozano Barrios"),
    ("Alberto", "Marín Olmedo"), ("Esther", "Peña Redondo"), ("Diego", "Soto Carmona"),
    ("Alicia", "Miranda Fuentes"), ("Francisco", "Vicente Espinosa"), ("Lourdes", "Márquez Caballero"),
    ("Jesús", "Castillo Vera"), ("Ángela", "Pastor Franco"), ("Nicolás", "Guerrero Pons"),
    ("Diana", "Salas Méndez"), ("Marcos", "Cano Aguirre"),
]

TITULOS_INCIDENCIAS = [
    "Error en importación de candidatos desde LinkedIn",
    "Caída del portal de ofertas de empleo",
    "Retraso en la verificación de antecedentes",
    "Candidato reporta bug en formulario de aplicación",
    "Inconsistencia en datos de nómina de contractor",
    "Fallos en la integración con Greenhouse API",
    "Lento rendimiento en panel de reclutadores",
    "Error de facturación duplicada en proveedor",
    "Problema de acceso a la biblioteca de assessment",
    "Incidente de SLA con cliente por respuesta tardía",
    "Alta tasa de rebote en correos de notificación",
    "Migración de datos corrupta en tabla de candidatos",
    "Error 500 al descargar CV en formato PDF",
    "Enlace de videollamada expirado para entrevista",
    "Sincronización fallida con calendario de Outlook",
    "Duplicación de perfiles en la base de datos",
    "Retraso en la entrega de material onboarding",
    "Incumplimiento de plazo en proceso de selección",
    "Error en cálculo de tarifa mensual de proveedor",
]

DESCRIPCIONES_INCIDENCIAS = [
    "Se ha detectado que {n} candidatos no se importaron correctamente desde la API de LinkedIn. El error persiste desde las {h}:{m} UTC.",
    "El servicio de publicación de ofertas experimenta un timeout del 80% en las solicitudes. El equipo de infraestructura está investigando.",
    "La verificación de antecedentes del candidato {nombre} lleva {n} días hábiles sin completarse. El proveedor reporta problemas técnicos.",
    "El formulario de aplicación móvil muestra un error 422 al enviar datos de experiencia laboral. Afecta a candidatos con más de 5 empleos previos.",
    "Se detectaron diferencias entre las horas registradas en Jira y las facturadas en el sistema de nóminas para el contractor ID-{n}.",
    "La API de Greenhouse devuelve HTTP 503 intermitentemente desde las {h}:00. Se han perdido {n} actualizaciones de estado de candidatos.",
    "Los tiempos de carga del panel de reclutamiento superan los 8 segundos en horas pico (10-12 AM). Afecta a {n} usuarios concurrentes.",
    "Se ha generado una factura duplicada por importe de {n} € al proveedor {proveedor}. Se solicita reversión y comprobación del ciclo de facturación.",
    "3 usuarios del equipo de talento reportan imposibilidad de acceder a los tests de HackerRank. Error de autenticación SSO.",
    "El acuerdo de nivel de servicio (SLA) con el cliente {cliente} se ha incumplido en {n} ocasiones este mes por retrasos en la respuesta inicial.",
    "La tasa de bounce de los emails de notificación ha aumentado al {n}%. Se sospecha de un cambio en la configuración SPF/DKIM.",
    "Durante la migración nocturna se perdieron {n} registros de la tabla de candidatos activos. Se ha restaurado desde backup de las 02:00.",
    "Al descargar el CV del candidato ID-{n} se obtiene un error 500 con traceback de S3 timeout. El archivo existe pero excede los 10 MB.",
    "El enlace de Zoom generado para la entrevista con {nombre} expiró antes de la hora programada. Se requiere regeneración manual.",
    "La sincronización bidireccional con Outlook Calendar está caída desde ayer. {n} entrevistas no se reflejan en el calendario del reclutador.",
    "El proceso de deduplicación no está eliminando perfiles con más del 95% de coincidencia. Se han detectado {n} duplicados en el último scan.",
    "El material de onboarding para el nuevo empleado {nombre} (ID-{n}) no se ha entregado. El pedido está pendiente en el almacén de Valencia.",
    "El proceso de selección para la posición {posicion} supera los {n} días sin cubrirse. Se requiere revisión de criterios o ampliación de fuentes.",
    "La API de tarifas devuelve un monto incorrecto para el proveedor {proveedor}. Se detectó una discrepancia de {n} € en la factura del mes actual.",
]

CLIENTES = ["TechCorp", "FinanceBank", "HealthInc", "RetailWorld", "StartupHub", "DataFlow", "CloudScale", "GreenEco"]
PROVEEDORES_NOMBRES = [p[0] for p in PROVEEDORES_REALISTAS]


def _random_date(start_year: int = 2024, end_year: int = 2026) -> datetime:
    """Genera un datetime aleatorio dentro del rango de años."""
    start = datetime(start_year, 1, 1, tzinfo=timezone.utc)
    end = datetime(end_year, 11, 10, tzinfo=timezone.utc)
    delta = end - start
    random_seconds = random.randint(0, int(delta.total_seconds()))
    return start + timedelta(seconds=random_seconds)


def _pick(items: list) -> object:
    return random.choice(items)


def _pick_n(items: list, k: int = 1) -> list:
    return random.sample(items, min(k, len(items)))


# ──────────────────────────────────────────────
# Seeders específicos
# ──────────────────────────────────────────────

def seed_users(force: bool = False) -> None:
    """Crea usuarios variados con perfiles."""
    existing = len(users_table)
    if existing > 1 and not force:
        logger.info("  Usuarios: ya hay %d — saltando (--force para recrear)", existing)
        return

    if force:
        with db_lock:
            for doc_id in [d.doc_id for d in users_table.all()]:
                users_table.remove(doc_ids=[doc_id])
            profiles_table.truncate()
        logger.info("  Usuarios: tabla limpiada (--force)")

    from passlib.hash import bcrypt

    users_data = [
        {"email": "admin@nexova.com", "hashed_password": bcrypt.hash("AdminPass123"), "is_active": True, "role": "admin", "name": "Admin Nexova", "created_at": "2024-01-15T08:00:00"},
        {"email": "manager@nexova.com", "hashed_password": bcrypt.hash("ManagerPass1"), "is_active": True, "role": "manager", "name": "Carlos Gestor", "created_at": "2024-02-01T09:30:00"},
        {"email": "alice@nexova.com", "hashed_password": bcrypt.hash("AlicePass1"), "is_active": True, "role": "user", "name": "Alice Reclutadora", "created_at": "2024-03-10T10:00:00"},
        {"email": "bob@nexova.com", "hashed_password": bcrypt.hash("BobPass123"), "is_active": True, "role": "user", "name": "Bob Talento", "created_at": "2024-03-15T11:00:00"},
        {"email": "inactive@nexova.com", "hashed_password": bcrypt.hash("Inactive1"), "is_active": False, "role": "user", "name": "Inactivo", "created_at": "2024-04-01T12:00:00"},
    ]
    with db_lock:
        for u in users_data:
            existing_doc = users_table.get(lambda d: d.get("email") == u["email"])
            if not existing_doc:
                users_table.insert(u)

        profiles_data = [
            {"user_id": 1, "name": "Admin Nexova", "phone": "+34 600 123 456", "address": "Calle Mayor 1, Valencia"},
            {"user_id": 2, "name": "Carlos Gestor", "phone": "+1 305 555 0102", "address": "100 Biscayne Blvd, Miami"},
            {"user_id": 3, "name": "Alice Reclutadora", "phone": "+34 611 222 333", "address": "Av. del Puerto 45, Valencia"},
            {"user_id": 4, "name": "Bob Talento", "phone": "+1 786 555 0405", "address": "1000 Brickell Ave, Miami"},
        ]
        for p in profiles_data:
            existing_doc = profiles_table.get(lambda d: d.get("user_id") == p["user_id"])
            if not existing_doc:
                profiles_table.insert(p)

    logger.info("  Usuarios: %d activos + perfil", len(users_table))


def seed_incidents(count: int = 500, force: bool = False) -> None:
    """Crea incidencias variadas y coherentes."""
    existing = len(incidents_table)
    if existing > 0 and not force:
        logger.info("  Incidencias: ya hay %d — saltando (--force para recrear)", existing)
        return

    if force:
        with db_lock:
            incidents_table.truncate()
        logger.info("  Incidencias: tabla limpiada (--force)")

    statuses = ["open", "in_progress", "resolved", "discarded"]
    categories = ["technical_failure", "process_error", "client_complaint", "candidate_issue",
                  "staff_issue", "sla_breach", "data_quality", "other"]
    origins = ["customer", "branch", "internal"]
    branches = ["central", "valencia_operations", "miami_office", "remote"]

    created = 0
    batch = []
    for i in range(count):
        titulo = _pick(TITULOS_INCIDENCIAS)
        desc = _pick(DESCRIPCIONES_INCIDENCIAS)
        desc = desc.format(
            n=random.randint(2, 99),
            h=random.randint(8, 18),
            m=random.randint(0, 59),
            nombre=_pick(NOMBRES_CANDIDATOS)[0],
            proveedor=_pick(PROVEEDORES_NOMBRES),
            cliente=_pick(CLIENTES),
            posicion=_pick(CATEGORIAS_RECORD)[0],
        )

        created_at = _random_date(2024, 2026)
        updated_at = created_at + timedelta(
            hours=random.randint(1, 720),  # hasta 30 días después
            minutes=random.randint(0, 59),
        )
        status = _pick(statuses)
        # Si es discarded o resolved, updated_at debe ser posterior a created_at (ya lo es)
        if status in ("resolved", "discarded"):
            # Asegurar que pasaron al menos unas horas
            if updated_at < created_at + timedelta(hours=1):
                updated_at = created_at + timedelta(hours=random.randint(2, 48))

        incident = {
            "title": f"{titulo} #{i+1}",
            "description": desc,
            "category": _pick(categories),
            "origin": _pick(origins),
            "branch": _pick(branches),
            "status": status,
            "created_at": created_at.isoformat(),
            "updated_at": updated_at.isoformat(),
        }
        batch.append(incident)

        if len(batch) >= 50:
            with db_lock:
                incidents_table.insert_multiple(batch)
            created += len(batch)
            logger.info("  Incidencias: %d / %d insertadas", created, count)
            batch = []

    if batch:
        with db_lock:
            incidents_table.insert_multiple(batch)
        created += len(batch)

    logger.info("  Incidencias: %d creadas", created)


def seed_suppliers(count: int = 100, force: bool = False) -> None:
    """Crea proveedores variados."""
    existing = len(suppliers_table)
    if existing > 0 and not force:
        logger.info("  Proveedores: ya hay %d — saltando (--force para recrear)", existing)
        return

    if force:
        with db_lock:
            suppliers_table.truncate()
        logger.info("  Proveedores: tabla limpiada (--force)")

    def _generate_supplier(i: int) -> dict:
        if i < len(PROVEEDORES_REALISTAS):
            nombre, pais, cats_str, tarifa, moneda, email, notas = PROVEEDORES_REALISTAS[i]
            cats = [SupplierCategory(c) for c in cats_str]
        else:
            # Generar proveedores adicionales combinando datos realistas
            base = _pick(PROVEEDORES_REALISTAS)
            nombre = f"{base[0]} {chr(65 + (i % 26))}"
            pais = base[1]
            cats = _pick_n([
                SupplierCategory.JOB_BOARDS,
                SupplierCategory.ATS_SOFTWARE,
                SupplierCategory.ASSESSMENT_TOOLS,
                SupplierCategory.TRAINING_PLATFORMS,
                SupplierCategory.PAYROLL_AND_HR_SOFTWARE,
                SupplierCategory.VIDEO_INTERVIEW,
                SupplierCategory.BACKGROUND_CHECK,
                SupplierCategory.OFFICE_AND_FACILITIES,
                SupplierCategory.IT_AND_SOFTWARE_LICENSES,
            ], k=random.randint(1, 3))
            tarifa = round(random.uniform(200.0, 7000.0), 2)
            moneda = "EUR" if pais == "Spain" else "USD"
            email = f"ventas@{nombre.lower().replace(' ', '')}.com"
            notas = f"Proveedor #{i+1}. Contrato vigente desde 2024."

        country_enum = Country.SPAIN if pais == "Spain" else Country.USA
        currency_enum = Currency.EUR if moneda == "EUR" else Currency.USD

        renewals = ["2025-03-31", "2025-06-30", "2025-09-30", "2025-12-31",
                    "2026-03-31", "2026-06-30", None]

        return {
            "name": nombre,
            "country": country_enum.value,
            "categories": [c.value for c in cats],
            "monthly_rate": tarifa,
            "currency": currency_enum.value,
            "status": _pick(["active", "suspended", "active", "active"]),
            "contract_renewal_date": _pick(renewals),
            "contact_email": email,
            "notes": notas,
            "updated_at": _random_date(2025, 2026).isoformat(),
        }

    batch = []
    created = 0
    for i in range(count):
        batch.append(_generate_supplier(i))
        if len(batch) >= 50:
            with db_lock:
                suppliers_table.insert_multiple(batch)
            created += len(batch)
            logger.info("  Proveedores: %d / %d insertados", created, count)
            batch = []

    if batch:
        with db_lock:
            suppliers_table.insert_multiple(batch)
        created += len(batch)

    logger.info("  Proveedores: %d creados", created)


def seed_records(count: int = 200, force: bool = False) -> None:
    """Crea candidaturas variadas con notas asociadas."""
    existing = len(records_table)
    if existing > 0 and not force:
        logger.info("  Candidaturas: ya hay %d — saltando (--force para recrear)", existing)
        return

    if force:
        with db_lock:
            records_table.truncate()
            record_notes_table.truncate()
        logger.info("  Candidaturas: tablas limpiadas (--force)")

    dominios = ["gmail.com", "outlook.com", "hotmail.com", "nexova.com",
                "empresatest.com", "mail.es", "protonmail.com", "yahoo.es"]

    batch = []
    created = 0
    for i in range(count):
        nombre, apellido = _pick(NOMBRES_CANDIDATOS)
        full_name = f"{nombre} {apellido}"
        position, stage, status = _pick(CATEGORIAS_RECORD)

        # Decidir si el candidato avanzó o no según el stage
        applied_date = _random_date(2024, 2026)

        record = {
            "full_name": full_name,
            "email": f"{nombre.lower()}.{apellido.lower()}{i}@{_pick(dominios)}",
            "phone": f"+34 6{random.randint(00, 99)} {random.randint(100, 999)} {random.randint(100, 999)}" if random.random() > 0.3 else f"+1 305 555 {random.randint(1000, 9999)}",
            "position": position,
            "linkedin_url": f"https://linkedin.com/in/{nombre.lower()}-{apellido.lower()}-{random.randint(100, 999)}",
            "cv_url": f"https://storage.nexova.com/cvs/{nombre.lower()}_{apellido.lower()}_{i}.pdf",
            "experience_years": round(random.uniform(0.5, 20.0), 1),
            "status": status,
            "stage": stage,
            "applied_at": applied_date.isoformat(),
            "external_id": f"EXT-REC-{1000 + i}" if random.random() > 0.2 else None,
        }
        batch.append(record)

        if len(batch) >= 50:
            with db_lock:
                records_table.insert_multiple(batch)
            created += len(batch)
            logger.info("  Candidaturas: %d / %d insertadas", created, count)
            batch = []

    if batch:
        with db_lock:
            records_table.insert_multiple(batch)
        created += len(batch)

    logger.info("  Candidaturas: %d creadas", created)

    # Crear notas para algunas candidaturas
    all_records = records_table.all()
    notas_creadas = 0
    notas_batch = []

    contenidos_notas = [
        "Candidato impresionante en la entrevista técnica. Domina Python, Docker y Kubernetes.",
        "Requiere segunda entrevista con el CTO para evaluar encaje cultural.",
        "El candidato rechazó la oferta por contraoferta de su empresa actual.",
        "Buena primera impresión. Programar entrevista técnica para la próxima semana.",
        "Fallo en el test técnico: no completó el ejercicio de algoritmia en el tiempo dado.",
        "Excelente experiencia en gestión de equipos. Recomendado para posición de Tech Lead.",
        "Candidato no se presentó a la entrevista sin previo aviso. Marcar como no show.",
        "Habilidades de comunicación sobresalientes. Buen fit para rol de cliente-facing.",
        "Se solicita verificación de referencias del empleador anterior antes de proceder.",
        "El candidato está en proceso con otra empresa. Acelerar decisión.",
        "Entrevista en inglés superada con nivel C1. Tiene experiencia internacional.",
        "Portfolio muy sólido. Adjuntar muestras de proyectos anteriores al expediente.",
        "Disponibilidad inmediata. Prefiere modalidad híbrida en Valencia.",
        "Salario pretendido por encima del rango presupuestado. Consultar con manager.",
        "Ha completado el assessment de liderazgo con puntuación sobresaliente (92/100).",
    ]

    creadores = ["Alice Reclutadora", "Carlos Gestor", "Bob Talento", "Admin Nexova"]

    for rec in all_records:
        # 60% de los records tienen al menos 1 nota, 25% tienen 2, 10% tienen 3+
        num_notas = 0
        r = random.random()
        if r < 0.10:
            num_notas = random.randint(3, 5)
        elif r < 0.35:
            num_notas = 2
        elif r < 0.60:
            num_notas = 1
        else:
            num_notas = 0

        for _ in range(num_notas):
            nota_date = _random_date(2024, 2026)
            nota = {
                "record_id": rec.doc_id,
                "content": _pick(contenidos_notas),
                "created_at": nota_date.isoformat(),
                "updated_at": (nota_date + timedelta(hours=random.randint(1, 48))).isoformat(),
                "created_by": _pick(creadores),
                "external_id": f"EXT-NOTE-{random.randint(1000, 9999)}" if random.random() > 0.3 else None,
            }
            notas_batch.append(nota)
            notas_creadas += 1

            if len(notas_batch) >= 100:
                with db_lock:
                    record_notes_table.insert_multiple(notas_batch)
                notas_batch = []
                logger.info("  Notas de candidaturas: %d creadas...", notas_creadas)

    if notas_batch:
        with db_lock:
            record_notes_table.insert_multiple(notas_batch)

    logger.info("  Notas de candidaturas: %d creadas para %d candidaturas", notas_creadas, len(all_records))


def seed_inventory_extended(force: bool = False) -> None:
    """Amplía los datos de inventario en Supabase con más activos, entradas y salidas."""
    try:
        engine = _get_engine()
    except RuntimeError:
        logger.warning("  Supabase no disponible — saltando inventario")
        return

    from sqlmodel import Session, select
    from models import Asset, AssetEntry, AssetExit

    with Session(engine) as session:
        existing = session.exec(select(Asset).limit(1)).first()
        if existing is not None and not force:
            count = session.exec(select(Asset)).all()
            logger.info("  Inventario: ya hay %d activos — saltando (--force para recrear)", len(count))
            return

        if force:
            session.exec(select(AssetEntry)).all()
            session.exec(select(AssetExit)).all()
            for table in [Asset, AssetEntry, AssetExit]:
                session.exec(table.__table__.delete())  # type: ignore[attr-defined]
            session.commit()
            logger.info("  Inventario: tablas limpiadas (--force)")

        # Activos extendidos
        activos_extra = [
            Asset(name='Monitor 27" 4K', sku="NXV-IT-010", category="hardware", office="Valencia"),
            Asset(name='Monitor 27" 4K', sku="NXV-IT-011", category="hardware", office="Miami"),
            Asset(name='Teclado mecánico inalámbrico', sku="NXV-PER-010", category="peripherals", office="Valencia"),
            Asset(name='Teclado mecánico inalámbrico', sku="NXV-PER-011", category="peripherals", office="Miami"),
            Asset(name='Webcam 4K', sku="NXV-PER-020", category="peripherals", office="Valencia"),
            Asset(name='Webcam 4K', sku="NXV-PER-021", category="peripherals", office="Miami"),
            Asset(name='Auriculares con cancelación de ruido', sku="NXV-PER-030", category="peripherals", office="Valencia"),
            Asset(name='Auriculares con cancelación de ruido', sku="NXV-PER-031", category="peripherals", office="Miami"),
            Asset(name='Cargador USB-C 100W', sku="NXV-PER-040", category="peripherals", office="Valencia"),
            Asset(name='Cargador USB-C 100W', sku="NXV-PER-041", category="peripherals", office="Miami"),
            Asset(name='Tóner impresora HP', sku="NXV-OFF-010", category="office_supplies", office="Valencia"),
            Asset(name='Pack bolígrafos corporativos (50 uds)', sku="NXV-OFF-020", category="office_supplies", office="Valencia"),
            Asset(name='Libros de liderazgo transformacional', sku="NXV-TRN-010", category="training_materials", office="Valencia"),
            Asset(name='Curso online de Cloud Computing', sku="NXV-TRN-020", category="training_materials", office="Miami"),
            Asset(name='Silla ergonómica', sku="NXV-OFF-030", category="office_supplies", office="Valencia"),
            Asset(name='Silla ergonómica', sku="NXV-OFF-031", category="office_supplies", office="Miami"),
            Asset(name='Portátil 15" Developer Edition', sku="NXV-IT-020", category="hardware", office="Valencia"),
            Asset(name='Portátil 15" Developer Edition', sku="NXV-IT-021", category="hardware", office="Miami"),
            Asset(name='Tablet gráfica', sku="NXV-IT-030", category="hardware", office="Valencia"),
            Asset(name='Tablet gráfica', sku="NXV-IT-031", category="hardware", office="Miami"),
            Asset(name='Hub Thunderbolt 4', sku="NXV-PER-050", category="peripherals", office="Valencia"),
            Asset(name='Hub Thunderbolt 4', sku="NXV-PER-051", category="peripherals", office="Miami"),
        ]

        # Primero ver si ya hay activos seed (los del seed_inventory original)
        seed_check = session.exec(select(Asset.sku).where(Asset.sku.like("NXV-IT-001"))).first()
        if seed_check is None:
            # Insertar también los activos base del seed_inventory original
            activos_base = [
                Asset(name='Portátil 14" Business', sku="NXV-IT-001", category="hardware", office="Valencia"),
                Asset(name='Portátil 14" Business', sku="NXV-IT-002", category="hardware", office="Miami"),
                Asset(name="Ratón ergonómico", sku="NXV-PER-001", category="peripherals", office="Valencia"),
                Asset(name="Hub USB-C", sku="NXV-PER-002", category="peripherals", office="Miami"),
                Asset(name="Resma de papel A4", sku="NXV-OFF-001", category="office_supplies", office="Valencia"),
                Asset(name="Cuaderno de formación en liderazgo", sku="NXV-TRN-001", category="training_materials", office="Valencia"),
            ]
            session.add_all(activos_base)
            session.commit()
            for a in activos_base:
                session.refresh(a)

        session.add_all(activos_extra)
        session.commit()
        for a in activos_extra:
            session.refresh(a)

        # Construir mapa SKU → ID (incluye los que ya existían)
        todos_assets = session.exec(select(Asset)).all()
        sku_to_id = {a.sku: a.id for a in todos_assets}

        now = datetime.now(timezone.utc)

        # Entradas masivas
        proveedores = ["TechDistrib Valencia S.L.", "Office Depot Miami", "Amazon Business",
                       "Suministros Informáticos SL", "HP Direct", "Logitech Pro",
                       "Dell Enterprise", "Apple Business", "Samsung B2B", "Lenovo Pro"]

        entry_batch = []
        for sku, asset in sku_to_id.items():
            asset_obj = next(a for a in todos_assets if a.id == asset)
            for _ in range(random.randint(1, 5)):  # 1–5 entradas por activo
                entry_date = _random_date(2024, 2026)
                entry_batch.append(AssetEntry(
                    asset_id=asset,
                    quantity=random.randint(5, 100),
                    supplier=_pick(proveedores),
                    office=asset_obj.office,
                    created_at=entry_date,
                    user_uuid="seed-system",
                ))

        session.add_all(entry_batch)
        session.commit()
        logger.info("  Inventario: %d entradas creadas", len(entry_batch))

        # Salidas masivas
        nombres_empleados = [
            "Ana López", "Carlos Ruiz", "Marta García", "David Pérez", "Laura Sánchez",
            "Javier Martínez", "Elena Gómez", "Pablo Díaz", "Sara Rodríguez", "Diego Jiménez",
            "Raquel Moreno", "Sergio Álvarez", "Patricia Romero", "Manuel Torres", "Beatriz Navarro",
            "Álvaro Gil", "Lucía Ortega", "Jorge Ramos", "Natalia Castro", "Roberto Blanco",
            "Silvia Herrero", "Adrián Cruz", "Carmen Mendoza", "Hugo Aguilar", "Irene Campos",
        ]
        exit_batch = []
        for sku, asset in sku_to_id.items():
            asset_obj = next(a for a in todos_assets if a.id == asset)
            for _ in range(random.randint(0, 3)):  # 0–3 salidas por activo
                exit_date = _random_date(2024, 2026)
                exit_type = _pick(["allocation", "allocation", "consumption"])
                assigned_to = _pick(nombres_empleados) if exit_type == "allocation" else None
                exit_batch.append(AssetExit(
                    asset_id=asset,
                    quantity=random.randint(1, 15),
                    exit_type=exit_type,
                    assigned_to=assigned_to,
                    office=asset_obj.office,
                    created_at=exit_date,
                    user_uuid="seed-system",
                ))

        session.add_all(exit_batch)
        session.commit()
        logger.info("  Inventario: %d salidas creadas", len(exit_batch))
        logger.info("  Inventario: %d activos totales en Supabase", len(todos_assets))


def main():
    parser = argparse.ArgumentParser(description="Seeder de datos realistas para Nexova")
    parser.add_argument("--force", action="store_true", help="Recrea todos los datos desde cero")
    parser.add_argument("--incidents", type=int, default=500, help="Número de incidencias (defecto: 500)")
    parser.add_argument("--suppliers", type=int, default=100, help="Número de proveedores (defecto: 100)")
    parser.add_argument("--records", type=int, default=200, help="Número de candidaturas (defecto: 200)")
    args = parser.parse_args()

    logger.info("=" * 60)
    logger.info("Seeder de datos realistas para Nexova")
    logger.info("  Incidencias : %d", args.incidents)
    logger.info("  Proveedores : %d", args.suppliers)
    logger.info("  Candidaturas: %d", args.records)
    logger.info("  Force       : %s", args.force)
    logger.info("=" * 60)

    # Inicializar DB de Supabase (no crítico si no está disponible)
    try:
        init_db()
        logger.info("Conexión a Supabase OK")
    except Exception as e:
        logger.warning("Supabase no disponible: %s", e)

    logger.info("--- Usuarios y perfiles ---")
    seed_users(args.force)

    logger.info("--- Proveedores ---")
    seed_suppliers(args.suppliers, args.force)

    logger.info("--- Incidencias ---")
    seed_incidents(args.incidents, args.force)

    logger.info("--- Candidaturas y notas ---")
    seed_records(args.records, args.force)

    logger.info("--- Inventario (Supabase) ---")
    seed_inventory_extended(args.force)

    # Resumen final
    logger.info("=" * 60)
    logger.info("RESUMEN FINAL")
    with db_lock:
        logger.info("  Usuarios     : %d", len(users_table))
        logger.info("  Perfiles     : %d", len(profiles_table))
        logger.info("  Proveedores  : %d", len(suppliers_table))
        logger.info("  Incidencias  : %d", len(incidents_table))
        logger.info("  Candidaturas : %d", len(records_table))
        logger.info("  Notas        : %d", len(record_notes_table))

    try:
        engine = _get_engine()
        with Session(engine) as session:
            from models import Asset, AssetEntry, AssetExit
            logger.info("  Activos      : %d", len(session.exec(select(Asset)).all()))
            logger.info("  Entradas     : %d", len(session.exec(select(AssetEntry)).all()))
            logger.info("  Salidas      : %d", len(session.exec(select(AssetExit)).all()))
    except Exception as e:
        logger.warning("  Inventario (Supabase): no disponible (%s)", e)

    logger.info("=" * 60)
    logger.info("¡Seeder completado exitosamente!")


if __name__ == "__main__":
    main()