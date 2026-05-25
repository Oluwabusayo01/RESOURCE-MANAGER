import Activity from "../models/activity.model.js";

export const createActivity = async (type, description, actor = null) => {
  await Activity.create({
    type,
    description,
    actor,
  });
};
