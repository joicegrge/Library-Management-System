package api

import (
	"encoding/json"
	"errors"
	"io"
	"log"
	"net/http"
	"strconv"
	"strings"

	"joice-library/backend/internal/library"
)

type Handler struct {
	service *library.Service
	mux     *http.ServeMux
}

func NewHandler(service *library.Service) http.Handler {
	h := &Handler{service: service, mux: http.NewServeMux()}
	h.routes()
	return h.cors(h.recover(h.mux))
}
func (h *Handler) routes() {
	h.mux.HandleFunc("GET /api/v1/health", h.health)
	h.mux.HandleFunc("GET /api/v1/books", h.books)
	h.mux.HandleFunc("POST /api/v1/books", h.createBook)
	h.mux.HandleFunc("GET /api/v1/books/{id}", h.book)
	h.mux.HandleFunc("PUT /api/v1/books/{id}", h.updateBook)
	h.mux.HandleFunc("DELETE /api/v1/books/{id}", h.deleteBook)
	h.mux.HandleFunc("GET /api/v1/members", h.members)
	h.mux.HandleFunc("POST /api/v1/members", h.createMember)
	h.mux.HandleFunc("GET /api/v1/members/{id}", h.member)
	h.mux.HandleFunc("PUT /api/v1/members/{id}", h.updateMember)
	h.mux.HandleFunc("DELETE /api/v1/members/{id}", h.deleteMember)
	h.mux.HandleFunc("GET /api/v1/loans", h.loans)
	h.mux.HandleFunc("POST /api/v1/loans", h.issue)
	h.mux.HandleFunc("POST /api/v1/loans/{id}/return", h.returnLoan)
	h.mux.HandleFunc("GET /api/v1/dashboard", h.dashboard)
}
func (h *Handler) health(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, 200, map[string]string{"status": "ok"})
}
func (h *Handler) books(w http.ResponseWriter, r *http.Request) {
	items, err := h.service.ListBooks(r.Context(), r.URL.Query().Get("search"), r.URL.Query().Get("category"), r.URL.Query().Get("status"), r.URL.Query().Get("sort"))
	respond(w, items, err)
}
func (h *Handler) book(w http.ResponseWriter, r *http.Request) {
	item, err := h.service.GetBook(r.Context(), r.PathValue("id"))
	respond(w, item, err)
}
func (h *Handler) createBook(w http.ResponseWriter, r *http.Request) {
	var in library.BookInput
	if err := decode(r, &in); err != nil {
		writeError(w, 400, err.Error())
		return
	}
	item, err := h.service.SaveBook(r.Context(), "", in)
	if err != nil {
		respond(w, nil, err)
		return
	}
	writeJSON(w, 201, item)
}
func (h *Handler) updateBook(w http.ResponseWriter, r *http.Request) {
	var in library.BookInput
	if err := decode(r, &in); err != nil {
		writeError(w, 400, err.Error())
		return
	}
	item, err := h.service.SaveBook(r.Context(), r.PathValue("id"), in)
	respond(w, item, err)
}
func (h *Handler) deleteBook(w http.ResponseWriter, r *http.Request) {
	err := h.service.DeleteBook(r.Context(), r.PathValue("id"))
	if err != nil {
		respond(w, nil, err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}
func (h *Handler) members(w http.ResponseWriter, r *http.Request) {
	items, err := h.service.ListMembers(r.Context(), r.URL.Query().Get("search"), r.URL.Query().Get("membership"))
	respond(w, items, err)
}
func (h *Handler) member(w http.ResponseWriter, r *http.Request) {
	item, err := h.service.GetMember(r.Context(), r.PathValue("id"))
	respond(w, item, err)
}
func (h *Handler) createMember(w http.ResponseWriter, r *http.Request) {
	var in library.MemberInput
	if err := decode(r, &in); err != nil {
		writeError(w, 400, err.Error())
		return
	}
	item, err := h.service.SaveMember(r.Context(), "", in)
	if err != nil {
		respond(w, nil, err)
		return
	}
	writeJSON(w, 201, item)
}
func (h *Handler) updateMember(w http.ResponseWriter, r *http.Request) {
	var in library.MemberInput
	if err := decode(r, &in); err != nil {
		writeError(w, 400, err.Error())
		return
	}
	item, err := h.service.SaveMember(r.Context(), r.PathValue("id"), in)
	respond(w, item, err)
}
func (h *Handler) deleteMember(w http.ResponseWriter, r *http.Request) {
	err := h.service.DeleteMember(r.Context(), r.PathValue("id"))
	if err != nil {
		respond(w, nil, err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}
func (h *Handler) loans(w http.ResponseWriter, r *http.Request) {
	status := r.URL.Query().Get("status")
	if status == "" {
		status = "all"
	}
	items, err := h.service.ListLoans(r.Context(), status)
	respond(w, items, err)
}
func (h *Handler) issue(w http.ResponseWriter, r *http.Request) {
	var in library.IssueInput
	if err := decode(r, &in); err != nil {
		writeError(w, 400, err.Error())
		return
	}
	id, err := h.service.Issue(r.Context(), in)
	if err != nil {
		respond(w, nil, err)
		return
	}
	writeJSON(w, 201, map[string]string{"id": strconv.FormatInt(id, 10), "message": "Book issued"})
}
func (h *Handler) returnLoan(w http.ResponseWriter, r *http.Request) {
	if err := h.service.Return(r.Context(), r.PathValue("id")); err != nil {
		respond(w, nil, err)
		return
	}
	writeJSON(w, 200, map[string]string{"message": "Book returned"})
}
func (h *Handler) dashboard(w http.ResponseWriter, r *http.Request) {
	items, err := h.service.Dashboard(r.Context())
	respond(w, items, err)
}

func decode(r *http.Request, dst any) error {
	defer r.Body.Close()
	decoder := json.NewDecoder(io.LimitReader(r.Body, 1<<20))
	decoder.DisallowUnknownFields()
	return decoder.Decode(dst)
}
func respond(w http.ResponseWriter, data any, err error) {
	if err != nil {
		status := 500
		switch {
		case errors.Is(err, library.ErrNotFound):
			status = 404
		case errors.Is(err, library.ErrConflict), errors.Is(err, library.ErrArchivedMember), errors.Is(err, library.ErrArchivedPhone), errors.Is(err, library.ErrDuplicateBook), errors.Is(err, library.ErrDuplicateTitle), errors.Is(err, library.ErrUnavailable):
			status = 409
		case strings.Contains(err.Error(), "required"), strings.Contains(err.Error(), "invalid"), strings.Contains(err.Error(), "ISBN is"), strings.Contains(err.Error(), "must be"), strings.Contains(err.Error(), "valid phone"):
			status = 400
		case strings.Contains(err.Error(), "active loans"):
			status = 409
		}
		writeError(w, status, err.Error())
		return
	}
	writeJSON(w, 200, data)
}
func writeError(w http.ResponseWriter, status int, message string) {
	writeJSON(w, status, map[string]string{"error": message})
}
func writeJSON(w http.ResponseWriter, status int, data any) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(status)
	if err := json.NewEncoder(w).Encode(data); err != nil {
		log.Printf("write response: %v", err)
	}
}
func (h *Handler) cors(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "http://localhost:4200")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		next.ServeHTTP(w, r)
	})
}
func (h *Handler) recover(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		defer func() {
			if err := recover(); err != nil {
				log.Printf("panic handling %s %s: %v", r.Method, r.URL.Path, err)
				writeError(w, 500, "internal server error")
			}
		}()
		next.ServeHTTP(w, r)
	})
}
