# Automatic Ended Auctions Feature

## Summary
This feature automatically detects auctions that have passed their end time and displays them separately from active auctions. Sellers can manage and remove ended auctions from their dashboard.

## Key Features Implemented

### 1. **Automatic Time-Based Status Detection**
Added helper functions to automatically detect when auctions have ended:

```javascript
// Check if auction has ended based on endTime
const isAuctionEnded = (auction) => {
  if (!auction || !auction.endTime) return false;
  const endTime = new Date(auction.endTime);
  const now = new Date();
  return now > endTime;
}

// Get actual auction status (considering time)
const getAuctionStatus = (auction) => {
  if (!auction) return 'Unknown';
  
  // If already marked as Closed or Ended
  if (auction.status === 'Closed' || auction.status === 'Ended') {
    return auction.status;
  }
  
  // Check if time has expired
  if (isAuctionEnded(auction)) {
    return 'Ended';
  }
  
  return auction.status || 'Active';
}
```

### 2. **Separated Active and Ended Auctions**

#### **Overview Tab**
- Changed "Your Auctions" to "Your Active Auctions"
- Only displays auctions with status === 'Active'
- Shows up to 5 active auctions
- Link to view all auctions if more than 5 exist
- Updated stats card to show: `Active: X | Ended: Y`

#### **My Auctions Tab (Selling)**
Now displays **TWO separate sections:**

**A. Active Auctions Section**
- Grid layout (3 columns)
- Shows all active auctions
- Displays: Image, Title, Current Price, Bid Count, End Date
- **Action Buttons:**
  - 🔵 View (Blue)
  - 🟢 Close (Green) - Only for Active auctions
  - 🔴 Delete (Red)
- Empty state: "No active auctions"

**B. Ended Auctions Section**
- List layout (horizontal cards)
- Shows all ended auctions (automatically detected by time)
- Displays: Image, Title, Final Price, Bid Count, End Date
- **Status Badge:** Orange "Ended" badge
- **Action Buttons:**
  - View Details
  - Delete (with trash icon)
- Empty state: "Auctions that pass their end time will appear here"

### 3. **Sellers Can Remove Ended Items**
- Delete button available on all ended auction cards
- Same confirmation dialog as active auctions
- Calls `DELETE /api/Auctions/{id}` endpoint
- Updates UI immediately after deletion
- Shows success message

### 4. **Updated Statistics**
Statistics cards now reflect the separation:
- **Your Auctions Card:**
  - Shows total count
  - Breakdown: `Active: X | Ended: Y`
  - Updates automatically as auctions end

## Visual Design

### Status Indicators
- **Active:** Green badge (bg-green-100, text-green-800)
- **Ended:** Orange badge (bg-orange-100, text-orange-700)
- **Closed:** Gray badge (bg-gray-200, text-gray-700)

### Section Layout
```
┌─────────────────────────────────────────┐
│  MY AUCTIONS TAB                        │
├─────────────────────────────────────────┤
│                                         │
│  ┌─ ACTIVE AUCTIONS ──────────┐        │
│  │ [Grid: 3 columns]          │        │
│  │ [Card] [Card] [Card]       │        │
│  │ [Card] [Card] [Card]       │        │
│  └────────────────────────────┘        │
│                                         │
│  ┌─ ENDED AUCTIONS ───────────┐        │
│  │ [List: Horizontal cards]   │        │
│  │ [Image] Title | $X | Delete│        │
│  │ [Image] Title | $X | Delete│        │
│  └────────────────────────────┘        │
└─────────────────────────────────────────┘
```

## User Flow

### Viewing Ended Auctions
1. User navigates to Dashboard → My Auctions tab
2. Sees two sections:
   - **Active Auctions** (top)
   - **Ended Auctions** (bottom)
3. Auctions automatically move to "Ended" when time expires
4. No manual action needed from seller

### Removing Ended Auctions
1. Seller finds auction in "Ended Auctions" section
2. Clicks red Delete button (trash icon)
3. Confirmation dialog appears:
   - "Are you sure?"
   - "Delete '[Auction Title]'?"
   - "This action cannot be undone."
4. Seller confirms
5. API call: `DELETE /api/Auctions/{id}`
6. Auction removed from dashboard
7. Success message appears

## Technical Details

### Auction Status Logic
```
IF auction.status === 'Closed' OR auction.status === 'Ended'
  → Return that status
ELSE IF current_time > auction.endTime
  → Return 'Ended' (automatic detection)
ELSE
  → Return 'Active' (or auction.status)
```

### Filtering
- **Active:** `userAuctions.filter(a => getAuctionStatus(a) === 'Active')`
- **Ended:** `userAuctions.filter(a => getAuctionStatus(a) === 'Ended')`
- **Closed:** `userAuctions.filter(a => auction.status === 'Closed')`

### Real-Time Detection
The `getAuctionStatus()` function checks the time **every time** the component renders, ensuring auctions automatically appear as "Ended" once their `endTime` passes without requiring page refresh or backend update.

## Files Modified
1. `src/app/Dashboard/page.jsx`
   - Added `isAuctionEnded()` helper function
   - Added `getAuctionStatus()` helper function
   - Updated Overview tab to show only active auctions
   - Completely redesigned My Auctions (Selling) tab:
     * Added Active Auctions section
     * Added Ended Auctions section
   - Updated statistics card to show Active/Ended breakdown

## Differences from Closed Auctions

| Feature | Closed Auctions | Ended Auctions |
|---------|----------------|----------------|
| **Trigger** | Manual (seller clicks Close) | Automatic (time expires) |
| **Location** | Profile tab only | My Auctions tab |
| **Purpose** | Seller finalizes with winner | Time-based completion |
| **Badge Color** | Gray | Orange |
| **Can Delete?** | Not shown in My Auctions | ✅ Yes, with Delete button |

## Testing Checklist

### Automatic Detection
- [ ] Auction with future endTime shows as "Active"
- [ ] Auction with past endTime shows as "Ended"
- [ ] Status updates without page refresh (component re-render)
- [ ] Auctions move between sections based on time

### Active Auctions Section
- [ ] Displays only active auctions
- [ ] Shows correct bid count
- [ ] Shows end date
- [ ] View button navigates to auction page
- [ ] Close button opens confirmation dialog
- [ ] Delete button removes auction
- [ ] Empty state shows when no active auctions

### Ended Auctions Section
- [ ] Displays only ended auctions
- [ ] Shows final price correctly
- [ ] Shows "Ended" orange badge
- [ ] View Details button works
- [ ] Delete button removes ended auction
- [ ] Empty state shows when no ended auctions
- [ ] Count shown in section header

### Statistics
- [ ] Overview stats card shows Active/Ended breakdown
- [ ] Numbers update after deletion
- [ ] Numbers accurate for all statuses

### Delete Functionality
- [ ] Can delete active auctions
- [ ] Can delete ended auctions
- [ ] Cannot delete from closed auctions section (different section)
- [ ] Confirmation dialog appears
- [ ] API call succeeds
- [ ] UI updates immediately
- [ ] Success message displays

## Future Enhancements
- Auto-archive ended auctions after X days
- Bulk delete for multiple ended auctions
- Export ended auctions report
- Notification when auction ends
- Countdown timer showing time until auction ends
- Filter/sort options for ended auctions
