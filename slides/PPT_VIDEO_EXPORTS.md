# PowerPoint video exports for Worked Solutions

Export each lesson deck from PowerPoint (**File → Export → Create a Video**) and save the MP4 **in the folder below** using the exact filename. Close PowerPoint before refreshing the dashboard.

**Automated export (Windows + PowerPoint installed):**
```powershell
cd dashboard
.\tools\export_ppt_video.ps1 `
  -Pptx "..\S3 MATH summer 2026\L01-02 More about Factorization\PPT\Pre S3 Maths L01-02 - More about Factorization (2025).pptx" `
  -OutMp4 "slides\factorization\l01-02-main-deck\l01-02-main.mp4"
```

| Topic dashboard | Folder | MP4 filename | Source `.pptx` | Status |
|-----------------|--------|--------------|----------------|--------|
| **Area & Volume** | `slides/area_volume/l07-main-deck/` | `l07-09-main.mp4` | `Pre S3 Maths L07-09 Area and Volume (2025).pptx` | ✅ ~570s |
| **Factorization (lecture)** | `slides/factorization/l01-02-main-deck/` | `l01-02-main.mp4` | `Pre S3 Maths L01-02 - More about Factorization (2025).pptx` | ✅ auto-exported ~248s |
| **Factorization (quiz)** | `slides/factorization/l01-02-quiz-deck/` | `l01-02-quiz-ans.mp4` | `Pre S3 Maths L01-02 - More about Factorization Quiz (ANS) james.pptx` | drop MP4 here |
| **Inequality** | `slides/inequality/l03-main-deck/` | `l03-main.mp4` | `Pre S3 Maths L03 - Inequality (2025).pptx` | ✅ re-exported ~215s |
| **Probability** | `slides/probability/l10-12-main-deck/` | `l10-12-main.mp4` | `Pre S3 Maths L10-12 Probability (2025).pptx` | ✅ ~354s |
| **Percentage** | `slides/percentage/l04-06-main-deck/` | `l04-06-main.mp4` | `Pre S3 Maths L04-06 - Percentage (2025).pptx` | ✅ ~458s |

### Optional extra decks (not wired yet)

| Folder | MP4 | Source |
|--------|-----|--------|
| `slides/inequality/l03-quiz-deck/` | `l03-quiz.mp4` | `Pre S3 Maths L03 Inequality Quiz (2025).pptx` |
| `slides/percentage/l04-main-deck/` | `l04-main.mp4` | L04 Percentages lesson only |
| `slides/percentage/l05-main-deck/` | `l05-main.mp4` | L05 Percentages lesson only |
| `slides/percentage/l06-main-deck/` | `l06-main.mp4` | L06 Percentages lesson only |

Viewer: `shared/ppt-deck-viewer.js` + `shared/ppt-deck-viewer.css` — each folder needs `index.html` with `data-ppt-title` and `data-ppt-video`. For cropped question clips, use `data-ppt-start` / `data-ppt-end` (seconds) or the generic `slides/factorization/ppt-clip/index.html?v=...&start=...&end=...` viewer.
