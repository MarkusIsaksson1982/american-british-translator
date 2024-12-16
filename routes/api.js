'use strict';

const Translator = require('../components/translator.js');

module.exports = function (app) {
  const translator = new Translator();

  app.route('/api/translate')
    .post((req, res, next) => {
      try {
        console.log('Received translation request:', req.body);
        const { text, locale } = req.body;

        // Validate input
        if (text === undefined || locale === undefined) {
          console.log('Error: Required field(s) missing');
          return res.json({ error: 'Required field(s) missing' });
        }

        if (text.trim() === '') {
          console.log('Error: No text to translate');
          return res.json({ error: 'No text to translate' });
        }

        if (!['american-to-british', 'british-to-american'].includes(locale)) {
          console.log('Error: Invalid value for locale field');
          return res.json({ error: 'Invalid value for locale field' });
        }

        // Perform translation
        console.log(`Attempting to translate: "${text}" (${locale})`);
        const translation = translator.translate(text, locale, true);  // Added 'true' for highlighting
        console.log(`Translation result: "${translation}"`);

        if (translation === 'Everything looks good to me!') {
          console.log('No translation needed');
          return res.json({ text, translation: text });
        }

        console.log('Translation successful');
        return res.json({ text, translation });
      } catch (error) {
        console.error('Error in /api/translate:', error);
        next(error);
      }
    });
};
