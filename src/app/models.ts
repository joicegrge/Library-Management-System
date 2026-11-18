export type BookStatus = 'available' | 'issued';
export interface Book {
  id: string;
  title: string;
  author: string;
  category: string;
  isbn: string;
  description: string;
  status: BookStatus;
  cover: string;
  color: string;
  addedAt: string;
}
export interface Member {
  id: string;
  name: string;
  email: string;
  phone: string;
  membership: 'Standard' | 'Premium' | 'Student';
  joinedAt: string;
  avatar: string;
  isDeleted?: boolean;
}
export interface Loan {
  id: string;
  bookId: string;
  memberId: string;
  issueDate: string;
  dueDate: string;
  returnDate: string | null;
}
export interface LibraryState { books: Book[]; members: Member[]; loans: Loan[] }
export interface DashboardStats { totalBooks: number; totalMembers: number; issuedBooks: number; overdueBooks: number; availableBooks: number; returnedThisMonth: number; dueSoon: number }
export type ToastKind = 'success' | 'error' | 'info';
export interface ToastMessage { id: number; message: string; kind: ToastKind }
