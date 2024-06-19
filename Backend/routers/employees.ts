import mongoose from "mongoose";
import express from "express";
import Joi from "joi";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import nodemailer from "nodemailer";

dotenv.config();

const router = express.Router();

const EmployeeSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  verificationCode: { type: String, required: true },
  isVerified: { type: Boolean, default: false },
});

const Employee = mongoose.model("Employee", EmployeeSchema);

// Function to send verification email
const sendVerificationEmail = async (email, verificationCode) => {
  const transporter = nodemailer.createTransport({
    service: "gmail", // You can use any email service like 'hotmail', 'yahoo', etc.
    auth: {
      user: process.env.EMAIL, // Your email address
      pass: process.env.EMAIL_PASSWORD, // Your email password or app-specific password
    },
  });

  const mailOptions = {
    from: process.env.EMAIL,
    to: email,
    subject: "Email Verification",
    text: `Your verification code is: ${verificationCode}`,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log("Verification email sent successfully");
  } catch (error) {
    console.error("Error sending email:", error);
    throw new Error("Error sending email");
  }
};

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
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Hash the password before storing
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create the new Employee
    const newEmployee = new Employee({
      email,
      password: hashedPassword,
      verificationCode,
    });

    await newEmployee.save();

    // Send the verification code via email
    await sendVerificationEmail(email, verificationCode);

    res.json({
      message: "Employee registered successfully. Check your email for the verification code.",
      employee: newEmployee,
    });
  } catch (error) {
    res.status(500).json({ error: "Internal server error." });
  }
});

// POST endpoint for verifying verification code
router.post("/verify-code", async (req, res) => {
  try {
    const { email, verificationCode } = req.body;

    // Validate input
    const schema = Joi.object({
      email: Joi.string().email().required(),
      verificationCode: Joi.string().required(),
    });

    const { error } = schema.validate({ email, verificationCode });
    if (error) return res.status(400).json({ error: error.details[0].message });

    // Find the Employee by email
    const employee = await Employee.findOne({ email });
    if (!employee) {
      return res.status(404).json({ error: "Employee not found." });
    }

    if (employee.verificationCode !== verificationCode) {
      return res.status(400).json({ error: "Invalid verification code." });
    }

    // Update Employee status to verified
    employee.isVerified = true;
    await employee.save();

    res.json({ message: "Verification successful.", employee });
  } catch (error) {
    res.status(500).json({ error: "Internal server error." });
  }
});

export default router;71