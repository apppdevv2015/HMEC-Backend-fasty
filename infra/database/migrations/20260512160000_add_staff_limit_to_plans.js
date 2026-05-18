/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  // 1. Add staff_limit to subscription_plans
  await knex.schema.table('subscription_plans', (table) => {
    table.integer('staff_limit').nullable(); // null means unlimited
  });

  // 2. Update existing plans with default limits
  await knex('subscription_plans').where({ name: 'demo' }).update({ staff_limit: 5 });
  await knex('subscription_plans').where({ name: 'silver' }).update({ staff_limit: 20 });
  await knex('subscription_plans').where({ name: 'premium' }).update({ staff_limit: null });
  
  // Also handle any other plans that might exist
  await knex('subscription_plans').whereNull('staff_limit').update({ staff_limit: 50 }); // Default for others
  await knex('subscription_plans').where({ name: 'premium' }).update({ staff_limit: null }); // Ensure premium is null
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.table('subscription_plans', (table) => {
    table.dropColumn('staff_limit');
  });
};
