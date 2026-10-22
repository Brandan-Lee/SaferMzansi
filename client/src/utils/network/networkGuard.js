export const checkNetworkAndNotify = (isOnline, setBanner) => {
	if (!isOnline) {
		if (typeof setBanner !== "function") {
			throw new Error("A banner setter is required to report network status.");
		}

		setBanner({
			message:
				"No internet connection. Please check your connection and try again.",
			type: "error",
		});
		return false;
	}

	return true;
};