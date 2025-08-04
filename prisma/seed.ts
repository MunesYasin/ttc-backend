import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seed...');

  // Create Super Admin
  const superAdminPassword = await bcrypt.hash('superadmin123', 10);
  const superAdmin = await prisma.user.upsert({
    where: { email: 'superadmin@ttc.com' },
    update: {},
    create: {
      name: 'Super Administrator',
      email: 'superadmin@ttc.com',
      password: superAdminPassword,
      role: Role.SUPER_ADMIN,
    },
  });

  console.log('Super Admin created:', superAdmin.email);

  // Create Companies
  let company1 = await prisma.company.findFirst({
    where: { name: 'Tech Solutions Inc.' },
  });

  if (!company1) {
    company1 = await prisma.company.create({
      data: {
        name: 'Tech Solutions Inc.',
        industry: 'Technology',
        logoUrl: 'https://example.com/logo1.png',
      },
    });
  }

  let company2 = await prisma.company.findFirst({
    where: { name: 'Creative Marketing Agency' },
  });

  if (!company2) {
    company2 = await prisma.company.create({
      data: {
        name: 'Creative Marketing Agency',
        industry: 'Marketing',
        logoUrl: 'https://example.com/logo2.png',
      },
    });
  }

  console.log('Companies created:', company1.name, company2.name);

  // Create Company Admins
  const admin1Password = await bcrypt.hash('admin123', 10);
  const admin1 = await prisma.user.upsert({
    where: { email: 'admin@techsolutions.com' },
    update: {},
    create: {
      name: 'John Admin',
      email: 'admin@techsolutions.com',
      password: admin1Password,
      role: Role.COMPANY_ADMIN,
      companyId: company1.id,
    },
  });

  const admin2Password = await bcrypt.hash('admin123', 10);
  const admin2 = await prisma.user.upsert({
    where: { email: 'admin@marketingagency.com' },
    update: {},
    create: {
      name: 'Sarah Admin',
      email: 'admin@marketingagency.com',
      password: admin2Password,
      role: Role.COMPANY_ADMIN,
      companyId: company2.id,
    },
  });

  console.log('Company Admins created:', admin1.email, admin2.email);

  // Create Employees for Tech Solutions Inc.
  const employee1Password = await bcrypt.hash('employee123', 10);
  const employees1 = await Promise.all([
    prisma.user.upsert({
      where: { email: 'alice@techsolutions.com' },
      update: {},
      create: {
        name: 'Alice Developer',
        email: 'alice@techsolutions.com',
        password: employee1Password,
        role: Role.EMPLOYEE,
        companyId: company1.id,
      },
    }),
    prisma.user.upsert({
      where: { email: 'bob@techsolutions.com' },
      update: {},
      create: {
        name: 'Bob Designer',
        email: 'bob@techsolutions.com',
        password: employee1Password,
        role: Role.EMPLOYEE,
        companyId: company1.id,
      },
    }),
    prisma.user.upsert({
      where: { email: 'charlie@techsolutions.com' },
      update: {},
      create: {
        name: 'Charlie Tester',
        email: 'charlie@techsolutions.com',
        password: employee1Password,
        role: Role.EMPLOYEE,
        companyId: company1.id,
      },
    }),
  ]);

  // Create Employees for Creative Marketing Agency
  const employee2Password = await bcrypt.hash('employee123', 10);
  const employees2 = await Promise.all([
    prisma.user.upsert({
      where: { email: 'david@marketingagency.com' },
      update: {},
      create: {
        name: 'David Marketer',
        email: 'david@marketingagency.com',
        password: employee2Password,
        role: Role.EMPLOYEE,
        companyId: company2.id,
      },
    }),
    prisma.user.upsert({
      where: { email: 'emma@marketingagency.com' },
      update: {},
      create: {
        name: 'Emma Copywriter',
        email: 'emma@marketingagency.com',
        password: employee2Password,
        role: Role.EMPLOYEE,
        companyId: company2.id,
      },
    }),
    prisma.user.upsert({
      where: { email: 'frank@marketingagency.com' },
      update: {},
      create: {
        name: 'Frank Analyst',
        email: 'frank@marketingagency.com',
        password: employee2Password,
        role: Role.EMPLOYEE,
        companyId: company2.id,
      },
    }),
  ]);

  console.log(
    'Employees created:',
    [...employees1, ...employees2].map((emp) => emp.email).join(', '),
  );

  // Create sample attendance records for today
  const today = new Date();

  const attendanceRecords = await Promise.all([
    // Tech Solutions employees
    prisma.attendanceRecord.upsert({
      where: {
        userId_date: {
          userId: employees1[0].id,
          date: today,
        },
      },
      update: {},
      create: {
        userId: employees1[0].id,
        date: today,
        clockInAt: new Date(today.getTime() + 9 * 60 * 60 * 1000), // 9:00 AM
        clockOutAt: new Date(today.getTime() + 17 * 60 * 60 * 1000), // 5:00 PM
        note: 'Regular work day',
      },
    }),
    prisma.attendanceRecord.upsert({
      where: {
        userId_date: {
          userId: employees1[1].id,
          date: today,
        },
      },
      update: {},
      create: {
        userId: employees1[1].id,
        date: today,
        clockInAt: new Date(today.getTime() + 8.5 * 60 * 60 * 1000), // 8:30 AM
        clockOutAt: new Date(today.getTime() + 16.5 * 60 * 60 * 1000), // 4:30 PM
        note: 'Early shift',
      },
    }),
    // Marketing Agency employees
    prisma.attendanceRecord.upsert({
      where: {
        userId_date: {
          userId: employees2[0].id,
          date: today,
        },
      },
      update: {},
      create: {
        userId: employees2[0].id,
        date: today,
        clockInAt: new Date(today.getTime() + 9.5 * 60 * 60 * 1000), // 9:30 AM
        note: 'Still working',
      },
    }),
  ]);

  // Create sample tasks
  const tasks = await Promise.all([
    prisma.task.create({
      data: {
        userId: employees1[0].id,
        date: today,
        title: 'Implement user authentication',
        description: 'Add JWT-based authentication to the application',
        duration: 6.5,
      },
    }),
    prisma.task.create({
      data: {
        userId: employees1[1].id,
        date: today,
        title: 'Design homepage mockup',
        description: 'Create wireframes and mockups for the new homepage',
        duration: 4.0,
      },
    }),
    prisma.task.create({
      data: {
        userId: employees2[0].id,
        date: today,
        title: 'Create marketing campaign',
        description: 'Develop social media campaign for Q1',
        duration: 5.5,
      },
    }),
  ]);

  console.log(`Created ${attendanceRecords.length} attendance records`);
  console.log(`Created ${tasks.length} tasks`);

  console.log('Seed completed successfully!');
  console.log('\n=== Test Accounts ===');
  console.log('Super Admin: superadmin@ttc.com / superadmin123');
  console.log('Company Admin 1: admin@techsolutions.com / admin123');
  console.log('Company Admin 2: admin@marketingagency.com / admin123');
  console.log('Employee: alice@techsolutions.com / employee123');
  console.log('Employee: david@marketingagency.com / employee123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
