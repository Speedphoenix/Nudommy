import express = require('express');
import bodyparser = require('body-parser');
import session = require('express-session');
import levelSession = require('level-session-store');

import { MetricsHandler } from './metrics';
import { UserHandler, User } from './user';

const app = express();
const port: string = process.env.PORT || '8096';

const LevelStore = levelSession(session);

const dbMet: MetricsHandler = new MetricsHandler('./db/metrics');

const dbUser: UserHandler = new UserHandler('./db/users');

const userRouter = express.Router();
const authRouter = express.Router();

app.use(session({
  secret: 'my phrase is very secret',
  store: new LevelStore('./db/sessions'),
  resave: true,
  saveUninitialized: true,
}));

app.use(express.static('public'));
app.use(bodyparser.json());
app.use(bodyparser.urlencoded());

app.set('views', 'views');
app.set('view engine', 'ejs');


authRouter.get('/login', (req: any, res: any) => {
  res.render('login', { err: false });
});

authRouter.get('/signup', (req: any, res: any) => {
  res.render('signup');
});

authRouter.get('/logout', (req: any, res: any) => {
  delete req.session.loggedIn;
  delete req.session.user;
  res.redirect('/login');
});

authRouter.post('/login', (req: any, res: any, next: any) => {
  dbUser.get(req.body.username, (err: Error | null, result?: User) => {
    if (err) next(err);
    if (result === undefined || !result.validatePassword(req.body.password)) {
      res.render('login', { err: true });
    } else {
      req.session.loggedIn = true;
      req.session.user = result;
      res.redirect('/');
    }
  });
});

app.use(authRouter);


userRouter.post('/', (req: any, res: any, next: any) => {
  console.log(req.body);
  dbUser.get(req.body.username, function (err: Error | null, result?: User) {
    if (!err || result !== undefined) {
     res.status(409).send("user already exists");
    } else {
      dbUser.saveFromForm(req.body, function (err: Error | null) {
        if (err) next(err);
        else res.status(201).send("user persisted");
      });
    }
  });
});

userRouter.get('/:username', (req: any, res: any, next: any) => {
  dbUser.get(req.params.username, function (err: Error | null, result?: User) {
    if (err || result === undefined) {
      res.status(404).send("user not found");
    } else res.status(200).json(result);
  });
});

app.use('/user', userRouter);


const authCheck = function (req: any, res: any, next: any) {
  if (req.session.loggedIn) {
    next();
  } else res.redirect('/login');
}


app.get(
  '/',
  authCheck,
  (req: any, res: any) => {
    res.render('index', { name: req.session.username });
  }
);

app.get(
  '/hello',
  (req: any, res: any) => res.render('hello.ejs', {name: false})
);

app.get(
  '/hello/:name',
  (req: any, res: any) => res.render('hello.ejs', {name: req.params.name})
);

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
