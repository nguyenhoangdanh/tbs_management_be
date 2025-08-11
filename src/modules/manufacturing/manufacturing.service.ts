import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { CreateProcessDto } from './dto/create-process.dto';
import { UpdateProcessDto } from './dto/update-process.dto';
import { CreateProductProcessDto } from './dto/create-product-process.dto';

@Injectable()
export class ManufacturingService {
  constructor(private prisma: PrismaService) {}

  // Product methods
  async createProduct(createProductDto: CreateProductDto) {
    const { code } = createProductDto;

    // Check if product code already exists
    const existingProduct = await this.prisma.product.findUnique({
      where: { code },
    });

    if (existingProduct) {
      throw new ConflictException('Product with this code already exists');
    }

    return this.prisma.product.create({
      data: createProductDto,
      include: {
        _count: {
          select: { processes: true },
        },
      },
    });
  }

  async findAllProducts(options: { includeProcesses?: boolean } = {}) {
    return this.prisma.product.findMany({
      where: { isActive: true },
      include: {
        processes: options.includeProcesses ? {
          where: { isActive: true },
          include: {
            process: {
              select: {
                id: true,
                name: true,
                code: true,
                description: true,
              },
            },
          },
          orderBy: { sequence: 'asc' },
        } : false,
        _count: {
          select: { processes: true },
        },
      },
      orderBy: { code: 'asc' },
    });
  }

  async findProduct(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        processes: {
          where: { isActive: true },
          include: {
            process: true,
          },
          orderBy: { sequence: 'asc' },
        },
        _count: {
          select: {
            processes: true,
            worksheetItems: true,
          },
        },
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return product;
  }

  async updateProduct(id: string, updateProductDto: UpdateProductDto) {
    const product = await this.prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // If updating code, check for conflicts
    if (updateProductDto.code && updateProductDto.code !== product.code) {
      const existingProduct = await this.prisma.product.findUnique({
        where: { code: updateProductDto.code },
      });

      if (existingProduct) {
        throw new ConflictException('Product with this code already exists');
      }
    }

    return this.prisma.product.update({
      where: { id },
      data: updateProductDto,
      include: {
        _count: {
          select: { processes: true },
        },
      },
    });
  }

  async removeProduct(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            processes: true,
            worksheetItems: true,
          },
        },
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    if (product._count.processes > 0 || product._count.worksheetItems > 0) {
      throw new ConflictException(
        'Cannot delete product with existing processes or worksheet items'
      );
    }

    return this.prisma.product.delete({
      where: { id },
    });
  }

  // Process methods
  async createProcess(createProcessDto: CreateProcessDto) {
    const { code } = createProcessDto;

    // Check if process code already exists
    const existingProcess = await this.prisma.process.findUnique({
      where: { code },
    });

    if (existingProcess) {
      throw new ConflictException('Process with this code already exists');
    }

    return this.prisma.process.create({
      data: createProcessDto,
      include: {
        _count: {
          select: { products: true },
        },
      },
    });
  }

  async findAllProcesses() {
    return this.prisma.process.findMany({
      where: { isActive: true },
      include: {
        _count: {
          select: { products: true },
        },
      },
      orderBy: { code: 'asc' },
    });
  }

  async findProcess(id: string) {
    const process = await this.prisma.process.findUnique({
      where: { id },
      include: {
        products: {
          where: { isActive: true },
          include: {
            product: {
              select: {
                id: true,
                name: true,
                code: true,
                description: true,
              },
            },
          },
          orderBy: { sequence: 'asc' },
        },
        _count: {
          select: {
            products: true,
            worksheetItems: true,
          },
        },
      },
    });

    if (!process) {
      throw new NotFoundException('Process not found');
    }

    return process;
  }

  async updateProcess(id: string, updateProcessDto: UpdateProcessDto) {
    const process = await this.prisma.process.findUnique({
      where: { id },
    });

    if (!process) {
      throw new NotFoundException('Process not found');
    }

    // If updating code, check for conflicts
    if (updateProcessDto.code && updateProcessDto.code !== process.code) {
      const existingProcess = await this.prisma.process.findUnique({
        where: { code: updateProcessDto.code },
      });

      if (existingProcess) {
        throw new ConflictException('Process with this code already exists');
      }
    }

    return this.prisma.process.update({
      where: { id },
      data: updateProcessDto,
      include: {
        _count: {
          select: { products: true },
        },
      },
    });
  }

  async removeProcess(id: string) {
    const process = await this.prisma.process.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            products: true,
            worksheetItems: true,
          },
        },
      },
    });

    if (!process) {
      throw new NotFoundException('Process not found');
    }

    if (process._count.products > 0 || process._count.worksheetItems > 0) {
      throw new ConflictException(
        'Cannot delete process with existing products or worksheet items'
      );
    }

    return this.prisma.process.delete({
      where: { id },
    });
  }

  // Product-Process relationship methods
  async addProcessToProduct(productId: string, createProductProcessDto: CreateProductProcessDto) {
    const { processId } = createProductProcessDto;

    // Validate product exists
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // Validate process exists
    const process = await this.prisma.process.findUnique({
      where: { id: processId },
    });

    if (!process) {
      throw new NotFoundException('Process not found');
    }

    // Check if relationship already exists
    const existingRelation = await this.prisma.productProcess.findUnique({
      where: {
        productId_processId: {
          productId,
          processId,
        },
      },
    });

    if (existingRelation) {
      throw new ConflictException('Process already added to this product');
    }

    return this.prisma.productProcess.create({
      data: {
        productId,
        ...createProductProcessDto,
      },
      include: {
        product: {
          select: { id: true, name: true, code: true },
        },
        process: {
          select: { id: true, name: true, code: true },
        },
      },
    });
  }

  async getProductProcesses(productId: string) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return this.prisma.productProcess.findMany({
      where: {
        productId,
        isActive: true,
      },
      include: {
        process: true,
      },
      orderBy: { sequence: 'asc' },
    });
  }

  async getProductProcess(productId: string, processId: string) {
    const productProcess = await this.prisma.productProcess.findUnique({
      where: {
        productId_processId: {
          productId,
          processId,
        },
      },
      include: {
        product: true,
        process: true,
      },
    });

    if (!productProcess) {
      throw new NotFoundException('Product-process combination not found');
    }

    return productProcess;
  }

  async removeProcessFromProduct(productId: string, processId: string) {
    const productProcess = await this.prisma.productProcess.findUnique({
      where: {
        productId_processId: {
          productId,
          processId,
        },
      },
    });

    if (!productProcess) {
      throw new NotFoundException('Product-process combination not found');
    }

    return this.prisma.productProcess.delete({
      where: {
        productId_processId: {
          productId,
          processId,
        },
      },
    });
  }
}
