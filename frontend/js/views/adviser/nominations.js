pages['adviser-nominations'] = () => `
<div class="topbar">
  <span class="topbar-title">Nominaciones</span>
  <div class="topbar-actions">
    <button class="btn btn-primary btn-sm">${icon('plus',14)} Nueva nominación</button>
  </div>
</div>
<div class="page-body">
  <div class="stats-grid">
    <div class="stat-card"><div class="stat-label">Enviadas este ciclo</div><div class="stat-value">12</div></div>
    <div class="stat-card"><div class="stat-label">Aceptadas</div><div class="stat-value">9</div></div>
    <div class="stat-card"><div class="stat-label">Pendientes</div><div class="stat-value">2</div></div>
    <div class="stat-card"><div class="stat-label">Rechazadas</div><div class="stat-value">1</div></div>
  </div>

  <div class="card">
    <div class="card-header"><span class="card-title">Nominaciones activas</span></div>
    <div class="card-body" style="padding:0">
      <table>
        <thead>
          <tr><th>Estudiante</th><th>Universidad destino</th><th>Enviada</th><th>Estado institución</th><th>Plazo respuesta</th><th></th></tr>
        </thead>
        <tbody>
          ${[
            { name:'Katerina Morales', dest:'Universidad de Chile', sent:'18 mar 2025', status:'En revisión', due:'15 abr 2025' },
            { name:'Carlos Muñoz', dest:'USP São Paulo', sent:'10 mar 2025', status:'Aceptado', due:'—' },
            { name:'Roberto Díaz', dest:'UAM Madrid', sent:'5 mar 2025', status:'Aceptado', due:'—' },
            { name:'Sara Gómez', dest:'UNAM', sent:'22 mar 2025', status:'En revisión', due:'30 abr 2025' },
            { name:'Luisa Fernández', dest:'TU Munich', sent:'1 feb 2025', status:'Rechazado', due:'—' },
          ].map(n => `
            <tr>
              <td style="font-weight:500;color:var(--fg)">${n.name}</td>
              <td>${n.dest}</td>
              <td>${n.sent}</td>
              <td>${statusBadge(n.status)}</td>
              <td style="color:${n.due==='—'?'var(--fg-3)':'var(--amber)'};">${n.due}</td>
              <td><button class="btn btn-sm btn-ghost">${icon('external-link',14)}</button></td>
            </tr>`).join('')}
        </tbody>
      </table>
    </div>
  </div>
</div>`;
