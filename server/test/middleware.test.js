const assert = require("node:assert/strict");
const test = require("node:test");

const asyncHandler = require("../src/middleware/asyncHandler");
const errorHandler = require("../src/middleware/errorHandler");
const notFoundHandler = require("../src/middleware/notFoundHandler");
const { validateBody } = require("../src/middleware/validateRequest");
const { omitNullish } = require("../src/utils/databaseUtil");

test("asyncHandler forwards rejected route handlers to Express", async () => {
	let forwardedError;

	asyncHandler(async () => {
		throw new Error("route failed");
	})({}, {}, (error) => {
		forwardedError = error;
	});

	await new Promise(setImmediate);
	assert.equal(forwardedError.message, "route failed");
});

test("validateBody accepts zero and false but rejects missing values", () => {
	const middleware = validateBody(["latitude", "enabled"]);
	let passedToNext = false;
	let response;
	const res = {
		status(statusCode) {
			this.statusCode = statusCode;
			return this;
		},
		json(body) {
			response = { statusCode: this.statusCode, body };
			return response;
		},
	};

	middleware({ body: { latitude: 0, enabled: false } }, res, () => {
		passedToNext = true;
	});
	assert.equal(passedToNext, true);

	passedToNext = false;
	middleware({ body: { latitude: 0, enabled: " " } }, res, () => {
		passedToNext = true;
	});
	assert.equal(passedToNext, false);
	assert.equal(response.statusCode, 400);
	assert.deepEqual(response.body, {
		error: "Missing required parameter(s): enabled",
	});
});

test("omitNullish preserves meaningful falsy values", () => {
	assert.deepEqual(omitNullish({ count: 0, enabled: false, blank: "", value: null }), {
		count: 0,
		enabled: false,
		blank: "",
	});
});

test("errorHandler returns safe messages for server errors", () => {
	let response;
	const res = {
		headersSent: false,
		status(statusCode) {
			this.statusCode = statusCode;
			return this;
		},
		json(body) {
			response = { statusCode: this.statusCode, body };
			return response;
		},
	};

	const originalConsoleError = console.error;
	console.error = () => {};
	try {
		errorHandler(new Error("database secret"), {}, res, assert.fail);
	} finally {
		console.error = originalConsoleError;
	}
	assert.deepEqual(response, {
		statusCode: 500,
		body: {
			success: false,
			error: "An unexpected server error occurred.",
		},
	});
});

test("notFoundHandler uses the API JSON error format", () => {
	let response;
	const res = {
		status(statusCode) {
			this.statusCode = statusCode;
			return this;
		},
		json(body) {
			response = { statusCode: this.statusCode, body };
			return response;
		},
	};

	notFoundHandler({}, res);
	assert.deepEqual(response, {
		statusCode: 404,
		body: {
			success: false,
			error: "The requested endpoint was not found.",
		},
	});
});
