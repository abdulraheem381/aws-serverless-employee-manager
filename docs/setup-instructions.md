# AWS Serverless Employee Manager Setup Guide

Follow these steps to deploy the backend and frontend to your AWS account.

## Prerequisites
- AWS CLI installed and configured (`aws configure`).
- Node.js installed.

## 1. Setup Variables
Set these for easier copy-pasting (PowerShell syntax used, adjust for Bash if needed).
```powershell
$ProjectName = "emp-manager"
$Region = "us-east-1"
$BucketFrontend = "$ProjectName-frontend-$(Get-Random)"
$BucketPhotos = "$ProjectName-photos-$(Get-Random)"
$TableName = "Employees"
```

## 2. Create S3 Buckets
**Frontend Bucket:**
```powershell
aws s3 mb s3://$BucketFrontend --region $Region
# Enable Static Website Hosting
aws s3 website s3://$BucketFrontend --index-document index.html --error-document index.html
# Add Bucket Policy for Public Read (Or use CloudFront OAI/OAC for better security, this is quick start)
# WARNING: Public bucket policy required for direct S3 website hosting
```

**Photos Bucket:**
```powershell
aws s3 mb s3://$BucketPhotos --region $Region
# Configure CORS for direct browser uploads
$corsConfig = '{"CORSRules": [{"AllowedHeaders": ["*"], "AllowedMethods": ["PUT", "GET"], "AllowedOrigins": ["*"], "ExposeHeaders": []}]}'
aws s3api put-bucket-cors --bucket $BucketPhotos --cors-configuration $corsConfig
```

## 3. Create DynamoDB Table
```powershell
aws dynamodb create-table `
    --table-name $TableName `
    --attribute-definitions AttributeName=id,AttributeType=S `
    --key-schema AttributeName=id,KeyType=HASH `
    --billing-mode PAY_PER_REQUEST `
    --region $Region
```

## 4. Create IAM Role for Lambdas
Create `trust-policy.json`:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": { "Service": "lambda.amazonaws.com" },
      "Action": "sts:AssumeRole"
    }
  ]
}
```

Create Role:
```powershell
aws iam create-role --role-name EmpManagerLambdaRole --assume-role-policy-document file://trust-policy.json
```

Attach Policies (DynamoDB Full, S3 Full, CloudWatch Logs):
```powershell
aws iam attach-role-policy --role-name EmpManagerLambdaRole --policy-arn arn:aws:iam::aws:policy/AmazonDynamoDBFullAccess
aws iam attach-role-policy --role-name EmpManagerLambdaRole --policy-arn arn:aws:iam::aws:policy/AmazonS3FullAccess
aws iam attach-role-policy --role-name EmpManagerLambdaRole --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole
```

## 5. Deploy Lambdas
1. Navigate to `/lambdas` folder.
2. Run `npm install`.
3. Zip the files:
   - `createEmployee.zip`: createEmployee.js, node_modules, package.json
   - `listEmployees.zip`: listEmployees.js, node_modules, package.json
   - ... (repeat for each).

**Deployment Commands:**
*Replace `123456789012` with your Account ID in role ARN.*

```powershell
$RoleArn = "arn:aws:iam::YOUR_ACCOUNT_ID:role/EmpManagerLambdaRole"

# CreateEmployee
aws lambda create-function --function-name CreateEmployee `
    --runtime nodejs18.x --role $RoleArn --handler createEmployee.handler `
    --zip-file fileb://createEmployee.zip `
    --environment "Variables={TABLE_NAME=$TableName,BUCKET_NAME=$BucketPhotos}"

# ListEmployees
aws lambda create-function --function-name ListEmployees `
    --runtime nodejs18.x --role $RoleArn --handler listEmployees.handler `
    --zip-file fileb://listEmployees.zip `
    --environment "Variables={TABLE_NAME=$TableName}"

# UpdateEmployee
aws lambda create-function --function-name UpdateEmployee `
    --runtime nodejs18.x --role $RoleArn --handler updateEmployee.handler `
    --zip-file fileb://updateEmployee.zip `
    --environment "Variables={TABLE_NAME=$TableName}"

# DeleteEmployee
aws lambda create-function --function-name DeleteEmployee `
    --runtime nodejs18.x --role $RoleArn --handler deleteEmployee.handler `
    --zip-file fileb://deleteEmployee.zip `
    --environment "Variables={TABLE_NAME=$TableName,BUCKET_NAME=$BucketPhotos}"
```

## 6. Setup API Gateway (HTTP or REST)
Using console is easiest:
1. Create New API -> REST API -> "EmployeeAPI".
2. Create Resource `/employees`.
3. Create Methods:
   - `GET` -> Integration: Lambda Function -> `ListEmployees`.
   - `POST` -> Integration: Lambda Function -> `CreateEmployees`.
   - Enable CORS on `/employees`.
4. Create Resource `/employees/{id}`.
   - `PUT` -> Integration: Lambda Function -> `UpdateEmployees`.
   - `DELETE` -> Integration: Lambda Function -> `DeleteEmployees`.
   - Enable CORS.
5. **Deploy API** -> New Stage "prod".
6. **Copy Invoke URL** (e.g., `https://xyz.execute-api.us-east-1.amazonaws.com/prod`).

## 7. Update Frontend Config
1. Open `frontend/app.js`.
2. Replace `API_BASE_URL` const with your Invoke URL.

## 8. Deploy Frontend
```powershell
aws s3 sync ./frontend s3://$BucketFrontend
```
Your website is available at `http://$BucketFrontend.s3-website-$Region.amazonaws.com`.

## 9. CloudFront & Route53 (Optional Production Step)
1. Create CloudFront Distribution -> Origin Domain: Your S3 Frontend Website Endpoint.
2. Route53 -> Create Alias Record -> Point to CloudFront Distribution.
