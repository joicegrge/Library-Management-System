package main

import (
	"context"
	"database/sql"
	"log"
	"net/http"
	"os"
	"time"

	_ "github.com/go-sql-driver/mysql"
	"joice-library/backend/internal/api"
	"joice-library/backend/internal/library"
)

func main() {
	dsn := os.Getenv("MYSQL_DSN")
	if dsn == "" {
		log.Fatal("MYSQL_DSN is required; see backend/.env.example")
	}
	db, err := sql.Open("mysql", dsn)
	if err != nil {
		log.Fatalf("open MySQL: %v", err)
	}
	db.SetMaxOpenConns(15)
	db.SetMaxIdleConns(5)
	db.SetConnMaxLifetime(5 * time.Minute)
	defer db.Close()
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	if err := db.PingContext(ctx); err != nil {
		log.Fatalf("connect to MySQL: %v", err)
	}

	service := library.NewService(db)
	server := &http.Server{Addr: envOr("API_ADDR", ":8080"), Handler: api.NewHandler(service), ReadHeaderTimeout: 5 * time.Second}
	log.Printf("Joice Library API listening on %s", server.Addr)
	log.Fatal(server.ListenAndServe())
}

func envOr(key, fallback string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return fallback
}
