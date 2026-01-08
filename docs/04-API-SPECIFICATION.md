# API Specification

## Document Control
- **Version**: 2.1
- **Last Updated**: January 9, 2026
- **Implementation Status**: ✅ Phase 2 APIs Complete
- **Original Version**: 2.0
- **Status**: UPDATED - Individual Trade Tracking Model
- **Last Updated**: January 7, 2026
- **Base URL**: `/api`

---

## 1. API Overview

### 1.1 Architecture
- **Type**: RESTful API
- **Format**: JSON
- **Authentication**: Session-based (NextAuth.js)
- **Authorization**: Role-based (USER/ADMIN)

### 1.2 Common Headers
```
Content-Type: application/json
Accept: application/json
Cookie: next-auth.session-token=<session_token>
```

### 1.3 Standard Response Format

**Success Response**:
```typescript
{
  "success": true,
  "data": {} | [],
  "message"?: string // Optional success message
}
```

**Error Response**:
```typescript
{
  "success": false,
  "error": {
    "code": string,           // Error code (e.g., "VALIDATION_ERROR")
    "message": string,        // Human-readable message
    "details"?: object        // Optional validation details
  }
}
```

### 1.4 HTTP Status Codes
- `200 OK` - Successful GET, PATCH, DELETE
- `201 Created` - Successful POST
- `400 Bad Request` - Validation error
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `500 Internal Server Error` - Server error

---

## 2. Authentication Endpoints

### 2.1 POST `/api/auth/register`
**Description**: Register a new user account.

**Access**: Public

**Request Body**:
```typescript
{
  "email": string,           // Valid email format
  "name": string,            // 2-50 characters
  "password": string         // Min 8 characters
}
```

**Validation Rules**:
```typescript
{
  email: z.string().email(),
  name: z.string().min(2).max(50),
  password: z.string().min(8).max(100)
}
```

**Success Response (201)**:
```json
{
  "success": true,
  "data": {
    "id": "usr_abc123",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "USER"
  },
  "message": "Account created successfully"
}
```

**Error Responses**:
- `400` - Email already exists
- `400` - Validation error

---

### 2.2 POST `/api/auth/callback/credentials`
**Description**: Login with email and password (handled by NextAuth.js).

**Access**: Public

**Request Body**:
```typescript
{
  "email": string,
  "password": string
}
```

**Success**: Redirects to dashboard with session cookie

**Error Responses**:
- `401` - Invalid credentials

---

### 2.3 POST `/api/auth/signout`
**Description**: Sign out current user (handled by NextAuth.js).

**Access**: Authenticated

**Success**: Clears session and redirects to login

---

## 3. User Endpoints

### 3.1 GET `/api/users/me`
**Description**: Get current user profile.

**Access**: Authenticated (USER, ADMIN)

**Success Response (200)**:
```json
{
  "success": true,
  "data": {
    "id": "usr_abc123",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "USER",
    "image": null,
    "createdAt": "2026-01-01T00:00:00Z"
  }
}
```

---

### 3.2 PATCH `/api/users/me`
**Description**: Update current user profile.

**Access**: Authenticated (USER, ADMIN)

**Request Body**:
```typescript
{
  "name"?: string           // Optional name update
}
```

**Success Response (200)**:
```json
{
  "success": true,
  "data": {
    "id": "usr_abc123",
    "name": "John Updated",
    "email": "user@example.com"
  },
  "message": "Profile updated"
}
```

---

### 3.3 PATCH `/api/users/me/password`
**Description**: Change user password.

**Access**: Authenticated (USER, ADMIN)

**Request Body**:
```typescript
{
  "currentPassword": string,
  "newPassword": string      // Min 8 characters
}
```

**Validation**:
```typescript
{
  currentPassword: z.string(),
  newPassword: z.string().min(8).max(100)
}
```

**Success Response (200)**:
```json
{
  "success": true,
  "message": "Password updated successfully"
}
```

**Error Responses**:
- `401` - Current password incorrect

---

### 3.4 GET `/api/users` (Admin Only)
**Description**: Get all users (admin only).

**Access**: Authenticated (ADMIN)

