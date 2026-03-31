import api from '../api/axios';

export const submitFeedback = async (feedbackData) => {
    const response = await api.post('/support/feedback', feedbackData);
    return response.data;
};
