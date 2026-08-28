# Render the L08 (prefix B) worked-solution decks. Run from dashboard/ .
$ErrorActionPreference = "Continue"
$fPpt = "manim\area_volume\worked_ppt_l08.py"
$pptJobs = @(
  @("Qb7Solution","area_volume\qb7-solution"),
  @("Qb11Solution","area_volume\qb11-solution")
)
$f = "manim\area_volume\worked_l08.py"
$jobs = @(
  @("Qb1Solution","area_volume\qb1-solution"),
  @("Qb2Solution","area_volume\qb2-solution"),
  @("Qb3Solution","area_volume\qb3-solution"),
  @("Qb4Solution","area_volume\qb4-solution"),
  @("Qb6Solution","area_volume\qb6-solution"),
  @("Qb8Solution","area_volume\qb8-solution"),
  @("Qb9Solution","area_volume\qb9-solution"),
  @("Qb10Solution","area_volume\qb10-solution"),
  @("Qb12Solution","area_volume\qb12-solution"),
  @("Qb13Solution","area_volume\qb13-solution"),
  @("Qb14Solution","area_volume\qb14-solution"),
  @("Qb15Solution","area_volume\qb15-solution"),
  @("Qb16Solution","area_volume\qb16-solution"),
  @("Qb17Solution","area_volume\qb17-solution"),
  @("Qb18Solution","area_volume\qb18-solution"),
  @("Qb19Solution","area_volume\qb19-solution"),
  @("Qb20Solution","area_volume\qb20-solution"),
  @("Qb22Solution","area_volume\qb22-solution"),
  @("Qb23Solution","area_volume\qb23-solution")
)
$ok = 0; $fail = @()
foreach ($j in $pptJobs) {
  & .\render.ps1 -SceneFile $fPpt -SceneName $j[0] -Deck $j[1] -Quality h *>$null
  if ($LASTEXITCODE -eq 0) { "OK   $($j[0]) (ppt)"; $ok++ } else { "FAIL $($j[0]) (ppt, exit $LASTEXITCODE)"; $fail += $j[0] }
}
foreach ($j in $jobs) {
  & .\render.ps1 -SceneFile $f -SceneName $j[0] -Deck $j[1] -Quality h *>$null
  if ($LASTEXITCODE -eq 0) { "OK   $($j[0])"; $ok++ } else { "FAIL $($j[0]) (exit $LASTEXITCODE)"; $fail += $j[0] }
}
"=== AV L08: $ok ok, $($fail.Count) failed ==="
if ($fail.Count) { "FAILED: " + ($fail -join ", ") }
