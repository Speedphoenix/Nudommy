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
      });
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
        });
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
        });
      });
    });
  });
});
