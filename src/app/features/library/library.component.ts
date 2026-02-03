import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MediaService } from '../../core/media.service';
import { UniversalMediaItem, MediaType } from '../../models/media';
import { MediaCardComponent } from '../../shared/components/media-card/media-card.component';
import { SupabaseService } from '../../core/supabase.service';

@Component({
  selector: 'app-library',
  standalone: true,
  imports: [CommonModule, MediaCardComponent],
  template: `
    <div class="min-h-screen bg-background-light dark:bg-background-dark text-slate-800 dark:text-slate-100 p-6">
      
      <header class="mb-8">
        <h1 class="text-3xl font-light tracking-wide mb-6">Biblioteca</h1>
        
        <!-- Type Tabs -->
        <div class="flex gap-4 border-b border-slate-200 dark:border-slate-800 pb-1 overflow-x-auto">
          <button 
            *ngFor="let type of types"
            (click)="activeType.set(type.id)"
            class="px-4 py-2 text-sm font-medium transition-colors relative whitespace-nowrap"
            [ngClass]="activeType() === type.id ? 'text-primary' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'"
          >
            {{ type.label }}
            <div *ngIf="activeType() === type.id" class="absolute bottom-0 left-0 w-full h-0.5 bg-primary rounded-t-full"></div>
          </button>
        </div>
      </header>

      <!-- Content Grid -->
      <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        <ng-container *ngIf="!loading(); else loader">
          <app-media-card 
            *ngFor="let item of filteredItems()" 
            [item]="item"
          ></app-media-card>
          
          <!-- Empty State -->
          <div *ngIf="filteredItems().length === 0" class="col-span-full h-64 flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
            <span class="text-4xl mb-4">📭</span>
            <p>No tienes {{ activeType() === 'all' ? 'items' : activeType() }} guardados aún.</p>
          </div>
        </ng-container>
      </div>

      <ng-template #loader>
        <div class="flex justify-center py-20">
          <div class="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
        </div>
      </ng-template>

    </div>
  `
})
export class LibraryComponent implements OnInit {
  mediaService = inject(MediaService);
  supabase = inject(SupabaseService);

  types: { id: MediaType | 'all', label: string }[] = [
    { id: 'all', label: 'Todo' },
    { id: 'game', label: 'Juegos' },
    { id: 'show', label: 'Series' },
    { id: 'book', label: 'Libros' }
  ];

  activeType = signal<MediaType | 'all'>('all');
  items = signal<UniversalMediaItem[]>([]);
  loading = signal(true);

  filteredItems = computed(() => {
    const type = this.activeType();
    const all = this.items();
    return type === 'all' ? all : all.filter(i => i.type === type);
  });

  ngOnInit() {
    this.loadLibrary();
  }

  async loadLibrary() {
    this.loading.set(true);
    try {
      const { data: { session } } = await this.supabase.client.auth.getSession();
      if (session?.user) {
        const data = await this.mediaService.getLibrary(session.user.id);
        this.items.set(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      this.loading.set(false);
    }
  }
}


