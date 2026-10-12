"""SOEC 录入工具本地启动器：起静态服务并自动打开浏览器。
端口固定 8000（草稿/记忆候选按 origin 存储，换端口会"丢"）。
端口被占用时判定为服务已在运行，直接打开页面。"""
import http.server
import os
import socketserver
import threading
import webbrowser

PORT = 8000
URL = f"http://localhost:{PORT}"

os.chdir(os.path.dirname(os.path.abspath(__file__)))


class Server(socketserver.ThreadingTCPServer):
    allow_reuse_address = True
    daemon_threads = True


def open_browser():
    try:
        webbrowser.open(URL)
    except Exception:
        pass  # 打不开就靠用户手动复制地址（WSL 无 wslview 时）


if __name__ == "__main__":
    handler = http.server.SimpleHTTPRequestHandler
    try:
        httpd = Server(("127.0.0.1", PORT), handler)
    except OSError:
        print(f"端口 {PORT} 已被占用——服务可能已在运行，直接打开页面")
        open_browser()
    else:
        print(f"SOEC 录入工具: {URL}")
        print("按 Ctrl+C 停止服务（关闭本窗口效果相同）")
        threading.Timer(0.5, open_browser).start()
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            pass
