# Render remaining worked-solution decks (11 questions). Run from dashboard/ .
$ErrorActionPreference = "Continue"
$src = "manim\area_volume\worked_remaining.py"
$jobs = @(
  @($src,"Qa2Solution","area_volume\qa2-solution"),
  @($src,"Qa5Solution","area_volume\qa5-solution"),
  @($src,"Qa16Solution","area_volume\qa16-solution"),
  @($src,"Qa24Solution","area_volume\qa24-solution"),
  @($src,"Qa25Solution","area_volume\qa25-solution"),
  @($src,"Qb5Solution","area_volume\qb5-solution"),
  @($src,"Qc8Solution","area_volume\qc8-solution"),
  @($src,"Qc10Solution","area_volume\qc10-solution"),
  @($src,"Qc12Solution","area_volume\qc12-solution"),
  @($src,"Qc17Solution","area_volume\qc17-solution"),
  @($src,"Qz1Solution","area_volume\qz1-solution")
)
$ok = 0; $fail = @()
foreach ($j in $jobs) {
  & .\render.ps1 -SceneFile $j[0] -SceneName $j[1] -Deck $j[2] -Quality h *>$null
  if ($LASTEXITCODE -eq 0) { "OK   $($j[1])"; $ok++ } else { "FAIL $($j[1]) (exit $LASTEXITCODE)"; $fail += @($j) }
}
"=== AV remaining: $ok ok, $($fail.Count) failed ==="
if ($fail.Count) {
  "Retrying $($fail.Count)..."
  $still = @()
  foreach ($j in $fail) {
    & .\render.ps1 -SceneFile $j[0] -SceneName $j[1] -Deck $j[2] -Quality h *>$null
    if ($LASTEXITCODE -eq 0) { "OK   $($j[1])" } else { "FAIL $($j[1])"; $still += $j[1] }
  }
  if ($still.Count) { "STILL FAILED: " + ($still -join ", ") } else { "All retries passed." }
}
