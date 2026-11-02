pages['coordinator-home'] = () => `
<div class="topbar">
  <span class="topbar-title">Dashboard Operativo</span>
  <div class="topbar-actions">
    <button class="icon-btn">${icon('bell')}</button>
  </div>
</div>
<div class="page-body">
  <div class="stats-grid">
    <div class="stat-card"><div class="stat-label">Convenios activos</div><div class="stat-value">42</div><div class="stat-sub">en 18 países</div></div>
    <div class="stat-card"><div class="stat-label">Estudiantes activos</div><div class="stat-value">87</div><div class="stat-sub">en movilidad 2025-1</div></div>
    <div class="stat-card"><div class="stat-label">Cupos disponibles</div><div class="stat-value">34</div><div class="stat-sub">para 2025-2</div></div>
    <div class="stat-card"><div class="stat-label">Decisiones pendientes</div><div class="stat-value">6</div><div class="stat-sub">de socios</div></div>
  </div>

  <div class="grid-2">
    <div class="card">
      <div class="card-header"><span class="card-title">Oportunidades por vencer</span></div>
      <div class="card-body">
        <div class="timeline">
          <div class="tl-item"><div class="tl-dot alert"></div><div class="tl-content"><div class="tl-title">TU Munich — Cierre nominaciones</div><div class="tl-sub">En 5 días · 2 cupos disponibles</div></div></div>
          <div class="tl-item"><div class="tl-dot alert"></div><div class="tl-content"><div class="tl-title">UAM Madrid — Plazo documentos</div><div class="tl-sub">En 12 días · 3 estudiantes nominados</div></div></div>
          <div class="tl-item"><div class="tl-dot"></div><div class="tl-content"><div class="tl-title">UNAM — Apertura 2025-2</div><div class="tl-sub">En 21 días · 5 cupos</div></div></div>
          <div class="tl-item"><div class="tl-dot"></div><div class="tl-content"><div class="tl-title">USP São Paulo — Cierre 2026-1</div><div class="tl-sub">En 45 días · 4 cupos</div></div></div>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-header"><span class="card-title">Distribución por región</span></div>
      <div class="card-body">
        ${[
          { region:'América Latina', count:18, pct:43, color:'var(--accent)' },
          { region:'Europa', count:14, pct:33, color:'var(--mint)' },
          { region:'Norteamérica', count:7, pct:17, color:'var(--purple)' },
          { region:'Asia-Pacífico', count:3, pct:7, color:'var(--amber)' },
        ].map(r => `
          <div style="margin-bottom:14px">
            <div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:5px">
              <span>${r.region}</span>
              <span style="color:var(--fg-3)">${r.count} convenios · ${r.pct}%</span>
            </div>
            <div class="progress-bar">
              <div class="progress-fill" style="width:${r.pct}%;background:${r.color}"></div>
            </div>
          </div>`).join('')}
      </div>
    </div>
  </div>
</div>`;
