import { IEvent } from "@/lib/database/models/event.model";
import { formatDateTime } from "@/lib/utils";
import { auth } from "@clerk/nextjs";
import Image from "next/image";
import Link from "next/link";
import React from "react";
import { DeleteConfirmation } from "./DeleteConfirmation";

type CardProps = {
  event: IEvent;
  hasOrderLink?: boolean;
  hidePrice?: boolean;
};

type ExtendedEvent = IEvent & {
  quantity?: number;
  availableTickets?: number;
};

const Card = ({ event, hasOrderLink, hidePrice }: CardProps) => {
  const { sessionClaims } = auth();
  const userId = sessionClaims?.userId as string;
  const isEventCreator = userId === event?.organizer?._id.toString();
  const extendedEvent = event as ExtendedEvent;

  const renderStarRating = (rating: number) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

    return (
      <div className="flex items-center gap-1">
        {[...Array(fullStars)].map((_, i) => (
          <svg
            key={`full-${i}`}
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            fill="currentColor"
            className="bi bi-star-fill text-yellow-400"
            viewBox="0 0 16 16"
          >
            <path d="M3.612 15.443c-.386.198-.824-.149-.746-.592l.83-4.73L.173 6.765c-.329-.314-.158-.888.283-.95l4.898-.696L7.538.792c.197-.39.73-.39.927 0l2.184 4.327 4.898.696c.441.062.612.636.282.95l-3.522 3.356.83 4.73c.078.443-.36.79-.746.592L8 13.187l-4.389 2.256z" />
          </svg>
        ))}
        {hasHalfStar && (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            fill="currentColor"
            className="bi bi-star-half text-yellow-400"
            viewBox="0 0 16 16"
          >
            <path d="M5.354 5.119 7.538.792A.52.52 0 0 1 8 .5c.183 0 .366.097.465.292l2.184 4.327 4.898.696A.54.54 0 0 1 16 6.32a.55.55 0 0 1-.17.445l-3.523 3.356.83 4.73c.078.443-.36.79-.746.592L8 13.187l-4.389 2.256a.5.5 0 0 1-.146.05c-.342.06-.668-.254-.6-.642l.83-4.73L.173 6.765a.55.55 0 0 1-.172-.403.6.6 0 0 1 .085-.302.51.51 0 0 1 .37-.245zM8 12.027a.5.5 0 0 1 .232.056l3.686 1.894-.694-3.957a.56.56 0 0 1 .162-.505l2.907-2.77-4.052-.576a.53.53 0 0 1-.393-.288L8.001 2.223 8 2.226z" />
          </svg>
        )}
        {[...Array(emptyStars)].map((_, i) => (
          <svg
            key={`empty-${i}`}
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            fill="currentColor"
            className="bi bi-star text-yellow-400"
            viewBox="0 0 16 16"
          >
            <path d="M2.866 14.85c-.078.444.36.791.746.593l4.39-2.256 4.389 2.256c.386.198.824-.149.746-.592l-.83-4.73 3.522-3.356c.33-.314.16-.888-.282-.95l-4.898-.696L8.465.792a.513.513 0 0 0-.927 0L5.354 5.12l-4.898.696c-.441.062-.612.636-.283.95l3.523 3.356-.83 4.73zm4.905-2.767-3.686 1.894.694-3.957a.56.56 0 0 0-.163-.505L1.71 6.745l4.052-.576a.53.53 0 0 0 .393-.288L8 2.223l1.847 3.658a.53.53 0 0 0 .393.288l4.052.575-2.906 2.77a.56.56 0 0 0-.163.506l.694 3.957-3.686-1.894a.5.5 0 0 0-.461 0z" />
          </svg>
        ))}
        <span className="ml-2 text-sm text-gray-600">{rating.toFixed(1)}</span>
      </div>
    );
  };

  return (
    <div className="group relative flex min-h-[380px] w-full max-w-[400px] flex-col overflow-hidden rounded-xl bg-white shadow-md transition-all hover:shadow-lg md:min-h-[438px]">
      <Link
        href={`/events/${event?._id}`}
        style={{ backgroundImage: `url(${event?.imageUrl})` }}
        className="flex-center flex-grow bg-gray-50 bg-cover bg-center text-grey-500"
      />
      {/* IS EVENT CREATOR ... */}

      {isEventCreator && !hidePrice && (
        <div className="absolute right-2 top-2 flex flex-col gap-4 rounded-xl bg-white p-3 shadow-sm transition-all">
          <Link href={`/events/${event?._id}/update`}>
            <Image
              src="/assets/icons/edit.svg"
              alt="edit"
              width={20}
              height={20}
            />
          </Link>

          <DeleteConfirmation eventId={event?._id} />
        </div>
      )}

      <div className="flex min-h-[230px] flex-col gap-3 p-5 md:gap-4">
        {!hidePrice && (
          <div className="flex gap-2">
            <span className="p-semibold-14 w-min rounded-full bg-green-100 px-4 py-1 text-green-60">
              {event?.isFree ? "FREE" : `₹${event?.price}`}
            </span>
            <p className="p-semibold-14 w-min rounded-full bg-grey-500/10 px-4 py-1 text-grey-500 line-clamp-1">
              {event?.category?.name}
            </p>
          </div>
        )}
        <p className="p-medium-16 p-medium-18 text-grey-500">
          {formatDateTime(event?.startDateTime).dateTime}
        </p>
        {!hidePrice ? (
          <p className="p-medium-16 p-medium-18 text-grey-500">
            Available Tickets: {event?.availableTickets}
          </p>
        ) : (
          <p className="p-medium-16 p-medium-18 text-grey-500">
            Tickets Booked: {extendedEvent?.quantity ?? "N/A"}
          </p>
        )}
        <Link href={`/events/${event?._id}`}>
          <p className="p-medium-16 md:p-medium-20 line-clamp-2 flex-1 text-black">
            {event?.title}
          </p>
        </Link>
        {renderStarRating(event?.averageRating || 0)}
        <div className="flex-between w-full">
          <p className="p-medium-14 md:p-medium-16 text-grey-600">
            {event?.organizer?.firstName} {event?.organizer?.lastName}
          </p>

          {hasOrderLink && (
            <Link href={`/orders?eventId=${event?._id}`} className="flex gap-2">
              <p className="text-primary-500">Order Details</p>
              <Image
                src="/assets/icons/arrow.svg"
                alt="search"
                width={10}
                height={10}
              />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

export default Card;
