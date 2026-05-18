/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.table('subscription_plans', table => {
    table.boolean('is_active').defaultTo(true);
    table.boolean('is_public').defaultTo(true);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.table('subscription_plans', table => {
    table.dropColumn('is_active');
    table.dropColumn('is_public');
  });
};
