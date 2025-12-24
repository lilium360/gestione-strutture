import { ApplicationConfig, provideZoneChangeDetection, importProvidersFrom } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { HttpClientInMemoryWebApiModule } from 'angular-in-memory-web-api';
import {
  LucideAngularModule, Search, X, Plus, Pencil, Trash2, MapPin,
  Building2, Layers, AlertTriangle, Inbox, Folder, Sun, Moon, Monitor,
  Wifi, Presentation, Accessibility, Thermometer, Video, Square, Cable,
  Star, Users, ArrowLeft, Home, PanelLeft
} from 'lucide-angular';

import { routes } from './app.routes';
import { InMemoryDataService } from './core/services/in-memory-data.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes, withComponentInputBinding()),
    provideHttpClient(),
    importProvidersFrom(
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
