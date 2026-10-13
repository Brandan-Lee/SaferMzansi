const userService = require("#services/main/userServiceServer.js");

const updateUser = async (req, res, next) => {
	try {
		console.log("[Backend Body Received]:", req.body);
		const user = await userService.updateUser(req.body);

		return res.status(200).json({
			success: true,
			message: "User Profile updated successfully",
			data: user,
		});
	} catch (error) {
		next(error);
	}
};

const softDeleteUser = async (req, res, next) => {
	try {
		const { user_id } = req.body;
		const result = await userService.softDeleteUser(user_id);

		return res.status(200).json({
			success: true,
			message: "Account soft deleted successfully",
			data: result,
		});
	} catch (error) {
		next(error);
	}
};

const hardDeleteUser = async (req, res, next) => {
	try {
		const { user_id } = req.body;
		const result = await userService.hardDeleteUser(user_id);

		return res.status(200).json({
			success: true,
			message: "Account permenantly deleted successfully",
			data: result,
		});
	} catch (error) {
		next(error);
	}
};

module.exports = {
	updateUser,
	softDeleteUser,
	hardDeleteUser,
};
