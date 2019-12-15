import { LevelDB } from './leveldb';
import WriteStream from 'level-ws';

export class Metric {
  public timestamp: string
  public value: number

  constructor(ts: string, v: number) {
    this.timestamp = ts;
    this.value = v;
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

  public save(key: string, metrics: Metric[], callback: (error: Error | null) => void) {
    const stream = WriteStream(this.db);
    stream.on('error', callback);
    stream.on('close', callback);
    metrics.forEach((m: Metric) => {
      stream.write({ key: `metric:${key}:${m.timestamp}`, value: m.value });
    });
    stream.end();
  }

  public getAll(callback: (error: Error | null, result: any) => void) {
    let metrics: Metric[] = [];
    this.db.createReadStream()
    // Read
      .on('data', function (data) {
        const timestamp = data.key.split(':')[2];
        let metric: Metric = new Metric(timestamp, data.value)
        metrics.push(metric);
      })
      .on('error', function (err) {
        console.log('Oh my!', err);
        callback(err, null);
      })
      .on('close', function () {
        console.log('Stream closed');
      })
      .on('end', function () {
        console.log('Stream ended');
        callback(null, metrics);
      });
  }

  // returns the full key of that entry in the db
  public getOne(
    key: string,
    callback: (error: Error | null, result: any, fullKey?: string) => void) {
    let metrics: Metric[] = [];
    let fullKey: string | undefined;
    this.db.createReadStream()
    // Read
      .on('data', function (data) {
        const singlekey: string = data.key.split(':')[1];
        if (singlekey === key) {
          fullKey = data.key;
          const timestamp = data.key.split(':')[2];
          metrics.push(new Metric(timestamp, data.value));
        }
      })
      .on('error', function (err) {
        console.log('Oh my!', err);
        callback(err, null);
      })
      .on('close', function () {
        console.log('Stream closed');
      })
      .on('end', function () {
        console.log('Stream ended');
        callback(null, metrics, fullKey);
      });
  }

  public deleteOne(key: string, callback: (error: Error | null, msg?: string) => void) {
    this.getOne(key, (err: Error | null, result: Metric[], fullKey?: string) => {
      if (err) callback(err);
      if (fullKey) {
		this.db.del(fullKey);
		callback(null, 'success');
	  } else {
		callback(null, 'not found');
	  }
    });
  }

  static get(callback: (error: Error | null, result?: Metric[]) => void) {
    const result = [
      new Metric('2013-11-04 14:00 UTC', 12),
      new Metric('2013-11-04 14:30 UTC', 15)
    ];
    callback(null, result);
  }
};
