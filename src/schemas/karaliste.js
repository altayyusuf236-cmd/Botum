const { Schema, model } = require("mongoose");

const karalisteSchema = new Schema({
    userId: {
        type: String,
        required: true,
        unique: true // Aynı kişiyi iki kere eklemeyi engeller
    },
    tarih: {
        type: Date,
        default: Date.now
    }
});

module.exports = model("Karaliste", karalisteSchema);