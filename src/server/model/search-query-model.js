const mongoose = require('mongoose')
const Schema = mongoose.Schema

const SearchQuerySchema = new Schema(
    {
        query: { type: String, required: true }
    },
    { timestamps: true },
)

module.exports = mongoose.model('SearchQuery', SearchQuerySchema)
