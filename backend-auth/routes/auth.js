const express = require("express");
const router = express.Router();
const { check, validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { OAuth2Client } = require("google-auth-library");
const { v4: uuidv4 } = require("uuid"); // Needed for favorites unique IDs if we mimic Mongoose's _id

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const auth = (req, res, next) => {
  const token = req.header("Authorization")?.replace("Bearer ", "");
  if (!token)
    return res.status(401).json({ msg: "No token, authorization denied" });

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "your_jwt_secret_key_here"
    );
    req.user = decoded.user;
    next();
  } catch (err) {
    res.status(401).json({ msg: "Token is not valid" });
  }
};

// @route   POST /api/auth/register
router.post(
  "/register",
  [
    check("name", "Name is required").not().isEmpty(),
    check("email", "Please include a valid email").isEmail(),
    check("password", "Password must be at least 6 characters").isLength({
      min: 6,
    }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    const { name, email, password } = req.body;

    try {
      let user = await User.findOne({ where: { email: email.toLowerCase() } });
      if (user) {
        return res.status(409).json({ msg: "Email already registered" });
      }

      user = User.build({ name, email: email.toLowerCase(), password });
      await user.save();

      const payload = { user: { id: user.id } };
      const token = jwt.sign(
        payload,
        process.env.JWT_SECRET || "your_jwt_secret_key_here",
        { expiresIn: "7d" }
      );

      res.json({
        token,
        user: { id: user.id, name: user.name, email: user.email },
      });
    } catch (err) {
      console.error(err.message);
      res.status(500).send("Server error");
    }
  }
);

// @route   POST /api/auth/login
router.post(
  "/login",
  [
    check("email", "Please include a valid email").isEmail(),
    check("password", "Password is required").exists(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    try {
      const user = await User.findOne({ where: { email: email.toLowerCase() } });
      if (!user) {
        return res.status(401).json({ msg: "Invalid credentials" });
      }

      if (user.password) {
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
          return res.status(401).json({ msg: "Invalid credentials" });
        }
      } else {
        return res
          .status(401)
          .json({ msg: "This account uses Google Sign-In" });
      }

      const payload = { user: { id: user.id } };
      const token = jwt.sign(
        payload,
        process.env.JWT_SECRET || "your_jwt_secret_key_here",
        { expiresIn: "7d" }
      );

      res.json({
        token,
        user: { id: user.id, name: user.name, email: user.email },
      });
    } catch (err) {
      console.error(err.message);
      res.status(500).send("Server error");
    }
  }
);

// @route   POST /api/auth/google
router.post("/google", async (req, res) => {
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({ msg: "No token provided" });
  }

  try {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();

    const { email, name, sub: googleId } = payload;

    let user = await User.findOne({ where: { email: email.toLowerCase() } });
    if (!user) {
      user = User.build({
        name,
        email: email.toLowerCase(),
        googleId,
      });
      await user.save();
    } else if (!user.googleId) {
      user.googleId = googleId;
      await user.save();
    } else if (user.googleId !== googleId) {
      return res.status(400).json({ msg: "Google account mismatch" });
    }

    const payloadForToken = { user: { id: user.id } };
    const jwtToken = jwt.sign(
      payloadForToken,
      process.env.JWT_SECRET || "your_jwt_secret_key_here",
      { expiresIn: "7d" }
    );

    res.json({
      token: jwtToken,
      user: { id: user.id, name: user.name, email: user.email },
    });
  } catch (error) {
    console.error("Google auth error:", error);
    res.status(400).json({ msg: "Google sign-in failed. Please try again." });
  }
});

// @route   GET /api/auth/me
router.get("/me", auth, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password'] }
    });
    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

// @route   POST /api/auth/change-password
router.post(
  "/change-password",
  [
    auth,
    check("currentPassword", "Current password is required").exists(),
    check("newPassword", "New password must be at least 6 characters").isLength(
      { min: 6 }
    ),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    const { currentPassword, newPassword } = req.body;

    try {
      const user = await User.findByPk(req.user.id);
      if (user.password) {
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
          return res.status(401).json({ msg: "Current password is incorrect" });
        }
      } else {
        return res
          .status(400)
          .json({
            msg: "Cannot change password for Google-authenticated account",
          });
      }

      user.password = newPassword; // The model hook will hash this
      await user.save();

      res.json({ msg: "Password changed successfully" });
    } catch (err) {
      console.error(err.message);
      res.status(500).send("Server error");
    }
  }
);

// @route   GET /api/auth/favorites
router.get("/favorites", auth, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: ['favorites']
    });
    res.json({ favorites: user.favorites || [] });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

// @route   POST /api/auth/favorites
router.post("/favorites", auth, async (req, res) => {
  const { itemType, itemId, title, posterUrl } = req.body;

  if (!itemType || !itemId || !title) {
    return res
      .status(400)
      .json({ msg: "itemType, itemId, and title are required" });
  }

  try {
    const user = await User.findByPk(req.user.id);
    
    // We must clone the array to ensure Sequelize detects the change
    const currentFavorites = [...(user.favorites || [])];

    const existingIndex = currentFavorites.findIndex(
      (fav) => fav.itemId === String(itemId) && fav.itemType === itemType
    );

    if (existingIndex !== -1) {
      currentFavorites.splice(existingIndex, 1);
      user.favorites = currentFavorites;
      await user.save();
      return res.json({
        msg: "Removed from favorites",
        favorites: user.favorites,
        action: "removed",
      });
    } else {
      currentFavorites.push({ 
        _id: uuidv4(), // Generate a unique ID to match Mongoose behavior
        itemType, 
        itemId: String(itemId), 
        title, 
        posterUrl,
        addedAt: new Date()
      });
      user.favorites = currentFavorites;
      await user.save();
      return res.json({
        msg: "Added to favorites",
        favorites: user.favorites,
        action: "added",
      });
    }
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

// @route   DELETE /api/auth/favorites/:id
router.delete("/favorites/:id", auth, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    const currentFavorites = [...(user.favorites || [])];
    
    user.favorites = currentFavorites.filter(
      (fav) => fav._id !== req.params.id
    );
    await user.save();

    res.json({ msg: "Removed from favorites", favorites: user.favorites });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

module.exports = router;
