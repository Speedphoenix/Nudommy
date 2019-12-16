# Nudommy
A mostly-back node academic project

A running version of the project can be found at [nudomy.herokuapp.com/](https://nudomy.herokuapp.com/)

# Usage
If you are making changes use
```sh
npm run dev
```
This uses nodemon and will restart the server whenever a file changes.

If you want a better production-ready server run
```sh
npm run build
npm run start-prod
```
Note that `build` will only work if the dev dependencies are installed.

## Deploying to Heroku

This project is already hosted on a Heroku app [here](https://nudomy.herokuapp.com/).

If you wish to deploy it as your own heroku app:
1. `git clone` this repository on your machine
2. Create a new Heroku app for the project.
    1. Create your heroku account [here](https://signup.heroku.com/login) or [login if you already have one](https://id.heroku.com/login)
    2. Create a new Heroku app (you may need to give it a unique name if you want a clean url)
    3. [Install the heroku cli](https://devcenter.heroku.com/articles/heroku-cli)
    4. Login to heroku using the heroku cli.
    5. Add the app's remote to your git repository: `heroku git:remote -a <your app's name>`
3. Anytime you want to deploy, use `git push heroku`.

    > You may have to specify the branch master the first time

4. Optionally, you may want to set various env variables for your app. You can set those in your app's settings.  
See [env vars](env-vars) for configurable variables.

# Env vars

Possible configuration through environment variables

|NAME|Description|Default value|
|----|-----------|-------------|
|`PORT`|The port on which to listen|8096|
|`SESSIONSECRET`|The secret used for session cookies|`'my phrase is very secret'`|

# Misc
The instructions for this project can be found [here](https://github.com/adaltas/ece-nodejs/blob/2019-fall-5-modules/PROJECT.md).  
The initial parts of this project were taken from [Speedphoenix's (Leonardo) versions of the academic nodejs labs](https://github.com/Speedphoenix/nodelabs).
