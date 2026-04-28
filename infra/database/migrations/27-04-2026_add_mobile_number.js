/**
 * Add mobile_number column to users table
 */
exports.up = async function(knex) {
    await knex.schema.alterTable('users', (table) => {
        table.string('mobile_number', 20).nullable();
    });
};

exports.down = async function(knex) {
    await knex.schema.alterTable('users', (table) => {
        table.dropColumn('mobile_number');
    });
};
