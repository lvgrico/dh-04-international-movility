# Cómo integrarlo en tu repositorio y entregar

## 1. Estructura en GitHub
Copia el contenido de este ZIP en la raíz del repo así (el README del repo ya apunta a `prototype/`, que ahora sí existe):

```
docs/evaluation-3/   ← architecture-update.md, traceability.md, limitations-and-risks.md, video-script.md
prototype/           ← db/, src/, tests/, scripts/, package.json, tsconfig.json, docker-compose.yml, .env.example
evidence/evaluation-3/ ← test-run.txt, demo-run.txt, lock-order-experiment.md  (o dentro de docs/evaluation-3/evidence)
```
Si lo mueves, ajusta las rutas relativas del README interno (`docs/…`, `evidence/…`). El ZIP de entrega, en cambio, debe conservar **la estructura `evaluacion-3/` tal cual** (la pide el enunciado).

## 2. Actualiza el README raíz del repo
- En *Where is everything?* agrega: `Review the Evaluation 3 architecture update → docs/evaluation-3/architecture-update.md`.
- En *Status by evaluation* reemplaza `[TEAM TO COMPLETE]` de la fila de Evaluación 2 y añade:

| Evaluation | Content | Design | Implementation | Validation |
|---|---|---|---|---|
| 3 — Architecture update + first increment | Quota, single acceptance, audit, SIS/notification resilience, authorization | Updated (v0.2) | Implemented: end-to-end flow (API) — change management, documents, UI pending | 37 tests executed, 37 passed (`evidence/…/test-run.txt`) |

- En `Team`, completa los `[ROLE]` de cada integrante.

## 3. Antes de entregar (checklist de la lámina 19)
- [ ] Reemplazar `[TEAM: …]` en `README.md` y `docs/architecture-update.md` con el hash del commit.
- [ ] Grabar el video (guion en `docs/video-script.md`) y poner el enlace/archivo en `video-link-or-video.txt`; verificar que el instructor tenga acceso.
- [ ] Ejecutar `npm install && npm run db:reset && npm test` en una máquina limpia (la de otro integrante) y confirmar `pass 37`.
- [ ] Re-ejecutar `QUOTA_TRIALS=100 ACCEPT_TRIALS=50 npm test` y sustituir `evidence/test-run.txt` con **su** corrida (fecha y máquina propias).
- [ ] Añadir capturas de pantalla de la demo en `evidence/` si quieren (opcional, no sustituyen los `.txt`).
- [ ] Un único ZIP por equipo, sin `node_modules/`: `zip -r evaluacion-3.zip evaluacion-3 -x "evaluacion-3/node_modules/*"`.
- [ ] Verificar que el repo no contenga datos reales de estudiantes (todo es sintético).
