# WorkSheet Management API Documentation

## 📋 Tổng quan

**Hệ thống phiếu công đoạn số hóa** cho 3 nhà máy TBS (TS1, TS2, TS3).

**Quy trình:** Admin tạo phiếu → System tự tạo Items/Records → Nhóm trưởng cập nhật sản lượng

**Cấu trúc dữ liệu:**
````
markdown
# WorkSheet Management API Documentation

## 📋 Tổng quan

**Hệ thống phiếu công đoạn số hóa** cho 3 nhà máy TBS (TS1, TS2, TS3).

**Quy trình:** Admin tạo phiếu → System tự tạo Items/Records → Nhóm trưởng cập nhật sản lượng

**Cấu trúc dữ liệu:**

- **Worksheet**: Phiếu công đoạn, chứa thông tin chung
- **Worksheet Item**: Mục công đoạn, chi tiết từng công việc
- **Worksheet Record**: Bản ghi công việc, lưu trữ theo thời gian thực

## 🏭 WorkSheet Management APIs

Base URL: `/api/worksheets`

### 1. Create Worksheet
**POST** `/api/worksheets`

**Authorization:** SUPERADMIN, ADMIN, USER (Managers)

**Request Body:**
```typescript
interface CreateWorksheetDto {
  groupId: string;        // Group UUID
  date: string;           // "2024-01-15" (YYYY-MM-DD)
  shiftType: "NORMAL_8H" | "EXTENDED_9_5H" | "OVERTIME_11H";
  productId: string;      // Product UUID
  processId: string;      // Process UUID
  targetOutputPerHour?: number; // Optional override
}
```

**Response:**
```typescript
interface CreateWorksheetResponse {
  id: string;
  date: string;
  factoryId: string;
  groupId: string;
  shiftType: "NORMAL_8H" | "EXTENDED_9_5H" | "OVERTIME_11H";
  totalWorkers: number;
  targetOutputPerHour: number;
  status: "ACTIVE" | "COMPLETED" | "ARCHIVED";
  createdAt: string;
  updatedAt: string;
  factory: {
    name: string;
    code: string;
  };
  group: {
    name: string;
    code: string;
    team: {
      name: string;
      line: { name: string; };
    };
  };
  createdBy: {
    firstName: string;
    lastName: string;
    employeeCode: string;
  };
  summary: {
    totalWorkers: number;
    totalHours: number;
    targetOutputPerHour: number;
    productProcess: {
      product: { name: string; code: string; };
      process: { name: string; code: string; };
      standardOutput: number;
    };
  };
}
```

### 2. Get All Worksheets
**GET** `/api/worksheets`

**Query Parameters:**
```typescript
interface GetWorksheetsQuery {
  factoryId?: string;     // Filter by factory
  groupId?: string;       // Filter by group
  date?: string;          // Filter by date (YYYY-MM-DD)
  status?: "ACTIVE" | "COMPLETED" | "ARCHIVED";
}
```

**Response:**
```typescript
interface GetWorksheetsResponse {
  id: string;
  date: string;
  shiftType: string;
  totalWorkers: number;
  targetOutputPerHour: number;
  status: string;
  createdAt: string;
  factory: {
    name: string;
    code: string;
  };
  group: {
    name: string;
    code: string;
    team: {
      name: string;
      line: { name: string; };
    };
  };
  createdBy: {
    firstName: string;
    lastName: string;
    employeeCode: string;
  };
  _count: {
    items: number;
    records: number; // completed records
  };
}[]
```

### 3. Get Group Worksheets
**GET** `/api/worksheets/group/:groupId`

**Path Parameters:**
```typescript
interface GetGroupWorksheetsParams {
  groupId: string; // Group UUID
}
```

**Query Parameters:**
```typescript
interface GetGroupWorksheetsQuery {
  date?: string; // Date filter (YYYY-MM-DD), defaults to today
}
```

