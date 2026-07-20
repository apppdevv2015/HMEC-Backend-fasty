const USER_ROLES = {
  SUPER_ADMIN: 'super_admin',
  SUB_SUPER_ADMIN: 'sub_super_admin',
  ADMIN: 'admin',
  SUB_ADMIN: 'sub_admin',
  ENGINEER: 'engineer',
  PLANNER: 'planner',
  VIEWER: 'viewer',
};

function getRoleSeedData() {
  return [
    { name: 'super_admin' },
    { name: 'sub_super_admin' },
    { name: 'admin' },
    { name: 'sub_admin' },
    { name: 'engineer' },
    { name: 'planner' },
    { name: 'viewer' },
  ];
}

module.exports = {
  USER_ROLES,
  getRoleSeedData,
};
