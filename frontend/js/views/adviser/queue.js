pages['adviser-queue'] = () => `
<div class="topbar">
  <span class="topbar-title">Cola de Revisión</span>
  <div class="topbar-actions">
    <div class="search-wrap">${icon('search',14)}<input class="search-input" placeholder="Buscar estudiante…"></div>
    <button class="btn btn-sm btn-secondary">${icon('filter',14)} Filtrar</button>
  </div>
</div>
<div class="page-body">
  <div class="chips">
    <span class="chip active">Pendientes (7)</span>
    <span class="chip">Documentos incompletos (3)</span>
    <span class="chip">Urgentes</span>
  </div>

  <div class="card">
    <div class="card-body" style="padding:0">
      <table>
        <thead>
          <tr><th>Estudiante</th><th>Universidad destino</th><th>Programa</th><th>Documentos</th><th>Recibida</th><th>Acciones</th></tr>
        </thead>
        <tbody>
          ${[
            { name:'Ana López', id:'20220134', dest:'Universidad de Chile', prog:'Ing. Sistemas', docs:'5/6', days:1, urgent:true },
            { name:'Carlos Ruiz', id:'20210876', dest:'UNAM', prog:'Economía', docs:'6/6', days:2, urgent:false },
            { name:'María Torres', id:'20220012', dest:'UAM Madrid', prog:'Derecho', docs:'4/6', days:3, urgent:false },
            { name:'Jorge Pinto', id:'20210543', dest:'USP São Paulo', prog:'Arquitectura', docs:'6/6', days:4, urgent:false },
            { name:'Sofía Ríos', id:'20220567', dest:'U. de los Andes', prog:'Administración', docs:'3/6', days:5, urgent:false },
            { name:'Andrés Mora', id:'20210201', dest:'TU Munich', prog:'Ing. Mecánica', docs:'6/6', days:6, urgent:false },
            { name:'Valentina Cruz', id:'20220789', dest:'UCM Madrid', prog:'Comunicación', docs:'5/6', days:7, urgent:false },
          ].map(s => `
            <tr>
              <td>
                <div style="display:flex;align-items:center;gap:10px">
                  ${avatar(s.name.split(' ').map(n=>n[0]).join(''), 'avatar-blue')}
                  <div>
                    <div style="font-weight:600;color:var(--fg)">${s.name}</div>
                    <div style="font-size:11px;color:var(--fg-3)">${s.id}</div>
                  </div>
                </div>
              </td>
              <td>${s.dest}</td>
              <td><span class="badge badge-gray">${s.prog}</span></td>
              <td>
                <span style="font-size:13px;color:${s.docs === s.docs.replace(/^\d+/,m=>parseInt(m)===6?'6':m) && s.docs.startsWith('6') ? 'var(--mint)' : 'var(--amber)'};font-weight:500">${s.docs}</span>
              </td>
              <td>
                ${s.urgent ? '<span class="badge badge-red">Urgente</span> ' : ''}
                Hace ${s.days} día${s.days>1?'s':''}
              </td>
              <td>
                <div style="display:flex;gap:6px">
                  <button class="btn btn-sm btn-primary">Revisar</button>
                  <button class="btn btn-sm btn-ghost">${icon('more-h',14)}</button>
                </div>
              </td>
            </tr>`).join('')}
        </tbody>
      </table>
    </div>
  </div>
</div>`;
