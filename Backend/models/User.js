"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const mongoose_1 = __importDefault(require("mongoose"));
const userSchema = new mongoose_1.default.Schema({
    name: {
        type: String,
        required: true,
        minlength: 3,
        maxlength: 50,
    },
    email: {
        type: String,
        required: true,
        minlength: 5,
        maxlength: 255,
        unique: true,
    },
    password: {
        type: String,
        required: true,
        minlength: 5,
        maxlength: 1024,
    },
    cards: [
        {
            type: mongoose_1.default.Schema.Types.ObjectId,
            ref: "Card",
        },
    ],
});
userSchema.methods.generateAuthToken = function () {
    const secretKey = process.env.JWT_SECRET || "default_secret_key";
    const token = jsonwebtoken_1.default.sign({ _id: this._id }, process.env.JWT_SECRET);
    return token;
};
const User = mongoose_1.default.model("User", userSchema);
exports.User = User;
