/* ── Role definitions ──
   Each role maps to a nav config and user identity for the demo.
   In a real app, these would come from the authenticated session. */

const roles = {
  student: {
    label: 'Estudiante', avatar: 'KM', color: 'avatar-blue',
    name: 'Katerina Morales', id: '20210543',
    nav: [
      { id: 'student-home',         label: 'Mi Dashboard',     icon: 'home' },
      { id: 'student-opportunities', label: 'Oportunidades',    icon: 'globe' },
      { id: 'student-applications', label: 'Mis Solicitudes',   icon: 'file', badge: 2 },
      { id: 'student-documents',    label: 'Documentos',        icon: 'folder' },
      { id: 'student-predeparture', label: 'Pre-salida',        icon: 'check-circle' },
    ]
  },
  adviser: {
    label: 'Asesora de Movilidad', avatar: 'LC', color: 'avatar-mint',
    name: 'Laura Castillo', id: 'ADV-03',
    nav: [
      { id: 'adviser-home',         label: 'Dashboard',         icon: 'home' },
      { id: 'adviser-queue',        label: 'Cola de Revisión',  icon: 'inbox', badge: 7 },
      { id: 'adviser-applications', label: 'Todas las Solicitudes', icon: 'file' },
      { id: 'adviser-nominations',  label: 'Nominaciones',      icon: 'award' },
    ]
  },
  coordinator: {
    label: 'Coordinador de Movilidad', avatar: 'PV', color: 'avatar-purple',
    name: 'Pablo Vargas', id: 'COORD-01',
    nav: [
      { id: 'coordinator-home',         label: 'Dashboard Operativo', icon: 'home' },
      { id: 'coordinator-opportunities', label: 'Gestionar Oportunidades', icon: 'globe' },
      { id: 'coordinator-decisions',     label: 'Decisiones Socios',  icon: 'building' },
      { id: 'coordinator-reports',       label: 'Reportes',           icon: 'bar-chart' },
    ]
  },
  academic: {
    label: 'Coordinadora Académica', avatar: 'AM', color: 'avatar-amber',
    name: 'Ana Méndez', id: 'ACAD-07',
    nav: [
      { id: 'academic-home',    label: 'Dashboard de Revisión', icon: 'home' },
      { id: 'academic-reviews', label: 'Revisiones Pendientes', icon: 'book', badge: 3 },
      { id: 'academic-history', label: 'Historial',             icon: 'clock' },
    ]
  }
};
