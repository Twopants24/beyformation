#!/usr/bin/env python3
import os
import secrets
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import parse_qs, urlparse


USERNAME = os.environ.get("BASIC_USER", "beyformation")
PASSWORD = os.environ.get("BASIC_PASS", "letitrip321")
ONE_TIME_TOKENS = set()


LOGIN_HTML = """<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>beyformation login</title>
    <style>
      body {
        margin: 0;
        min-height: 100vh;
        display: grid;
        place-items: center;
        font-family: system-ui, sans-serif;
        background: #f3efff;
        color: #1f1533;
      }
      form {
        width: min(92vw, 360px);
        padding: 1rem;
        border: 2px solid #1e1e24;
        background: #ffffff;
      }
      h1 { margin: 0 0 0.75rem; font-size: 1.2rem; }
      p { margin: 0 0 0.7rem; color: #4b3f71; font-size: 0.95rem; }
      label { display: block; margin: 0.5rem 0 0.25rem; font-weight: 600; }
      input {
        width: 100%;
        box-sizing: border-box;
        padding: 0.55rem;
        border: 2px solid #1e1e24;
      }
      button {
        margin-top: 0.75rem;
        width: 100%;
        padding: 0.6rem;
        border: 2px solid #1e1e24;
        background: #6e45d8;
        color: #fff;
        font-weight: 700;
        cursor: pointer;
      }
      .err { color: #9b1c1c; font-weight: 700; margin-bottom: 0.5rem; }
    </style>
  </head>
  <body>
    <form method="post" action="/">
      <h1>beyformation</h1>
      __ERROR__
      <p>Enter password to view the site. This is required on every refresh.</p>
      <label for="user">Username</label>
      <input id="user" name="user" autocomplete="username" />
      <label for="password">Password</label>
      <input id="password" name="password" type="password" autocomplete="current-password" />
      <button type="submit">Unlock</button>
    </form>
  </body>
</html>
"""


class AuthHandler(SimpleHTTPRequestHandler):
    def _send_html(self, html: str, status: int = 200) -> None:
        body = html.encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.send_header("Cache-Control", "no-store")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def _show_login(self, bad: bool = False) -> None:
        error = '<p class="err">Wrong username or password.</p>' if bad else ""
        page = LOGIN_HTML.replace("__ERROR__", error)
        self._send_html(page, status=401 if bad else 200)

    def _serve_index(self) -> None:
        with open("index.html", "rb") as fh:
            body = fh.read()
        self.send_response(200)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.send_header("Cache-Control", "no-store")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def _redirect(self, location: str) -> None:
        self.send_response(303)
        self.send_header("Location", location)
        self.send_header("Cache-Control", "no-store")
        self.end_headers()

    def do_GET(self):
        parsed = urlparse(self.path)
        path = parsed.path
        if path in ("/", "/index.html"):
            self._show_login()
            return
        if path == "/view":
            token = parse_qs(parsed.query).get("token", [""])[0]
            if token and token in ONE_TIME_TOKENS:
                ONE_TIME_TOKENS.remove(token)
                self._serve_index()
                return
            self._show_login(bad=True)
            return
        super().do_GET()

    def do_POST(self):
        path = urlparse(self.path).path
        if path != "/":
            self.send_error(404)
            return

        content_len = int(self.headers.get("Content-Length", "0"))
        raw = self.rfile.read(content_len).decode("utf-8", errors="replace")
        data = parse_qs(raw)
        user = (data.get("user", [""])[0]).strip()
        password = data.get("password", [""])[0]

        if user == USERNAME and password == PASSWORD:
            token = secrets.token_urlsafe(24)
            ONE_TIME_TOKENS.add(token)
            self._redirect(f"/view?token={token}")
            return

        self._show_login(bad=True)

    def do_HEAD(self):
        path = urlparse(self.path).path
        if path in ("/", "/index.html"):
            self.send_response(200)
            self.send_header("Content-Type", "text/html; charset=utf-8")
            self.send_header("Cache-Control", "no-store")
            self.end_headers()
            return
        super().do_HEAD()


def main() -> None:
    port = int(os.environ.get("PORT", "5501"))
    server = ThreadingHTTPServer(("0.0.0.0", port), AuthHandler)
    print(f"Serving password-protected site on http://localhost:{port}")
    print(f"Username: {USERNAME}")
    print(f"Password: {PASSWORD}")
    server.serve_forever()


if __name__ == "__main__":
    main()
