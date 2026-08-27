const { expect } = require('chai');
const sinon = require('sinon');
const proxyquire = require('proxyquire');

describe('Auth Controller', () => {
  let authController;
  let authServiceMock;
  let req, res, next;

  beforeEach(() => {
    authServiceMock = {
      registerUser: sinon.stub(),
      loginUser: sinon.stub(),
      getCurrentUser: sinon.stub()
    };

    authController = proxyquire('../../src/controllers/auth.controller', {
      '../services/auth.service': authServiceMock
    });

    req = {
      body: {},
      user: {}
    };
    res = {
      status: sinon.stub().returnsThis(),
      json: sinon.stub(),
      cookie: sinon.stub(),
      clearCookie: sinon.stub()
    };
    next = sinon.stub();
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('register', () => {
    it('should register a user successfully and return 201', async () => {
      req.body = { name: 'Test', email: 'test@test.com', password: 'password' };
      const createdUser = { id: '1', name: 'Test', email: 'test@test.com' };
      authServiceMock.registerUser.resolves(createdUser);

      let caughtError;
      try {
        await authController.register(req, res, next);
      } catch (error) {
        caughtError = error;
      }

      expect(caughtError).to.not.exist;
      expect(res.status.calledWith(201)).to.be.true;
      expect(res.json.calledWith({ success: true, data: createdUser })).to.be.true;
    });

    it('should call next with error if service fails', async () => {
      req.body = { name: 'Test', email: 'test@test.com', password: 'password' };
      const error = new Error('Service error');
      authServiceMock.registerUser.rejects(error);

      let caughtError;
      try {
        await authController.register(req, res, next);
      } catch (err) {
        caughtError = err;
      }

      expect(caughtError).to.not.exist;
      expect(next.calledWith(error)).to.be.true;
    });
  });

  describe('login', () => {
    it('should login successfully, set cookie and return 200', async () => {
      req.body = { email: 'test@test.com', password: 'password' };
      const user = { id: '1', email: 'test@test.com' };
      authServiceMock.loginUser.resolves({ token: 'jwt_token', user });

      let caughtError;
      try {
        await authController.login(req, res, next);
      } catch (error) {
        caughtError = error;
      }

      expect(caughtError).to.not.exist;
      expect(res.cookie.calledWith('jwt', 'jwt_token')).to.be.true;
      expect(res.status.calledWith(200)).to.be.true;
      expect(res.json.calledWith({ success: true, data: user })).to.be.true;
    });

    it('should call next with error if login fails', async () => {
      req.body = { email: 'test@test.com', password: 'password' };
      const error = new Error('Invalid email or password');
      authServiceMock.loginUser.rejects(error);

      let caughtError;
      try {
        await authController.login(req, res, next);
      } catch (err) {
        caughtError = err;
      }

      expect(caughtError).to.not.exist;
      expect(next.calledWith(error)).to.be.true;
    });
  });

  describe('logout', () => {
    it('should clear cookie and return 200', async () => {
      let caughtError;
      try {
        await authController.logout(req, res, next);
      } catch (error) {
        caughtError = error;
      }

      expect(caughtError).to.not.exist;
      expect(res.clearCookie.calledWith('jwt')).to.be.true;
      expect(res.status.calledWith(200)).to.be.true;
      expect(res.json.calledWith({ success: true, message: 'Logged out successfully' })).to.be.true;
    });
  });
});
