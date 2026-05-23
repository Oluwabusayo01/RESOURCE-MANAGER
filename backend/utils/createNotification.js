import Notification from "../models/notification.model.js";

export const createNotification = async (userId, type, message) => {
  await Notification.create({
    user: userId,
    type,
    message,
  });
};
