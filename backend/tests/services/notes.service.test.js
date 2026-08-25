const { expect } = require('chai');
const sinon = require('sinon');
const proxyquire = require('proxyquire');

describe('Notes Service', () => {
  let notesService;
  let prismaMock;

  beforeEach(() => {
    prismaMock = {
      note: {
        create: sinon.stub(),
        findMany: sinon.stub(),
        findFirst: sinon.stub(),
        update: sinon.stub(),
        delete: sinon.stub()
      }
    };

    notesService = proxyquire('../../src/services/notes.service', {
      '../config/prisma': prismaMock
    });
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('createNote', () => {
    it('should create a new note', async () => {
      const noteData = { title: 'Test', content: 'Content' };
      const createdNote = { id: '1', ...noteData, userId: 'user1' };
      prismaMock.note.create.resolves(createdNote);

      const result = await notesService.createNote('user1', noteData);
      
      expect(result).to.deep.equal(createdNote);
      expect(prismaMock.note.create.calledOnce).to.be.true;
    });
  });

  describe('getNotes', () => {
    it('should fetch notes for a specific user', async () => {
      const notes = [{ id: '1', title: 'Test' }];
      prismaMock.note.findMany.resolves(notes);

      const result = await notesService.getNotes('user1');

      expect(result).to.deep.equal(notes);
      expect(prismaMock.note.findMany.calledWith({
        where: { userId: 'user1' },
        orderBy: { createdAt: 'desc' }
      })).to.be.true;
    });
  });

  describe('getNoteById', () => {
    it('should throw 404 if note not found', async () => {
      prismaMock.note.findFirst.resolves(null);

      let caughtErr;
      try {
        await notesService.getNoteById('note1', 'user1');
      } catch (err) {
        caughtErr = err;
      }

      expect(caughtErr).to.exist;
      expect(caughtErr.message).to.equal('Note not found');
      expect(caughtErr.statusCode).to.equal(404);
    });

    it('should return note if found and owned by user', async () => {
      const note = { id: 'note1', userId: 'user1' };
      prismaMock.note.findFirst.resolves(note);

      const result = await notesService.getNoteById('note1', 'user1');
      expect(result).to.deep.equal(note);
    });
  });
});
