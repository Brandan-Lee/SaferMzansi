const userModel = require("#models/userModel.js");

const updateUser = async (payload) => {
	const updatedUser = await userModel.updateUser(payload);
	if (!updatedUser) {
		throw new Error("Failed to update user profile in database");
	}

	return updatedUser;
};

const softDeleteUser = async (userId) => {
	const result = await userModel.softDeleteUser(userId);

	if (!result) {
		throw new Error("Failed to soft delete user in database");
	}

	return result;
};

const hardDeleteUser = async (userId) => {
	const result = await userModel.handleDeleteUser(userId);

	if (!result) {
		throw new Error("Failed to hard delete user in database");
	}

	return result;
};

module.exports = { updateUser, softDeleteUser, hardDeleteUser };
