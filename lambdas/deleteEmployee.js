const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, DeleteCommand, GetCommand } = require("@aws-sdk/lib-dynamodb");
const { S3Client, DeleteObjectCommand } = require("@aws-sdk/client-s3");

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);
const s3Client = new S3Client({});

const TABLE_NAME = process.env.TABLE_NAME;
const BUCKET_NAME = process.env.BUCKET_NAME;

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'OPTIONS,DELETE'
};

exports.handler = async (event) => {
    try {
        const id = event.pathParameters.id;

        // 1. Get Employee to find photo URL
        const getCommand = new GetCommand({
            TableName: TABLE_NAME,
            Key: { id }
        });
        const getRes = await docClient.send(getCommand);
        const employee = getRes.Item;

        if (!employee) {
            return {
                statusCode: 404,
                headers: corsHeaders,
                body: JSON.stringify({ message: "Employee not found" })
            };
        }

        // 2. Delete Photo from S3 if exists
        if (employee.photoUrl) {
            try {
                // Extract Key from URL
                // Format: https://BUCKET.s3.amazonaws.com/KEY
                // Or if using custom domain, might be different. 
                // Reliable way: Check if it contains the bucket url part
                const urlParts = employee.photoUrl.split('/');
                const key = urlParts[urlParts.length - 1]; // Simple approximation

                // Better: if the URL structure is consistent
                if (key && employee.photoUrl.includes(BUCKET_NAME)) {
                    const deleteS3Command = new DeleteObjectCommand({
                        Bucket: BUCKET_NAME,
                        Key: key
                    });
                    await s3Client.send(deleteS3Command);
                }
            } catch (s3Error) {
                console.warn("Failed to delete photo from S3", s3Error);
                // Continue to delete from DB
            }
        }

        // 3. Delete from DynamoDB
        const deleteCommand = new DeleteCommand({
            TableName: TABLE_NAME,
            Key: { id }
        });

        await docClient.send(deleteCommand);

        return {
            statusCode: 200,
            headers: corsHeaders,
            body: JSON.stringify({ message: "Employee deleted successfully" })
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
