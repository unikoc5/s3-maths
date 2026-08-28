# Render L11 Probability worked-solution decks.  Run from dashboard/ :  .\render_prob_l11.ps1
$ErrorActionPreference = "Continue"
$F = "manim\probability\prob_solutions.py"
$nums = @(1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16)
$ok = 0; $fail = @()
foreach ($n in $nums) {
  $scene = "L11Q$n"; $deck = "probability\l11q$n-solution"
  & .\render.ps1 -SceneFile $F -SceneName $scene -Deck $deck -Quality h *>$null
  if ($LASTEXITCODE -eq 0) { "OK   $scene"; $ok++ } else { "FAIL $scene (exit $LASTEXITCODE)"; $fail += $scene }
}
"=== Prob L11: $ok ok, $($fail.Count) failed ==="
if ($fail.Count) { "FAILED: " + ($fail -join ", ") }
