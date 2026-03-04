import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UniversalMediaItem } from '../../../models/media';
import { MediaService } from '../../../core/media.service';
import { ToastService } from '../../../core/toast.service';
import { SupabaseService } from '../../../core/supabase.service';

@Component({
   selector: 'app-media-detail-modal',
   standalone: true,
   imports: [CommonModule],
   template: `
    <div *ngIf="item" class="fixed inset-0 z-50 flex items-center justify-center p-4">
      
      <!-- Backdrop -->
      <div (click)="close.emit()" class="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity animate-fade-in"></div>

      <!-- Modal Content -->
      <div class="relative w-full max-w-4xl bg-surface-light dark:bg-surface-dark rounded-2xl shadow-2xl overflow-hidden animate-scale-up flex flex-col md:flex-row max-h-[90vh]">
        
        <!-- Confirmation Overlay -->
        <div *ngIf="showDeleteConfirm" class="absolute inset-0 z-50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm flex flex-col items-center justify-center p-6 animate-fade-in text-center">
            <h3 class="text-2xl font-bold text-slate-900 dark:text-white mb-2">¿Dejar de seguir?</h3>
            <p class="text-base text-slate-500 dark:text-slate-400 mb-8 max-w-sm">Si dejas de seguir esta serie, se eliminará de tu biblioteca y perderás tu progreso.</p>
            <div class="flex gap-4">
               <button (click)="cancelDelete()" class="px-6 py-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium transition-colors text-slate-700 dark:text-slate-200">
                  Cancelar
               </button>
               <button (click)="confirmDelete()" class="px-6 py-3 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold shadow-lg shadow-red-500/30 transition-all active:scale-95">
                  Confirmar
               </button>
            </div>
        </div>
        
        <!-- Close Button -->
        <button (click)="close.emit()" class="absolute top-4 right-4 z-10 p-2 bg-black/20 hover:bg-black/40 rounded-full text-white transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <!-- Cover Image (Left Side) -->
        <div class="w-full md:w-2/5 h-64 md:h-auto relative bg-slate-900">
           <img 
             [src]="item.cover_url || 'assets/placeholder-portrait.svg'" 
             [alt]="item.title"
             (error)="item.cover_url = null"
             class="absolute inset-0 w-full h-full object-cover opacity-80"
           >
           <div class="absolute inset-0 bg-gradient-to-t from-surface-light dark:from-surface-dark md:bg-gradient-to-r md:from-transparent md:to-surface-light md:dark:to-surface-dark"></div>
        </div>

        <!-- Details (Right Side) -->
        <div class="w-full md:w-3/5 p-8 flex flex-col overflow-y-auto">
          
          <div class="mb-1">
             <span class="px-2 py-0.5 rounded text-[10px] uppercase font-bold text-white bg-primary inline-block mb-2">
              {{ item.type }}
             </span>
          </div>

          <h2 class="text-3xl font-bold text-slate-900 dark:text-white mb-2 leading-tight">{{ item.title }}</h2>
          <p class="text-lg text-primary font-medium mb-6">{{ item.metadata.creator }} <span class="text-slate-400 mx-2">•</span> {{ item.metadata.extra_info }}</p>

          <div class="prose dark:prose-invert max-w-none mb-6 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
             <p>{{ item.description || 'Sin descripción disponible.' }}</p>
          </div>

          <!-- Extra detail for series (seasons / episodes) -->
          <div *ngIf="item.type === 'show'">
            <div *ngIf="loadingDetails" class="mb-4 text-sm text-slate-400">
              Cargando temporadas y episodios...
            </div>

            <div *ngIf="details && !loadingDetails" class="mb-6">
              <h3 class="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">
                Temporadas y episodios
              </h3>
              <p class="text-xs text-slate-500 mb-3">
                {{ details.number_of_seasons || '?' }} temporadas · {{ details.number_of_episodes || '?' }} episodios
              </p>
              <div class="max-h-40 overflow-y-auto space-y-2 pr-1">
                <div 
                  *ngFor="let s of details.seasons" 
                  class="flex flex-col bg-slate-50 dark:bg-slate-800 rounded-lg overflow-hidden">
                  
                  <!-- Season Header -->
                  <div class="flex items-center justify-between text-xs px-3 py-2 font-medium cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                       (click)="toggleSeason(s)">
                    <span class="truncate">
                       {{ s.name || ('Temporada ' + s.season_number) }}
                    </span>
                    <div class="flex items-center gap-2">
                      <span *ngIf="s.loading" class="animate-spin h-3 w-3 border-2 border-primary border-t-transparent rounded-full"></span>
                      <span class="text-slate-500">{{ s.episode_count || s.episodes?.length || '?' }} eps</span>
                      <span class="transform transition-transform" [class.rotate-180]="s.expanded">▼</span>
                    </div>
                  </div>

                  <!-- Episodes List (if available and expanded) -->
                  <div *ngIf="s.expanded && s.episodes?.length > 0" class="border-t border-slate-200 dark:border-slate-700">
                    <div *ngFor="let ep of s.episodes" 
                         class="flex items-center gap-3 px-3 py-2 text-xs hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                      
                      <!-- Checkbox (only if tracked) -->
                      <input 
                        *ngIf="item.tracking"
                        type="checkbox" 
                        [checked]="ep.watched"
                        (change)="toggleEpisode(ep, s)"
                        class="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary cursor-pointer"
                      >
                      
                      <span class="text-slate-400 font-mono w-6 text-right">{{ ep.episode_number }}</span>
                      <span class="truncate flex-1" [class.line-through]="ep.watched && item.tracking" [class.text-slate-400]="ep.watched && item.tracking">
                        {{ ep.title }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4 mb-8">
             <div class="p-4 rounded-xl bg-slate-50 dark:bg-slate-800">
                <span class="block text-xs uppercase text-slate-400 mb-1">
                    {{ item.type === 'movie' ? 'Duración' : (item.type === 'game' ? 'Tiempo Estimado' : (item.type === 'book' ? 'Páginas' : 'Episodios')) }}
                </span>
                <span class="font-bold text-slate-700 dark:text-slate-200">
                    {{ item.metadata.total_prog || '?' }} 
                    {{ item.type === 'movie' ? 'min' : (item.type === 'game' ? 'h' : '') }}
                </span>
             </div>
             
             <!-- Progress Input (For Non-Shows or Manual Override) -->
             <div *ngIf="item.tracking && item.type !== 'show'" class="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 flex flex-col justify-center">
                <span class="block text-xs uppercase text-slate-400 mb-1">Tu Progreso</span>
                <div class="flex items-center gap-2">
                   <input 
                      type="number" 
                      [value]="item.tracking.progress" 
                      (change)="updateManualProgress($event)"
                      class="w-20 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-sm font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary"
                      min="0"
                      [max]="item.metadata.total_prog || 99999"
                   >
                   <span class="text-xs text-slate-500">
                      / {{ item.metadata.total_prog || '?' }} {{ item.type === 'movie' ? 'min' : (item.type === 'game' ? '%' : 'pgs') }}
                   </span>
                </div>
             </div>

             <!-- Placeholder for Rating (Moved if input is shown) -->
             <div *ngIf="!item.tracking || item.type === 'show'" class="p-4 rounded-xl bg-slate-50 dark:bg-slate-800">
                <span class="block text-xs uppercase text-slate-400 mb-1">Nota</span>
                <span class="font-bold text-slate-700 dark:text-slate-200">
                    {{ (item.metadata['rating'] || item.tracking?.rating) ? (item.metadata['rating'] || item.tracking?.rating | number:'1.1-1') : 'N/A' }}
                </span>
             </div>
          </div>

          <div class="mt-auto pt-4 border-t border-slate-100 dark:border-slate-800 flex gap-4">
             
             <button 
                (click)="toggleTrack()"
                class="flex-1 py-3 px-6 rounded-xl font-bold shadow-lg transition-all active:scale-95 flex justify-center items-center gap-2"
                [ngClass]="item.tracking ? 'bg-slate-200 dark:bg-slate-700 hover:bg-red-100 dark:hover:bg-red-900/30 text-slate-700 dark:text-slate-200 hover:text-red-600 dark:hover:text-red-400' : 'bg-primary hover:bg-primary-dark text-white shadow-primary/30'">
                <span>{{ item.tracking ? 'Dejar de seguir' : 'Añadir a Biblioteca' }}</span>
             </button>
             
             <button class="py-3 px-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                Compartir
             </button>

          </div>

        </div>

      </div>
    </div>
  `,
   styles: [`
    .animate-fade-in { animation: fadeIn 0.2s ease-out; }
    .animate-scale-up { animation: scaleUp 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
    
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes scaleUp { from { opacity: 0; transform: scale(0.95) translateY(10px); } to { opacity: 1; transform: scale(1) translateY(0); } }
  `]
})
export class MediaDetailModalComponent {
   private _item: UniversalMediaItem | null = null;

