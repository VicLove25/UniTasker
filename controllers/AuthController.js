// authController.js
import bcrypt from 'bcryptjs';
import User from '../model/User.js';

const SALT_ROUNDS = 10;

export async function accRegister(uName, secret, email, fName, lName) {
    try {

        // Check if username exists
        const existingUser = await User.findByUsername(uName);

        if (existingUser) {
            console.log("Account with that username already exists");
            return null;
        } else {
            console.log("Username is available");
        }

        // Hash the password before saving
        const hashedPassword = await bcrypt.hash(secret, SALT_ROUNDS);

        const _id = undefined; // Let MongoDB generate the _id
        const newUser = new User(_id, uName, hashedPassword, email, fName, lName, [], []);
        await newUser.save(); // Save the new user to the database

        console.log(`Successfully created user profile for ${uName}!`);
        return newUser;

    } catch (error) {
        console.error("Error registering user:", error);
        return null;
    }
}

export async function authLogin(uName, secret) {
    try {

        // Find the user by username
        const user = await User.findByUsername(uName);
        if (!user) {
            console.log("Invalid Username");
            return null;
        }

        // Compare hashed password
        const isValid = await bcrypt.compare(secret, user.Password);
        if (!isValid) {
            console.log("Invalid password");
            return null;
        }

        console.log("Successfully authenticated user!");
        return user;

    } catch (error) {
        console.error("Error logging in:", error);
    }
}
