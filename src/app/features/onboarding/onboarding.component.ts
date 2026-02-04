import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SupabaseService } from '../../core/supabase.service';
import { MediaService } from '../../core/media.service';
import { ToastService } from '../../core/toast.service';
import { UniversalMediaItem } from '../../models/media';
import { MediaCardComponent } from '../../shared/components/media-card/media-card.component';
import { MediaDetailModalComponent } from '../../shared/components/media-detail-modal/media-detail-modal.component';

@Component({
  selector: 'app-onboarding',
  standalone: true,
  imports: [CommonModule, FormsModule, MediaCardComponent, MediaDetailModalComponent],
  template: `
    <div class="min-h-screen bg-background-light dark:bg-background-dark text-slate-800 dark:text-slate-100 flex flex-col">
      
      <!-- Sticky Header / Progress -->
      <div class="p-6 flex justify-between items-center border-b border-slate-100 dark:border-slate-800">
         <div class="flex items-center gap-2">
           <img src="/Tackverse_logo_completo.png" class="h-8">
         </div>
         <div class="flex gap-2">
            <span class="w-3 h-3 rounded-full transition-colors" [ngClass]="step() === 1 ? 'bg-primary' : 'bg-slate-300 dark:bg-slate-700'"></span>
            <span class="w-3 h-3 rounded-full transition-colors" [ngClass]="step() === 2 ? 'bg-primary' : 'bg-slate-300 dark:bg-slate-700'"></span>
         </div>
      </div>

      <!-- Main Content Area -->
      <div class="flex-1 overflow-y-auto">
        
        <!-- STEP 1: TOUR -->
        <div *ngIf="step() === 1" class="h-full flex flex-col items-center justify-center p-8 text-center animate-fade-in">
           <div class="max-w-md">
             <div class="text-6xl mb-6">{{ tourSlides[currentSlide].icon }}</div>
             <h2 class="text-3xl font-bold mb-4">{{ tourSlides[currentSlide].title }}</h2>
             <p class="text-slate-500 text-lg mb-8">{{ tourSlides[currentSlide].desc }}</p>
             
             <!-- Slide Indicators -->
             <div class="flex justify-center gap-2 mb-8">
               <button 
                 *ngFor="let s of tourSlides; let i = index" 
                 (click)="currentSlide = i"
                 class="w-2 h-2 rounded-full transition-all"
                 [ngClass]="currentSlide === i ? 'bg-primary w-4' : 'bg-slate-300 dark:bg-slate-600'"
               ></button>
             </div>

             <div class="flex flex-col gap-3">
               <button 
                 (click)="nextSlide()" 
                 class="w-full py-3 rounded-xl bg-primary text-white font-bold hover:bg-primary-dark transition-colors shadow-lg shadow-primary/20"
               >
                 {{ currentSlide === tourSlides.length - 1 ? 'Empezar' : 'Siguiente' }}
               </button>
               <button *ngIf="currentSlide !== tourSlides.length - 1" (click)="skipTour()" class="text-slate-400 text-sm font-medium hover:text-slate-600">
                 Saltar Tour
               </button>
             </div>
           </div>
        </div>

        <!-- STEP 2: SEED LABRARY -->
        <div *ngIf="step() === 2" class="p-6 max-w-5xl mx-auto animate-fade-in">
           <div class="text-center mb-8">
             <h2 class="text-2xl font-bold mb-2">Para empezar, elige 3 favoritos</h2>
             <p class="text-slate-500">Esto nos ayuda a personalizar tu universo.</p>
             
             <!-- Progress Counter -->
             <div class="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-100 dark:bg-slate-800 font-bold">
               <span [class.text-primary]="selectionCount() >= 3">{{ selectionCount() }}</span>
               <span class="text-slate-400">/</span>
               <span>3</span>
               <span *ngIf="selectionCount() >= 3" class="text-green-500 ml-1">✓</span>
             </div>
           </div>

            <!-- Search Area -->
            <div class="relative max-w-xl mx-auto mb-8">
                <input 
                    type="text" 
                    [(ngModel)]="query" 
                    (keyup.enter)="search()"
                    placeholder="Busca tus favoritos..." 
                    class="w-full px-5 py-4 pl-12 rounded-2xl bg-surface-light dark:bg-surface-dark shadow-sm border focus:ring-2 focus:ring-primary outline-none border-transparent"
                >
                <span class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
            </div>

            <!-- Loading Spinner -->
             <div *ngIf="loading()" class="flex justify-center mb-8">
                <div class="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
             </div>

            <!-- Search Results -->
            <div *ngIf="results().length > 0" class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
               <app-media-card 
                  *ngFor="let item of results()" 
                  [item]="item"
                  (click)="toggleSelection(item)"
                  class="transform transition-transform active:scale-95"
                  [ngClass]="{'ring-4 ring-primary rounded-xl': isSelected(item.id)}"
               ></app-media-card>
            </div>

            <!-- Empty Search State -->
             <div *ngIf="hasSearched && !loading() && results().length === 0" class="text-center text-slate-400 mb-8">
                <p>No encontramos nada con ese nombre. ¡Prueba otro!</p>
             </div>


            <!-- Finish Button -->
            <div class="fixed bottom-0 left-0 right-0 p-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-t border-slate-100 dark:border-slate-800 flex justify-center">
               <button 
                 (click)="finishOnboarding()"
                 [disabled]="selectionCount() < 3 || finishing()"
                 class="w-full max-w-md py-4 rounded-xl bg-primary text-white font-bold shadow-xl shadow-primary/20 hover:bg-primary-dark transition-all disabled:opacity-50 disabled:grayscale mb-2 disabled:cursor-not-allowed flex justify-center gap-2"
               >
                 <span *ngIf="finishing()" class="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></span>
                 <span>{{ finishing() ? 'Configurando tu universo...' : 'Completar Configuración' }}</span>
               </button>
            </div>
            
            <div class="h-20"></div> <!-- Spacer -->
        </div>

      </div>
    </div>
  `,
  styles: [`
    .animate-fade-in { animation: fadeIn 0.5s ease-out; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
  `]
})
export class OnboardingComponent {
  step = signal(1);
  currentSlide = 0;

