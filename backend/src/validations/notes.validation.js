const { body } = require('express-validator');
const validateCreateNote = [
  body('title')
    .isString().withMessage('Title must be a string')
    .trim()
    .notEmpty().withMessage('Title is required'),
  body('content')
    .optional()
    .isString().withMessage('Content must be a string'),
];
const validateUpdateNote = [
  body('title')
    .optional()
    .isString().withMessage('Title must be a string')
    .trim()
    .notEmpty().withMessage('Title cannot be empty'),
  body('content')
    .optional()
    .isString().withMessage('Content must be a string'),
  body()
    .custom((value, { req }) => {
      if (req.body.title === undefined && req.body.content === undefined) {
        throw new Error('At least one field (title or content) must be provided');
      }
      return true;
    }),
];
module.exports = {
  validateCreateNote,
  validateUpdateNote,
};