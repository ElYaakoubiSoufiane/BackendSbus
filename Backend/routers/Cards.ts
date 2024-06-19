import express from "express";
import bcrypt from "bcrypt";
import Joi from "joi";
import asyncHandler from "express-async-handler";
import dotenv from "dotenv";
import { Card } from "../models/Card"; // Adjust the import based on your project structure
import { User } from "../models/User"; // Adjust the import based on your project structure
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

dotenv.config();

const router = express.Router();

const createCard = async (req: any, res: any) => {
  try {
    const { line, nbrPlaces, time, price } = req.body;
    const token = req.header("Authorization")?.replace("Bearer ", "");
    console.log(token);
    if (!token) {
      return res.status(401).json({ error: "Authentication token required" });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET!);
    } catch (error) {
      return res.status(401).json({ error: "Invalid token" });
    }

    const userId = (decoded as any)._id; // Adjust based on your token structure

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const card = new Card({ line, nbrPlaces, time, price, userId: userId });
    await card.save();

    user.cards.push(card._id);
    await user.save();

    res.status(201).json({ message: "Card created successfully" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

const validateCard = (card: any) => {
  const schema = Joi.object({
    line: Joi.number().required(),
    nbrPlaces: Joi.number().required(),
    time: Joi.string().required(),
    price: Joi.number().required(),
  });

  return schema.validate(card);
};

router.post("/setCard", asyncHandler(createCard));

router.get("/getCard", async (req, res) => {
  try {
    const userId = req.query.userId;
    // console.log("userId is : ", userId); // Assuming userId is passed as a query parameter
    const cards = await Card.find({ userId: userId }); // Assuming user field in Card model stores the user ID
    res.status(200).json(cards);
  } catch (error) {
    console.error("Error fetching cards:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/scanCard", async (req, res) => {
  let { cardId } = req.body; // Destructure userId if needed
  console.log("Received cardId:", cardId);
  if (typeof cardId === "string") {
    cardId = cardId.replace(/^"|"$/g, "");
  }
  if (!cardId || !mongoose.Types.ObjectId.isValid(cardId)) {
    console.log("Invalid Card ID");
    return res.status(400).json({ message: "Invalid Card ID" });
  }

  try {
    const card = await Card.findById(cardId);
    console.log("Card = ", card);
    if (!card) {
      console.log("Card not found");
      return res.status(404).json({ message: "Card not found" });
    }

    if (card.scanned) {
      console.log("Card already scanned");
      return res.status(400).json({ message: "Card already scanned" });
    }
    console.log("Card  scanned");

    card.scanned = true;
    card.scannedAt = new Date();
    await card.save();

    res.json({ message: "Card scanned successfully", exists: true });

    // Schedule card removal after 2 hours
    setTimeout(async () => {
      await Card.findByIdAndDelete(cardId);
    }, 30000); // 2 hours in milliseconds
  } catch (error) {
    console.error("Error scanning card", error);
    res.status(500).json({ message: "Error scanning card", error });
  }
});
export default router;
