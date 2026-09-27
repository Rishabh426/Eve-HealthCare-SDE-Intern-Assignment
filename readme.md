# EVE Healthcare — Diagnostic Booking API

A production-deployed backend API for diagnostic test bookings, built with **Node.js, TypeScript, Express, PostgreSQL, Prisma, Redis, and JWT authentication**.

The system lets authenticated users browse diagnostic centres and tests, create bookings, process them asynchronously through a Redis-backed worker, simulate payments, and confirm bookings through an idempotent webhook flow.

---

## Live API

| | |
|---|---|
| **Base URL** | https://evehealthcare.onrender.com/ |
| **Swagger UI** | https://evehealthcare.onrender.com/api-docs |

The Swagger UI is the primary way to explore and test every endpoint — no Postman collection or Docker setup is required to try the API.

---

## Table of Contents

- [Architecture](#architecture)
- [Booking Flow](#booking-flow)
- [Authentication](#authentication)
- [API Reference](#api-reference)
- [Walkthrough: A Real Request/Response Cycle](#walkthrough-a-real-requestresponse-cycle)
- [Booking States](#booking-states)
- [Database](#database)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Running Locally](#running-locally)
- [Design Decisions](#design-decisions)
- [Error Handling](#error-handling)
- [Future Improvements](#future-improvements)

---

## Architecture

```text
Client
  │
  ▼
Express API (Node.js + TS)
  │
  ├── PostgreSQL (via Prisma)
  ├── Redis Queue
  └── JWT Auth
        │
        ▼
  Background Worker
        │
        ▼
  Mock Payment Service
        │
        ▼
  Payment Webhook (idempotent)
        │
        ▼
  Booking → CONFIRMED
```

The Express API and background worker run inside the same Web Service process on Render. Redis is used purely as an external job queue; PostgreSQL holds all persistent data. No containerization (Docker) is used — the app runs directly as a Node process both locally and on Render.

---

## Booking Flow

A booking is never confirmed immediately. Creating a booking only queues it for asynchronous payment processing:

1. User creates a booking → stored as `PENDING`
2. Booking ID pushed onto a Redis queue (`LPUSH booking_queue <bookingId>`)
3. Background worker pops the job (`BRPOP booking_queue`)
4. Worker calls the mock payment service (`POST /api/payments`)
5. Payment service generates a `paymentId` and `eventId`
6. Payment service triggers the webhook (`POST /api/webhooks/payment`)
7. Webhook validates the event and confirms the booking → `CONFIRMED`

This keeps the initial API response fast — the client doesn't wait on payment processing to complete.

**Why a Redis list as a queue?** `LPUSH`/`BRPOP` gives simple, reliable background processing without introducing extra infrastructure for what the assignment scope needs.

**Why a separate Redis connection for the worker?** `BRPOP` blocks. The worker keeps its own Redis connection so that blocking call never interferes with the API's normal Redis operations.

**Webhook idempotency:** each webhook carries a unique `eventId`. Before confirming a booking, the system checks whether that `eventId` has already been recorded in the `WebhookEvent` table — if so, the event is ignored, so duplicate deliveries can't double-confirm a booking.

---

## Authentication

Authentication uses JWTs. Sign up, log in, then send the token as a bearer header on protected routes.

```
Authorization: Bearer <JWT_TOKEN>
```

---

## API Reference

### Auth

| Method | Endpoint | Auth |
|---|---|---|
| POST | `/auth/signup` | No |
| POST | `/auth/login` | No |

### Diagnostic Centres

| Method | Endpoint | Auth |
|---|---|---|
| GET | `/api/centers` | No |
| GET | `/api/centers/:id` | No |
| GET | `/api/centers/:id/tests` | No |

### Bookings

| Method | Endpoint | Auth |
|---|---|---|
| POST | `/api/bookings` | JWT |
| GET | `/api/booking` | JWT |
| GET | `/api/booking/:id` | JWT |
| PATCH | `/api/booking/:id/cancel` | JWT |

### Payments & Webhooks

| Method | Endpoint | Auth |
|---|---|---|
| POST | `/api/payments` | No |
| POST | `/api/webhooks/payment` | No |

---

## Walkthrough: A Real Request/Response Cycle

Below is an actual end-to-end run against the live API, from signup through a confirmed booking.

### 1. Sign up

**Request** — `POST /auth/signup`
```json
{
  "name": "samay",
  "email": "samay@gmail.com",
  "password": "samay@1234",
  "confirmPassword": "samay@1234"
}
```

**Response**
```json
{
  "message": "User registered successfully",
  "user": {
    "id": "512cd95c-9417-4a1a-b03d-334a3e31a7fd",
    "name": "samay",
    "email": "samay@gmail.com",
    "createdAt": "2026-09-27T06:14:40.516Z"
  }
}
```

### 2. Log in

**Request** — `POST /auth/login`
```json
{
  "email": "samay@gmail.com",
  "password": "samay@1234"
}
```

**Response**
```json
{
  "message": "User logged in successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

Use this token as `Authorization: Bearer <token>` on every request below.

### 3. Browse centres and tests

**Request** — `GET /api/centers`

Returns an array of centre objects, each with its available tests:

```json
[
  {
    "id": "616bfd76-921e-4925-9042-9fbf79249d31",
    "name": "Star Lab",
    "location": "Heera Nagar, Haldwani",
    "createdAt": "2026-09-25T12:38:35.675Z",
    "updatedAt": "2026-09-25T12:38:35.675Z",
    "tests": [
      { "id": "8459daee-47e5-46b9-ad71-c6d27c001c6e", "name": "CBC", "price": 400 },
      { "id": "872d31ab-c14b-4cd3-8d58-9c6429f1f927", "name": "Blood Sugar", "price": 150 },
      { "id": "bbb549e7-a41c-43d5-a4c7-5c6f78ec5419", "name": "Thyroid Profile", "price": 700 },
      { "id": "718ac552-f60e-4a67-91fa-d6377b7b10ba", "name": "Lipid Profile", "price": 600 },
      { "id": "d9f7703d-776d-42a3-ab97-4af97c793c8d", "name": "Vitamin D", "price": 1000 }
    ]
  }
]
```

### 4. Create a booking

**Request** — `POST /api/bookings` (JWT required)
```json
{
  "diagnosticTestId": "099e3d7a-c204-4dd2-b1da-ac915dcc5142",
  "diagnosticCentreId": "dba4ca49-c41d-4fe2-866c-12b524d1d466",
  "appointmentDateTime": "2026-12-05T10:30:00+05:30"
}
```

**Response** — booking starts life as `PENDING`
```json
{
  "message": "Booking created successfully",
  "booking": {
    "id": "6344efe3-0594-43bc-bba6-9d3930356799",
    "diagnosticTestId": "099e3d7a-c204-4dd2-b1da-ac915dcc5142",
    "diagnosticCentreId": "dba4ca49-c41d-4fe2-866c-12b524d1d466",
    "appointmentDateTime": "2026-12-05T05:10:00.000Z",
    "amount": 400,
    "status": "PENDING",
    "createdAt": "2026-09-27T06:25:18.791Z"
  }
}
```

The worker then picks this up off the Redis queue, calls the mock payment service, and the webhook confirms it.

### 5. Fetch booking history

**Request** — `GET /api/booking` (JWT required)

A moment later, the same booking shows up `CONFIRMED`, with its related test and centre embedded:

```json
[
  {
    "id": "6344efe3-0594-43bc-bba6-9d3930356799",
    "userId": "b5c73729-d338-48c0-be30-194a6b0d1b56",
    "diagnosticTestId": "099e3d7a-c204-4dd2-b1da-ac915dcc5142",
    "diagnosticCentreId": "dba4ca49-c41d-4fe2-866c-12b524d1d466",
    "appointmentDateTime": "2026-12-05T05:10:00.000Z",
    "amount": 400,
    "status": "CONFIRMED",
    "createdAt": "2026-09-27T06:25:18.791Z",
    "updatedAt": "2026-09-27T06:25:19.374Z",
    "DiagnosticTest": {
      "id": "099e3d7a-c204-4dd2-b1da-ac915dcc5142",
      "name": "CBC",
      "price": 400,
      "centreId": "dba4ca49-c41d-4fe2-866c-12b524d1d466"
    },
    "DiagnosticCentre": {
      "id": "dba4ca49-c41d-4fe2-866c-12b524d1d466",
      "name": "Pathkind Labs",
      "location": "Kaladhungi Road, Kusumkhera, Haldwani"
    }
  }
]
```

### 6. Cancel a booking

**Request** — `PATCH /api/booking/:id/cancel` (JWT required)

**Response**
```json
{
  "message": "Booking cancelled successfully"
}
```

### 7. (Internal) Mock payment call

`POST /api/payments` is called by the worker, not the client directly — shown here for reference:

```json
{
  "bookingId": "700884f2-98e9-4dfd-bc30-2c54a9c1bfe6",
  "amount": "300"
}
```

---

## Booking States

The system implements three booking states:

```text
PENDING  ──────────────►  CONFIRMED
   │                          │
   └──────────────────────────┴──►  CANCELLED
```

- **PENDING** — created, awaiting async payment processing
- **CONFIRMED** — payment webhook processed successfully
- **CANCELLED** — cancelled by the user while in a cancellable state

> Note: the primary implemented flow is `PENDING → CONFIRMED`, with cancellation available from either `PENDING` or `CONFIRMED`. A `FAILED` state is not currently implemented and is listed only as a future improvement.

---

## Database

PostgreSQL is the primary datastore, accessed through Prisma. Main entities:

- `User`
- `DiagnosticCentre`
- `DiagnosticTest`
- `Booking`
- `WebhookEvent`

```text
User
 │
 └──< Booking >── DiagnosticTest
          │
          └────── DiagnosticCentre
```

A booking belongs to exactly one user, one diagnostic test, and one diagnostic centre.

---

## Tech Stack

| Layer | Tools |
|---|---|
| Backend | Node.js, TypeScript, Express.js |
| Database | PostgreSQL, Prisma ORM |
| Auth | JWT, bcrypt |
| Async processing | Redis (list-based queue), background worker |
| API docs | Swagger UI / OpenAPI |
| Deployment | Render (no Docker) |

---

## Project Structure

```text
.
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
│
├── src/
│   ├── lib/
│   │   ├── prisma.ts
│   │   └── redis.ts
│   │
│   ├── routes/
│   │   ├── auth.routes.ts
│   │   ├── booking.routes.ts
│   │   ├── center.routes.ts
│   │   ├── payments.route.ts
│   │   └── payment.webhook.ts
│   │
│   ├── utils/
│   │   └── generateId.ts
│   │
│   ├── middleware/
│   │   └── auth.middleware.ts
│   │
│   ├── swagger.ts
│   ├── worker.ts
│   └── index.ts
│
├── package.json
├── tsconfig.json
└── README.md
```

---

## Running Locally

```bash
# 1. Clone
git clone <your-repository-url>
cd <your-repository-name>

# 2. Install
npm install

# 3. Configure environment — create a .env file:
DATABASE_URL=your_postgresql_connection_string
REDIS_URL=redis://localhost:6379
JWT_SECRET=your_jwt_secret
API_URL=http://localhost:3000

# 4. Generate Prisma client
npx prisma generate

# 5. Run migrations
npx prisma migrate dev

# 6. Seed the database
npm run db:seed

# 7. Start
npm run dev        # development
npm run build && npm start   # production build
```

Once running, open the Swagger UI at `http://localhost:3000/api-docs` (or the deployed version at https://evehealthcare.onrender.com/api-docs) to explore and test every endpoint — authorize with `Bearer <your-jwt-token>` for protected routes.

**Note:** this project does not use Docker. It's run directly as a Node process both locally and on Render.

For production, the same environment variables are configured through Render's dashboard, with `API_URL` set to the deployed URL (used by the background worker to call the payment API).

---

## Design Decisions

- **Asynchronous booking processing** — the booking endpoint only creates the record and queues its ID; payment processing happens separately via the worker, keeping the API response fast.
- **Redis list as queue** — `LPUSH` / `BRPOP` gives simple background processing without extra infrastructure.
- **Separate worker Redis connection** — isolates the blocking `BRPOP` call from the API's normal Redis usage.
- **Webhook idempotency** — persisted `eventId`s prevent duplicate webhook deliveries from double-confirming a booking.
- **Mock payment service** — used in place of a real provider since the focus is on backend architecture, async processing, and webhook handling.
- **No Docker** — the app is deployed as a single Node.js Web Service on Render, with Redis and PostgreSQL as separate managed services; this was intentionally kept out of scope for the assignment.

---

## Error Handling

The API returns appropriate HTTP status codes for:

- Invalid authentication / invalid credentials
- Missing request fields
- Duplicate email registration
- Invalid diagnostic centre / test, or a test-centre mismatch
- Missing booking, or an invalid booking state transition
- Invalid or duplicate webhook payloads
- Database or payment processing failures

---

## Future Improvements

The current implementation is intentionally scoped to the assignment requirements. Potential production improvements:

- `FAILED` booking state with payment failure/retry handling
- Transactional Outbox pattern for reliable DB → Redis event publishing
- Redis retry queue and dead-letter queue
- Rate limiting
- Request validation with Zod
- Structured logging and distributed tracing
- Automated test coverage
- Separate worker deployment
- Real payment gateway integration
- Refresh-token based authentication
- API versioning
- Containerized (Docker) local/dev setup

---

## Author

**Rishabh**
Backend-focused Software Developer — Node.js · TypeScript · PostgreSQL · Redis · Distributed Systems