import { Sequelize, Model, DataTypes, Op } from "sequelize";
import dotenv from "dotenv";
import crypto from "crypto";

dotenv.config();

let sequelize;

if (process.env.MYSQL_URL) {
  sequelize = new Sequelize(process.env.MYSQL_URL, {
    dialect: "mysql",
    logging: false,
    define: {
      timestamps: true,
    },
  });
} else {
  const dbName = process.env.MYSQL_DATABASE || "resource_manager";
  const dbUser = process.env.MYSQL_USER || "root";
  const dbPass = process.env.MYSQL_PASSWORD || "";
  const dbHost = process.env.MYSQL_HOST || "localhost";
  const dbPort = process.env.MYSQL_PORT || 3306;

  sequelize = new Sequelize(dbName, dbUser, dbPass, {
    host: dbHost,
    port: dbPort,
    dialect: "mysql",
    logging: false,
    define: {
      timestamps: true,
    },
  });
}

// Generate 24-character hex ID (Mongo-compatible)
let counter = crypto.randomInt(0, 0xffffff);
export const generateObjectId = () => {
  const timestamp = Math.floor(Date.now() / 1000).toString(16).padStart(8, "0");
  const random = crypto.randomBytes(5).toString("hex");
  counter = (counter + 1) & 0xffffff;
  const counterHex = counter.toString(16).padStart(6, "0");
  return timestamp + random + counterHex;
};

// Convert MongoDB select format to Sequelize attributes
function convertSelect(selectFields) {
  if (!selectFields) return undefined;

  if (typeof selectFields === "string") {
    const fields = selectFields.split(/\s+/).filter(Boolean).map((f) => {
      if (f === "_id") return "id";
      if (f === "-_id") return "-id";
      return f;
    });

    const filteredFields = fields.filter((f) => f !== "__v" && f !== "-__v");

    const exclude = filteredFields.filter((f) => f.startsWith("-")).map((f) => f.slice(1));
    const include = filteredFields.filter((f) => !f.startsWith("-"));

    if (exclude.length > 0) {
      return { exclude };
    } else if (include.length > 0) {
      if (!include.includes("id")) {
        include.push("id");
      }
      return include;
    }
  } else if (typeof selectFields === "object" && selectFields !== null) {
    const exclude = [];
    const include = [];
    for (const [key, val] of Object.entries(selectFields)) {
      if (key === "__v") continue;
      const field = key === "_id" ? "id" : key;
      if (val === 0 || val === false) {
        exclude.push(field);
      } else if (val === 1 || val === true) {
        include.push(field);
      }
    }

    if (exclude.length > 0) {
      return { exclude };
    } else if (include.length > 0) {
      if (!include.includes("id")) {
        include.push("id");
      }
      return include;
    }
  }
  return undefined;
}

// Convert Mongoose populate options to Sequelize includes
function convertPopulateToIncludes(options, models) {
  if (!options) return [];
  const normalized = Array.isArray(options) ? options : [options];

  return normalized.map((opt) => {
    let path = "";
    let select = "";
    if (typeof opt === "string") {
      path = opt;
    } else {
      path = opt.path;
      select = opt.select;
    }

    let modelName = "";
    let as = path;
    if (path === "resource") {
      modelName = "Resource";
    } else if (path === "user") {
      modelName = "User";
    } else if (path === "cancelledBy") {
      modelName = "User";
      as = "cancelledBy";
    } else if (path === "actor") {
      modelName = "User";
      as = "actor";
    }

    const model = models[modelName];
    if (!model) {
      throw new Error(`Model not found for association: ${path}`);
    }

    const includeOpt = {
      model,
      as,
    };

    if (select) {
      const attributes = convertSelect(select);
      if (attributes) {
        includeOpt.attributes = attributes;
      }
    }

    return includeOpt;
  });
}

// Helper to check for plain objects
function isPlainObject(val) {
  if (val === null || typeof val !== "object") return false;
  const proto = Object.getPrototypeOf(val);
  return proto === null || proto === Object.prototype;
}

