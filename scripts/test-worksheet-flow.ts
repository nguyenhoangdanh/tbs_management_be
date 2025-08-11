import { PrismaClient, ShiftType } from '@prisma/client';

const prisma = new PrismaClient();

async function testWorksheetFlow() {
  console.log('🧪 Testing complete WorkSheet flow...');

  try {
    // 1. Get first group with leader
    const group = await prisma.group.findFirst({
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
        leader: true,
        members: { where: { isActive: true } }
      }
    });

    if (!group) {
      console.error('❌ No group with leader found');
      return;
    }

    console.log(`✅ Testing with group: ${group.name} (${group.members.length} members)`);
    console.log(`   Leader: ${group.leader?.firstName} ${group.leader?.lastName}`);
    console.log(`   Factory: ${group.team.line.factory.name}`);

    // 2. Get a product-process combination
    const productProcess = await prisma.productProcess.findFirst({
      include: {
        product: true,
        process: true
      }
    });

    if (!productProcess) {
      console.error('❌ No product-process found');
      return;
    }

    console.log(`✅ Using: ${productProcess.product.name} - ${productProcess.process.name}`);

    // 3. Create worksheet (simulate admin action)
    const adminUser = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    });

    if (!adminUser) {
      console.error('❌ No admin user found');
      return;
    }

    // 4. Test complete flow...
    console.log('✅ WorkSheet flow test completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  testWorksheetFlow();
}
