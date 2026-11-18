package library

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"net/mail"
	"net/url"
	"regexp"
	"strconv"
	"strings"
	"time"
)

var ErrNotFound = errors.New("record not found")
var ErrConflict = errors.New("record conflicts with existing data")
var ErrArchivedMember = errors.New("a previously removed member with this email was found; duplicate members cannot be created")
var ErrArchivedPhone = errors.New("a previously removed member with this phone number was found; duplicate members cannot be created")
var ErrDuplicateBook = errors.New("a book with this ISBN already exists; duplicate books cannot be added")
var ErrDuplicateTitle = errors.New("a book with this title and author already exists; duplicate books cannot be added")
var ErrUnavailable = errors.New("book is not available")

type Service struct{ db *sql.DB }

func NewService(db *sql.DB) *Service { return &Service{db: db} }

func parseID(id string) (int64, error) {
	n, err := strconv.ParseInt(id, 10, 64)
	if err != nil || n < 1 {
		return 0, fmt.Errorf("invalid ID")
	}
	return n, nil
}

func (s *Service) ListBooks(ctx context.Context, search, category, status, sortBy string) ([]Book, error) {
	query := `SELECT b.id,b.title,b.author,b.category,b.isbn,COALESCE(b.description,''),COALESCE(b.cover_url,''),'' AS color,
CASE WHEN EXISTS (SELECT 1 FROM loans l WHERE l.book_id=b.id AND l.return_date IS NULL) THEN 'issued' ELSE 'available' END,
DATE_FORMAT(b.created_at,'%Y-%m-%d') FROM books b WHERE (?='' OR b.title LIKE ? OR b.author LIKE ? OR b.isbn LIKE ?) AND (?='' OR b.category=?) AND (?='' OR ?='all' OR (?='available' AND NOT EXISTS (SELECT 1 FROM loans la WHERE la.book_id=b.id AND la.return_date IS NULL)) OR (?='issued' AND EXISTS (SELECT 1 FROM loans li WHERE li.book_id=b.id AND li.return_date IS NULL)))`
	order := map[string]string{"title": "b.title ASC", "author": "b.author ASC", "category": "b.category ASC", "recent": "b.created_at DESC"}[sortBy]
	if order == "" {
		order = "b.created_at DESC"
	}
	query += " ORDER BY " + order
	like := "%" + search + "%"
	rows, err := s.db.QueryContext(ctx, query, search, like, like, like, category, category, status, status, status, status)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	books := []Book{}
	for rows.Next() {
		var b Book
		if err := rows.Scan(&b.ID, &b.Title, &b.Author, &b.Category, &b.ISBN, &b.Description, &b.Cover, &b.Color, &b.Status, &b.AddedAt); err != nil {
			return nil, err
		}
		books = append(books, b)
	}
	return books, rows.Err()
}

func (s *Service) GetBook(ctx context.Context, id string) (Book, error) {
	n, err := parseID(id)
	if err != nil {
		return Book{}, err
	}
	var b Book
	err = s.db.QueryRowContext(ctx, `SELECT b.id,b.title,b.author,b.category,b.isbn,COALESCE(b.description,''),COALESCE(b.cover_url,''),'' ,CASE WHEN EXISTS(SELECT 1 FROM loans l WHERE l.book_id=b.id AND l.return_date IS NULL) THEN 'issued' ELSE 'available' END,DATE_FORMAT(b.created_at,'%Y-%m-%d') FROM books b WHERE b.id=?`, n).Scan(&b.ID, &b.Title, &b.Author, &b.Category, &b.ISBN, &b.Description, &b.Cover, &b.Color, &b.Status, &b.AddedAt)
	if errors.Is(err, sql.ErrNoRows) {
		return Book{}, ErrNotFound
	}
	return b, err
}

