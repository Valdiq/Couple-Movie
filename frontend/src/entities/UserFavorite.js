import { userFavoriteService } from '../services/userFavoriteService';

export const UserFavorite = {
    filter: async (criteria) => {
        // Adapt filter criteria to service call
        // If filtering by user_email, likely means "my favorites"
        return userFavoriteService.list();
    },
    create: async (data) => {
        return userFavoriteService.add(data.movie_id);
    },
    delete: async (id) => {
        return userFavoriteService.delete(id);
    },
    update: async (id, data) => {
        return userFavoriteService.update(id, data);
    }
};
