/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  // 1. Expand Components with Lifecycle Data
  await knex.schema.table('components', (table) => {
    table.timestamp('install_date');
    table.integer('expected_life_hours');
    table.integer('current_life_hours').defaultTo(0);
    table.string('serial_number', 100);
    table.decimal('purchase_price', 15, 2);
  });

  // 2. Component Costs Table (Historical tracking)
  await knex.schema.createTable('component_costs', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('component_id').references('id').inTable('components').onDelete('CASCADE');
    table.string('cost_type', 50); // e.g., 'purchase', 'rebuild', 'maintenance'
    table.decimal('amount', 15, 2);
    table.string('currency', 10).defaultTo('USD');
    table.timestamp('date');
    table.text('notes');
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });

  // 3. Machine Cost Metrics
  await knex.schema.table('machines', (table) => {
    table.decimal('cost_per_hour_target', 10, 2);
    table.decimal('cost_per_ton_target', 10, 2);
  });

  // 4. Decision Engine: Recommendations
  await knex.schema.createTable('recommendations', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('company_id').references('id').inTable('companies').onDelete('CASCADE');
    table.uuid('machine_id').references('id').inTable('machines').onDelete('SET NULL');
    table.uuid('component_id').references('id').inTable('components').onDelete('SET NULL');
    table.string('action_type', 100); // e.g., 'Rebuild', 'Inspect', 'Replace'
    table.text('recommendation_text');
    table.text('rationale'); // Why this was recommended
    table.decimal('estimated_saving', 15, 2);
    table.string('priority', 20); // 'Low', 'Medium', 'High', 'Critical'
    table.string('status', 20).defaultTo('pending'); // 'pending', 'accepted', 'rejected', 'completed'
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });

  // 5. Failure Predictions
  await knex.schema.createTable('failure_predictions', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('component_id').references('id').inTable('components').onDelete('CASCADE');
    table.integer('predicted_remaining_life_hours');
    table.timestamp('predicted_failure_date');
    table.integer('confidence_score'); // 0-100
    table.jsonb('factors'); // JSON of factors leading to this prediction
    table.timestamp('calculated_at').defaultTo(knex.fn.now());
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  await knex.schema.dropTableIfExists('failure_predictions');
  await knex.schema.dropTableIfExists('recommendations');
  await knex.schema.dropTableIfExists('component_costs');
  
  await knex.schema.table('machines', (table) => {
    table.dropColumn('cost_per_hour_target');
    table.dropColumn('cost_per_ton_target');
  });

  await knex.schema.table('components', (table) => {
    table.dropColumn('install_date');
    table.dropColumn('expected_life_hours');
    table.dropColumn('current_life_hours');
    table.dropColumn('serial_number');
    table.dropColumn('purchase_price');
  });
};
