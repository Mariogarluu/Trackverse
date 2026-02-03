import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { RecommendationService } from './services/recommendation.service';
import { SupabaseService } from '../../core/supabase.service';
import { MediaService } from '../../core/media.service';
import { UniversalMediaItem } from '../../models/media';
import { MediaCardComponent } from '../../shared/components/media-card/media-card.component';
import { MediaDetailModalComponent } from '../../shared/components/media-detail-modal/media-detail-modal.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, MediaCardComponent, MediaDetailModalComponent],
  template: `
    <div class="min-h-screen bg-background-light dark:bg-background-dark text-slate-800 dark:text-slate-100 p-6 pb-24">
      
      <!-- Detail Modal -->
      <app-media-detail-modal 
        [item]="selectedItem()" 
        (close)="selectedItem.set(null)"
        (statusUpdated)="refreshLibrary()"
      ></app-media-detail-modal>

      <!-- Header -->
      <header class="flex justify-between items-center mb-8">
        <div class="flex flex-col">
            <span class="text-sm text-slate-500 font-medium">Bienvendi,</span>
            <h1 class="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
            {{ username() || 'Viajero' }}
            </h1>
        </div>
        <button (click)="goToSearch()" class="p-3 bg-surface-light dark:bg-surface-dark rounded-full shadow-md hover:scale-105 transition-transform text-xl border border-slate-200 dark:border-slate-800">
          🔍
        </button>
      </header>

      <!-- Hero: Recommendation Dice -->
      <div class="mb-12 flex flex-col items-center justify-center p-8 bg-surface-light dark:bg-surface-dark rounded-3xl shadow-lg border border-slate-100 dark:border-slate-800/50 relative overflow-hidden transition-all duration-500 ease-out" 
           [class.h-auto]="recService.recommendation()" 
           [class.h-64]="!recService.recommendation()">
        
        <div class="absolute inset-0 bg-gradient-to-br from-primary/5 to-secondary/5 pointer-events-none"></div>
        
        <div class="z-10 flex flex-col items-center gap-6 text-center w-full">
            
            <div *ngIf="!recService.recommendation()" class="animate-fade-in-up">
                <h2 class="text-xl font-medium text-slate-500 dark:text-slate-400 mb-6">¿No sabes qué hacer hoy?</h2>
                <button 
                (click)="onShuffle()"
                [disabled]="recService.loading()"
                class="px-8 py-3 bg-gradient-to-r from-primary to-secondary text-white font-bold rounded-full shadow-lg shadow-primary/30 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                <span *ngIf="!recService.loading()">🎲 Tira el Dado</span>
                <span *ngIf="recService.loading()" class="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></span>
                </button>
            </div>

            <!-- Active Recommendation Result -->
            <div *ngIf="recService.recommendation() as item" class="w-full flex flex-col items-center animate-scale-up">
                <div class="flex justify-between items-center w-full max-w-sm mb-2">
                    <p class="text-sm text-slate-400 uppercase tracking-widest">Te sugerimos continuar</p>
                    <button (click)="recService.clearRecommendation()" class="text-slate-400 hover:text-red-500 text-sm">✕</button>
                </div>
                
                <div class="transform hover:scale-105 transition-transform duration-300">
                     <app-media-card [item]="item" (click)="onItemClick(item)"></app-media-card>
                </div>

                <button 
                  (click)="onShuffle()"
                  class="mt-6 text-sm text-primary hover:underline font-medium">
                  🎲 Probar otra vez
                </button>
            </div>
        </div>
      </div>

      <!-- Sections -->
      <div class="space-y-12 animate-fade-in" style="animation-delay: 0.2s">

        <!-- 1. Continue Watching -->
        <section *ngIf="watching().length > 0">
           <h3 class="text-xl font-bold mb-4 flex items-center gap-2 text-slate-800 dark:text-white">
             <span>🔥</span> Continuando
           </h3>
           <div class="flex overflow-x-auto gap-4 pb-4 -mx-6 px-6 scrollbar-hide snap-x">
             <div *ngFor="let item of watching()" class="snap-start shrink-0 w-[160px] md:w-[200px]">
               <app-media-card [item]="item" (click)="onItemClick(item)"></app-media-card>
             </div>
           </div>
        </section>

        <!-- 2. Pending (Watchlist) -->
        <section *ngIf="pending().length > 0">
           <h3 class="text-xl font-bold mb-4 flex items-center gap-2 text-slate-800 dark:text-white">
             <span>📌</span> Lista de Pendientes
           </h3>
           <div class="flex overflow-x-auto gap-4 pb-4 -mx-6 px-6 scrollbar-hide snap-x">
             <div *ngFor="let item of pending()" class="snap-start shrink-0 w-[160px] md:w-[200px]">
               <app-media-card [item]="item" (click)="onItemClick(item)"></app-media-card>
             </div>
           </div>
        </section>

        <!-- 3. Completed -->
        <section *ngIf="completed().length > 0">
           <h3 class="text-xl font-bold mb-4 flex items-center gap-2 text-slate-800 dark:text-white">
             <span>✅</span> Completados
           </h3>
           <div class="flex overflow-x-auto gap-4 pb-4 -mx-6 px-6 scrollbar-hide snap-x">
             <div *ngFor="let item of completed()" class="snap-start shrink-0 w-[160px] md:w-[200px]">
               <app-media-card [item]="item" (click)="onItemClick(item)"></app-media-card>
             </div>
           </div>
        </section>

        <!-- Loading State -->
        <div *ngIf="loading()" class="py-20 flex justify-center">
             <div class="animate-spin h-10 w-10 border-4 border-primary border-t-transparent rounded-full"></div>
        </div>

        <!-- Empty State -->
        <div *ngIf="loading() === false && watching().length === 0 && pending().length === 0 && completed().length === 0" class="text-center py-12 animate-fade-in">
            <div class="bg-surface-light dark:bg-slate-800 rounded-3xl p-8 max-w-md mx-auto">
                <p class="text-4xl mb-4">📚</p>
                <h3 class="text-lg font-bold mb-2">Tu biblioteca está vacía</h3>
                <p class="text-slate-500 mb-6 text-sm">Empieza a añadir tus juegos, series y libros favoritos para llevar el control.</p>
                <button (click)="goToSearch()" class="px-6 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary-dark transition-colors shadow-lg shadow-primary/20 w-full">
                    Explorar Catálogo
                </button>
            </div>
        </div>

      </div>
    </div>
  `,
  styles: [`
    .scrollbar-hide::-webkit-scrollbar {
        display: none;
    }
    .scrollbar-hide {
        -ms-overflow-style: none;
        scrollbar-width: none;
    }
    .animate-fade-in { animation: fadeIn 0.5s ease-out forwards; opacity: 0; }
    .animate-fade-in-up { animation: fadeInUp 0.5s ease-out forwards; }
    .animate-scale-up { animation: scaleUp 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
    
    @keyframes fadeIn { to { opacity: 1; } }
    @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes scaleUp { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
  `]
})
export class HomeComponent implements OnInit {
  recService = inject(RecommendationService);
  mediaService = inject(MediaService);
  supabase = inject(SupabaseService);
  router = inject(Router);

