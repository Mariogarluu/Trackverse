import { Component, inject, signal, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SupabaseService } from '../../core/supabase.service';
import { UniversalMediaItem } from '../../models/media';
import { MediaCardComponent } from '../../shared/components/media-card/media-card.component';
import { MediaDetailModalComponent } from '../../shared/components/media-detail-modal/media-detail-modal.component';
import { MediaService } from '../../core/media.service';
import { ToastService } from '../../core/toast.service';

@Component({
  selector: 'app-search',
  standalone: true,
  imports: [CommonModule, FormsModule, MediaCardComponent, MediaDetailModalComponent],
  template: `
    <div class="min-h-screen bg-background-light dark:bg-background-dark text-slate-800 dark:text-slate-100 p-6 pb-24">
      
      <!-- Detail Modal -->
      <app-media-detail-modal 
        [item]="selectedItem()" 
        (close)="selectedItem.set(null)"
        (statusUpdated)="onStatusUpdated()"
      ></app-media-detail-modal>
      
      <!-- Search Bar -->
      <div class="sticky top-0 z-10 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md py-4 -mx-6 px-6 border-b border-transparent transition-colors duration-300" 
           [class.border-slate-200]="scrolled" [class.dark:border-slate-800]="scrolled">
        <div class="relative max-w-2xl mx-auto">
          <input 
            type="text" 
            [(ngModel)]="query"
            (keyup.enter)="search()"
            placeholder="Buscar juegos, series, libros..."
            class="w-full px-5 py-4 pl-12 rounded-2xl bg-surface-light dark:bg-surface-dark border-none shadow-sm focus:ring-2 focus:ring-primary outline-none transition-all duration-300"
          >
          <span class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
          <button 
            *ngIf="query" 
            (click)="query = ''; results.set([])"
            class="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >✕</button>
        </div>
      </div>

      <!-- Loading State -->
      <div *ngIf="loading()" class="flex justify-center mt-20">
        <div class="animate-spin h-10 w-10 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>

      <!-- Results Grid -->
      <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 max-w-6xl mx-auto mt-8">
        <app-media-card 
          *ngFor="let item of results()" 
          [item]="item"
          (click)="onItemClick(item)"
          (action)="onAction($event, item)"
        ></app-media-card>
      </div>

      <!-- Empty State -->
      <div *ngIf="!loading() && hasSearched && results().length === 0" class="text-center mt-20 text-slate-500">
        <p>No se encontraron resultados para "{{ lastQuery }}"</p>
      </div>

    </div>
  `
})
export class SearchComponent {
  supabase = inject(SupabaseService);
  mediaService = inject(MediaService);
  toast = inject(ToastService);

  query = '';
  lastQuery = '';

  results = signal<UniversalMediaItem[]>([]);
  loading = signal(false);
  hasSearched = false;
  scrolled = false;

  @HostListener('window:scroll', [])
  onWindowScroll() {
    this.scrolled = window.scrollY > 10;
  }

  async search() {
    if (!this.query.trim()) return;

    this.loading.set(true);
    this.hasSearched = true;
    this.lastQuery = this.query;
    this.results.set([]);

    try {
      const { data, error }: any = await this.supabase.client.functions.invoke('search-universal', {
        body: { query: this.query }
      });

      if (error) throw error;
      this.results.set(data || []);

    } catch (e) {
      console.error('Search failed', e);
    } finally {
      this.loading.set(false);
    }
  }

  selectedItem = signal<UniversalMediaItem | null>(null);

  onItemClick(item: UniversalMediaItem) {
    this.selectedItem.set(item);
  }

  onStatusUpdated() {
    this.search(); // Refresh search results to show new status
  }

  async onAction(type: string, item: UniversalMediaItem) {
    if (type === 'update') {
      const { data } = await this.supabase.client.auth.getSession();
      const session = data.session;

      if (!session?.user) {
        this.toast.info('Por favor inicia sesión para guardar.');
        return;
      }

      // Quick add to library for demo
      this.mediaService.trackItem(session.user.id, item)
        .then(() => this.toast.success(`Se añadió ${item.title} a tu biblioteca!`))
        .catch(e => {
          console.error(e);
          this.toast.error('Error al añadir item.');
        });
    }
  }
}
