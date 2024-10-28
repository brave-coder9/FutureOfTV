const express = require("express");
const { v1: uuid } = require("uuid");
const Mux = require("@mux/mux-node");
const MuxAsset = require("../models/MuxAsset");
const router = express.Router();
require("dotenv").config();

// Upload Route
router.post("/", async (req, res) => {
  const id = uuid();
  // Go ahead and grab any info you want from the request body.
  const assetInfo = req.body;

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

    const muxAsset = new MuxAsset({
      // save the upload ID in case we need to update this based on
      // 'video.upload' webhook events.
      id,
      uploadId: upload.id,
      metadata: assetInfo,
      status: "waiting_for_upload",
    });

    await muxAsset.save();

    console.log(`New MuxAsset saved with id: ${id}`);
    res.json({ id, url: upload.url });
  } catch (error) {
    console.error("Error on muxupload:", error);
    console.error("Error Message:", error.error?.error?.messages?.join(" | "));
    res.status(500).json({
      status: error.status,
      msg: "Error on muxupload",
    });
  }
});

module.exports = router;
