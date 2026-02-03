import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterModule } from '@angular/router';
import { ToastContainerComponent } from './shared/components/toast-container/toast-container.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterModule, ToastContainerComponent],
  template: `
    <app-toast-container></app-toast-container>
    <div class="min-h-screen bg-background-light dark:bg-background-dark text-slate-800 dark:text-slate-100 font-sans selection:bg-primary selection:text-white pb-20">
      
      <!-- Main Content Area -->
      <router-outlet></router-outlet>

      <!-- Bottom Navigation (Fixed) -->
      <nav class="fixed bottom-0 left-0 w-full bg-surface-light/90 dark:bg-surface-dark/90 backdrop-blur-lg border-t border-slate-200 dark:border-slate-800 z-50 px-6 py-4 flex justify-between items-center sm:hidden">
        
        <a routerLink="/home" routerLinkActive="text-primary" class="flex flex-col items-center gap-1 text-slate-400 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-6 h-6">
            <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
          </svg>
          <span class="text-[10px] font-medium uppercase tracking-wider">Inicio</span>
        </a>

        <a routerLink="/library" routerLinkActive="text-primary" class="flex flex-col items-center gap-1 text-slate-400 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-6 h-6">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
          </svg>
          <span class="text-[10px] font-medium uppercase tracking-wider">Biblioteca</span>
        </a>

        <a routerLink="/search" routerLinkActive="text-primary" class="flex flex-col items-center gap-1 text-slate-400 transition-colors">
          <div class="bg-primary/10 p-3 rounded-full -mt-8 border-4 border-surface-light dark:border-surface-dark shadow-lg">
             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-6 h-6 text-primary">
                <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
             </svg>
          </div>
        </a>

        <a routerLink="/social" routerLinkActive="text-primary" class="flex flex-col items-center gap-1 text-slate-400 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-6 h-6">
             <path stroke-linecap="round" stroke-linejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
          </svg>
          <span class="text-[10px] font-medium uppercase tracking-wider">Social</span>
        </a>

        <a routerLink="/profile" routerLinkActive="text-primary" class="flex flex-col items-center gap-1 text-slate-400 transition-colors">
           <!-- Placeholder Avatar -->
           <div class="w-6 h-6 rounded-full bg-slate-300 overflow-hidden">
             <!-- <img src="..." /> -->
           </div>
           <span class="text-[10px] font-medium uppercase tracking-wider">Perfil</span>
        </a>

      </nav>

      <!-- Desktop Sidebar (Hidden on Mobile) -->
      <aside class="hidden sm:flex fixed top-0 left-0 h-full w-64 bg-surface-light dark:bg-surface-dark border-r border-slate-200 dark:border-slate-800 flex-col p-6">
        <div class="mb-10 px-2">
            <img src="/Tackverse_logo_completo.png" alt="TrackVerse Logo" class="w-full h-auto max-w-[150px]">
        </div>
        
        <nav class="flex flex-col gap-4">
            <a routerLink="/home" routerLinkActive="bg-primary/10 text-primary" class="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-slate-500">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>
                <span class="font-medium">Inicio</span>
            </a>
            <a routerLink="/library" routerLinkActive="bg-primary/10 text-primary" class="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-slate-500">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/></svg>
                <span class="font-medium">Biblioteca</span>
            </a>
            <a routerLink="/search" routerLinkActive="bg-primary/10 text-primary" class="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-slate-500">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
                <span class="font-medium">Buscar</span>
            </a>
            <a routerLink="/social" routerLinkActive="bg-primary/10 text-primary" class="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-slate-500">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/></svg>
                <span class="font-medium">Social</span>
            </a>
        </nav>
      </aside>
      
      <!-- Desktop Content Spacer -->
      <div class="hidden sm:block sm:ml-64">
         <router-outlet></router-outlet>
      </div>

    </div>
  `
})
export class AppComponent { }
