# Factory & Manufacturing API Documentation

## 📋 Tổng quan

Tài liệu này mô tả chi tiết các APIs cho hệ thống quản lý nhà máy và sản xuất, bao gồm:
- **Factory Management**: Quản lý nhà máy, lines, teams, groups
- **Manufacturing Management**: Quản lý sản phẩm, công đoạn và mappings

**Lưu ý:** Để xem APIs quản lý phiếu công đoạn, tham khảo [WORKSHEET_API.md](./WORKSHEET_API.md)

## 🏭 Factory Management APIs

Base URL: `/api/factories`

### 1. Create Factory
**POST** `/api/factories`

**Authorization:** SUPERADMIN, ADMIN

**Request Body:**
```typescript
interface CreateFactoryDto {
  name: string;        // "Nhà máy TS1"
  code: string;        // "TS1" (unique)
  description?: string; // "Nhà máy sản xuất túi xách TS1"
  officeId: string;    // UUID của Office
}
```

**Response:**
```typescript
interface CreateFactoryResponse {
  id: string;
  name: string;
  code: string;
  description: string | null;
  officeId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  office: {
    id: string;
    name: string;
    type: "HEAD_OFFICE" | "FACTORY_OFFICE";
  };
  _count: {
    lines: number;
    worksheets: number;
  };
}
```

### 2. Get All Factories
**GET** `/api/factories`

**Query Parameters:**
```typescript
interface GetFactoriesQuery {
  includeLines?: boolean; // Default: false
}
```

**Response:**
```typescript
interface GetFactoriesResponse {
  id: string;
  name: string;
  code: string;
  description: string | null;
  officeId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  office: {
    id: string;
    name: string;
    type: "HEAD_OFFICE" | "FACTORY_OFFICE";
  };
  lines?: {
    id: string;
    name: string;
    code: string;
    description: string | null;
    _count: {
      teams: number;
    };
  }[];
  _count: {
    lines: number;
    worksheets: number;
  };
}[]
```

### 3. Get Factory by ID
**GET** `/api/factories/:id`

**Path Parameters:**
```typescript
interface GetFactoryParams {
  id: string; // Factory UUID
}
```

**Response:**
```typescript
interface GetFactoryResponse {
  id: string;
  name: string;
  code: string;
  description: string | null;
  officeId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  office: {
    id: string;
    name: string;
    type: "HEAD_OFFICE" | "FACTORY_OFFICE";
  };
  lines: {
    id: string;
    name: string;
    code: string;
    description: string | null;
    _count: {
      teams: number;
    };
  }[];
  _count: {
    lines: number;
    worksheets: number;
  };
}
```

### 4. Get Factory Structure (Full Hierarchy)
**GET** `/api/factories/:id/structure`

**Path Parameters:**
```typescript
interface GetFactoryStructureParams {
  id: string; // Factory UUID
}
```

**Response:**
```typescript
interface GetFactoryStructureResponse {
  id: string;
  name: string;
  code: string;
  description: string | null;
  officeId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  office: {
    id: string;
    name: string;
    type: "HEAD_OFFICE" | "FACTORY_OFFICE";
  };
  lines: {
    id: string;
    name: string;
    code: string;
    description: string | null;
    teams: {
      id: string;
      name: string;
      code: string;
      description: string | null;
      groups: {
        id: string;
        name: string;
        code: string;
        description: string | null;
        leader: {
          id: string;
          employeeCode: string;
          firstName: string;
          lastName: string;
        } | null;
        _count: {
          members: number;
        };
      }[];
      _count: {
        groups: number;
      };
    }[];
    _count: {
      teams: number;
    };
  }[];
}
```

### 5. Get Factory Lines
**GET** `/api/factories/:id/lines`

**Path Parameters:**
```typescript
interface GetFactoryLinesParams {
  id: string; // Factory UUID
}
```

**Query Parameters:**
```typescript
interface GetFactoryLinesQuery {
  includeTeams?: boolean; // Default: false
}
```

