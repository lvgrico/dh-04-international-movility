pages['student-predeparture'] = () => `
<div class="topbar">
  <span class="topbar-title">Pre-salida</span>
  <div class="topbar-actions">
    <span class="badge badge-amber">En progreso — 65%</span>
  </div>
</div>
<div class="page-body">
  <div class="card" style="margin-bottom:20px">
    <div class="card-body">
      <div style="font-size:13px;font-weight:600;color:var(--fg-2);margin-bottom:8px">Progreso general de pre-salida</div>
      <div class="progress-bar" style="height:10px"><div class="progress-fill" style="width:65%"></div></div>
      <div style="font-size:12px;color:var(--fg-3);margin-top:6px">13 de 20 ítems completados</div>
    </div>
  </div>

  <div class="grid-2">
    <div class="card">
      <div class="card-header"><span class="card-title">Documentación de viaje</span><span class="badge badge-mint">4/4</span></div>
      <div class="card-body">
        <div class="checklist">
          ${['Pasaporte vigente (mín. 6 meses)','Visa estudiantil tramitada','Seguro médico internacional','Constancia de aceptación'].map(i =>
            `<div class="check-item"><div class="check-icon done">${icon('check', 12)}</div><div><div class="check-label">${i}</div></div></div>`
          ).join('')}
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-header"><span class="card-title">Trámites académicos</span><span class="badge badge-amber">2/5</span></div>
      <div class="card-body">
        <div class="checklist">
          <div class="check-item"><div class="check-icon done">${icon('check',12)}</div><div><div class="check-label">Plan de estudios aprobado</div></div></div>
          <div class="check-item"><div class="check-icon done">${icon('check',12)}</div><div><div class="check-label">Acuerdo de reconocimiento firmado</div></div></div>
          <div class="check-item"><div class="check-icon pending">${icon('clock',12)}</div><div><div class="check-label">Matrícula en universidad destino</div><div class="check-sub">Pendiente — esperar aceptación</div></div></div>
          <div class="check-item"><div class="check-icon missing">${icon('alert-circle',12)}</div><div><div class="check-label">Convalidación de materias</div><div class="check-sub">No iniciado</div></div><div class="check-actions"><button class="btn btn-sm btn-primary">Iniciar</button></div></div>
          <div class="check-item"><div class="check-icon missing">${icon('alert-circle',12)}</div><div><div class="check-label">Carta de presentación académica</div><div class="check-sub">Solicitar al coordinador</div></div></div>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-header"><span class="card-title">Logística</span><span class="badge badge-amber">3/6</span></div>
      <div class="card-body">
        <div class="checklist">
          <div class="check-item"><div class="check-icon done">${icon('check',12)}</div><div><div class="check-label">Tiquetes aéreos reservados</div></div></div>
          <div class="check-item"><div class="check-icon done">${icon('check',12)}</div><div><div class="check-label">Alojamiento confirmado</div></div></div>
          <div class="check-item"><div class="check-icon done">${icon('check',12)}</div><div><div class="check-label">Cuenta bancaria internacional</div></div></div>
          <div class="check-item"><div class="check-icon pending">${icon('clock',12)}</div><div><div class="check-label">Línea telefónica local</div><div class="check-sub">Contratar a la llegada</div></div></div>
          <div class="check-item"><div class="check-icon missing">${icon('alert-circle',12)}</div><div><div class="check-label">Transporte aeropuerto → alojamiento</div></div><div class="check-actions"><button class="btn btn-sm btn-secondary">Planificar</button></div></div>
          <div class="check-item"><div class="check-icon missing">${icon('alert-circle',12)}</div><div><div class="check-label">Contacto de emergencia registrado</div></div><div class="check-actions"><button class="btn btn-sm btn-primary">Registrar</button></div></div>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-header"><span class="card-title">Orientación Horizon</span><span class="badge badge-mint">4/5</span></div>
      <div class="card-body">
        <div class="checklist">
          ${['Taller de seguridad en el exterior','Charla de cultura y adaptación','Sesión financiera internacional','Inducción de regreso y reintegración'].map(i =>
            `<div class="check-item"><div class="check-icon done">${icon('check',12)}</div><div><div class="check-label">${i}</div></div></div>`
          ).join('')}
          <div class="check-item"><div class="check-icon pending">${icon('clock',12)}</div><div><div class="check-label">Encuesta de salida</div><div class="check-sub">Disponible 7 días antes de partir</div></div></div>
        </div>
      </div>
    </div>
  </div>
</div>`;
