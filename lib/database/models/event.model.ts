import { Document, Schema, Types, model, models } from "mongoose";

interface IRating {
  user: string;
  value: number;
}
export interface IEvent extends Document {
  _id: string;
  title: string;
  description?: string;
  location?: string;
  createdAt: Date;
  imageUrl: string;
  startDateTime: Date;
  endDateTime: Date;
  price: string;
  isFree: boolean;
  url?: string;
  category: { _id: string; name: string };
  organizer: { _id: string; firstName: string; lastName: string };
  availableTickets: number;
  totalTickets: number;
  ratings: IRating[];
  averageRating: number;
}

const EventSchema = new Schema(
  {
    title: { type: String, required: true },
    description: { type: String },
    location: { type: String },
    createdAt: { type: Date, default: Date.now },
    imageUrl: { type: String, required: true },
    startDateTime: { type: Date, default: Date.now },
    endDateTime: { type: Date, default: Date.now },
    price: { type: String },
    isFree: { type: Boolean, default: false },
    url: { type: String },
    category: { type: Schema.Types.ObjectId, ref: "Category" },
    organizer: { type: Schema.Types.ObjectId, ref: "User" },
    availableTickets: { type: Number, required: true },
    totalTickets: { type: Number, required: true },
    quantity: { type: Number },
    ratings: [
      {
        user: { type: String, required: true }, // Changed from Schema.Types.ObjectId to String
        value: { type: Number, min: 1, max: 5 },
      },
    ],
    averageRating: { type: Number, default: 0 },
  }
  // {
  //   timestamps: true, // This will add createdAt and updatedAt fields
  //   toJSON: { virtuals: true },
  //   toObject: { virtuals: true },
  // }
);

EventSchema.pre("save", function (next) {
  if (!this.ratings) {
    this.ratings = new Types.DocumentArray<{
      user: string;
      value: number;
    }>([]);
  }
  next();
});

const Event = models.Event || model("Event", EventSchema);

export default Event;
