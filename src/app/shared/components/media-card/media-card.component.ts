import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UniversalMediaItem } from '../../../models/media';

@Component({
  selector: 'app-media-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="group relative w-full bg-surface-light dark:bg-surface-dark rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden cursor-pointer border border-slate-100 dark:border-slate-800">
      
      <!-- Cover Image -->
      <div class="relative aspect-[2/3] w-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
        <img 
          [src]="item.cover_url || 'assets/placeholder-portrait.svg'" 
          [alt]="item.title"
          class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        >
        
        <!-- Status Badge -->
        <div *ngIf="item.tracking?.status" class="absolute top-2 right-2 px-2 py-0.5 rounded text-xs font-medium uppercase tracking-wider shadow-sm bg-surface-light/90 dark:bg-surface-dark/90 text-primary">
          {{ item.tracking?.status }}
        </div>
        
        <!-- Type Badge (Bottom Left) -->
        <div class="absolute bottom-2 left-2 px-1.5 py-0.5 rounded text-[10px] uppercase font-bold text-white bg-black/40 backdrop-blur-sm">
          {{ item.type }}
        </div>
      </div>

      <!-- Content -->
      <div class="p-3">
        <h3 class="font-bold text-slate-800 dark:text-slate-100 text-sm truncate leading-tight mb-1">{{ item.title }}</h3>
        <div class="flex items-center justify-between text-xs text-slate-500">
            <span class="truncate max-w-[60%]">{{ item.metadata.creator }}</span>
            <span class="font-medium opacity-80">{{ item.metadata.extra_info }}</span>
        </div>
        
        <!-- Progress Bar (if tracked) -->
        <div *ngIf="item.tracking" class="mt-3">
          <div class="flex justify-between text-[10px] text-slate-400 mb-1">
            <span>{{ ProgressText }}</span>
          </div>
          <div class="h-1 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
            <div 
              class="h-full bg-primary transition-all duration-500"
              [style.width.%]="CompletedPercentage"
            ></div>
          </div>
        </div>
      </div>

      <!-- Hover Overlay Actions -->


    </div>
  `
})
export class MediaCardComponent {
  @Input({ required: true }) item!: UniversalMediaItem;

  get CompletedPercentage(): number {
    if (!this.item.tracking || !this.item.metadata.total_prog) return 0;
    if (this.item.metadata.total_prog === 0) return 0;
    return Math.min((this.item.tracking.progress / this.item.metadata.total_prog) * 100, 100);
  }

  get ProgressText(): string {
    const current = this.item.tracking?.progress || 0;
    const total = this.item.metadata.total_prog;

    if (!total) return `${current}`;

    switch (this.item.type) {
      case 'show': return `${current} / ${total} eps`;
      case 'book': return `${current} / ${total} pgs`;
      case 'movie': return `${current} / ${total} min`;
      case 'game': return `${Math.round(this.CompletedPercentage)}%`;
      default: return `${Math.round(this.CompletedPercentage)}%`;
    }
  }
}
