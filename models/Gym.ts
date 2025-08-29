import mongoose from "mongoose";

const gymSchema = new mongoose.Schema({
    gymName: {
        type: String,
        required: true,
    },
    gymLeader: {
        type: String,
        required: true,
    },
    gymBadge: {
        type: String,
        required: true,
    },
    gymMembers: {
        type: [mongoose.Schema.Types.ObjectId],
        ref: "Trainer",
        default: [],
    },
})

export const Gym = mongoose.model("Gym", gymSchema);