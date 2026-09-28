//Method to check the users internet connectivity status
export const checkNetworkAndNotify = (isOnline, banner) => {
    if (!isOnline) {
        banner({
            message: "No internet connection. Please check your connection and try again.",
            type: error,
        });

        return false;
    }

    return true;
}