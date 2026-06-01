import os, http.server

os.chdir('/Users/hanaproject/Documents/personal-website')

with http.server.HTTPServer(('', 3456), http.server.SimpleHTTPRequestHandler) as httpd:
    httpd.serve_forever()
