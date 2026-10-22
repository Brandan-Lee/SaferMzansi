import { useCallback, useState } from "react";
import { validateField } from "@utils/securityAndValidation/validationUtil";

export const useFormHandler = (initialState) => {
	const [formData, setFormData] = useState(() => ({ ...initialState }));
	const [errors, setErrors] = useState({});

	const handleChange = useCallback((field, value) => {
		const updatedData = { ...formData, [field]: value };
		setFormData(updatedData);

		setErrors((currentErrors) => {
			const fieldsToRecheck = [field];
			if (field === "password") fieldsToRecheck.push("confirmPassword");
			if (field === "decoyPin") fieldsToRecheck.push("emergencyPin");

			const nextErrors = { ...currentErrors };
			fieldsToRecheck.forEach((fieldToCheck) => {
				if (fieldToCheck === field || currentErrors[fieldToCheck]) {
					nextErrors[fieldToCheck] = validateField(
						fieldToCheck,
						updatedData[fieldToCheck],
						updatedData,
					);
				}
			});
			return nextErrors;
		});
	}, [formData]);

	const handleFieldBlur = useCallback((field) => {
		const errorMessage = validateField(field, formData[field], formData);
		setErrors((currentErrors) => ({
			...currentErrors,
			[field]: errorMessage,
		}));
	}, [formData]);

	return {
		formData,
		errors,
		setFormData,
		setErrors,
		handleChange,
		handleFieldBlur,
	};
};
