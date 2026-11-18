import { Injectable, computed, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { forkJoin, switchMap } from 'rxjs';
import { Book, DashboardStats, LibraryState, Loan, Member, ToastKind } from './models';

const STORAGE_KEY = 'folio-library-v1';
const today = new Date();
const localDate = (date: Date): string => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
const dateOffset = (days: number): string => {
  const date = new Date(today);
  date.setDate(date.getDate() + days);
  return localDate(date);
};

function initialState(): LibraryState {
  const books: Book[] = [
    { id: 'b-001', title: 'The Creative Act', author: 'Rick Rubin', category: 'Creativity', isbn: '978-0593652886', description: 'A beautiful, generous course of study that illuminates the path of the artist as a road we can all follow.', status: 'available', cover: 'https://images-na.ssl-images-amazon.com/images/P/0593652886.01.L.jpg', color: '#b8c6b9', addedAt: dateOffset(-90) },
    { id: 'b-002', title: 'Tomorrow, and Tomorrow, and Tomorrow', author: 'Gabrielle Zevin', category: 'Fiction', isbn: '978-0593321201', description: 'A dazzling and intricately imagined novel about the magic of friendship and the electricity of art.', status: 'issued', cover: 'https://images-na.ssl-images-amazon.com/images/P/0593321200.01.L.jpg', color: '#e2bd9b', addedAt: dateOffset(-80) },
    { id: 'b-003', title: 'The Design of Everyday Things', author: 'Don Norman', category: 'Design', isbn: '978-0465050659', description: 'An approachable and engaging guide to human-centered design and the world around us.', status: 'available', cover: 'https://images-na.ssl-images-amazon.com/images/P/0465050654.01.L.jpg', color: '#d3d5df', addedAt: dateOffset(-72) },
    { id: 'b-004', title: 'Pachinko', author: 'Min Jin Lee', category: 'Fiction', isbn: '978-1455563937', description: 'An epic historical novel following four generations of a Korean family through war, migration, and identity.', status: 'available', cover: 'https://images-na.ssl-images-amazon.com/images/P/1455563935.01.L.jpg', color: '#c0aa89', addedAt: dateOffset(-64) },
    { id: 'b-005', title: 'Braiding Sweetgrass', author: 'Robin Wall Kimmerer', category: 'Nature', isbn: '978-1571313560', description: 'A moving celebration of the gifts of the earth and the reciprocal relationship between people and place.', status: 'issued', cover: 'https://images-na.ssl-images-amazon.com/images/P/1571313567.01.L.jpg', color: '#90a78f', addedAt: dateOffset(-50) },
    { id: 'b-006', title: 'The Lonely City', author: 'Olivia Laing', category: 'Essays', isbn: '978-1250039574', description: 'A vivid exploration of loneliness, art, and the ways we make meaning in a crowded world.', status: 'available', cover: 'https://images-na.ssl-images-amazon.com/images/P/1250039576.01.L.jpg', color: '#bdc5ca', addedAt: dateOffset(-43) },
    { id: 'b-007', title: 'Atomic Habits', author: 'James Clear', category: 'Self growth', isbn: '978-0735211292', description: 'A practical guide to getting one percent better every day through small, consistent habits.', status: 'available', cover: 'https://images-na.ssl-images-amazon.com/images/P/0735211299.01.L.jpg', color: '#d9a34e', addedAt: dateOffset(-35) },
    { id: 'b-008', title: 'The Midnight Library', author: 'Matt Haig', category: 'Fiction', isbn: '978-0525559474', description: 'A novel about all the choices that go into a life well lived, and the infinite possibilities of a single life.', status: 'issued', cover: 'https://images-na.ssl-images-amazon.com/images/P/0525559477.01.L.jpg', color: '#355262', addedAt: dateOffset(-29) },
    { id: 'b-009', title: 'Ways of Seeing', author: 'John Berger', category: 'Art', isbn: '978-0140135152', description: 'A landmark introduction to how we look at art, images, and the things around us.', status: 'available', cover: 'https://images-na.ssl-images-amazon.com/images/P/0140135154.01.L.jpg', color: '#b37c44', addedAt: dateOffset(-22) },
    { id: 'b-010', title: 'Maybe You Should Talk to Someone', author: 'Lori Gottlieb', category: 'Memoir', isbn: '978-1328662057', description: 'A therapist opens the door to her office and shows us that the work of being human is shared by all.', status: 'available', cover: 'https://images-na.ssl-images-amazon.com/images/P/1328662055.01.L.jpg', color: '#cedbb4', addedAt: dateOffset(-17) },
    { id: 'b-011', title: 'A Field Guide to Getting Lost', author: 'Rebecca Solnit', category: 'Essays', isbn: '978-0143037248', description: 'A lyrical meditation on uncertainty, trust, loss, memory, and the pleasures of wandering.', status: 'issued', cover: 'https://images-na.ssl-images-amazon.com/images/P/014303724X.01.L.jpg', color: '#b9ced0', addedAt: dateOffset(-11) },
    { id: 'b-012', title: 'Show Your Work!', author: 'Austin Kleon', category: 'Creativity', isbn: '978-0761178972', description: 'A compact guide to sharing your process and inviting others into your creative journey.', status: 'available', cover: 'https://images-na.ssl-images-amazon.com/images/P/076117897X.01.L.jpg', color: '#ee9b63', addedAt: dateOffset(-6) }
  ];
  const members: Member[] = [
    { id: 'm-001', name: 'Amelia Watson', email: 'amelia.watson@email.com', phone: '+1 (415) 555-0132', membership: 'Premium', joinedAt: dateOffset(-180), avatar: 'AW' },
    { id: 'm-002', name: 'James Kim', email: 'james.kim@email.com', phone: '+1 (415) 555-0186', membership: 'Standard', joinedAt: dateOffset(-145), avatar: 'JK' },
    { id: 'm-003', name: 'Sofia Ramirez', email: 'sofia.ramirez@email.com', phone: '+1 (415) 555-0114', membership: 'Student', joinedAt: dateOffset(-120), avatar: 'SR' },
    { id: 'm-004', name: 'Oliver Chen', email: 'oliver.chen@email.com', phone: '+1 (415) 555-0165', membership: 'Premium', joinedAt: dateOffset(-92), avatar: 'OC' },
    { id: 'm-005', name: 'Priya Patel', email: 'priya.patel@email.com', phone: '+1 (415) 555-0190', membership: 'Standard', joinedAt: dateOffset(-65), avatar: 'PP' },
    { id: 'm-006', name: 'Noah Williams', email: 'noah.williams@email.com', phone: '+1 (415) 555-0172', membership: 'Student', joinedAt: dateOffset(-34), avatar: 'NW' }
  ];
  const loans: Loan[] = [
    { id: 'l-001', bookId: 'b-002', memberId: 'm-001', issueDate: dateOffset(-17), dueDate: dateOffset(-3), returnDate: null },
    { id: 'l-002', bookId: 'b-005', memberId: 'm-002', issueDate: dateOffset(-14), dueDate: dateOffset(0), returnDate: null },
    { id: 'l-003', bookId: 'b-008', memberId: 'm-003', issueDate: dateOffset(-11), dueDate: dateOffset(3), returnDate: null },
    { id: 'l-004', bookId: 'b-011', memberId: 'm-004', issueDate: dateOffset(-8), dueDate: dateOffset(6), returnDate: null },
    { id: 'l-005', bookId: 'b-001', memberId: 'm-005', issueDate: dateOffset(-28), dueDate: dateOffset(-14), returnDate: dateOffset(-16) },
    { id: 'l-006', bookId: 'b-007', memberId: 'm-006', issueDate: dateOffset(-39), dueDate: dateOffset(-25), returnDate: dateOffset(-27) },
    { id: 'l-007', bookId: 'b-003', memberId: 'm-001', issueDate: dateOffset(-54), dueDate: dateOffset(-40), returnDate: dateOffset(-41) },
    { id: 'l-008', bookId: 'b-010', memberId: 'm-003', issueDate: dateOffset(-67), dueDate: dateOffset(-53), returnDate: dateOffset(-55) }
  ];
  return { books, members, loans };
}

@Injectable({ providedIn: 'root' })
export class LibraryService {
  private readonly _state = signal<LibraryState>(this.loadState());
  private apiAvailable = false;
  readonly books = computed(() => this._state().books);
  readonly members = computed(() => this._state().members.filter((member) => !member.isDeleted));
  readonly loans = computed(() => this._state().loans);
  readonly activeLoans = computed(() => this.loans().filter((loan) => !loan.returnDate));
  readonly overdueLoans = computed(() => this.activeLoans().filter((loan) => this.isOverdue(loan)));
  readonly dashboard = computed<DashboardStats>(() => ({
    totalBooks: this.books().length,
    totalMembers: this.members().length,
    issuedBooks: this.activeLoans().length,
    overdueBooks: this.overdueLoans().length,
    availableBooks: this.books().filter((book) => book.status === 'available').length,
    returnedThisMonth: this.loans().filter((loan) => loan.returnDate && loan.returnDate.slice(0, 7) === localDate(new Date()).slice(0, 7)).length,
    dueSoon: this.activeLoans().filter((loan) => {
      const days = this.daysUntil(loan.dueDate);
      return days >= 0 && days <= 3;
    }).length
  }));

  constructor(private readonly http: HttpClient) { this.connectApi(); }

  private loadState(): LibraryState {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved) as LibraryState;
    } catch (error) { console.warn('Could not read library storage.', error); }
    const state = initialState();
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (error) { console.warn('Could not seed library storage.', error); }
    return state;
  }

  private commit(next: LibraryState): void {
    this._state.set(next);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); }
    catch (error) { console.error('Could not save library data.', error); throw new Error('Your browser could not save the changes. Check available storage.'); }
  }

  private connectApi(): void {
    this.http.get<{ status: string }>('/api/v1/health').pipe(switchMap(() => forkJoin({ books: this.http.get<Book[]>('/api/v1/books'), members: this.http.get<Member[]>('/api/v1/members'), loans: this.http.get<Loan[]>('/api/v1/loans') }))).subscribe({
      next: (data) => {
        const colors = new Map(this.books().map((book) => [book.isbn, book.color]));
        const books = data.books.map((book) => ({ ...book, color: book.color || colors.get(book.isbn) || '#d8ddd2' }));
        this.apiAvailable = true;
        this.commit({ books, members: data.members, loans: data.loans });
      },
      error: () => { this.apiAvailable = false; }
    });
  }

  private reportApiFailure(error: unknown): void {
    this.apiAvailable = false;
    const apiMessage = error instanceof HttpErrorResponse && typeof error.error?.error === 'string' ? error.error.error : null;
    const message = apiMessage ?? (error instanceof Error ? error.message : 'Request failed.');
    this.notify(`Could not save to the API: ${message}`, 'error');
    this.connectApi();
  }

  private copy(): LibraryState { return structuredClone(this._state()); }
  private id(prefix: string): string { return `${prefix}-${globalThis.crypto?.randomUUID?.() ?? Date.now().toString(36)}`; }
  private duplicateBook(book: Pick<Book, 'isbn'>, ignoreId?: string): boolean {
    const isbn = book.isbn.replace(/[-\s]/g, '').toLowerCase();
    return this.books().some((item) => item.id !== ignoreId && item.isbn.replace(/[-\s]/g, '').toLowerCase() === isbn);
  }
  private daysUntil(date: string): number {
    const start = new Date(); start.setHours(0, 0, 0, 0);
    const end = new Date(`${date}T00:00:00`);
    return Math.round((end.getTime() - start.getTime()) / 86400000);
  }
  isOverdue(loan: Loan): boolean { return !loan.returnDate && this.daysUntil(loan.dueDate) < 0; }
  daysOverdue(loan: Loan): number { return Math.max(0, -this.daysUntil(loan.dueDate)); }
  daysLeft(loan: Loan): number { return this.daysUntil(loan.dueDate); }
  bookById(id: string): Book | undefined { return this.books().find((book) => book.id === id); }
  memberById(id: string): Member | undefined { return this._state().members.find((member) => member.id === id); }
  loanBook(loan: Loan): Book | undefined { return this.bookById(loan.bookId); }
  loanMember(loan: Loan): Member | undefined { return this.memberById(loan.memberId); }
  historyForBook(id: string): Loan[] { return this.loans().filter((loan) => loan.bookId === id).sort((a, b) => b.issueDate.localeCompare(a.issueDate)); }
  historyForMember(id: string): Loan[] { return this.loans().filter((loan) => loan.memberId === id).sort((a, b) => b.issueDate.localeCompare(a.issueDate)); }

  saveBook(input: Omit<Book, 'id' | 'status' | 'addedAt'>, id?: string): string {
    if (!input.title.trim() || !input.author.trim() || !input.category.trim() || !input.isbn.trim()) throw new Error('Complete all required book fields.');
    if (input.cover.trim()) { try { const url = new URL(input.cover); if (url.protocol !== 'http:' && url.protocol !== 'https:') throw new Error(); } catch { throw new Error('Enter a valid cover image URL or leave it blank.'); } }
    const isbnClean = input.isbn.replace(/[-\s]/g, '').toUpperCase();
    if (!/^([0-9]{9}[0-9X]|[0-9]{13})$/.test(isbnClean)) throw new Error('Enter a valid ISBN with 10 or 13 digits (hyphens allowed).');
    if (this.duplicateBook(input, id)) throw new Error('A book with this ISBN already exists. Duplicate books cannot be added; use a different ISBN.');
    const sameTitle = this.books().some((item) => item.id !== id && item.title.trim().toLowerCase() === input.title.trim().toLowerCase() && item.author.trim().toLowerCase() === input.author.trim().toLowerCase());
    if (sameTitle) throw new Error('A book with this title and author already exists. Duplicate books cannot be added.');
    const state = this.copy();
    if (id) {
      const index = state.books.findIndex((book) => book.id === id);
      if (index < 0) throw new Error('This book could not be found.');
      state.books[index] = { ...state.books[index], ...input, title: input.title.trim(), author: input.author.trim(), isbn: input.isbn.trim() };
    } else {
      state.books.unshift({ ...input, title: input.title.trim(), author: input.author.trim(), isbn: input.isbn.trim(), id: this.id('b'), status: 'available', addedAt: localDate(new Date()) });
    }
    this.commit(state);
    if (this.apiAvailable) {
      const payload = { ...input, status: undefined, addedAt: undefined };
      if (id) this.http.put<Book>(`/api/v1/books/${encodeURIComponent(id)}`, payload).subscribe({ next: (saved) => { const current = this.copy(); const i = current.books.findIndex((book) => book.id === id); if (i >= 0) current.books[i] = { ...saved, color: input.color }; this.commit(current); }, error: (error: unknown) => this.reportApiFailure(error) });
      else { const localId = state.books[0].id; this.http.post<Book>('/api/v1/books', payload).subscribe({ next: (saved) => { const current = this.copy(); const i = current.books.findIndex((book) => book.id === localId); if (i >= 0) current.books[i] = { ...saved, color: input.color }; this.commit(current); }, error: (error: unknown) => this.reportApiFailure(error) }); }
    }
    return id ?? state.books[0].id;
  }

  deleteBook(id: string): void {
    if (this.activeLoans().some((loan) => loan.bookId === id)) throw new Error('Return this book before deleting it.');
    const state = this.copy(); state.books = state.books.filter((book) => book.id !== id); this.commit(state);
    if (this.apiAvailable) this.http.delete(`/api/v1/books/${encodeURIComponent(id)}`).subscribe({ error: (error: unknown) => this.reportApiFailure(error) });
  }

  async saveMember(input: Omit<Member, 'id' | 'joinedAt' | 'avatar'>, id?: string): Promise<string> {
    if (!input.name.trim() || !input.email.trim() || !input.phone.trim()) throw new Error('Complete all required member fields.');
    const email = input.email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) throw new Error('Enter a valid email address.');
    const phone = input.phone.trim();
    const digitCount = phone.replace(/\D/g, '').length;
    if (!/^\+?[0-9][0-9\s().-]*$/.test(phone) || digitCount < 7 || digitCount > 15) throw new Error('Enter a valid phone number with 7 to 15 digits.');
    if (!['Standard', 'Premium', 'Student'].includes(input.membership)) throw new Error('Choose a valid membership type.');
    const matchingMember = this._state().members.find((member) => member.id !== id && member.email.trim().toLowerCase() === email);
    if (matchingMember?.isDeleted) throw new Error('A previously removed member with this email was found. Duplicate members cannot be created; use a different email address.');
    if (matchingMember) throw new Error('A member with this email already exists. Duplicate members cannot be created.');
    const digits = (value: string): string => value.replace(/\D/g, '');
    const matchingPhone = this._state().members.find((member) => member.id !== id && digits(member.phone) !== '' && digits(member.phone) === digits(phone));
    if (matchingPhone?.isDeleted) throw new Error('A previously removed member with this phone number was found. Duplicate members cannot be created; use a different phone number.');
    if (matchingPhone) throw new Error('A member with this phone number already exists. Duplicate members cannot be created.');
    if (this.apiAvailable) {
      try {
        const saved = id
          ? await this.http.put<Member>(`/api/v1/members/${encodeURIComponent(id)}`, { ...input, email }).toPromise()
          : await this.http.post<Member>('/api/v1/members', { ...input, email }).toPromise();
        if (!saved) throw new Error('The server returned an empty member record.');
        const state = this.copy();
        if (id) {
          const index = state.members.findIndex((member) => member.id === id);
          if (index < 0) throw new Error('This member could not be found.');
          state.members[index] = saved;
        } else {
          state.members.unshift(saved);
        }
        this.commit(state);
        return saved.id;
      } catch (error) {
        this.apiAvailable = false;
        this.connectApi();
        if (error instanceof HttpErrorResponse && typeof error.error?.error === 'string') throw new Error(error.error.error);
        throw error instanceof Error ? error : new Error('Could not save the member.');
      }
    }
    const state = this.copy();
    if (id) {
      const index = state.members.findIndex((member) => member.id === id);
      if (index < 0) throw new Error('This member could not be found.');
      state.members[index] = { ...state.members[index], ...input, name: input.name.trim(), email };
    } else {
      const avatar = input.name.trim().split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase();
      state.members.unshift({ ...input, name: input.name.trim(), email, id: this.id('m'), joinedAt: localDate(new Date()), avatar });
    }
    this.commit(state);
    return id ?? state.members[0].id;
  }

  deleteMember(id: string): void {
    if (this.activeLoans().some((loan) => loan.memberId === id)) throw new Error('Resolve this member’s active loans before removing them.');
    const state = this.copy();
    const member = state.members.find((item) => item.id === id);
    if (!member) throw new Error('This member could not be found.');
    member.isDeleted = true;
    this.commit(state);
    if (this.apiAvailable) this.http.delete(`/api/v1/members/${encodeURIComponent(id)}`).subscribe({ error: (error: unknown) => this.reportApiFailure(error) });
  }

  issueBook(bookId: string, memberId: string, issueDate: string, dueDate: string): void {
    const book = this.bookById(bookId);
    if (!book || !this.memberById(memberId)) throw new Error('Choose a valid book and member.');
    if (book.status !== 'available') throw new Error('This book is already on loan.');
    if (!issueDate || !dueDate || dueDate <= issueDate) throw new Error('The due date must be after the issue date.');
    const state = this.copy();
    state.loans.unshift({ id: this.id('l'), bookId, memberId, issueDate, dueDate, returnDate: null });
    const index = state.books.findIndex((item) => item.id === bookId);
    state.books[index] = { ...state.books[index], status: 'issued' };
    this.commit(state);
    if (this.apiAvailable) {
      const localId = state.loans[0].id;
      this.http.post<{ id: string }>('/api/v1/loans', { bookId, memberId, issueDate, dueDate }).subscribe({ next: (result) => { const current = this.copy(); const loan = current.loans.find((item) => item.id === localId); if (loan) loan.id = result.id; this.commit(current); }, error: (error: unknown) => this.reportApiFailure(error) });
    }
  }

  returnBook(loanId: string): void {
    const state = this.copy();
    const loan = state.loans.find((item) => item.id === loanId);
    if (!loan || loan.returnDate) throw new Error('This loan has already been returned or no longer exists.');
    loan.returnDate = localDate(new Date());
    const book = state.books.find((item) => item.id === loan.bookId);
    if (book) book.status = 'available';
    this.commit(state);
    if (this.apiAvailable) this.http.post(`/api/v1/loans/${encodeURIComponent(loanId)}/return`, {}).subscribe({ error: (error: unknown) => this.reportApiFailure(error) });
  }

  notify(message: string, kind: ToastKind = 'success'): void { window.dispatchEvent(new CustomEvent('folio-toast', { detail: { message, kind } })); }
}
