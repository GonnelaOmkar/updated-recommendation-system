const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const bcrypt = require('bcryptjs');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  password: {
    type: DataTypes.STRING,
    allowNull: true // Optional for Google Auth
  },
  googleId: {
    type: DataTypes.STRING,
    allowNull: true
  },
  passwordResetToken: {
    type: DataTypes.STRING,
    allowNull: true
  },
  passwordResetExpires: {
    type: DataTypes.DATE,
    allowNull: true
  },
  favorites: {
    type: DataTypes.TEXT, // Storing JSON array as TEXT in SQLite
    defaultValue: '[]',
    get() {
      const rawValue = this.getDataValue('favorites');
      return rawValue ? JSON.parse(rawValue) : [];
    },
    set(value) {
      this.setDataValue('favorites', JSON.stringify(value));
    }
  }
}, {
  hooks: {
    beforeSave: async (user) => {
      // Normalize email
      if (user.changed('email') && user.email) {
        user.email = user.email.toLowerCase();
      }

      // Hash password if changed and no googleId
      if (user.changed('password') && user.password && !user.googleId) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
      }
    }
  }
});

module.exports = User;
