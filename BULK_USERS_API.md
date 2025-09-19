# Bulk Users Creation API

## Endpoint
`POST /users/bulk`

## Authorization
- Only accessible by `SUPER_ADMIN` role
- Requires JWT authentication

## Request Body
The request body should contain a `users` array with user objects. Each user object should have the following structure:

```json
{
  "users": [
    {
      "absherMobile": "+966501234567",
      "address": "الرياض، حي النرجس",
      "companyId": 1,
      "contactMobile": "+966501234567",
      "contractStartDate": "2024-01-01T00:00:00.000Z",
      "department": "تقنية المعلومات",
      "directManager": "محمد العلي",
      "email": "ahmed@example.com",
      "employeeRolesId": 1,
      "gender": "Male",
      "gregorianBirthDate": "1989-12-22T00:00:00.000Z",
      "hijriBirthDate": "1410-05-15T00:00:00.000Z",
      "name": "أحمد محمد",
      "nationalId": "1234567890",
      "personalEmail": "ahmed.personal@gmail.com",
      "remoteWorkDate": "2024-06-01T00:00:00.000Z",
      "role": "EMPLOYEE",
      "timezone": "Asia/Riyadh",
      "totalSalary": 8000
    }
    // ... more user objects
  ]
}
```

## Response
The API returns a detailed response showing the results of the bulk operation:

```json
{
  "success": true,
  "statusCode": 201,
  "message": "Bulk user creation completed. 5 successful, 2 failed.",
  "data": {
    "totalProcessed": 7,
    "successful": 5,
    "failed": 2,
    "results": [
      {
        "index": 0,
        "user": {
          "id": 123,
          "name": "أحمد محمد",
          "email": "ahmed@example.com",
          // ... full user object
        },
        "status": "success"
      }
      // ... more successful results
    ],
    "errors": [
      {
        "index": 1,
        "user": "محمد أحمد",
        "errors": [
          {
            "field": "email",
            "errors": ["Email is already taken"]
          }
        ]
      }
      // ... more errors
    ]
  }
}
```

## Features
- **Validation**: Each user is validated individually
- **Company Validation**: Checks if the specified companyId exists
- **Employee Role Validation**: Checks if the specified employeeRolesId exists
- **Unique Constraints**: Checks for duplicate nationalId, email, personalEmail, absherMobile, and contactMobile
- **Error Handling**: Continues processing even if some users fail
- **Detailed Results**: Returns both successful creations and detailed error information
- **Transaction Safety**: Each user creation is independent

## Error Handling
If a user fails validation or creation:
- The error is recorded with the user's index and details
- Processing continues for remaining users
- Final response includes both successful and failed operations

## Example Usage with curl
```bash
curl -X POST http://localhost:3000/users/bulk \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "users": [
      {
        "name": "أحمد محمد",
        "email": "ahmed@example.com",
        "nationalId": "1234567890",
        "companyId": 1,
        "employeeRolesId": 1,
        "role": "EMPLOYEE",
        "gender": "Male",
        "address": "الرياض، حي النرجس",
        "absherMobile": "+966501234567",
        "contactMobile": "+966501234567",
        "personalEmail": "ahmed.personal@gmail.com",
        "department": "تقنية المعلومات",
        "totalSalary": 8000,
        "contractStartDate": "2024-01-01T00:00:00.000Z",
        "remoteWorkDate": "2024-06-01T00:00:00.000Z",
        "hijriBirthDate": "1410-05-15T00:00:00.000Z",
        "gregorianBirthDate": "1989-12-22T00:00:00.000Z",
        "directManager": "محمد العلي",
        "timezone": "Asia/Riyadh"
      }
    ]
  }'
```