**Response:**
```typescript
interface GetFactoryLinesResponse {
  factory: {
    id: string;
    name: string;
  };
  lines: {
    id: string;
    name: string;
    code: string;
    description: string | null;
    teams?: {
      id: string;
      name: string;
      code: string;
      description: string | null;
      _count: {
        groups: number;
      };
    }[];
    _count: {
      teams: number;
    };
  }[];
}
```

### 6. Update Factory
**PUT** `/api/factories/:id`

**Authorization:** SUPERADMIN, ADMIN

**Path Parameters:**
```typescript
interface UpdateFactoryParams {
  id: string; // Factory UUID
}
```

**Request Body:**
```typescript
interface UpdateFactoryDto {
  name?: string;
  code?: string;
  description?: string;
  officeId?: string;
  isActive?: boolean;
}
```

**Response:** Same as Create Factory Response

### 7. Delete Factory
**DELETE** `/api/factories/:id`

**Authorization:** SUPERADMIN

**Path Parameters:**
```typescript
interface DeleteFactoryParams {
  id: string; // Factory UUID
}
```

**Response:**
```typescript
interface DeleteFactoryResponse {
  id: string;
  name: string;
  code: string;
  message: "Factory deleted successfully";
}
```

## 🏭 Manufacturing Management APIs

Base URL: `/api/manufacturing`

### Product Management

#### 1. Create Product
**POST** `/api/manufacturing/products`

**Authorization:** SUPERADMIN, ADMIN

**Request Body:**
```typescript
interface CreateProductDto {
  name: string;        // "Túi xách văn phòng A1"
  code: string;        // "TUI-A1" (unique)
  description?: string; // "Túi xách công sở cao cấp màu đen"
  imageUrl?: string;   // "https://example.com/images/tui-a1.jpg"
}
```

**Response:**
```typescript
interface CreateProductResponse {
  id: string;
  name: string;
  code: string;
  description: string | null;
  imageUrl: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count: {
    processes: number;
  };
}
```

#### 2. Get All Products
**GET** `/api/manufacturing/products`

**Query Parameters:**
```typescript
interface GetProductsQuery {
  includeProcesses?: boolean; // Default: false
}
```

**Response:**
```typescript
interface GetProductsResponse {
  id: string;
  name: string;
  code: string;
  description: string | null;
  imageUrl: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  processes?: {
    id: string;
    standardOutputPerHour: number;
    sequence: number;
    isActive: boolean;
    process: {
      id: string;
      name: string;
      code: string;
      description: string | null;
    };
  }[];
  _count: {
    processes: number;
  };
}[]
```

#### 3. Get Product by ID
**GET** `/api/manufacturing/products/:id`

**Path Parameters:**
```typescript
interface GetProductParams {
  id: string; // Product UUID
}
```

**Response:**
```typescript
interface GetProductResponse {
  id: string;
  name: string;
  code: string;
  description: string | null;
  imageUrl: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  processes: {
    id: string;
    standardOutputPerHour: number;
    sequence: number;
    isActive: boolean;
    process: {
      id: string;
      name: string;
      code: string;
      description: string | null;
    };
  }[];
  _count: {
    processes: number;
    worksheetItems: number;
  };
}
```

#### 4. Update Product
**PUT** `/api/manufacturing/products/:id`

**Authorization:** SUPERADMIN, ADMIN

**Path Parameters:**
```typescript
interface UpdateProductParams {
  id: string; // Product UUID
}
```

**Request Body:**
```typescript
interface UpdateProductDto {
  name?: string;
  code?: string;
  description?: string;
  imageUrl?: string;
  isActive?: boolean;
}
```

**Response:** Same as Create Product Response

#### 5. Delete Product
**DELETE** `/api/manufacturing/products/:id`

**Authorization:** SUPERADMIN

**Path Parameters:**
```typescript
interface DeleteProductParams {
  id: string; // Product UUID
}
```

**Response:**
```typescript
interface DeleteProductResponse {
  id: string;
  name: string;
  code: string;
  message: "Product deleted successfully";
}
```

### Process Management

#### 1. Create Process
**POST** `/api/manufacturing/processes`

**Authorization:** SUPERADMIN, ADMIN

