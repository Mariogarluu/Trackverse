import { Injectable, signal, computed, inject } from '@angular/core';
import { SupabaseService } from '../../../core/supabase.service';
import { UniversalMediaItem, MediaType } from '../../../models/media';

@Injectable({
    providedIn: 'root'
})
/**
 * Servicio encargado de generar recomendaciones aleatorias ("Dice Roll").
 * 
 * Analiza la biblioteca del usuario y sugiere qué ver/jugar/leer a continuación
 * basándose en el estado (Viéndolo o Pendiente).
 */
export class RecommendationService {
    private supabase = inject(SupabaseService);

    // Signals for state
    private _recommendation = signal<UniversalMediaItem | null>(null);
    readonly recommendation = this._recommendation.asReadonly();

    private _loading = signal<boolean>(false);
    readonly loading = this._loading.asReadonly();

    /**
     * Genera una recomendación aleatoria para el usuario.
     * 
     * Prioridad:
     * 1. Ítems actualmente en estado 'watching' (Viendo/Jugando), para fomentar terminar lo empezado.
     * 2. Ítems en 'pending' (Pendientes), si no hay nada en curso.
     * 
     * Actualiza el signal `recommendation` con el resultado.
     * 
     * @param userId El ID del usuario.
     */
    async rollDice(userId: string) {
        this._loading.set(true);
        try {
            const { data, error } = await this.supabase.client
                .from('user_media_items')
                .select(`
          *,
          game:catalog_games(*),
          show:catalog_shows(*),
          book:catalog_books(*)
        `)
                .eq('user_id', userId)
                .in('status', ['watching', 'pending']);

            if (error || !data || data.length === 0) {
                this._recommendation.set(null);
                return;
            }

            // Filter and Transform
            const watching = [];
            const pending = [];

            for (const itemObj of data) {
                const item = itemObj as any;
                const universalItem = this.mapToUniversal(item);
                // 'status' is a text column in DB, so it's a string. Safe to compare.
                if (item.status === 'watching') watching.push(universalItem);
                else if (item.status === 'pending') pending.push(universalItem);
            }

            let chosen: UniversalMediaItem | null = null;

            // Logic: 1st Priority 'watching', 2nd Priority 'pending'
            if (watching.length > 0) {
                // Pick random from watching
                const idx = Math.floor(Math.random() * watching.length);
                chosen = watching[idx];
            } else if (pending.length > 0) {
                // Pick random from pending (weighted logic could be added here, currently simple random)
                const idx = Math.floor(Math.random() * pending.length);
                chosen = pending[idx];
            }

            this._recommendation.set(chosen);

        } catch (e) {
            console.error('Error rolling dice', e);
            this._recommendation.set(null);
        } finally {
            this._loading.set(false);
        }
    }

    // Private Helper to normalize data
    private mapToUniversal(dbItem: any): UniversalMediaItem {
        let type: MediaType = 'game';
        let title = '';
        let cover = '';
        let metadata: any = {};

        if (dbItem.game) {
            type = 'game';
            title = dbItem.game.title;
            cover = dbItem.game.cover_url;
            metadata = { creator: dbItem.game.developer, extra_info: dbItem.game.platforms?.join(', ') };
        } else if (dbItem.show) {
            type = 'show';
            title = dbItem.show.title;
            cover = dbItem.show.cover_url;
            metadata = { creator: dbItem.show.network, extra_info: `${dbItem.show.total_seasons} Seasons` };
        } else if (dbItem.book) {
            type = 'book';
            title = dbItem.book.title;
            cover = dbItem.book.cover_url;
            metadata = { creator: dbItem.book.author, extra_info: dbItem.book.type };
        }

        return {
            id: dbItem.id, // user_media_item id
            type,
            title,
            cover_url: cover,
            metadata,
            tracking: {
                status: dbItem.status,
                progress: dbItem.progress,
                rating: dbItem.rating,
                id: dbItem.id
            }
        };
    }
}
