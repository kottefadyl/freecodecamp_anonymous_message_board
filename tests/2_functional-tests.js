const chaiHttp = require('chai-http');
const chai = require('chai');
const assert = chai.assert;
const server = require('../server');

chai.use(chaiHttp);

suite('Functional Tests', function() {
  let testThreadId;
  let testReplyId;

  // --- TESTS DES THREADS ---
  
  // 1. Créer un thread
  test('Creating a new thread: POST request to /api/threads/{board}', function(done) {
    chai.request(server)
      .post('/api/threads/test')
      .send({ text: 'fcc_test', delete_password: 'password' })
      .end(function(err, res) {
        assert.equal(res.status, 200);
        done();
      });
  });

  // 2. Voir les 10 threads récents
  test('Viewing 10 recent threads: GET request to /api/threads/{board}', function(done) {
    chai.request(server)
      .get('/api/threads/test')
      .end(function(err, res) {
        assert.equal(res.status, 200);
        assert.isArray(res.body);
        assert.property(res.body[0], '_id');
        testThreadId = res.body[0]._id; // On stocke l'ID pour la suite
        done();
      });
  });

  // 3. Signaler un thread
  test('Reporting a thread: PUT request to /api/threads/{board}', function(done) {
    chai.request(server)
      .put('/api/threads/test')
      .send({ thread_id: testThreadId })
      .end(function(err, res) {
        assert.equal(res.text, 'reported');
        done();
      });
  });

  // 4. Supprimer un thread avec mot de passe incorrect
  test('Deleting a thread with wrong password: DELETE request to /api/threads/{board}', function(done) {
    chai.request(server)
      .delete('/api/threads/test')
      .send({ thread_id: testThreadId, delete_password: 'wrong' })
      .end(function(err, res) {
        assert.equal(res.text, 'incorrect password');
        done();
      });
  });

  // --- TESTS DES RÉPONSES ---

  // 5. Créer une réponse
  test('Creating a new reply: POST request to /api/replies/{board}', function(done) {
    chai.request(server)
      .post('/api/replies/test')
      .send({ thread_id: testThreadId, text: 'reply_test', delete_password: 'pass' })
      .end(function(err, res) {
        assert.equal(res.status, 200);
        done();
      });
  });

  // 6. Voir un thread complet avec ses réponses
  test('Viewing a single thread: GET request to /api/replies/{board}', function(done) {
    chai.request(server)
      .get(`/api/replies/test?thread_id=${testThreadId}`)
      .end(function(err, res) {
        assert.equal(res.status, 200);
        assert.property(res.body, 'replies');
        testReplyId = res.body.replies[0]._id;
        done();
      });
  });

  // 7. Signaler une réponse
  test('Reporting a reply: PUT request to /api/replies/{board}', function(done) {
    chai.request(server)
      .put('/api/replies/test')
      .send({ thread_id: testThreadId, reply_id: testReplyId })
      .end(function(err, res) {
        assert.equal(res.text, 'reported');
        done();
      });
  });

  // 8. Supprimer une réponse avec mot de passe incorrect
  test('Deleting a reply with wrong password: DELETE request to /api/replies/{board}', function(done) {
    chai.request(server)
      .delete('/api/replies/test')
      .send({ thread_id: testThreadId, reply_id: testReplyId, delete_password: 'wrong' })
      .end(function(err, res) {
        assert.equal(res.text, 'incorrect password');
        done();
      });
  });

  // 9. Supprimer une réponse avec mot de passe CORRECT
  test('Deleting a reply with correct password: DELETE request to /api/replies/{board}', function(done) {
    chai.request(server)
      .delete('/api/replies/test')
      .send({ thread_id: testThreadId, reply_id: testReplyId, delete_password: 'pass' })
      .end(function(err, res) {
        assert.equal(res.text, 'success');
        done();
      });
  });

  // 10. Supprimer un thread avec mot de passe CORRECT
  test('Deleting a thread with correct password: DELETE request to /api/threads/{board}', function(done) {
    chai.request(server)
      .delete('/api/threads/test')
      .send({ thread_id: testThreadId, delete_password: 'password' })
      .end(function(err, res) {
        assert.equal(res.text, 'success');
        done();
      });
  });

});
