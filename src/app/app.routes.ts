import { Routes } from '@angular/router';
import { DashboardComponent } from './pages/dashboard.component';
import { BooksComponent } from './pages/books.component';
import { MembersComponent } from './pages/members.component';
import { LoansComponent } from './pages/loans.component';
import { DetailsComponent } from './pages/details.component';

export const routes: Routes = [
  { path: '', component: DashboardComponent, title: 'Overview · Folio' },
  { path: 'books', component: BooksComponent, title: 'Book collection · Folio' },
  { path: 'members', component: MembersComponent, title: 'Members · Folio' },
  { path: 'loans', component: LoansComponent, title: 'Loans · Folio' },
  { path: 'books/:id', component: DetailsComponent, title: 'Book details · Folio', data: { type: 'book' } },
  { path: 'members/:id', component: DetailsComponent, title: 'Member details · Folio', data: { type: 'member' } },
  { path: '**', redirectTo: '' }
];
