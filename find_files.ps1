$password = ConvertTo-SecureString "Chatbot1!!!" -AsPlainText -Force
$credential = New-Object System.Management.Automation.PSCredential ("ubuntu", $password)

# Find all page.tsx files in thank-you directories
$command = "find /var/www -type f -name 'page.tsx' 2>/dev/null | grep -E '(thank-you|app/thank-you)'"

try {
    # Using ssh.exe with password (might need sshpass or similar)
    # Alternative: use Posh-SSH module
    ssh ubuntu@51.38.125.120 $command
} catch {
    Write-Host "Error: $_"
}
