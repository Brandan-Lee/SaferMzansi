const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^\d{9,12}$/;

//Method that helps to check if the email follows a valid format
export const isValidEmail = (email) =>
	Boolean(email && EMAIL_REGEX.test(email.trim()));

//Method that helps to check if the phone number matches South African format
export const isValidPhone = (phone) => {
	if (!phone) {
		return false;
	}

	const cleanPhone = phone.replace(/\D/g, "");
	return PHONE_REGEX.test(cleanPhone);
};

//Validate each field method
const FIELD_RULES = {
	name: (val) => (!val ? "Name is required" : ""),
	surname: (val) => (!val ? "Surname is required" : ""),
	email: (val) =>
		!val
			? "Email address is required"
			: !isValidEmail(val)
				? "Enter a valid email address"
				: "",
	phone: (val) =>
		!val
			? "Phone number is required"
			: !isValidPhone(val)
				? "Enter a valid phone number"
				: "",
	password: (val) =>
		!val
			? "Password is required"
			: val.length < 8
				? "Password must be at least 8 characters"
				: "",
	confirmPassword: (val, rawVal, formData) =>
		!val
			? "Please confirm your password"
			: rawVal !== formData.password
				? "Passwords do not match"
				: "",
	decoyPin: (val) => {
		const str = String(val ?? "").trim();
		if (!str) return "Decoy PIN is required";
		if (str.length < 4) return "Decoy PIN must be at least 4 characters";
		return "";
	},
	emergencyPin: (val, rawVal, formData) => {
		const str = String(val ?? "").trim();
		if (!str) return "Emergency PIN is required";
		if (str.length < 4) return "Emergency PIN must be at least 4 characters";
		if (formData?.decoyPin && str === String(formData.decoyPin).trim()) {
			return "Emergency PIN cannot be the same as Decoy PIN";
		}
		return "";
	},
	timerSeconds: (val) => {
		const str = String(val ?? "").trim();
		const parsed = Number(str);
		if (!str) return "Timer window is required";
		if (!Number.isInteger(parsed) || parsed < 3 || parsed > 30) {
			return "Allowed range is between 3 and 30 seconds";
		}
		return "";
	},
};

//Method that helps to validate the fields enter into the form
export const validateField = (field, value, formData = {}) => {
	const trimmed = typeof value === "string" ? value.trim() : value;
	const validator = FIELD_RULES[field];
	return validator ? validator(trimmed, value, formData) : "";
};

//Method to validate form
const validateForm = (formData, extraValidations = {}) => {
	const errors = {};

	Object.keys(formData).forEach((key) => {
		const error = validateField(key, formData[key], formData);

		if (error) {
			errors[key] = error;
		}
	});

	Object.assign(errors, extraValidations);

	return {
		isValid: Object.keys(errors).length === 0,
		errors,
	};
};

//Method to get the strength of the password
export const getPasswordStrength = (password = "") => {
	const checks = {
		length: password.length >= 8,
		uppercase: /[A-Z]/.test(password),
		lowercase: /[a-z]/.test(password),
		number: /[0-9]/.test(password),
		symbol: /[^A-Za-z0-9]/.test(password),
	};

	return Object.values(checks).filter(Boolean).length;
};

//Method that helps to validate the form of the registration screen
export const validateRegistrationForm = (formData, agreed) => {
	const extraErrors = {};
	const strenth = getPasswordStrength(formData.password);

	//Password strength check. User can only register if their password is very strong
	if (strenth < 5) {
		extraErrors.password =
			"Password must meet all security requirements below to register";
	}

	if (!agreed) {
		extraErrors.agreed =
			"You must accept the Terms and Conditions as well as the Privacy Policy checkbox to continue";
	}

	return validateForm(formData, extraErrors);
};

//Method that validates the Login form
export const validateLoginForm = (formData) => validateForm(formData);

//Method that validates the Forgot Password form
export const validateForgotPasswordForm = (formData) => validateForm(formData);

//Method that validates the Reset Password form
export const validateResetPasswordForm = (formData) => validateForm(formData);

export const validateContactForm = (formData) => {
	const errors = {};

	["name", "surname"].forEach((field) => {
		const error = validateField(field, formData[field], formData);
		if (error) errors[field] = error;
	});

	const phone = String(formData.phone ?? "").trim();
	const email = String(formData.email ?? "").trim();
	if (phone) {
		const error = validateField("phone", phone, formData);
		if (error) errors.phone = error;
	}
	if (email) {
		const error = validateField("email", email, formData);
		if (error) errors.email = error;
	}
	if (!phone && !email) {
		errors.phone = "Enter a phone number or an email address";
	}

	return { isValid: Object.keys(errors).length === 0, errors };
};

export const validateUserForm = (formData) => validateForm(formData);

export const validateDecoyForm = (formData) => validateForm(formData);

export const validateEmergencyTimerForm = (formData) => validateForm(formData);

const normalizeOtpString = (otp) =>
	Array.isArray(otp) ? otp.join("") : otp?.trim() || "";

//Method that checks if it is a valid OTP or not
export const isValidOtp = (otpArrayOrString, length = 6) => {
	const otpString = normalizeOtpString(otpArrayOrString);
	return new RegExp(`^\\d{${length}}$`).test(otpString);
};

//Method that validates the OTP form
export const validateOtpInput = (otpArrayOrString, length = 6) => {
	const otpString = normalizeOtpString(otpArrayOrString);

	if (!otpString) {
		return "OTP is required";
	}

	if (otpString.length < length) {
		return `Please enter the complete ${length}-digit OTP`;
	}

	if (!/^\d+$/.test(otpString)) {
		return "OTP must contain numbers only";
	}

	return "";
};
