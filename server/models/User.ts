import mongoose, { Schema } from "mongoose";

export interface IUser extends mongoose.Document {
  email: string;
  name: string;
  phone?: string;
  passwordHash: string;
  role: "USER" | "ADMIN";
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    phone: { type: String },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ["USER", "ADMIN"], default: "USER" },
    isActive: { type: Boolean, default: true },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      versionKey: false,
      transform: (_doc, ret) => {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.passwordHash;
      },
    },
  },
);

// Force a single well-typed model instance to avoid mongoose v8 union overload issues
export const UserModel: mongoose.Model<IUser> =
  (mongoose.models.User as mongoose.Model<IUser> | undefined) ||
  mongoose.model<IUser>("User", UserSchema);
