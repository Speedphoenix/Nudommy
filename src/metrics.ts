import { LevelDB } from './leveldb';
import WriteStream from 'level-ws';

import { userHasAccess } from  './user';

export class Metric {
  public timestamp: string;
  public value: number;

  constructor(ts: string, v: number) {
    this.timestamp = ts;
    this.value = v;
  }

  public getFullKey(username: string, collection: string) {
    return `metric:${username}:${collection}:${this.timestamp}`;
  }
};

export class MetricsHandler {
  private db: any;

  constructor(dbPath: string) {
    this.db = LevelDB.open(dbPath);
  }

  public closeDB() {
    this.db.close();
  }

  public save = (
    username: string,
    metricCol: string,
    metrics: Metric[],
    callback: (error: Error | null) => void
  ) => {
    const stream = WriteStream(this.db);
    stream.on('error', callback);
    stream.on('close', callback);
    metrics.forEach((m: Metric) => {
      stream.write({ key: `metric:${username}:${metricCol}:${m.timestamp}`, value: m.value });
    });
    stream.end();
  }

  public updateOne = (
    username: string | undefined,
    metricCol: string,
    timestamp: string,
    newValue: number,
    callback: (error: Error | null) => void
  ) => {
    const fullkey = `metric:${username}:${metricCol}:${timestamp}`;
    this.db.get(fullkey, (err: Error | null, data: any) => {
      if (err || data === undefined) callback(err);
      else {
        this.db.put(fullkey, newValue, (err: Error | null) => {
          callback(err);
        });
      }
    });
  }

  public getAll(callback: (error: Error | null, result: any) => void) {
    this.getAllFromUser(undefined, callback);
  }

  public getAllFromUser(username: string | undefined, callback: (error: Error | null, result: any) => void) {
    let metrics: any = {};
    this.db.createReadStream()
      .on('data', function (data) {
        const splitkey = data.key.split(':');
        if (username === undefined || userHasAccess(username, splitkey[1])) {
          const metricCol = splitkey[2];
          if (!(metricCol in metrics))
            metrics[metricCol] = [];
          const timestamp = splitkey[3];
          const metric: Metric = new Metric(timestamp, data.value)
          metrics[metricCol].push(metric);
        }
      })
      .on('error', function (err) {
        callback(err, null);
      })
      .on('close', function () {
      })
      .on('end', function () {
        callback(null, metrics);
      });
  }

  // also gives the full key of that entry in the db
  public getOne = (
    username: string | undefined,
    metricCol: string,
    timestamp: string | undefined,
    callback: (error: Error | null, result: any, fullKey?: string) => void
  ) => {
    let metrics: Metric[] = [];
    let fullKey: string | undefined;
    this.db.createReadStream()
    // Read
      .on('data', function (data) {
        const user: string = data.key.split(':')[1];
        if (username === undefined || userHasAccess(username, user)) {
          const colname: string = data.key.split(':')[2];
          const ts = data.key.split(':')[3];
          if (colname === metricCol && (timestamp === undefined || timestamp === ts)) {
            fullKey = data.key;
            metrics.push(new Metric(ts, data.value));
          }
        }
      })
      .on('error', function (err) {
        callback(err, null);
      })
      .on('close', function () {
      })
      .on('end', function () {
        callback(null, metrics, fullKey);
      });
  }

  public deleteOne = (
    username: string | undefined,
    metricCol: string,
    timestamp: string | undefined,
    callback: (error: Error | null, msg?: string) => void
  ) => {
    this.getOne(
      username,
      metricCol,
      timestamp,
      (err: Error | null, result: Metric[], fullKey?: string) => {
        if (err) callback(err);
        if (fullKey) {
          this.db.del(fullKey);
          callback(null, 'success');
        } else {
          callback(null, 'not found');
        }
      }
    );
  }

  public deleteCol = (
    username: string,
    metricCol: string,
    callback: (error: Error | null, msg?: string) => void
  ) => {
    this.getAllFromUser(
      username,
      (err: Error | null, result: Metric[]) => {
        if (err) callback(err);
        else if (!(metricCol in result)) {
          callback(null, 'not found');
        } else {
          result.forEach((m: Metric) => {
            this.db.del(m.getFullKey(username, metricCol));
          });
          callback(null, 'success');
        }
      }
    );
  }
};
