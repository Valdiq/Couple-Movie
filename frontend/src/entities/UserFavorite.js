import { userFavoriteService } from '../services/userFavoriteService';

export const UserFavorite = {
    list: async () => {
        return userFavoriteService.list();
    },
    filter: async () => {
        // Legacy compatibility - just list all favorites
        return userFavoriteService.list();
    },
    add: async (movieData) => {
        return userFavoriteService.add(movieData);
    },
    remove: async (imdbId) => {
        return userFavoriteService.remove(imdbId);
    },
    check: async (imdbId) => {
        return userFavoriteService.check(imdbId);
    },
    // Legacy compatibility
    create: async (data) => {
        return userFavoriteService.add(data);
    },
    delete: async (imdbId) => {
        return userFavoriteService.remove(imdbId);
    },
    updateStatus: async (imdbId, data) => {
        return userFavoriteService.updateStatus(imdbId, data);
    }
};
