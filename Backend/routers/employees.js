"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const express_1 = __importDefault(require("express"));
const joi_1 = __importDefault(require("joi"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const dotenv_1 = __importDefault(require("dotenv"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const asyncHandler = require("express-async-handler");
dotenv_1.default.config();
const router = express_1.default.Router();
const EmployeeSchema = new mongoose_1.default.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
});
EmployeeSchema.methods.generateAuthToken = function () {
    const secretKey = process.env.JWT_SECRET || "default_secret_key";
    const token = jsonwebtoken_1.default.sign({ _id: this._id }, process.env.JWT_SECRET);
    return token;
};
const Employee = mongoose_1.default.model("Employee", EmployeeSchema);
router.post("/login", asyncHandler((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { error } = validate(req.body);
    console.log("------------");
    if (error) {
        console.log(error);
        return res.status(400).send({ message: error.details[0].message });
    }
    const employee = yield Employee.findOne({ email: req.body.email });
    if (!employee) {
        console.log("errrrrrrrrrror2");
        return res.status(400).send({ message: "Invalid Email or Password" });
    }
    const validPassword = yield bcrypt_1.default.compare(req.body.password, employee.password);
    if (!validPassword) {
        console.log("errrrrrrrrrror4");
        return res.status(401).send({ message: "Invalid Email or Password" });
    }
    console.log("errrrrrrrrrror3");
    const userId = employee.id;
    const token = employee.generateAuthToken();
    console.log("-----userId", userId);
    res.status(200).send({ token, userId, message: "Logged in successfully" });
})));
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
router.post("/register", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, password } = req.body;
        // Validate input
        const schema = joi_1.default.object({
            email: joi_1.default.string().email().required(),
            password: joi_1.default.string().min(6).required(),
        });
        const { error } = schema.validate({ email, password });
        if (error)
            return res.status(400).json({ error: error.details[0].message });
        // Check if Employee already exists
        const existingEmployee = yield Employee.findOne({ email });
        if (existingEmployee) {
            return res.status(400).json({ error: "Employee already exists." });
        }
        // Generate a verification code
        // const verificationCode = Math.floor(
        //   100000 + Math.random() * 900000
        // ).toString();
        // Hash the password before storing
        const hashedPassword = yield bcrypt_1.default.hash(password, 10);
        // Create the new Employee
        const newEmployee = new Employee({
            email,
            password: hashedPassword,
        });
        yield newEmployee.save();
        // Send the verification code via email
        // await sendVerificationEmail(email, verificationCode);
        res.json({
            message: "Employee registered successfully. Check your email for the verification code.",
            employee: newEmployee,
        });
    }
    catch (error) {
        res.status(500).json({ error: "Internal server error." });
    }
}));
const validate = (data) => {
    const schema = joi_1.default.object({
        email: joi_1.default.string().email().required().label("Email"),
        password: joi_1.default.string().required().min(6).label("Password"),
    });
    return schema.validate(data);
};
// POST endpoint for verifying verification code
exports.default = router;
