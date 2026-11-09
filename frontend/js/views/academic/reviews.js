pages['academic-reviews'] = () => `
<div class="topbar">
  <span class="topbar-title">Revisiones Pendientes</span>
  <div class="topbar-actions">
    <span class="badge badge-amber">3 pendientes</span>
  </div>
</div>
<div class="page-body">
  <div class="card" style="margin-bottom:20px">
    <div class="card-header">
      <div>
        <div class="card-title">Plan de estudios — Katerina Morales</div>
        <div style="font-size:12px;color:var(--fg-3);margin-top:2px">Universidad de Chile · Ing. Civil Informática · 2025-2</div>
      </div>
      <span class="badge badge-amber">Pendiente revisión</span>
    </div>
    <div class="card-body">
      <div style="font-size:13px;font-weight:600;color:var(--fg-2);margin-bottom:12px">Materias propuestas (6)</div>
      <table>
        <thead>
          <tr><th>Materia en U. Chile</th><th>Créditos destino</th><th>Equivalente Horizon</th><th>Créditos Horizon</th><th>Revisión</th></tr>
        </thead>
        <tbody>
          ${[
            { dest:'Programación Avanzada', cr1:5, orig:'Estructuras de Datos', cr2:4, ok:true },
            { dest:'Ing. de Software I', cr1:5, orig:'Ing. de Software', cr2:4, ok:true },
            { dest:'Bases de Datos Avanzadas', cr1:4, orig:'Bases de Datos II', cr2:3, ok:true },
            { dest:'Sistemas Distribuidos', cr1:5, orig:'Redes y Comunicaciones', cr2:4, ok:null },
            { dest:'Inteligencia Artificial', cr1:5, orig:'Aprendizaje Automático', cr2:4, ok:null },
            { dest:'Proyecto Integrador', cr1:4, orig:'Proyecto de Grado I', cr2:6, ok:false },
          ].map(m => `
            <tr>
              <td style="font-weight:500">${m.dest}</td>
              <td>${m.cr1}</td>
              <td>${m.orig}</td>
              <td>${m.cr2}</td>
              <td>
                ${m.ok === true  ? '<span class="badge badge-mint">Aprobado</span>' : ''}
                ${m.ok === false ? '<span class="badge badge-red">Observación</span>' : ''}
                ${m.ok === null  ? '<span class="badge badge-gray">Pendiente</span>' : ''}
              </td>
            </tr>`).join('')}
        </tbody>
      </table>

      <div style="margin-top:20px">
        <div class="form-group">
          <label class="form-label">Observaciones del coordinador académico</label>
          <textarea class="form-textarea" placeholder="Ej: El crédito del Proyecto Integrador no es equivalente — requiere ajuste…"></textarea>
        </div>
        <div style="display:flex;gap:8px;justify-content:flex-end">
          <button class="btn btn-secondary">Solicitar ajuste</button>
          <button class="btn btn-danger btn-sm">Rechazar plan</button>
          <button class="btn btn-primary">Aprobar plan de estudios</button>
        </div>
      </div>
    </div>
  </div>

  <div class="card">
    <div class="card-header">
      <div>
        <div class="card-title">Plan de estudios — Carlos Ruiz</div>
        <div style="font-size:12px;color:var(--fg-3);margin-top:2px">UNAM · Economía · 2025-2</div>
      </div>
      <span class="badge badge-amber">Pendiente revisión</span>
    </div>
    <div class="card-body">
      <p style="font-size:13px;color:var(--fg-3)">5 materias · Recibido hace 3 días · Pendiente de apertura</p>
      <button class="btn btn-secondary btn-sm" style="margin-top:8px">Abrir plan completo</button>
    </div>
  </div>
</div>`;
