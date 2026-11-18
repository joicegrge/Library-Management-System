# Library Management System

A full-stack library management application for maintaining a book collection, registering members, managing loans and returns, and viewing borrowing history. The project contains an Angular web application and a Go REST API backed by MySQL/MariaDB. The frontend can also run by itself using browser Local Storage when the API is unavailable.

## Features

- Dashboard totals for books, members, books currently on loan, overdue books, and upcoming due dates.
- Book management: add, edit, delete, view, search, filter by genre or availability, and sort.
- Member management: register, edit, view, search, filter, and remove members; keep contact and membership details.
- Loan management: issue available books, record issue and due dates, return books, and identify overdue loans.
- Book and member detail pages with borrowing histories.
- Form validation, duplicate checks, and success/error feedback.
- Persistent data through MySQL/MariaDB when the Go API is running, with Local Storage fallback in the browser.
- Responsive Angular interface and reusable UI components.
- Go API uses transactions and locks the selected book while issuing it, preventing concurrent active loans for that book.

## Technologies

- **Frontend:** Angular 21, TypeScript, HTML, SCSS, Angular Router, Angular Forms, RxJS.
- **Backend:** Go 1.23, `net/http`, `database/sql`, Go modules.
- **Database:** MySQL or MariaDB.
- **Database driver:** `github.com/go-sql-driver/mysql`.

## Repository structure

```text
src/                         Angular application
  app/pages/                 Dashboard, books, members, loans, and detail pages
  app/library.service.ts     Frontend state, business rules, persistence, and API calls
  app/shared/                Reusable UI components
backend/
  cmd/server/                Go API entry point
  internal/api/              HTTP routes, handlers, and responses
  internal/library/          Models and library business logic
  migrations/                Database migration scripts
  seed.sql                   Optional sample book records
```

## Requirements

- Node.js and npm (use a version compatible with Angular 21).
- Go 1.23 or newer.
- MySQL or MariaDB, with a database named `library_management` and the required `books`, `members`, and `loans` tables.

The API expects the database tables to exist; this repository does not include a complete initial schema migration. The member soft-delete migration is provided at `backend/migrations/002_member_soft_delete.sql` and should be applied once to an existing database before using member removal with the updated API.

## Setup and run

### 1. Configure the database

Create/configure the MySQL or MariaDB database and tables for this application. Confirm the username, password, host, and port you will use. The examples below use a local MySQL server on port `3306`, database `library_management`, and the `root` account with an empty password; replace these credentials if your local setup differs.

### 2. Start the Go API (PowerShell)

Open PowerShell in the `backend` directory and run:

```powershell
$env:MYSQL_DSN = "root:@tcp(127.0.0.1:3306)/library_management?parseTime=true&charset=utf8mb4" (if your mysql has no password)
                                or
$env:MYSQL_DSN = "root:'your_password''@tcp(127.0.0.1:3306)/library_management?parseTime=true&charset=utf8mb4" (if your mysql has  password)

go run ./cmd/server

if your mysql have no issue then direct command for backend

go run .
```

`MYSQL_DSN` is required because the Go server reads its database connection settings from that environment variable and exits with an error if it is missing. PowerShell's `$env:MYSQL_DSN = ...` sets it for the current terminal session so `go run` can pass the database configuration to the server. The value means: connect as MySQL user `root` with a blank password, to `127.0.0.1:3306`, and use the `library_management` database. `parseTime=true` enables MySQL date/time parsing, and `charset=utf8mb4` supports full Unicode text. Keep the API running in this terminal; the API listens at `http://localhost:8080` by default.

This command addresses the startup error caused by an unset `MYSQL_DSN`. MySQL must also be running, the credentials/database must be valid, and the expected tables must exist. The environment variable lasts only for that PowerShell session; set it again in a new terminal. Go does not automatically load `.env` files.

