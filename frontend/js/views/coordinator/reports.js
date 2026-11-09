pages['coordinator-reports'] = () => `
<div class="topbar">
  <span class="topbar-title">Reportes</span>
  <div class="topbar-actions">
    <select class="form-select" style="width:auto">
      <option>2025 — Semestre 1</option>
      <option>2024 — Semestre 2</option>
      <option>2024 — Semestre 1</option>
    </select>
    <button class="btn btn-sm btn-secondary">${icon('download',14)} Exportar</button>
  </div>
</div>
<div class="page-body">
  <div class="stats-grid">
    <div class="stat-card"><div class="stat-label">Total solicitudes</div><div class="stat-value">134</div><div class="stat-sub delta-up">↑ 18% vs 2024-S1</div></div>
    <div class="stat-card"><div class="stat-label">Tasa de aprobación</div><div class="stat-value">74%</div><div class="stat-sub">99 de 134</div></div>
    <div class="stat-card"><div class="stat-label">Estudiantes en movilidad</div><div class="stat-value">87</div><div class="stat-sub">en 15 países</div></div>
    <div class="stat-card"><div class="stat-label">Convenios utilizados</div><div class="stat-value">24 / 42</div><div class="stat-sub">57% del portafolio</div></div>
  </div>

  <div class="grid-2">
    <div class="card">
      <div class="card-header"><span class="card-title">Solicitudes por mes</span></div>
      <div class="card-body">
        ${[
          { mes:'Ene', n:8 }, { mes:'Feb', n:22 }, { mes:'Mar', n:31 }, { mes:'Abr', n:28 },
          { mes:'May', n:19 }, { mes:'Jun', n:14 }, { mes:'Jul', n:6 }, { mes:'Ago', n:6 },
        ].map(m => `
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px">
            <span style="width:28px;font-size:12px;color:var(--fg-3);flex-shrink:0">${m.mes}</span>
            <div class="progress-bar" style="flex:1">
              <div class="progress-fill" style="width:${Math.round(m.n/31*100)}%"></div>
            </div>
            <span style="width:24px;text-align:right;font-size:12px;color:var(--fg-2)">${m.n}</span>
          </div>`).join('')}
      </div>
    </div>

    <div class="card">
      <div class="card-header"><span class="card-title">Top destinos 2025-S1</span></div>
      <div class="card-body" style="padding:0">
        <table>
          <thead><tr><th>Universidad</th><th>País</th><th>Estudiantes</th></tr></thead>
          <tbody>
            ${[
              { name:'Universidad de Chile', country:'🇨🇱', n:14 },
              { name:'UNAM', country:'🇲🇽', n:11 },
              { name:'U. de los Andes CO', country:'🇨🇴', n:10 },
              { name:'UAM Madrid', country:'🇪🇸', n:8 },
              { name:'USP São Paulo', country:'🇧🇷', n:7 },
              { name:'TU Munich', country:'🇩🇪', n:4 },
            ].map(d => `
              <tr>
                <td style="font-size:13px">${d.name}</td>
                <td>${d.country}</td>
                <td><strong>${d.n}</strong></td>
              </tr>`).join('')}
          </tbody>
        </table>
      </div>
    </div>
  </div>
</div>`;
