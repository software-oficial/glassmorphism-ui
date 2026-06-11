import axios from 'axios';
import * as fs from 'fs';

const API_URL = process.env.VITE_API_URL || 'https://ecosistema-core-production.up.railway.app';
const TENANT_ID = 'default_tenant';
const USER_ID = 'admin_user';

async function testCommand(command, params = {}) {
    console.log(`
Testing command: ${command}...`);
    console.log(`Params: ${JSON.stringify(params)}`);
    
    try {
        const response = await axios.post(`${API_URL}/api/command`, 
        {
            command,
            params
        }, 
        {
            headers: {
                'X-Tenant-ID': TENANT_ID,
                'X-User-ID': USER_ID
            }
        });
        console.log('✅ Response:', JSON.stringify(response.data, null, 2));
    } catch (error) {
        console.error('❌ Error:', error.response?.data || error.message);
    }
}

async function runTests() {
    console.log('🚀 Starting Ecosistema-Core CLI Tests...');
    
    // Test 1: List Products
    await testCommand('stock.list_products', {});
    
    // Test 2: Get specific product
    await testCommand('stock.get_product', { codigo: 'P001' });
    
    // Test 3: Invalid command (Security test)
    await testCommand('system.delete_all', {});
}

runTests().catch(console.error);
