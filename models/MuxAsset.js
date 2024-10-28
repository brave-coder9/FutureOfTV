const mongoose = require("mongoose");

const MuxAssetSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  metadata: { type: String, required: true },
  uploadId: { type: String, required: true },
  status: { type: String, required: true },
});

module.exports = mongoose.model("MuxAsset", MuxAssetSchema);