// Convert MongoDB filter to Sequelize where conditions
export function convertFilter(obj) {
  if (obj instanceof RegExp) {
    const source = obj.source.replace(/\\/g, "");
    return { [Op.like]: `%${source}%` };
  }

  if (Array.isArray(obj)) {
    return obj.map(convertFilter);
  }

  if (obj === null || typeof obj !== "object" || !isPlainObject(obj)) {
    return obj;
  }

  const result = {};
  for (const key of Object.keys(obj)) {
    let newKey = key;
    let val = obj[key];

    if (key === "$or") {
      newKey = Op.or;
      val = convertFilter(val);
    } else if (key === "$and") {
      newKey = Op.and;
      val = convertFilter(val);
    } else if (key === "$in") {
      newKey = Op.in;
      val = convertFilter(val);
    } else if (key === "$ne") {
      newKey = Op.ne;
      val = convertFilter(val);
    } else if (key === "$lt") {
      newKey = Op.lt;
      val = convertFilter(val);
    } else if (key === "$lte") {
      newKey = Op.lte;
      val = convertFilter(val);
    } else if (key === "$gt") {
      newKey = Op.gt;
      val = convertFilter(val);
    } else if (key === "$gte") {
      newKey = Op.gte;
      val = convertFilter(val);
    } else if (key === "_id") {
      newKey = "id";
      val = convertFilter(val);
    } else if (key === "resource") {
      newKey = "resourceId";
      val = convertFilter(val);
    } else if (key === "user") {
      newKey = "userId";
      val = convertFilter(val);
    } else if (key === "actor") {
      newKey = "actorId";
      val = convertFilter(val);
    } else if (key === "cancelledBy") {
      newKey = "cancelledById";
      val = convertFilter(val);
    } else {
      val = convertFilter(val);
    }

    result[newKey] = val;
  }
  return result;
}

// Chainable query builder to mimic Mongoose Query
class MongooseQuery {
  constructor(model, filter = {}, single = false) {
    this.model = model;
    this.single = single;
    this.sequelizeOptions = {
      where: convertFilter(filter),
      include: [],
    };
    this.isLean = false;
  }

  populate(path, select) {
    let opts = path;
    if (typeof path === "string" && select) {
      opts = { path, select };
    }
    const includes = convertPopulateToIncludes(opts, this.model.sequelize.models);
    this.sequelizeOptions.include.push(...includes);
    return this;
  }

  sort(sortObj) {
    if (typeof sortObj === "object" && sortObj !== null) {
      const order = [];
      for (const [key, val] of Object.entries(sortObj)) {
        const field = key === "_id" ? "id" : key;
        const direction = val === -1 || val === "desc" ? "DESC" : "ASC";
        order.push([field, direction]);
      }
      this.sequelizeOptions.order = order;
    } else if (typeof sortObj === "string") {
      const fields = sortObj.split(/\s+/).filter(Boolean);
      const order = [];
      for (let field of fields) {
        let direction = "ASC";
        if (field.startsWith("-")) {
          direction = "DESC";
          field = field.slice(1);
        }
        if (field === "_id") field = "id";
        order.push([field, direction]);
      }
      this.sequelizeOptions.order = order;
    }
    return this;
  }

  skip(skipVal) {
    if (skipVal !== undefined && skipVal !== null) {
      this.sequelizeOptions.offset = Number(skipVal);
    }
    return this;
  }

  limit(limitVal) {
    if (limitVal !== undefined && limitVal !== null) {
      this.sequelizeOptions.limit = Number(limitVal);
    }
    return this;
  }

  select(selectFields) {
    const attributes = convertSelect(selectFields);
    if (attributes) {
      this.sequelizeOptions.attributes = attributes;
    }
    return this;
  }

  lean() {
    this.isLean = true;
    return this;
  }

  async then(resolve, reject) {
    try {
      console.log("MongooseQuery.then options:", JSON.stringify(this.sequelizeOptions, null, 2));
      let result;
      if (this.single) {
        result = await Model.findOne.call(this.model, this.sequelizeOptions);
      } else {
        result = await Model.findAll.call(this.model, this.sequelizeOptions);
      }

      if (this.isLean) {
        if (Array.isArray(result)) {
          resolve(result.map((r) => r.toObject()));
        } else if (result) {
          resolve(result.toObject());
        } else {
          resolve(null);
        }
      } else {
        resolve(result);
      }
    } catch (error) {
      if (reject) reject(error);
      else throw error;
    }
  }
}

