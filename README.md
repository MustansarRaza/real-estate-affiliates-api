# Real Estate Affiliates API

## About

API dedicated to serving data used exclusively by the public affiliates app. This is a separate API so that the attack surface is limited.

## Architectural Capabilities

API is structured around providing a secure and isolated service for handling real estate data. Key architectural features include:

1. ***Authentication***: Utilizing Keycloak for OAuth2 authentication to ensure secure API access through bearer tokens.
2. ***Caching***: Employing Redis for server-side caching to enhance performance and manage load efficiently.
3. ***Containerization***: Docker is used for creating isolated environments that are consistent across development and production settings, ensuring the application runs smoothly in different environments.
4. ***Service Isolation***: The API is designed as a standalone service, which minimizes the attack surface by being separate from other parts of the application infrastructure.

### Authorization

A native app or web app authenticates against the [Keycloak](https://www.keycloak.org/) server and obtains a [bearer token](https://www.keycloak.org/docs/4.8/authorization_services/#_authentication_methods).

All calls to the API must then be made with the `Authorization` header set:

    Authorization: Bearer [token here]

Note: The token acquired from the Keycloak server is only valid for one hour. Upon authentication, the Keycloak server returns a refresh token that can be used to acquire a new token.

### Keycloak configuration

The client (ID) the affiliates API uses must be a client of the type `confidential`. This is required because the affiliates API needs to be able to register new users. This requires a confidential client.

### Caching

Most endpoints are not cache-able and return `Cache-Control: private, no-store` headers.

Caching is server-side and uses Redis. If enabled (by setting the `REDIS_URL environment variable), responses are cached in Redis and the`Cache-Control` header is returned matching the expiry time.

You can see an up to date list of cach-able endpoints and their cache lifetime in `src/app.ts`.

## Development

### Set up

1. Install NPM packages from the root of the repo

   ```
   yarn install
   ```

2. Configure by setting up env vars

   ```
   mv .env.example .env
   ```

   Modify the `.env` file and fill in the blanks.

### Running a build

All commands below are relative to the root of the mono-repo.

    yarn build:libs
    cd packages/affiliates-api
    yarn build
    yarn start

### Running a development server

All commands below are relative to the root of the mono-repo.

    yarn watch:affiliates-api

In a separate terminal:

    cd packages/affiliates-api
    yarn start:dev

### Common commands

1.  Auto-format code

        yarn format

2.  Lint code

        yarn lint

3.  Type check code


        yarn lint:types

4.  Auto fix linting errors and format code

        yarn fix

5.  Verify formatting, linting and types

        yarn verify

### Tips & Tricks

#### Sequelize mock logging

Flip the `logging` flag in `tests/support/sequelizeMock.ts` in the `mockOptions` variable.

#### Adding more mock data

Define a JSON file in `tests/support/fixtures`. Use the `loadSequelizeFixtures` function from `tests/support/sequelizeMock.ts` to load the fixture in your test.

Note that foreign key relationships in test fixtures must be correct. This means that referenced rows from other tables must be loaded first. The order in which fixtures are loaded matters.

If you can't figure out what rows you're missing, flip the `logging` flag in `tests/support/sequelizeMock.ts`.

### Mocking and MySQL specifics

The package that we're using for mocking database access (`sequelize-mocking`) mocks by creating a temporary SQLite3 database. This means that if we start using MySQL specific features, the mock won't work anymore. Don't be surprised.

### Snapshot tests

Some tests use snapshots where during a first run, a snapshot of the output is created and stored in the repository. Subsequent test runs compare the output against the snapshot. If there's a difference, the test fails.

In order to update the snapshots, run the tests with the `-u` flag:

    yarn test -u

Read the [Jest Documentation](https://jestjs.io/docs/en/snapshot-testing) for more information.

## Docker

### Build

Build as a Docker image from the root of the repository:

    docker build -t myimagename -f packages/affiliates-api/Dockerfile .

### Running

Run the pre-built Docker image:

    docker run -it -e PORT=80 -p 5000:80 myimagename

You can then access the service at `localhost:5000`.

#### Enviroment variables

You can always find an up to date list in `src/config.ts`.

| Name                      | Default value                             | Description                                                                           |     |     |
| ------------------------- | ----------------------------------------- | ------------------------------------------------------------------------------------- | --- | --- |
| PORT                      | 5000                                      | Port the service should bind on.                                                      |     |     |
| HOST                      | 0.0.0.0                                   | Hostname/IP the service should bind on.                                               |     |     |
| APP_SECRET                | -                                         | Randomly generated string used to encrypt cookies with.                               |     |     |
| APP_ENVIRONMENT           | unknown                                   | Name of the environment we're running in. Sent to Sentry.                             |     |     |
| APP_RELEASE               | unknown                                   | Name of the release (commit hash). Sent to Sentry.                                    |     |     |
| KEYCLOAK_REALM            | unknown                                   | Name of the Keycloak realm to validate tokens against.                                |     |     |
| KEYCLOAK_CLIENT_ID        | unknown                                   | Client ID the service should make requests with against the Keycloak server.          |     |     |
| KEYCLOAK_CLIENT_SECRET    | -                                         | Secret used to validate Keycloak tokens with without contacting the server.           |     |     |
| KEYCLOAK_AUTH_SERVER_URL  | https://stagemyaccount.propforce.com/auth | URL of the Keykloak server to validate tokens against.                                |     |     |
| DATABASE_URL              | mysql://root:@127.0.0.1/affiliates_main   | URI describring how to connect to the MySQL database.                                 |     |     |
| REDIS_URL                 | -                                         | URI describring how to connect to Redis for caching.                                  |     |     |
| AWS_S3_BUCKET_NAME        | affiliates-stage                          | Name of the AWS S3 bucket to use generate URL's for file paths found in the database. |     |     |
| AWS_S3_BUCKET_REGION      | eu-west-1                                 | AWS S3 region identifier, region the AWS S3 bucket is in.                             |     |     |
| AWS_S3_ACCESS_KEY         | -                                         | Public access key used for accessing AWS S3.                                          |     |     |
| AWS_S3_SECRET_ACCCESS_KEY | -                                         | Secret access key used for access AWS S3.                                             |     |     |
