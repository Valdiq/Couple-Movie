import { coupleMovieService } from '../services/coupleMovieService';

export const CoupleMovie = {
    filter: async (criteria) => {
        return coupleMovieService.list();
    },
    create: async (data) => {
        return coupleMovieService.add(data.movie_id);
    },
    delete: async (id) => {
        return coupleMovieService.delete(id);
    },
    update: async (id, data) => {
        return coupleMovieService.update(id, data);
    }
};
