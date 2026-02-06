# AWS Serverless Employee Manager

## Overview
This project is a fully serverless employee management application built on AWS. It allows users to create, read, update, and delete (CRUD) employee records, including storing employee photos. The architecture leverages AWS services for scalability, security, and cost-efficiency without managing servers.

### Key Features
- **Frontend**: Static web app (HTML, CSS, JavaScript) hosted on Amazon S3 with static website hosting enabled.
- **Backend**: AWS Lambda functions handle CRUD operations, triggered via Amazon API Gateway from JavaScript HTTPS calls.
- **Data Storage**: Employee details stored in Amazon DynamoDB (NoSQL database); photos uploaded to a separate S3 bucket.
- **Distribution & DNS**: Amazon CloudFront accelerates frontend delivery; Amazon Route53 provides custom domain routing.
- **Security**: IAM roles enforce least-privilege access for Lambda to interact with S3 and DynamoDB.

### Architecture
![Architecture Diagram](architecture.png) 

1. Client loads the frontend from CloudFront/S3.
2. JavaScript makes API calls to API Gateway.
3. API Gateway triggers Lambda functions (Create, List, Update, Delete).
4. Lambdas read/write to DynamoDB and S3 for photos.

### Prerequisites
- AWS account
- AWS CLI configured
- Node.js (for potential Lambda code)

### Setup Instructions
1. Create S3 buckets for frontend and photos.
2. Set up DynamoDB table (e.g., with `id` as partition key).
3. Deploy Lambda functions (e.g., in Node.js/Python) for CRUD.
4. Configure API Gateway to route to Lambdas.
5. Set up CloudFront distribution pointing to S3 frontend.
6. Add Route53 record for custom domain.
7. Attach IAM roles for permissions.

### Running the App
- Upload frontend files to S3.
- Access via CloudFront/Route53 URL.
- Use the UI to manage employees.

### Future Improvements
- Add authentication with Amazon Cognito.
- Implement CI/CD with AWS CodePipeline.

For detailed deployment, refer to AWS documentation or the course materials.

## License
MIT License
