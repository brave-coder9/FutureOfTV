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
      url: record.url,
    }));
    const ids = rows.map((row) => row.passthrough);

    const muxAssets = await MuxAsset.find({ id: { $in: ids } });

    // Join rows and muxAssets, so we can get the result to return.
    for (const row of rows) {
      const muxAsset = muxAssets.find((asset) => asset.id === row.passthrough);
      if (muxAsset) {
        row.metadata = muxAsset.metadata || "";
        row.chapters = muxAsset.chapters || [];
        row.url = row.url || muxAsset.url;
      } else {
        row.metadata = "";
        row.chapters = [];
      }
    }

    res.json({ data: rows });
  } catch (error) {
    console.error("Error on list videos:", error);
    console.error("Error Message:", error.error?.error?.messages?.join(" | "));

    res.status(500).json({
      status: error.status,
      msg: "Error on list videos",
    });
  }
});

router.get("/:passthrough", async (req, res) => {
  const { passthrough } = req.params;

  try {
    const muxAsset = await MuxAsset.findOne({ id: passthrough });

    res.json(muxAsset);
  } catch (error) {
    console.error("Error on getting a video:", error);
    console.error("Error Message:", error.error?.error?.messages?.join(" | "));

    res.status(500).json({
      status: error.status,
      msg: "Error on getting a video",
    });
  }
});

router.get("/asset/:upload_id", async (req, res) => {
  const { upload_id } = req.params;

  try {
    const mux = new Mux({
      tokenId: process.env.MUX_TOKEN_ID,
      tokenSecret: process.env.MUX_TOKEN_SECRET,
    });

    const { data } = await mux.video.assets.list({
      page: 1,
      limit: 10,
      upload_id,
    });

    res.json({ data });
  } catch (error) {
    console.error("Error on getting an asset:", error);
    console.error("Error Message:", error.error?.error?.messages?.join(" | "));

    res.status(500).json({
      status: error.status,
      msg: "Error on getting an asset",
    });
  }
});

module.exports = router;
