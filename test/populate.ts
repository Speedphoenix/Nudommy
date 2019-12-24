import { MetricsHandler, Metric } from '../src/metrics';
import { UserHandler, User } from '../src/user';
const fs = require('fs');

// to generate names
var dockerNames = require('docker-names');

if (!fs.existsSync('./db')){
    fs.mkdirSync('./bd');
}

const dbMet: MetricsHandler = new MetricsHandler('./db/metrics');
const dbUser: UserHandler = new UserHandler('./db/users');

const MAXMETRICS = 80;
const MAXMETRICCOL = 20;


const getRandomInt = (max: number, min: number = 0) => {
  return Math.floor(Math.random() * (max - min)) + min;
};

const emptyUserToAdd = {
  username: 'someUser',
  email: 'someemail@example.org',
  password: 'somePassword',
};

const fixedUsersToAdd = [
  {
    username: 'exampleUser',
    email: 'example@example.org',
    password: 'examplePassword',
  },
  {
    username: 'exampleUser2',
    email: 'example2@example.org',
    password: 'examplePassword2',
  },
];

const randomUsersToAdd = [...Array(4)].map(() => {
  const randomName = dockerNames.getRandomName();
  return {
    username: randomName,
    email: `${randomName}@example.com`,
    password: `pass${randomName}`,
  };
});

const usersToAdd = [...fixedUsersToAdd, ...randomUsersToAdd];

const populate = () => {
  console.log('Now creating dummy database');
  usersToAdd.forEach((u: any) => {
    // don't do any operations as a callback
    dbUser.saveFromForm(u, (err: Error | null) => {});
  });

  // The first generated user is guaranteed to have 10 metric collections
  let metricColAmount = 10;
  usersToAdd.map((value, index) => {
    let metricsCount = 0;
    for (let i = 0; i < metricColAmount; i++) {
      const randomName = dockerNames.getRandomName();
      const newmetCount = getRandomInt(MAXMETRICS);
      const metricsToAdd = [...Array(newmetCount)].map(() => {
        // timestamp between 2013 and 2020
        return new Metric('' + getRandomInt(1577836800, 1356998400), getRandomInt(10));
      });
      dbMet.save(value.username, randomName, metricsToAdd, (err: Error | null) => {});
      metricsCount += newmetCount;
    }
    console.log(`Created user ${value.username} `
      + `(password is '${value.password}') `
      + `with ${metricsCount} metrics collections `
      + `(for a total of ${metricsCount} metrics)`
    );
    metricColAmount = getRandomInt(20, 1);
  });

  // Add a user without metrics to serve as an example
  dbUser.saveFromForm(emptyUserToAdd, (err: Error | null) => {});
  console.log(`Created user ${emptyUserToAdd.username} `
    + `(password is '${emptyUserToAdd.password}') `
    + `without any metrics`
  );
}

populate();
