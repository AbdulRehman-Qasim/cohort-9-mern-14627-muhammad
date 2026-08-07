const prisma = require('../config/prisma');

// Notes service logic will be implemented here

const createNote = async (userId, data) => {
  const note = await prisma.note.create({
    data: {
      title: data.title,
      content: data.content || '',
      userId,
    },
  });
  return note;
};

const getNotes = async (userId) => {
  return prisma.note.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });
};

const getNoteById = async (id, userId) => {
  const note = await prisma.note.findFirst({
    where: { id, userId },
  });

  if (!note) {
    const error = new Error('Note not found');
    error.statusCode = 404;
    throw error;
  }

  return note;
};

const updateNote = async (id, userId, data) => {
  await getNoteById(id, userId);

  return prisma.note.update({
    where: { id },
    data: {
      title: data.title,
      content: data.content,
    },
  });
};

const deleteNote = async (id, userId) => {
  await getNoteById(id, userId);

  return prisma.note.delete({
    where: { id },
  });
};

module.exports = {
  createNote,
  getNotes,
  getNoteById,
  updateNote,
  deleteNote,
};
