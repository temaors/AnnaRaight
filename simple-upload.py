#!/usr/bin/env python3
import http.server
import socketserver
import urllib.parse
import os
import tarfile
import shutil

class UploadHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def do_POST(self):
        if self.path == '/upload':
            content_length = int(self.headers['Content-Length'])
            
            # Read the file data
            boundary = self.headers['Content-Type'].split('boundary=')[1]
            data = self.rfile.read(content_length)
            
            # Simple file extraction (this is a quick hack)
            # Find the file content after the boundary headers
            file_start = data.find(b'\r\n\r\n') + 4
            file_end = data.rfind(b'\r\n--' + boundary.encode())
            file_data = data[file_start:file_end]
            
            # Save the uploaded file
            with open('uploaded-build.tar.gz', 'wb') as f:
                f.write(file_data)
            
            # Extract the tar.gz
            try:
                with tarfile.open('uploaded-build.tar.gz', 'r:gz') as tar:
                    tar.extractall('.')
                
                self.send_response(200)
                self.send_header('Content-Type', 'text/html')
                self.end_headers()
                self.wfile.write(b'<html><body><h1>Upload successful!</h1><p>.next directory extracted</p></body></html>')
            except Exception as e:
                self.send_response(500)
                self.send_header('Content-Type', 'text/html') 
                self.end_headers()
                self.wfile.write(f'<html><body><h1>Error: {str(e)}</h1></body></html>'.encode())
        else:
            self.send_response(404)
            self.end_headers()
    
    def do_GET(self):
        if self.path == '/':
            self.send_response(200)
            self.send_header('Content-Type', 'text/html')
            self.end_headers()
            html = '''
            <html>
            <body>
                <h1>CSS Build Upload</h1>
                <form action="/upload" method="post" enctype="multipart/form-data">
                    <input type="file" name="file" accept=".tar.gz">
                    <input type="submit" value="Upload .next build">
                </form>
            </body>
            </html>
            '''
            self.wfile.write(html.encode())
        else:
            super().do_GET()

PORT = 9999
with socketserver.TCPServer(("", PORT), UploadHTTPRequestHandler) as httpd:
    print(f"Upload server at http://localhost:{PORT}")
    print("Upload the next-build.tar.gz file through the web interface")
    httpd.serve_forever()