const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, PutCommand } = require("@aws-sdk/lib-dynamodb");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const { v4: uuidv4 } = require("uuid");

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);
const s3Client = new S3Client({});

const TABLE_NAME = process.env.TABLE_NAME;
const BUCKET_NAME = process.env.BUCKET_NAME;

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'OPTIONS,POST'
};

exports.handler = async (event) => {
    try {
        const body = JSON.parse(event.body);

        // Check for specific action (e.g. for Presigned URL)
        if (body.action === 'getUploadUrl') {
            const fileKey = `${uuidv4()}-${body.fileName || 'photo.jpg'}`;
            const command = new PutObjectCommand({
                Bucket: BUCKET_NAME,
                Key: fileKey,
                ContentType: body.contentType
            });

            const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 300 });
            const publicUrl = `https://${BUCKET_NAME}.s3.amazonaws.com/${fileKey}`;

            return {
                statusCode: 200,
                headers: corsHeaders,
                body: JSON.stringify({ uploadUrl, key: fileKey, publicUrl })
            };
        }

        // Default: Create Employee
        const { name, role, email, photoUrl } = body;
        const id = uuidv4();

        const newEmployee = {
            id,
            name,
            role,
            email,
            photoUrl
        };

        const command = new PutCommand({
            TableName: TABLE_NAME,
            Item: newEmployee
        });

        await docClient.send(command);

        return {
            statusCode: 201,
            headers: corsHeaders,
            body: JSON.stringify(newEmployee)
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
