import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Database } from '../models/supabase';

import { environment } from '../../environments/environment';

@Injectable({
    providedIn: 'root'
})
/**
 * Servicio central para la comunicación con Supabase.
 * 
 * Gestiona la autenticación, las consultas a la base de datos y el almacenamiento de archivos.
 */
export class SupabaseService {
    private supabase: SupabaseClient<Database>;

    constructor() {
        this.supabase = createClient<Database>(
            environment.supabase.url,
            environment.supabase.key
        );
    }

    get client(): SupabaseClient<Database> {
        return this.supabase;
    }

    // Helper to get formatted media items for a user
    // This helps with the polymorphic join complexity
    /**
     * Obtiene los ítems multimedia formateados para un usuario.
     * 
     * Realiza uniones (joins) con las tablas de catálogos (juegos, series, libros)
     * para recuperar la información completa.
     * 
     * @param userId El ID del usuario.
     * @returns Promesa con los datos crudos de `user_media_items` y sus relaciones.
     */
    async getUserMediaItems(userId: string) {
        // We fetch the item and join related tables. 
        // Supabase allows joining on FKs.
        return this.supabase
            .from('user_media_items')
            .select(`
        *,
        game:catalog_games(*),
        show:catalog_shows(*),
        book:catalog_books(*)
      `)
            .eq('user_id', userId);
    }

    async signInWithEmail(email: string) {
        return this.supabase.auth.signInWithOtp({ email });
    }

    async signInWithGoogle() {
        return this.supabase.auth.signInWithOAuth({ provider: 'google' });
    }

    async signOut() {
        return this.supabase.auth.signOut();
    }

    get currentUser() {
        return this.supabase.auth.getUser();
    }
    async uploadAvatar(file: File) {
        /**
         * Sube un avatar al bucket de almacenamiento 'avatars'.
         * 
         * @param file El archivo de imagen a subir.
         * @returns La URL pública de la imagen subida.
         * @throws Error si no hay usuario logueado o si falla la subida.
         */
        const { data: { user } } = await this.supabase.auth.getUser();
        if (!user) throw new Error('No user logged in');

        const fileExt = file.name.split('.').pop();
        const filePath = `${user.id}/${Date.now()}.${fileExt}`;

        const { error } = await this.supabase.storage
            .from('avatars')
            .upload(filePath, file);

        if (error) throw error;

        const { data } = this.supabase.storage
            .from('avatars')
            .getPublicUrl(filePath);

        return data.publicUrl;
    }

    /**
     * Actualiza el perfil del usuario actual.
     * 
     * @param profile Objeto con los datos del perfil a actualizar.
     */
    async updateProfile(profile: Database['public']['Tables']['profiles']['Update']) {
        const { data: { user } } = await this.supabase.auth.getUser();
        if (!user) throw new Error('No user logged in');

        const { error } = await (this.supabase
            .from('profiles') as any)
            .update(profile)
            .eq('id', user.id);

        if (error) throw error;
    }
}
