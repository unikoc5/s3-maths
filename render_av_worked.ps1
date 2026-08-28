# Render every built Area & Volume worked-solution deck (starter batch).
# Run from dashboard/ :  .\render_av_worked.ps1
$ErrorActionPreference = "Continue"

$jobs = @(
  @("manim\area_volume\worked_solutions.py", "Qa1Solution",  "area_volume\qa1-solution"),
  @("manim\area_volume\worked_solutions.py", "Qa19Solution", "area_volume\qa19-solution"),
  @("manim\area_volume\worked_solutions.py", "Qz2Solution",  "area_volume\qz2-solution"),
  @("manim\area_volume\worked_solutions.py", "Qz4Solution",  "area_volume\qz4-solution"),
  @("manim\area_volume\worked_solutions.py", "Qz6Solution",  "area_volume\qz6-solution"),
  @("manim\area_volume\worked_solutions.py", "Qc6Solution",  "area_volume\qc6-solution"),
  @("manim\area_volume\worked_solutions.py", "Qc11Solution", "area_volume\qc11-solution"),
  @("manim\area_volume\worked_solutions.py", "Qb21Solution", "area_volume\qb21-solution")
)

$ok = 0; $fail = @()
foreach ($j in $jobs) {
  & .\render.ps1 -SceneFile $j[0] -SceneName $j[1] -Deck $j[2] -Quality h *>$null
  if ($LASTEXITCODE -eq 0) { "OK   $($j[1])"; $ok++ } else { "FAIL $($j[1]) (exit $LASTEXITCODE)"; $fail += $j[1] }
}
"=== AV worked: $ok ok, $($fail.Count) failed ==="
if ($fail.Count) { "FAILED: " + ($fail -join ", ") }
