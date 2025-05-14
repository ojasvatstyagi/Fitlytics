const AWS = require("aws-sdk");
const { v4: uuidv4 } = require("uuid");

const dynamo = new AWS.DynamoDB.DocumentClient();
const sns = new AWS.SNS(); // Add SNS client

exports.handler = async (event) => {
  console.log("Incoming request:", event);

  try {
    const body = JSON.parse(event.body);
    const { userID, workoutName, workoutDate, exercises } = body;
    const workoutID = uuidv4();

    // Save workout to DynamoDB
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
    console.log("Workout saved to DynamoDB");

    // Publish SNS notification
    const snsParams = {
      TopicArn: "arn:aws:sns:us-east-1:YOUR_ACCOUNT_ID:WorkoutNotifier", // Replace with your ARN
      Subject: "New Workout Logged",
      Message: `User ${userID} logged a workout: "${workoutName}" on ${workoutDate}`,
    };

    await sns.publish(snsParams).promise();
    console.log("SNS notification sent");

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Workout saved and notification sent",
        workoutID,
      }),
    };
  } catch (error) {
    console.error("Error in Lambda:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Failed to save workout or send notification",
      }),
    };
  }
};
