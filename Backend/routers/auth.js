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
const express_1 = require("express");
const bcrypt_1 = __importDefault(require("bcrypt"));
const joi_1 = __importDefault(require("joi"));
const User_1 = require("../models/User");
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const once_1 = __importDefault(require("once"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const router = (0, express_1.Router)();
router.post("/", (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { error } = validate(req.body);
    console.log("------------");
    if (error) {
        console.log(error);
        return res.status(400).send({ message: error.details[0].message });
    }
    const user = yield User_1.User.findOne({ email: req.body.email });
    if (!user) {
        console.log("errrrrrrrrrror2");
        return res.status(400).send({ message: "Invalid Email or Password" });
    }
    const validPassword = yield bcrypt_1.default.compare(req.body.password, user.password);
    if (!validPassword) {
        console.log("errrrrrrrrrror4");
        return res.status(401).send({ message: "Invalid Email or Password" });
    }
    console.log("errrrrrrrrrror3");
    const userId = user.id;
    const token = user.generateAuthToken();
    console.log("-----userId", userId);
    res.status(200).send({ token, userId, message: "Logged in successfully" });
})));
router.get("/check-auth-status", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const token = (_a = req.header("Authorization")) === null || _a === void 0 ? void 0 : _a.replace("Bearer ", "");
    if (!token) {
        return res.status(401).json({ isLoggedIn: false });
    }
    try {
        let decoded;
        if (typeof token === "string") {
            decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        }
        if (!decoded || typeof decoded === "string") {
            return res.status(401).json({ isLoggedIn: false });
        }
        const user = yield User_1.User.findById(decoded.id);
        if (!user) {
            return res.status(401).json({ isLoggedIn: false });
        }
        res.json({ isLoggedIn: true });
    }
    catch (err) {
        res.status(401).json({ isLoggedIn: false });
    }
}));
router.get("/logout", (0, once_1.default)((req, res) => {
    console.log("Hello log out page");
    res.clearCookie("jwtoken", { path: "/" });
    res.status(200).send("User Logout");
}));
const validate = (data) => {
    const schema = joi_1.default.object({
        email: joi_1.default.string().email().required().label("Email"),
        password: joi_1.default.string().required().label("Password"),
    });
    return schema.validate(data);
};
exports.default = router;
