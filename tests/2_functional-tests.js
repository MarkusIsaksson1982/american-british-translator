const chai = require('chai');
const chaiHttp = require('chai-http');
const assert = chai.assert;
const server = require('../server.js');
const debug = require('debug')('fcc:functional-tests');

chai.use(chaiHttp);

suite('Functional Tests', () => {
  suite('POST /api/translate => translation object', () => {
    test('Translation with text and locale fields', (done) => {
      chai.request(server)
        .post('/api/translate')
        .send({
          text: 'Mangoes are my favorite fruit.',
          locale: 'american-to-british'
        })
        .end((err, res) => {
          debug('Response body:', res.body);
          assert.equal(res.status, 200);
          assert.equal(res.body.text, 'Mangoes are my favorite fruit.');
          assert.equal(res.body.translation, 'Mangoes are my <span class="highlight">favourite</span> fruit.');
          done();
        });
    });

    test('Translation with text and invalid locale field', (done) => {
      chai.request(server)
        .post('/api/translate')
        .send({
          text: 'Mangoes are my favorite fruit.',
          locale: 'french-to-spanish'
        })
        .end((err, res) => {
          debug('Response body:', res.body);
          assert.equal(res.status, 200);
          assert.equal(res.body.error, 'Invalid value for locale field');
          done();
        });
    });

    test('Translation with missing text field', (done) => {
      chai.request(server)
        .post('/api/translate')
        .send({
          locale: 'american-to-british'
        })
        .end((err, res) => {
          debug('Response body:', res.body);
          assert.equal(res.status, 200);
          assert.equal(res.body.error, 'Required field(s) missing');
          done();
        });
    });

    test('Translation with missing locale field', (done) => {
      chai.request(server)
        .post('/api/translate')
        .send({
          text: 'Mangoes are my favorite fruit.'
        })
        .end((err, res) => {
          debug('Response body:', res.body);
          assert.equal(res.status, 200);
          assert.equal(res.body.error, 'Required field(s) missing');
          done();
        });
    });

    test('Translation with empty text', (done) => {
      chai.request(server)
        .post('/api/translate')
        .send({
          text: '',
          locale: 'american-to-british'
        })
        .end((err, res) => {
          debug('Response body:', res.body);
          assert.equal(res.status, 200);
          assert.equal(res.body.error, 'No text to translate');
          done();
        });
    });

    test('Translation with text that needs no translation', (done) => {
      chai.request(server)
        .post('/api/translate')
        .send({
          text: 'This text needs no translation.',
          locale: 'american-to-british'
        })
        .end((err, res) => {
          debug('Response body:', res.body);
          assert.equal(res.status, 200);
          assert.equal(res.body.text, 'This text needs no translation.');
          assert.equal(res.body.translation, 'Everything looks good to me!');
          done();
        });
    });

    test('Server error handling', (done) => {
      chai.request(server)
        .post('/api/translate')
        .send({
          text: 'Test error handling',
          locale: 'american-to-british'
        })
        .end((err, res) => {
          if (err) {
            debug('Test error:', err);
          }
          debug('Response body:', res.body);
          assert.equal(res.status, 200);
          assert.isObject(res.body);
          assert.isUndefined(res.body.status);
          done();
        });
    });
  });
});
