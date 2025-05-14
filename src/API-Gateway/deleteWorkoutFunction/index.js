const AWS = require("aws-sdk");
const dynamo = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event) => {
  const { workoutID, userID } = event.queryStringParameters;

  const params = {
    TableName: "WorkoutLogs",
    Key: {
      userID,
      workoutID,
    },
  };

  await dynamo.delete(params).promise();

  return {
    statusCode: 200,
    body: JSON.stringify({ message: "Workout deleted successfully" }),
  };
};
