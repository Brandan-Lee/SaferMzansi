import { useEffect, useRef, useState } from "react";
import { Keyboard } from "react-native";

export const useOtp = (length = 6) => {
	const otpLength =
		Number.isSafeInteger(length) && length > 0 ? length : 6;
	const [otp, setOtp] = useState(() => Array(otpLength).fill(""));
	const otpRef = useRef(otp);
	const inputRefs = useRef([]);

	useEffect(() => {
		const emptyOtp = Array(otpLength).fill("");
		otpRef.current = emptyOtp;
		setOtp(emptyOtp);
	}, [otpLength]);

	const focusInput = (index) => inputRefs.current[index]?.focus();

	const updateOtp = (nextOtp) => {
		otpRef.current = nextOtp;
		setOtp(nextOtp);
	};

	const handleOtpChange = (text, index) => {
		if (!Number.isInteger(index) || index < 0 || index >= otpLength) return;
		const digits = text.replace(/[^0-9]/g, "");

		if (digits.length > 1) {
			const pastedDigits = digits.slice(0, otpLength).split("");
			const nextOtp = Array.from(
				{ length: otpLength },
				(_, position) => pastedDigits[position] || "",
			);
			updateOtp(nextOtp);

			if (pastedDigits.length === otpLength) {
				Keyboard.dismiss();
			} else {
				focusInput(pastedDigits.length);
			}

			return;
		}

		const updatedOtp = [...otpRef.current];
		updatedOtp[index] = digits;
		updateOtp(updatedOtp);

		if (digits !== "" && index < otpLength - 1) {
			focusInput(index + 1);
		}
	};

	const handleKeyPress = (e, index) => {
		if (
			e.nativeEvent.key === "Backspace" &&
			otpRef.current[index] === "" &&
			index > 0
		) {
			inputRefs.current[index - 1]?.focus();
		}
	};

	const resetOtp = () => updateOtp(Array(otpLength).fill(""));

	return {
		otp,
		otpString: otp.join(""),
		inputRefs,
		handleOtpChange,
		handleKeyPress,
		resetOtp,
	};
};
