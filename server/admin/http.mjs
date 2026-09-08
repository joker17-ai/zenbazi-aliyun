function decodeId(value) {
  try {
    return decodeURIComponent(value);
  } catch {
    return '';
  }
}

export function matchAdminRoute(method, pathname) {
  if (String(method).toUpperCase() !== 'GET') return null;
  if (pathname === '/api/admin/overview') return { action: 'overview' };
  if (pathname === '/api/admin/users') return { action: 'users' };
  if (pathname === '/api/admin/payments') return { action: 'payments' };
  if (pathname === '/api/admin/reports') return { action: 'reports' };

  const detail = pathname.match(/^\/api\/admin\/(users|payments|reports)\/([^/]+)$/);
  if (!detail) return null;
  const id = decodeId(detail[2]);
  if (!id) return null;
  const actionMap = { users: 'user', payments: 'payment', reports: 'report' };
  return { action: actionMap[detail[1]], id };
}
