const express = require("express");
const router = express.Router();
const MuxAsset = require("../models/MuxAsset");

// Webhook endpoint
router.post("/", async (req, res) => {
  try {
    const { type: eventType, data: eventData } = req.body;

    switch (eventType) {
      case "video.asset.track.ready": {
        // when auto-generated captions is ready.
        console.log(JSON.stringify(eventData, null, 2));
        break;
      }

      case "video.asset.created": {
        // This means an Asset was successfully created! We'll get
        // the existing item from the DB first, then update it with the
        // new Asset details
        const item = await MuxAsset.findOne({ id: eventData.passthrough });

        // Just in case the events got here out of order, make sure the
        // asset isn't already set to ready before blindly updating it!
        if (item && item.asset.status !== "ready") {
          item.asset = eventData;
          await item.save();
        }
        break;
      }

      case "video.asset.ready": {
        // This means an Asset was successfully created! This is the final
        // state of an Asset in this stage of its lifecycle, so we don't need
        // to check anything first.
        const item = await MuxAsset.findOne({ id: eventData.passthrough });

        if (item) {
          item.asset = eventData;
          await item.save();
        }
        break;
      }

      case "video.upload.cancelled": {
        // This fires when you decide you want to cancel an upload, so you
        // may want to update your internal state to reflect that it's no longer
        // active.
        const item = await MuxAsset.findOne({
          uploadId: eventData.passthrough,
        });

        if (item) {
          item.status = "cancelled_upload";
          await item.save();
        }
        break;
      }

      default:
        console.log("Unhandled event type:", eventType, eventData);
    }

    // Respond with 200 OK to acknowledge receipt
    res.status(200).send("Webhook event processed");
  } catch (error) {
    console.error("Error processing webhook event:", error);
    res.status(500).send("Internal Server Error");
  }
});

module.exports = router;
