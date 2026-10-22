const userService = require("#services/main/userServiceServer.js");

const updateUser = async (req, res) => {
	const user = await userService.updateUser(req.body);

	return res.status(200).json({
		success: true,
		message: "User Profile updated successfully",
		data: user,
	});
};

const softDeleteUser = async (req, res) => {
	const result = await userService.softDeleteUser(req.body.user_id);

	return res.status(200).json({
		success: true,
		message: "Account soft deleted successfully",
		data: result,
	});
};

const hardDeleteUser = async (req, res) => {
	const result = await userService.hardDeleteUser(req.body.user_id);

	return res.status(200).json({
		success: true,
		message: "Account permanently deleted successfully",
		data: result,
	});
};

module.exports = {
	updateUser,
	softDeleteUser,
	hardDeleteUser,
};
