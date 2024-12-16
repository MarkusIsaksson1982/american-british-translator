'use strict';

const express = require('express');
const bodyParser = require('body-parser');
const expect = require('chai').expect;
const cors = require('cors');
const fccTestingRoutes = require('./routes/fcctesting.js');
const runner = require('./test-runner');
const Translator = require('./components/translator.js');
const debug = require('debug')('fcc:server');

const app = express();

// Logging middleware
app.use((req, res, next) => {
  debug(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

app.use('/public', express.static(process.cwd() + '/public'));
app.use(cors({origin: '*'})); //For FCC testing purposes only
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Index page (static HTML)
app.route('/')
  .get(function (req, res) {
    debug('Serving index.html');
    res.sendFile(process.cwd() + '/views/index.html');
  });

// For FCC testing purposes
debug('Setting up FCC testing routes');
fccTestingRoutes(app);

// Translation route
app.route('/api/translate')
  .post((req, res) => {
    debug('Received translation request');
    const translator = new Translator();
    const { text, locale } = req.body;

    debug(`Translation request - Text: "${text}", Locale: ${locale}`);

    if (text === undefined || locale === undefined) {
      debug('Error: Required field(s) missing');
      return res.json({ error: 'Required field(s) missing' });
    }

    if (text === '') {
      debug('Error: No text to translate');
      return res.json({ error: 'No text to translate' });
    }

    if (locale !== 'american-to-british' && locale !== 'british-to-american') {
      debug('Error: Invalid value for locale field');
      return res.json({ error: 'Invalid value for locale field' });
    }

    try {
      const translation = translator.translate(text, locale);
      debug(`Translation result: "${translation}"`);

      if (translation === text) {
        debug('No translation needed');
        return res.json({ text, translation: "Everything looks good to me!" });
      }

      debug('Translation successful');
      res.json({ text, translation });
    } catch (error) {
      debug(`Error during translation: ${error.message}`);
      res.status(500).json({ error: 'An error occurred during translation' });
    }
  });

// 404 Not Found Middleware
app.use(function(req, res, next) {
  debug(`404 Not Found: ${req.method} ${req.url}`);
  res.status(404)
    .type('text')
    .send('Not Found');
});

const portNum = process.env.PORT || 3000;

// Start our server and tests!
app.listen(portNum, () => {
  debug(`Server started at ${new Date().toISOString()}`);
  debug(`Listening on port ${portNum}`);
  if (process.env.NODE_ENV === 'test') {
    debug('Running in test mode');
    debug('To run tests manually, please visit: https://3000-freecodecam-boilerplate-2gpk5nu1jg8.ws-eu117.gitpod.io');
    setTimeout(function () {
      try {
        debug('Starting test runner...');
        runner.run();
      } catch(e) {
        debug('Error during test execution:');
        debug(e);
      }
    }, 1500);
  } else {
    debug('Running in development mode');
  }
});

// Global error handler
app.use((err, req, res, next) => {
  debug('Global error handler caught an error:');
  debug(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

module.exports = app; // For testing

process.on('unhandledRejection', (reason, promise) => {
  debug('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  debug('Uncaught Exception:', error);
});