**Query Parameters**:
- `page`: number (default: 1)
- `limit`: number (default: 20, max: 100)
- `role`: "USER" | "ADMIN" (optional filter)

**Success Response (200)**:
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "id": "usr_abc123",
        "email": "user1@example.com",
        "name": "User One",
        "role": "USER",
        "createdAt": "2026-01-01T00:00:00Z",
        "_count": {
          "trades": 45
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 50,
      "totalPages": 3
    }
  }
}
```

---

## 4. Trade Endpoints (Individual Trades)

### 4.1 POST `/api/trades/individual`
**Description**: Create new individual trade record (real-time entry).

**Access**: Authenticated (USER, ADMIN)

**Request Body**:
```typescript
{
  "tradeTimestamp": string,      // ISO datetime "2026-01-05T14:30:00Z"
  "result": "WIN" | "LOSS",      // Trade outcome
  "sopFollowed": boolean,        // Did this trade follow SOP?
  "profitLossUsd": number,       // Profit/loss in USD (positive or negative)
  "notes"?: string               // Optional, max 500 chars
}
```

**Validation Rules**:
```typescript
{
  tradeTimestamp: z.string().datetime(),
  result: z.enum(['WIN', 'LOSS']),
  sopFollowed: z.boolean(),
  profitLossUsd: z.number().refine(val => val !== 0, "Must be non-zero"),
  notes: z.string().max(500).optional()
}
```

**Success Response (201)**:
```json
{
  "success": true,
  "data": {
    "id": "itrd_xyz789",
    "userId": "usr_abc123",
    "tradeTimestamp": "2026-01-05T14:30:00Z",
    "result": "WIN",
    "sopFollowed": true,
    "profitLossUsd": 150.50,
    "marketSession": "US",          // Auto-calculated
    "notes": "Good entry on EUR/USD",
    "createdAt": "2026-01-05T14:30:00Z"
  },
  "message": "Trade recorded successfully"
}
```

**Error Responses**:
- `400` - Validation error
- `400` - Timestamp cannot be in the future

---

### 4.2 POST `/api/trades/bulk`
**Description**: Create multiple trade records at once (end-of-day bulk entry).

**Access**: Authenticated (USER, ADMIN)

**Request Body**:
```typescript
{
  "tradeDate": string,           // ISO date "2026-01-05"
  "trades": [
    {
      "tradeTimestamp": string,  // Full datetime
      "result": "WIN" | "LOSS",
      "sopFollowed": boolean,
      "profitLossUsd": number,
      "notes"?: string
    }
    // ... more trades
  ]
}
```

**Validation Rules**:
```typescript
{
  tradeDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  trades: z.array(individualTradeSchema).min(1).max(100)
}
// Custom validation:
// - All tradeTimestamps must be on the same tradeDate
// - No duplicate timestamps
```

**Success Response (201)**:
```json
{
  "success": true,
  "data": {
    "created": 10,
    "trades": [
      {
        "id": "itrd_abc001",
        "tradeTimestamp": "2026-01-05T08:15:00Z",
        "result": "WIN",
        "profitLossUsd": 120.00,
        "marketSession": "ASIA"
      }
      // ... 9 more
    ],
    "summary": {
      "totalTrades": 10,
      "totalWins": 7,
      "totalLosses": 3,
      "totalProfit": 850.50,
      "bestSession": "US"
    }
  },
  "message": "10 trades recorded successfully"
}
```

**Error Responses**:
- `400` - Validation error (mixed dates, duplicates, etc.)
- `400` - Maximum 100 trades per bulk entry

---

### 4.3 GET `/api/trades/individual`
**Description**: Get user's individual trade records.

**Access**: Authenticated (USER, ADMIN)

**Query Parameters**:
- `startDate`: string (ISO date, required) - "2026-01-01"
- `endDate`: string (ISO date, required) - "2026-01-31"
- `result`: "WIN" | "LOSS" (optional filter)
- `marketSession`: "ASIA" | "EUROPE" | "US" | "OVERLAP" (optional filter)
- `sopFollowed`: boolean (optional filter)
- `page`: number (default: 1)
- `limit`: number (default: 50, max: 200)

**Success Response (200)**:
```json
{
  "success": true,
  "data": {
    "trades": [
      {
        "id": "itrd_xyz789",
        "tradeTimestamp": "2026-01-05T14:30:00Z",
        "result": "WIN",
        "sopFollowed": true,
        "profitLossUsd": 150.50,
        "marketSession": "US",
        "notes": "Good entry on EUR/USD"
      }
      // ... more trades
    ],
    "pagination": {
      "page": 1,
      "limit": 50,
      "total": 350
    }
  }
}
```

---

### 4.4 GET `/api/trades/individual/[id]`
**Description**: Get specific individual trade record.

**Access**: Authenticated (USER - own trades, ADMIN - all trades)

**Success Response (200)**:
```json
{
  "success": true,
  "data": {
    "id": "itrd_xyz789",
    "userId": "usr_abc123",
    "tradeTimestamp": "2026-01-05T14:30:00Z",
    "result": "WIN",
    "sopFollowed": true,
    "profitLossUsd": 150.50,
    "marketSession": "US",
    "notes": "Good entry on EUR/USD",
    "createdAt": "2026-01-05T14:30:00Z",
    "updatedAt": "2026-01-05T14:30:00Z"
  }
}
```

**Error Responses**:
- `404` - Trade not found
- `403` - Cannot access another user's trade

---

### 4.5 PATCH `/api/trades/individual/[id]`
**Description**: Update existing individual trade record.

**Access**: Authenticated (USER - own trades, ADMIN - all trades)

**Request Body** (all fields optional):
```typescript
{
  "tradeTimestamp"?: string,
  "result"?: "WIN" | "LOSS",
  "sopFollowed"?: boolean,
  "profitLossUsd"?: number,
  "notes"?: string
}
```

**Success Response (200)**:
```json
{
  "success": true,
  "data": {
    "id": "itrd_xyz789",
    "tradeTimestamp": "2026-01-05T14:45:00Z",
    "result": "WIN",
    "sopFollowed": true,
    "profitLossUsd": 175.00,
    "marketSession": "US",         // Recalculated if timestamp changed
    "notes": "Updated profit amount"
  },
  "message": "Trade updated successfully"
}
```

**Error Responses**:
- `404` - Trade not found
- `403` - Cannot update another user's trade
- `400` - Validation error

---

### 4.6 DELETE `/api/trades/individual/[id]`
**Description**: Delete individual trade record.

**Access**: Authenticated (USER - own trades, ADMIN - all trades)

**Success Response (200)**:
```json
{
  "success": true,
  "message": "Trade deleted successfully"
}
```

**Error Responses**:
- `404` - Trade not found
- `403` - Cannot delete another user's trade

**Note**: Deleting a trade will trigger auto-update of the daily summary for that date.

---

## 5. Daily Summary Endpoints

### 5.1 GET `/api/summaries/daily`
**Description**: Get daily summary records (fast dashboard queries).

**Access**: Authenticated (USER, ADMIN)

**Query Parameters**:
- `startDate`: string (ISO date, required)
- `endDate`: string (ISO date, required)
- `page`: number (default: 1)
- `limit`: number (default: 31, max: 100)

**Success Response (200)**:
```json
{
  "success": true,
  "data": {
    "summaries": [
      {
        "id": "sum_abc123",
        "tradeDate": "2026-01-05",
        "totalTrades": 12,
        "totalWins": 8,
        "totalLosses": 4,
        "totalSopFollowed": 10,
        "totalSopNotFollowed": 2,
        "totalProfitLossUsd": 950.50,
        "asiaSessionTrades": 3,
        "europeSessionTrades": 4,
        "usSessionTrades": 5,
        "bestSession": "US"
      }
      // ... more days
    ],
    "pagination": {
      "page": 1,
      "limit": 31,
      "total": 90
    }
  }
}
```

**Note**: Daily summaries are auto-calculated from individual trades. This endpoint provides fast access to aggregated data without calculating on each request.

---

### 5.2 GET `/api/summaries/daily/[date]`
**Description**: Get daily summary for specific date.

**Access**: Authenticated (USER, ADMIN)

**URL Parameter**:
- `date`: ISO date string "2026-01-05"

**Success Response (200)**:
```json
{
  "success": true,
  "data": {
    "id": "sum_abc123",
    "tradeDate": "2026-01-05",
    "totalTrades": 12,
    "totalWins": 8,
    "totalLosses": 4,
    "overallWinRate": 66.67,
    "totalSopFollowed": 10,
    "totalSopNotFollowed": 2,
    "sopComplianceRate": 83.33,
    "totalProfitLossUsd": 950.50,
    "asiaSessionTrades": 3,
    "europeSessionTrades": 4,
    "usSessionTrades": 5,
    "bestSession": "US",
    "sessionBreakdown": {
      "ASIA": {
        "trades": 3,
        "wins": 2,
        "losses": 1,
        "profitLoss": 180.00,
        "winRate": 66.67
      },
      "EUROPE": {
        "trades": 4,
        "wins": 2,
        "losses": 2,
        "profitLoss": 120.50,
        "winRate": 50.00
      },
      "US": {
        "trades": 5,
        "wins": 4,
        "losses": 1,
        "profitLoss": 650.00,
        "winRate": 80.00
      }
    }
  }
}
```

**Error Responses**:
- `404` - No summary found for this date (no trades recorded)

---

## 6. Statistics & Analytics Endpoints

### 6.1 GET `/api/stats/by-session`
**Description**: Analyze trading performance by market session.

**Access**: Authenticated (USER, ADMIN)

**Query Parameters**:
- `period`: "week" | "month" | "year" (required)
- `startDate`: string (ISO date, optional - for custom range)
- `endDate`: string (ISO date, optional - for custom range)

**Success Response (200)**:
```json
{
  "success": true,
  "data": {
    "period": "month",
    "dateRange": {
      "start": "2026-01-01",
      "end": "2026-01-31"
    },
    "sessionStats": {
      "ASIA": {
        "totalTrades": 45,
        "wins": 28,
        "losses": 17,
        "winRate": 62.22,
        "totalProfitLoss": 2100.50,
        "avgProfitPerTrade": 46.68,
        "sopFollowedTrades": 38,
        "sopComplianceRate": 84.44
      },
      "EUROPE": {
        "totalTrades": 60,
        "wins": 42,
        "losses": 18,
        "winRate": 70.00,
        "totalProfitLoss": 3500.00,
        "avgProfitPerTrade": 58.33,
        "sopFollowedTrades": 55,
        "sopComplianceRate": 91.67
      },
      "US": {
        "totalTrades": 80,
        "wins": 60,
        "losses": 20,
        "winRate": 75.00,
        "totalProfitLoss": 5200.00,
        "avgProfitPerTrade": 65.00,
        "sopFollowedTrades": 72,
        "sopComplianceRate": 90.00
      },
      "OVERLAP": {
        "totalTrades": 15,
        "wins": 12,
        "losses": 3,
        "winRate": 80.00,
        "totalProfitLoss": 1100.00,
        "avgProfitPerTrade": 73.33,
        "sopFollowedTrades": 14,
        "sopComplianceRate": 93.33
      }
    },
    "bestSession": "OVERLAP",
    "mostActiveSession": "US",
    "totalTrades": 200,
    "totalProfitLoss": 11900.50
  }
}
```

---

### 6.2 GET `/api/stats/by-hour`
**Description**: Analyze trading performance by hour of day (UTC).

**Access**: Authenticated (USER, ADMIN)

**Query Parameters**:
- `period`: "week" | "month" | "year" (required)
- `startDate`: string (ISO date, optional - for custom range)
- `endDate`: string (ISO date, optional - for custom range)

**Success Response (200)**:
```json
{
  "success": true,
  "data": {
    "period": "month",
    "dateRange": {
      "start": "2026-01-01",
      "end": "2026-01-31"
    },
    "hourlyStats": [
      {
        "hour": 0,                   // 00:00-00:59 UTC
        "trades": 8,
        "wins": 5,
        "losses": 3,
        "winRate": 62.50,
        "profitLoss": 420.00,
        "avgProfitPerTrade": 52.50,
        "marketSession": "ASIA"
      },
      {
        "hour": 1,
        "trades": 6,
        "wins": 4,
        "losses": 2,
        "winRate": 66.67,
        "profitLoss": 380.00,
        "avgProfitPerTrade": 63.33,
        "marketSession": "ASIA"
      }
      // ... hours 2-23
    ],
    "bestHours": [
      {
        "hour": 15,                 // 3pm UTC (11am EST - US session)
        "winRate": 85.00,
        "trades": 20,
        "profitLoss": 1500.00
      },
      {
        "hour": 14,
        "winRate": 80.00,
        "trades": 18,
        "profitLoss": 1300.00
      },
      {
        "hour": 8,
        "winRate": 75.00,
        "trades": 12,
        "profitLoss": 900.00
      }
    ]
  }
}
```

---

### 6.3 GET `/api/stats/personal`
**Description**: Get comprehensive personal trading statistics.

**Access**: Authenticated (USER, ADMIN)

**Query Parameters**:
- `period`: "week" | "month" | "year" (required)
- `startDate`: string (ISO date, optional - for custom range)
- `endDate`: string (ISO date, optional - for custom range)

**Success Response (200)**:
```json
{
  "success": true,
  "data": {
    "period": "month",
    "dateRange": {
      "start": "2026-01-01",
      "end": "2026-01-31"
    },
    "totals": {
      "totalTrades": 200,
      "totalWins": 140,
      "totalLosses": 60,
      "totalProfitLossUsd": 11900.50,
      "sopFollowed": 170,
      "sopNotFollowed": 30
    },
    "rates": {
      "overallWinRate": 70.0,
      "sopWinRate": 75.0,
      "nonSopWinRate": 40.0,
      "sopComplianceRate": 85.0
    },
    "sessionPerformance": {
      "ASIA": { "trades": 45, "winRate": 62.22 },
      "EUROPE": { "trades": 60, "winRate": 70.00 },
      "US": { "trades": 80, "winRate": 75.00 },
      "OVERLAP": { "trades": 15, "winRate": 80.00 }
    },
    "bestSession": "OVERLAP",
    "bestHour": 15,
    "target": {
      "targetWinRate": 65.0,
      "targetSopRate": 80.0,
      "meetingWinRateTarget": true,
      "meetingSopTarget": true
    },
    "dailyBreakdown": [
      {
        "date": "2026-01-01",
        "totalTrades": 8,
        "wins": 6,
        "winRate": 75.0,
        "profitLoss": 520.00
      }
      // ... more days
    ]
  }
}
```

---

### 6.4 GET `/api/stats/trends`
**Description**: Get historical trend data for charts (win rate over time).

**Access**: Authenticated (USER, ADMIN)

**Query Parameters**:
- `period`: "week" | "month" | "year"
- `count`: number (default: 12, max: 52) - Number of periods to return

**Success Response (200)**:
```json
{
  "success": true,
  "data": {
    "period": "week",
    "trends": [
      {
        "period": "Week 1 (Jan 1-7)",
        "startDate": "2026-01-01",
        "endDate": "2026-01-07",
        "overallWinRate": 64.0,
        "sopWinRate": 70.0,
        "nonSopWinRate": 40.0,
        "totalTrades": 50,
        "profitLoss": 2500.00
      }
      // ... more periods
    ]
  }
}
```

---

### 6.5 GET `/api/stats/admin` (Admin Only)
**Description**: Get statistics for all users.

**Access**: Authenticated (ADMIN)

**Query Parameters**:
- `period`: "week" | "month" | "year" (required)
- `startDate`: string (optional)
- `endDate`: string (optional)

**Success Response (200)**:
```json
{
  "success": true,
  "data": {
    "period": "month",
    "dateRange": {
      "start": "2026-01-01",
      "end": "2026-01-31"
    },
    "users": [
      {
        "userId": "usr_abc123",
        "name": "User One",
        "email": "user1@example.com",
        "stats": {
          "totalTrades": 200,
          "overallWinRate": 68.5,
          "sopWinRate": 72.0,
          "sopComplianceRate": 85.0,
          "totalProfitLoss": 11900.50,
          "bestSession": "US"
        },
        "target": {
          "targetWinRate": 65.0,
          "meetingTarget": true
        },
        "rank": 1
      }
      // ... more users
    ],
    "rankings": [
      {
        "rank": 1,
        "userId": "usr_abc123",
        "name": "User One",
        "winRate": 68.5,
        "totalProfitLoss": 11900.50
      }
      // ... more rankings
    ]
  }
}
```

---

## 7. Target Endpoints

### 7.1 GET `/api/targets`
**Description**: Get user's current targets.

**Access**: Authenticated (USER, ADMIN)

**Success Response (200)**:
```json
{
  "success": true,
  "data": {
    "targets": [
      {
        "id": "tgt_def456",
        "targetType": "WEEKLY",
        "targetWinRate": 65.0,
        "targetSopRate": 80.0,
        "active": true
      },
      {
        "id": "tgt_ghi789",
        "targetType": "MONTHLY",
        "targetWinRate": 68.0,
        "targetSopRate": 85.0,
        "active": true
      }
    ]
  }
}
```

---

### 7.2 POST `/api/targets`
**Description**: Create or update user target.

**Access**: Authenticated (USER, ADMIN)

**Request Body**:
```typescript
{
  "targetType": "WEEKLY" | "MONTHLY" | "YEARLY",
  "targetWinRate": number,        // 0-100
  "targetSopRate"?: number        // 0-100, optional
}
```

**Validation**:
```typescript
{
  targetType: z.enum(['WEEKLY', 'MONTHLY', 'YEARLY']),
  targetWinRate: z.number().min(0).max(100),
  targetSopRate: z.number().min(0).max(100).optional()
}
```

**Success Response (201)**:
```json
{
  "success": true,
  "data": {
    "id": "tgt_def456",
    "targetType": "WEEKLY",
    "targetWinRate": 65.0,
    "targetSopRate": 80.0,
    "active": true
  },
  "message": "Target set successfully"
}
```

**Note**: If target already exists for that type, it updates the existing one.

---

### 7.3 DELETE `/api/targets/[id]`
**Description**: Delete user target.

**Access**: Authenticated (USER, ADMIN)

**Success Response (200)**:
```json
{
  "success": true,
  "message": "Target deleted"
}
```

---

## 8. Admin User Management Endpoints

### 8.1 GET `/api/admin/users/[id]`
**Description**: Get detailed user information.

**Access**: Authenticated (ADMIN)

**Success Response (200)**:
```json
{
  "success": true,
  "data": {
    "id": "usr_abc123",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "USER",
    "createdAt": "2026-01-01T00:00:00Z",
    "stats": {
      "totalTrades": 450,
      "averageWinRate": 67.5,
      "tradingDays": 90
    }
  }
}
```

---

### 8.2 PATCH `/api/admin/users/[id]`
**Description**: Update user information (admin).

**Access**: Authenticated (ADMIN)

**Request Body**:
```typescript
{
  "role"?: "USER" | "ADMIN",
  "name"?: string
}
```

**Success Response (200)**:
```json
{
  "success": true,
  "data": {
    "id": "usr_abc123",
    "role": "ADMIN",
    "name": "John Doe"
  },
  "message": "User updated"
}
```

---

### 8.3 DELETE `/api/admin/users/[id]`
**Description**: Delete user account (admin).

**Access**: Authenticated (ADMIN)

**Success Response (200)**:
```json
{
  "success": true,
  "message": "User account deleted"
}
```

**Note**: Cascades to delete all user's individual trades, daily summaries, targets, and sessions.

---

## 9. Error Codes Reference

| Code | Description |
|------|-------------|
| `VALIDATION_ERROR` | Request validation failed |
| `UNAUTHORIZED` | Not authenticated |
| `FORBIDDEN` | Insufficient permissions |
| `NOT_FOUND` | Resource not found |
| `DUPLICATE_ENTRY` | Resource already exists |
| `INVALID_CREDENTIALS` | Login failed |
| `WEAK_PASSWORD` | Password doesn't meet requirements |
| `INTERNAL_ERROR` | Server error |
| `DATABASE_ERROR` | Database operation failed |
| `FUTURE_TIMESTAMP` | Trade timestamp cannot be in the future |
| `MIXED_DATES` | Bulk entry contains trades from different dates |
| `DUPLICATE_TIMESTAMP` | Trade already exists with this timestamp |

---

## 10. Rate Limiting (Future Enhancement)

**Suggested Limits**:
- Authentication: 5 requests per minute
- API endpoints: 100 requests per minute per user
- Admin endpoints: 200 requests per minute

---

## 11. API Testing Examples

### 11.1 Create Individual Trade (cURL)
```bash
curl -X POST https://wekangtradingjournal.vercel.app/api/trades/individual \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=..." \
  -d '{
    "tradeTimestamp": "2026-01-05T14:30:00Z",
    "result": "WIN",
    "sopFollowed": true,
    "profitLossUsd": 150.50,
    "notes": "Good entry on EUR/USD"
  }'
