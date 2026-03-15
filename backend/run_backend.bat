@echo off
REM Set OPENSSL_CONF before Python starts (fixes MongoDB Atlas SSL handshake on Windows)
cd /d "%~dp0"
set OPENSSL_CONF=%CD%\openssl.cnf
echo Using OPENSSL_CONF=%OPENSSL_CONF%
uvicorn src.main:app --reload --host 127.0.0.1 --port 8000
