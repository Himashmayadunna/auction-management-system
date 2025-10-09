// Backend Connection Helper
// This script helps you verify if your .NET backend is running

const checkBackend = async () => {
  try {
    console.log('🔍 Testing auction API...');
    const response = await fetch('http://localhost:5277/api/Auctions', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Backend is running!');
      console.log(`📊 Found ${Array.isArray(data) ? data.length : 'unknown'} auctions in database`);
      console.log('Sample data:', data);
      return true;
    } else {
      console.log('❌ Backend responded with error:', response.status, response.statusText);
      return false;
    }
  } catch (error) {
    console.log('❌ Cannot connect to backend:', error.message);
    console.log('\n📋 To fix this, you need to:');
    console.log('1. Navigate to your .NET backend project directory');
    console.log('2. Run: dotnet run');
    console.log('3. Ensure it starts on http://localhost:5277');
    return false;
  }
};

const checkBiddingAPI = async () => {
  try {
    console.log('🎯 Testing bidding API...');
    const response = await fetch('http://localhost:5277/api/bidding/auctions/1/bids', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Bidding API is working!');
      console.log(`📊 Sample auction has ${Array.isArray(data) ? data.length : 'unknown'} bids`);
      return true;
    } else if (response.status === 404) {
      console.log('⚠️ Bidding API accessible but no auction with ID 1 found');
      return true;
    } else {
      console.log('❌ Bidding API responded with error:', response.status, response.statusText);
      return false;
    }
  } catch (error) {
    console.log('❌ Cannot connect to bidding API:', error.message);
    return false;
  }
};

const runAllTests = async () => {
  console.log('🚀 Testing backend connectivity...\n');
  
  const auctionAPIWorking = await checkBackend();
  const biddingAPIWorking = await checkBiddingAPI();
  
  console.log('\n📋 Test Results:');
  console.log(`Auction API: ${auctionAPIWorking ? '✅ Working' : '❌ Failed'}`);
  console.log(`Bidding API: ${biddingAPIWorking ? '✅ Working' : '❌ Failed'}`);
  
  if (auctionAPIWorking && biddingAPIWorking) {
    console.log('\n🎉 All backend services are ready!');
    console.log('You can now run your frontend with: npm run dev');
  } else {
    console.log('\n⚠️ Some services are not working. Please check your backend.');
  }
};

// Usage: Run this in browser console or as a Node.js script
if (typeof window !== 'undefined') {
  // Browser environment
  runAllTests();
} else {
  // Node.js environment
  const fetch = require('node-fetch');
  runAllTests();
}