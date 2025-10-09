# Database Connection Troubleshooting

## 🚨 Current Error
```
A network-related or instance-specific error occurred while establishing a connection to SQL Server. The server was not found or was not accessible.
```

This means your .NET backend is running but cannot connect to the SQL Server database.

## 🔧 **Step-by-Step Fix**

### **Step 1: Check Your Backend Configuration**

In your .NET backend project, check the `appsettings.json` file:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=localhost;Database=AuctionDB;Trusted_Connection=true;TrustServerCertificate=true;"
  }
}
```

Or it might look like this:
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=(localdb)\\mssqllocaldb;Database=AuctionDB;Trusted_Connection=true;MultipleActiveResultSets=true"
  }
}
```

### **Step 2: Install/Start SQL Server**

**Option A: SQL Server LocalDB (Easiest)**
```bash
# Check if LocalDB is installed
SqlLocalDB info

# If not installed, install SQL Server Express with LocalDB
# Download from: https://go.microsoft.com/fwlink/?linkid=866658

# Start LocalDB instance
SqlLocalDB start MSSQLLocalDB
```

**Option B: SQL Server Express**
```bash
# Download and install SQL Server Express
# https://www.microsoft.com/en-us/sql-server/sql-server-downloads

# Start SQL Server service
net start MSSQLSERVER
```

**Option C: Docker SQL Server**
```bash
# Run SQL Server in Docker
docker run -e "ACCEPT_EULA=Y" -e "SA_PASSWORD=YourPassword123!" -p 1433:1433 --name sqlserver -d mcr.microsoft.com/mssql/server:2019-latest

# Update connection string to:
# "Server=localhost,1433;Database=AuctionDB;User Id=sa;Password=YourPassword123!;TrustServerCertificate=true;"
```

### **Step 3: Create Database and Run Migrations**

In your .NET backend project directory:

```bash
# Install EF Core tools if not installed
dotnet tool install --global dotnet-ef

# Add migration (if not exists)
dotnet ef migrations add InitialCreate

# Create/update database
dotnet ef database update

# Check if database was created
dotnet ef database list
```

### **Step 4: Verify Connection String**

Test your connection string with this PowerShell command:
```powershell
# Replace with your actual connection string
$connectionString = "Server=localhost;Database=AuctionDB;Trusted_Connection=true;TrustServerCertificate=true;"

try {
    $connection = New-Object System.Data.SqlClient.SqlConnection($connectionString)
    $connection.Open()
    Write-Host "✅ Database connection successful!"
    $connection.Close()
} catch {
    Write-Host "❌ Database connection failed: $($_.Exception.Message)"
}
```

### **Step 5: Alternative - Use In-Memory Database for Testing**

If you want to quickly test without setting up SQL Server, modify your backend to use in-memory database:

In your `Program.cs` or `Startup.cs`:
```csharp
// Replace this:
services.AddDbContext<ApplicationDbContext>(options =>
    options.UseSqlServer(connectionString));

// With this for testing:
services.AddDbContext<ApplicationDbContext>(options =>
    options.UseInMemoryDatabase("AuctionDB"));
```

Don't forget to install the package:
```bash
dotnet add package Microsoft.EntityFrameworkCore.InMemory
```

## 🎯 **Quick Fix Steps**

1. **Check if SQL Server is running:**
   ```bash
   # Check Windows services
   Get-Service -Name "*SQL*"
   
   # Or check specific service
   Get-Service -Name "MSSQLSERVER"
   ```

2. **Start SQL Server service:**
   ```bash
   # Start main SQL Server
   Start-Service -Name "MSSQLSERVER"
   
   # Or start SQL Server Express
   Start-Service -Name "MSSQL$SQLEXPRESS"
   ```

3. **Test your backend connection:**
   ```bash
   # In your backend project directory
   dotnet ef database list
   ```

## 🔍 **Common Solutions**

### **Problem:** SQL Server not installed
**Solution:** Install SQL Server Express or use LocalDB

### **Problem:** SQL Server service not running  
**Solution:** Start the service via Services.msc or command line

### **Problem:** Wrong connection string
**Solution:** Update appsettings.json with correct server name/instance

### **Problem:** Database doesn't exist
**Solution:** Run `dotnet ef database update`

### **Problem:** Authentication issues
**Solution:** Use Windows Authentication or create SQL Server user

## 📞 **Need Help?**

If none of these solutions work:

1. Share your `appsettings.json` connection string (without passwords)
2. Run `Get-Service -Name "*SQL*"` and share the output
3. Check Windows Event Viewer for SQL Server errors
4. Try the in-memory database option for immediate testing

## ✅ **Success Verification**

Once fixed, you should see:
- Backend starts without errors
- API calls return auction data
- No more SQL Server connection errors in logs