   @Input()
   set item(value: UniversalMediaItem | null) {
      this._item = value;
      this.details = null;

      if (value) {
         this.loadDetails(value);
      }
   }

   get item(): UniversalMediaItem | null {
      return this._item;
   }
   @Output() close = new EventEmitter<void>();
   @Output() statusUpdated = new EventEmitter<void>();

   mediaService = inject(MediaService);
   supabase = inject(SupabaseService);
   toast = inject(ToastService);

   details: any = null;
   loadingDetails = false;
   showDeleteConfirm = false;

   async toggleTrack() {
      if (!this.item) return;

      const { data: { session } } = await this.supabase.client.auth.getSession();
      if (!session?.user) {
         this.toast.info('Por favor inicia sesión para guardar.');
         return;
      }

      // If already tracking -> Request Confirmation
      if (this.item.tracking) {
         this.showDeleteConfirm = true;
         return;
      }

      // If NOT tracking -> Add
      this.mediaService.trackItem(session.user.id, this.item)
         .then(async (res: any) => {
            this.toast.success(`Seguido ${this.item!.title}`);

            // Manually recreate tracking object to update UI immediately
            if (this.item && res && res.tracking_id) {
               this.item.tracking = {
                  id: res.tracking_id,
                  status: 'pending',
                  progress: 0,
                  rating: null
               };
            }

            this.statusUpdated.emit();
            // We dont close the modal so user can interact
         })
         .catch(e => {
            console.error(e);
            this.toast.error('Error al añadir.');
         });
   }

