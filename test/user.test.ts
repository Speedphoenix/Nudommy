import { expect } from 'chai';
import { User, UserHandler } from '../src/user'
import { LevelDB } from "../src/leveldb"

const dbPath: string = './db/test-user';
let dbUser: UserHandler;

describe('User', function () {
  before(function () {
    LevelDB.clear(dbPath);
    dbUser = new UserHandler(dbPath);
  });

  after(function () {
    dbUser.closeDB();
  });

  describe('#get', function () {
    it('should not get any user on non existing group', function (done) {
      dbUser.get('0', function (err: Error | null, result?: User) {
        // err could be not null
        expect(result).to.be.undefined;
        done();
      });
    });

    it('should get a saved value', function (done) {
      let user: User = new User('testuser', 'test@example.com', 'testpassword');
      dbUser.save(user, function (err: Error | null) {
        dbUser.get(user.username, function (err: Error | null, result?: User) {
          expect(err).to.be.null;
          expect(result).to.not.be.undefined;
          if (result) {
            // deep equality
            expect(result).to.eql(user);
          }
          done();
        });
      });
    });
  });

  describe('#save', function () {
    it('should get a saved value from form', function (done) {
      let user: any = {
        username: 'testuser1',
        email: 'test@example.com',
        password: 'testpassword',
      };
      dbUser.saveFromForm(user, function (err: Error | null) {
        dbUser.get(user.username, function (err: Error | null, result?: User) {
          expect(err).to.be.null;
          expect(result).to.not.be.undefined;
          if (result) {
            expect(result.username).to.eql(user.username);
            expect(result.email).to.eql(user.email);
          }
          done();
        });
      });
    });

    it('should get an updated value', function (done) {
      let user: User = new User('testuser2', 'test@example.com', 'testpassword');
      dbUser.save(user, function (err: Error | null) {
        user.email = 'other@example.com';
        dbUser.save(user, function (err: Error | null) {
          dbUser.get(user.username, function (err: Error | null, result?: User) {
            expect(err).to.be.null;
            expect(result).to.not.be.undefined;
            if (result) {
              // deep equality with the new values
              expect(result).to.eql(user);
            }
            done();
          });
        });
      });
    });
  });

  describe('#delete', function () {
    it('should not get any user after its deletion', function (done) {
      let user: User = new User('testuser3', 'test@example.com', 'testpassword');
      dbUser.save(user, function (err: Error | null) {
        dbUser.delete(user.username, function (err: Error | null) {
          dbUser.get(user.username, function (err: Error | null, result?: User) {
            expect(result).to.be.undefined;
            done();
          });
        });
      });
    });
  });
});
