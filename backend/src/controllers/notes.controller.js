// @ts-check
/**
 * @typedef {import('express').Request} Request
 * @typedef {import('express').Response} Response
 * @typedef {import('express').NextFunction} NextFunction
 */

const notesService = require('../services/notes.service');
const logger = require('../utils/logger');
const socketUtil = require('../utils/socket');
const prisma = require('../config/prisma');

/**
 * @param {Request & { user?: any }} req
 * @param {Response} res
 * @param {NextFunction} next
 */
const createNote = async (req, res, next) => {
  try {
    const { title, content } = req.body;
    const data = await notesService.createNote(req.user.id, { title, content });
    
    try {
      socketUtil.getIo().to(req.user.id).emit('NOTE_CREATED', data);
    } catch (err) {}
    
    logger.info({ userId: req.user.id, noteId: data.id }, 'Note created');
    res.status(201).json({ success: true, data });
  } catch (error) {
    const errMessage = error instanceof Error ? error.message : String(error);
    logger.warn({ userId: req.user.id, error: errMessage }, 'Failed to create note');
    next(error);
  }
};

/**
 * @param {Request & { user?: any }} req
 * @param {Response} res
 * @param {NextFunction} next
 */
const getNotes = async (req, res, next) => {
  try {
    const data = await notesService.getNotes(req.user.id);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

/**
 * @param {Request & { user?: any }} req
 * @param {Response} res
 * @param {NextFunction} next
 */
const getNoteById = async (req, res, next) => {
  try {
    const data = await notesService.getNoteById(req.params.id, req.user.id);
    res.status(200).json({ success: true, data });
  } catch (error) {
    const errMessage = error instanceof Error ? error.message : String(error);
    logger.warn({ userId: req.user.id, noteId: req.params.id, error: errMessage }, 'Failed to fetch note by id');
    next(error);
  }
};

/**
 * @param {Request & { user?: any }} req
 * @param {Response} res
 * @param {NextFunction} next
 */
const updateNote = async (req, res, next) => {
  try {
    const { title, content } = req.body;
    const data = await notesService.updateNote(req.params.id, req.user.id, { title, content });
    
    try {
      socketUtil.getIo().to(req.user.id).emit('NOTE_UPDATED', data);
    } catch (err) {}
    
    logger.info({ userId: req.user.id, noteId: data ? data.id : req.params.id }, 'Note updated');
    res.status(200).json({ success: true, data });
  } catch (error) {
    const errMessage = error instanceof Error ? error.message : String(error);
    logger.warn({ userId: req.user.id, noteId: req.params.id, error: errMessage }, 'Failed to update note');
    next(error);
  }
};

/**
 * @param {Request & { user?: any }} req
 * @param {Response} res
 * @param {NextFunction} next
 */
const deleteNote = async (req, res, next) => {
  try {
    const data = await notesService.deleteNote(req.params.id, req.user.id);
    
    try {
      socketUtil.getIo().to(req.user.id).emit('NOTE_DELETED', req.params.id);
    } catch (err) {}
    
    logger.info({ userId: req.user.id, noteId: req.params.id }, 'Note deleted');
    res.status(200).json({ success: true, data });
  } catch (error) {
    const errMessage = error instanceof Error ? error.message : String(error);
    logger.warn({ userId: req.user.id, noteId: req.params.id, error: errMessage }, 'Failed to delete note');
    next(error);
  }
};

/**
 * @param {Request & { user?: any }} req
 * @param {Response} res
 * @param {NextFunction} next
 */
const importNotes = async (req, res, next) => {
  try {
    const notesToImport = req.body.notes;
    if (!Array.isArray(notesToImport)) {
      return res
        .status(400)
        .json({ success: false, error: 'Invalid format. Expected an array of notes.' });
    }

    /** @type {Array<{ title: string; content: string; userId: string }>} */
    const validNotesToCreate = [];

    // Validate payloads before transaction
    for (const note of notesToImport) {
      if (
        !note ||
        typeof note !== 'object' ||
        typeof note.title !== 'string' ||
        note.title.trim() === ''
      ) {
        return res
          .status(400)
          .json({ success: false, error: 'All imported notes must have a valid title.' });
      }
      validNotesToCreate.push({
        title: note.title.trim(),
        content: typeof note.content === 'string' ? note.content.trim() : '',
        userId: req.user.id,
      });
    }

    if (validNotesToCreate.length === 0) {
      return res.status(201).json({ success: true, data: [] });
    }

    // Atomic transaction
    /** @type {Array<{ id: string; title: string; content: string; userId: string; createdAt: Date; updatedAt: Date; }>} */
    const createdNotes = await prisma.$transaction(
      validNotesToCreate.map((noteData) =>
        prisma.note.create({
          data: noteData,
        }),
      ),
    );

    // Emit socket events only after successful commit
    try {
      const io = socketUtil.getIo();
      createdNotes.forEach((created) => {
        io.to(req.user.id).emit('NOTE_CREATED', created);
      });
    } catch (err) {}

    logger.info({ userId: req.user.id, importedCount: createdNotes.length }, 'Notes imported successfully');
    res.status(201).json({ success: true, data: createdNotes });
  } catch (error) {
    const errMessage = error instanceof Error ? error.message : String(error);
    logger.warn({ userId: req.user.id, error: errMessage }, 'Failed to import notes');
    next(error);
  }
};

module.exports = {
  createNote,
  getNotes,
  getNoteById,
  updateNote,
  deleteNote,
  importNotes,
};