   async confirmDelete() {
      if (!this.item?.tracking) return;

      this.mediaService.deleteTracking(this.item.tracking.id)
         .then(() => {
            this.toast.success('Eliminado de la biblioteca');
            if (this.item) this.item.tracking = undefined;
            this.showDeleteConfirm = false;
            this.statusUpdated.emit();
            this.close.emit();
         })
         .catch((e: any) => {
            console.error(e);
            this.toast.error('Error al eliminar');
            this.showDeleteConfirm = false;
         });
   }

   cancelDelete() {
      this.showDeleteConfirm = false;
   }

   async loadDetails(item: UniversalMediaItem) {
      this.loadingDetails = true;
      this.details = null;

      try {
         // 1. Try loading from DB first (if tracked)
         if (item.tracking) {
            const dbData = await this.loadDetailsFromDB(item.tracking.id);
            if (dbData) {
               this.details = dbData;
               this.loadingDetails = false;
               return;
            }
         }

         // 2. Fallback to API Function (stateless)
         const idToUse = item.external_id || item.id;
         const { data, error }: any = await this.supabase.client.functions.invoke('media-details', {
            body: { type: item.type, external_id: idToUse }
         });

         if (error) {
            console.error('Error al cargar detalles', error);
            return;
         }

         if (data) {
            // If we got metadata updates
            if (item.metadata) {
               if (data.metadata?.total_prog) {
                  item.metadata.total_prog = data.metadata.total_prog;
               }
               if (data.metadata?.extra_info) {
                  item.metadata.extra_info = data.metadata.extra_info;
               }
            }

            // For shows
            if (item.type === 'show' && data.seasons) {
               data.seasons.forEach((s: any) => s.expanded = false);
            }

            this.details = data;
         }

      } catch (e) {
         console.error('Error al invocar media-details', e);
      } finally {
         this.loadingDetails = false;
      }
   }

