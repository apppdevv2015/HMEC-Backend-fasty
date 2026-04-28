const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const app = express();

app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

// Routes and other middlewares will be imported here
// const routes = require('./routes');
// app.use('/api', routes);

module.exports = app;
