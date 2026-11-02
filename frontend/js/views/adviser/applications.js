pages['adviser-applications'] = () => `
<div class="topbar">
  <span class="topbar-title">Todas las Solicitudes</span>
  <div class="topbar-actions">
    <div class="search-wrap">${icon('search',14)}<input class="search-input" placeholder="Buscar…"></div>
    <button class="btn btn-sm btn-secondary">${icon('download',14)} Exportar</button>
  </div>
</div>
<div class="page-body">
  <div class="chips">
    <span class="chip active">Todas (31)</span>
    <span class="chip">En revisión (7)</span>
    <span class="chip">Aprobadas (18)</span>
    <span class="chip">Rechazadas (3)</span>
    <span class="chip">Borradores (3)</span>
  </div>

  <div class="card">
    <div class="card-body" style="padding:0">
      <table>
        <thead>
          <tr><th>Estudiante</th><th>Destino</th><th>Semestre</th><th>Estado</th><th>Asesor</th><th>Fecha</th><th></th></tr>
        </thead>
        <tbody>
          ${[
            { name:'Katerina Morales', dest:'U. Chile', sem:'2025-2', status:'En revisión', adv:'L. Castillo', date:'15 mar 2025' },
            { name:'Juan Pérez', dest:'U. Andes CO', sem:'2025-2', status:'Aprobada', adv:'L. Castillo', date:'10 mar 2025' },
            { name:'Sara Gómez', dest:'UNAM', sem:'2025-2', status:'En revisión', adv:'L. Castillo', date:'12 mar 2025' },
            { name:'Carlos Muñoz', dest:'USP São Paulo', sem:'2026-1', status:'Aprobada', adv:'L. Castillo', date:'5 mar 2025' },
            { name:'Luisa Fernández', dest:'TU Munich', sem:'2025-2', status:'Rechazada', adv:'L. Castillo', date:'8 feb 2025' },
            { name:'Roberto Díaz', dest:'UAM Madrid', sem:'2025-2', status:'Aprobada', adv:'L. Castillo', date:'20 feb 2025' },
          ].map(a => `
            <tr>
              <td style="font-weight:500;color:var(--fg)">${a.name}</td>
              <td>${a.dest}</td>
              <td>${a.sem}</td>
              <td>${statusBadge(a.status)}</td>
              <td style="color:var(--fg-3)">${a.adv}</td>
              <td style="color:var(--fg-3)">${a.date}</td>
              <td><button class="btn btn-sm btn-ghost">${icon('eye',14)}</button></td>
            </tr>`).join('')}
        </tbody>
      </table>
    </div>
  </div>
</div>`;
