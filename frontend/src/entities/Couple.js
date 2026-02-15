import { coupleService } from '../services/coupleService';

export const Couple = {
    create: async (partnerEmail) => {
        return coupleService.create(partnerEmail);
    },
    get: async () => {
        return coupleService.get();
    },
    leave: async () => {
        return coupleService.leave();
    }
};
