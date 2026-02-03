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
        
        <!-- Close Button -->
        <button (click)="close.emit()" class="absolute top-4 right-4 z-10 p-2 bg-black/20 hover:bg-black/40 rounded-full text-white transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <!-- Cover Image (Left Side) -->
        <div class="w-full md:w-2/5 h-64 md:h-auto relative bg-slate-900">
           <img 
             [src]="item.cover_url || 'assets/placeholder-portrait.jpg'" 
             [alt]="item.title"
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

          <div class="prose dark:prose-invert max-w-none mb-8 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
             <p>{{ item.description || 'Sin descripción disponible.' }}</p>
          </div>

          <div class="grid grid-cols-2 gap-4 mb-8">
             <div class="p-4 rounded-xl bg-slate-50 dark:bg-slate-800">
                <span class="block text-xs uppercase text-slate-400 mb-1">Progreso Total</span>
                <span class="font-bold text-slate-700 dark:text-slate-200">{{ item.metadata.total_prog || '?' }}</span>
             </div>
             <!-- Placeholder for Provider or Rating -->
             <div class="p-4 rounded-xl bg-slate-50 dark:bg-slate-800">
                <span class="block text-xs uppercase text-slate-400 mb-1">Nota</span>
                <span class="font-bold text-slate-700 dark:text-slate-200">N/A</span>
             </div>
          </div>

          <div class="mt-auto pt-4 border-t border-slate-100 dark:border-slate-800 flex gap-4">
             <button 
                (click)="trackItem()"
                class="flex-1 py-3 px-6 rounded-xl bg-primary hover:bg-primary-dark text-white font-bold shadow-lg shadow-primary/30 transition-all active:scale-95 flex justify-center items-center gap-2">
                <span>{{ item.tracking ? 'Actualizar Estado' : 'Añadir a Biblioteca' }}</span>
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
   @Input() item: UniversalMediaItem | null = null;
   @Output() close = new EventEmitter<void>();
   @Output() statusUpdated = new EventEmitter<void>();

   mediaService = inject(MediaService);
   supabase = inject(SupabaseService);
   toast = inject(ToastService);

   async trackItem() {
      if (!this.item) return;

      const { data: { session } } = await this.supabase.client.auth.getSession();
      if (!session?.user) {
         this.toast.info('Por favor inicia sesión para guardar.');
         return;
      }

      // Quick add (same as card for now, simple toggle)
      this.mediaService.trackItem(session.user.id, this.item)
         .then(() => {
            this.toast.success(`Seguido ${this.item!.title}`);
            this.statusUpdated.emit();
            this.close.emit();
         })
         .catch(e => {
            console.error(e);
            this.toast.error('Error al actualizar.');
         });
   }
}