```

### 11.2 Bulk Trade Entry (JavaScript)
```javascript
const response = await fetch('/api/trades/bulk', {
  method: 'POST',
  credentials: 'include',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    tradeDate: '2026-01-05',
    trades: [
      {
        tradeTimestamp: '2026-01-05T08:15:00Z',
        result: 'WIN',
        sopFollowed: true,
        profitLossUsd: 120.00
      },
      {
        tradeTimestamp: '2026-01-05T14:30:00Z',
        result: 'WIN',
        sopFollowed: true,
        profitLossUsd: 150.50
      }
      // ... more trades
    ]
  })
});

const data = await response.json();
console.log(`Created ${data.data.created} trades`);
```

### 11.3 Get Session Analysis (JavaScript)
```javascript
const response = await fetch('/api/stats/by-session?period=month', {
  method: 'GET',
  credentials: 'include'
});

const data = await response.json();
console.log(`Best session: ${data.data.bestSession}`);
console.log(`US session win rate: ${data.data.sessionStats.US.winRate}%`);
```

### 11.4 Get Hourly Analysis (JavaScript)
```javascript
const response = await fetch('/api/stats/by-hour?period=month', {
  method: 'GET',
  credentials: 'include'
});

const data = await response.json();
const bestHours = data.data.bestHours;
console.log(`Best trading hours: ${bestHours.map(h => `${h.hour}:00 UTC`).join(', ')}`);
```

---

## 12. Webhook Events (Future Enhancement)

**Potential Webhooks**:
- `trade.created` - New individual trade recorded
- `trade.bulk_created` - Bulk trades imported
- `daily_summary.updated` - Daily summary recalculated
- `target.achieved` - User reached target
- `target.missed` - User missed target
- `user.registered` - New user registered

---

## 13. API Versioning Strategy

**Current**: No versioning (v1 implicit)

**Future**: If breaking changes needed:
- `/api/v2/...` for new version
- Maintain `/api/...` (v1) for backward compatibility
- Deprecation notices 6 months before removal

---

## 14. Key Design Decisions

### 14.1 Why Separate Individual Trades and Daily Summary Endpoints?

**Individual Trade Endpoints** (`/api/trades/individual`):
- For detailed entry and editing
- Support timing analysis
- Enable session-based filtering

**Daily Summary Endpoints** (`/api/summaries/daily`):
- Fast dashboard loading
- Pre-calculated aggregates
- Reduce database load for charts

**Analytics Endpoints** (`/api/stats/by-session`, `/api/stats/by-hour`):
- Complex aggregations across date ranges
- Identify optimal trading times
- Session performance comparison

### 14.2 Market Session Auto-Calculation

Market sessions are **auto-calculated** server-side from timestamp:
- Ensures consistency across all trades
- Eliminates user input errors
- Calculated using UTC hour ranges
- Stored in `individual_trades` table for fast filtering

---

## Acceptance Criteria

- ✅ All endpoints documented with examples
- ✅ Request/response schemas defined
- ✅ Validation rules specified
- ✅ Error codes documented
- ✅ Authentication/authorization requirements clear
- ✅ Query parameters documented
- ✅ Individual trade endpoints for real-time entry
- ✅ Bulk entry endpoint for end-of-day workflow
- ✅ Session and hourly analytics endpoints
- ✅ Daily summary endpoints for fast queries

---

**Status**: UPDATED - Individual Trade Tracking Model
**Version**: 2.0
**Next Document**: System Architecture (needs update)

