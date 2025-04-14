@echo off
echo Running KB Star Bank Raw HTML Extractor...
echo.

REM Check if iSAS30Tool is available
if not exist "%~dp0..\iSAS30Tool.exe" (
    echo Error: iSAS30Tool.exe not found in parent directory.
    echo Please make sure this script is in the correct location.
    goto :end
)

REM Run the script using iSAS30Tool
echo Executing get_raw_html.js...
cd %~dp0
..\iSAS30Tool.exe -script get_raw_html.js

echo.
echo If successful, the raw HTML should be saved in kbstar_raw_html.txt
echo or kbstar_raw_html_from_result.txt in the current directory.
echo.

:end
pause