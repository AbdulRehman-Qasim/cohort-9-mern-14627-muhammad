const prisma = require('../config/prisma');
const createNote = async (userId, data) => {
  try {
    const note = await prisma.note.create({
      data: {
        title: data.title,
        content: data.content || '',
        userId,
      },
    });
    return note;
  } catch (error) {
    throw error;
  }
};
const getNotes = async (userId) => {
  try {
    return await prisma.note.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  } catch (error) {
    throw error;
  }
};
const getNoteById = async (id, userId) => {
  try {
    const note = await prisma.note.findFirst({
      where: { id, userId },
    });
    if (!note) {
      const error = new Error('Note not found');
      error.statusCode = 404;
      throw error;
    }
    return note;
  } catch (error) {
    throw error;
  }
};
const updateNote = async (id, userId, data) => {
  try {
    const result = await prisma.note.updateMany({
      where: { id, userId },
      data: {
        title: data.title,
        content: data.content,
      },
    });
    if (result.count === 0) {
      const error = new Error('Note not found');
      error.statusCode = 404;
      throw error;
    }
    return await prisma.note.findUnique({ where: { id } });
  } catch (error) {
    throw error;
  }
};
const deleteNote = async (id, userId) => {
  try {
    const result = await prisma.note.deleteMany({
      where: { id, userId },
    });
    if (result.count === 0) {
      const error = new Error('Note not found');
      error.statusCode = 404;
      throw error;
    }
    return { id };
  } catch (error) {
    throw error;
  }
};
module.exports = {
  createNote,
  getNotes,
  getNoteById,
  updateNote,
  deleteNote,
};