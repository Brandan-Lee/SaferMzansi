const userModel = require("#models/userModel.js");
const evidenceModel = require("#models/evidenceModel.js");

const performUserAction = async (action, errorMessage) => {
	const result = await action();
	if (!result) {
		throw new Error(errorMessage);
	}
	return result;
};

const updateUser = async (payload) => {
	return performUserAction(
		() => userModel.updateUser(payload),
		"Failed to update user profile in database",
	);
};

const softDeleteUser = async (userId) => {
	return performUserAction(
		() => userModel.softDeleteUser(userId),
		"Failed to soft delete user in database",
	);
};

const hardDeleteUser = async (userId) => {
	await evidenceModel.permanentDeleteEvidenceForUser(userId);
	return performUserAction(
		() => userModel.handleDeleteUser(userId),
		"Failed to hard delete user in database",
	);
};

module.exports = { updateUser, softDeleteUser, hardDeleteUser };
