"use server";

import { revalidatePath } from "next/cache";

import { connectToDatabase } from "@/lib/database";
import Event from "@/lib/database/models/event.model";
import User from "@/lib/database/models/user.model";
import Category from "@/lib/database/models/category.model";
import { handleError } from "@/lib/utils";

import {
  CreateEventParams,
  UpdateEventParams,
  DeleteEventParams,
  GetAllEventsParams,
  GetEventsByUserParams,
  GetRelatedEventsByCategoryParams,
} from "@/types";
import mongoose, { Types } from "mongoose";

const getCategoryByName = async (name: string) => {
  return Category.findOne({ name: { $regex: name, $options: "i" } });
};

const populateEvent = (query: any) => {
  return query
    .populate({
      path: "organizer",
      model: User,
      select: "_id firstName lastName",
    })
    .populate({ path: "category", model: Category, select: "_id name" });
};

// CREATE
export async function createEvent({ userId, event, path }: CreateEventParams) {
  try {
    console.log(event, "event");
    await connectToDatabase();
    console.log("Attempting to create event with userId:", userId);

    // Check if userId is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new Error(`Invalid userId: ${userId}`);
    }
    const organizer = await User.findById(userId);
    if (!organizer) {
      console.log("Organizer not found for userId:", userId);
      throw new Error("Organizer not found");
    }

    // const newEvent = await Event.create({ ...event,
    //   category: event.categoryId,
    //   organizer: userId,
    //   availableTickets: event.totalTickets,
    //   totalTickets: event.totalTickets,
    //   ratings: [],
    //   averageRating: 0,
    // })
    const newEventData = {
      ...event,
      category: new Types.ObjectId(event.categoryId),
      organizer: new Types.ObjectId(userId),
      availableTickets: event.totalTickets,
      totalTickets: event.totalTickets,
      ratings: [], // Explicitly set an empty array
      averageRating: 0, // Explicitly set to 0
    };

    const newEvent = await Event.create(newEventData);

    console.log("New event created:", newEvent); // Log the created event

    revalidatePath(path);

    return JSON.parse(JSON.stringify(newEvent));
  } catch (error) {
    console.error("Error in createEvent:", error);
    handleError(error);
  }
}

// GET ONE EVENT BY ID
export async function getEventById(eventId: string) {
  try {
    await connectToDatabase();
    console.log(eventId, "eventId");
    const rawEvent = await Event.findById(eventId);
    console.log(rawEvent, "rawEvent");
    const event = await populateEvent(Event.findById(eventId));
    console.log(event, "event");

    if (!event) throw new Error("Event not found");

    return JSON.parse(JSON.stringify(event));
  } catch (error) {
    handleError(error);
  }
}

// UPDATE
export async function updateEvent({ userId, event, path }: UpdateEventParams) {
  try {
    await connectToDatabase();

    const eventToUpdate = await Event.findById(event._id);
    if (!eventToUpdate || eventToUpdate.organizer.toHexString() !== userId) {
      throw new Error("Unauthorized or event not found");
    }

    const updatedEvent = await Event.findByIdAndUpdate(
      event._id,
      {
        ...event,
        category: event.categoryId,
        availableTickets: event.totalTickets,
        totalTickets: event.totalTickets,
      },
      { new: true }
    );
    revalidatePath(path);

    return JSON.parse(JSON.stringify(updatedEvent));
  } catch (error) {
    handleError(error);
  }
}

// UPDATE EVENT TICKETS
export async function updateEventTickets(
  eventId: string,
  ticketsBought: number
) {
  try {
    await connectToDatabase();

    const event = await Event.findById(eventId);
    if (!event) throw new Error("Event not found");

    const updatedAvailableTickets = event.availableTickets - ticketsBought;

    if (updatedAvailableTickets < 0)
      throw new Error("Not enough tickets available");

    const updatedEvent = await Event.findByIdAndUpdate(
      eventId,
      { $inc: { availableTickets: -ticketsBought } },
      { new: true }
    );

    revalidatePath(`/events/${eventId}`);

    return JSON.parse(JSON.stringify(updatedEvent));
  } catch (error) {
    handleError(error);
  }
}

// DELETE
export async function deleteEvent({ eventId, path }: DeleteEventParams) {
  try {
    await connectToDatabase();

    const deletedEvent = await Event.findByIdAndDelete(eventId);
    if (deletedEvent) revalidatePath(path);
  } catch (error) {
    handleError(error);
  }
}

