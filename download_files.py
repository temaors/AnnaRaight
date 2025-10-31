import paramiko
import os
from datetime import datetime

# SSH connection details
hostname = "51.38.125.120"
username = "ubuntu"
password = "Chatbot1!!!"

# Local download directory
local_dir = "D:\\Vlad\\Server\\tmp_2\\tmp\\downloaded_from_server"

# Files to download
files = [
    "/var/www/funnel-app.backup/app/thank-you/page.tsx",
    "/var/www/funnel-app/app/thank-you/page.tsx",
    "/var/www/funnel-app.backup.20251029_105216/app/thank-you/page.tsx"
]

# Create SSH client
client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())

try:
    # Connect to server
    print("Connecting to server...")
    client.connect(hostname, username=username, password=password, timeout=30)

    # Create SFTP client
    sftp = client.open_sftp()

    # Download each file
    for i, remote_file in enumerate(files, 1):
        print(f"\n[{i}/{len(files)}] Processing: {remote_file}")

        # Get file modification time
        file_attrs = sftp.stat(remote_file)
        mtime = file_attrs.st_mtime
        mtime_readable = datetime.fromtimestamp(mtime).strftime('%Y-%m-%d %H:%M:%S')
        size = file_attrs.st_size

        print(f"  Modified: {mtime_readable}")
        print(f"  Size: {size} bytes")

        # Read file content to check for specific text
        with sftp.file(remote_file, 'r') as remote:
            content = remote.read().decode('utf-8', errors='ignore')

        # Check for specific text
        has_calendar = "Add The Event To Your Calendar" in content
        has_review = "Review Client Results" in content

        print(f"  Contains 'Add The Event To Your Calendar': {has_calendar}")
        print(f"  Contains 'Review Client Results': {has_review}")

        # Create a safe filename
        # Replace path separators with underscores
        safe_name = remote_file.replace("/", "_").replace("\\", "_")
        if safe_name.startswith("_"):
            safe_name = safe_name[1:]

        # Add timestamp to filename
        timestamp = datetime.fromtimestamp(mtime).strftime('%Y%m%d_%H%M%S')
        local_file = os.path.join(local_dir, f"{timestamp}_{safe_name}")

        # Download file
        print(f"  Downloading to: {local_file}")
        with sftp.file(remote_file, 'r') as remote:
            with open(local_file, 'w', encoding='utf-8') as local:
                local.write(content)

        print(f"  [OK] Downloaded successfully")

        # Save a summary file with file info
        summary_file = local_file.replace('.tsx', '_info.txt')
        with open(summary_file, 'w', encoding='utf-8') as f:
            f.write(f"Remote path: {remote_file}\n")
            f.write(f"Modified: {mtime_readable}\n")
            f.write(f"Size: {size} bytes\n")
            f.write(f"Contains 'Add The Event To Your Calendar': {has_calendar}\n")
            f.write(f"Contains 'Review Client Results': {has_review}\n")

    sftp.close()

    print("\n[SUCCESS] All files downloaded successfully!")
    print(f"Files saved to: {local_dir}")

except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()
finally:
    client.close()
