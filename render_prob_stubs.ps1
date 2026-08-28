# Render the remaining Probability worked-solution decks (geometric / chart / EV).
# Superseded by render_prob_all.ps1 — kept for re-rendering this subset only.
$ErrorActionPreference = "Continue"
$F = "manim\probability\prob_solutions.py"
$scenes = @(
  "L10Q14","L10Q16","L10Q17","L10Q18","L10Q19",
  "L10Q20","L10Q21","L10Q22","L10Q23","L10Q24","L10Q25",
  "L11Q8",
  "L12Q7","L12Q8","L12Q13","L12Q14","L12Q19","L12Q20"
)
$ok = 0; $fail = @()
foreach ($scene in $scenes) {
  $deck = "probability\" + $scene.ToLower() + "-solution"
  & .\render.ps1 -SceneFile $F -SceneName $scene -Deck $deck -Quality h *>$null
  if ($LASTEXITCODE -eq 0) { "OK   $scene"; $ok++ } else { "FAIL $scene (exit $LASTEXITCODE)"; $fail += $scene }
}
"=== Prob stubs: $ok ok, $($fail.Count) failed ==="
if ($fail.Count) { "FAILED: " + ($fail -join ", ") }
