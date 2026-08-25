const { expect } = require('chai');
const sinon = require('sinon');
const proxyquire = require('proxyquire');

describe('Notes Controller', () => {
  let notesController;
  let notesServiceMock;
  let req, res, next;

  beforeEach(() => {
    notesServiceMock = {
      createNote: sinon.stub(),
      getNotes: sinon.stub(),
      getNoteById: sinon.stub(),
      updateNote: sinon.stub(),
      deleteNote: sinon.stub()
    };

    notesController = proxyquire('../../src/controllers/notes.controller', {
      '../services/notes.service': notesServiceMock
    });

    req = {
      body: {},
      params: {},
      user: { id: 'user1' }
    };
    res = {
      status: sinon.stub().returnsThis(),
      json: sinon.stub()
    };
    next = sinon.stub();
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('createNote', () => {
    it('should create a note and return 201', async () => {
      req.body = { title: 'Test Title', content: 'Test Content' };
      const createdNote = { id: 'note1', title: 'Test Title' };
      notesServiceMock.createNote.resolves(createdNote);

      let caughtError;
      try {
        await notesController.createNote(req, res, next);
      } catch (error) {
        caughtError = error;
      }

      expect(caughtError).to.not.exist;
      expect(res.status.calledWith(201)).to.be.true;
      expect(res.json.calledWith({ success: true, data: createdNote })).to.be.true;
    });

    it('should call next with error if service fails', async () => {
      req.body = { title: 'Test Title' };
      const error = new Error('Service Error');
      notesServiceMock.createNote.rejects(error);

      let caughtError;
      try {
        await notesController.createNote(req, res, next);
      } catch (err) {
        caughtError = err;
      }

      expect(caughtError).to.not.exist;
      expect(next.calledWith(error)).to.be.true;
    });
  });

  describe('getNotes', () => {
    it('should fetch notes and return 200', async () => {
      const notes = [{ id: 'note1' }];
      notesServiceMock.getNotes.resolves(notes);

      let caughtError;
      try {
        await notesController.getNotes(req, res, next);
      } catch (error) {
        caughtError = error;
      }

      expect(caughtError).to.not.exist;
      expect(res.status.calledWith(200)).to.be.true;
      expect(res.json.calledWith({ success: true, data: notes })).to.be.true;
    });
  });

  describe('getNoteById', () => {
    it('should return note and 200', async () => {
      const note = { id: 'note1' };
      req.params = { id: 'note1' };
      notesServiceMock.getNoteById.resolves(note);

      let caughtError;
      try {
        await notesController.getNoteById(req, res, next);
      } catch (error) {
        caughtError = error;
      }

      expect(caughtError).to.not.exist;
      expect(res.status.calledWith(200)).to.be.true;
      expect(res.json.calledWith({ success: true, data: note })).to.be.true;
    });
  });
});