   private async loadDetailsFromDB(trackingId: string): Promise<any> {
      const userId = (await this.supabase.client.auth.getSession()).data.session?.user?.id;
      if (!userId) return null;

      if (this.item?.type === 'show') {
         const { data: trackData } = await (this.supabase.client
            .from('user_media_items') as any)
            .select('show_id, show:catalog_shows(total_seasons, total_episodes)')
            .eq('id', trackingId)
            .single();

         if (!trackData?.show_id) return null;
         const showId = trackData.show_id;
         const showMeta = trackData.show as any;

         const { data: seasons } = await (this.supabase.client
            .from('catalog_seasons') as any)
            .select(`
                   *,
                   episodes:catalog_episodes(
                       *,
                       user_episodes(watched, id)
                   )
               `)
            .eq('show_id', showId)
            .order('season_number');

         if (!seasons || seasons.length === 0) return null;

         return {
            number_of_seasons: showMeta.total_seasons,
            number_of_episodes: showMeta.total_episodes,
            seasons: seasons.map((s: any) => ({
               id: s.id,
               name: s.title,
               season_number: s.season_number,
               episode_count: s.episode_count,
               expanded: false,
               episodes: (s.episodes || []).map((e: any) => {
                  const userEp = e.user_episodes?.[0];
                  return {
                     id: e.id,
                     episode_number: e.episode_number,
                     title: e.title,
                     watched: !!userEp?.watched,
                     user_episode_id: userEp?.id
                  };
               }).sort((a: any, b: any) => a.episode_number - b.episode_number)
            }))
         };
      }
      return null;
   }

   async toggleSeason(season: any) {
      // ... same logic
      season.expanded = !season.expanded;

      if (season.expanded && !this.item?.tracking && (!season.episodes || season.episodes.length === 0)) {
         season.loading = true;
         try {
            const idToUse = this.item?.external_id || this.item?.id;
            const { data, error }: any = await this.supabase.client.functions.invoke('media-details', {
               body: {
                  type: 'show',
                  external_id: idToUse,
                  season_number: season.season_number
               }
            });

            if (error) {
               console.error('Error fetching season details', error);
               return;
            }

            if (data && data.episodes) {
               season.episodes = data.episodes.map((e: any) => ({
                  id: e.id,
                  episode_number: e.episode_number,
                  title: e.title,
                  watched: false
               }));
            }
         } catch (e) {
            console.error('Error in toggleSeason', e);
         } finally {
            season.loading = false;
         }
      }
   }

   async toggleEpisode(ep: any, season: any) {
      if (!this.item?.tracking) return;

      const newStatus = !ep.watched;
      ep.watched = newStatus;

      const { data: { session } } = await this.supabase.client.auth.getSession();
      if (!session?.user) return;

      if (newStatus) {
         const { error } = await (this.supabase.client
            .from('user_episodes') as any)
            .upsert({
               user_id: session.user.id,
               show_id: this.details.seasons[0]?.episodes[0]?.show_id || (await this.getShowId()),
               season_id: season.id,
               episode_id: ep.id,
               watched: true,
               watched_at: new Date().toISOString()
            }, { onConflict: 'user_id, episode_id' });

         if (error) {
            ep.watched = !newStatus;
            this.toast.error('Error al guardar episodio');
         }
      } else {
         if (ep.user_episode_id) {
            const { error } = await (this.supabase.client
               .from('user_episodes') as any)
               .update({ watched: false, watched_at: null })
               .eq('id', ep.user_episode_id);

            if (error) {
               ep.watched = !newStatus;
            }
         }
      }

      this.updateProgress();
   }

   private async getShowId(): Promise<string | null> {
      if (this.item?.tracking) {
         const { data } = await (this.supabase.client
            .from('user_media_items') as any)
            .select('show_id')
            .eq('id', this.item.tracking.id)
            .single();
         return data?.show_id;
      }
      return null;
   }

   private async updateProgress() {
      let watchedCount = 0;
      this.details?.seasons?.forEach((s: any) => {
         s.episodes?.forEach((e: any) => {
            if (e.watched) watchedCount++;
         });
      });

      if (this.item?.tracking) {
         this.mediaService.updateTracking(this.item.tracking.id, { progress: watchedCount });
         this.item.tracking.progress = watchedCount;
         this.statusUpdated.emit();
      }
   }
   async updateManualProgress(event: any) {
      if (!this.item?.tracking) return;

      let val = parseInt(event.target.value);
      if (isNaN(val) || val < 0) val = 0;

      // Optional: Cap at total
      if (this.item.metadata.total_prog && val > this.item.metadata.total_prog) {
         val = this.item.metadata.total_prog;
         event.target.value = val;
      }

      // If finished, logic can be added here

      const { error } = await this.mediaService.updateTracking(this.item.tracking.id, { progress: val });

      if (error) {
         this.toast.error('Error al actualizar progreso');
      } else {
         if (this.item.tracking) this.item.tracking.progress = val;
         this.statusUpdated.emit();
         this.toast.success('Progreso actualizado');
      }
   }
}
