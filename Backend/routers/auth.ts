import { Request, Response, Router } from "express";
import bcrypt from "bcrypt";
import Joi from "joi";
import { User } from "../models/User";
import asyncHandler from "express-async-handler";
import once from "once";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

const router = Router();

router.post(
  "/",
  asyncHandler(async (req, res): Promise<any> => {
    const { error } = validate(req.body);
    console.log("------------");

    if (error) {
      console.log(error);

      return res.status(400).send({ message: error.details[0].message });
    }

    const user = await User.findOne({ email: req.body.email });
    if (!user) {
      console.log("errrrrrrrrrror2");

      return res.status(400).send({ message: "Invalid Email or Password" });
    }
    const validPassword = await bcrypt.compare(
      req.body.password,
      user.password
    );
    if (!validPassword) {
      console.log("errrrrrrrrrror4");

      return res.status(401).send({ message: "Invalid Email or Password" });
    }
    console.log("errrrrrrrrrror3");
    const userId = user.id;
    const token = user.generateAuthToken();
    console.log("-----userId", userId);
    res.status(200).send({ token, userId, message: "Logged in successfully" });
  })
);
router.get("/check-auth-status", async (req, res) => {
  const token = req.header("Authorization")?.replace("Bearer ", "");

  if (!token) {
    return res.status(401).json({ isLoggedIn: false });
  }

  try {
    let decoded;
    if (typeof token === "string") {
      decoded = jwt.verify(token, process.env.JWT_SECRET!);
    }

    if (!decoded || typeof decoded === "string") {
      return res.status(401).json({ isLoggedIn: false });
    }

    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ isLoggedIn: false });
    }

    res.json({ isLoggedIn: true });
  } catch (err) {
    res.status(401).json({ isLoggedIn: false });
  }
});
router.get(
  "/logout",
  once((req: Request, res: Response) => {
    console.log("Hello log out page");
    res.clearCookie("jwtoken", { path: "/" });
    res.status(200).send("User Logout");
  })
);

const validate = (data: { email: string; password: string }) => {
  const schema = Joi.object({
    email: Joi.string().email().required().label("Email"),
    password: Joi.string().required().label("Password"),
  });
  return schema.validate(data);
};

export default router;
