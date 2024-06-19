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
const express_1 = __importDefault(require("express"));
const joi_1 = __importDefault(require("joi"));
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const dotenv_1 = __importDefault(require("dotenv"));
const Card_1 = require("../models/Card"); // Adjust the import based on your project structure
const User_1 = require("../models/User"); // Adjust the import based on your project structure
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const mongoose_1 = __importDefault(require("mongoose"));
dotenv_1.default.config();
const router = express_1.default.Router();
const createCard = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { line, nbrPlaces, time, price } = req.body;
        const token = (_a = req.header("Authorization")) === null || _a === void 0 ? void 0 : _a.replace("Bearer ", "");
        console.log(token);
        if (!token) {
            return res.status(401).json({ error: "Authentication token required" });
        }
        let decoded;
        try {
            decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        }
        catch (error) {
            return res.status(401).json({ error: "Invalid token" });
        }
        const userId = decoded._id; // Adjust based on your token structure
        const user = yield User_1.User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }
        const card = new Card_1.Card({ line, nbrPlaces, time, price, userId: userId });
        yield card.save();
        user.cards.push(card._id);
        yield user.save();
        res.status(201).json({ message: "Card created successfully" });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
const validateCard = (card) => {
    const schema = joi_1.default.object({
        line: joi_1.default.number().required(),
        nbrPlaces: joi_1.default.number().required(),
        time: joi_1.default.string().required(),
        price: joi_1.default.number().required(),
    });
    return schema.validate(card);
};
router.post("/setCard", (0, express_async_handler_1.default)(createCard));
router.get("/getCard", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.query.userId;
        // console.log("userId is : ", userId); // Assuming userId is passed as a query parameter
        const cards = yield Card_1.Card.find({ userId: userId }); // Assuming user field in Card model stores the user ID
        res.status(200).json(cards);
    }
    catch (error) {
        console.error("Error fetching cards:", error);
        res.status(500).json({ message: "Internal server error" });
    }
}));
router.post("/scanCard", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    let { cardId } = req.body; // Destructure userId if needed
    console.log("Received cardId:", cardId);
    if (typeof cardId === "string") {
        cardId = cardId.replace(/^"|"$/g, "");
    }
    if (!cardId || !mongoose_1.default.Types.ObjectId.isValid(cardId)) {
        console.log("Invalid Card ID");
        return res.status(400).json({ message: "Invalid Card ID" });
    }
    try {
        const card = yield Card_1.Card.findById(cardId);
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
        yield card.save();
        res.json({ message: "Card scanned successfully", exists: true });
        // Schedule card removal after 2 hours
        setTimeout(() => __awaiter(void 0, void 0, void 0, function* () {
            yield Card_1.Card.findByIdAndDelete(cardId);
        }), 30000); // 2 hours in milliseconds
    }
    catch (error) {
        console.error("Error scanning card", error);
        res.status(500).json({ message: "Error scanning card", error });
    }
}));
exports.default = router;
