@echo off
set BASE=file://wsl.localhost/ncc/home/ncc_t/projects/add-typing-app/prototypes
if exist "%ProgramFiles%\Google\Chrome\Application\chrome.exe" (
  start "" "%ProgramFiles%\Google\Chrome\Application\chrome.exe" "%BASE%/index.html" "%BASE%/concept-a-chat.html" "%BASE%/concept-b-arcade.html" "%BASE%/concept-c-focus.html"
  exit /b 0
)
if exist "%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe" (
  start "" "%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe" "%BASE%/index.html" "%BASE%/concept-a-chat.html" "%BASE%/concept-b-arcade.html" "%BASE%/concept-c-focus.html"
  exit /b 0
)
if exist "%LOCALAPPDATA%\Google\Chrome\Application\chrome.exe" (
  start "" "%LOCALAPPDATA%\Google\Chrome\Application\chrome.exe" "%BASE%/index.html" "%BASE%/concept-a-chat.html" "%BASE%/concept-b-arcade.html" "%BASE%/concept-c-focus.html"
  exit /b 0
)
echo Chrome not found
exit /b 1
