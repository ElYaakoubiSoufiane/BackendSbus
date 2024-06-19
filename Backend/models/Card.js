"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Card = void 0;
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const cardSchema = new mongoose.Schema({
    line: {
        type: Number,
        required: true,
    },
    nbrPlaces: {
        type: Number,
        required: true,
    },
    time: {
        type: String,
        required: true,
    },
    price: {
        type: Number,
        required: true,
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        index: true,
    },
    scanned: { type: Boolean, default: false },
    scannedAt: String,
});
cardSchema.methods.generateAuthToken = function () {
    const token = jwt.sign({ _id: this._id }, process.env.JWTPRIVATEKEY);
    return token;
};
const Card = mongoose.model("Card", cardSchema);
exports.Card = Card;
