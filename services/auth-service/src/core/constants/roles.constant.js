const USER_ROLES = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  ENGINEER: 'engineer',
  PLANNER: 'planner',
  VIEWER: 'viewer',
};

function getRoleSeedData() {
  return [
    { name: 'super_admin' },
    { name: 'admin' },
    { name: 'engineer' },
    { name: 'planner' },
    { name: 'viewer' },
  ];
}

module.exports = {
  USER_ROLES,
  getRoleSeedData,
};