Before using the updated API against an existing database, apply `backend/migrations/002_member_soft_delete.sql` once to add member soft-delete support. Optional sample books can be inserted by running `backend/seed.sql` against the same database.

### 3. Start the Angular frontend

Open a second terminal in the repository root and run:

```bash
npm install
npm start
```

Open the local URL printed by Angular CLI (normally [http://localhost:4200](http://localhost:4200)). The Angular development server proxies `/api` requests to `http://localhost:8080`. When the API is available, the app loads and saves books, members, and loans through Go; when it is unavailable, the app uses Local Storage so the interface remains usable.

To run only the frontend, use the same `npm install` and `npm start` commands. Browser data is saved under the Local Storage key `folio-library-v1`.

## API endpoints

- `GET /api/v1/health`
- `GET /api/v1/books` (supports `search`, `category`, `status`, and `sort` query parameters)
- `POST /api/v1/books`
- `GET`, `PUT`, and `DELETE /api/v1/books/{id}`
- `GET /api/v1/members` (supports `search` and `membership` query parameters)
- `POST /api/v1/members`
- `GET`, `PUT`, and `DELETE /api/v1/members/{id}`
- `GET /api/v1/loans?status=all|active|returned|overdue`
- `POST /api/v1/loans` to issue a book
- `POST /api/v1/loans/{id}/return` to process a return
- `GET /api/v1/dashboard`

## Development notes

- Go API setup and endpoint details are also documented in [backend/README.md](backend/README.md).
- Clear `folio-library-v1` from browser Local Storage to reset locally stored demo data.
- Book cover images use remote URLs; the frontend shows a fallback cover if an image cannot load.
- Do not use the example blank-password database connection on a shared or production database. Use credentials appropriate for that environment.

## ScreenShots

## Dashboard - light mode

<img width="1600" height="770" alt="WhatsApp Image 2026-11-18 at 5 12 19 PM" src="https://github.com/user-attachments/assets/4dc7359f-c70c-4704-9e78-8c9b9d58d347" />

## Dashboard - Dark mode


<img width="1600" height="768" alt="WhatsApp Image 2026-11-18 at 5 09 46 PM" src="https://github.com/user-attachments/assets/cf0c4a57-07a9-4d50-81f4-41116e63fafd" />

## Add Book

<img width="1600" height="764" alt="WhatsApp Image 2026-11-18 at 5 10 00 PM" src="https://github.com/user-attachments/assets/8a169aa4-beff-4f0b-bdf8-abe1868f359b" />

## Member Page

<img width="1600" height="767" alt="WhatsApp Image 2026-11-18 at 5 10 15 PM" src="https://github.com/user-attachments/assets/2a732edf-3bc2-48bb-b54e-c3cf70652cf2" />

## Add Member

<img width="1600" height="760" alt="WhatsApp Image 2026-11-18 at 5 10 27 PM" src="https://github.com/user-attachments/assets/120a1eaf-31ca-45e5-a01e-e166bd85e506" />

## Loan Page

<img width="1600" height="758" alt="WhatsApp Image 2026-11-18 at 5 10 43 PM" src="https://github.com/user-attachments/assets/7b172459-c86f-44d7-a6fd-2d95fe3fdfcf" />

## Lent Book Page

<img width="1600" height="760" alt="WhatsApp Image 2026-11-18 at 5 10 58 PM" src="https://github.com/user-attachments/assets/71c47b05-fe43-4ac9-a5a2-933562ba289f" />

## Reading List

<img width="1600" height="763" alt="WhatsApp Image 2026-11-18 at 5 11 11 PM" src="https://github.com/user-attachments/assets/dc3be1cc-dd6b-4bb1-8884-9e842ad10235" />

## Recent Activity
<img width="1600" height="763" alt="WhatsApp Image 2026-11-18 at 5 11 38 PM" src="https://github.com/user-attachments/assets/3d882b0f-fdf8-48ea-bd77-72613f1302cf" />








