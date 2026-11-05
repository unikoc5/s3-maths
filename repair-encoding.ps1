$ErrorActionPreference = 'Stop'
$root = 'C:\Users\tracy\Desktop\S3-unikoc5-homepage\topics\quadrilaterals'
$utf8 = [System.Text.UTF8Encoding]::new($false)

$dash  = [string][char]0x2014  # em dash
$ndash = [string][char]0x2013  # en dash
$dot   = [string][char]0x00B7
$line  = [string][char]0x2500
$times = [string][char]0x00D7
$larr  = [string][char]0x2190
$rarr  = [string][char]0x2192
$check = [string][char]0x2713
$perp  = [string][char]0x22A5
$ang   = [string][char]0x2220
$deg   = [string][char]0x00B0

$m80   = "?" + [char]0x0080   # became the box-drawing line
$mDot  = [string][char]0x7E5A # became the middle dot
$mEn   = "?" + [char]0xE626   # became the en dash
$mAng  = "?" + [char]0xEE4E   # became the angle sign
$mDeg  = [string][char]0x7C1E # became the degree sign

function Repair-File {
  param([string]$Path, [object[]]$Rules)

  $text = [System.IO.File]::ReadAllText($Path, [System.Text.Encoding]::UTF8)
  if ($text.Length -gt 0 -and $text[0] -eq [char]0xFEFF) { $text = $text.Substring(1) }

  foreach ($rule in $Rules) {
    if (-not $text.Contains($rule[0])) {
      Write-Host ("  MISS in {0}: {1}" -f (Split-Path $Path -Leaf), ($rule[0] -replace '[^\x20-\x7E]', '.'))
      continue
    }
    $text = $text.Replace($rule[0], $rule[1])
  }

  [System.IO.File]::WriteAllText($Path, $text, $utf8)

  $pairs = [regex]::Matches($text, '\?\?').Count
  $junk = [regex]::Matches($text, '[\u0080\u7E5A\uE626\uEE4E\u7C1E]').Count
  Write-Host ("{0}: leftover '??' = {1}, leftover mojibake = {2}" -f (Split-Path $Path -Leaf), $pairs, $junk)
}

Repair-File -Path (Join-Path $root 'quadrilaterals-game.js') -Rules @(
  @($m80, $line),
  @($mDot, $dot),
  @('JM29 Game 1 ??Identifying',                   "JM29 Game 1 $dash Identifying"),
  @('king will rage ??and the war begins',         "king will rage $dash and the war begins"),
  @('a 0??20 ? 0??00 box',                         "a 0${ndash}120 $times 0${ndash}100 box"),
  @('Point to her ??and do not make me angry',     "Point to her $dash and do not make me angry"),
  @('allows a trapezium ??I need both pairs',      "allows a trapezium $dash I need both pairs"),
  @('Guards ??take him!',                          "Guards $dash take him!"),
  @('as parallel ??only as equal',                 "as parallel $dash only as equal"),
  @('ch === "??) wait = 150;',                     "ch === `"$dash`") wait = 150;"),
  @('faded in ??a click during the cut',           "faded in $dash a click during the cut"),
  @('on each claimant ??" +',                      "on each claimant $dash `" +"),
  @('war begins ??unless you take the journey',    "war begins $dash unless you take the journey")
)

Repair-File -Path (Join-Path $root 'index.html') -Rules @(
  @($mDot, $dot),
  @($mEn, $ndash),
  @($mDeg, $deg),
  @('iframe.Reveal ??let clicks reach',            "iframe.Reveal $dash let clicks reach"),
  @('Drag any corner ??what shape is it?',         "Drag any corner $dash what shape is it?"),
  @('aria-label="Previous">??/button>',            "aria-label=`"Previous`">$larr</button>"),
  @('aria-label="Next">??/button>',                "aria-label=`"Next`">$rarr</button>"),
  @('<p class="hint">??= must be true',            "<p class=`"hint`">$check = must be true"),
  @('Pick a reason ??see it on a figure',          "Pick a reason $dash see it on a figure"),
  @('Identifying quadrilaterals ??story game',     "Identifying quadrilaterals $dash story game"),
  @('"Diags. ??and bisect ' + $mAng + 's"',        "`"Diags. $perp and bisect ${ang}s`""),
  @('"Four right ' + $mAng + 's"',                 "`"Four right ${ang}s`""),
  @('"Diags. ??45',                                "`"Diags. $rarr 45")
)
