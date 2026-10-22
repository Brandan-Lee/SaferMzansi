const { createClient } = require("@supabase/supabase-js");

const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
	throw new Error(
		"SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be configured.",
	);
}

// Create one shared client so models reuse the same connection settings.
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

module.exports = { supabase };
