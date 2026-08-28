# Render L12 Probability worked-solution decks.  Run from dashboard/ :  .\render_prob_l12.ps1
$ErrorActionPreference = "Continue"
$F = "manim\probability\prob_solutions.py"
$nums = @(1..20)
$ok = 0; $fail = @()
foreach ($n in $nums) {
  $scene = "L12Q$n"; $deck = "probability\l12q$n-solution"
  & .\render.ps1 -SceneFile $F -SceneName $scene -Deck $deck -Quality h *>$null
  if ($LASTEXITCODE -eq 0) { "OK   $scene"; $ok++ } else { "FAIL $scene (exit $LASTEXITCODE)"; $fail += $scene }
}
"=== Prob L12: $ok ok, $($fail.Count) failed ==="
if ($fail.Count) { "FAILED: " + ($fail -join ", ") }
