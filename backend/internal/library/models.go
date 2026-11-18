package library

type Book struct {
	ID          string `json:"id"`
	Title       string `json:"title"`
	Author      string `json:"author"`
	Category    string `json:"category"`
	ISBN        string `json:"isbn"`
	Description string `json:"description"`
	Cover       string `json:"cover"`
	Color       string `json:"color"`
	Status      string `json:"status"`
	AddedAt     string `json:"addedAt"`
}

type Member struct {
	ID         string `json:"id"`
	Name       string `json:"name"`
	Email      string `json:"email"`
	Phone      string `json:"phone"`
	Membership string `json:"membership"`
	JoinedAt   string `json:"joinedAt"`
	Avatar     string `json:"avatar"`
	IsDeleted  bool   `json:"isDeleted"`
}

type Loan struct {
	ID         string  `json:"id"`
	BookID     string  `json:"bookId"`
	MemberID   string  `json:"memberId"`
	IssueDate  string  `json:"issueDate"`
	DueDate    string  `json:"dueDate"`
	ReturnDate *string `json:"returnDate"`
}

type DashboardStats struct {
	TotalBooks        int `json:"totalBooks"`
	TotalMembers      int `json:"totalMembers"`
	IssuedBooks       int `json:"issuedBooks"`
	OverdueBooks      int `json:"overdueBooks"`
	AvailableBooks    int `json:"availableBooks"`
	ReturnedThisMonth int `json:"returnedThisMonth"`
	DueSoon           int `json:"dueSoon"`
}

type BookInput struct {
	Title       string `json:"title"`
	Author      string `json:"author"`
	Category    string `json:"category"`
	ISBN        string `json:"isbn"`
	Description string `json:"description"`
	Cover       string `json:"cover"`
	Color       string `json:"color"`
}

type MemberInput struct {
	Name       string `json:"name"`
	Email      string `json:"email"`
	Phone      string `json:"phone"`
	Membership string `json:"membership"`
}

type IssueInput struct {
	BookID    string `json:"bookId"`
	MemberID  string `json:"memberId"`
	IssueDate string `json:"issueDate"`
	DueDate   string `json:"dueDate"`
}
