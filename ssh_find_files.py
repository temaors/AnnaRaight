import paramiko
import os

# SSH connection details
hostname = "51.38.125.120"
username = "ubuntu"
password = "Chatbot1!!!"

# Create SSH client
client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())

try:
    # Connect to server
    print("Connecting to server...")
    client.connect(hostname, username=username, password=password, timeout=30)

    # Find all page.tsx files related to thank-you
    print("Searching for thank-you page.tsx files...")
    command = "find /var/www -type f -name 'page.tsx' 2>/dev/null | grep -i thank-you"
    stdin, stdout, stderr = client.exec_command(command)

    files = stdout.read().decode().strip().split('\n')
    files = [f for f in files if f]  # Remove empty strings

    print(f"Found {len(files)} files:")
    for file in files:
        print(f"  {file}")

    # Get file details (modification time and size)
    print("\nFile details:")
    file_details = []
    for file in files:
        stat_cmd = f"stat -c '%Y %s' {file}"
        stdin, stdout, stderr = client.exec_command(stat_cmd)
        stats = stdout.read().decode().strip().split()
        if len(stats) == 2:
            mtime, size = stats
            file_details.append({
                'path': file,
                'mtime': int(mtime),
                'size': int(size)
            })
            print(f"  {file}")
            print(f"    Modified: {mtime}, Size: {size} bytes")

    # Save file list to a text file
    with open('D:\\Vlad\\Server\\tmp_2\\tmp\\downloaded_from_server\\file_list.txt', 'w') as f:
        for detail in file_details:
            f.write(f"{detail['path']}\n")

    print(f"\nFile list saved to downloaded_from_server/file_list.txt")

except Exception as e:
    print(f"Error: {e}")
finally:
    client.close()
