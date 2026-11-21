import type { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./ui/home/home.page').then((m) => m.HomePage),
  },
];
