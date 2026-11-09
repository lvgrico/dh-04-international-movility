pages['student-opportunities'] = () => `
<div class="topbar">
  <span class="topbar-title">Oportunidades de Movilidad</span>
  <div class="topbar-actions">
    <div class="search-wrap">
      ${icon('search', 14)}
      <input class="search-input" placeholder="Buscar universidades…" />
    </div>
  </div>
</div>
<div class="page-body">
  <div class="chips">
    <span class="chip active">Todas</span>
    <span class="chip">América Latina</span>
    <span class="chip">Europa</span>
    <span class="chip">Norteamérica</span>
    <span class="chip">Asia-Pacífico</span>
    <span class="chip">Ingeniería</span>
    <span class="chip">Negocios</span>
  </div>
  <div class="opp-grid">
    ${[
      { flag:'🇨🇱', name:'Universidad de Chile', city:'Santiago', country:'Chile', area:'Ingeniería · Ciencias', sem:'2025-2', spots:3, deadline:'30 may 2025', quota:true },
      { flag:'🇲🇽', name:'UNAM', city:'Ciudad de México', country:'México', area:'Todas las facultades', sem:'2025-2', spots:5, deadline:'15 jun 2025', quota:false },
      { flag:'🇪🇸', name:'Univ. Autónoma de Madrid', city:'Madrid', country:'España', area:'Economía · Derecho', sem:'2025-2', spots:2, deadline:'1 abr 2025', quota:false },
      { flag:'🇧🇷', name:'USP São Paulo', city:'São Paulo', country:'Brasil', area:'Ingeniería · Arquitectura', sem:'2026-1', spots:4, deadline:'1 sep 2025', quota:false },
      { flag:'🇨🇴', name:'Universidad de los Andes', city:'Bogotá', country:'Colombia', area:'Todas las facultades', sem:'2025-2', spots:6, deadline:'20 jun 2025', quota:false },
      { flag:'🇩🇪', name:'TU Munich', city:'Múnich', country:'Alemania', area:'Ingeniería · Tecnología', sem:'2026-1', spots:2, deadline:'15 mar 2025', quota:true },
    ].map(o => `
      <div class="opp-card">
        <div class="opp-flag">${o.flag}</div>
        <div class="opp-name">${o.name}</div>
        <div class="opp-uni">${o.city}, ${o.country}</div>
        <div class="opp-meta">
          <span class="opp-tag">${o.area}</span>
          <span class="opp-tag">${o.sem}</span>
          ${o.quota ? '<span class="opp-tag" style="color:var(--amber)">Cupo lleno</span>' : ''}
        </div>
        <div class="opp-deadline">${icon('clock', 12)} Cierra ${o.deadline}</div>
        <div class="opp-spots">${o.spots} cupo${o.spots !== 1 ? 's' : ''} disponible${o.spots !== 1 ? 's' : ''}</div>
        <button class="btn btn-primary btn-sm" style="width:100%"${o.quota ? ' disabled' : ''}>
          ${o.quota ? 'Sin cupos' : 'Ver detalles y aplicar'}
        </button>
      </div>`).join('')}
  </div>
</div>`;
