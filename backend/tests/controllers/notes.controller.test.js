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
    it('should create a note and return 201', () => {
      req.body = { title: 'Test Title', content: 'Test Content' };
      const createdNote = { id: 'note1', title: 'Test Title' };
      notesServiceMock.createNote.resolves(createdNote);

      return notesController.createNote(req, res, next).then(() => {
        expect(res.status.calledWith(201)).to.be.true;
        expect(res.json.calledWith({ success: true, data: createdNote })).to.be.true;
      });
    });

    it('should call next with error if service fails', () => {
      req.body = { title: 'Test Title' };
      const error = new Error('Service Error');
      notesServiceMock.createNote.rejects(error);

      return notesController.createNote(req, res, next).then(() => {
        expect(next.calledWith(error)).to.be.true;
      });
    });
  });

  describe('getNotes', () => {
    it('should fetch notes and return 200', () => {
      const notes = [{ id: 'note1' }];
      notesServiceMock.getNotes.resolves(notes);

      return notesController.getNotes(req, res, next).then(() => {
        expect(res.status.calledWith(200)).to.be.true;
        expect(res.json.calledWith({ success: true, data: notes })).to.be.true;
      });
    });
  });

  describe('getNoteById', () => {
    it('should return note and 200', () => {
      const note = { id: 'note1' };
      req.params = { id: 'note1' };
      notesServiceMock.getNoteById.resolves(note);

      return notesController.getNoteById(req, res, next).then(() => {
        expect(res.status.calledWith(200)).to.be.true;
        expect(res.json.calledWith({ success: true, data: note })).to.be.true;
      });
    });
  });
});
