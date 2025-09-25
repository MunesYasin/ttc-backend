## SubRole ID Support for User APIs

### Overview

The user APIs now support `subRoleId` field with the following validation rules:

### Create User API (`POST /api/users`)

#### For SUPER_ADMIN Role:
- `subRoleId` is **REQUIRED**
- Must be a valid SubRole ID from the database
- Other fields like `companyId`, `employeeRolesId`, etc. are **FORBIDDEN**

#### For Other Roles (EMPLOYEE, COMPANY_ADMIN):
- `subRoleId` is **FORBIDDEN**
- Will return validation error if provided

### Bulk Create Users API (`POST /api/users/bulk`)

#### For SUPER_ADMIN Role:
- `subRoleId` is **REQUIRED** for each user with SUPER_ADMIN role
- Must be a valid SubRole ID from the database
- Other fields like `companyId`, `employeeRolesId`, etc. are **FORBIDDEN**

#### For Other Roles:
- `subRoleId` is **FORBIDDEN**
- Will return validation error if provided

### Update User API (`PATCH /api/users/:id`)

#### For SUPER_ADMIN Role:
- `subRoleId` is **REQUIRED**
- Must be a valid SubRole ID from the database
- Other fields like `companyId`, `employeeRolesId`, etc. are **FORBIDDEN**

#### For Other Roles:
- `subRoleId` is **FORBIDDEN**
- Will return validation error if provided

### Example Requests:

#### Create SUPER_ADMIN User:
```json
POST /api/users
{
  "name": "John Doe",
  "email": "john@example.com",
  "role": "SUPER_ADMIN",
  "subRoleId": 1,
  "nationalId": "1234567890",
  "personalEmail": "john.personal@example.com",
  "hijriBirthDate": "2023-01-01",
  "gregorianBirthDate": "2023-01-01",
  "gender": "male",
  "address": "123 Main St",
  "absherMobile": "0512345678",
  "contactMobile": "0512345678"
}
```

#### Bulk Create Users (Mixed Roles):
```json
POST /api/users/bulk
{
  "users": [
    {
      "name": "John Doe",
      "email": "john@example.com",
      "role": "SUPER_ADMIN",
      "subRoleId": 1,
      "nationalId": "1234567890",
      "personalEmail": "john.personal@example.com",
      "hijriBirthDate": "2023-01-01",
      "gregorianBirthDate": "2023-01-01",
      "gender": "male",
      "address": "123 Main St",
      "absherMobile": "0512345678",
      "contactMobile": "0512345678"
    },
    {
      "name": "Jane Smith",
      "email": "jane@example.com",
      "role": "EMPLOYEE",
      "companyId": 1,
      "employeeRolesId": 1,
      "department": "HR",
      "totalSalary": 5000,
      "contractStartDate": "2023-01-01",
      "remoteWorkDate": "2023-01-01",
      "directManager": "John Doe",
      "nationalId": "0987654321",
      "personalEmail": "jane.personal@example.com",
      "hijriBirthDate": "2023-01-01",
      "gregorianBirthDate": "2023-01-01",
      "gender": "female",
      "address": "456 Oak Ave",
      "absherMobile": "0567891234",
      "contactMobile": "0567891234"
    }
  ]
}
```

#### Create EMPLOYEE User:
```json
POST /api/users
{
  "name": "Jane Smith",
  "email": "jane@example.com",
  "role": "EMPLOYEE",
  "companyId": 1,
  "employeeRolesId": 1,
  "department": "HR",
  "totalSalary": 5000,
  "contractStartDate": "2023-01-01",
  "remoteWorkDate": "2023-01-01",
  "directManager": "John Doe",
  "nationalId": "0987654321",
  "personalEmail": "jane.personal@example.com",
  "hijriBirthDate": "2023-01-01",
  "gregorianBirthDate": "2023-01-01",
  "gender": "female",
  "address": "456 Oak Ave",
  "absherMobile": "0567891234",
  "contactMobile": "0567891234"
}
```

### Error Examples:

#### SUPER_ADMIN without subRoleId:
```json
{
  "success": false,
  "errors": [
    {
      "field": "subRoleId",
      "errors": ["SubRole ID is required for SUPER_ADMIN role"]
    }
  ]
}
```

#### Non-SUPER_ADMIN with subRoleId:
```json
{
  "success": false,
  "errors": [
    {
      "field": "subRoleId",
      "errors": ["SubRole ID should not be provided for non-SUPER_ADMIN roles"]
    }
  ]
}
```

#### Invalid subRoleId:
```json
{
  "success": false,
  "errors": [
    {
      "field": "subRoleId",
      "errors": ["SubRole not found"]
    }
  ]
}
```

#### Bulk Creation Response with Errors:
```json
{
  "success": true,
  "data": {
    "totalProcessed": 2,
    "successful": 1,
    "failed": 1,
    "results": [
      {
        "index": 0,
        "user": { /* user object */ },
        "status": "success"
      }
    ],
    "errors": [
      {
        "index": 1,
        "user": "Jane Smith",
        "errors": [
          {
            "field": "subRoleId",
            "errors": ["SubRole ID should not be provided for non-SUPER_ADMIN roles"]
          }
        ]
      }
    ]
  },
  "message": "Bulk user creation completed. 1 successful, 1 failed."
}
```
