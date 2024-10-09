"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { rateEvent, getUserRating } from "@/lib/actions/event.actions";

interface RatingSectionProps {
  eventId: string;
  initialRating: number;
}

const RatingSection = ({ eventId, initialRating }: RatingSectionProps) => {
  const [averageRating, setAverageRating] = useState(initialRating);
  const [userRating, setUserRating] = useState(0);
  const [hover, setHover] = useState(0);
  const { user } = useUser();

  useEffect(() => {
    const fetchUserRating = async () => {
      if (user) {
        const rating = await getUserRating(eventId, user.id);
        if (rating) {
          setUserRating(rating);
        }
      }
    };
    fetchUserRating();
  }, [eventId, user]);

  const handleRating = async (value: number) => {
    if (user) {
      setUserRating(value);
      const newAverageRating = await rateEvent(eventId, user.id, value);
      setAverageRating(newAverageRating);
    } else {
      alert("You must be logged in to rate events.");
    }
  };

  const renderStars = (rating: number, isInteractive: boolean = false) => {
    return (
      <div className="flex items-center gap-1">
        {[...Array(5)].map((_, index) => {
          index += 1;
          return (
            <button
              type="button"
              key={index}
              className={`${
                index <= (isInteractive ? hover || userRating : rating)
                  ? "text-yellow-400"
                  : "text-gray-300"
              } text-2xl`}
              onClick={() => isInteractive && handleRating(index)}
              onMouseEnter={() => isInteractive && setHover(index)}
              onMouseLeave={() => isInteractive && setHover(userRating)}
              disabled={!isInteractive}
            >
              <span className="star">&#9733;</span>
            </button>
          );
        })}
        <span className="ml-2 text-sm text-gray-600">{rating.toFixed(1)}</span>
      </div>
    );
  };

  return (
    <div className="flex flex-col items-start gap-4">
      <div>
        <h3 className="text-lg font-semibold">Average Rating</h3>
        {renderStars(averageRating)}
      </div>
      {user && (
        <div>
          <h3 className="text-lg font-semibold">Your Rating</h3>
          {renderStars(userRating, true)}
        </div>
      )}
    </div>
  );
};

export default RatingSection;
