# AWS Serverless Employee Manager

A complete serverless application for managing employee records. Built with AWS Lambda, DynamoDB, S3, and API Gateway.

## Features
- **Serverless Backend**: Node.js Lambda functions using AWS SDK v3.
- **Database**: DynamoDB for fast, scalable storage.
- **File Storage**: S3 for employee photos and hosting the frontend.
- **Modern UI**: Custom CSS + Bootstrap 5, responsive design with animations.
- **Security**: Presigned URLs for secure direct-to-S3 photo uploads.

## Project Structure
- `/frontend`: Static web application (HTML/CSS/JS).
- `/lambdas`: Backend logic (Node.js).
- `/docs`: Setup instructions and architecture info.

## Getting Started

1. **Deploy Infrastructure**: Follow the steps in [docs/setup-instructions.md](docs/setup-instructions.md) to create AWS resources and deploy the code.
2. **Configure Frontend**: Update `frontend/app.js` with your API Gateway URL.
3. **Run**: Open the `index.html` via S3 Website URL or locally with Live Server.

## Architecture
- **Frontend**: S3 Static Website -> CloudFront (CDN).
- **API**: API Gateway (REST) -> Lambda.
- **Data**: DynamoDB (Employee metadata) + S3 (Photos).

![Architecture](docs/architecture-diagram.png)
