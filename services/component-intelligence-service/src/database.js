const knex = require('knex');
const path = require('path');
const knexConfig = require(path.resolve(process.cwd(), 'knexfile.js'));
const db = knex(knexConfig.development);

module.exports = db;