func (s *Service) SaveBook(ctx context.Context, id string, in BookInput) (Book, error) {
	in.Title = strings.TrimSpace(in.Title)
	in.Author = strings.TrimSpace(in.Author)
	in.Category = strings.TrimSpace(in.Category)
	in.ISBN = strings.TrimSpace(in.ISBN)
	if in.Title == "" || in.Author == "" || in.Category == "" || in.ISBN == "" {
		return Book{}, fmt.Errorf("title, author, category and ISBN are required")
	}
	if in.Cover != "" {
		coverURL, err := url.ParseRequestURI(in.Cover)
		if err != nil || (coverURL.Scheme != "http" && coverURL.Scheme != "https") || coverURL.Host == "" {
			return Book{}, fmt.Errorf("cover must be a valid HTTP or HTTPS URL")
		}
	}
	isbnDigits := strings.ToUpper(regexp.MustCompile(`[-\s]`).ReplaceAllString(in.ISBN, ""))
	if !regexp.MustCompile(`^([0-9]{9}[0-9X]|[0-9]{13})$`).MatchString(isbnDigits) {
		return Book{}, fmt.Errorf("ISBN is invalid: use 10 or 13 digits (hyphens allowed)")
	}
	currentBookID := int64(0)
	if id != "" {
		parsed, err := parseID(id)
		if err != nil {
			return Book{}, err
		}
		currentBookID = parsed
	}
	var dupID int64
	err := s.db.QueryRowContext(ctx, `SELECT id FROM books WHERE UPPER(REPLACE(REPLACE(isbn,'-',''),' ',''))=? AND id<>? LIMIT 1`, isbnDigits, currentBookID).Scan(&dupID)
	if err == nil {
		return Book{}, ErrDuplicateBook
	} else if !errors.Is(err, sql.ErrNoRows) {
		return Book{}, err
	}
	err = s.db.QueryRowContext(ctx, `SELECT id FROM books WHERE LOWER(title)=LOWER(?) AND LOWER(author)=LOWER(?) AND id<>? LIMIT 1`, in.Title, in.Author, currentBookID).Scan(&dupID)
	if err == nil {
		return Book{}, ErrDuplicateTitle
	} else if !errors.Is(err, sql.ErrNoRows) {
		return Book{}, err
	}
	if id == "" {
		result, err := s.db.ExecContext(ctx, `INSERT INTO books(title,author,category,isbn,description,cover_url) VALUES(?,?,?,?,?,?)`, in.Title, in.Author, in.Category, in.ISBN, in.Description, in.Cover)
		if err != nil {
			return Book{}, mapDBError(err)
		}
		n, _ := result.LastInsertId()
		return s.GetBook(ctx, strconv.FormatInt(n, 10))
	}
	n, err := parseID(id)
	if err != nil {
		return Book{}, err
	}
	result, err := s.db.ExecContext(ctx, `UPDATE books SET title=?,author=?,category=?,isbn=?,description=?,cover_url=? WHERE id=?`, in.Title, in.Author, in.Category, in.ISBN, in.Description, in.Cover, n)
	if err != nil {
		return Book{}, mapDBError(err)
	}
	count, _ := result.RowsAffected()
	if count == 0 {
		if _, err = s.GetBook(ctx, id); err != nil {
			return Book{}, err
		}
	}
	return s.GetBook(ctx, id)
}

func (s *Service) DeleteBook(ctx context.Context, id string) error {
	n, err := parseID(id)
	if err != nil {
		return err
	}
	result, err := s.db.ExecContext(ctx, `DELETE FROM books WHERE id=? AND NOT EXISTS(SELECT 1 FROM loans WHERE loans.book_id=books.id AND return_date IS NULL)`, n)
	if err != nil {
		return mapDBError(err)
	}
	count, _ := result.RowsAffected()
	if count == 0 {
		if _, e := s.GetBook(ctx, id); errors.Is(e, ErrNotFound) {
			return ErrNotFound
		}
		return fmt.Errorf("cannot delete a book with an active loan")
	}
	return nil
}

