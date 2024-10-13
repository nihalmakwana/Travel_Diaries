import mongoose, { Schema } from "mongoose"

const travelStorySchema = new Schema(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        title: {
            type: String,
            required: true
        },
        story: {
            type: String,
            required: true
        },
        visitedLocation: {
            type: [String],
            default: []
        },
        isFavourite: {
            type: Boolean,
            default: false
        },
        createdOn: {
            type: Date,
            default: Date.now
        },
        imageUrl: {
            type: String,
            required: true
        },
        visitedDate: {
            type: Date,
            required: true
        }
    }
)

export const TravelStory = mongoose.model("TravelStory", travelStorySchema)