/* ── Page registry (populated by view files) ── */
const pages = {};

/* ── Status badge helper ── */
function statusBadge(status) {
  const map = {
    'En revisión':     'badge-amber',
    'Pendiente':       'badge-gray',
    'Aprobada':        'badge-mint',
    'Rechazada':       'badge-red',
    'Borrador':        'badge-gray',
    'Completado':      'badge-mint',
    'Nominado':        'badge-blue',
    'Aceptado':        'badge-mint',
    'Rechazado':       'badge-red',
    'Enviado':         'badge-blue',
    'Revisión acad.':  'badge-purple',
    'Pendiente coord.':'badge-amber',
  };
  const cls = map[status] || 'badge-gray';
  return `<span class="badge ${cls}">${status}</span>`;
}

/* ── Format date ── */
function fmtDate(d) {
  const months = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
  const dt = new Date(d);
  return `${dt.getDate()} ${months[dt.getMonth()]} ${dt.getFullYear()}`;
}

/* ── Avatar initials ── */
function avatar(initials, colorClass, size = 28) {
  return `<div class="avatar ${colorClass}" style="width:${size}px;height:${size}px;font-size:${size <= 28 ? 11 : 13}px">${initials}</div>`;
}
