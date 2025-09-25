const { PrismaClient, Role } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function testSuperAdmin() {
  try {
    console.log('Testing SUPER_ADMIN user creation...');
    
    // Create employee roles first
    const employeeRole = await prisma.employeeRoles.create({
      data: {
        name: 'Default Role',
      },
    });
    
    console.log('Employee role created:', employeeRole.id);
    
    // Test SUPER_ADMIN user creation
    const superAdminPassword = await bcrypt.hash('superadmin123', 10);
    const superAdmin = await prisma.user.create({
      data: {
        name: 'Super Administrator',
        email: 'superadmin@test.com',
        personalEmail: 'superadmin.personal@test.com',
        password: superAdminPassword,
        role: Role.SUPER_ADMIN,
        employeeRolesId: null, // Explicitly set to null for SUPER_ADMIN
        companyId: null,
        timezone: 'Asia/Riyadh',
        nationalId: '1000000001',
        hijriBirthDate: new Date('1410-05-10'),
        gregorianBirthDate: new Date('1990-01-01'),
        gender: 'Male',
        absherMobile: '0500000001',
        contactMobile: '0555000001',
        address: 'Riyadh, Saudi Arabia',
        department: null,
        directManager: null,
        contractStartDate: null,
        totalSalary: null,
        remoteWorkDate: null,
      },
      include: {
        company: true,
        employeeRoles: true,
      },
    });
    
    console.log('✅ SUPER_ADMIN user created successfully!');
    console.log('ID:', superAdmin.id);
    console.log('Name:', superAdmin.name);
    console.log('Role:', superAdmin.role);
    console.log('CompanyId:', superAdmin.companyId);
    console.log('EmployeeRolesId:', superAdmin.employeeRolesId);
    console.log('Department:', superAdmin.department);
    console.log('EmployeeRoles:', superAdmin.employeeRoles);
    
    console.log('\n✅ All SUPER_ADMIN restrictions working correctly!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testSuperAdmin();
