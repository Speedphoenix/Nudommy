import { expect } from 'chai';
import { Metric, MetricsHandler } from '../src/metrics'
import { LevelDB } from "../src/leveldb"

const dbPath: string = './db/test-metrics';
let dbMet: MetricsHandler;

describe('Metrics', function () {
  before(function () {
    LevelDB.clear(dbPath);
    dbMet = new MetricsHandler(dbPath);
  });

  after(function () {
    dbMet.closeDB();
  });

  describe('#getOne', function () {
    it('should get empty array on non existing group', function (done) {
      dbMet.getOne(
        'someuser',
        '0',
        '2013-11-04 14:00 UTC',
        function (err: Error | null, result: Metric[]) {
          expect(err).to.be.null;
          expect(result).to.not.be.undefined;
          expect(result).to.be.empty;
          done();
        }
      );
    });

    it('should get a saved value', function (done) {
      let metrics: Metric[] = [];
      metrics.push(new Metric('1', 10));
      dbMet.save('someuser', 'kim', metrics, function (err: Error | null) {
        dbMet.getOne(
          'someuser',
          'kim',
          '1',
          function (err: Error | null, result: Metric[]) {
            expect(err).to.be.null;
            expect(result).to.not.be.undefined;
            if (result) {
              expect(result[0].value).to.equal(10);
            }
            done();
          }
        );
      });
    });

    it('should get an empty array for a different user', function (done) {
      let metrics: Metric[] = [];
      metrics.push(new Metric('1', 10));
      dbMet.save('someuser', 'kim', metrics, function (err: Error | null) {
        dbMet.getOne(
          'someotheruser',
          'kim',
          '1',
          function (err: Error | null, result: Metric[]) {
            expect(err).to.be.null;
            expect(result).to.not.be.undefined;
            expect(result).to.be.empty;
            done();
          }
        );
      });
    });
  });

  describe('#getAll', function () {
    it('should find all new metrics', function (done) {
      const met1 = new Metric('1', 10);
      const met2 = new Metric('2', 11);
      let metrics: Metric[] = [ met1, met2 ];
      dbMet.save('someuser', 'kim', metrics, function (err: Error | null) {
        dbMet.getAllFromUser('someuser', (err: Error | null, result: any) => {
          expect(err).to.be.null;
          expect(result.kim).to.not.be.empty;
          expect(result.kim).to.eql([ met1, met2 ]);
          expect(result).to.eql({ kim: [ met1, met2 ] });
          done();
        });
      });
    });

    it("should only find one user's metrics", function (done) {
      const met1 = new Metric('1', 10);
      const met2 = new Metric('2', 11);
      let metrics: Metric[] = [ met1, met2 ];
      let othermetrics1: Metric[] = [ new Metric('3', 13) ];
      let othermetrics2: Metric[] = [ new Metric('4', 14) ];
      dbMet.save('someother', 'kim', othermetrics1, function (err: Error | null) {});
      dbMet.save('someother', 'kim2', othermetrics2, function (err: Error | null) {});
      dbMet.save('someuser', 'kim', metrics, function (err: Error | null) {
        dbMet.getAllFromUser('someuser', (err: Error | null, result: any) => {
          expect(err).to.be.null;
          expect(result.kim).to.not.be.empty;
          expect(result.kim).to.eql([ met1, met2 ]);
            expect(result).to.eql({ kim: [ met1, met2 ] });
          done();
        });
      });
    });
  });

  describe('#deleteOne', function () {
    it('should not find a deleted metric', function (done) {
      const met1 = new Metric('1', 10);
      const met2 = new Metric('2', 11);
      let metrics: Metric[] = [ met1, met2 ];
      dbMet.save('someuser', 'kim', metrics, function (err: Error | null) {
        dbMet.deleteOne('someuser', 'kim', '2', (err: Error | null, msg?: string) => {
          dbMet.getAllFromUser('someuser', (err: Error | null, result: any) => {
            expect(err).to.be.null;
            expect(result.kim).to.not.be.empty;
            expect(result.kim).to.eql([ met1 ]);
            expect(result).to.eql({ kim: [ met1 ] });
            done();
          });
        });
      });
    });
  });

  describe('#deleteCol', function () {
    it('should not find a deleted metric', function (done) {
      const met1 = new Metric('1', 10);
      const met2 = new Metric('2', 11);
      let metrics: Metric[] = [ met1, met2 ];
      let othermetrics1: Metric[] = [ new Metric('3', 13) ];
      dbMet.save('someuser', 'kim', metrics, function (err: Error | null) {
        dbMet.save('someuser', 'kim2', othermetrics1, function (err: Error | null) {
          dbMet.deleteCol('someuser', 'kim', (err: Error | null, msg?: string) => {
            dbMet.getAllFromUser('someuser', (err: Error | null, result: any) => {
              expect(err).to.be.null;
              expect(result.kim).to.be.undefined;
              expect(result.kim2).to.not.be.empty;
              expect(result).to.eql({ kim2: othermetrics1 });
              done();
            });
          });
        });
      });
    });
  });
});