// Helper to map MongoDB references to physical SQL foreign keys
function convertValues(values, options) {
  if (!values || typeof values !== "object") return values;
  const converted = { ...values };

  const isDatabaseLoad = options && options.isNewRecord === false;

  if (converted.user !== undefined) {
    const val = converted.user;
    if (isDatabaseLoad) {
      // Keep it as is (populated association loaded from DB)
    } else if (!(val instanceof Model)) {
      converted.userId = val && typeof val === "object" && val.id ? val.id : val;
      delete converted.user;
    }
  }
  if (converted.resource !== undefined) {
    const val = converted.resource;
    if (isDatabaseLoad) {
      // Keep it as is (populated association loaded from DB)
    } else if (!(val instanceof Model)) {
      converted.resourceId = val && typeof val === "object" && val.id ? val.id : val;
      delete converted.resource;
    }
  }
  if (converted.actor !== undefined) {
    const val = converted.actor;
    if (isDatabaseLoad) {
      // Keep it as is (populated association loaded from DB)
    } else if (!(val instanceof Model)) {
      converted.actorId = val && typeof val === "object" && val.id ? val.id : val;
      delete converted.actor;
    }
  }
  if (converted.cancelledBy !== undefined) {
    const val = converted.cancelledBy;
    if (isDatabaseLoad) {
      // Keep it as is (populated association loaded from DB)
    } else if (!(val instanceof Model)) {
      converted.cancelledById = val && typeof val === "object" && val.id ? val.id : val;
      delete converted.cancelledBy;
    }
  }

  return converted;
}

// Base Sequelize Model with custom Mongoose-like static & instance methods
export class BaseSeqModel extends Model {
  constructor(values, options) {
    super(convertValues(values, options), options);
  }

  static create(values, options) {
    const converted = convertValues(values, options);
    return super.create(converted, options);
  }

  static bulkCreate(records, options) {
    const convertedRecords = Array.isArray(records) ? records.map(r => convertValues(r, options)) : records;
    return super.bulkCreate(convertedRecords, options);
  }

  static update(values, options) {
    return super.update(convertValues(values, options), options);
  }

  // Instance helpers
  get _id() {
    return this.id;
  }

  toString() {
    return this.id;
  }

  toObject() {
    const plainObj = this.get({ plain: true });
    if (plainObj.id && !plainObj._id) {
      plainObj._id = plainObj.id;
    }
    // Map associations
    for (const key of Object.keys(plainObj)) {
      if (plainObj[key] && typeof plainObj[key] === "object") {
        if (plainObj[key].id && !plainObj[key]._id) {
          plainObj[key]._id = plainObj[key].id;
        }
      }
    }
    return plainObj;
  }

  async deleteOne() {
    return this.destroy();
  }

  isModified(field) {
    if (this.isNewRecord) {
      return true;
    }
    return this.changed(field) !== false;
  }

  async populate(options) {
    const includes = convertPopulateToIncludes(options, this.constructor.sequelize.models);
    await this.reload({ include: includes });
    return this;
  }

  // Static builders
  static find(filter) {
    if (filter && filter.where !== undefined) {
      return Model.findAll.call(this, filter);
    }
    return new MongooseQuery(this, filter, false);
  }

  static findOne(filter) {
    if (filter && filter.where !== undefined) {
      return Model.findOne.call(this, filter);
    }
    return new MongooseQuery(this, filter, true);
  }

  static findById(id) {
    return new MongooseQuery(this, { _id: id }, true);
  }

  static countDocuments(filter) {
    return this.count({ where: convertFilter(filter) });
  }

  static deleteOne(filter) {
    return this.destroy({ where: convertFilter(filter), limit: 1 });
  }

  static deleteMany(filter) {
    return this.destroy({ where: convertFilter(filter) });
  }

  static findByIdAndDelete(id) {
    return this.destroy({ where: { id } });
  }

  static async findByIdAndUpdate(id, update, options = {}) {
    let values = update;
    if (update && update.$set) {
      values = update.$set;
    }
    const convertedValues = {};
    for (const [key, val] of Object.entries(values)) {
      const newKey =
        key === "resource" ? "resourceId" :
        key === "user" ? "userId" :
        key === "actor" ? "actorId" :
        key === "cancelledBy" ? "cancelledById" : key;
      convertedValues[newKey] = val;
    }
    await this.update(convertedValues, { where: { id } });
    if (options.new !== false) {
      return this.findOne({ _id: id });
    }
  }

