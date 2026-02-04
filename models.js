const mongoose = require("mongoose");
const { Schema } = mongoose;

const ReplySchema = new Schema({
  text: { type: String, required: true },
  delete_password: { type: String }, // Ajouté pour la gestion des suppressions
  created_on: { type: Date, default: Date.now },
  bumped_on: { type: Date, default: Date.now },
  reported: { type: Boolean, default: false }
});

const ThreadSchema = new Schema({
  text: { type: String, required: true },
  delete_password: { type: String }, // Ajouté ici aussi
  created_on: { type: Date, default: Date.now },
  bumped_on: { type: Date, default: Date.now },
  reported: { type: Boolean, default: false },
  replies: { type: [ReplySchema], default: [] },
});

const BoardSchema = new Schema({
  name: { type: String, required: true },
  threads: { type: [ThreadSchema], default: [] }, // Mis en minuscule pour plus de consistance
});

const Board = mongoose.model("Board", BoardSchema);
const Thread = mongoose.model("Thread", ThreadSchema);
const Reply = mongoose.model("Reply", ReplySchema);

module.exports = { Board, Thread, Reply };
