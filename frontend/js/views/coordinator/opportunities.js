pages['coordinator-opportunities'] = () => `
<div class="topbar">
  <span class="topbar-title">Gestionar Oportunidades</span>
  <div class="topbar-actions">
    <div class="search-wrap">${icon('search',14)}<input class="search-input" placeholder="Buscar convenio…"></div>
    <button class="btn btn-primary btn-sm">${icon('plus',14)} Nuevo convenio</button>
  </div>
</div>
<div class="page-body">
  <div class="chips">
    <span class="chip active">Todos (42)</span>
    <span class="chip">Activos (38)</span>
    <span class="chip">En renovación (4)</span>
    <span class="chip">América Latina</span>
    <span class="chip">Europa</span>
  </div>

  <div class="card">
    <div class="card-body" style="padding:0">
      <table>
        <thead>
          <tr><th>Universidad</th><th>País</th><th>Cupos</th><th>Ocupados</th><th>Semestre</th><th>Vencimiento convenio</th><th>Estado</th><th></th></tr>
        </thead>
        <tbody>
          ${[
            { name:'Universidad de Chile', country:'🇨🇱 Chile', total:5, used:3, sem:'2025-2', exp:'2027-12', active:true },
            { name:'UNAM', country:'🇲🇽 México', total:8, used:5, sem:'2025-2', exp:'2026-06', active:true },
            { name:'UAM Madrid', country:'🇪🇸 España', total:3, used:3, sem:'2025-2', exp:'2028-02', active:false },
            { name:'USP São Paulo', country:'🇧🇷 Brasil', total:4, used:1, sem:'2026-1', exp:'2026-12', active:true },
            { name:'U. de los Andes CO', country:'🇨🇴 Colombia', total:6, used:4, sem:'2025-2', exp:'2027-08', active:true },
            { name:'TU Munich', country:'🇩🇪 Alemania', total:2, used:2, sem:'2025-2', exp:'2025-12', active:false },
          ].map(o => `
            <tr>
              <td style="font-weight:500;color:var(--fg)">${o.name}</td>
              <td>${o.country}</td>
              <td>${o.total}</td>
              <td>
                <span style="color:${o.used>=o.total?'var(--red)':o.used/o.total>0.7?'var(--amber)':'var(--mint)'};font-weight:500">${o.used}</span>
              </td>
              <td>${o.sem}</td>
              <td style="color:var(--fg-3)">${o.exp}</td>
              <td>${o.active ? '<span class="badge badge-mint">Activo</span>' : '<span class="badge badge-red">Cupo lleno</span>'}</td>
              <td>
                <div style="display:flex;gap:4px">
                  <button class="btn btn-sm btn-ghost">${icon('edit',14)}</button>
                  <button class="btn btn-sm btn-ghost">${icon('eye',14)}</button>
                </div>
              </td>
            </tr>`).join('')}
        </tbody>
      </table>
    </div>
  </div>
</div>`;