**Response:**
```typescript
interface GetGroupWorksheetsResponse {
  id: string;
  date: string;
  shiftType: string;
  totalWorkers: number;
  targetOutputPerHour: number;
  status: string;
  items: {
    id: string;
    workerId: string;
    worker: {
      firstName: string;
      lastName: string;
      employeeCode: string;
    };
    product: {
      name: string;
      code: string;
    };
    process: {
      name: string;
      code: string;
    };
    _count: {
      records: number; // records with output > 0
    };
  }[];
  records: {
    id: string;
    workHour: number;
    startTime: string;
    endTime: string;
    status: "PENDING" | "IN_PROGRESS" | "COMPLETED";
    _count: {
      itemRecords: number; // item records with output > 0
    };
  }[];
}[]
```

### 4. Get My Group Worksheets (Group Leaders)
**GET** `/api/worksheets/my-groups`

**Query Parameters:**
```typescript
interface GetMyGroupWorksheetsQuery {
  date?: string; // Date filter, defaults to today
}
```

**Response:** Same as Get All Worksheets Response

### 5. Get Worksheet Details
**GET** `/api/worksheets/:id`

**Path Parameters:**
```typescript
interface GetWorksheetParams {
  id: string; // Worksheet UUID
}
```

**Response:**
```typescript
interface GetWorksheetResponse {
  id: string;
  date: string;
  shiftType: string;
  totalWorkers: number;
  targetOutputPerHour: number;
  status: string;
  createdAt: string;
  updatedAt: string;
  factory: {
    name: string;
    code: string;
  };
  group: {
    name: string;
    code: string;
    leaderId: string;
    team: {
      name: string;
      line: { name: string; };
    };
  };
  createdBy: {
    firstName: string;
    lastName: string;
    employeeCode: string;
  };
  items: {
    id: string;
    workerId: string;
    worker: {
      firstName: string;
      lastName: string;
      employeeCode: string;
    };
    product: {
      name: string;
      code: string;
    };
    process: {
      name: string;
      code: string;
    };
    records: {
      actualOutput: number;
      note: string | null;
      record: {
        workHour: number;
        startTime: string;
        endTime: string;
      };
    }[];
  }[];
  records: {
    id: string;
    workHour: number;
    startTime: string;
    endTime: string;
    status: string;
    updatedBy: {
      firstName: string;
      lastName: string;
      employeeCode: string;
    } | null;
    itemRecords: {
      actualOutput: number;
      note: string | null;
      item: {
        worker: {
          firstName: string;
          lastName: string;
          employeeCode: string;
        };
      };
    }[];
  }[];
}
```

### 6. Update Worksheet Record
**PATCH** `/api/worksheets/:id/records/:recordId`

**Path Parameters:**
```typescript
interface UpdateRecordParams {
  id: string;       // Worksheet UUID
  recordId: string; // WorksheetRecord UUID
}
```

**Request Body:**
```typescript
interface UpdateWorksheetRecordDto {
  status?: "PENDING" | "IN_PROGRESS" | "COMPLETED";
  itemRecords?: {
    itemId: string;         // WorkSheetItem UUID
    actualOutput: number;   // Actual output produced
    productId?: string;     // Product UUID (if changed)
    processId?: string;     // Process UUID (if changed)  
    note?: string;          // Notes
  }[];
}
```

**Response:**
```typescript
interface UpdateRecordResponse {
  id: string;
  workHour: number;
  startTime: string;
  endTime: string;
  status: string;
  updatedAt: string;
  itemRecords: {
    actualOutput: number;
    note: string | null;
    item: {
      worker: {
        firstName: string;
        lastName: string;
        employeeCode: string;
      };
    };
    product: {
      name: string;
      code: string;
    } | null;
    process: {
      name: string;
      code: string;
    } | null;
  }[];
}
```

### 7. Batch Update Records
**PATCH** `/api/worksheets/:id/batch-update`

**Path Parameters:**
```typescript
interface BatchUpdateParams {
  id: string; // Worksheet UUID
}
```

