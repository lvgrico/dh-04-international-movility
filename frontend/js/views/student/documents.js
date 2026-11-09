pages['student-documents'] = () => `
<div class="topbar">
  <span class="topbar-title">Mis Documentos</span>
  <div class="topbar-actions">
    <button class="btn btn-primary btn-sm">${icon('upload', 14)} Subir documento</button>
  </div>
</div>
<div class="page-body">
  <div class="chips">
    <span class="chip active">Todos</span>
    <span class="chip">Académicos</span>
    <span class="chip">Personales</span>
    <span class="chip">Idioma</span>
    <span class="chip">Pendientes</span>
  </div>

  <div class="card">
    <div class="card-header">
      <span class="card-title">Documentos cargados</span>
      <span class="badge badge-mint">6 de 8 completos</span>
    </div>
    <div class="card-body" style="padding:0">
      <table>
        <thead><tr><th>Documento</th><th>Tipo</th><th>Estado</th><th>Fecha</th><th>Acciones</th></tr></thead>
        <tbody>
          ${[
            { name:'Certificado de matrícula', type:'Académico', status:'Aprobada', date:'10 mar 2025' },
            { name:'Carta de motivación', type:'Personal', status:'Aprobada', date:'12 mar 2025' },
            { name:'Hoja de vida / CV', type:'Personal', status:'En revisión', date:'13 mar 2025' },
            { name:'Pasaporte (copia)', type:'Personal', status:'Aprobada', date:'11 mar 2025' },
            { name:'Certificado de notas oficial', type:'Académico', status:'Pendiente', date:'—' },
            { name:'Certificado de inglés B2', type:'Idioma', status:'Pendiente', date:'—' },
            { name:'Carta de recomendación', type:'Académico', status:'Aprobada', date:'14 mar 2025' },
            { name:'Póliza de seguro médico', type:'Personal', status:'Aprobada', date:'15 mar 2025' },
          ].map(d => `
            <tr>
              <td style="font-weight:500;color:var(--fg)">${icon('file', 14)} ${d.name}</td>
              <td><span class="badge badge-gray">${d.type}</span></td>
              <td>${statusBadge(d.status)}</td>
              <td style="color:var(--fg-3)">${d.date}</td>
              <td>
                <div style="display:flex;gap:4px">
                  ${d.status !== 'Pendiente'
                    ? `<button class="btn btn-sm btn-ghost">${icon('download', 14)}</button>`
                    : `<button class="btn btn-sm btn-primary">${icon('upload', 14)} Subir</button>`
                  }
                </div>
              </td>
            </tr>`).join('')}
        </tbody>
      </table>
    </div>
  </div>
</div>`;