// GET ALL EVENTS
export async function getAllEvents({
  query,
  limit = 6,
  page,
  category,
}: GetAllEventsParams) {
  try {
    await connectToDatabase();

    const titleCondition = query
      ? { title: { $regex: query, $options: "i" } }
      : {};
    const categoryCondition = category
      ? await getCategoryByName(category)
      : null;
    const conditions = {
      $and: [
        titleCondition,
        categoryCondition ? { category: categoryCondition._id } : {},
      ],
    };

    const skipAmount = (Number(page) - 1) * limit;
    const eventsQuery = Event.find(conditions)
      .sort({ createdAt: "desc" })
      .skip(skipAmount)
      .limit(limit);

    const events = await populateEvent(eventsQuery);
    const eventsCount = await Event.countDocuments(conditions);

    return {
      data: JSON.parse(JSON.stringify(events)),
      totalPages: Math.ceil(eventsCount / limit),
    };
  } catch (error) {
    console.log(error, "ERROR");
    handleError(error);
  }
}

// GET EVENTS BY ORGANIZER
export async function getEventsByUser({
  userId,
  limit = 6,
  page,
}: GetEventsByUserParams) {
  try {
    await connectToDatabase();

    const conditions = { organizer: userId };
    const skipAmount = (page - 1) * limit;

    const eventsQuery = Event.find(conditions)
      .sort({ createdAt: "desc" })
      .skip(skipAmount)
      .limit(limit);

    const events = await populateEvent(eventsQuery);
    const eventsCount = await Event.countDocuments(conditions);

    return {
      data: JSON.parse(JSON.stringify(events)),
      totalPages: Math.ceil(eventsCount / limit),
    };
  } catch (error) {
    handleError(error);
  }
}

// GET RELATED EVENTS: EVENTS WITH SAME CATEGORY
export async function getRelatedEventsByCategory({
  categoryId,
  eventId,
  limit = 3,
  page = 1,
}: GetRelatedEventsByCategoryParams) {
  try {
    await connectToDatabase();

    const skipAmount = (Number(page) - 1) * limit;
    const conditions = {
      $and: [{ category: categoryId }, { _id: { $ne: eventId } }],
    };

    const eventsQuery = Event.find(conditions)
      .sort({ createdAt: "desc" })
      .skip(skipAmount)
      .limit(limit);

    const events = await populateEvent(eventsQuery);
    const eventsCount = await Event.countDocuments(conditions);

    return {
      data: JSON.parse(JSON.stringify(events)),
      totalPages: Math.ceil(eventsCount / limit),
    };
  } catch (error) {
    handleError(error);
  }
}

export async function rateEvent(
  eventId: string,
  userId: string,
  rating: number
) {
  try {
    await connectToDatabase();

    const event = await Event.findById(eventId);
    if (!event) {
      throw new Error("Event not found");
    }

    // Find the user's existing rating, if any
    const existingRatingIndex = event.ratings.findIndex(
      (r: any) => r.user === userId
    );

    if (existingRatingIndex > -1) {
      // Update existing rating
      event.ratings[existingRatingIndex].value = rating;
    } else {
      // Add new rating
      event.ratings.push({ user: userId, value: rating });
    }

    // Calculate new average rating
    const totalRating = event.ratings.reduce(
      (sum: any, r: any) => sum + r.value,
      0
    );
    event.averageRating =
      event.ratings.length > 0 ? totalRating / event.ratings.length : 0;

    await event.save();

    return event.averageRating;
  } catch (error) {
    console.error("Error in rateEvent:", error);
    handleError(error);
  }
}

export async function getUserRating(eventId: string, userId: string) {
  try {
    await connectToDatabase();

    const event = await Event.findById(eventId);
    if (!event) {
      throw new Error("Event not found");
    }

    // Check if the ratings field exists
    if (!event.ratings || !Array.isArray(event.ratings)) {
      console.log("No ratings found for this event");
      return null;
    }

    const userRating = event.ratings.find(
      (r: any) => r.user.toString() === userId
    );
    return userRating ? userRating.value : null;
  } catch (error) {
    console.error("Error in getUserRating:", error);
    handleError(error);
  }
}
