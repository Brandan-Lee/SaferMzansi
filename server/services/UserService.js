const { supabase } = require("../database/supabase_init");

const createUserInSupabase = async (userData) => {
    const { data, error } = await supabase
        .from("Users")
        .insert([userData])
        .select();

    if (error) {
        throw error;
    }

    return data[0];
}

module.exports = { createUserInSupabase };