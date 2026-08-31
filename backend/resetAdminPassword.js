const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
require("dotenv").config();

const User = require("./src/models/User");

async function resetPassword() {

    try {

        await mongoose.connect(process.env.MONGO_URI);

        console.log("MongoDB connected");

        const newPassword = "Admin@12345";

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        const user = await User.findOneAndUpdate(
            { email: "admin@ethiobridge.et" },
            {
                password: hashedPassword,
                isActive: true,
                isApproved: true,
                role: "admin"
            },
            { new: true }
        );


        if (!user) {
            console.log("Admin user not found");
            process.exit();
        }


        console.log("================================");
        console.log("Admin password reset successful");
        console.log("Email: admin@ethiobridge.et");
        console.log("Password: Admin@12345");
        console.log("================================");


        process.exit();


    } catch(error){

        console.log(error);
        process.exit();

    }

}


resetPassword();