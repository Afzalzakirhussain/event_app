"use client";

import { useState, useEffect } from "react";
import {
  getCommentsByEventId,
  createComment,
} from "@/lib/actions/comment.actions";

interface Comment {
  _id: string;
  content: string;
  createdAt: string;
  user: { firstName: string; lastName: string };
}

interface CommentSectionProps {
  eventId: string;
  userId: string;
}

const CommentSection = ({ eventId, userId }: CommentSectionProps) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchComments = async () => {
      setIsLoading(true);
      try {
        const fetchedComments = await getCommentsByEventId(eventId);
        setComments(fetchedComments);
      } catch (error) {
        console.error("Failed to fetch comments:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchComments();
  }, [eventId]);

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) {
      alert("You must be logged in to comment.");
      return;
    }
    try {
      const createdComment = await createComment({
        userId: userId,
        eventId,
        comment: { content: newComment },
        path: `/events/${eventId}`,
      });
      setComments([createdComment, ...comments]);
      setNewComment("");
    } catch (error) {
      //   console.error("Failed to create comment:", error);
    }
  };

  if (isLoading) {
    return <div>Loading comments...</div>;
  }

  return (
    <div>
      <ul className="mb-4">
        {comments.map((comment) => (
          <li key={comment._id} className="mb-2">
            <p className="font-bold">{`${comment.user.firstName} ${comment.user.lastName}`}</p>
            <p>{comment.content}</p>
            <p className="text-sm text-gray-500">
              {new Date(comment.createdAt).toLocaleString()}
            </p>
          </li>
        ))}
      </ul>
      <form onSubmit={handleSubmitComment}>
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          className="w-full p-2 border rounded"
          placeholder="Write a comment..."
          rows={3}
        />
        <button
          type="submit"
          className="mt-2 px-4 py-2 bg-primary-500 text-white rounded"
        >
          Post Comment
        </button>
      </form>
    </div>
  );
};

export default CommentSection;
