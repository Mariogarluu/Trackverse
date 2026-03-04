import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { UniversalMediaItem, MediaType, MediaStatus } from '../models/media';
import { PostgrestSingleResponse } from '@supabase/supabase-js';

@Injectable({
    providedIn: 'root'
})
/**
 * Servicio encargado de la gestión de elementos multimedia.
 * 
 * Maneja la obtención de la biblioteca del usuario, la actualización del progreso
 * y el cálculo de porcentajes de completado para juegos, series y libros.
 */
export class MediaService {
    private supabase = inject(SupabaseService);

    /**
     * Calcula el porcentaje de completado de un ítem.
     * 
     * Lógica: (progreso_actual / total_en_catálogo) * 100
     * 
     * @param item El ítem multimedia del cual calcular el progreso.
     * @returns El porcentaje de progreso (0-100).
     */
    calculateProgressPercentage(item: UniversalMediaItem): number {
        if (!item.tracking || !item.metadata.total_prog) return 0;

        // Safety check for 0 total to avoid division by zero
        if (item.metadata.total_prog === 0) return 0;

        const percent = (item.tracking.progress / item.metadata.total_prog) * 100;
        return Math.min(Math.round(percent), 100); // Cap at 100%
    }

    /**
     * Obtiene todos los ítems seguidos por un usuario y los normaliza.
     * 
     * @param userId El ID del usuario.
     * @returns Una promesa con la lista de ítems multimedia.
     */
    async getLibrary(userId: string): Promise<UniversalMediaItem[]> {
        const { data, error } = await this.supabase.getUserMediaItems(userId);

        if (error || !data) return [];

        return data.map((item: any) => this.mapToUniversal(item));
    }

    /**
     * Actualiza el estado, calificación o progreso de un ítem.
     * 
     * @param itemId El ID del ítem en la tabla `user_media_items`.
     * @param updates Objeto con los campos a actualizar.
     */
    async updateTracking(itemId: string, updates: {
        status?: MediaStatus,
        progress?: number,
        rating?: number
    }) {
        return await (this.supabase.client
            .from('user_media_items') as any)
            .update(updates)
            .eq('id', itemId);
    }

    /**
     * Elimina un ítem de la biblioteca del usuario.
     * Borra la fila de `user_media_items` por su ID.
     */
    async deleteTracking(itemId: string) {
        return await (this.supabase.client
            .from('user_media_items') as any)
            .delete()
            .eq('id', itemId);
    }

    /**
     * Añade un nuevo ítem al seguimiento del usuario.
     * 
     * Utiliza una función RPC ('track_new_item') para:
     * 1. Verificar si el ítem ya existe en el catálogo (por external_id).
     * 2. Si no existe, crearlo (usando title, cover, metadata).
     * 3. Crear la relación en user_media_items.
     * 
     * @param userId El ID del usuario.
     * @param item El objeto UniversalMediaItem completo (obtenido de la búsqueda).
     */
    async trackItem(userId: string, item: UniversalMediaItem) {
        const creator = item.metadata?.creator || null;
        const total = item.metadata?.total_prog || 0; // Maps to time_to_beat / episodes / pages

        const { data, error } = await this.supabase.client
            .rpc('track_new_item', {
                p_user_id: userId,
                p_type: item.type,
                p_external_id: item.id, // e.g., 'game-123'
                p_title: item.title,
                p_cover_url: item.cover_url,
                p_creator: creator,
                p_total: total,
                p_status: 'pending'
            } as any);

        if (error) {
            console.warn('RPC track_new_item failed (likely missing). Falling back to client-side logic.', error);
            // Fallback: Client-side logic
            return this.trackItemClientSide(userId, item, creator, total);
        }

        if (item.type === 'show') {
            // Trigger background sync for shows if needed
            // For now, reliance on RPC is sufficient for basic tracking
        }

        return { data, error };
    }

