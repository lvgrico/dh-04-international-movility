pages['adviser-home'] = () => `
<div class="topbar">
  <span class="topbar-title">Dashboard — Asesora de Movilidad</span>
  <div class="topbar-actions">
    <button class="icon-btn">${icon('bell')}</button>
  </div>
</div>
<div class="page-body">
  <div class="stats-grid">
    <div class="stat-card">
      <div class="stat-label">En cola</div>
      <div class="stat-value">7</div>
      <div class="stat-sub">solicitudes pendientes</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Revisadas hoy</div>
      <div class="stat-value">4</div>
      <div class="stat-sub delta-up">↑ 2 vs. ayer</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Aprobadas este mes</div>
      <div class="stat-value">23</div>
      <div class="stat-sub">de 31 recibidas</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Tiempo promedio</div>
      <div class="stat-value">3.2d</div>
      <div class="stat-sub">de revisión</div>
    </div>
  </div>

  <div class="grid-2">
    <div class="card">
      <div class="card-header">
        <span class="card-title">Cola de revisión</span>
        <button class="btn btn-sm btn-ghost" onclick="goTo('adviser-queue')">Ver todas →</button>
      </div>
      <div class="card-body" style="padding:0">
        <table>
          <thead><tr><th>Estudiante</th><th>Destino</th><th>Recibida</th></tr></thead>
          <tbody>
            <tr><td><strong>Ana López</strong></td><td>U. Chile</td><td>Hace 1 día</td></tr>
            <tr><td><strong>Carlos Ruiz</strong></td><td>UNAM</td><td>Hace 2 días</td></tr>
            <tr><td><strong>María Torres</strong></td><td>UAM Madrid</td><td>Hace 3 días</td></tr>
          </tbody>
        </table>
      </div>
    </div>

    <div class="card">
      <div class="card-header"><span class="card-title">Actividad reciente</span></div>
      <div class="card-body">
        <div class="timeline">
          <div class="tl-item"><div class="tl-dot done"></div><div class="tl-content"><div class="tl-title">Aprobaste solicitud de Juan Pérez → U. Andes</div><div class="tl-sub">Hace 2 horas</div></div></div>
          <div class="tl-item"><div class="tl-dot alert"></div><div class="tl-content"><div class="tl-title">Solicitaste documentos a Sara Gómez</div><div class="tl-sub">Hace 4 horas</div></div></div>
          <div class="tl-item"><div class="tl-dot done"></div><div class="tl-content"><div class="tl-title">Enviaste nominación a TU Munich</div><div class="tl-sub">Ayer, 16:30</div></div></div>
          <div class="tl-item"><div class="tl-dot done"></div><div class="tl-content"><div class="tl-title">Aprobaste solicitud de Carlos Muñoz → USP</div><div class="tl-sub">Ayer, 14:00</div></div></div>
        </div>
      </div>
    </div>
  </div>
</div>`;
