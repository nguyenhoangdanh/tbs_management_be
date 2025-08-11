import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

// Initialize PrismaClient
const prisma = new PrismaClient({
  log: ['error', 'warn', 'info']
});

// Sample data for workers
const SAMPLE_WORKERS = [
  // Leaders
  { 
    employeeCode: 'NV5001', 
    firstName: 'Nguyễn', 
    lastName: 'Văn A', 
    phone: '0912345678', 
    email: 'vana@tbsgroup.vn', 
    role: Role.USER, 
    jobPositionId: 'jobPositionId1', 
    officeId: 'officeId1' 
  },
  { 
    employeeCode: 'NV5002', 
    firstName: 'Trần', 
    lastName: 'Thị B', 
    phone: '0987654321', 
    email: 'tb@tbsgroup.vn', 
    role: Role.USER, 
    jobPositionId: 'jobPositionId2', 
    officeId: 'officeId1' 
  },
  { 
    employeeCode: 'NV5003', 
    firstName: 'Lê', 
    lastName: 'Văn C', 
    phone: '0911223344', 
    email: 'vanc@tbsgroup.vn', 
    role: Role.USER, 
    jobPositionId: 'jobPositionId3', 
    officeId: 'officeId2' 
  },
  { 
    employeeCode: 'NV5004', 
    firstName: 'Phạm', 
    lastName: 'Thị D', 
    phone: '0988776655', 
    email: 'td@tbsgroup.vn', 
    role: Role.USER, 
    jobPositionId: 'jobPositionId4', 
    officeId: 'officeId2' 
  },

  // Workers
  { 
    employeeCode: 'NV5005', 
    firstName: 'Nguyễn', 
    lastName: 'Văn E', 
    phone: '0912345679', 
    email: 'vane@tbsgroup.vn', 
    role: Role.WORKER, 
    jobPositionId: 'jobPositionId1', 
    officeId: 'officeId1' 
  },
  { 
    employeeCode: 'NV5006', 
    firstName: 'Trần', 
    lastName: 'Thị F', 
    phone: '0987654322', 
    email: 'tf@tbsgroup.vn', 
    role: Role.WORKER, 
    jobPositionId: 'jobPositionId2', 
    officeId: 'officeId1' 
  },
  { 
    employeeCode: 'NV5007', 
    firstName: 'Lê', 
    lastName: 'Văn G', 
    phone: '0911223345', 
    email: 'vang@tbsgroup.vn', 
    role: Role.WORKER, 
    jobPositionId: 'jobPositionId3', 
    officeId: 'officeId2' 
  },
  { 
    employeeCode: 'NV5008', 
    firstName: 'Phạm', 
    lastName: 'Thị H', 
    phone: '0988776656', 
    email: 'th@tbsgroup.vn', 
    role: Role.WORKER, 
    jobPositionId: 'jobPositionId4', 
    officeId: 'officeId2' 
  },
  { 
    employeeCode: 'NV5009', 
    firstName: 'Nguyễn', 
    lastName: 'Văn I', 
    phone: '0912345680', 
    email: 'vani@tbsgroup.vn', 
    role: Role.WORKER, 
    jobPositionId: 'jobPositionId1', 
    officeId: 'officeId1' 
  },
  { 
    employeeCode: 'NV5010', 
    firstName: 'Trần', 
    lastName: 'Thị J', 
    phone: '0987654323', 
    email: 'tj@tbsgroup.vn', 
    role: Role.WORKER, 
    jobPositionId: 'jobPositionId2', 
    officeId: 'officeId1' 
  },
  { 
    employeeCode: 'NV5011', 
    firstName: 'Lê', 
    lastName: 'Văn K', 
    phone: '0911223346', 
    email: 'vank@tbsgroup.vn', 
    role: Role.WORKER, 
    jobPositionId: 'jobPositionId3', 
    officeId: 'officeId2' 
  },
  { 
    employeeCode: 'NV5012', 
    firstName: 'Phạm', 
    lastName: 'Thị L', 
    phone: '0988776657', 
    email: 'tl@tbsgroup.vn', 
    role: Role.WORKER, 
    jobPositionId: 'jobPositionId4', 
    officeId: 'officeId2' 
  },
  { 
    employeeCode: 'NV5013', 
    firstName: 'Nguyễn', 
    lastName: 'Văn M', 
    phone: '0912345681', 
    email: 'vanm@tbsgroup.vn', 
    role: Role.WORKER, 
    jobPositionId: 'jobPositionId1', 
    officeId: 'officeId1' 
  },
  { 
    employeeCode: 'NV5014', 
    firstName: 'Trần', 
    lastName: 'Thị N', 
    phone: '0987654324', 
    email: 'tn@tbsgroup.vn', 
    role: Role.WORKER, 
    jobPositionId: 'jobPositionId2', 
    officeId: 'officeId1' 
  },
  { 
    employeeCode: 'NV5015', 
    firstName: 'Lê', 
    lastName: 'Văn O', 
    phone: '0911223347', 
    email: 'vano@tbsgroup.vn', 
    role: Role.WORKER, 
    jobPositionId: 'jobPositionId3', 
    officeId: 'officeId2' 
  },
  { 
    employeeCode: 'NV5016', 
    firstName: 'Phạm', 
    lastName: 'Thị P', 
    phone: '0988776658', 
    email: 'tp@tbsgroup.vn', 
    role: Role.WORKER, 
    jobPositionId: 'jobPositionId4', 
    officeId: 'officeId2' 
  },
  { 
    employeeCode: 'NV5017', 
    firstName: 'Nguyễn', 
    lastName: 'Văn Q', 
    phone: '0912345682', 
    email: 'vanq@tbsgroup.vn', 
    role: Role.WORKER, 
    jobPositionId: 'jobPositionId1', 
    officeId: 'officeId1' 
  },
  { 
    employeeCode: 'NV5018', 
    firstName: 'Trần', 
    lastName: 'Thị R', 
    phone: '0987654325', 
    email: 'tr@tbsgroup.vn', 
    role: Role.WORKER, 
    jobPositionId: 'jobPositionId2', 
    officeId: 'officeId1' 
  },
  { 
    employeeCode: 'NV5019', 
    firstName: 'Lê', 
    lastName: 'Văn S', 
    phone: '0911223348', 
    email: 'vans@tbsgroup.vn', 
    role: Role.WORKER, 
    jobPositionId: 'jobPositionId3', 
    officeId: 'officeId2' 
  },
  { 
    employeeCode: 'NV5020', 
    firstName: 'Phạm', 
    lastName: 'Thị T', 
    phone: '0988776659', 
    email: 'tt@tbsgroup.vn', 
    role: Role.WORKER, 
    jobPositionId: 'jobPositionId4', 
    officeId: 'officeId2' 
  }
];