**Request Body:**
```typescript
interface BatchUpdateRecordsDto {
  records: {
    recordId: string;
    status?: "PENDING" | "IN_PROGRESS" | "COMPLETED";
    itemRecords?: {
      itemId: string;
      actualOutput: number;
      note?: string;
    }[];
  }[];
}
```

**Response:**
```typescript
interface BatchUpdateResponse {
  message: string;
  updatedRecords: number;
  records: {
    id: string;
    workHour: number;
    status: string;
    updatedAt: string;
  }[];
}
```

### 8. Get Worksheet Analytics
**GET** `/api/worksheets/:id/analytics`

**Path Parameters:**
```typescript
interface GetAnalyticsParams {
  id: string; // Worksheet UUID
}
```

**Response:**
```typescript
interface GetAnalyticsResponse {
  summary: {
    totalRecords: number;
    completedRecords: number;
    completionRate: number; // percentage
    totalOutput: number;
    targetOutput: number;
    efficiency: number;     // percentage
    totalWorkers: number;
  };
  hourlyData: {
    workHour: number;
    targetOutput: number;
    actualOutput: number;
    efficiency: number;     // percentage
    status: string;
    workerCount: number;
  }[];
  workerPerformance: {
    workerId: string;
    totalOutput: number;
    hoursWorked: number;
    averagePerHour: number;
    efficiency: number;     // percentage
  }[];
  trends: {
    peakHour: {
      workHour: number;
      actualOutput: number;
    };
    lowestHour: {
      workHour: number;
      actualOutput: number;
    };
  };
}
```

### 9. Get Real-time Analytics
**GET** `/api/worksheets/analytics/realtime`

**Authorization:** SUPERADMIN, ADMIN, USER (Managers)

**Query Parameters:**
```typescript
interface GetRealtimeAnalyticsQuery {
  factoryId?: string;   // Filter by factory
  date?: string;        // Filter by date (YYYY-MM-DD), defaults to today
}
```

**Response:**
```typescript
interface GetRealtimeAnalyticsResponse {
  summary: {
    totalWorksheets: number;
    totalWorkers: number;
    totalTargetOutput: number;
    totalActualOutput: number;
    overallEfficiency: number; // percentage
    activeFactories: number;
  };
  factoryBreakdown: {
    name: string;
    code: string;
    worksheets: number;
    workers: number;
    targetOutput: number;
    actualOutput: number;
    efficiency: number; // percentage
  }[];
  recentActivity: {
    id: string;
    factory: string;
    group: string;
    line: string;
    status: string;
    updatedAt: string;
  }[];
}
```

### 10. Update Worksheet
**PUT** `/api/worksheets/:id`

**Authorization:** SUPERADMIN, ADMIN, USER (Creator only)

**Path Parameters:**
```typescript
interface UpdateWorksheetParams {
  id: string; // Worksheet UUID
}
```

**Request Body:**
```typescript
interface UpdateWorksheetDto {
  shiftType?: "NORMAL_8H" | "EXTENDED_9_5H" | "OVERTIME_11H";
  status?: "ACTIVE" | "COMPLETED" | "ARCHIVED";
  totalWorkers?: number;
  targetOutputPerHour?: number;
}
```

**Response:** Same as Create Worksheet Response

### 11. Complete Worksheet
**POST** `/api/worksheets/:id/complete`

**Path Parameters:**
```typescript
interface CompleteWorksheetParams {
  id: string; // Worksheet UUID
}
```

**Response:**
```typescript
interface CompleteWorksheetResponse {
  id: string;
  status: "COMPLETED";
  message: "Worksheet marked as completed";
  updatedAt: string;
}
```

### 12. Delete Worksheet
**DELETE** `/api/worksheets/:id`

**Authorization:** SUPERADMIN, ADMIN

**Path Parameters:**
```typescript
interface DeleteWorksheetParams {
  id: string; // Worksheet UUID
}
```

**Response:**
```typescript
interface DeleteWorksheetResponse {
  id: string;
  message: "Worksheet deleted successfully";
}
```

