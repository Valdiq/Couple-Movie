import { coupleService } from '../services/coupleService';

export const Couple = {
    invite: async (username) => {
        return coupleService.invite(username);
    },
    getInvites: async () => {
        return coupleService.getInvites();
    },
    acceptInvite: async (requestId) => {
        return coupleService.acceptInvite(requestId);
    },
    rejectInvite: async (requestId) => {
        return coupleService.rejectInvite(requestId);
    },
    getPartner: async () => {
        return coupleService.getPartner();
    },
    breakCouple: async () => {
        return coupleService.breakCouple();
    },
    // Legacy compatibility
    get: async () => {
        return coupleService.getPartner();
    },
    create: async (username) => {
        return coupleService.invite(username);
    }
};
