pages['coordinator-decisions'] = () => `
<div class="topbar">
  <span class="topbar-title">Decisiones de Socios</span>
  <div class="topbar-actions">
    <span class="badge badge-amber">6 pendientes de respuesta</span>
  </div>
</div>
<div class="page-body">
  <div class="chips">
    <span class="chip active">Pendientes (6)</span>
    <span class="chip">Aceptadas (31)</span>
    <span class="chip">Rechazadas (4)</span>
    <span class="chip">Todo el ciclo</span>
  </div>

  <div class="card">
    <div class="card-body" style="padding:0">
      <table>
        <thead>
          <tr><th>Estudiante</th><th>Universidad destino</th><th>Nominado</th><th>Plazo respuesta</th><th>Estado</th><th>Acción</th></tr>
        </thead>
        <tbody>
          ${[
            { name:'Katerina Morales', dest:'U. Chile', nom:'18 mar', due:'15 abr', status:'En revisión' },
            { name:'Sara Gómez', dest:'UNAM', nom:'22 mar', due:'30 abr', status:'En revisión' },
            { name:'Ana López', dest:'UAM Madrid', nom:'20 mar', due:'10 abr', status:'En revisión' },
            { name:'Carlos Ruiz', dest:'U. Andes CO', nom:'15 mar', due:'25 abr', status:'En revisión' },
            { name:'Jorge Pinto', dest:'USP São Paulo', nom:'10 mar', due:'20 abr', status:'En revisión' },
            { name:'Valentina Cruz', dest:'UCM Madrid', nom:'25 mar', due:'5 may', status:'En revisión' },
          ].map(d => `
            <tr>
              <td style="font-weight:500;color:var(--fg)">${d.name}</td>
              <td>${d.dest}</td>
              <td>${d.nom} 2025</td>
              <td style="color:var(--amber);font-weight:500">${d.due} 2025</td>
              <td>${statusBadge(d.status)}</td>
              <td>
                <div style="display:flex;gap:6px">
                  <button class="btn btn-sm btn-primary">Registrar resp.</button>
                  <button class="btn btn-sm btn-ghost">${icon('more-h',14)}</button>
                </div>
              </td>
            </tr>`).join('')}
        </tbody>
      </table>
    </div>
  </div>

  <div class="card" style="margin-top:16px">
    <div class="card-header"><span class="card-title">Registrar respuesta de institución</span></div>
    <div class="card-body">
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Estudiante</label>
          <select class="form-select"><option>Katerina Morales — U. Chile</option></select>
        </div>
        <div class="form-group">
          <label class="form-label">Decisión de la institución</label>
          <select class="form-select"><option>Seleccionar…</option><option>Aceptado</option><option>Rechazado</option><option>Lista de espera</option></select>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Fecha de respuesta</label>
        <input class="form-input" type="date">
      </div>
      <div class="form-group">
        <label class="form-label">Observaciones</label>
        <textarea class="form-textarea" placeholder="Notas adicionales de la institución socia…"></textarea>
      </div>
      <div style="display:flex;gap:8px;justify-content:flex-end">
        <button class="btn btn-secondary">Cancelar</button>
        <button class="btn btn-primary">Guardar decisión</button>
      </div>
    </div>
  </div>
</div>`;