### 13. Archive Old Worksheets
**POST** `/api/worksheets/archive-old`

**Authorization:** SUPERADMIN, ADMIN

**Query Parameters:**
```typescript
interface ArchiveWorksheetsQuery {
  beforeDate?: string; // Archive worksheets before this date (YYYY-MM-DD)
}
```

**Response:**
```typescript
interface ArchiveWorksheetsResponse {
  message: string;
  count: number;
  archiveDate: string; // ISO date string
}
```

## 🔧 Error Responses

Tất cả APIs sử dụng chuẩn HTTP status codes:

```typescript
interface ErrorResponse {
  statusCode: number;
  message: string | string[];
  error: string;
  timestamp: string;
  path: string;
}
```

### Common Error Codes:

- **400 Bad Request**: Invalid input, validation errors
- **401 Unauthorized**: Authentication required
- **403 Forbidden**: Insufficient permissions
- **404 Not Found**: Resource not found
- **409 Conflict**: Duplicate worksheet (same group + date)

### Example Error Responses:

```json
// Duplicate worksheet
{
  "statusCode": 409,
  "message": "Worksheet already exists for this group and date",
  "error": "Conflict",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "path": "/api/worksheets"
}

// Permission denied
{
  "statusCode": 403,
  "message": "You can only update records for groups you lead",
  "error": "Forbidden",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "path": "/api/worksheets/uuid/records/uuid"
}
```

## 🎯 Frontend Implementation Guide

