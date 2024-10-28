const express = require("express");
const Mux = require("@mux/mux-node");
const MuxAsset = require("../models/MuxAsset");
const router = express.Router();
require("dotenv").config();

// Get List of videos
router.get("/", async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  try {
    const mux = new Mux({
      tokenId: process.env.MUX_TOKEN_ID,
      tokenSecret: process.env.MUX_TOKEN_SECRET,
    });

    const { data } = await mux.video.uploads.list({
      page,
      limit,
    });

    const rows = data.map((record) => ({
      status: record.status,
      new_asset_settings: record.new_asset_settings,
      cors_origin: record.cors_origin,
      passthrough: record.new_asset_settings.passthrough,
      uploadId: record.id,
    }));
    const ids = rows.map((row) => row.passthrough);

    const muxAssets = await MuxAsset.find({ id: { $in: ids } });

    // Join rows and muxAssets, so we can get the result to return.
    for (const row of rows) {
      const muxAsset = muxAssets.find((asset) => asset.id === row.passthrough);
      if (muxAsset) {
        row.metadata = muxAsset.metadata || "";
        row.chapters = muxAsset.chapters || [];
      } else {
        row.metadata = "";
        row.chapters = [];
      }
    }

    res.json({ rows });
  } catch (error) {
    console.error("Error on list videos:", error);
    console.error("Error Message:", error.error?.error?.messages?.join(" | "));

    res.status(500).json({
      status: error.status,
      msg: "Error on list videos",
    });
  }
});

module.exports = router;
