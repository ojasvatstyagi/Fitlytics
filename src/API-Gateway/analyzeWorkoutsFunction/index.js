const axios = require("axios");

exports.handler = async (event) => {
  const body = JSON.parse(event.body);
  const { userInput, workoutHistory } = body;

  const response = await axios.post("https://your-openai-api/chatbot", {
    userInput,
    workoutHistory,
  });

  return {
    statusCode: 200,
    body: JSON.stringify({
      response: response.data.response || "No insights available",
    }),
  };
};
