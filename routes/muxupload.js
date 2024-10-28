const express = require("express");
const { v1: uuid } = require("uuid");
const Mux = require("@mux/mux-node");
const MuxAsset = require("../models/MuxAsset");
const router = express.Router();
require("dotenv").config();

// Upload Route
router.get("/", async (req, res) => {
  const id = uuid();

  try {
    // This assumes you have MUX_TOKEN_ID and MUX_TOKEN_SECRET
    // environment variables.
    const mux = new Mux({
      tokenId: process.env.MUX_TOKEN_ID,
      tokenSecret: process.env.MUX_TOKEN_SECRET,
    });

    // Create a new upload using the Mux SDK.
    const upload = await mux.video.uploads.create({
      // Set the CORS origin to your application.
      cors_origin: process.env.BASE_URL,

      // Specify the settings used to create the new Asset after
      // the upload is complete
      new_asset_settings: {
        passthrough: id,
        playback_policy: ["public"],
        video_quality: "basic",
      },
    });
    console.log("Success: creating upload url");
    res.json({ id, uploadId: upload.id, url: upload.url });
  } catch (error) {
    console.error("Error on muxupload:", error);
    console.error("Error Message:", error.error?.error?.messages?.join(" | "));
    res.status(500).json({
      status: error.status,
      msg: "Error on muxupload",
    });
  }
});

router.post("/save", async (req, res) => {
  const {
    id,
    uploadId,
    url,
    status,
    title,
    description,
    chapters = [],
  } = req.body;

  try {
    const muxAsset = new MuxAsset({
      // save the upload ID in case we need to update this based on
      // 'video.upload' webhook events.
      id,
      uploadId,
      url,
      status,
      title,
      description,
      chapters,
    });

    await muxAsset.save();
    res.json({ status: "success" });
  } catch (error) {
    console.error("Error on saving asset:", error);
    console.error("Error Message:", error.error?.error?.messages?.join(" | "));
    res.status(500).json({
      status: error.status,
      msg: "Error on saving asset",
    });
  }
});

module.exports = router;
