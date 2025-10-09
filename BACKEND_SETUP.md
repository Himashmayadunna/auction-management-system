# Backend Setup Instructions

## 🎯 Overview
Your frontend is configured to connect to: `http://localhost:5277/api`

## 🎯 New Bidding System Integration

The frontend now includes complete bidding functionality connecting to your backend at port 5277.

## 📋 Required Backend Setup

### 1. **Backend Project Structure**
Your .NET backend should have these API endpoints:
```
GET  /api/Auctions           - Get all auctions
GET  /api/Auctions/{id}      - Get auction by ID  
POST /api/Auctions           - Create new auction
PUT  /api/Auctions/{id}      - Update auction
DELETE /api/Auctions/{id}    - Delete auction
```

### 2. **Auction Data Model**
The frontend expects auction objects with these properties:
```json
{
  "id": 1,
  "title": "iPhone 14 Pro",
  "description": "256GB, Deep Purple, excellent condition.",
  "startingPrice": 1200,
  "currentPrice": 1350,
  "images": ["/uploaded/image1.jpg", "/uploaded/image2.jpg"],
  "category": "Electronics",
  "location": "Los Angeles, CA",
  "endTime": "2025-10-12T10:00:00Z",
  "startTime": "2025-10-09T10:00:00Z",
  "seller": "John Doe",
  "bidCount": 15,
  "sellerId": "user123"
}
```

### 3. **Database Schema**
Required tables:
- **Auctions** (main auction data)
- **AuctionImages** (uploaded images)
- **Users** (seller information)
- **Bids** (bidding history)

### 4. **Bidding API Endpoints**
The frontend integrates with these bidding endpoints:
- `POST /api/bidding/auctions/{auctionId}/bid` - Place a bid (JWT required)
- `GET /api/bidding/auctions/{auctionId}/bids` - Get auction bids
- `GET /api/bidding/my-bids` - Get user's bidding history (JWT required)  
- `GET /api/bidding/auctions/{auctionId}/stats` - Get bid statistics
- `GET /api/bidding/auctions/{auctionId}/highest-bid` - Get highest bid

### 5. **Image Handling**
- Images should be served from `/uploaded/` directory
- Backend should handle file uploads to this directory
- Frontend expects image URLs like: `/uploaded/MC4yMzk0MT_0.jpg`

## 🚀 Quick Start

### Step 1: Start Your Backend
```bash
# Navigate to your .NET backend project
cd /path/to/your/backend/project

# Restore dependencies
dotnet restore

# Run the backend server on port 5277
dotnet run --urls="http://localhost:5277"
```

### Step 2: Verify Backend is Running
```bash
# Check if backend is accessible
curl http://localhost:5277/api/Auctions

# Test bidding endpoints
curl http://localhost:5277/api/bidding/auctions/1/bids

# Or run our helper script
node check-backend.js
```

### Step 3: Test Frontend Connection
1. Start your Next.js frontend: `npm run dev`
2. Visit `http://localhost:3000`
3. Check browser console for API logs

## 🔧 Troubleshooting

### Backend Not Starting?
- Check if port 5000 is available
- Verify connection string in `appsettings.json`
- Ensure database is running and accessible

### No Data Showing?
- Check if database has auction records
- Verify API endpoints return proper JSON format
- Check browser console for API errors

### Image 404 Errors?
- Ensure `/uploaded/` directory exists in backend
- Check file permissions for uploaded images
- Verify image URLs in database match actual files

## 📊 Sample Database Data
Add some test auctions to your database:
```sql
INSERT INTO Auctions (Title, Description, StartingPrice, CurrentPrice, Category, Location, EndTime, StartTime, SellerId)
VALUES 
('iPhone 14 Pro', '256GB, Deep Purple, excellent condition.', 1200, 1350, 'Electronics', 'Los Angeles, CA', '2025-10-12 10:00:00', '2025-10-09 10:00:00', 1),
('Rolex Submariner', 'Original Rolex Submariner, mint condition.', 9500, 11200, 'Luxury', 'Beverly Hills, CA', '2025-10-13 15:00:00', '2025-10-09 12:00:00', 2);
```

## 📞 Need Help?
If you're having issues:
1. Check the browser console logs
2. Verify backend logs for errors
3. Test API endpoints directly with Postman/curl
4. Ensure database connection is working