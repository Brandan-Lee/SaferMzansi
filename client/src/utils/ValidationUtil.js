export const isValidEmail = (email) => {
	if (!email) return false;
	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	return emailRegex.test(email.trim());
};

export const isValidPhone = (phone) => {
	if (!phone) return false;
	const cleanPhone = phone.replace(/\D/g, "");
	return cleanPhone.length >= 9 && cleanPhone.length <= 12;
};

export const validateField = (field, value, formData = {}) => {
	const trimmed = value?.trim() || "";

	switch (field) {
		case "name":
			return !trimmed ? "Name is required" : "";

		case "surname":
			return !trimmed ? "Surname is required" : "";

		case "email":
			if (!trimmed) {
				return "Email address is required";
			}
			if (!isValidEmail(trimmed)) {
				return "Enter a valid email address";
			}
			return "";

		case "phone":
			if (!trimmed) {
				return "Phone number is required";
			}
			if (!isValidPhone(trimmed)) {
				return "Enter a valid phone number";
			}
			return "";

		case "password":
			if (!trimmed) {
				return "Password is required";
			}
			if (trimmed.length < 6) {
				return "Password must be at least 6 characters";
			}
			return "";

		case "confirmPassword":
			if (!trimmed) {
				return "Please confirm your password";
			}
			if (value !== formData.password) {
				return "Passwords do not match";
			}
			return "";

		default:
			return "";
	}
};

export const validateForm = (formData, agreed) => {
	const errors = {};
	let isValid = true;

	Object.keys(formData).forEach((key) => {
		const error = validateField(key, formData[key], formData);

		if (error) {
			errors[key] = error;
			isValid = false;
		}
	});

	if (!agreed) {
		errors.agreed = "You must accept the Terms and Privacy Policy to continue";
		isValid = false;
	}

	return { isValid, errors };
};
