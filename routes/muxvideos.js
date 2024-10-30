const express = require("express");
const Mux = require("@mux/mux-node");
const MuxAsset = require("../models/MuxAsset");
const captionsToChapters = require("./captions-to-chapters");
const router = express.Router();
require("dotenv").config();

//
// Get List of videos
//
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
        row.title = muxAsset.title || "";
        row.metadata = muxAsset.metadata || "";
        row.chapters = muxAsset.chapters || [];
        row.url = row.url || muxAsset.url;
      } else {
        row.title = "";
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

//
// Get video details including asset, upload, MuxAsset.
//
router.get("/asset/:upload_id", async (req, res) => {
  const { upload_id } = req.params;
  let assetInfo, passthrough, directUploadData;

  const mux = new Mux({
    tokenId: process.env.MUX_TOKEN_ID,
    tokenSecret: process.env.MUX_TOKEN_SECRET,
  });

  try {
    const { data = [] } = await mux.video.assets.list({
      page: 1,
      limit: 10,
      upload_id,
    });
    assetInfo = data[0] || {};
  } catch (error) {
    return res.status(500).json({
      status: error.status,
      msg: "Error on listing assets with upload_id.",
    });
  }

  try {
    const { data } = await mux.video.uploads.retrieve(upload_id);
    directUploadData = data;
    passthrough = assetInfo.passthrough;
    if (!passthrough) {
      return res.status(404).json({
        status: 404,
        msg: "Not found the linked asset.",
      });
    }
  } catch (error) {
    return res.status(500).json({
      status: error.status,
      msg: "Error on retrieve direct-upload",
    });
  }

  try {
    const muxAsset = await MuxAsset.findOne({ id: passthrough });
    res.json({
      assetData: assetInfo,
      directUploadData,
      dbData: muxAsset || {},
    });
  } catch (error) {
    res.status(500).json({
      status: error.status,
      msg: "Error on getting an MuxAsset",
    });
  }
});

//
// Get the chapters with openai
//
router.get(
  "/chapters/:playbackID/:captionsTrackId/:passthrough",
  async (req, res) => {
    const { playbackID, captionsTrackId, passthrough } = req.params;
    let chapters;
    try {
      chapters = await captionsToChapters(playbackID, captionsTrackId);
    } catch (error) {
      console.error("Error:", error);
      return res.status(500).json({
        status: error.status,
        code: error.code || "unknown",
        msg: "Error on getting chapters: " + (error.error?.message || ""),
      });
    }

    // Save the chapters to db.
    try {
      const muxAsset = await MuxAsset.findOne({ id: passthrough });
      muxAsset.chapters = chapters;
      muxAsset.save();
    } catch (error) {
      res.status(500).json({
        status: error.status,
        msg: "Error on saving chapters to MuxAsset.",
      });
    }

    res.json({ data: chapters });
  }
);

//
// Update MuxAsset chapters.
//
router.patch("/chapters/:passthrough", async (req, res) => {
  const { passthrough } = req.params;
  const { chapters } = req.body;
  try {
    const muxAsset = await MuxAsset.findOne({ id: passthrough });
    muxAsset.chapters = chapters;
    muxAsset.save();
    res.json({ status: "success" });
  } catch (error) {
    res.status(500).json({
      status: error.status,
      msg: "Error on updating chapters to MuxAsset.",
    });
  }
});

module.exports = router;
