import React from "react";

import AppButton from "@components/common/AppButton";

// Keep the existing form API while sharing button behavior across the app.
export const PrimaryButton = (props) => <AppButton {...props} />;