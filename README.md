# AutoCAM

AutoCAM is a multi-tenant CAM workflow application for managing teams, materials, machines, tools, parts, plates, box tubes, and CAM job queues.

The app is built with Next.js App Router, React, Drizzle ORM, PostgreSQL, Better Auth, tRPC, and Zod/OpenAPI helpers.

## Features

- Team-based dashboard for CAM operations
- Part, plate, material, machine, and tool management
- API-key based runner access for Fusion 360 add-ins
- Job queue endpoints for arrange, CAM, and completion workflows
- Email verification and session-based user authentication
- OpenAPI documentation routes for integration work

## Requirements

- Bun 1.1+ or Node.js with npm
- PostgreSQL
- SMTP credentials for verification emails
- S3-compatible storage for file uploads

## Setup

Copy the example environment file and fill in local values:

```bash
cp .env.example .env
```

Install dependencies:

```bash
bun install
```

Run the development server:

```bash
bun dev
```

Open `http://localhost:3000`.

## Scripts

```bash
npm run lint
npm test -- --run
npm run build
npm run start
```

## Database

The app uses Drizzle ORM. The schema source lives in `lib/db/schema`.

```bash
npx drizzle-kit generate
npx drizzle-kit migrate
```

`ADMIN_DB_URL` should point at a database user with migration privileges. `DATABASE_URL` should be the normal application connection string.

## Environment

Required variables are documented in `.env.example`.

Do not commit `.env` or production credentials. API key digests depend on `API_KEY_DIGEST_SECRET`; changing that value invalidates existing stored API-key digests.

## License

MIT
