pages['student-applications'] = () => `
<div class="topbar">
  <span class="topbar-title">Mis Solicitudes</span>
  <div class="topbar-actions">
    <button class="btn btn-primary btn-sm" onclick="goTo('student-opportunities')">${icon('plus', 14)} Nueva solicitud</button>
  </div>
</div>
<div class="page-body">
  <div class="chips">
    <span class="chip active">Todas</span>
    <span class="chip">En revisión</span>
    <span class="chip">Aprobadas</span>
    <span class="chip">Borradores</span>
    <span class="chip">Rechazadas</span>
  </div>

  <div class="card">
    <div class="card-body" style="padding:0">
      <table>
        <thead>
          <tr>
            <th>Universidad destino</th>
            <th>Semestre</th>
            <th>Programa</th>
            <th>Estado</th>
            <th>Actualizado</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <div style="font-weight:600;color:var(--fg)">Universidad de Chile</div>
              <div style="font-size:12px;color:var(--fg-3)">Santiago, Chile 🇨🇱</div>
            </td>
            <td>2025-2</td>
            <td>Ingeniería Civil</td>
            <td>${statusBadge('En revisión')}</td>
            <td>15 mar 2025</td>
            <td><button class="btn btn-sm btn-ghost">${icon('eye', 14)}</button></td>
          </tr>
          <tr>
            <td>
              <div style="font-weight:600;color:var(--fg)">Univ. de los Andes (CO)</div>
              <div style="font-size:12px;color:var(--fg-3)">Bogotá, Colombia 🇨🇴</div>
            </td>
            <td>2025-2</td>
            <td>Administración</td>
            <td>${statusBadge('Borrador')}</td>
            <td>22 feb 2025</td>
            <td>
              <div style="display:flex;gap:4px">
                <button class="btn btn-sm btn-ghost">${icon('edit', 14)}</button>
                <button class="btn btn-sm btn-ghost">${icon('eye', 14)}</button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>

  <div class="card" style="margin-top:16px">
    <div class="card-header"><span class="card-title">Detalle — Universidad de Chile</span></div>
    <div class="card-body">
      <div class="grid-2">
        <div>
          <div class="detail-row"><span style="color:var(--fg-3);font-size:12px;width:140px;flex-shrink:0">Universidad</span><span style="font-weight:500">Universidad de Chile</span></div>
          <div class="detail-row"><span style="color:var(--fg-3);font-size:12px;width:140px;flex-shrink:0">Semestre</span><span>2025-2</span></div>
          <div class="detail-row"><span style="color:var(--fg-3);font-size:12px;width:140px;flex-shrink:0">Programa de origen</span><span>Ing. de Sistemas · Semestre 7</span></div>
          <div class="detail-row"><span style="color:var(--fg-3);font-size:12px;width:140px;flex-shrink:0">Créditos planificados</span><span>18 créditos (6 materias)</span></div>
        </div>
        <div>
          <div class="detail-row"><span style="color:var(--fg-3);font-size:12px;width:140px;flex-shrink:0">Estado</span><span>${statusBadge('En revisión')}</span></div>
          <div class="detail-row"><span style="color:var(--fg-3);font-size:12px;width:140px;flex-shrink:0">Asesor asignado</span><span>Laura Castillo</span></div>
          <div class="detail-row"><span style="color:var(--fg-3);font-size:12px;width:140px;flex-shrink:0">Enviada</span><span>15 mar 2025</span></div>
          <div class="detail-row"><span style="color:var(--fg-3);font-size:12px;width:140px;flex-shrink:0">Última actualización</span><span>18 mar 2025</span></div>
        </div>
      </div>
      <div style="margin-top:16px">
        <div style="font-size:12px;font-weight:600;color:var(--fg-2);margin-bottom:8px">Progreso de revisión</div>
        <div class="progress-bar"><div class="progress-fill" style="width:40%"></div></div>
        <div style="font-size:12px;color:var(--fg-3);margin-top:4px">Paso 2 de 5 — Revisión por asesor de movilidad</div>
      </div>
    </div>
  </div>
</div>`;
