# Nudommy
[![Build Status](https://travis-ci.org/Speedphoenix/Nudommy.svg?branch=master)](https://travis-ci.org/Speedphoenix/Nudommy)
[![HitCount](http://hits.dwyl.io/Speedphoenix/Nudommy.svg)](http://hits.dwyl.io/Speedphoenix/Nudommy)
[![Maintainability](https://api.codeclimate.com/v1/badges/01e1c52cd9187e7b138a/maintainability)](https://codeclimate.com/github/Speedphoenix/Nudommy/maintainability)

A mostly-back node academic project

A running version of the project can be found at [nudommy.herokuapp.com](https://nudommy.herokuapp.com/)

# Description

A simple web API with a dashboard.  
Nudommy keeps track of users and their metrics.

For a list of usable api routes on Nudommy see [http Routes](#http-routes).

The instructions for this project can be found [here](https://github.com/adaltas/ece-nodejs/blob/2019-fall-5-modules/PROJECT.md).  

# Usage

## Installing Nudommy

First run
```sh
git clone https://github.com/Speedphoenix/Nudommy
cd Nudommy
npm install
```
> You can use `yarn` too if you wish.  

:warning: **Make sure you use Node version 8.10**. The compilation of leveldb has been confirmed to fail with Node v8.1. [Here are some logs on the failure](https://travis-ci.org/Speedphoenix/Nudommy/jobs/625850555).

## Running Nudommy

If you need a development server or are making frequent local changes use
```sh
npm run dev
```
This uses nodemon and will restart the server whenever a file is changed.

If you want a better production-ready server run
```sh
npm run build
npm run start-prod
```
`npm run build` will compile the typescript files to javascript into the `dest/` directory.  
`npm run start-prod` will start the server using those compiled files.  
> Note that `build` will only work if the dev-dependencies are installed.

If you keep all default values, you can then access Nudommy through http://127.0.0.1:8096/ or http://localhost:8096/

## Populating the database

You can populate the database with dummy values using
```sh
npm run populate
```

# Deploying to Heroku

This project is already hosted on a Heroku app [here](https://nudommy.herokuapp.com/).

If you wish to deploy it as your own Heroku app:
1. `git clone` this repository on your machine
2. Create a new Heroku app for the project.
    1. Create your Heroku account [here](https://signup.heroku.com/login) or [login if you already have one](https://id.heroku.com/login)
    2. Create a new Heroku app (you may need to give it a unique name if you want a clean url)
    3. [Install the Heroku CLI](https://devcenter.heroku.com/articles/heroku-cli)
    4. Login to Heroku using the Heroku CLI
    5. Add the app's remote to your git repository: `heroku git:remote -a <your app's name>`
3. Optionally, you may want to set various env variables for your app. You can set those in your app's settings.  
See [Env vars](#env-vars) for configurable variables.

## Deploy manually

Anytime you want to deploy, use `git push heroku`.  
> You may have to specify the branch master the first time

## Deploy automatically on every push to GitHub

This project is setup with travis-ci so that it would deploy automatically to a Heroku app on every push to master (if the build passes).  

To make Travis deploy to your own Heroku app:
Make sure you have the [Travis Client](https://github.com/travis-ci/travis.rb#readme) and the [Heroku CLI](https://devcenter.heroku.com/articles/heroku-cli) installed  
Edit in [`.travis.yml`](.travis.yml) the `app`, `repo` and `api_key` fields.  
To obtain a valid `api_key`, you can use
```sh
travis encrypt $(heroku auth:token) --add deploy.api_key
```
:warning: Beware as this will change other parts of `.travis.yml` too. It is recommended to duplicate the file first, and to take only the key from the generated version.  

For more information see [Continuous deployment with travis-ci](#continuous-deployment-with-travis-ci).

# Env vars

Optional configuration through environment variables

|NAME|Description|Default value|
|----|-----------|-------------|
|`PORT`|The port on which to listen|8096|
|`SESSIONSECRET`|The secret used by express for session cookies|`'my phrase is very secret'`|

# Continuous deployment with travis-ci

This project is made to transpile/build and execute its tests on every push, and deploy automatically on every push to master.  
Latest build information can be found at [travis-ci.org/Speedphoenix/Nudommy](https://travis-ci.org/Speedphoenix/Nudommy).  
See [`.travis.yml`](.travis.yml) for more information.

# http Routes

|*METHOD*:Route|Description|Parameters|
|--|--|--|
|*GET*:`/`|The front page of Nudommy||
|*GET*:`/login`|The login page||
|*POST*:`/login`|The destination of the login form. Will redirect to `/` on success, will stay on `/login` on failure.||
|*GET*:`/signup`|The signup page. Note that the signup form will redirect to `/login` and log you in automatically on success||
|*GET*:`/logout`|Will log the current session out and redirect to `/login`||
|*GET*:`/user/:username`|Returns information about a user. Note that the password is only given if that user is currently logged in.|`username`: The user to be fetched|
|*POST*:`/user`|Creates a user, or returns status code `409` if it already exists||
|*PUT*:`/user/:username`|Updates the information about a user, or returns status code 403 if the current user does not have permission to change it.|`username`: The user to be updated|
|*DELETE*:`/user/:username`|Deletes a user and logs the current user out, or returns status code 403 if the current user does not have permission to change it.|`username`: The user to be deleted|
|metrics...|||

# Miscellaneous

The name came about from making somewhat random variations of "node".

# External Sources

The initial parts of this project were taken from [Speedphoenix's (Leonardo) versions of the academic nodejs labs](https://github.com/Speedphoenix/nodelabs).

# Problems and difficulties encountered

