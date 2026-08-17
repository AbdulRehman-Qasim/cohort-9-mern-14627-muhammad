const notesService = require('../services/notes.service');

const createNote = async (req, res, next) => {
  try {
    const { title, content } = req.body;
    const data = await notesService.createNote(req.user.id, { title, content });
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
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

const deleteNote = async (req, res, next) => {
  try {
    const data = await notesService.deleteNote(req.params.id, req.user.id);
    res.status(200).json({ success: true, data });
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
};
