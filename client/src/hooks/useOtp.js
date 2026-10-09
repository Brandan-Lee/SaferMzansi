import { useRef, useState } from "react";
import { Keyboard } from "react-native";

export const useOtp = (length = 6) => {
	const [otp, setOtp] = useState(Array(length).fill(""));
	const inputRefs = useRef([]);

	const focusInput = (index) => inputRefs.current[index]?.focus();

	//Method to handle the changing of the OTP input
	const handleOtpChange = (text, index) => {
		const digits = text.replace(/[^0-9]/g, "");

		//Handle the pasting of OTP from the user
		if (digits.length > 1) {
			const pastedDigits = digits.slice(0, length).split("");
			const newOtp = Array(length)
				.fill("")
				.map((_, i) => pastedDigits[i] || "");

			setOtp(newOtp);
			const targetIndex = Math.min(digits.length, length - 1);
			focusInput(targetIndex);

			if (pastedDigits.length === length) {
				Keyboard.dismiss();
			}

			return;
		}

		//Handling single digit inputs
		const updatedOtp = [...otp];
		updatedOtp[index] = digits;
		setOtp(updatedOtp);

		if (digits !== "" && index < length - 1) {
			focusInput(index + 1);
		}
	};

	//Method to handle backspace keypress
	const handleKeyPress = (e, index) => {
		if (e.nativeEvent.key === "Backspace" && otp[index] === "" && index > 0) {
			inputRefs.current[index - 1]?.focus();
		}
	};

	//Method to handle the reset of the OTP input
	const resetOtp = () => setOtp(Array(length).fill(""));

	//Data that has to be returned
	return {
		otp,
		otpString: otp.join(""),
		inputRefs,
		handleOtpChange,
		handleKeyPress,
		resetOtp,
	};
};
