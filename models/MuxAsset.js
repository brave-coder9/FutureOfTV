const mongoose = require("mongoose");

const MuxAssetSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  uploadId: { type: String, required: true },
  status: { type: String, required: true },
  title: { type: String },
  metadata: { type: String },
  chapters: [
    {
      title: { type: String, required: true },
      description: { type: String },
      time: { type: Number },
    },
  ],
});

module.exports = mongoose.model("MuxAsset", MuxAssetSchema);
