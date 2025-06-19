# Kenyan Real Estate CRM - Amplify Gen 2 Setup

## Project Structure

The project has been restructured with a component-based architecture and AWS Amplify Gen 2 backend:

```
src/
├── components/
│   ├── auth/
│   │   └── LoginForm.js
│   ├── common/
│   │   ├── ConnectionStatus.js
│   │   ├── LoadingSpinner.js
│   │   └── NotificationBar.js
│   ├── dashboard/
│   │   ├── ApartmentDashboard.js
│   │   └── ApartmentSelection.js
│   ├── reports/
│   │   └── Reports.js
│   ├── tenants/
│   │   └── TenantManagement.js
│   └── units/
│       └── UnitManagement.js
├── contexts/
│   ├── AuthContext.js
│   └── NotificationContext.js
├── hooks/
│   └── useApi.js
├── services/
│   └── graphqlService.js
├── amplifyconfiguration.json
└── App.js (updated with routing)
```

## Features

### ✅ Completed
- **Component-based architecture** with React Router
- **Authentication** using AWS Cognito
- **GraphQL API** with AWS AppSync
- **File storage** with S3
- **Responsive design** with Tailwind CSS
- **Real-time notifications**
- **Property management** (CRUD operations)
- **Unit management** with floor-based visualization
- **Tenant management** with search and filtering
- **Dashboard** with charts and analytics
- **Reports** generation (basic structure)

### 🔄 In Progress
- AWS Amplify Gen 2 backend deployment
- Real-time subscriptions
- Payment tracking
- Advanced reporting

## AWS Amplify Gen 2 Setup

### Prerequisites
1. AWS CLI configured with your credentials
2. Node.js 18+ (you currently have 18.20.8)
3. npm or yarn

### Backend Setup

1. **Configure AWS CLI** (if not already done):
   ```bash
   aws configure
   # Enter your AWS Access Key ID, Secret Access Key, and set region to eu-west-1
   ```

2. **Install Amplify CLI** (already installed globally):
   ```bash
   amplify --version
   ```

3. **Initialize Amplify in your project**:
   ```bash
   cd /path/to/your/project
   npx ampx sandbox
   ```

4. **Deploy the backend**:
   ```bash
   npx ampx sandbox --region eu-west-1
   ```

### Data Models

The backend includes these models:
- **Apartment**: Property information, units, revenue tracking
- **Unit**: Individual units with status, pricing, tenant assignment
- **Tenant**: Customer information, payment status
- **Payment**: Payment tracking and history
- **DashboardStats**: Cached analytics data

### Authentication

- Uses AWS Cognito User Pools
- Email-based authentication
- User attributes: email, given_name, family_name, phone_number

### Storage

- S3 bucket for property images, documents, and reports
- Organized with prefixes: `property-images/`, `documents/`, `reports/`

## Running the Application

### Development
```bash
npm start
```

### Production Build
```bash
npm run build
```

## Routing Structure

- `/login` - Authentication
- `/dashboard` - Property selection
- `/apartment/:id/dashboard` - Property dashboard
- `/apartment/:id/units` - Unit management
- `/apartment/:id/tenants` - Tenant management
- `/apartment/:id/reports` - Reports and analytics

## Environment Configuration

Update `src/amplifyconfiguration.json` after deploying your Amplify backend with the actual values:

```json
{
  "aws_project_region": "eu-west-1",
  "aws_cognito_identity_pool_id": "your-identity-pool-id",
  "aws_cognito_region": "eu-west-1",
  "aws_user_pools_id": "your-user-pool-id",
  "aws_user_pools_web_client_id": "your-client-id",
  "aws_appsync_graphqlEndpoint": "your-graphql-endpoint",
  "aws_appsync_region": "eu-west-1",
  "aws_appsync_authenticationType": "AMAZON_COGNITO_USER_POOLS",
  "aws_user_files_s3_bucket": "your-s3-bucket",
  "aws_user_files_s3_bucket_region": "eu-west-1"
}
```

## Next Steps

1. **Deploy the Amplify backend**:
   ```bash
   npx ampx sandbox --region eu-west-1
   ```

2. **Update configuration** with the generated values

3. **Test the application** with real AWS services

4. **Add real-time subscriptions** for live updates

5. **Implement payment tracking** and advanced reporting

6. **Deploy to production** using Amplify Hosting

## Cost Optimization for Kenya

- **Region**: eu-west-1 (Ireland) - closer and more cost-effective than us-east-1
- **DynamoDB**: On-demand billing for variable workloads
- **S3**: Standard storage with lifecycle policies
- **Cognito**: Free tier covers up to 50,000 MAUs
- **AppSync**: Pay per request model

## Support

For issues or questions:
1. Check the AWS Amplify documentation
2. Review the GraphQL schema in `amplify/data/resource.ts`
3. Test individual components in isolation
4. Monitor AWS CloudWatch for backend issues

## Migration from Old Backend

The old Express.js backend (`real-estate-backend/`) can be gradually phased out as you migrate to Amplify. The new GraphQL service (`src/services/graphqlService.js`) provides the same functionality with better scalability and AWS integration.
