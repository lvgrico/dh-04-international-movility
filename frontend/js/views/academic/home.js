pages['academic-home'] = () => `
<div class="topbar">
  <span class="topbar-title">Dashboard de Revisión Académica</span>
  <div class="topbar-actions">
    <button class="icon-btn">${icon('bell')}</button>
  </div>
</div>
<div class="page-body">
  <div class="stats-grid">
    <div class="stat-card"><div class="stat-label">Pendientes de revisión</div><div class="stat-value">3</div><div class="stat-sub">planes de estudio</div></div>
    <div class="stat-card"><div class="stat-label">Aprobados este mes</div><div class="stat-value">11</div><div class="stat-sub">de 14 recibidos</div></div>
    <div class="stat-card"><div class="stat-label">Con observaciones</div><div class="stat-value">2</div><div class="stat-sub">ajustes solicitados</div></div>
    <div class="stat-card"><div class="stat-label">Tiempo promedio</div><div class="stat-value">1.8d</div><div class="stat-sub">de revisión</div></div>
  </div>

  <div class="grid-2">
    <div class="card">
      <div class="card-header">
        <span class="card-title">Pendientes urgentes</span>
        <span class="badge badge-red">3</span>
      </div>
      <div class="card-body">
        <div class="checklist">
          ${[
            { name:'Katerina Morales', dest:'U. Chile', prog:'Ing. Sistemas', days:2 },
            { name:'Carlos Ruiz', dest:'UNAM', prog:'Economía', days:3 },
            { name:'María Torres', dest:'UAM Madrid', prog:'Derecho', days:4 },
          ].map(r => `
            <div class="check-item">
              <div class="check-icon pending">${icon('clock',12)}</div>
              <div>
                <div class="check-label">${r.name} → ${r.dest}</div>
                <div class="check-sub">${r.prog} · Recibido hace ${r.days} días</div>
              </div>
              <div class="check-actions">
                <button class="btn btn-sm btn-primary" onclick="goTo('academic-reviews')">Revisar</button>
              </div>
            </div>`).join('')}
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-header"><span class="card-title">Actividad reciente</span></div>
      <div class="card-body">
        <div class="timeline">
          <div class="tl-item"><div class="tl-dot done"></div><div class="tl-content"><div class="tl-title">Plan aprobado — Juan Pérez (U. Andes)</div><div class="tl-sub">Hoy, 10:30</div></div></div>
          <div class="tl-item"><div class="tl-dot alert"></div><div class="tl-content"><div class="tl-title">Observaciones enviadas — Sara Gómez (UNAM)</div><div class="tl-sub">Ayer, 15:00</div></div></div>
          <div class="tl-item"><div class="tl-dot done"></div><div class="tl-content"><div class="tl-title">Plan aprobado — Roberto Díaz (UAM Madrid)</div><div class="tl-sub">Ayer, 11:20</div></div></div>
          <div class="tl-item"><div class="tl-dot done"></div><div class="tl-content"><div class="tl-title">Plan aprobado — Luisa Fernández (Erasmus)</div><div class="tl-sub">Hace 2 días</div></div></div>
        </div>
      </div>
    </div>
  </div>
</div>`;
