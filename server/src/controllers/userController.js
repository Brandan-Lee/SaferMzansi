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

module.exports = {
	updateUser,
};
