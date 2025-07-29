# Frisbee Friends GitHub Setup Script
Write-Host "🚀 Setting up GitHub repository for Frisbee Friends..." -ForegroundColor Green

# Check if git is configured
$gitUser = git config --global user.name
$gitEmail = git config --global user.email

if (-not $gitUser -or -not $gitEmail) {
    Write-Host "⚠️  Git not configured. Please run these commands first:" -ForegroundColor Yellow
    Write-Host "git config --global user.name 'Your Name'" -ForegroundColor Cyan
    Write-Host "git config --global user.email 'your.email@example.com'" -ForegroundColor Cyan
    exit 1
}

Write-Host "✅ Git configured as: $gitUser <$gitEmail>" -ForegroundColor Green

# Instructions for manual GitHub setup
Write-Host "`n📋 Next steps:" -ForegroundColor Yellow
Write-Host "1. Go to https://github.com/new" -ForegroundColor Cyan
Write-Host "2. Repository name: frisbee-friends" -ForegroundColor Cyan
Write-Host "3. Description: A React-based frisbee throwing game with animated birds, boats, and fish" -ForegroundColor Cyan
Write-Host "4. Make it Public" -ForegroundColor Cyan
Write-Host "5. DON'T initialize with README (we already have one)" -ForegroundColor Cyan
Write-Host "6. Click 'Create repository'" -ForegroundColor Cyan

Write-Host "`n🔗 After creating the repository, copy the URL and run:" -ForegroundColor Yellow
Write-Host "git remote add origin YOUR_REPOSITORY_URL" -ForegroundColor Cyan
Write-Host "git push -u origin main" -ForegroundColor Cyan

Write-Host "`n🎮 Your game features:" -ForegroundColor Green
Write-Host "• Frisbee throwing/catching gameplay" -ForegroundColor White
Write-Host "• Animated birds with sound effects" -ForegroundColor White
Write-Host "• Animated boats with physics" -ForegroundColor White
Write-Host "• Fish jumping in both directions" -ForegroundColor White
Write-Host "• Background music and effects" -ForegroundColor White
Write-Host "• Beautiful beach environment" -ForegroundColor White

Write-Host "`n✨ Ready to share your awesome game!" -ForegroundColor Green 