const AWS = require("aws-sdk");
const dynamo = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event) => {
  const body = JSON.parse(event.body);
  const { userID, workoutID, workoutName, workoutDate, exercises } = body;

  const params = {
    TableName: "WorkoutLogs",
    Item: {
      userID,
      workoutID,
      workoutName,
      workoutDate,
      exercises,
    },
  };

  await dynamo.put(params).promise();

  return {
    statusCode: 200,
    body: JSON.stringify({ message: "Workout updated successfully" }),
  };
};
