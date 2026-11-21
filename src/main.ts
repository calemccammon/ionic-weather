import { bootstrapApplication } from '@angular/platform-browser';
import { RouteReuseStrategy, provideRouter } from '@angular/router';
import { IonicRouteStrategy, provideIonicAngular } from '@ionic/angular';

import { AppComponent } from './app/app.component';
import { routes } from './app/app.routes';
import { preferencesStore } from './app/data/repositories/preferences-store';
import { StoredSettingsRepository } from './app/data/repositories/stored-settings-repository';
import { appProviders, repositoryProviders } from './app/di/providers';
import { registerIcons } from './app/ui/core/icons';

async function main(): Promise<void> {
  registerIcons();
  // Read before the app starts, so the saved units are there from the first frame.
  const settings = await StoredSettingsRepository.open(preferencesStore);

  await bootstrapApplication(AppComponent, {
    providers: [
      { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
      provideIonicAngular(),
      provideRouter(routes),
      ...repositoryProviders(settings),
      ...appProviders,
    ],
  });
}

void main();
