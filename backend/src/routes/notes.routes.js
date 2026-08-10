const express = require('express');
const {
  createNote,
  getNotes,
  getNoteById,
  updateNote,
  deleteNote,
} = require('../controllers/notes.controller');
const { validateCreateNote, validateUpdateNote } = require('../validations/notes.validation');
const validate = require('../middlewares/validate');
const authenticate = require('../middlewares/auth');

const router = express.Router();

router.use(authenticate);

router.post('/', validateCreateNote, validate, createNote);
router.get('/', getNotes);
router.get('/:id', getNoteById);
router.patch('/:id', validateUpdateNote, validate, updateNote);
router.delete('/:id', deleteNote);

module.exports = router;