  username = signal<string>('');

  // Sections
  watching = signal<UniversalMediaItem[]>([]);
  pending = signal<UniversalMediaItem[]>([]);
  completed = signal<UniversalMediaItem[]>([]);

  loading = signal(true);
  selectedItem = signal<UniversalMediaItem | null>(null);

  async ngOnInit() {
    this.refreshLibrary();
  }

  async refreshLibrary() {
    this.loading.set(true);
    const { data: { session } } = await this.supabase.client.auth.getSession();

    if (session?.user) {
      this.username.set(session.user.user_metadata?.['full_name']?.split(' ')[0] || 'Viajero');

      try {
        const library = await this.mediaService.getLibrary(session.user.id);

        this.watching.set(library.filter(i => i.tracking?.status === 'watching'));
        this.pending.set(library.filter(i => i.tracking?.status === 'pending'));
        this.completed.set(library.filter(i => i.tracking?.status === 'completed' || i.tracking?.status === 'dropped'));
      } catch (e) {
        console.error('Error loading library', e);
      }
    }
    this.loading.set(false);
  }

  async onShuffle() {
    const { data: { session } } = await this.supabase.client.auth.getSession();
    if (session?.user) {
      this.recService.rollDice(session.user.id);
    }
  }

  onItemClick(item: UniversalMediaItem) {
    this.selectedItem.set(item);
  }

  goToSearch() {
    this.router.navigate(['/search']);
  }
}
