pages['student-home'] = () => `
<div class="topbar">
  <span class="topbar-title">Mi Dashboard</span>
  <div class="topbar-actions">
    <button class="icon-btn" title="Notificaciones">${icon('bell')}</button>
  </div>
</div>
<div class="page-body">
  <div class="stats-grid">
    <div class="stat-card">
      <div class="stat-label">Solicitudes activas</div>
      <div class="stat-value">2</div>
      <div class="stat-sub">1 en revisión</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Documentos</div>
      <div class="stat-value">8</div>
      <div class="stat-sub">2 pendientes</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Oportunidades</div>
      <div class="stat-value">14</div>
      <div class="stat-sub">disponibles para ti</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Pre-salida</div>
      <div class="stat-value">65%</div>
      <div class="stat-sub">completado</div>
    </div>
  </div>

  <div class="grid-2">
    <div class="card">
      <div class="card-header">
        <span class="card-title">Mis Solicitudes</span>
        <button class="btn btn-sm btn-ghost" onclick="goTo('student-applications')">Ver todas</button>
      </div>
      <div class="card-body" style="padding:0">
        <table>
          <thead><tr><th>Universidad</th><th>Estado</th><th>Fecha</th></tr></thead>
          <tbody>
            <tr><td><strong>Univ. de Chile</strong></td><td>${statusBadge('En revisión')}</td><td>15 mar 2025</td></tr>
            <tr><td><strong>U. de los Andes (CO)</strong></td><td>${statusBadge('Borrador')}</td><td>22 feb 2025</td></tr>
          </tbody>
        </table>
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <span class="card-title">Línea de tiempo</span>
      </div>
      <div class="card-body">
        <div class="timeline">
          <div class="tl-item">
            <div class="tl-dot done"></div>
            <div class="tl-content"><div class="tl-title">Solicitud enviada</div><div class="tl-sub">15 mar 2025</div></div>
          </div>
          <div class="tl-item">
            <div class="tl-dot now"></div>
            <div class="tl-content"><div class="tl-title">Revisión asesor</div><div class="tl-sub">En curso · ~5 días</div></div>
          </div>
          <div class="tl-item">
            <div class="tl-dot"></div>
            <div class="tl-content"><div class="tl-title">Revisión académica</div><div class="tl-sub">Pendiente</div></div>
          </div>
          <div class="tl-item">
            <div class="tl-dot"></div>
            <div class="tl-content"><div class="tl-title">Nominación enviada</div><div class="tl-sub">Pendiente</div></div>
          </div>
          <div class="tl-item">
            <div class="tl-dot"></div>
            <div class="tl-content"><div class="tl-title">Decisión de la institución</div><div class="tl-sub">Pendiente</div></div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <div class="card">
    <div class="card-header">
      <span class="card-title">Documentos requeridos</span>
      <span class="badge badge-amber">2 pendientes</span>
    </div>
    <div class="card-body">
      <div class="checklist">
        <div class="check-item">
          <div class="check-icon done">${icon('check', 12)}</div>
          <div><div class="check-label">Certificado de matrícula</div><div class="check-sub">Subido el 10 mar 2025</div></div>
        </div>
        <div class="check-item">
          <div class="check-icon done">${icon('check', 12)}</div>
          <div><div class="check-label">Carta de motivación</div><div class="check-sub">Subido el 12 mar 2025</div></div>
        </div>
        <div class="check-item">
          <div class="check-icon pending">${icon('clock', 12)}</div>
          <div><div class="check-label">Récord académico oficial</div><div class="check-sub">Pendiente — solicitado al registro</div></div>
          <div class="check-actions"><button class="btn btn-sm btn-secondary">${icon('upload', 12)} Subir</button></div>
        </div>
        <div class="check-item">
          <div class="check-icon missing">${icon('alert-circle', 12)}</div>
          <div><div class="check-label">Certificado de idioma</div><div class="check-sub">Requerido por Universidad de Chile</div></div>
          <div class="check-actions"><button class="btn btn-sm btn-primary">${icon('upload', 12)} Subir</button></div>
        </div>
      </div>
    </div>
  </div>
</div>`;
