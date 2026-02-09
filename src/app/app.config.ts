import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { APP_INITIALIZER, importProvidersFrom } from '@angular/core';
import { KeycloakService, KeycloakAngularModule } from 'keycloak-angular';
import { environment } from '../environments/environment';
import { HttpClientInMemoryWebApiModule } from 'angular-in-memory-web-api';
import {
  LucideAngularModule, Search, X, Plus, Pencil, Trash2, MapPin,
  Building2, Layers, AlertTriangle, Inbox, Folder, Sun, Moon, Monitor,
  Wifi, Presentation, Accessibility, Thermometer, Video, Square, Cable,
  Star, Users, ArrowLeft, Home, PanelLeft
} from 'lucide-angular';

import { routes } from './app.routes';
import { InMemoryDataService } from './core/services/in-memory-data.service';

function initializeKeycloak(keycloak: KeycloakService) {
  return () =>
    keycloak.init({
      config: {
        url: environment.keycloak.url,
        realm: environment.keycloak.realm,
        clientId: environment.keycloak.clientId
      },
      initOptions: {
        onLoad: 'check-sso',
        silentCheckSsoRedirectUri:
          window.location.origin + window.location.pathname + (window.location.pathname.endsWith('/') ? '' : '/') + 'assets/silent-check-sso.html'
      },
      // This helps with the duplicated fragment issue mentioned by the user
      enableBearerInterceptor: true,
      bearerExcludedUrls: ['/assets'],
    });
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes, withComponentInputBinding()),
    provideHttpClient(),
    {
      provide: APP_INITIALIZER,
      useFactory: initializeKeycloak,
      multi: true,
      deps: [KeycloakService]
    },
    importProvidersFrom(
      KeycloakAngularModule,
      HttpClientInMemoryWebApiModule.forRoot(InMemoryDataService, {
        dataEncapsulation: false,
        passThruUnknownUrl: true,
        delay: 300
      }),
      LucideAngularModule.pick({
        Search, X, Plus, Pencil, Trash2, MapPin, Building2, Layers,
        AlertTriangle, Inbox, Folder, Sun, Moon, Monitor, Wifi,
        Presentation, Accessibility, Thermometer, Video, Square,
        Cable, Star, Users, ArrowLeft, Home, PanelLeft
      })
    )
  ]
};
