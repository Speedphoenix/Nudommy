"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var express = require("express");
var bodyparser = require("body-parser");
var session = require("express-session");
var levelSession = require("level-session-store");
var metrics_1 = require("./metrics");
var user_1 = require("./user");
var app = express();
var port = process.env.PORT || '8096';
var LevelStore = levelSession(session);
var dbMet = new metrics_1.MetricsHandler('./db/metrics');
var dbUser = new user_1.UserHandler('./db/users');
var userRouter = express.Router();
var authRouter = express.Router();
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
authRouter.get('/login', function (req, res) {
    res.render('login', { err: false });
});
authRouter.get('/signup', function (req, res) {
    res.render('signup');
});
authRouter.get('/logout', function (req, res) {
    delete req.session.loggedIn;
    delete req.session.user;
    res.redirect('/login');
});
authRouter.post('/login', function (req, res, next) {
    dbUser.get(req.body.username, function (err, result) {
        if (err)
            next(err);
        if (result === undefined || !result.validatePassword(req.body.password)) {
            res.render('login', { err: true });
        }
        else {
            req.session.loggedIn = true;
            req.session.user = result;
            res.redirect('/');
        }
    });
});
app.use(authRouter);
userRouter.post('/', function (req, res, next) {
    console.log(req.body);
    dbUser.get(req.body.username, function (err, result) {
        if (!err || result !== undefined) {
            res.status(409).send("user already exists");
        }
        else {
            dbUser.saveFromForm(req.body, function (err) {
                if (err)
                    next(err);
                else
                    res.status(201).send("user persisted");
            });
        }
    });
});
userRouter.get('/:username', function (req, res, next) {
    dbUser.get(req.params.username, function (err, result) {
        if (err || result === undefined) {
            res.status(404).send("user not found");
        }
        else
            res.status(200).json(result);
    });
});
app.use('/user', userRouter);
var authCheck = function (req, res, next) {
    if (req.session.loggedIn) {
        next();
    }
    else
        res.redirect('/login');
};
app.get('/', authCheck, function (req, res) {
    res.render('index', { name: req.session.username });
});
app.get('/hello', function (req, res) { return res.render('hello.ejs', { name: false }); });
app.get('/hello/:name', function (req, res) { return res.render('hello.ejs', { name: req.params.name }); });
app.post('/metrics/:id', function (req, res) {
    dbMet.save(req.params.id, req.body, function (err) {
        if (err)
            throw err;
        res.status(200).send();
    });
});
app.get('/metrics/', function (req, res) {
    dbMet.getAll(function (err, result) {
        if (err)
            throw err;
        res.json(result);
        // res.end();
    });
});
app.get('/metrics/:id', function (req, res) {
    dbMet.getOne(req.params.id, function (err, result) {
        if (err)
            throw err;
        res.json(result);
    });
});
app.delete('/metrics/:id', function (req, res) {
    dbMet.deleteOne(req.params.id, function (err, msg) {
        if (err)
            throw err;
        res.status(200).send(msg);
    });
});
// this is obsolete and should be removed
app.get('/metrics.json', function (req, res) {
    metrics_1.MetricsHandler.get(function (err, result) {
        if (err) {
            throw err;
        }
        res.json(result);
    });
});
app.listen(port, function (err) {
    if (err) {
        throw err;
    }
    console.log("server is listening on port " + port);
});
