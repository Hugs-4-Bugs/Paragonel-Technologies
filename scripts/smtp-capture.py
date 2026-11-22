#!/usr/bin/env python3
"""Minimal SMTP capture server for end-to-end email verification.

Listens on localhost:1025 (the dev-fallback Mailpit port the email service
uses when SMTP_HOST is unset). Captures ONE message's raw DATA payload to
the file given as argv[1], then exits. This is a verification helper, not a
production SMTP server — it implements only the minimum SMTP dialogue needed
for Nodemailer to deliver a message (EHLO/HELO, MAIL FROM, RCPT TO, DATA,
QUIT). Run in the background; the test script then triggers a send + reads
the captured file.
"""
import socket
import sys
import os

def main():
    out_path = sys.argv[1] if len(sys.argv) > 1 else '/tmp/captured-email.eml'
    host = '127.0.0.1'
    port = 1025

    srv = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    srv.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    srv.bind((host, port))
    srv.listen(1)
    srv.settimeout(30)
    print(f'[smtp-capture] listening on {host}:{port}, will capture 1 message to {out_path}', flush=True)

    try:
        conn, addr = srv.accept()
    except socket.timeout:
        print('[smtp-capture] timed out waiting for a connection', flush=True)
        return 1

    conn.settimeout(10)
    f = conn.makefile('rwb', buffering=0)

    def send(line):
        f.write(line.encode('utf-8') + b'\r\n')

    send('220 localhost SMTP capture ready')
    captured = b''
    try:
        while True:
            line = f.readline()
            if not line:
                break
            cmd = line.decode('utf-8', errors='replace').strip()
            upper = cmd.upper()
            if upper.startswith('EHLO') or upper.startswith('HELO'):
                send('250 localhost Hello')
            elif upper.startswith('MAIL FROM'):
                send('250 OK')
            elif upper.startswith('RCPT TO'):
                send('250 OK')
            elif upper == 'DATA':
                send('354 Start mail input; end with <CRLF>.<CRLF>')
                while True:
                    dline = f.readline()
                    if not dline:
                        break
                    if dline in (b'.\r\n', b'.\n'):
                        break
                    captured += dline
                send('250 OK Message accepted')
            elif upper == 'QUIT':
                send('221 Bye')
                break
            elif upper.startswith('RSET'):
                send('250 OK')
            elif upper.startswith('NOOP'):
                send('250 OK')
            else:
                send('250 OK')
    except socket.timeout:
        pass
    finally:
        f.close()
        conn.close()
        srv.close()

    if captured:
        with open(out_path, 'wb') as out:
            out.write(captured)
        print(f'[smtp-capture] captured {len(captured)} bytes to {out_path}', flush=True)
        return 0
    else:
        print('[smtp-capture] no DATA captured', flush=True)
        return 2

if __name__ == '__main__':
    sys.exit(main())
