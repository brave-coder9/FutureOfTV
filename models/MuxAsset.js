const mongoose = require("mongoose");

const MuxAssetSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  uploadId: { type: String, required: true },
  url: { type: String, required: true },
  title: { type: String },
  metadata: { type: String },
  chapters: [
    {
      start: { type: String, required: true },
      title: { type: String, required: true },
    },
  ],
});

module.exports = mongoose.model("MuxAsset", MuxAssetSchema);
