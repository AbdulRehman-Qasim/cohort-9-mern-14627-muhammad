const { expect } = require('chai');
const sinon = require('sinon');
const proxyquire = require('proxyquire');

describe('Auth Service', () => {
  let authService;
  let prismaMock;
  let passwordMock;
  let jwtMock;

  beforeEach(() => {
    prismaMock = {
      user: {
        findUnique: sinon.stub(),
        create: sinon.stub()
      }
    };
    passwordMock = {
      hashPassword: sinon.stub(),
      comparePassword: sinon.stub()
    };
    jwtMock = {
      generateToken: sinon.stub()
    };

    authService = proxyquire('../../src/services/auth.service', {
      '../config/prisma': prismaMock,
      '../utils/password': passwordMock,
      '../utils/jwt': jwtMock
    });
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('registerUser', () => {
    it('should throw an error if user already exists', async () => {
      prismaMock.user.findUnique.resolves({ id: '1' });

      let caughtErr;
      try {
        await authService.registerUser('Test', 'test@test.com', 'password');
      } catch (err) {
        caughtErr = err;
      }
      
      expect(caughtErr).to.exist;
      expect(caughtErr.message).to.equal('User with this email already exists');
      expect(caughtErr.statusCode).to.equal(400);
    });

    it('should create a new user successfully', async () => {
      prismaMock.user.findUnique.resolves(null);
      passwordMock.hashPassword.resolves('hashed_password');
      prismaMock.user.create.resolves({ id: '1', name: 'Test', email: 'test@test.com' });

      const user = await authService.registerUser('Test', 'test@test.com', 'password');
      
      expect(user).to.have.property('id', '1');
      expect(prismaMock.user.create.calledOnce).to.be.true;
      expect(passwordMock.hashPassword.calledWith('password')).to.be.true;
    });
  });

  describe('loginUser', () => {
    it('should throw 401 if user not found', async () => {
      prismaMock.user.findUnique.resolves(null);

      let caughtErr;
      try {
        await authService.loginUser('test@test.com', 'password');
      } catch (err) {
        caughtErr = err;
      }

      expect(caughtErr).to.exist;
      expect(caughtErr.message).to.equal('Invalid email or password');
      expect(caughtErr.statusCode).to.equal(401);
    });

    it('should throw 401 if password is invalid', async () => {
      prismaMock.user.findUnique.resolves({ id: '1', password: 'hashed' });
      passwordMock.comparePassword.resolves(false);

      let caughtErr;
      try {
        await authService.loginUser('test@test.com', 'password');
      } catch (err) {
        caughtErr = err;
      }

      expect(caughtErr).to.exist;
      expect(caughtErr.message).to.equal('Invalid email or password');
      expect(caughtErr.statusCode).to.equal(401);
    });

    it('should login successfully and return token and safe user', async () => {
      const dbUser = { id: '1', name: 'Test', email: 'test@test.com', password: 'hashed', createdAt: new Date(), updatedAt: new Date() };
      prismaMock.user.findUnique.resolves(dbUser);
      passwordMock.comparePassword.resolves(true);
      jwtMock.generateToken.returns('fake_token');

      const result = await authService.loginUser('test@test.com', 'password');

      expect(result.token).to.equal('fake_token');
      expect(result.user).to.not.have.property('password');
      expect(result.user).to.have.property('email', 'test@test.com');
    });
  });
});
