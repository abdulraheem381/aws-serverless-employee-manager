const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, ScanCommand } = require("@aws-sdk/lib-dynamodb");

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const TABLE_NAME = process.env.TABLE_NAME;

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'OPTIONS,GET'
};

exports.handler = async (event) => {
    try {
        const command = new ScanCommand({
            TableName: TABLE_NAME
        });

        const response = await docClient.send(command);

        return {
            statusCode: 200,
            headers: corsHeaders,
            body: JSON.stringify({ Items: response.Items })
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
