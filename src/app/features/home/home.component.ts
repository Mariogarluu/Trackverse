import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RecommendationService } from './services/recommendation.service';
import { SupabaseService } from '../../core/supabase.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="min-h-screen bg-background-light dark:bg-background-dark text-slate-800 dark:text-slate-100 flex flex-col items-center justify-center p-6 transition-colors duration-300">
      
      <!-- Header / Branding -->
      <header class="absolute top-10 w-full flex justify-center">
        <img src="/Tackverse_logo_completo.png" alt="TrackVerse Logo" class="h-12 w-auto">
      </header>

      <!-- Main Action: Shuffle -->
      <div class="flex flex-col items-center gap-8 w-full max-w-md">
        
        <button 
          (click)="onShuffle()"
          [disabled]="recService.loading()"
          class="group relative w-24 h-24 rounded-full bg-gradient-to-br from-primary to-secondary shadow-lg hover:shadow-primary/50 transition-all duration-300 transform hover:scale-110 active:scale-95 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed">
          
          <span *ngIf="!recService.loading(); else loader" class="text-white text-3xl">🎲</span>
          
          <ng-template #loader>
            <div class="animate-spin h-8 w-8 border-4 border-white border-t-transparent rounded-full"></div>
          </ng-template>

          <!-- Pulse Effect -->
          <div class="absolute inset-0 rounded-full bg-primary opacity-20 group-hover:animate-ping"></div>
        </button>

        <p class="text-sm text-slate-500 tracking-wide uppercase">Tap to Shuffle</p>
      </div>

      <!-- Recommendation Card -->
      <div *ngIf="recService.recommendation() as item" class="mt-12 w-full max-w-sm animate-fade-in-up">
        <div class="bg-surface-light dark:bg-surface-dark rounded-2xl shadow-xl overflow-hidden border border-slate-200 dark:border-slate-800">
          
          <!-- Cover Image -->
          <div class="relative h-64 w-full bg-slate-200 dark:bg-slate-800">
            <img 
              [src]="item.cover_url || 'assets/placeholder.jpg'" 
              [alt]="item.title"
              class="object-cover w-full h-full"
            >
            <div class="absolute top-4 right-4 bg-black/50 backdrop-blur-md text-white text-xs px-2 py-1 rounded-md uppercase tracking-bold">
              {{ item.type }}
            </div>
            <div class="absolute bottom-0 inset-x-0 h-24 bg-gradient-to-t from-black/80 to-transparent"></div>
          </div>

          <!-- Content -->
          <div class="p-6 relative">
             <!-- Floating Action Button for Status -->
            <button class="absolute -top-6 right-6 h-12 w-12 bg-accent rounded-full shadow-lg flex items-center justify-center text-white hover:bg-yellow-500 transition-colors">
              <span class="text-xl">▶</span>
            </button>

            <h2 class="text-xl font-bold mb-1 truncate">{{ item.title }}</h2>
            <p class="text-sm text-slate-500 mb-4">{{ item.metadata.creator }}</p>

            <div class="flex items-center justify-between mt-4 border-t border-slate-100 dark:border-slate-700 pt-4">
              <div class="flex flex-col">
                <span class="text-xs text-slate-400 uppercase">Status</span>
                <span class="text-sm font-medium capitalize text-primary">{{ item.tracking?.status }}</span>
              </div>
              <div class="flex flex-col items-end">
                <span class="text-xs text-slate-400 uppercase">Progress</span>
                <span class="text-sm font-medium">{{ item.tracking?.progress }} / {{ item.metadata.total_prog || '?' }}</span>
              </div>
            </div>
          </div>

        </div>
      </div>

    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
    .animate-fade-in-up {
      animation: fadeInUp 0.5s ease-out forwards;
    }
    @keyframes fadeInUp {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `]
})
export class HomeComponent {
  recService = inject(RecommendationService);
  supabase = inject(SupabaseService);

  async onShuffle() {
    const { data: { session } } = await this.supabase.client.auth.getSession();
    if (session?.user) {
      this.recService.rollDice(session.user.id);
    } else {
      // Optional: Redirect to login or show generic recs
      console.warn('User not logged in, cannot roll dice based on library');
    }
  }
}
