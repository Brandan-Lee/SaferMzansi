const userModel = require("#models/userModel.js");

const updateUser = async (payload) => {
	const updatedUser = await userModel.updateUser(payload);
	console.log("Updated User:", updatedUser);

	if (!updatedUser) {
		throw new Error("Failed to update user profile in database");
	}

	return updatedUser;
};

module.exports = { updateUser };
