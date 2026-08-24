const notesService = require('../services/notes.service');
const socket = require('../utils/socket');
const createNote = async (req, res, next) => {
  try {
    const { title, content } = req.body;
    const data = await notesService.createNote(req.user.id, { title, content });
    try {
      socket.getIo().to(req.user.id).emit('NOTE_CREATED', data);
    } catch (err) {}
    res.status(201).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};
const getNotes = async (req, res, next) => {
  try {
    const data = await notesService.getNotes(req.user.id);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};
const getNoteById = async (req, res, next) => {
  try {
    const data = await notesService.getNoteById(req.params.id, req.user.id);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};
const updateNote = async (req, res, next) => {
  try {
    const { title, content } = req.body;
    const data = await notesService.updateNote(req.params.id, req.user.id, { title, content });
    try {
      socket.getIo().to(req.user.id).emit('NOTE_UPDATED', data);
    } catch (err) {}
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};
const deleteNote = async (req, res, next) => {
  try {
    const data = await notesService.deleteNote(req.params.id, req.user.id);
    try {
      socket.getIo().to(req.user.id).emit('NOTE_DELETED', req.params.id);
    } catch (err) {}
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};
const importNotes = async (req, res, next) => {
  try {
    const notesToImport = req.body.notes;
    if (!Array.isArray(notesToImport)) {
      return res.status(400).json({ success: false, error: 'Invalid format. Expected an array of notes.' });
    }
    const createdNotes = [];
    for (const note of notesToImport) {
      if (note.title) {
        const created = await notesService.createNote(req.user.id, {
          title: note.title,
          content: note.content || ''
        });
        createdNotes.push(created);
        try {
          socket.getIo().to(req.user.id).emit('NOTE_CREATED', created);
        } catch (err) {}
      }
    }
    res.status(201).json({ success: true, data: createdNotes });
  } catch (error) {
    next(error);
  }
};
module.exports = {
  createNote,
  getNotes,
  getNoteById,
  updateNote,
  deleteNote,
  importNotes
};