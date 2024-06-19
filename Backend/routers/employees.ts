import mongoose from "mongoose";
import express from "express";
import Joi from "joi";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import nodemailer from "nodemailer";
import jwt from "jsonwebtoken";
const asyncHandler = require("express-async-handler");

dotenv.config();

const router = express.Router();
interface IEmployee extends Document {
  email: string;
  password: string;
  generateAuthToken(): string;
}
const EmployeeSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
});
EmployeeSchema.methods.generateAuthToken = function () {
  const secretKey = process.env.JWT_SECRET || "default_secret_key";

  const token = jwt.sign({ _id: this._id }, process.env.JWT_SECRET!);
  return token;
};
const Employee = mongoose.model<IEmployee>("Employee", EmployeeSchema);

router.post(
  "/login",
  asyncHandler(async (req: any, res: any): Promise<any> => {
    const { error } = validate(req.body);
    console.log("------------");

    if (error) {
      console.log(error);

      return res.status(400).send({ message: error.details[0].message });
    }

    const employee = await Employee.findOne({ email: req.body.email });
    if (!employee) {
      console.log("errrrrrrrrrror2");

      return res.status(400).send({ message: "Invalid Email or Password" });
    }
    const validPassword = await bcrypt.compare(
      req.body.password,
      employee.password
    );
    if (!validPassword) {
      console.log("errrrrrrrrrror4");

      return res.status(401).send({ message: "Invalid Email or Password" });
    }
    console.log("errrrrrrrrrror3");
    const userId = employee.id;
    const token = employee.generateAuthToken();
    console.log("-----userId", userId);
    res.status(200).send({ token, userId, message: "Logged in successfully" });
  })
);

// Function to send verification email
// const sendVerificationEmail = async (email, verificationCode) => {
//   const transporter = nodemailer.createTransport({
//     service: "gmail", // You can use any email service like 'hotmail', 'yahoo', etc.
//     auth: {
//       user: process.env.EMAIL, // Your email address
//       pass: process.env.EMAIL_PASSWORD, // Your email password or app-specific password
//     },
//   });

//   const mailOptions = {
//     from: process.env.EMAIL,
//     to: email,
//     subject: "Email Verification",
//     text: `Your verification code is: ${verificationCode}`,
//   };

//   try {
//     await transporter.sendMail(mailOptions);
//     console.log("Verification email sent successfully");
//   } catch (error) {
//     console.error("Error sending email:", error);
//     throw new Error("Error sending email");
//   }
// };

// POST endpoint for Employee registration
router.post("/register", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    const schema = Joi.object({
      email: Joi.string().email().required(),
      password: Joi.string().min(6).required(),
    });

    const { error } = schema.validate({ email, password });
    if (error) return res.status(400).json({ error: error.details[0].message });

    // Check if Employee already exists
    const existingEmployee = await Employee.findOne({ email });
    if (existingEmployee) {
      return res.status(400).json({ error: "Employee already exists." });
    }

    // Generate a verification code
    // const verificationCode = Math.floor(
    //   100000 + Math.random() * 900000
    // ).toString();

    // Hash the password before storing
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create the new Employee
    const newEmployee = new Employee({
      email,
      password: hashedPassword,
    });

    await newEmployee.save();

    // Send the verification code via email
    // await sendVerificationEmail(email, verificationCode);

    res.json({
      message:
        "Employee registered successfully. Check your email for the verification code.",
      employee: newEmployee,
    });
  } catch (error) {
    res.status(500).json({ error: "Internal server error." });
  }
});
const validate = (data: any) => {
  const schema = Joi.object({
    email: Joi.string().email().required().label("Email"),
    password: Joi.string().required().min(6).label("Password"),
  });
  return schema.validate(data);
};
// POST endpoint for verifying verification code

export default router;
