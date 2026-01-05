import { enableProdMode, provideZoneChangeDetection } from "@angular/core";
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { AppModule } from './app/app.module';
import { environment } from "./environments/environment";

if (environment.production) {
  enableProdMode();
}

platformBrowserDynamic().bootstrapModule(AppModule, { applicationProviders: [provideZoneChangeDetection()], })
  .catch(err => console.log(err));

  // Registrar o SW mesmo em desenvolvimento se quiser testar
if ('serviceWorker' in navigator) {
  // registra do root da app (www/service-worker.js)
  navigator.serviceWorker.register('/service-worker.js')
    .then(reg => console.log('ServiceWorker registrado', reg))
    .catch(err => console.warn('ServiceWorker falhou', err));
}

navigator.serviceWorker.register