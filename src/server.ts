import express = require('express');
import bodyparser = require('body-parser');
import session = require('express-session');
import levelSession = require('level-session-store');

import { MetricsHandler } from './metrics';
import { UserHandler, User, userHasAccess } from './user';

const app = express();
const port: string = process.env.PORT || '8096';

const LevelStore = levelSession(session);

const dbMet: MetricsHandler = new MetricsHandler('./db/metrics');

const dbUser: UserHandler = new UserHandler('./db/users');

const userRouter = express.Router();
const authRouter = express.Router();

app.use(session({
  secret: process.env.SESSIONSECRET || 'my phrase is very secret',
  store: new LevelStore('./db/sessions'),
  resave: true,
  saveUninitialized: true,
}));

app.use(express.static('public'));
app.use(bodyparser.json());
app.use(bodyparser.urlencoded());

app.set('views', 'views');
app.set('view engine', 'ejs');


const logUserOut = function (req: any, res: any, next: any) {
  delete req.session.loggedIn;
  delete req.session.user;
  next();
}

const authCheck = function (req: any, res: any, next: any) {
  if (req.session.loggedIn) {
    next();
  } else res.redirect('/login');
}

const correctUser = function (req: any, res: any, next: any) {
  if (!req.session.loggedIn || !userHasAccess(req.session.user, req.params.username))
    res.status(403).send("Operations to this user are not permitted");
  else {
    next();
  }
}


authRouter.get('/login', (req: any, res: any) => {
  res.render('login', { err: false });
});

authRouter.get('/signup', (req: any, res: any) => {
  res.render('signup');
});

authRouter.get('/logout', logUserOut, (req: any, res: any) => {
  delete req.session.loggedIn;
  delete req.session.user;
  res.redirect('/login');
});

authRouter.post('/login', (req: any, res: any, next: any) => {
  dbUser.get(req.body.username, (err: Error | null, result?: User) => {
    // if (err) next(err);
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
    } else {
      if (!req.session.loggedIn || !userHasAccess(req.session.user, req.params.username))
        result.removePassword();
      res.status(200).json(result);
    }
  });
});

userRouter.put('/:username', correctUser, (req: any, res: any, next: any) => {
  dbUser.get(req.body.username, function (err: Error | null, result?: User) {
    if (!err || result === undefined) {
     res.status(404).send("user does not exist");
    } else {
      result.updateValues(req.body);
      dbUser.save(result, function (err: Error | null) {
        if (err) next(err);
        else res.status(204).send("user updated");
      });
    }
  });
});

userRouter.delete('/:username', correctUser, logUserOut, (req: any, res: any, next: any) => {
  console.log("inside the delete");
  dbUser.delete(req.body.username, function (err: Error | null) {
    if (!err) {
     res.status(404).send("user does not exist");
    } else {
      res.status(204).send("user deleted");
    }
  });
});

app.use('/user', userRouter);

app.get(
  '/',
  authCheck,
  (req: any, res: any) => {
    res.render('index', { name: req.session.username });
  }
);

app.post('/metrics/:id', authCheck, (req: any, res: any) => {
  dbMet.save(req.session.user, req.params.id, req.body, (err: Error | null) => {
    if (err) throw err;
    res.status(200).send();
  })
});

app.put('/metrics/:colName/:timestamp', authCheck, (req: any, res: any) => {
  dbMet.updateOne(
    req.session.user,
    req.params.colName,
    req.params.timestamp,
    req.body.value,
    (err: Error | null) => {
      if (err) res.status(404).send();
      else res.status(200).send();
    }
  );
});

app.get('/metrics/', authCheck, (req: any, res: any) => {
  dbMet.getAllFromUser(req.session.user, (err: Error | null, result: any) => {
    if (err) throw err;
    res.json(result);
    // res.end();
  });
});

// gives all that match the metric collection
app.get('/metrics/:colName', authCheck, (req: any, res: any) => {
  dbMet.getAllFromUser(req.session.user, (err: Error | null, result: any) => {
    if (err) throw err;
    if (!(req.params.colName in result)) {
      res.status(404).send();
    } else {
      res.json(result[req.params.colName]);
    }
  });
});

// gives one metric
app.get('/metrics/:colName/:timestamp', authCheck, (req: any, res: any) => {
  dbMet.getOne(
    req.session.user,
    req.params.colName,
    req.params.timestamp,
    (err: Error | null, result: any) => {
      if (err) throw err;
      if (!Array.isArray(result) || !result.length) {
        res.status(404).send();
      } else {
        res.json(result);
      }
    }
  );
});

// deletes one metric
app.delete('/metrics/:colName/:timestamp', authCheck, (req: any, res: any) => {
  dbMet.deleteOne(
    req.session.user,
    req.params.colName,
    req.params.timestamp,
    (err: Error | null, msg?: string) => {
      if (err) throw err;
      res.status(200).send(msg);
    }
  );
});

app.listen(port, (err: Error) => {
  if (err) {
    throw err;
  }
  console.log(`server is listening on port ${port}`);
});

export { dbUser, dbMet };
