# CorpFlow Workforce Management API

CorpFlow is a small Express and PostgreSQL workforce-management API for multiple SaaS customers. This version hardens the starter schema and API with **tenant isolation**, **same-tenant relationship constraints**, **role-aware response mapping**, and **tenant-scoped indexes**.

## Getting Started

### Prerequisites

Node.js 18 or newer and PostgreSQL 14 or newer are recommended.

### Database Setup

Create a PostgreSQL database and apply the schema, which creates the tenants, users, projects, and billing tables and loads demonstration data:

```bash
createdb corpflow
cp .env.example .env
npm install
npm run seed
```

Update `DATABASE_URL` in `.env` when local PostgreSQL credentials differ from the example configuration.

### Run the API

```bash
npm start
```

The API defaults to `http://localhost:3000`.

## Live Deployment

The reviewed deployment is available at [https://3000-ipkxwapcnc839c81jbbg4-fadca644.sg1.manus.computer](https://3000-ipkxwapcnc839c81jbbg4-fadca644.sg1.manus.computer). This is a temporary sandbox deployment. For a permanent deployment, configure `DATABASE_URL`, `PORT`, and `NODE_ENV=production` on Render, Railway, or another Node.js host, then run `npm install` and `npm start`.

## Authentication Context for the Demo

The starter repository did not include an authentication provider. To make the security behavior testable without inventing a provider, the API uses a small demonstration middleware that reads `x-user-id`, `x-tenant-id`, and `x-role` headers. In production, these values must come from a verified session or JWT rather than directly from client-controlled headers. Defaults represent an admin in Tenant 1.

Valid roles are `admin`, `manager`, and `employee`.

## API Endpoints

| Method | Endpoint | Behavior |
|---|---|---|
| GET | `/` | Returns API status and greeting. |
| GET | `/users` | Returns tenant-scoped users; employees receive only their own profile, managers receive tenant users without salary, and admins may receive salary. |
| GET | `/users/:id` | Returns a tenant-scoped user profile and rejects cross-tenant or employee overreach. |
| GET | `/projects` | Returns tenant-scoped projects; employees receive only projects they own. |
| GET | `/projects/:id` | Returns a tenant-scoped project and rejects cross-tenant or unauthorized access. |

Sensitive fields such as `password_hash`, billing data, and non-admin salary information are never included in safe API response objects.

## Verification

Run the automated security checks with:

```bash
npm test
```

The test suite verifies the root endpoint, tenant-scoped queries, cross-tenant denial, employee restrictions, role-based field filtering, invalid-role rejection, and the existing 404 behavior.

## Security Documentation

- [`AUDIT.md`](./AUDIT.md) records the pre-refactor structural audit.
- [`SECURITY.md`](./SECURITY.md) records sensitive fields, role rules, query boundaries, relationship constraints, and mitigations.

## License

Educational submission for the CorpFlow schema-refactoring challenge.

## Status

Security-refactored challenge submission.
