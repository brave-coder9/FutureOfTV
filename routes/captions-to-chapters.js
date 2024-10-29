const OpenAI = require("openai");
const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

const captionsToChapters = async (playbackID, captionsTrackId) => {
  const muxCaptionsURL = `https://stream.mux.com/${playbackID}/text/${captionsTrackId}.vtt`;
  const response = await fetch(muxCaptionsURL);
  const data = await response.text();
  const chatCompletion = await openai.chat.completions.create({
    messages: [
      {
        role: "system",
        content:
          "Your role is to segment the following captions into chunked chapters, summarising each chapter with a title. Your response should be in the YouTube chapter format with each line starting with a timestamp in HH:MM:SS format followed by a chapter title. Do not include any preamble or explanations.",
      },
      { role: "user", content: data },
    ],
    model: "gpt-3.5-turbo",
  });
  const rx = /(\d+:\d+:\d+(\.\d*)?) - (\d+:\d+:\d+(\.\d*)?)? ?(.*)/g;
  const matches = chatCompletion.choices[0].message.content.matchAll(rx);
  const output = [...matches].map((match) => ({
    start: match[1].replace(/\.\d+/, ""),
    title: match[5],
  }));
  console.log(output);
  return output;
};

module.exports = captionsToChapters;
