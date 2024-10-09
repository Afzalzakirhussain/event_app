'use server'

import { revalidatePath } from 'next/cache'
import { connectToDatabase } from '@/lib/database'
import Comment from '@/lib/database/models/comment.model'
import User from '@/lib/database/models/user.model'
import Event from '@/lib/database/models/event.model'
import { handleError } from '@/lib/utils'
import { CreateCommentParams } from '@/types'

export async function createComment({ userId, eventId, comment, path }: CreateCommentParams) {
  try {
    await connectToDatabase()

    // Check if userId is valid
    const user = await User.findById(userId)
    if (!user) {
      throw new Error('User not found')
    }

    // Check if eventId is valid
    const event = await Event.findById(eventId)
    if (!event) {
      throw new Error('Event not found')
    }

    const newComment = await Comment.create({
      content: comment.content,
      event: eventId,
      user: userId,
    })

    // Populate user and event details
    await newComment.populate('user', 'firstName lastName')
    await newComment.populate('event', 'title')

    revalidatePath(path)

    return JSON.parse(JSON.stringify(newComment))
  } catch (error) {
    console.error("Error in createComment:", error)
    handleError(error)
  }
}

export async function getCommentsByEventId(eventId: string) {
  try {
    await connectToDatabase()

    const comments = await Comment.find({ event: eventId })
      .populate('user', 'firstName lastName')
      .populate('event', 'title')
      .sort({ createdAt: 'desc' })

    return JSON.parse(JSON.stringify(comments))
  } catch (error) {
    console.error("Error in getCommentsByEventId:", error)
    handleError(error)
  }
}

 
export async function deleteComment(commentId: string, userId: string, path: string) {
    try {
      await connectToDatabase();
  
      const comment = await Comment.findById(commentId);
  
      if (!comment) {
        throw new Error('Comment not found');
      }
  
      if (comment.user.toString() !== userId) {
        throw new Error('Unauthorized to delete this comment');
      }
  
      await Comment.findByIdAndDelete(commentId);
  
      revalidatePath(path);
  
      return { success: true };
    } catch (error) {
      console.error("Error in deleteComment:", error);
      handleError(error);
    }
  }