const argon2 = require("argon2");

const ARGON2_OPTIONS = {
    type: argon2.argon2id,
    memoryCost: 2 ** 16, //64MB memory usage
    timeCost: 3, //3 iterations
    parallelism: 1, //1 thread
}

//Method to hash the password with argon2id
const hashPassword = async (plainPassword) => {
    try {
        return await argon2.hash(plainPassword, ARGON2_OPTIONS);
    } catch (error) {
        console.error("Error hashing password with Argon2id:", error);
        throw new Error("Password Processing failed");
    }
};

//Method to verify the argon2id hashed password
const verifyPassword = async (storedHash, plainPassword) => {

    if (!storedHash || !plainPassword) {
        return false;
    }

    try {
        return await argon2.verify(storedHash, plainPassword);
    } catch (error) {
        return false;
    }
};

module.exports = { hashPassword, verifyPassword };