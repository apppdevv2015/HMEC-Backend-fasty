/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('activity_logs', table => {
    table.uuid('id').primary().defaultTo(knex.fn.uuid());
    table.uuid('user_id').references('id').inTable('users').onDelete('SET NULL');
    table.uuid('company_id').references('id').inTable('companies').onDelete('SET NULL');
    table.string('action').notNullable(); // e.g., 'LOGIN', 'CREATE_USER', 'DELETE_ROLE'
    table.string('module').notNullable(); // e.g., 'AUTH', 'USER', 'ROLE'
    table.jsonb('details'); // Additional info like IP, changes, etc.
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable('activity_logs');
};