func (s *Service) ListMembers(ctx context.Context, search, membership string) ([]Member, error) {
	rows, err := s.db.QueryContext(ctx, `SELECT id,name,email,phone,membership_type,DATE_FORMAT(joined_at,'%Y-%m-%d'),is_deleted FROM members WHERE (?='' OR name LIKE ? OR email LIKE ? OR phone LIKE ?) AND (?='' OR membership_type=?) ORDER BY is_deleted,joined_at DESC`, search, "%"+search+"%", "%"+search+"%", "%"+search+"%", membership, membership)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := []Member{}
	for rows.Next() {
		var m Member
		if err := rows.Scan(&m.ID, &m.Name, &m.Email, &m.Phone, &m.Membership, &m.JoinedAt, &m.IsDeleted); err != nil {
			return nil, err
		}
		m.Avatar = initials(m.Name)
		out = append(out, m)
	}
	return out, rows.Err()
}
func initials(name string) string {
	parts := strings.Fields(name)
	if len(parts) == 0 {
		return ""
	}
	out := []byte{parts[0][0]}
	if len(parts) > 1 {
		out = append(out, parts[len(parts)-1][0])
	}
	return strings.ToUpper(string(out))
}
func (s *Service) GetMember(ctx context.Context, id string) (Member, error) {
	n, err := parseID(id)
	if err != nil {
		return Member{}, err
	}
	var m Member
	err = s.db.QueryRowContext(ctx, `SELECT id,name,email,phone,membership_type,DATE_FORMAT(joined_at,'%Y-%m-%d'),is_deleted FROM members WHERE id=?`, n).Scan(&m.ID, &m.Name, &m.Email, &m.Phone, &m.Membership, &m.JoinedAt, &m.IsDeleted)
	if errors.Is(err, sql.ErrNoRows) {
		return Member{}, ErrNotFound
	}
	m.Avatar = initials(m.Name)
	return m, err
}

func (s *Service) ensureMemberEmailAvailable(ctx context.Context, email, currentID string) error {
	var existingID string
	var isDeleted bool
	err := s.db.QueryRowContext(ctx, `SELECT id,is_deleted FROM members WHERE email=? LIMIT 1`, email).Scan(&existingID, &isDeleted)
	if errors.Is(err, sql.ErrNoRows) {
		return nil
	}
	if err != nil {
		return err
	}
	if existingID == currentID {
		return nil
	}
	if isDeleted {
		return ErrArchivedMember
	}
	return ErrConflict
}

func (s *Service) ensureMemberPhoneAvailable(ctx context.Context, phone, currentID string) error {
	var existingID string
	var isDeleted bool
	err := s.db.QueryRowContext(ctx, `SELECT id,is_deleted FROM members WHERE phone=? ORDER BY is_deleted LIMIT 1`, phone).Scan(&existingID, &isDeleted)
	if errors.Is(err, sql.ErrNoRows) {
		return nil
	}
	if err != nil {
		return err
	}
	if existingID == currentID {
		return nil
	}
	if isDeleted {
		return ErrArchivedPhone
	}
	return ErrConflict
}

