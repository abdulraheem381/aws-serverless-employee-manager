const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, UpdateCommand } = require("@aws-sdk/lib-dynamodb");

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const TABLE_NAME = process.env.TABLE_NAME;

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'OPTIONS,PUT'
};

exports.handler = async (event) => {
    try {
        const id = event.pathParameters.id;
        const body = JSON.parse(event.body);
        const { name, role, email, photoUrl } = body;

        // Dynamic Update Expression
        let updateExpression = "set #n = :n, #r = :r, #e = :e";
        let expressionAttributeNames = {
            "#n": "name",
            "#r": "role",
            "#e": "email"
        };
        let expressionAttributeValues = {
            ":n": name,
            ":r": role,
            ":e": email
        };

        if (photoUrl) {
            updateExpression += ", photoUrl = :p";
            expressionAttributeValues[":p"] = photoUrl;
        }

        const command = new UpdateCommand({
            TableName: TABLE_NAME,
            Key: { id },
            UpdateExpression: updateExpression,
            ExpressionAttributeNames: expressionAttributeNames,
            ExpressionAttributeValues: expressionAttributeValues,
            ReturnValues: "ALL_NEW"
        });

        const response = await docClient.send(command);

        return {
            statusCode: 200,
            headers: corsHeaders,
            body: JSON.stringify(response.Attributes)
        };

    } catch (error) {
        console.error("Error", error);
        return {
            statusCode: 500,
            headers: corsHeaders,
            body: JSON.stringify({ message: "Internal Server Error", error: error.message })
        };
    }
};
