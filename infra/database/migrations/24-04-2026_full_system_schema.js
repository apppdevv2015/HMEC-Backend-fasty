/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  // 1. EXTENSIONS
  await knex.raw('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');

  // AUTO-CLEAN: Drop tables in correct dependency order
  await knex.schema
    .dropTableIfExists('component_health_logs') // Legacy table - drop FIRST
    .dropTableIfExists('user_machine_mapping')
    .dropTableIfExists('ticket_messages')
    .dropTableIfExists('support_tickets')
    .dropTableIfExists('task_logs')
    .dropTableIfExists('tasks')
    .dropTableIfExists('maintenance_logs')
    .dropTableIfExists('alerts')
    .dropTableIfExists('machine_scores')
    .dropTableIfExists('component_scores')
    .dropTableIfExists('operator_logs')
    .dropTableIfExists('component_logs')
    .dropTableIfExists('components')
    .dropTableIfExists('machines')
    .dropTableIfExists('subscriptions')
    .dropTableIfExists('subscription_plans')
    .dropTableIfExists('users')
    .dropTableIfExists('roles')
    .dropTableIfExists('companies');

  // 2. COMPANIES
  await knex.schema.createTable('companies', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.string('name', 255).notNullable();
    table.boolean('is_active').defaultTo(true);
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });

  // 3. ROLES
  await knex.schema.createTable('roles', (table) => {
    table.increments('id').primary();
    table.string('name', 50).unique().notNullable();
  });

  await knex('roles').insert([
    { name: 'super_admin' },
    { name: 'admin' },
    { name: 'engineer' },
    { name: 'planner' },
    { name: 'viewer' }
  ]);

  // 4. USERS
  await knex.schema.createTable('users', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.string('first_name', 100);
    table.string('last_name', 100);
    table.string('email', 255).unique().notNullable();
    table.text('password_hash').notNullable();
    table.integer('role_id').references('id').inTable('roles');
    table.uuid('company_id').references('id').inTable('companies').onDelete('CASCADE');
    table.boolean('is_active').defaultTo(true);
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });

  // 5. SUBSCRIPTION PLANS
  await knex.schema.createTable('subscription_plans', (table) => {
    table.increments('id').primary();
    table.string('name', 50).unique().notNullable();
    table.integer('machine_limit');
    table.decimal('price', 10, 2);
    table.jsonb('features');
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });

  await knex('subscription_plans').insert([
    { name: 'demo', machine_limit: 3, price: 0 },
    { name: 'silver', machine_limit: 10, price: 100 },
    { name: 'premium', machine_limit: null, price: 300 }
  ]);

  // 6. SUBSCRIPTIONS
  await knex.schema.createTable('subscriptions', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('company_id').references('id').inTable('companies').onDelete('CASCADE');
    table.integer('plan_id').references('id').inTable('subscription_plans');
    table.string('status', 50).notNullable();
    table.timestamp('start_date');
    table.timestamp('end_date');
    table.string('payment_status', 50);
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });

  // 7. MACHINES
  await knex.schema.createTable('machines', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('company_id').references('id').inTable('companies').onDelete('CASCADE');
    table.string('name', 255);
    table.string('model', 255);
    table.string('site', 255);
    table.string('status', 50);
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });

  // 8. COMPONENTS
  await knex.schema.createTable('components', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('machine_id').references('id').inTable('machines').onDelete('CASCADE');
    table.string('type', 50);
    table.string('name', 255);
    table.string('position', 50);
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });

  // 9. COMPONENT LOGS
  await knex.schema.createTable('component_logs', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('component_id').references('id').inTable('components').onDelete('CASCADE');
    table.uuid('machine_id').references('id').inTable('machines').onDelete('CASCADE');
    table.jsonb('data');
    table.uuid('entered_by').references('id').inTable('users');
    table.timestamp('timestamp');
    table.boolean('is_synced').defaultTo(false);
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });

  // 10. OPERATOR LOGS
  await knex.schema.createTable('operator_logs', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('machine_id').references('id').inTable('machines').onDelete('CASCADE');
    table.uuid('operator_id').references('id').inTable('users');
    table.jsonb('behavior_data');
    table.timestamp('timestamp');
  });

  // 11. COMPONENT SCORES
  await knex.schema.createTable('component_scores', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('component_id').references('id').inTable('components').onDelete('CASCADE');
    table.integer('score');
    table.string('risk_level', 50);
    table.timestamp('calculated_at').defaultTo(knex.fn.now());
  });

  // 12. MACHINE SCORES
  await knex.schema.createTable('machine_scores', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('machine_id').references('id').inTable('machines').onDelete('CASCADE');
    table.integer('score');
    table.timestamp('calculated_at').defaultTo(knex.fn.now());
  });

  // 13. ALERTS
  await knex.schema.createTable('alerts', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('company_id').references('id').inTable('companies');
    table.uuid('machine_id').references('id').inTable('machines');
    table.uuid('component_id').references('id').inTable('components');
    table.string('type', 50);
    table.text('message');
    table.string('severity', 50);
    table.string('status', 50).defaultTo('open');
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });

  // 14. MAINTENANCE LOGS
  await knex.schema.createTable('maintenance_logs', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('machine_id').references('id').inTable('machines');
    table.uuid('component_id').references('id').inTable('components');
    table.text('action');
    table.text('notes');
    table.uuid('performed_by').references('id').inTable('users');
    table.timestamp('date');
  });

  // 15. TASKS
  await knex.schema.createTable('tasks', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('company_id').references('id').inTable('companies');
    table.uuid('machine_id').references('id').inTable('machines');
    table.uuid('component_id').references('id').inTable('components');
    table.string('title', 255);
    table.text('description');
    table.uuid('assigned_to').references('id').inTable('users');
    table.uuid('created_by').references('id').inTable('users');
    table.string('status', 50).defaultTo('pending');
    table.string('priority', 50);
    table.timestamp('due_date');
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });

  // 16. TASK LOGS
  await knex.schema.createTable('task_logs', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('task_id').references('id').inTable('tasks').onDelete('CASCADE');
    table.text('action');
    table.uuid('performed_by').references('id').inTable('users');
    table.timestamp('timestamp').defaultTo(knex.fn.now());
  });

  // 17. SUPPORT TICKETS
  await knex.schema.createTable('support_tickets', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('company_id').references('id').inTable('companies');
    table.uuid('created_by').references('id').inTable('users');
    table.string('title', 255);
    table.text('description');
    table.string('status', 50).defaultTo('open');
    table.string('priority', 50);
    table.uuid('assigned_to').references('id').inTable('users');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
  });

  // 18. TICKET MESSAGES
  await knex.schema.createTable('ticket_messages', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('ticket_id').references('id').inTable('support_tickets').onDelete('CASCADE');
    table.uuid('sender_id').references('id').inTable('users');
    table.text('message');
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });

  // 19. USER-MACHINE MAPPING
  await knex.schema.createTable('user_machine_mapping', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE');
    table.uuid('machine_id').references('id').inTable('machines').onDelete('CASCADE');
  });

  // 20. INDEXES
  await knex.schema.table('users', (table) => {
    table.index('company_id', 'idx_users_company');
  });
  await knex.schema.table('machines', (table) => {
    table.index('company_id', 'idx_machines_company');
  });
  await knex.schema.table('component_logs', (table) => {
    table.index('machine_id', 'idx_logs_machine');
  });
  await knex.schema.table('tasks', (table) => {
    table.index('company_id', 'idx_tasks_company');
  });
  await knex.schema.table('support_tickets', (table) => {
    table.index('company_id', 'idx_tickets_company');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  // Drop in reverse order to respect foreign keys
  return knex.schema
    .dropTableIfExists('user_machine_mapping')
    .dropTableIfExists('ticket_messages')
    .dropTableIfExists('support_tickets')
    .dropTableIfExists('task_logs')
    .dropTableIfExists('tasks')
    .dropTableIfExists('maintenance_logs')
    .dropTableIfExists('alerts')
    .dropTableIfExists('machine_scores')
    .dropTableIfExists('component_scores')
    .dropTableIfExists('operator_logs')
    .dropTableIfExists('component_logs')
    .dropTableIfExists('components')
    .dropTableIfExists('machines')
    .dropTableIfExists('subscriptions')
    .dropTableIfExists('subscription_plans')
    .dropTableIfExists('users')
    .dropTableIfExists('roles')
    .dropTableIfExists('companies');
};