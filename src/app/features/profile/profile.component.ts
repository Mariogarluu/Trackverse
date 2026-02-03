import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SupabaseService } from '../../core/supabase.service';
import { MediaCardComponent } from '../../shared/components/media-card/media-card.component';
import { EditProfileModalComponent } from './edit-profile-modal.component';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, MediaCardComponent, EditProfileModalComponent],
  template: `
    <div class="min-h-screen bg-background-light dark:bg-background-dark text-slate-800 dark:text-slate-100 p-6 pb-24">
      
      <!-- Edit Profile Modal -->
      <app-edit-profile-modal *ngIf="isEditing()"
        [profile]="profile()"
        (close)="isEditing.set(false)"
        (profileUpdated)="refreshProfile()"
      ></app-edit-profile-modal>
      
      <!-- Profile Header -->
      <div class="flex flex-col items-center mb-8">
        <div class="w-24 h-24 rounded-full p-1 bg-gradient-to-br from-primary to-accent mb-4">
          <div class="w-full h-full rounded-full border-4 border-background-light dark:border-background-dark overflow-hidden bg-slate-200">
             <img [src]="profile()?.avatar_url || 'https://i.pravatar.cc/150?u=me'" class="w-full h-full object-cover">
          </div>
        </div>
        <h1 class="text-2xl font-bold">{{ profile()?.username || 'Usuario Invitado' }}</h1>
        <p class="text-slate-500 text-sm max-w-xs text-center mt-1">{{ profile()?.bio || 'Coleccionando recuerdos.' }}</p>
        
        <button (click)="isEditing.set(true)" class="mt-4 px-6 py-2 rounded-full border border-slate-300 dark:border-slate-700 text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
          Editar Perfil
        </button>
      </div>

      <!-- Stats Row -->
      <div class="grid grid-cols-3 gap-4 mb-8">
        <div class="bg-surface-light dark:bg-surface-dark p-4 rounded-xl text-center shadow-sm border border-slate-100 dark:border-slate-800">
          <span class="block text-2xl font-bold text-primary">{{ stats().watching }}</span>
          <span class="text-xs text-slate-500 uppercase tracking-wider">Activo</span>
        </div>
        <div class="bg-surface-light dark:bg-surface-dark p-4 rounded-xl text-center shadow-sm border border-slate-100 dark:border-slate-800">
          <span class="block text-2xl font-bold text-green-500">{{ stats().completed }}</span>
          <span class="text-xs text-slate-500 uppercase tracking-wider">Completado</span>
        </div>
        <div class="bg-surface-light dark:bg-surface-dark p-4 rounded-xl text-center shadow-sm border border-slate-100 dark:border-slate-800">
          <span class="block text-2xl font-bold text-accent">{{ stats().planned }}</span>
          <span class="text-xs text-slate-500 uppercase tracking-wider">Pendiente</span>
        </div>
      </div>

      <!-- Recent Activity / Favorites Section -->
      <h2 class="text-lg font-bold mb-4">Reciente</h2>
      <!-- Placeholder for recent items grid -->
      <div class="h-32 bg-slate-100 dark:bg-slate-800/50 rounded-xl flex items-center justify-center text-slate-400 border border-dashed border-slate-300 dark:border-slate-700">
        <p>No hay actividad reciente</p>
      </div>

    </div>
  `
})
export class ProfileComponent implements OnInit {
  supabase = inject(SupabaseService);

  profile = signal<any>(null);
  stats = signal({ watching: 0, completed: 0, planned: 0 });
  isEditing = signal(false);

  ngOnInit() {
    this.refreshProfile();
  }

  async refreshProfile() {
    // 1. Get Current User
    const { data: { user } } = await this.supabase.client.auth.getUser();
    if (!user) return;

    // 2. Fetch Profile
    const { data: profile } = await this.supabase.client
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profile) {
      this.profile.set(profile);
    }

    // 3. Fetch Tracking Stats
    const { data: items } = await this.supabase.getUserMediaItems(user.id);

    if (items) {
      const watching = items.filter((i: any) => i.status === 'watching').length;
      const completed = items.filter((i: any) => i.status === 'completed').length;
      const planned = items.filter((i: any) => i.status === 'pending').length;

      this.stats.set({ watching, completed, planned });
    }
  }
}
