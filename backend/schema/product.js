const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
  id: {
    type: Number,
    required: true,
    unique: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    required: true,
    enum: ["men's clothing", "women's clothing", "electronics", "jewelry"], // Update as needed
  },
  image: {
    type: String,
    required: true,
    match: /^(https?:\/\/.*\.(?:png|jpg|jpeg|gif|svg))/i // Ensures a valid URL format for images
  },
  sold: {
    type: Boolean,
    default: false
  },
  dateOfSale: {
    type: Date,
    default: null
  }
});

module.exports = mongoose.model('Product', ProductSchema);
