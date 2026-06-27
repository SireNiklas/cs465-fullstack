# Travlr Getaways

Full stack travel booking application built on the MEAN stack. The project serves a customer-facing site for browsing trips and an administrative single-page application for managing trip data behind secure authentication.

Built for SNHU CS 465 Full Stack Development I.

## Stack

- MongoDB with Mongoose
- Express
- Angular v22 (standalone components)
- Node.js v18.19.1
- Handlebars for server-side views
- JSON Web Tokens for admin authentication

## Architecture

The repository holds three application layers:

- `app_server` runs the customer-facing site with Express and Handlebars. Pages are rendered on the server and sent to the browser as complete HTML.
- `app_api` is the RESTful API. It exposes trip and authentication endpoints and talks to MongoDB through Mongoose.
- `app_admin` is the Angular single-page application. It handles creating, editing, and deleting trips and consumes the API.

The data keeps the same shape across the stack. A trip is a JavaScript object on the client, JSON over HTTP, and a document in MongoDB.

\`\`\`
cs465-fullstack/
├── app.js
├── app_api/
│   ├── controllers/
│   ├── models/
│   └── routes/
├── app_server/
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   └── views/
├── app_admin/          # Angular SPA
├── public/
├── data/
└── package.json
\`\`\`

## Prerequisites

- Node.js v18.19.1
- MongoDB running locally
- Angular CLI v22 for admin development

## Setup

Clone the repository and install dependencies.

\`\`\`bash
git clone https://github.com/SireNiklas/cs465-fullstack.git
cd cs465-fullstack
npm install
\`\`\`

Build the Angular admin application.

\`\`\`bash
cd app_admin
npm install
ng build
cd ..
\`\`\`

Seed the database with the initial trip data.

\`\`\`bash
node app_api/models/seed.js
\`\`\`

## Running the application

Start the server with the npm script. The entry point is wired through `npm start`, not `node app.js`.

\`\`\`bash
npm start
\`\`\`

The customer site is available at `http://localhost:3000`.

## API endpoints

| Method | Endpoint               | Description              | Auth  |
|--------|------------------------|--------------------------|-------|
| GET    | /api/trips             | List all trips           | No    |
| GET    | /api/trips/:tripCode   | Retrieve a single trip   | No    |
| POST   | /api/trips             | Create a trip            | Yes   |
| PUT    | /api/trips/:tripCode   | Update a trip            | Yes   |
| DELETE | /api/trips/:tripCode   | Delete a trip            | Yes   |
| POST   | /api/login             | Authenticate an admin    | No    |
| POST   | /api/register          | Register an admin        | No    |

Protected endpoints expect a valid JSON Web Token in the `Authorization` header as a Bearer token.

## Admin panel

Build the Angular application and serve the site, then sign in through the admin login to manage trips. Authentication returns a token that the admin client stores and attaches to protected API calls.

## Notes

- On WSL2, MongoDB runs under systemd. Enable it with `systemd=true` under `[boot]` in `/etc/wsl.conf`, then run `wsl --shutdown` from PowerShell.
- The project targets Mongoose v8 for compatibility with Node.js v18.19.1.
