const API_URL = process.env.EXPO_PUBLIC_API_URL;

export const postApi = async (endpoint, body) => {
    const response = await fetch(`${API_URL}${endpoint}`, {
        method: "POST",
        headers: {
			"Content-Type": "application/json",
		}, 
        body: JSON.stringify(body),
    });

    const rawText = await response.text();

    try {
        const data = JSON.parse(rawText);
        return {
            ok: response.ok,
            status: response.status,
            data
        }
    } catch {
        console.error(
			`Server returned non-JSON response (${response.status}):`,
			rawText,
		);
		throw new Error(
			`Could not sync with server (HTTP ${response.status}). Your account was saved locally and will retry when online.`,
		);
    }
};