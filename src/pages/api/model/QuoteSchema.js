import mongoose from 'mongoose';

const quoteSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
    },
    quote: {
        content: String,
        anime: {
            name: String,
            altName: String,
        },
        character: {
            name: String,
        },
    },
    timestamp: {
        type: Date,
        default: Date.now,
    },
});

export const Quote = mongoose.models.Quote || mongoose.model('Quote', quoteSchema);