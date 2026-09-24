const { supabase } = require("../database/supabase_init");

//Method to create a user in supabase during registration
const createUserInSupabase = async (userData) => {
    const { data, error } = await supabase
        .from("Users")
        .insert([userData])
        .select();

    //There was an error inserting the user into supabase
    if (error) {
        throw error;
    }

    //Return the user object
    return data[0];
} 

// Method to verify a user's credentials in Supabase during login process
const verifyUserInSupabase = async ({ encrypted_email, password_hash }) => {
    const { data, error } = await supabase
        .from("Users")
        .select("*")
        .eq("encrypted_email", encrypted_email)
        .eq("password_hash", password_hash)
        .maybeSingle();

    // There was an error verifying the user's credentials on Supabase
    if (error) {
        throw error;
    }

    // Return the user object
    return data;
};

module.exports = { createUserInSupabase, verifyUserInSupabase };