# Joice Library API

Go REST API for the Angular frontend. It connects to the existing MySQL/MariaDB `library_management` database. The API expects the `books`, `members`, and `loans` tables described in the project README and returns IDs as strings for the Angular models.

## Run

1. Set `MYSQL_DSN` for a MySQL account that can access `library_management` (the `.env.example` file shows the format; Go does not load `.env` files automatically).
2. In PowerShell, from `backend`, set the variable and run the API:

```powershell
$env:MYSQL_DSN = "library_app:your_password@tcp(127.0.0.1:3306)/library_management?parseTime=true&charset=utf8mb4"
go mod tidy
go run ./cmd/server
```

The API listens on `http://localhost:8080`. The Angular dev server proxies `/api` to it. Before starting the updated API, run `migrations/002_member_soft_delete.sql` once in phpMyAdmin against `library_management`; it adds the soft-delete flag used to remove members from the directory while retaining loan history. To insert two optional sample books, run `backend/seed.sql` there as well.

## Endpoints

- `GET /api/v1/health`
- `GET/POST /api/v1/books`; `GET/PUT/DELETE /api/v1/books/{id}`
- `GET/POST /api/v1/members`; `GET/PUT/DELETE /api/v1/members/{id}`
- `GET /api/v1/loans?status=all|active|returned|overdue`
- `POST /api/v1/loans` to issue a book; `POST /api/v1/loans/{id}/return` to return it
- `GET /api/v1/dashboard`

Issue operations lock the selected book row in a transaction to prevent duplicate active loans. Deleting an item with an active loan is rejected.