### 1. API Client Setup
```typescript
// api/worksheet.ts
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';

export const worksheetAPI = {
  // Create worksheet
  create: (data: CreateWorksheetDto) => 
    fetch(`${API_BASE_URL}/worksheets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }),

  // Get all worksheets
  getAll: (params?: GetWorksheetsQuery) => 
    fetch(`${API_BASE_URL}/worksheets?${new URLSearchParams(params)}`),

  // Get group worksheets
  getGroupWorksheets: (groupId: string, date?: string) => 
    fetch(`${API_BASE_URL}/worksheets/group/${groupId}${date ? `?date=${date}` : ''}`),

  // Get my group worksheets (for group leaders)
  getMyGroups: (date?: string) => 
    fetch(`${API_BASE_URL}/worksheets/my-groups${date ? `?date=${date}` : ''}`),

  // Get worksheet details
  getById: (id: string) => 
    fetch(`${API_BASE_URL}/worksheets/${id}`),

  // Update record
  updateRecord: (worksheetId: string, recordId: string, data: UpdateWorksheetRecordDto) => 
    fetch(`${API_BASE_URL}/worksheets/${worksheetId}/records/${recordId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }),

  // Batch update
  batchUpdate: (worksheetId: string, data: BatchUpdateRecordsDto) => 
    fetch(`${API_BASE_URL}/worksheets/${worksheetId}/batch-update`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }),

  // Get analytics
  getAnalytics: (id: string) => 
    fetch(`${API_BASE_URL}/worksheets/${id}/analytics`),

  // Get realtime analytics
  getRealtimeAnalytics: (params?: GetRealtimeAnalyticsQuery) => 
    fetch(`${API_BASE_URL}/worksheets/analytics/realtime?${new URLSearchParams(params)}`),

  // Complete worksheet
  complete: (id: string) => 
    fetch(`${API_BASE_URL}/worksheets/${id}/complete`, { method: 'POST' }),
};
```

### 2. React Hooks Example
```typescript
// hooks/useWorksheet.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { worksheetAPI } from '../api/worksheet';
import type { 
  CreateWorksheetDto, 
  UpdateWorksheetRecordDto,
  BatchUpdateRecordsDto 
} from '../types/worksheet';

export const useWorksheets = (filters?: GetWorksheetsQuery) => {
  return useQuery({
    queryKey: ['worksheets', filters],
    queryFn: async () => {
      const response = await worksheetAPI.getAll(filters);
      if (!response.ok) throw new Error('Failed to fetch worksheets');
      return response.json();
    }
  });
};

export const useCreateWorksheet = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: CreateWorksheetDto) => {
      const response = await worksheetAPI.create(data);
      if (!response.ok) throw new Error('Failed to create worksheet');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['worksheets'] });
    }
  });
};

export const useUpdateRecord = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      worksheetId, 
      recordId, 
      data 
    }: {
      worksheetId: string;
      recordId: string;
      data: UpdateWorksheetRecordDto;
    }) => {
      const response = await worksheetAPI.updateRecord(worksheetId, recordId, data);
      if (!response.ok) throw new Error('Failed to update record');
      return response.json();
    },
    onSuccess: (_, { worksheetId }) => {
      queryClient.invalidateQueries({ queryKey: ['worksheets', worksheetId] });
      queryClient.invalidateQueries({ queryKey: ['worksheet-analytics'] });
    }
  });
};
```

### 3. Mobile Group Leader Interface
```typescript
// components/mobile/GroupLeaderDashboard.tsx
import React from 'react';
import { useMyGroupWorksheets, useUpdateRecord } from '../hooks/useWorksheet';

export const GroupLeaderDashboard = () => {
  const { data: worksheets, isLoading } = useMyGroupWorksheets();
  const updateRecord = useUpdateRecord();

  const handleQuickUpdate = async (worksheetId: string, recordId: string, outputs: any[]) => {
    try {
      await updateRecord.mutateAsync({
        worksheetId,
        recordId,
        data: {
          status: 'IN_PROGRESS',
          itemRecords: outputs.map(output => ({
            itemId: output.itemId,
            actualOutput: output.value,
            note: output.note
          }))
        }
      });
    } catch (error) {
      console.error('Update failed:', error);
    }
  };

  return (
    <div className="mobile-dashboard">
      <h1>Phiếu công đoạn hôm nay</h1>
      {worksheets?.map(worksheet => (
        <WorksheetCard 
          key={worksheet.id}
          worksheet={worksheet}
          onUpdateRecord={handleQuickUpdate}
        />
      ))}
    </div>
  );
};
```

## 📱 Mobile Optimization

### Touch-friendly Interface
- Large buttons for quick input
- Swipe gestures for navigation
- Voice input for notes
- Offline capability with sync

### Quick Operations
```typescript
// Quick batch update for mobile
const quickBatchUpdate = async (worksheetId: string, allOutputs: any[]) => {
  const records = groupBy(allOutputs, 'recordId');
  
  await worksheetAPI.batchUpdate(worksheetId, {
    records: Object.entries(records).map(([recordId, items]) => ({
      recordId,
      status: 'IN_PROGRESS',
      itemRecords: items
    }))
  });
};
```

## 📊 Performance Considerations

### Expected Load
- 4000 worksheets/day
- 32,000 - 44,000 records/day  
- Real-time updates every 15-30 minutes

### Optimization Tips
```typescript
// Use React Query for caching
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
    },
  },
});

// Debounce updates
const debouncedUpdate = useDebouncedCallback(
  (data) => updateRecord.mutate(data),
  500 // 500ms delay
);
```

## 🔄 Real-time Updates

### WebSocket Integration (Future)
```typescript
// WebSocket for real-time updates
const useWorksheetSocket = (worksheetId: string) => {
  useEffect(() => {
    const socket = io('/worksheets');
    
    socket.emit('join-worksheet', worksheetId);
    
    socket.on('record-updated', (data) => {
      queryClient.setQueryData(['worksheets', worksheetId], data);
    });
    
    return () => socket.disconnect();
  }, [worksheetId]);
};
```

## 📋 Notes

1. **Authentication**: Tất cả APIs yêu cầu JWT token
2. **Permissions**: Group leaders chỉ có thể cập nhật worksheets của nhóm mình
3. **Validation**: Strict validation cho actualOutput values
4. **Archival**: Auto-archive sau 30 ngày để optimize performance
5. **Mobile-first**: APIs được thiết kế cho mobile interfaces

Tài liệu này sẽ được cập nhật khi có thêm features mới.
```
