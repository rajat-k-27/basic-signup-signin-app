import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

// User Signup
router.post("/signup", async (req, res) => {
  try {
    const { name, email, password, phone, profilePicture } = req.body;
    let user = await User.findOne({ email });

    if (user) return res.status(400).json({ error: "Email already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);
    user = new User({ name, email, password: hashedPassword, phone, profilePicture });
    await user.save();

    res.json({ message: "User created successfully" });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// User Login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1d" });
    res.json({ token });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// Get User Profile (Protected Route)
router.get("/profile", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// Update Profile (Protected Route)
router.put("/profile", authMiddleware, async (req, res) => {
  try {
    const { name, email, phone, profilePicture, password } = req.body;
    const updateData = { name, email, phone, profilePicture };

    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    const user = await User.findByIdAndUpdate(req.user.id, updateData, { new: true }).select("-password");

    res.json({ message: "Profile updated successfully", user });
  } catch (err) {
    res.status(500).json({ error: "Unable to update profile" });
  }
});

export default router;
