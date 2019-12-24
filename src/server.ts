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
const metRouter = express.Router();

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

const authCheckBlock = function (req: any, res: any, next: any) {
  if (req.session.loggedIn) {
    next();
  } else {
    res.status(401).send("You must be logged in to access this");
  }
}


const correctUser = function (req: any, res: any, next: any) {
  if (!req.session.loggedIn || !userHasAccess(req.session.user.username, req.params.username))
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
  res.redirect('/login');
});

// The target of the login form
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

// To create a user
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

// To get the user's info
userRouter.get('/:username', (req: any, res: any, next: any) => {
  dbUser.get(req.params.username, function (err: Error | null, result?: User) {
    if (err || result === undefined) {
      res.status(404).send("user not found");
    } else {
      if (!req.session.loggedIn || !userHasAccess(req.session.user.username, req.params.username))
        result.removePassword();
      res.status(200).json(result);
    }
  });
});

// To update the user's info (can't change the username)
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

// To delete a user
userRouter.delete('/:username', correctUser, logUserOut, (req: any, res: any, next: any) => {
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

// Gives all the user's metrics
metRouter.get('/', authCheckBlock, (req: any, res: any) => {
  dbMet.getAllFromUser(req.session.user.username, (err: Error | null, result: any) => {
    if (err) throw err;
    res.json(result);
    // res.end();
  });
});

// Gives all metrics that match the metric collection
metRouter.get('/:colName', authCheckBlock, (req: any, res: any) => {
  dbMet.getAllFromUser(req.session.user.username, (err: Error | null, result: any) => {
    if (err) throw err;
    if (!(req.params.colName in result)) {
      res.status(404).send();
    } else {
      res.json(result[req.params.colName]);
    }
  });
});

// Gives one metric
metRouter.get('/:colName/:timestamp', authCheckBlock, (req: any, res: any) => {
  dbMet.getOne(
    req.session.user.username,
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

// To create metrics (must give a metrics array in the request body)
metRouter.post('/:colName', authCheckBlock, (req: any, res: any) => {
  dbMet.save(req.session.user.username, req.params.colName, req.body, (err: Error | null) => {
    if (err) throw err;
    res.status(200).send();
  })
});

// To edit the value of a metric.
// To change the timestamp, delete the metric and create it again
metRouter.put('/:colName/:timestamp', authCheckBlock, (req: any, res: any) => {
  dbMet.updateOne(
    req.session.user.username,
    req.params.colName,
    req.params.timestamp,
    req.body.value,
    (err: Error | null) => {
      if (err) res.status(404).send();
      else res.status(200).send();
    }
  );
});

// Deletes all metrics in a collection
metRouter.delete('/:colName', authCheckBlock, (req: any, res: any) => {
  dbMet.deleteCol(
    req.session.user.username,
    req.params.colName,
    (err: Error | null, msg?: string) => {
      if (err) throw err;
      res.status(200).send(msg);
    }
  );
});

// Deletes one metric
metRouter.delete('/:colName/:timestamp', authCheckBlock, (req: any, res: any) => {
  dbMet.deleteOne(
    req.session.user.username,
    req.params.colName,
    req.params.timestamp,
    (err: Error | null, msg?: string) => {
      if (err) throw err;
      res.status(200).send(msg);
    }
  );
});

app.use('/metrics', metRouter);

app.listen(port, (err: Error) => {
  if (err) {
    throw err;
  }
  console.log(`server is listening on port ${port}`);
});

export { dbUser, dbMet };
