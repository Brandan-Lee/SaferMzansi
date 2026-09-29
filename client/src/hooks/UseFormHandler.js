import { useState } from "react";
import { validateField } from "../utils/ValidationUtil";

export const useFormHandler = (initialState) => {
	const [formData, setFormData] = useState(initialState);
	const [errors, setErrors] = useState({});

	//Method that helps when the input of the field is changed
	const handleChange = (field, value) => {
		const updatedData = { ...formData, [field]: value };
		setFormData(updatedData);

		if (errors[field]) {
			const errorMessage = validateField(field, value, updatedData);
			setErrors((prev) => ({
				...prev,
				[field]: errorMessage,
			}));
		}
	};

	//Method to show the errors around the user input
	const handleFieldBlur = (field) => {
		const errorMessage = validateField(field, formData[field], formData);
		setErrors((prev) => ({
			...prev,
			[field]: errorMessage,
		}));
	};

	return {
		formData,
		errors,
		setErrors,
		handleChange,
		handleFieldBlur,
	};
};
