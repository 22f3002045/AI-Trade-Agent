import subprocess
import time
import os
import sys
import signal

def start_servers():
    # Get absolute paths
    base_dir = os.path.abspath("e:/Trading AI Agent")
    frontend_dir = os.path.join(base_dir, "frontend")
    
    print("Starting Backend Server...")
    backend_process = subprocess.Popen(
        [sys.executable, "-m", "src.main"],
        cwd=base_dir,
        shell=True
    )
    
    print("Starting Frontend Server...")
    frontend_process = subprocess.Popen(
        ["npm", "run", "dev"],
        cwd=frontend_dir,
        shell=True
    )
    
    print("\nBoth servers are starting...")
    print("Backend: http://localhost:8000")
    print("Frontend: http://localhost:5173")
    print("\nPress Ctrl+C to stop both servers.")
    
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\nStopping servers...")
        backend_process.terminate()
        frontend_process.terminate()
        sys.exit(0)

if __name__ == "__main__":
    start_servers()
