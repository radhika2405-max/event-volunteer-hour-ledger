@echo off
title ADIKALA LEDGER - Standalone Project Preview
echo =======================================================================
echo   ADIKALA LEDGER - School of Sciences (CHRIST Delhi NCR)
echo   Volunteer Hour Ledger ^& Certificate Eligibility System
echo =======================================================================
echo.
echo Launching standalone web preview...
echo No database or external services required.
echo.
echo The application will open automatically in your browser at:
echo http://localhost:8080/
echo.
echo [Default Test Accounts]
echo  - Admin:       admin@christuniversity.in       / Admin@123
echo  - Approver:    faculty@christuniversity.in     / Faculty@123
echo  - Coordinator: coordinator@christuniversity.in / Coord@123
echo  - Volunteer:   student.a@christuniversity.in   / Student@123
echo.
echo Press Ctrl+C in this terminal when finished.
echo =======================================================================
echo.

start http://localhost:8080/
python -m http.server 8080 --directory frontend/dist
pause
