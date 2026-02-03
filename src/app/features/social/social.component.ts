import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SupabaseService } from '../../core/supabase.service';

// Interfaces for data
interface Activity {
  id: string;
  user: {
    username: string;
    avatar_url: string;
  };
  action: 'started' | 'completed' | 'rated' | 'want_to_play';
  item: {
    title: string;
    type: 'game' | 'show' | 'book';
    cover_url: string;
  };
  timestamp: string;
}

@Component({
  selector: 'app-social',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="min-h-screen bg-background-light dark:bg-background-dark text-slate-800 dark:text-slate-100 p-6 pb-24">
      
      <header class="mb-8 flex justify-between items-center">
        <h1 class="text-3xl font-light tracking-wide">Activity</h1>
        <button class="bg-surface-light dark:bg-surface-dark p-2 rounded-full shadow-sm hover:shadow-md transition-all">
          <span class="text-xl">➕</span>
        </button>
      </header>

      <!-- Friends Row (Horizontal Scroll) -->
      <div class="flex gap-4 overflow-x-auto pb-6 -mx-6 px-6 mb-4">
        <div *ngFor="let friend of friends()" class="flex flex-col items-center gap-2 cursor-pointer group">
          <div class="w-16 h-16 rounded-full p-0.5 bg-gradient-to-tr from-primary to-accent">
            <div class="w-full h-full rounded-full border-2 border-background-light dark:border-background-dark overflow-hidden bg-slate-200">
               <img [src]="friend.avatar || 'assets/placeholder.jpg'" class="w-full h-full object-cover">
            </div>
          </div>
          <span class="text-xs font-medium text-slate-500 group-hover:text-primary transition-colors">{{ friend.name }}</span>
        </div>
      </div>

      <!-- Feed -->
      <div class="flex flex-col gap-6 max-w-2xl mx-auto">
        
        <div *ngFor="let activity of feed()" class="bg-surface-light dark:bg-surface-dark rounded-xl p-4 shadow-sm border border-slate-100 dark:border-slate-800 flex gap-4">
          
          <!-- Avatar -->
          <img [src]="activity.user.avatar_url" class="w-12 h-12 rounded-full object-cover bg-slate-200 flex-shrink-0">
          
          <!-- Content -->
          <div class="flex-1">
            <div class="flex justify-between items-start mb-1">
              <p class="text-sm">
                <span class="font-bold text-slate-900 dark:text-white">{{ activity.user.username }}</span>
                <span class="text-slate-500"> {{ getActionText(activity.action) }} </span>
              </p>
              <span class="text-xs text-slate-400">{{ activity.timestamp }}</span>
            </div>

            <!-- Media Embed -->
            <div class="mt-2 flex gap-3 bg-slate-50 dark:bg-slate-900/50 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors cursor-pointer">
              <div class="w-12 h-16 bg-slate-300 rounded overflow-hidden flex-shrink-0">
                <img [src]="activity.item.cover_url" class="w-full h-full object-cover">
              </div>
              <div class="flex flex-col justify-center">
                 <h4 class="font-bold text-sm leading-tight">{{ activity.item.title }}</h4>
                 <span class="text-[10px] uppercase tracking-wide text-slate-500">{{ activity.item.type }}</span>
              </div>
            </div>
            
            <!-- Actions -->
            <div class="flex gap-4 mt-3 text-slate-400">
               <button class="hover:text-red-500 transition-colors flex items-center gap-1 text-xs">
                 <span>❤️</span> Like
               </button>
               <button class="hover:text-primary transition-colors flex items-center gap-1 text-xs">
                 <span>💬</span> Comment
               </button>
            </div>

          </div>

        </div>

        <!-- Empty State -->
        <div *ngIf="feed().length === 0" class="text-center py-10 text-slate-500">
            <p>No recent activity from friends.</p>
        </div>

      </div>

    </div>
  `
})
export class SocialComponent implements OnInit {
  supabase = inject(SupabaseService);

  // Signals
  friends = signal<any[]>([]);
  feed = signal<Activity[]>([]);

  async ngOnInit() {
    const { data: { session } } = await this.supabase.client.auth.getSession();
    const user = session?.user;

    if (!user) {
      // Mock data if no user (for development visualization)
      this.loadMockData();
      return;
    }

    // 1. Fetch Friendships (Accepted)
    const { data: friendships } = await this.supabase.client
      .from('friendships')
      .select('requester_id, receiver_id')
      .eq('status', 'accepted')
      .or(`requester_id.eq.${user.id},receiver_id.eq.${user.id}`);

    if (!friendships || friendships.length === 0) {
      this.loadMockData(); // Fallback to mock if no friends
      return;
    }

    // 2. Extract Friend IDs
    const friendIds = friendships.map((f: any) =>
      f.requester_id === user.id ? f.receiver_id : f.requester_id
    );

    if (friendIds.length === 0) return;

    // 3. Fetch Friend Profiles
    const { data: profiles } = await this.supabase.client
      .from('profiles')
      .select('id, username, avatar_url')
      .in('id', friendIds);

    const profileMap = new Map((profiles || []).map((p: any) => [p.id, p]));

    // Set friends list for header
    this.friends.set(profiles?.map((p: any) => ({ name: p.username, avatar: p.avatar_url })) || []);

    // 4. Fetch Friend Activity
    const { data: activity } = await this.supabase.client
      .from('user_media_items')
      .select(`
                *,
                game:catalog_games(title, cover_url),
                show:catalog_shows(title, cover_url),
                book:catalog_books(title, cover_url)
            `)
      .in('user_id', friendIds)
      .order('updated_at', { ascending: false })
      .limit(20);

    if (activity) {
      const mappedFeed = activity.map((item: any) => {
        const friendProfile = profileMap.get(item.user_id);

        // Normalize Type & Title
        let type: any = 'game';
        let title = 'Unknown';
        let cover = '';

        if (item.game) { type = 'game'; title = item.game.title; cover = item.game.cover_url; }
        else if (item.show) { type = 'show'; title = item.show.title; cover = item.show.cover_url; }
        else if (item.book) { type = 'book'; title = item.book.title; cover = item.book.cover_url; }

        // Infer Action
        let action: any = 'updated';
        if (item.status === 'watching') action = 'started';
        if (item.status === 'completed') action = 'completed';
        if (item.rating) action = 'rated';

        return {
          id: item.id,
          user: {
            username: friendProfile?.username || 'Unknown',
            avatar_url: friendProfile?.avatar_url || 'assets/placeholder.jpg'
          },
          action,
          item: { title, type, cover_url: cover },
          timestamp: new Date(item.updated_at).toLocaleDateString()
        };
      });

      this.feed.set(mappedFeed);
    }
  }

  loadMockData() {
    this.friends.set([
      { name: 'Alex', avatar: 'https://i.pravatar.cc/150?u=alex' },
      { name: 'Sarah', avatar: 'https://i.pravatar.cc/150?u=sarah' },
    ]);
    this.feed.set([
      {
        id: '1',
        user: { username: 'Sarah', avatar_url: 'https://i.pravatar.cc/150?u=sarah' },
        action: 'started',
        item: { title: 'The Last of Us', type: 'show', cover_url: 'https://placehold.co/400x600/black/white?text=TLOU' },
        timestamp: '2h ago'
      },
      {
        id: '2',
        user: { username: 'Alex', avatar_url: 'https://i.pravatar.cc/150?u=alex' },
        action: 'completed',
        item: { title: 'Elden Ring', type: 'game', cover_url: 'https://placehold.co/400x600/black/white?text=Elden' },
        timestamp: '4h ago'
      }
    ]);
  }

  getActionText(action: string): string {
    switch (action) {
      case 'started': return 'started watching';
      case 'completed': return 'completed';
      case 'rated': return 'rated';
      case 'want_to_play': return 'wants to play';
      default: return 'updated';
    }
  }
}
