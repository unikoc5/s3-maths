# Render the L09 (prefix C) + extra Quiz worked-solution decks. Run from dashboard/ .
$ErrorActionPreference = "Continue"
$l9 = "manim\area_volume\worked_l09.py"
$qz = "manim\area_volume\worked_quiz.py"
$jobs = @(
  @($l9,"Qc1Solution","area_volume\qc1-solution"),
  @("manim\area_volume\worked_ppt_l09.py","Qc2Solution","area_volume\qc2-solution"),
  @($l9,"Qc3Solution","area_volume\qc3-solution"),
  @("manim\area_volume\worked_ppt_l09.py","Qc4Solution","area_volume\qc4-solution"),
  @($l9,"Qc5Solution","area_volume\qc5-solution"),
  @($l9,"Qc7Solution","area_volume\qc7-solution"),
  @($l9,"Qc9Solution","area_volume\qc9-solution"),
  @($l9,"Qc13Solution","area_volume\qc13-solution"),
  @($l9,"Qc14Solution","area_volume\qc14-solution"),
  @($l9,"Qc15Solution","area_volume\qc15-solution"),
  @($l9,"Qc16Solution","area_volume\qc16-solution"),
  @($qz,"Qz3Solution","area_volume\qz3-solution"),
  @($qz,"Qz5Solution","area_volume\qz5-solution"),
  @($qz,"Qz7Solution","area_volume\qz7-solution"),
  @($qz,"Qz8Solution","area_volume\qz8-solution")
)
$ok = 0; $fail = @()
foreach ($j in $jobs) {
  & .\render.ps1 -SceneFile $j[0] -SceneName $j[1] -Deck $j[2] -Quality h *>$null
  if ($LASTEXITCODE -eq 0) { "OK   $($j[1])"; $ok++ } else { "FAIL $($j[1]) (exit $LASTEXITCODE)"; $fail += @($j) }
}
"=== AV L09+Quiz: $ok ok, $($fail.Count) failed ==="
# auto-retry failures once (MiKTeX can intermittently hiccup)
if ($fail.Count) {
  "Retrying $($fail.Count)..."
  $still = @()
  foreach ($j in $fail) {
    & .\render.ps1 -SceneFile $j[0] -SceneName $j[1] -Deck $j[2] -Quality h *>$null
    if ($LASTEXITCODE -eq 0) { "OK   $($j[1])" } else { "FAIL $($j[1])"; $still += $j[1] }
  }
  if ($still.Count) { "STILL FAILED: " + ($still -join ", ") } else { "All retries passed." }
}