async function createSampleWorkers() {
  console.log('👷 Creating sample workers...');
  
  for (const workerData of SAMPLE_WORKERS) {
    try {
      // Check if worker already exists
      const existingWorker = await prisma.user.findUnique({
        where: { employeeCode: workerData.employeeCode }
      });
      
      if (existingWorker) {
        console.warn(`⚠️ Worker already exists: ${workerData.employeeCode}`);
        continue;
      }
      
      // Create worker
      const worker = await prisma.user.create({
        data: {
          ...workerData,
          password: await bcrypt.hash('123456', 10), // Default password
          role: workerData.role || Role.WORKER, // Default to WORKER role
        },
      });
      
      console.log(`✅ Created worker: ${worker.employeeCode} - ${worker.firstName} ${worker.lastName}`);
    } catch (error) {
      console.error(`❌ Error creating worker ${workerData.employeeCode}:`, error.message);
    }
  }
}

async function assignWorkersToGroups(workers: any[]) {
  console.log('\n👥 Assigning workers to groups...');
  
  // Shuffle workers array for random assignment
  const shuffledWorkers = workers.sort(() => 0.5 - Math.random());
  
  // Assign workers to groups (1 leader + 4 workers per group)
  for (let i = 0; i < shuffledWorkers.length; i++) {
    const worker = shuffledWorkers[i];
    
    try {
      // Find a group to assign (1 leader + 4 workers per group)
      const group = await prisma.group.findFirst({
        where: {
          isActive: true,
          leaderId: null, // Group must not have a leader yet
        },
        orderBy: {
          createdAt: 'asc', // Assign to oldest group first
        },
      });
      
      if (!group) {
        console.warn('⚠️ No available groups for assignment');
        break;
      }
      
      // Update worker with group assignment
      await prisma.user.update({
        where: { id: worker.id },
        data: { groupId: group.id },
      });
      
      console.log(`✅ Assigned ${worker.employeeCode} to group ${group.code}`);
      
      // After assigning a leader, skip the next 4 workers (assuming 4 workers per group)
      if (i % 5 === 4) {
        console.log('--- Skipped 4 workers, next group leader assignment ---');
        i += 4;
      }
    } catch (error) {
      console.error(`❌ Error assigning worker ${worker.employeeCode} to group:`, error.message);
    }
  }
}

// Run script
async function main() {
  try {
    // Create sample workers
    await createSampleWorkers();
    
    // Get all workers for assignment
    const allWorkers = await prisma.user.findMany({
      where: { role: Role.WORKER },
      include: { group: true }
    });
    
    // Assign workers to groups
    await assignWorkersToGroups(allWorkers);
    
    console.log('\n🎉 Sample workers creation and assignment completed successfully!');
  } catch (error) {
    console.error('❌ Error in sample workers script:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

export { createSampleWorkers, assignWorkersToGroups };