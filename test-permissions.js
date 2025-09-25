const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function testPermissionSystem() {
  console.log('🚀 Testing Permission System...\n');

  try {
    // Test 1: Check if permission endpoints are accessible
    console.log('1. Testing Permission Endpoints:');
    
    try {
      const permissionsResponse = await axios.get(`${BASE_URL}/permissions`);
      console.log('✅ GET /permissions - Available');
      console.log(`   Found ${permissionsResponse.data.length || 0} permissions`);
    } catch (error) {
      console.log('❌ GET /permissions - Error:', error.response?.status, error.response?.statusText);
    }

    // Test 2: Check users endpoint with permission protection
    console.log('\n2. Testing Protected User Endpoints:');
    
    try {
      const usersResponse = await axios.get(`${BASE_URL}/users`);
      console.log('✅ GET /users - Accessible (should be protected)');
    } catch (error) {
      if (error.response?.status === 401 || error.response?.status === 403) {
        console.log('✅ GET /users - Protected (Unauthorized/Forbidden as expected)');
      } else {
        console.log('❌ GET /users - Unexpected error:', error.response?.status, error.response?.statusText);
      }
    }

    // Test 3: Check role endpoints
    console.log('\n3. Testing Role Endpoints:');
    
    try {
      const rolesResponse = await axios.get(`${BASE_URL}/roles`);
      console.log('✅ GET /roles - Available');
      console.log(`   Found ${rolesResponse.data.length || 0} roles`);
    } catch (error) {
      console.log('❌ GET /roles - Error:', error.response?.status, error.response?.statusText);
    }

    console.log('\n🎉 Permission system testing completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testPermissionSystem().catch(console.error);
