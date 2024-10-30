const { encode, decode } = require("gpt-3-encoder");
const OpenAI = require("openai");
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const MAX_TOKENS = 16000;
const MAX_RESPONSE_TOKENS = 1000;

const captionsToChapters = async (playbackID, captionsTrackId) => {
  // Get user message.
  const muxCaptionsURL = `https://stream.mux.com/${playbackID}/text/${captionsTrackId}.vtt`;
  const response = await fetch(muxCaptionsURL);
  const userMsg = await response.text();
  // Define system message.
  const systemMsg =
    "Your role is to segment the following captions into chunked chapters, summarising each chapter with a title. Your response should be in the YouTube chapter format with each line starting with a timestamp in HH:MM:SS format followed by a chapter title. Do not include any preamble or explanations.";

  const userMessageTokens = encode(userMsg).length;
  const systemMessageTokens = encode(systemMsg).length;
  let chatCompletionContent;

  // Check if combined tokens exceed the max token limit.
  if (userMessageTokens + systemMessageTokens > MAX_TOKENS) {
    // Split data into chunks within token limits.
    const chunkSize = MAX_TOKENS - systemMessageTokens - MAX_RESPONSE_TOKENS;
    const chunks = userMsg.match(new RegExp(`.{1,${chunkSize}}`, "g")); // Create chunks within limit
    console.log("chunks.length = ", chunks.length);

    // Iterate through each chunk and call OpenAI API
    const responses = [];
    for (const chunk of chunks) {
      const chatCompletion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: systemMsg },
          { role: "user", content: chunk },
        ],
        max_tokens: MAX_RESPONSE_TOKENS,
      });
      console.log(
        "chatCompletion-content = ",
        chatCompletion.choices[0].message.content
      );
      responses.push(chatCompletion.choices[0].message.content); // Collect each response
    }

    chatCompletionContent = responses.join("\n");
    console.log("Combined content: ", chatCompletionContent);
  } else {
    // If data is within limit, send as a single request
    const chatCompletion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: systemMsg },
        { role: "user", content: userMsg },
      ],
      max_tokens: MAX_RESPONSE_TOKENS,
    });
    chatCompletionContent = chatCompletion.choices[0].message.content;
    console.log("Single content: ", chatCompletionContent);
  }

  // Convert chat content to chapters.
  const rx = /(\d+:\d+:\d+(\.\d*)?) - (\d+:\d+:\d+(\.\d*)?)? ?(.*)/g;
  const matches = chatCompletionContent.matchAll(rx);
  const output = [...matches].map((match) => ({
    start: match[1].replace(/\.\d+/, ""),
    title: match[5],
  }));
  console.log({ output });
  return output;
};

// const captionsToChapters = async (playbackID, captionsTrackId) => {
//   const muxCaptionsURL = `https://stream.mux.com/${playbackID}/text/${captionsTrackId}.vtt`;
//   const response = await fetch(muxCaptionsURL);
//   const userMsg = await response.text();
//   // Define system message.
//   const systemMsg =
//     "Your role is to segment the following captions into chunked chapters, summarising each chapter with a title. Your response should be in the YouTube chapter format with each line starting with a timestamp in HH:MM:SS format followed by a chapter title. Do not include any preamble or explanations.";

//   const chatCompletion = await openai.chat.completions.create({
//     messages: [
//       { role: "system", content: systemMsg },
//       { role: "user", content: userMsg },
//     ],
//     model: "gpt-3.5-turbo",
//   });
//   const rx = /(\d+:\d+:\d+(\.\d*)?) - (\d+:\d+:\d+(\.\d*)?)? ?(.*)/g;
//   const matches = chatCompletion.choices[0].message.content.matchAll(rx);
//   const output = [...matches].map((match) => ({
//     start: match[1].replace(/\.\d+/, ""),
//     title: match[5],
//   }));
//   console.log(output);
//   return output;
// };

module.exports = captionsToChapters;