func (s *Service) SaveMember(ctx context.Context, id string, in MemberInput) (Member, error) {
	in.Name = strings.TrimSpace(in.Name)
	in.Email = strings.ToLower(strings.TrimSpace(in.Email))
	in.Phone = strings.TrimSpace(in.Phone)
	if in.Name == "" || in.Email == "" || in.Phone == "" {
		return Member{}, fmt.Errorf("name, email and phone are required")
	}
	address, err := mail.ParseAddress(in.Email)
	if err != nil || address.Address != in.Email {
		return Member{}, fmt.Errorf("email must be a valid email address")
	}
	phoneDigits := regexp.MustCompile(`[0-9]`).FindAllString(in.Phone, -1)
	if !regexp.MustCompile(`^\+?[0-9][0-9\s().-]*$`).MatchString(in.Phone) || len(phoneDigits) < 7 || len(phoneDigits) > 15 {
		return Member{}, fmt.Errorf("phone must be a valid phone number with 7 to 15 digits")
	}
	if in.Membership != "Standard" && in.Membership != "Premium" && in.Membership != "Student" {
		return Member{}, fmt.Errorf("membership must be Standard, Premium or Student")
	}
	currentID := ""
	if id != "" {
		parsedID, err := parseID(id)
		if err != nil {
			return Member{}, err
		}
		currentID = strconv.FormatInt(parsedID, 10)
	}
	if err := s.ensureMemberEmailAvailable(ctx, in.Email, currentID); err != nil {
		return Member{}, err
	}
	if err := s.ensureMemberPhoneAvailable(ctx, in.Phone, currentID); err != nil {
		return Member{}, err
	}
	if id == "" {
		res, err := s.db.ExecContext(ctx, `INSERT INTO members(name,email,phone,membership_type) VALUES(?,?,?,?)`, in.Name, in.Email, in.Phone, in.Membership)
		if err != nil {
			return Member{}, mapDBError(err)
		}
		n, _ := res.LastInsertId()
		return s.GetMember(ctx, strconv.FormatInt(n, 10))
	}
	n, err := parseID(id)
	if err != nil {
		return Member{}, err
	}
	res, err := s.db.ExecContext(ctx, `UPDATE members SET name=?,email=?,phone=?,membership_type=? WHERE id=? AND is_deleted=0`, in.Name, in.Email, in.Phone, in.Membership, n)
	if err != nil {
		return Member{}, mapDBError(err)
	}
	rows, _ := res.RowsAffected()
	if rows == 0 {
		member, e := s.GetMember(ctx, id)
		if e != nil {
			return Member{}, e
		}
		if member.IsDeleted {
			return Member{}, ErrNotFound
		}
	}
	return s.GetMember(ctx, id)
}
func (s *Service) DeleteMember(ctx context.Context, id string) error {
	n, err := parseID(id)
	if err != nil {
		return err
	}
	res, err := s.db.ExecContext(ctx, `UPDATE members SET is_deleted=1 WHERE id=? AND is_deleted=0 AND NOT EXISTS(SELECT 1 FROM loans WHERE loans.member_id=members.id AND return_date IS NULL)`, n)
	if err != nil {
		return mapDBError(err)
	}
	rows, _ := res.RowsAffected()
	if rows == 0 {
		member, e := s.GetMember(ctx, id)
		if errors.Is(e, ErrNotFound) || (e == nil && member.IsDeleted) {
			return ErrNotFound
		}
		return fmt.Errorf("return this member's active loans before removing them")
	}
	return nil
}

func (s *Service) ListLoans(ctx context.Context, status string) ([]Loan, error) {
	query := `SELECT id,book_id,member_id,DATE_FORMAT(issue_date,'%Y-%m-%d'),DATE_FORMAT(due_date,'%Y-%m-%d'),DATE_FORMAT(return_date,'%Y-%m-%d') FROM loans WHERE (?='all' OR (?='active' AND return_date IS NULL) OR (?='returned' AND return_date IS NOT NULL) OR (?='overdue' AND return_date IS NULL AND due_date<CURDATE())) ORDER BY return_date IS NOT NULL,due_date`
	rows, err := s.db.QueryContext(ctx, query, status, status, status, status)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := []Loan{}
	for rows.Next() {
		var l Loan
		var ret sql.NullString
		if err := rows.Scan(&l.ID, &l.BookID, &l.MemberID, &l.IssueDate, &l.DueDate, &ret); err != nil {
			return nil, err
		}
		if ret.Valid {
			l.ReturnDate = &ret.String
		}
		out = append(out, l)
	}
	return out, rows.Err()
}