**Request Body:**
```typescript
interface CreateProcessDto {
  name: string;        // "Cắt chặt vải"
  code: string;        // "CD-01" (unique)
  description?: string; // "Công đoạn cắt chặt vải theo pattern"
}
```

**Response:**
```typescript
interface CreateProcessResponse {
  id: string;
  name: string;
  code: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count: {
    products: number;
  };
}
```

#### 2. Get All Processes
**GET** `/api/manufacturing/processes`

**Response:**
```typescript
interface GetProcessesResponse {
  id: string;
  name: string;
  code: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count: {
    products: number;
  };
}[]
```

#### 3. Get Process by ID
**GET** `/api/manufacturing/processes/:id`

**Path Parameters:**
```typescript
interface GetProcessParams {
  id: string; // Process UUID
}
```

**Response:**
```typescript
interface GetProcessResponse {
  id: string;
  name: string;
  code: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  products: {
    id: string;
    standardOutputPerHour: number;
    sequence: number;
    isActive: boolean;
    product: {
      id: string;
      name: string;
      code: string;
      description: string | null;
    };
  }[];
  _count: {
    products: number;
    worksheetItems: number;
  };
}
```

#### 4. Update Process
**PUT** `/api/manufacturing/processes/:id`

**Authorization:** SUPERADMIN, ADMIN

**Path Parameters:**
```typescript
interface UpdateProcessParams {
  id: string; // Process UUID
}
```

**Request Body:**
```typescript
interface UpdateProcessDto {
  name?: string;
  code?: string;
  description?: string;
  isActive?: boolean;
}
```

**Response:** Same as Create Process Response

#### 5. Delete Process
**DELETE** `/api/manufacturing/processes/:id`

**Authorization:** SUPERADMIN

**Path Parameters:**
```typescript
interface DeleteProcessParams {
  id: string; // Process UUID
}
```

**Response:**
```typescript
interface DeleteProcessResponse {
  id: string;
  name: string;
  code: string;
  message: "Process deleted successfully";
}
```

### Product-Process Relationship Management

#### 1. Add Process to Product
**POST** `/api/manufacturing/products/:productId/processes`

**Authorization:** SUPERADMIN, ADMIN

**Path Parameters:**
```typescript
interface AddProcessToProductParams {
  productId: string; // Product UUID
}
```

**Request Body:**
```typescript
interface CreateProductProcessDto {
  processId: string;           // Process UUID
  standardOutputPerHour: number; // 45 (sản lượng chuẩn/giờ)
  sequence?: number;           // 1 (thứ tự công đoạn)
}
```

**Response:**
```typescript
interface CreateProductProcessResponse {
  id: string;
  productId: string;
  processId: string;
  standardOutputPerHour: number;
  sequence: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  product: {
    id: string;
    name: string;
    code: string;
  };
  process: {
    id: string;
    name: string;
    code: string;
  };
}
```

#### 2. Get Product Processes
**GET** `/api/manufacturing/products/:productId/processes`

**Path Parameters:**
```typescript
interface GetProductProcessesParams {
  productId: string; // Product UUID
}
```

**Response:**
```typescript
interface GetProductProcessesResponse {
  id: string;
  standardOutputPerHour: number;
  sequence: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  process: {
    id: string;
    name: string;
    code: string;
    description: string | null;
    isActive: boolean;
  };
}[]
```

#### 3. Get Specific Product-Process
**GET** `/api/manufacturing/product-process/:productId/:processId`

**Path Parameters:**
```typescript
interface GetProductProcessParams {
  productId: string; // Product UUID
  processId: string; // Process UUID
}
```

**Response:**
```typescript
interface GetProductProcessResponse {
  id: string;
  productId: string;
  processId: string;
  standardOutputPerHour: number;
  sequence: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  product: {
    id: string;
    name: string;
    code: string;
    description: string | null;
    imageUrl: string | null;
    isActive: boolean;
  };
  process: {
    id: string;
    name: string;
    code: string;
    description: string | null;
    isActive: boolean;
  };
}
```

#### 4. Remove Process from Product
**DELETE** `/api/manufacturing/products/:productId/processes/:processId`

**Authorization:** SUPERADMIN, ADMIN