  query = '';
  results = signal<UniversalMediaItem[]>([]);
  selectedItems = signal<Set<string>>(new Set());
  loading = signal(false);
  hasSearched = false;
  finishing = signal(false);

  supabase = inject(SupabaseService);
  mediaService = inject(MediaService);
  toast = inject(ToastService);
  router = inject(Router);

  tourSlides = [
    { icon: '🎮', title: 'Gestiona tu entretenimiento', desc: 'Juegos, Series y Libros. Todo tu progreso en un solo lugar.' },
    { icon: '🎲', title: 'Descubre algo nuevo', desc: 'Utiliza el dado mágico para recibir recomendaciones basadas en lo que ya tienes.' },
    { icon: '🤝', title: 'Comparte con amigos', desc: 'Mira lo que están jugando tus amigos y comparte tu perfil.' }
  ];

  nextSlide() {
    if (this.currentSlide < this.tourSlides.length - 1) {
      this.currentSlide++;
    } else {
      this.step.set(2);
    }
  }

  skipTour() {
    this.step.set(2);
  }

  /* Step 2 Logic */

  async search() {
    if (!this.query.trim()) return;
    this.loading.set(true);
    this.hasSearched = true;
    try {
      // Re-use the cloud function for search
      const { data, error }: any = await this.supabase.client.functions.invoke('search-universal', {
        body: { query: this.query }
      });

      if (error) {
        console.error('Edge Function Error:', error);
        throw error;
      }

      if (data && data.length > 0) {
        this.results.set(data);
      } else {
        // Fallback to Mock Data if API returns empty (likely due to missing keys)
        console.warn('API returned empty results. Using Mock Data for testing.');
        this.useMockData();
      }

    } catch (e) {
      console.error('Search failed:', e);
      // Fallback on error too
      this.useMockData();
    } finally {
      this.loading.set(false);
    }
  }

  useMockData() {
    this.toast.info('Usando datos de prueba (API sin resultados) - Modo Test');
    this.results.set([
      {
        id: 'game-mock-1',
        type: 'game',
        title: 'The Legend of Zelda: Breath of the Wild',
        cover_url: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co3p2d.jpg',
        description: 'Un juego de aventuras de mundo abierto.',
        metadata: { creator: 'Nintendo', extra_info: '2017' }
      },
      {
        id: 'show-mock-1',
        type: 'show',
        title: 'Breaking Bad',
        cover_url: 'https://image.tmdb.org/t/p/w500/ggFHVNu6YYI5L9pCfOacjizRGt.jpg',
        description: 'Un profesor de química se convierte en capo de la droga.',
        metadata: { creator: 'TV Series', extra_info: '2008' }
      },
      {
        id: 'book-mock-1',
        type: 'book',
        title: 'Dune',
        cover_url: 'https://books.google.com/books/content/images/frontcover/B1HGzwEACAAJ?fife=w400-h600',
        description: 'Ciencia ficción épica en el planeta Arrakis.',
        metadata: { creator: 'Frank Herbert', extra_info: '600 pgs' }
      },
      {
        id: 'game-mock-2',
        type: 'game',
        title: 'Elden Ring',
        cover_url: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co4j8e.jpg',
        description: 'Un RPG de acción en un mundo de fantasía oscura.',
        metadata: { creator: 'FromSoftware', extra_info: '2022' }
      }
    ]);
  }

  // Store full items keyed by ID
  selectedObjects = new Map<string, UniversalMediaItem>();

  isSelected(id: string): boolean {
    return this.selectedObjects.has(id);
  }

  selectionCount() {
    return this.selectedObjects.size;
  }

  toggleSelection(item: UniversalMediaItem) {
    if (this.selectedObjects.has(item.id)) {
      this.selectedObjects.delete(item.id);
    } else {
      this.selectedObjects.set(item.id, item);
    }
    // Force signal update for UI if we used a signal for count (we currently call method in template, which works but signal is better)
    // Let's just update a dummy signal to trigger change detection if needed or rely on template polling
    this.selectedItems.set(new Set(this.selectedObjects.keys()));
  }

  async finishOnboarding() {
    if (this.selectedObjects.size < 3) return;
    this.finishing.set(true);

    try {
      const { data: { user } } = await this.supabase.client.auth.getUser();
      if (!user) throw new Error('No User');

      // 1. Track all items
      const promises = Array.from(this.selectedObjects.values()).map(item =>
        this.mediaService.trackItem(user.id, item)
      );

      await Promise.all(promises);

      // 2. Mark onboarding as complete (create profile if missing)
      await (this.supabase.client.from('profiles') as any)
        .upsert({ id: user.id, onboarding_completed: true, email: user.email })
        .select();

      this.toast.success('¡Bienvenido a TrackVerse!');
      this.router.navigate(['/home']);

    } catch (e) {
      console.error(e);
      this.toast.error('Algo salió mal. Inténtalo de nuevo.');
    } finally {
      this.finishing.set(false);
    }
  }
}
