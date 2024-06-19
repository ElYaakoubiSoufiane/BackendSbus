import jwt from "jsonwebtoken";
import dotenv from 'dotenv';
dotenv.config();
import mongoose, { Schema, Document } from "mongoose";
interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  cards: mongoose.Types.ObjectId[];
  generateAuthToken(): string;
}

const userSchema = new mongoose.Schema({
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
      type: mongoose.Schema.Types.ObjectId,
      ref: "Card",
    },
  ],
});

userSchema.methods.generateAuthToken = function () {
  const secretKey = process.env.JWT_SECRET || "default_secret_key";

  const token = jwt.sign({ _id: this._id }, process.env.JWT_SECRET!);
  return token;
};

const User = mongoose.model<IUser>("User", userSchema);

export { User, IUser };
