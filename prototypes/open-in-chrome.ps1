$base = "file://wsl.localhost/ncc/home/ncc_t/projects/add-typing-app/prototypes"
$urls = @(
  "$base/index.html",
  "$base/concept-a-chat.html",
  "$base/concept-b-arcade.html",
  "$base/concept-c-focus.html"
)

$chromeCandidates = @(
  "$env:ProgramFiles\Google\Chrome\Application\chrome.exe",
  "${env:ProgramFiles(x86)}\Google\Chrome\Application\chrome.exe",
  "$env:LOCALAPPDATA\Google\Chrome\Application\chrome.exe"
)

$chrome = $chromeCandidates | Where-Object { Test-Path $_ } | Select-Object -First 1
if (-not $chrome) {
  Write-Error "Google Chrome not found."
  exit 1
}

Start-Process -FilePath $chrome -ArgumentList $urls
