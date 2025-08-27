# Mosaiq Mantine Template

Copy this repo to jumpstart a monorepo web project. A simple (not-really-functional) demo project has been set in place to show a rough idea of how the various systems can be used

## Setup

Run `npm i` in the root, and in all 3 subpackages (Frontend, Backend, and Common) to install their modules.

Copy the `.env.sample` files in Frontend and Backend into `.env` files to set the environment variables.

Run the project by running `npm run start` in the root directory. Or, run front and back in separate terminals by CDing into each in different terminals and running start there.

## Architecture

The project is divided into 3 packages: Frontend, Backend, and Common.

Common has shared types and shared logic that needs to be consistent across the client and server.

Backend is an express server that uses a Route > Controller > Persistence model.

1. A request comes in, it is handled by a route function in a routes file, but it does not handle any heavy "logic" there, nothing more than some basic data validation
2. The route calls to a controller function that handles the bulk of the fancy logic.
3. If the controller needs to access the database (likely), it does not make an SQL call, but rather calls upon a designated persistence function
4. A persistence function does not handle any logic at all, it simply takes in the parameters given, makes a database call through Sequelize, and returns the results

This layout allows for a simple linear debugging approach, by adhering to a linear flow of events no bugs can occur as a result of weird circular or recursive logic

The frontend is self explanatory from its directory layout. A state manager like redux is not used, state should be tied closely to where its used (but thats just good react practice..).

The Common package has types for the API. These should be used (alongside the API utils in frontend) to ensure type safety across api calls!

This project is split into distinct packages, each with their own node_modules (not a shared workspace modules as many monorepos have) to allow for easy splitting of the 3 packages upon deployment. This is less of a true monorepo as much as it is 3 distinct packages that happen to be under the same repository

## Stack

### Root:

Used for managing the 3 other packages

- Prettier (allows for easy formatting): https://prettier.io/docs/
    - Configurable from prettier.config.mjs
- Concurrently (can spawn multiple async processes under 1 command line)

### Across Frontend, Backend, and Common

- Typescript (adds type safety to js)
- Eslint (picks out syntax issues in the code. Rules are editable from eslint.config.js)

### Frontend:

#### Core

- React
- React Router (Handles navigation and routing): https://reactrouter.com/start/declarative/routing

- Webpack (Builds the React code into plain js/html that the browser can understand)
    - Babel (Converts modern module based js into common js that browsers can understand)

#### Just for fun

- Mantine (Main UI Library, but vanilla react can be used): https://mantine.dev/getting-started/
    - Core: https://mantine.dev/core/package/
    - Hooks: https://mantine.dev/hooks/package/
    - Official Extensions: https://mantine.dev/x/extensions/
    - Community Extensions: https://mantine-extensions.vercel.app/
    - PostCSS / CssLoader (handles dynamic CSS loading for Mantine)
- React Icons (Collection of loads of icons!): https://react-icons.github.io/react-icons/
- React Easy Sort (Insanely simple Drag and Drop): https://www.npmjs.com/package/react-easy-sort

### Backend

- Express (handles the http server and requests): https://expressjs.com/
- Sequelize (ORM for interacting with an SQL database from js)
- Sqlite3 (A super simple single-file SQL database. This can be hotswapped with any other SQL flavour in Sequelize upon production deployment)

### Common

The common package is inherited by Frontend and Common. More types can be added by importing/exporting from the index.ts file (the entrypoint) to keep things organized. When this package is changed, you must run `npm run build` to compile it again into the /dist directory. Alternatively, you can use `npm run build:watch` to continuously compile it on save
