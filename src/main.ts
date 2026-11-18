import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { LIBRARY_DATA_PORT, LocalLibraryDataPort } from './app/data-port';
import { AppComponent } from './app/app.component';
import { routes } from './app/app.routes';

bootstrapApplication(AppComponent, { providers: [provideRouter(routes), provideHttpClient(), { provide: LIBRARY_DATA_PORT, useClass: LocalLibraryDataPort }] }).catch((error: unknown) => console.error(error));