    /**
     * Fallback logic to track items if the RPC is missing.
     * Performs the Check -> Insert Catalog -> Insert Tracking flow manually.
     */
    async trackItemClientSide(userId: string, item: UniversalMediaItem, creator: string | null, total: number) {
        // 1. Determine Table and Fields
        let catalogTable = '';
        let foreignKey = '';
        let payload: any = {
            title: item.title,
            cover_url: item.cover_url,
            external_id: item.id
        };

        if (item.type === 'game') {
            catalogTable = 'catalog_games';
            foreignKey = 'game_id';
            payload.developer = creator;
            payload.time_to_beat = total;
        } else if (item.type === 'show') {
            catalogTable = 'catalog_shows';
            foreignKey = 'show_id';
            payload.total_episodes = total;
            payload.network = creator;
        } else if (item.type === 'book') {
            catalogTable = 'catalog_books';
            foreignKey = 'book_id';
            payload.author = creator;
            payload.total_pages = total;
        } else if (item.type === 'movie') {
            catalogTable = 'catalog_movies';
            foreignKey = 'movie_id';
            // payload.release_date is handled if data exists, but minimal payload:
            payload.runtime = total;
        } else {
            throw new Error('Invalid Type');
        }

        // 2. Check Catalog
        const { data: existing, error: findError } = await this.supabase.client
            .from(catalogTable)
            .select('id')
            .eq('external_id', item.id)
            .maybeSingle();

        let catalogId;

        if (existing) {
            catalogId = (existing as any).id;
        } else {
            // 3. Insert into Catalog
            const { data: created, error: createError } = await (this.supabase.client
                .from(catalogTable) as any)
                .insert(payload)
                .select('id')
                .single();

            if (createError) {
                // Optimization: Concurrency might cause duplicate key error if another user inserted it just now.
                // Retry fetch
                const { data: retry } = await this.supabase.client
                    .from(catalogTable)
                    .select('id')
                    .eq('external_id', item.id)
                    .maybeSingle();

                if (retry) catalogId = (retry as any).id;
                else throw createError; // Real error
            } else {
                catalogId = created.id;
            }
        }

        // 4. Insert Tracking
        const trackingPayload = {
            user_id: userId,
            status: 'pending',
            [foreignKey]: catalogId
        };

        return await (this.supabase.client
            .from('user_media_items') as any)
            .insert(trackingPayload)
            .select();
    }

    // Reuse logic or centralize this mapper if used in multiple places
    private mapToUniversal(dbItem: any): UniversalMediaItem {
        let type: MediaType = 'game';
        let title = '';
        let cover = '';
        let metadata: any = {};
        let total = 0;
        let externalId: string | undefined;

        if (dbItem.game) {
            type = 'game';
            title = dbItem.game.title;
            cover = dbItem.game.cover_url;
            total = dbItem.game.time_to_beat || 0;
            externalId = dbItem.game.external_id;
            metadata = { creator: dbItem.game.developer, extra_info: dbItem.game.platforms?.join(', '), total_prog: total };
        } else if (dbItem.show) {
            type = 'show';
            title = dbItem.show.title;
            cover = dbItem.show.cover_url;
            externalId = dbItem.show.external_id;
            // For shows, progress might be episodes
            total = dbItem.show.total_episodes || 0;
            const seasons = dbItem.show.total_seasons;
            metadata = { creator: dbItem.show.network, extra_info: seasons ? `${seasons} Seasons` : 'Seasons N/A', total_prog: total };
        } else if (dbItem.book) {
            type = 'book';
            title = dbItem.book.title;
            cover = dbItem.book.cover_url;
            total = dbItem.book.total_pages || 0;
            externalId = dbItem.book.external_id;
            metadata = { creator: dbItem.book.author, extra_info: dbItem.book.type, total_prog: total };
        } else if (dbItem.movie) {
            type = 'movie';
            title = dbItem.movie.title;
            cover = dbItem.movie.poster_path; // or cover_url if strict
            total = dbItem.movie.runtime || 0;
            externalId = dbItem.movie.external_id;
            metadata = { creator: 'Movie', extra_info: dbItem.movie.release_date ? dbItem.movie.release_date.split('-')[0] : 'N/A', total_prog: total };
        }

        return {
            id: dbItem.id,
            external_id: externalId,
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
