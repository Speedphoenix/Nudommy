import { expect } from 'chai';
import { Metric, MetricsHandler } from '../src/metrics'
import { LevelDB } from "../src/leveldb"

const dbPath: string = './db/test';
var dbMet: MetricsHandler;

describe('Metrics', function () {
  before(function () {
    LevelDB.clear(dbPath);
    dbMet = new MetricsHandler(dbPath);
  });

  after(function () {
    dbMet.closeDB();
  });

  describe('#get', function () {
    it('should get empty array on non existing group', function (done) {
      dbMet.getOne("0", function (err: Error | null, result: Metric[]) {
        expect(err).to.be.null;
        expect(result).to.not.be.undefined;
        expect(result).to.be.empty;
        done();
      });
    });

    it('should get a saved value', function (done) {
      let metrics: Metric[] = [];
      metrics.push(new Metric('1', 10));
      dbMet.save("kim", metrics, function (err: Error | null) {
        dbMet.getOne("kim", function (err: Error | null, result: Metric[]) {
          expect(err).to.be.null;
          expect(result).to.not.be.undefined;
          console.log(result);
          console.log(result[0]);
          if (result) {
            expect(result[0].value).to.equal(10);
          }
          done();
        });
      });
    });
  });
});
