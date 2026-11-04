# Guion del video (5–6 min) — IMAMS, Evaluación 3

Consejo: grabar pantalla dividida (terminal a la izquierda, documento/diagrama a la derecha). **No leer diapositivas**: cada bloque conecta *driver → ADR → componente → demo/prueba*.
Preparación antes de grabar: `npm run db:reset`, `npm start` (terminal 1, con `ENABLE_SIMULATORS=true`), terminal 2 lista para `npm run demo` y `npm test`.
Reparto sugerido (4 integrantes): Laura (contexto) · Jesús (arquitectura) · Daniel (demo) · Paulina (evidencia).

## 0:00–0:45 · Contexto (Laura)
- Problema: solicitudes de movilidad dispersas en correos y hojas de cálculo; los estudiantes confunden **nominación** con **admisión**; los cupos se controlan en paralelo.
- Alcance del incremento: *un flujo real de punta a punta* — publicar oportunidad → postular → validar elegibilidad (SIS simulado) → triage → aprobación académica → **nominar contra cupo** → decisión del socio → **aceptación única por periodo** — con auditoría.
- Qué funciona hoy y qué no: mostrar la tabla de estados de `docs/architecture-update.md §1.1` (implementado / simulado / diseñado / pendiente). Decir explícitamente: *no hay interfaz web; cambio de requisitos por el socio y documentos están diseñados, no construidos*.

## 0:45–2:00 · Arquitectura (Jesús)
- Mostrar **V-CONT** y **V-COMP** actualizados (§2.2, §2.3): monolito modular + worker + PostgreSQL; capas `domain / application / infrastructure / http`.
- Conectar decisión con código (mostrar el archivo, no solo el diagrama):
  1. **ADR-003** → `nominations.ts`: `SELECT … FOR UPDATE` sobre la oportunidad, conteo y inserción en una transacción.
  2. **ADR-011** → `schema.sql`: índice único parcial `(student, term) WHERE ACTIVE`.
  3. **ADR-006** → `REVOKE UPDATE, DELETE` sobre `audit_event`.
- Decir qué cambió respecto a la Evaluación 2: Express en vez de NestJS (E3-ADR-001); outbox simplificado; **orden de locks** en la aceptación (E3-ADR-003).

## 2:00–4:45 · Demostración (Daniel) — ejecutar, no narrar
Ejecutar `npm run demo` (o los pasos manualmente) y pausar en cada bloque:
1. **Flujo válido**: stu-0001 postula → `ELIGIBLE` → triage → aprobación académica → nominación `201`. Señalar la etiqueta *"Nominated by Horizon – not yet admitted"* (nominada ≠ admitida).
2. **Regla de dominio / error**: segundo candidato para la oportunidad llena → `409 QUOTA_EXCEEDED`; mostrar `places: 1, activeNominations: 1`.
3. **Caso alternativo**: stu-0004 (GPA bajo) → `INELIGIBLE`, el asesor no puede avanzarla (`ELIGIBILITY_NOT_CONFIRMED`).
4. **Seguridad**: otro estudiante lee la solicitud → `404`; estudiante intenta nominar → `403`; coordinador sin permiso de excepción → `403 OVERRIDE_NOT_PERMITTED`.
5. **Resiliencia**: apagar el SIS simulado → la postulación se guarda como `PENDING_VALIDATION`; reactivar y correr el worker → `ELIGIBLE`.
6. **Decisión del socio y aceptación**; terminar mostrando la **auditoría** (actor, acción, correlation id).

## 4:45–6:00 · Evidencia (Paulina)
- Ejecutar `QUOTA_TRIALS=100 ACCEPT_TRIALS=50 npm test` (o mostrar `evidence/test-run.txt`): **37 pruebas**, incluye 100 carreras concurrentes por el último cupo (siempre exactamente un `201` y un `409`) y 50 aceptaciones simultáneas.
- Divergencias diseño ↔ código (`architecture-update.md §4`): un **defecto real** que encontró T-ACC-01 (respondía `INVALID_STATE` en vez de `TERM_ALREADY_ACCEPTED`), un hueco (ofertas vencidas no liberaban cupo) y el **deadlock** confirmado con un experimento (`evidence/lock-order-experiment.md`).
- Pendientes y riesgos (`limitations-and-risks.md`): flujo de cambio del socio (R-001 sigue abierto), documentos, UI, login simulado sin CSRF.
- Cierre: la trazabilidad requisito → ADR → componente → código → prueba está en `docs/traceability.md`.
