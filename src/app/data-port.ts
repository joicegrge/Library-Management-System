import { Injectable, InjectionToken, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { Book, DashboardStats, Loan, Member } from './models';

export interface LibraryDataPort {
  getBooks(): Observable<Book[]>;
  getMembers(): Observable<Member[]>;
  getLoans(): Observable<Loan[]>;
  getDashboard(): Observable<DashboardStats>;
}

export const LIBRARY_DATA_PORT = new InjectionToken<LibraryDataPort>('LIBRARY_DATA_PORT');

@Injectable()
export class LocalLibraryDataPort implements LibraryDataPort {
  getBooks(): Observable<Book[]> { return of([]); }
  getMembers(): Observable<Member[]> { return of([]); }
  getLoans(): Observable<Loan[]> { return of([]); }
  getDashboard(): Observable<DashboardStats> { return of({ totalBooks: 0, totalMembers: 0, issuedBooks: 0, overdueBooks: 0, availableBooks: 0, returnedThisMonth: 0, dueSoon: 0 }); }
}

@Injectable()
export class HttpLibraryDataPort implements LibraryDataPort {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/v1';
  getBooks(): Observable<Book[]> { return this.http.get<Book[]>(`${this.baseUrl}/books`); }
  getMembers(): Observable<Member[]> { return this.http.get<Member[]>(`${this.baseUrl}/members`); }
  getLoans(): Observable<Loan[]> { return this.http.get<Loan[]>(`${this.baseUrl}/loans`); }
  getDashboard(): Observable<DashboardStats> { return this.http.get<DashboardStats>(`${this.baseUrl}/dashboard`); }
}
