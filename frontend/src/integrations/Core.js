export const InvokeLLM = async ({ prompt, response_json_schema }) => {
    // Mocking LLM Invocation
    // Return a mock response structure based on the schema
    // The schema usually expects an object with properties

    // For now, return empty result or safe fallback to avoid crashing
    if (response_json_schema?.properties?.movie_ids) {
        return { movie_ids: [] };
    }

    return {};
};
