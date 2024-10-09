"use client";

import { useState, useEffect, useRef } from "react";
import {
  getCommentsByEventId,
  createComment,
  deleteComment,
} from "@/lib/actions/comment.actions";
import { useUser } from "@clerk/nextjs";

interface Comment {
  _id: string;
  content: string;
  createdAt: string;
  user: { _id: string; firstName: string; lastName: string };
}

interface CommentSectionProps {
  eventId: string;
  userId: string;
}

const CommentSection = ({ eventId, userId }: CommentSectionProps) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setOpenDropdownId(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

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
      console.error("Failed to create comment:", error);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!userId) {
      alert("You must be logged in to delete a comment.");
      return;
    }
    try {
      await deleteComment(commentId, userId, `/events/${eventId}`);
      setComments(comments.filter((comment) => comment._id !== commentId));
      setOpenDropdownId(null);
    } catch (error) {
      console.error("Failed to delete comment:", error);
    }
  };

  const toggleDropdown = (commentId: string) => {
    setOpenDropdownId(openDropdownId === commentId ? null : commentId);
  };

  if (isLoading) {
    return <div>Loading comments...</div>;
  }

  return (
    <div>
      <ul className="mb-4">
        {comments.map((comment) => (
          <li key={comment._id} className="mb-2 p-2 border-b">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-bold">{`${comment.user.firstName} ${comment.user.lastName}`}</p>
                <p>{comment.content}</p>
                <p className="text-sm text-gray-500">
                  {new Date(comment.createdAt).toLocaleString()}
                </p>
              </div>
              {userId && userId === comment.user._id && (
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => toggleDropdown(comment._id)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    •••
                  </button>
                  {openDropdownId === comment._id && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10">
                      <button
                        onClick={() => handleDeleteComment(comment._id)}
                        className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
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
