import { Request, Response, NextFunction } from 'express';
import notesService from '../services/notes.service';
import socketUtil from '../utils/socket';
import prisma from '../config/prisma';

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

const createNote = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { title, content } = req.body;
    const data = await notesService.createNote(req.user.id, { title, content });
    try {
      socketUtil.getIo().to(req.user.id).emit('NOTE_CREATED', data);
    } catch (err) {}
    res.status(201).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

const getNotes = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await notesService.getNotes(req.user.id);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

const getNoteById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await notesService.getNoteById(req.params.id, req.user.id);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

const updateNote = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { title, content } = req.body;
    const data = await notesService.updateNote(req.params.id, req.user.id, { title, content });
    try {
      socketUtil.getIo().to(req.user.id).emit('NOTE_UPDATED', data);
    } catch (err) {}
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

const deleteNote = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await notesService.deleteNote(req.params.id, req.user.id);
    try {
      socketUtil.getIo().to(req.user.id).emit('NOTE_DELETED', req.params.id);
    } catch (err) {}
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

const importNotes = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const notesToImport = req.body.notes;
    if (!Array.isArray(notesToImport)) {
      return res.status(400).json({ success: false, error: 'Invalid format. Expected an array of notes.' });
    }

    const validNotesToCreate: Array<{ title: string; content: string; userId: string }> = [];

    // Validate payloads before transaction
    for (const note of notesToImport) {
      if (!note.title || typeof note.title !== 'string' || note.title.trim() === '') {
        return res.status(400).json({ success: false, error: 'All imported notes must have a valid title.' });
      }
      validNotesToCreate.push({
        title: note.title.trim(),
        content: typeof note.content === 'string' ? note.content.trim() : '',
        userId: req.user.id
      });
    }

    if (validNotesToCreate.length === 0) {
      return res.status(201).json({ success: true, data: [] });
    }

    // Atomic transaction
    const createdNotes = await prisma.$transaction(
      validNotesToCreate.map((noteData) =>
        prisma.note.create({
          data: noteData
        })
      )
    );

    // Emit socket events only after successful commit
    try {
      const io = socketUtil.getIo();
      createdNotes.forEach((created) => {
        io.to(req.user.id).emit('NOTE_CREATED', created);
      });
    } catch (err) {}

    res.status(201).json({ success: true, data: createdNotes });
  } catch (error) {
    next(error);
  }
};

export = {
  createNote,
  getNotes,
  getNoteById,
  updateNote,
  deleteNote,
  importNotes
};