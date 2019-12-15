import express = require('express');
import bodyparser = require('body-parser');

import { MetricsHandler } from './metrics'

const app = express();
const port: string = process.env.PORT || '8096';

app.use(express.static('public'));
app.use(bodyparser.json());
app.use(bodyparser.urlencoded());

app.set('views', 'view');
app.set('view engine', 'ejs');

app.get(
  '/',
  (req: any, res: any) => res.render('index')
);

app.get(
  '/hello',
  (req: any, res: any) => res.render('hello.ejs', {name: false})
);

app.get(
  '/hello/:name',
  (req: any, res: any) => res.render('hello.ejs', {name: req.params.name})
);

const dbMet: MetricsHandler = new MetricsHandler('./db/metrics')

app.post('/metrics/:id', (req: any, res: any) => {
  dbMet.save(req.params.id, req.body, (err: Error | null) => {
    if (err) throw err;
    res.status(200).send();
  })
});

app.get('/metrics/', (req: any, res: any) => {
  dbMet.getAll((err: Error | null, result: any) => {
    if (err) throw err;
    res.json(result);
    // res.end();
  });
});

app.get('/metrics/:id', (req: any, res: any) => {
  dbMet.getOne(req.params.id, (err: Error | null, result: any) => {
    if (err) throw err;
    res.json(result);
  });
});

app.delete('/metrics/:id', (req: any, res: any) => {
  dbMet.deleteOne(req.params.id, (err: Error | null, msg?: string) => {
    if (err) throw err;
    res.status(200).send(msg);
  });
});

// this is obsolete and should be removed
app.get('/metrics.json', (req: any, res: any) => {
  MetricsHandler.get((err: Error | null, result?: any) => {
    if (err) {
      throw err;
    }
    res.json(result);
  });
});

app.listen(port, (err: Error) => {
  if (err) {
    throw err;
  }
  console.log(`server is listening on port ${port}`);
});
