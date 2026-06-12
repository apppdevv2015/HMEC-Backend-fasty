const FIELD_ALIASES = {
  // User Fields
  FirstName: 'firstName',
  firstname: 'firstName',
  first_name: 'firstName',
  LastName: 'lastName',
  lastname: 'lastName',
  last_name: 'lastName',
  MobileNumber: 'mobileNumber',
  mobile_number: 'mobileNumber',
  mobilenumber: 'mobileNumber',
  
  // Auth & Role Fields
  CompanyId: 'companyId',
  company_id: 'companyId',
  companyid: 'companyId',
  RoleId: 'roleId',
  role_id: 'roleId',
  roleid: 'roleId',
  isactive: 'isActive',
  is_active: 'isActive',

  // Subscription Plan Fields
  planname: 'planName',
  plan_name: 'planName',
  MachineLimit: 'machineLimit',
  machine_limit: 'machineLimit',
  machinelimit: 'machineLimit',
  StaffLimit: 'staffLimit',
  staff_limit: 'staffLimit',
  stafflimit: 'staffLimit',
  ValidityDays: 'validityDays',
  validity_days: 'validityDays',
  validitydays: 'validityDays',
  IsPublic: 'isPublic',
  is_public: 'isPublic',
  ispublic: 'isPublic',
  SubscriptionStatus: 'subscriptionStatus',
  subscription_status: 'subscriptionStatus',
  subscriptionstatus: 'subscriptionStatus',
};

function normalizeFieldAliases(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return input;
  }

  const normalized = { ...input };

  for (const [legacyKey, camelKey] of Object.entries(FIELD_ALIASES)) {
    if (
      Object.prototype.hasOwnProperty.call(input, legacyKey) &&
      !Object.prototype.hasOwnProperty.call(normalized, camelKey)
    ) {
      normalized[camelKey] = input[legacyKey];
    }
  }

  return normalized;
}

module.exports = {
  normalizeFieldAliases,
};
