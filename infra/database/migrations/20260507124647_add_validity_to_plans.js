/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.table('subscription_plans', table => {
    table.integer('validity_days').defaultTo(30); // Default to 30 days
  }).then(() => {
    // Update existing plans
    return knex('subscription_plans').where('name', 'demo').update({ validity_days: 14, price: 0 });
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.table('subscription_plans', table => {
    table.dropColumn('validity_days');
  });
};