func (s *Service) Issue(ctx context.Context, in IssueInput) (int64, error) {
	bookID, err := parseID(in.BookID)
	if err != nil {
		return 0, fmt.Errorf("invalid book ID")
	}
	memberID, err := parseID(in.MemberID)
	if err != nil {
		return 0, fmt.Errorf("invalid member ID")
	}
	issue, err := time.Parse("2006-01-02", in.IssueDate)
	if err != nil {
		return 0, fmt.Errorf("invalid issue date")
	}
	due, err := time.Parse("2006-01-02", in.DueDate)
	if err != nil || !due.After(issue) {
		return 0, fmt.Errorf("due date must be after issue date")
	}
	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return 0, err
	}
	defer tx.Rollback()
	var id int64
	if err = tx.QueryRowContext(ctx, `SELECT id FROM books WHERE id=? FOR UPDATE`, bookID).Scan(&id); errors.Is(err, sql.ErrNoRows) {
		return 0, ErrNotFound
	}
	if err != nil {
		return 0, err
	}
	var count int
	if err = tx.QueryRowContext(ctx, `SELECT COUNT(*) FROM loans WHERE book_id=? AND return_date IS NULL`, bookID).Scan(&count); err != nil {
		return 0, err
	}
	if count > 0 {
		return 0, ErrUnavailable
	}
	if err = tx.QueryRowContext(ctx, `SELECT id FROM members WHERE id=?`, memberID).Scan(&id); errors.Is(err, sql.ErrNoRows) {
		return 0, ErrNotFound
	}
	if err != nil {
		return 0, err
	}
	result, err := tx.ExecContext(ctx, `INSERT INTO loans(book_id,member_id,issue_date,due_date) VALUES(?,?,?,?)`, bookID, memberID, issue, due)
	if err != nil {
		return 0, mapDBError(err)
	}
	loanID, _ := result.LastInsertId()
	if err = tx.Commit(); err != nil {
		return 0, err
	}
	return loanID, nil
}

func (s *Service) Return(ctx context.Context, id string) error {
	loanID, err := parseID(id)
	if err != nil {
		return err
	}
	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	defer tx.Rollback()
	res, err := tx.ExecContext(ctx, `UPDATE loans SET return_date=CURDATE() WHERE id=? AND return_date IS NULL`, loanID)
	if err != nil {
		return err
	}
	n, _ := res.RowsAffected()
	if n == 0 {
		return ErrNotFound
	}
	return tx.Commit()
}

func (s *Service) Dashboard(ctx context.Context) (DashboardStats, error) {
	var d DashboardStats
	err := s.db.QueryRowContext(ctx, `SELECT (SELECT COUNT(*) FROM books),(SELECT COUNT(*) FROM members),(SELECT COUNT(*) FROM loans WHERE return_date IS NULL),(SELECT COUNT(*) FROM loans WHERE return_date IS NULL AND due_date<CURDATE()),(SELECT COUNT(*) FROM books b WHERE NOT EXISTS(SELECT 1 FROM loans l WHERE l.book_id=b.id AND l.return_date IS NULL)),(SELECT COUNT(*) FROM loans WHERE return_date IS NOT NULL AND YEAR(return_date)=YEAR(CURDATE()) AND MONTH(return_date)=MONTH(CURDATE())),(SELECT COUNT(*) FROM loans WHERE return_date IS NULL AND due_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(),INTERVAL 3 DAY))`).Scan(&d.TotalBooks, &d.TotalMembers, &d.IssuedBooks, &d.OverdueBooks, &d.AvailableBooks, &d.ReturnedThisMonth, &d.DueSoon)
	return d, err
}

func mapDBError(err error) error {
	if err == nil {
		return nil
	}
	text := strings.ToLower(err.Error())
	if strings.Contains(text, "duplicate entry") {
		return ErrConflict
	}
	if strings.Contains(text, "foreign key constraint fails") {
		return fmt.Errorf("record has borrowing history and cannot be deleted")
	}
	return err
}
