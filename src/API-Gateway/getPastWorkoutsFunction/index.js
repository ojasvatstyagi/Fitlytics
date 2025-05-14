const AWS = require("aws-sdk");
const dynamo = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event) => {
  const { email } = event.queryStringParameters;

  const params = {
    TableName: "WorkoutLogs",
    KeyConditionExpression: "userID = :email",
    ExpressionAttributeValues: { ":email": email },
  };

  const data = await dynamo.query(params).promise();

  return {
    statusCode: 200,
    body: JSON.stringify(data.Items),
  };
};
