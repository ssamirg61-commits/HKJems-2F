import mongoose, { Schema } from "mongoose";

interface ISideStone {
  id: string;
  description: string;
  shape: string;
  weight: string;
}

export interface IDesign extends mongoose.Document {
  userId: string;
  designNumber: string;
  style: string;
  goldKarat: string;
  approxGoldWeight: string;
  stoneType: string;
  diamondShape: string;
  caratWeight: string;
  clarity: string;
  sideStones: ISideStone[];
  marking: string;
  logoFileName?: string;
  logoData?: string;
  mediaFileName?: string;
  mediaData?: string;
  createdAt: Date;
  updatedAt: Date;
}

const SideStoneSchema = new Schema<ISideStone>(
  {
    id: { type: String, required: true },
    description: { type: String },
    shape: { type: String },
    weight: { type: String },
  },
  { _id: false },
);

const DesignSchema = new Schema<IDesign>(
  {
    userId: { type: String, required: true, index: true },
    designNumber: { type: String, required: true, index: true },
    style: { type: String, required: true },
    goldKarat: { type: String, required: true },
    approxGoldWeight: { type: String, required: true },
    stoneType: { type: String, required: true },
    diamondShape: { type: String, required: true },
    caratWeight: { type: String, required: true },
    clarity: { type: String, required: true },
    sideStones: { type: [SideStoneSchema], default: [] },
    marking: { type: String, default: "" },
    logoFileName: { type: String },
    logoData: { type: String },
    mediaFileName: { type: String },
    mediaData: { type: String },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      versionKey: false,
      transform: (_doc, ret) => {
        ret.id = ret._id.toString();
        delete ret._id;
      },
    },
  },
);

export const DesignModel =
  mongoose.models.Design || mongoose.model<IDesign>("Design", DesignSchema);