  static updateMany(filter, update) {
    let values = update;
    if (update && update.$set) {
      values = update.$set;
    }
    const convertedValues = {};
    for (const [key, val] of Object.entries(values)) {
      const newKey =
        key === "resource" ? "resourceId" :
        key === "user" ? "userId" :
        key === "actor" ? "actorId" :
        key === "cancelledBy" ? "cancelledById" : key;
      convertedValues[newKey] = val;
    }
    return this.update(convertedValues, { where: convertFilter(filter) });
  }

  static generateId() {
    return generateObjectId();
  }
}

const connectDatabase = async () => {
  try {
    await sequelize.authenticate();
    console.log("MySQL connection established successfully!");

    // Dynamically load models so they register with Sequelize
    await import("../models/user.model.js");
    await import("../models/resource.model.js");
    await import("../models/booking.model.js");
    await import("../models/library.model.js");
    await import("../models/notification.model.js");
    await import("../models/activity.model.js");

    const { User, Resource, Booking, Notification, Activity, Library } = sequelize.models;

    // Define relationships
    if (Booking) {
      Booking.belongsTo(Resource, { foreignKey: "resourceId", as: "resource" });
      Booking.belongsTo(User, { foreignKey: "userId", as: "user" });
      Booking.belongsTo(User, { foreignKey: "cancelledById", as: "cancelledBy" });
    }
    if (Library) {
      Library.belongsTo(User, { foreignKey: "userId", as: "user" });
    }
    if (Notification) {
      Notification.belongsTo(User, { foreignKey: "userId", as: "user" });
    }
    if (Activity) {
      Activity.belongsTo(User, { foreignKey: "actorId", as: "actor" });
    }

    // Specific Aggregation overrides for booking.controller / admin.controller
    if (Booking) {
      Booking.aggregate = async function (...args) {
        if (typeof args[0] === "string" && typeof args[1] === "string") {
          return Model.aggregate.apply(this, args);
        }
        const pipeline = Array.isArray(args[0]) ? args[0] : args;
        const isMostBookedResource = pipeline.some(
          (step) =>
            step.$group &&
            step.$group._id === "$resource" &&
            pipeline.some((s) => s.$lookup && s.$lookup.from === "resources")
        );

        if (isMostBookedResource) {
          const results = await sequelize.query(
            `
            SELECT b.resourceId AS id, r.name, COUNT(*) AS bookingCount
            FROM Bookings b
            LEFT JOIN Resources r ON b.resourceId = r.id
            GROUP BY b.resourceId, r.name
            ORDER BY bookingCount DESC
            LIMIT 1
          `,
            { type: sequelize.QueryTypes.SELECT }
          );

          return results.map((r) => ({
            bookingCount: Number(r.bookingCount),
            id: r.id,
            name: r.name,
          }));
        }

        const isDeptCount = pipeline.some((step) => step.$group && step.$group._id === "$department");

        if (isDeptCount) {
          const results = await sequelize.query(
            `
            SELECT department AS _id, COUNT(*) AS count
            FROM Bookings
            GROUP BY department
            ORDER BY count DESC
          `,
            { type: sequelize.QueryTypes.SELECT }
          );

          return results.map((r) => ({
            _id: r._id,
            count: Number(r.count),
          }));
        }

        const isPeakHours = pipeline.some((step) => step.$project && step.$project.hour);

        if (isPeakHours) {
          const results = await sequelize.query(
            `
            SELECT CONCAT(SUBSTRING(startTime, 1, 2), ':00') AS _id, COUNT(*) AS count
            FROM Bookings
            WHERE startTime IS NOT NULL
            GROUP BY _id
            ORDER BY _id ASC
          `,
            { type: sequelize.QueryTypes.SELECT }
          );

          return results.map((r) => ({
            _id: r._id,
            count: Number(r.count),
          }));
        }

        console.error("Unsupported aggregation pipeline received:", JSON.stringify(pipeline, null, 2));
        throw new Error("Unsupported aggregation pipeline");
      };
    }

    await sequelize.sync();
    console.log("Database tables synchronized successfully.");
  } catch (error) {
    console.error(`Error connecting to MySQL: ${error.message}`);
    throw error;
  }
};

export { sequelize };
export default connectDatabase;
