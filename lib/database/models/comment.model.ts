import { Document, Schema, model, models } from "mongoose";

export interface IComment extends Document {
  _id: string;
  content: string;
  createdAt: Date;
  event: { _id: string, title: string }
  user: { _id: string, firstName: string, lastName: string }
}

const CommentSchema = new Schema({
  content: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  event: { type: Schema.Types.ObjectId, ref: 'Event', required: true },
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
})

const Comment = models.Comment || model('Comment', CommentSchema);

export default Comment;