/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  // 1. Rename columns and add company_code
  await knex.schema.table('subscriptions', (table) => {
    table.string('company_code', 20);
    table.renameColumn('start_date', 'subscription_start_date');
    table.renameColumn('end_date', 'subscription_end_date');
  });

  // 2. Backfill company_code for existing subscriptions
  const subscriptions = await knex('subscriptions').select('id', 'company_id');
  for (const sub of subscriptions) {
    const company = await knex('companies').where({ id: sub.company_id }).first();
    if (company && company.company_code) {
      await knex('subscriptions').where({ id: sub.id }).update({ 
        company_code: company.company_code 
      });
    }
  }
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.table('subscriptions', (table) => {
    table.dropColumn('company_code');
    table.renameColumn('subscription_start_date', 'start_date');
    table.renameColumn('subscription_end_date', 'end_date');
  });
};
