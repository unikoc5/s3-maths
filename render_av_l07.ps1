# Render the L07 (prefix A) worked-solution decks. Run from dashboard/ .
$ErrorActionPreference = "Continue"
$f = "manim\area_volume\worked_l07.py"
$jobs = @(
  @("Qa3Solution","area_volume\qa3-solution"),
  @("Qa4Solution","area_volume\qa4-solution"),
  @("Qa6Solution","area_volume\qa6-solution"),
  @("Qa7Solution","area_volume\qa7-solution"),
  @("Qa8Solution","area_volume\qa8-solution"),
  @("Qa9Solution","area_volume\qa9-solution"),
  @("Qa10Solution","area_volume\qa10-solution"),
  @("Qa11Solution","area_volume\qa11-solution"),
  @("Qa12Solution","area_volume\qa12-solution"),
  @("Qa13Solution","area_volume\qa13-solution"),
  @("Qa14Solution","area_volume\qa14-solution"),
  @("Qa15Solution","area_volume\qa15-solution"),
  @("Qa17Solution","area_volume\qa17-solution"),
  @("Qa18Solution","area_volume\qa18-solution"),
  @("Qa20Solution","area_volume\qa20-solution"),
  @("Qa21Solution","area_volume\qa21-solution"),
  @("Qa22Solution","area_volume\qa22-solution"),
  @("Qa23Solution","area_volume\qa23-solution")
)
$ok = 0; $fail = @()
foreach ($j in $jobs) {
  & .\render.ps1 -SceneFile $f -SceneName $j[0] -Deck $j[1] -Quality h *>$null
  if ($LASTEXITCODE -eq 0) { "OK   $($j[0])"; $ok++ } else { "FAIL $($j[0]) (exit $LASTEXITCODE)"; $fail += $j[0] }
}
"=== AV L07: $ok ok, $($fail.Count) failed ==="
if ($fail.Count) { "FAILED: " + ($fail -join ", ") }