**Path Parameters:**
```typescript
interface RemoveProcessFromProductParams {
  productId: string; // Product UUID
  processId: string; // Process UUID
}
```

**Response:**
```typescript
interface RemoveProcessFromProductResponse {
  id: string;
  message: "Process removed from product successfully";
}
```

## 🔧 Error Responses

Tất cả APIs sử dụng chuẩn HTTP status codes và trả về error responses:

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

- **400 Bad Request**: Validation errors, missing required fields
- **401 Unauthorized**: Authentication required
- **403 Forbidden**: Insufficient permissions
- **404 Not Found**: Resource not found
- **409 Conflict**: Duplicate resource (code already exists)

### Example Error Response:
```json
{
  "statusCode": 400,
  "message": "Product with this code already exists",
  "error": "Bad Request",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "path": "/api/manufacturing/products"
}
```

## 🎯 Frontend Implementation Guide

### 1. API Client Setup
```typescript
// api/client.ts
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';

export const apiClient = {
  factory: {
    getAll: (params?: GetFactoriesQuery) => 
      fetch(`${API_BASE_URL}/factories?${new URLSearchParams(params)}`),
    getById: (id: string) => 
      fetch(`${API_BASE_URL}/factories/${id}`),
    getStructure: (id: string) => 
      fetch(`${API_BASE_URL}/factories/${id}/structure`),
    create: (data: CreateFactoryDto) => 
      fetch(`${API_BASE_URL}/factories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
  },
  manufacturing: {
    products: {
      getAll: (params?: GetProductsQuery) => 
        fetch(`${API_BASE_URL}/manufacturing/products?${new URLSearchParams(params)}`),
      create: (data: CreateProductDto) => 
        fetch(`${API_BASE_URL}/manufacturing/products`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        })
    },
    processes: {
      getAll: () => 
        fetch(`${API_BASE_URL}/manufacturing/processes`),
      create: (data: CreateProcessDto) => 
        fetch(`${API_BASE_URL}/manufacturing/processes`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        })
    }
  }
};
```

### 2. Type Definitions File
```typescript
// types/manufacturing.ts
export interface Factory {
  id: string;
  name: string;
  code: string;
  description: string | null;
  officeId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  id: string;
  name: string;
  code: string;
  description: string | null;
  imageUrl: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Process {
  id: string;
  name: string;
  code: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Import all DTOs from this document
export type { 
  CreateFactoryDto, 
  CreateProductDto, 
  CreateProcessDto,
  GetFactoriesResponse,
  GetProductsResponse,
  // ... all other interfaces
};
```

### 3. React Hooks Example
```typescript
// hooks/useFactory.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import type { CreateFactoryDto, GetFactoriesResponse } from '../types/manufacturing';

export const useFactories = (params?: GetFactoriesQuery) => {
  return useQuery({
    queryKey: ['factories', params],
    queryFn: async (): Promise<GetFactoriesResponse> => {
      const response = await apiClient.factory.getAll(params);
      if (!response.ok) throw new Error('Failed to fetch factories');
      return response.json();
    }
  });
};

export const useCreateFactory = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: CreateFactoryDto) => {
      const response = await apiClient.factory.create(data);
      if (!response.ok) throw new Error('Failed to create factory');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['factories'] });
    }
  });
};
```

## 📝 Notes

1. **Authentication**: Tất cả APIs đều yêu cầu JWT token trong header `Authorization: Bearer <token>`
2. **Validation**: Request body sẽ được validate theo DTO schemas
3. **Pagination**: Chưa implement, có thể thêm sau nếu cần
4. **Search/Filter**: Chưa implement, có thể thêm query parameters
5. **File Upload**: Product imageUrl hiện tại chỉ nhận URL string, có thể mở rộng để upload file

## 🔗 Related Documentation

- **WorkSheet Management**: [WORKSHEET_API.md](./WORKSHEET_API.md) - APIs cho hệ thống phiếu công đoạn
- **Database Schema**: [README.md](../README.md#database-schema) - Chi tiết database schema

Tài liệu này tập trung vào Factory và Manufacturing management. Các APIs khác sẽ có tài liệu riêng.
