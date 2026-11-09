pages['academic-history'] = () => `
<div class="topbar">
  <span class="topbar-title">Historial de Revisiones</span>
  <div class="topbar-actions">
    <div class="search-wrap">${icon('search',14)}<input class="search-input" placeholder="Buscar estudiante…"></div>
    <select class="form-select" style="width:auto">
      <option>Todos los semestres</option>
      <option>2025-1</option>
      <option>2024-2</option>
      <option>2024-1</option>
    </select>
  </div>
</div>
<div class="page-body">
  <div class="stats-grid">
    <div class="stat-card"><div class="stat-label">Total revisados</div><div class="stat-value">58</div></div>
    <div class="stat-card"><div class="stat-label">Aprobados</div><div class="stat-value">49</div><div class="stat-sub">84%</div></div>
    <div class="stat-card"><div class="stat-label">Con ajuste</div><div class="stat-value">6</div><div class="stat-sub">10%</div></div>
    <div class="stat-card"><div class="stat-label">Rechazados</div><div class="stat-value">3</div><div class="stat-sub">5%</div></div>
  </div>

  <div class="card">
    <div class="card-body" style="padding:0">
      <table>
        <thead>
          <tr><th>Estudiante</th><th>Universidad destino</th><th>Semestre</th><th>Materias</th><th>Decisión</th><th>Revisado</th><th></th></tr>
        </thead>
        <tbody>
          ${[
            { name:'Juan Pérez', dest:'U. Andes CO', sem:'2025-1', mat:5, dec:'Aprobado', date:'10 mar 2025' },
            { name:'Roberto Díaz', dest:'UAM Madrid', sem:'2025-1', mat:6, dec:'Aprobado', date:'8 mar 2025' },
            { name:'Luisa Fernández', dest:'TU Munich', sem:'2025-1', mat:5, dec:'Aprobado', date:'5 mar 2025' },
            { name:'Sara Gómez', dest:'UNAM', sem:'2025-1', mat:4, dec:'Con ajuste', date:'3 mar 2025' },
            { name:'Andrés Mora', dest:'USP São Paulo', sem:'2025-1', mat:6, dec:'Aprobado', date:'28 feb 2025' },
            { name:'Valeria Castro', dest:'U. de Chile', sem:'2025-1', mat:5, dec:'Rechazado', date:'20 feb 2025' },
            { name:'Diego Herrera', dest:'UCM Madrid', sem:'2024-2', mat:6, dec:'Aprobado', date:'15 sep 2024' },
            { name:'Natalia Soto', dest:'UNAM', sem:'2024-2', mat:4, dec:'Aprobado', date:'12 sep 2024' },
          ].map(h => {
            const badgeMap = { 'Aprobado':'badge-mint', 'Con ajuste':'badge-amber', 'Rechazado':'badge-red' };
            return `
              <tr>
                <td style="font-weight:500;color:var(--fg)">${h.name}</td>
                <td>${h.dest}</td>
                <td>${h.sem}</td>
                <td>${h.mat}</td>
                <td><span class="badge ${badgeMap[h.dec]}">${h.dec}</span></td>
                <td style="color:var(--fg-3)">${h.date}</td>
                <td><button class="btn btn-sm btn-ghost">${icon('eye',14)}</button></td>
              </tr>`;
          }).join('')}
        </tbody>
      </table>
    </div>
  </div>
</div>`;
