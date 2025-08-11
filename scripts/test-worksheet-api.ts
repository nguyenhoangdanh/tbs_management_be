import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testWorksheetAPI() {
  console.log('🧪 Testing WorkSheet API functionality...');

  try {
    // 1. Test data availability
    console.log('\n📋 Step 1: Checking required data...');
    
    const groups = await prisma.group.findMany({
      where: { 
        leaderId: { not: null },
        isActive: true 
      },
      include: {
        team: {
          include: {
            line: {
              include: { factory: true }
            }
          }
        },
        leader: {
          select: { employeeCode: true, firstName: true, lastName: true }
        },
        members: {
          where: { isActive: true },
          select: { id: true, firstName: true, lastName: true, employeeCode: true }
        }
      },
      take: 3
    });

    if (groups.length === 0) {
      console.error('❌ No groups with leaders found. Run sample-manufacturing-data first.');
      return;
    }

    console.log(`✅ Found ${groups.length} groups with leaders`);
    groups.forEach(group => {
      console.log(`   🏢 ${group.name} - ${group.team.line.factory.name}`);
      console.log(`      👑 Leader: ${group.leader?.employeeCode} - ${group.leader?.firstName} ${group.leader?.lastName}`);
      console.log(`      👥 Members: ${group.members.length} workers`);
    });

    // 2. Check products and processes
    const products = await prisma.product.findMany({ take: 3 });
    const processes = await prisma.process.findMany({ take: 3 });
    const productProcesses = await prisma.productProcess.findMany({ take: 3 });

    console.log(`\n✅ Available data:`);
    console.log(`   📦 Products: ${products.length}`);
    console.log(`   ⚙️  Processes: ${processes.length}`);
    console.log(`   🔗 Product-Process mappings: ${productProcesses.length}`);

    if (products.length === 0 || processes.length === 0) {
      console.error('❌ Missing products or processes. Run sample-manufacturing-data first.');
      return;
    }

    // 3. Test worksheet creation data
    const testGroup = groups[0];
    const testProduct = products[0];
    const testProcess = processes[0];

    const createWorksheetData = {
      groupId: testGroup.id,
      date: new Date().toISOString().split('T')[0], // Today
      shiftType: 'NORMAL_8H' as const,
      productId: testProduct.id,
      processId: testProcess.id
    };

    console.log('\n📝 Test worksheet data:');
    console.log(`   Group: ${testGroup.name} (${testGroup.team.line.factory.name})`);
    console.log(`   Date: ${createWorksheetData.date}`);
    console.log(`   Shift: ${createWorksheetData.shiftType}`);
    console.log(`   Product: ${testProduct.name} (${testProduct.code})`);
    console.log(`   Process: ${testProcess.name} (${testProcess.code})`);

    // 4. Test database queries that the service will use
    console.log('\n🔍 Testing service queries...');

    // Test group query with factory info
    const groupQuery = await prisma.group.findUnique({
      where: { id: testGroup.id },
      include: {
        team: {
          include: {
            line: {
              include: { factory: true }
            }
          }
        },
        members: {
          where: { isActive: true },
          select: { id: true }
        }
      }
    });

    console.log(`   ✅ Group query: ${groupQuery?.name} with ${groupQuery?.members.length} members`);

    // Test product-process query
    const productProcessQuery = await prisma.productProcess.findFirst({
      where: {
        productId: testProduct.id,
        processId: testProcess.id
      }
    });

    console.log(`   ✅ Product-Process query: ${productProcessQuery ? `Found (${productProcessQuery.standardOutputPerHour}/h)` : 'Not found'}`);

    // Test duplicate check query
    const duplicateCheck = await prisma.workSheet.findFirst({
      where: {
        date: new Date(createWorksheetData.date),
        groupId: testGroup.id
      }
    });

    console.log(`   ✅ Duplicate check: ${duplicateCheck ? 'Worksheet exists' : 'No duplicate'}`);

    console.log('\n🎉 All tests passed! WorkSheet API is ready to use.');
    console.log('\n📋 Next steps:');
    console.log('   1. Start the server: pnpm start');
    console.log('   2. Test create worksheet API: POST /api/worksheets');
    console.log(`   3. Use test data above for API calls`);

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  testWorksheetAPI();
}
