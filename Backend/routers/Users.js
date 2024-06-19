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
Object.defineProperty(exports, "__esModule", { value: true });
const router = require("express").Router();
const { User } = require("../models/user");
const bcrypt = require("bcrypt");
const Joi = require("joi");
const asyncHandler = require("express-async-handler");
router.post("/", asyncHandler((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { error } = validate(req.body);
    if (error)
        return res.status(400).send({ message: error.details[0].message });
    const user = yield User.findOne({ email: req.body.email });
    if (user)
        return res
            .status(409)
            .send({ message: "User with given email already exists!" });
    const salt = yield bcrypt.genSalt(Number(process.env.SALT));
    const hashPassword = yield bcrypt.hash(req.body.password, salt);
    yield new User(Object.assign(Object.assign({}, req.body), { password: hashPassword })).save();
    res.status(201).send({ message: "User created successfully" });
})));
const validate = (data) => {
    const schema = Joi.object({
        name: Joi.string().required().label("Name"),
        email: Joi.string().email().required().label("Email"),
        password: Joi.string().required().min(6).label("Password"),
    });
    return schema.validate(data);
};
exports.default = router;
