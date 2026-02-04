'use strict';

const { Board: BoardModel, Thread: ThreadModel, Reply: ReplyModel } = require("../models");

module.exports = function (app) {

  // --- GESTION DES THREADS ---
  app.route('/api/threads/:board')
    .post(async (req, res) => {
      const { text, delete_password } = req.body;
      const board = req.params.board;

      try {
        let boardData = await BoardModel.findOne({ name: board });
        if (!boardData) {
          boardData = new BoardModel({ name: board, threads: [] });
        }

        const newThread = new ThreadModel({
          text,
          delete_password,
          created_on: new Date(),
          bumped_on: new Date(),
          reported: false,
          replies: [],
        });

        boardData.threads.push(newThread);
        await boardData.save();
        res.redirect(`/b/${board}/`);
      } catch (err) {
        res.status(500).send("Erreur lors de la création du thread");
      }
    })
    .get(async (req, res) => {
      const board = req.params.board;
      try {
        const data = await BoardModel.findOne({ name: board });
        if (!data) return res.json([]);

        const threads = data.threads
          .sort((a, b) => b.bumped_on - a.bumped_on)
          .slice(0, 10)
          .map(thread => {
            return {
              _id: thread._id,
              text: thread.text,
              created_on: thread.created_on,
              bumped_on: thread.bumped_on,
              replies: thread.replies
                .slice(-3)
                .map(r => ({ _id: r._id, text: r.text, created_on: r.created_on })),
              replycount: thread.replies.length
            };
          });
        res.json(threads);
      } catch (err) {
        res.status(500).json({ error: "Erreur serveur" });
      }
    })
    .put(async (req, res) => {
      const { thread_id } = req.body;
      const board = req.params.board;
      try {
        const boardData = await BoardModel.findOne({ name: board });
        if (!boardData) return res.send("board not found");
        const thread = boardData.threads.id(thread_id);
        if (!thread) return res.send("thread not found");

        thread.reported = true;
        await boardData.save();
        res.send("reported");
      } catch (err) { res.send("error"); }
    })
    .delete(async (req, res) => {
      const { thread_id, delete_password } = req.body;
      const board = req.params.board;
      try {
        const boardData = await BoardModel.findOne({ name: board });
        if (!boardData) return res.send("board not found");

        const thread = boardData.threads.id(thread_id);

        if (!thread) return res.send("thread not found");

        if (thread.delete_password === delete_password) {
          // OPTIMISATION : .deleteOne() sur le sous-document est la méthode moderne
          thread.deleteOne();
          await boardData.save();
          res.send("success");
        } else {
          res.send("incorrect password");
        }
      } catch (err) {
        console.error(err);
        res.send("error");
      }
    });

  // --- GESTION DES RÉPONSES (REPLIES) ---
  app.route('/api/replies/:board')
    .post(async (req, res) => {
      const { text, delete_password, thread_id } = req.body;
      const board = req.params.board;
      const now = new Date();

      try {
        const boardData = await BoardModel.findOne({ name: board });
        if (!boardData) return res.status(404).send("Board introuvable");
        const thread = boardData.threads.id(thread_id);

        if (!thread) return res.status(404).send("Thread introuvable");

        const newReply = {
          text,
          delete_password,
          created_on: now,
          reported: false
        };

        thread.bumped_on = now;
        thread.replies.push(newReply);
        await boardData.save();

        res.redirect(`/b/${board}/${thread_id}`);
      } catch (err) { res.status(500).send("Erreur serveur"); }
    })
    .get(async (req, res) => {
      const board = req.params.board;
      const { thread_id } = req.query; // FCC envoie l'ID dans la query string (?thread_id=...)

      try {
        const boardData = await BoardModel.findOne({ name: board });
        if (!boardData) {
          return res.json({ error: "board not found" });
        }

        // Recherche du thread spécifique dans le tableau de sous-documents
        const thread = boardData.threads.id(thread_id);

        if (!thread) {
          // Note : FCC préfère parfois un simple texte, mais res.json est plus robuste
          return res.send("thread not found");
        }

        // Formatage de la réponse EXACTEMENT comme demandé par les tests
        const responseData = {
          _id: thread._id,
          text: thread.text,
          created_on: thread.created_on,
          bumped_on: thread.bumped_on,
          replies: thread.replies.map(reply => ({
            _id: reply._id,
            text: reply.text,
            created_on: reply.created_on
            // IMPORTANT : On ne renvoie JAMAIS delete_password ou reported ici
          }))
        };

        res.json(responseData);
      } catch (err) {
        console.error("Erreur GET replies:", err);
        res.status(500).send("error");
      }
    })


    .put(async (req, res) => {
      const { thread_id, reply_id } = req.body;
      const board = req.params.board;
      try {
        const boardData = await BoardModel.findOne({ name: board });
        const thread = boardData.threads.id(thread_id);
        if (!thread) return res.send("thread not found");
        const reply = thread.replies.id(reply_id);

        if (!reply) return res.send("reply not found");

        reply.reported = true;
        await boardData.save();
        res.send("reported");
      } catch (err) { res.send("error"); }
    })
    .delete(async (req, res) => {
      const { thread_id, reply_id, delete_password } = req.body;
      const board = req.params.board;
      try {
        const boardData = await BoardModel.findOne({ name: board });
        const thread = boardData.threads.id(thread_id);
        if (!thread) return res.send("thread not found");
        const reply = thread.replies.id(reply_id);

        if (!reply) return res.send("reply not found");

        if (reply.delete_password === delete_password) {
          // Conformément aux consignes FCC : on ne supprime pas physiquement
          // la réponse, on remplace juste le texte.
          reply.text = "[deleted]";
          await boardData.save();
          res.send("success");
        } else {
          res.send("incorrect password");
        }
      } catch (err) { res.send("error"); }
    });
};
