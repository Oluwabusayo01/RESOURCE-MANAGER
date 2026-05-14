import { validationResult, matchedData } from "express-validator";
import User from "../models/user.model.js";
import Resource from "../models/resource.model.js";

export const createResource = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      statusCode: 400,
      success: false,
      message: errors.array()[0].msg,
    });
  }

  try {
    const { name, type, description, capacity, image, status } =
      matchedData(req);
    const existingResource = await Resource.findOne({ name });
    if (existingResource) {
      return res.status(400).json({
        success: false,
        message: "Resource with this name already exists",
      });
    }

    const newResource = new Resource({
      name,
      type,
      description,
      capacity,
      image,
      status,
    });
    await newResource.save();

    return res.status(201).json({
      statusCode: 201,
      success: true,
      message: "Resource created successfully",
      data: newResource,
    });
  } catch (error) {
    console.error("Error creating resources", error.message);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

export const updateResource = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      statusCode: 400,
      success: false,
      message: errors.array()[0].msg,
    });
  }

  try {
    const { id, name, type, description, capacity, image, status } =
      matchedData(req);

    const resource = await Resource.findById(id);
    if (!resource) {
      return res.status(404).json({
        success: false,
        message: "Resource not found",
      });
    }

    // Update the resource fields
    if (name) {
      resource.name = name;
    }
    if (type) {
      resource.type = type;
    }
    if (description) {
      resource.description = description;
    }
    if (capacity !== undefined) {
      resource.capacity = capacity;
    }
    if (image) {
      resource.image = image;
    }
    if (status) {
      resource.status = status;
    }
    await resource.save();

    return res.status(200).json({
      statusCode: 200,
      success: true,
      message: "Resource updated successfully",
      data: resource,
    });
  } catch (error) {
    console.error("Error updating resources", error.message);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

export const getAllResources = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      statusCode: 400,
      success: false,
      message: errors.array()[0].msg,
    });
  }
  try {
    const { status, page: pageParam, limit: limitParam } = matchedData(req);
    const page = Number(pageParam) || 1;
    const limit = Number(limitParam) || 10;
    const skip = (page - 1) * limit;

    const filter = {};
    if (status) {
      filter.status = status;
    }

    const [resources, totalResources] = await Promise.all([
      Resource.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Resource.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      data: resources,
      pagination: {
        totalResources,
        page,
        limit,
        totalPages: Math.ceil(totalResources / limit),
        hasNextPage: page * limit < totalResources,
      },
    });
  } catch (error) {
    console.error("Error getting resources", error.message);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};
