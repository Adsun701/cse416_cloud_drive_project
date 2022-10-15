const mongoose = require('mongoose');

const { Schema } = mongoose;

const SearchQuerySchema = new Schema(
  {
    query: { type: String },
  },
  { timestamps: true },
);

module.exports = mongoose.model('SearchQuery', SearchQuerySchema);
