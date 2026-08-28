r"""Worked-solution decks (Probability) — one navigable slide per equation line.

The MAIN slide panel stays clean: a centred chain of equations that grows one
line per ``next_slide()`` (mirrors the Area & Volume ``AVSolution``). The tree
diagram / table / figure for each question lives in the HTML sub-panel of the
Worked-Solutions tab, so the deck itself only carries the probability algebra:

    P = favourable / total  ->  substitute the counts  ->  simplify  ->  boxed answer

Colour convention (shared with the concept decks, so the eye can follow):
    favourable outcomes (numerator)   -> amber  (FAV)
    total outcomes      (denominator) -> green  (TOTAL)

Render (from dashboard/):
    .\render.ps1 -SceneFile manim\probability\prob_solutions.py -SceneName <Scene> -Deck probability\<deck> -Quality h
"""
from __future__ import annotations

import sys
import pathlib

from manim import *
from manim_slides import Slide

sys.path.append(str(pathlib.Path(__file__).resolve().parent))
from prob_common import BG, INK, GOLD, FAV, TOTAL, HEAD, TAIL  # noqa: E402


def title_tex(s: str) -> VGroup:
    t = Tex(s, font_size=44, color=INK).to_edge(UP, buff=0.55)
    accent = Line(LEFT, RIGHT, color=GOLD, stroke_width=3)
    accent.set_width(max(t.width + 0.6, 1.5)).next_to(t, DOWN, buff=0.16)
    return VGroup(t, accent)


def boxed(mob, color=FAV, buff=0.18):
    return SurroundingRectangle(mob, color=color, buff=buff, corner_radius=0.08, stroke_width=3)


class ProbSolution(Slide):
    """A clean, centred chain of equation lines — one slide per line.

    Subclasses set:
        title        : deck heading
        lines        : list of tex strings; line 0 is the problem statement.
                       Lines starting with "=" are left-aligned to the anchor.
        cm           : tex_to_color_map applied to every line
        box_indices  : indices of lines that get a result box
        note         : optional closing tex (e.g. an answer in words)
        scale, buff  : layout tweaks
    """

    title = ""
    lines: list[str] = []
    cm: dict = {}
    box_indices: tuple = ()
    note = None
    note_color = TOTAL
    scale = 1.0
    buff = 0.42

    def construct(self):
        self.camera.background_color = BG
        head = title_tex(self.title)

        max_w = config.frame_width - 1.4
        mobs = []
        for tex in self.lines:
            if tex.startswith("="):
                mo = MathTex("=", tex[1:], tex_to_color_map=self.cm)
            else:
                mo = MathTex(tex, tex_to_color_map=self.cm)
            mo.scale(self.scale)
            if mo.width > max_w:
                mo.scale(max_w / mo.width)
            mobs.append(mo)

        stack = VGroup(*mobs).arrange(DOWN, aligned_edge=LEFT, buff=self.buff)

        note_mob = None
        if self.note:
            note_mob = Tex(self.note, color=self.note_color, font_size=36)
            if note_mob.width > max_w:
                note_mob.scale(max_w / note_mob.width)
            note_mob.next_to(stack, DOWN, buff=0.45)

        content = VGroup(stack, *([note_mob] if note_mob is not None else []))

        avail_top = head.get_bottom()[1] - 0.4
        avail_bottom = -config.frame_height / 2 + 0.45
        avail_h = max(avail_top - avail_bottom, 0.1)
        sf = min(1.0, avail_h / content.height, max_w / content.width)
        if sf < 1.0:
            content.scale(sf)
        content.next_to(head, DOWN, buff=0.4)
        if content.get_bottom()[1] < avail_bottom:
            content.shift(UP * (avail_bottom - content.get_bottom()[1]))

        self.play(Write(head[0]), GrowFromCenter(head[1]))
        for i, mo in enumerate(mobs):
            self.play(FadeIn(mo, shift=0.15 * UP))
            if i in self.box_indices:
                self.play(Create(boxed(mo)))
            self.wait(0.1)
            self.next_slide()

        if note_mob is not None:
            self.play(FadeIn(note_mob, shift=0.15 * UP))
            self.wait(0.1)
            self.next_slide()


# Colour the favourable count amber and the total count green wherever they
# appear in a deck. Tokens are chosen per scene to be unambiguous substrings.
def cmap(fav_tokens, tot_tokens):
    cm = {}
    for t in fav_tokens:
        cm[t] = FAV
    for t in tot_tokens:
        cm[t] = TOTAL
    return cm


# ════════════════════════════════ L10 — Probability I ════════════════════════════════

class L10Q1(ProbSolution):
    title = r"L10 Q1 \quad A letter chosen at random"
    lines = [
        r"\text{45-letter word, } 9 \text{ of the letters are 'O'}",
        r"P(\text{O})=\frac{\text{number of O's}}{\text{total letters}}",
        r"=\frac{9}{45}",
        r"=\frac{1}{5}",
    ]
    cm = cmap(["9", r"\text{number of O's}"], ["45", r"\text{total letters}"])
    box_indices = (3,)


class L10Q2(ProbSolution):
    title = r"L10 Q2 \quad A letter from 'WONDERLAND'"
    lines = [
        r"\text{'WONDERLAND' has } 10 \text{ letters}",
        r"\textbf{(a)}\;\; P(\text{D})=\frac{2}{10}=\frac{1}{5}\quad(\text{two D's})",
        r"\textbf{(b)}\;\; \text{vowels: O, E, A } \Rightarrow 3",
        r"P(\text{vowel})=\frac{3}{10}",
    ]
    cm = cmap(["2", "3"], ["10"])
    box_indices = (1, 3)


class L10Q3(ProbSolution):
    title = r"L10 Q3 \quad A letter from 'MATHEMATICS'"
    lines = [
        r"\text{'MATHEMATICS' has } 11 \text{ letters}",
        r"\textbf{(a)}\;\; P(\text{T})=\frac{2}{11}\quad(\text{two T's})",
        r"\textbf{(b)}\;\; \text{there is no 'R'}",
        r"P(\text{R})=\frac{0}{11}=0",
    ]
    cm = cmap(["2", "0"], ["11"])
    box_indices = (1, 3)


class L10Q4(ProbSolution):
    title = r"L10 Q4 \quad A dice is thrown"
    lines = [
        r"\text{Sample space: } \{1,2,3,4,5,6\}\Rightarrow 6 \text{ outcomes}",
        r"\textbf{(a)}\;\; P(2\text{ or }5)=\frac{2}{6}=\frac{1}{3}",
        r"\textbf{(b)}\;\; \text{even}=\{2,4,6\}\Rightarrow 3",
        r"P(\text{even})=\frac{3}{6}=\frac{1}{2}",
    ]
    cm = cmap(["2", "3"], ["6"])
    box_indices = (1, 3)


class L10Q5(ProbSolution):
    title = r"L10 Q5 \quad A dice is thrown"
    lines = [
        r"\text{6 equally likely outcomes}",
        r"\textbf{(a)}\;\; >3:\{4,5,6\}\Rightarrow P=\frac{3}{6}=\frac{1}{2}",
        r"\textbf{(b)}\;\; =8:\text{ impossible}\Rightarrow P=\frac{0}{6}=0",
        r"\textbf{(c)}\;\; <7:\text{ certain}\Rightarrow P=\frac{6}{6}=1",
    ]
    cm = cmap(["3", "0"], ["6"])
    box_indices = (1, 2, 3)


class L10Q6(ProbSolution):
    title = r"L10 Q6 \quad A dice is thrown"
    lines = [
        r"\text{6 equally likely outcomes}",
        r"\textbf{(a)}\;\;\text{even \& } <4:\{2\}\Rightarrow P=\frac{1}{6}",
        r"\textbf{(b)}\;\;\text{even or } <4:\{1,2,3,4,6\}\Rightarrow 5",
        r"P=\frac{5}{6}",
    ]
    cm = cmap(["1", "5"], ["6"])
    box_indices = (1, 3)


class L10Q7(ProbSolution):
    title = r"L10 Q7 \quad Integer from 1 to 30 inclusive"
    lines = [
        r"\text{Total} = 30 \text{ integers}",
        r"\textbf{(a)}\;\;\text{multiples of }6:\{6,12,18,24,30\}\Rightarrow 5",
        r"P=\frac{5}{30}=\frac{1}{6}",
        r"\textbf{(b)}\;\;2\text{ to }22\text{ inclusive}\Rightarrow 21",
        r"P=\frac{21}{30}=\frac{7}{10}",
    ]
    cm = cmap(["5", "21"], ["30"])
    box_indices = (2, 4)


class L10Q8(ProbSolution):
    title = r"L10 Q8 \quad A positive 2-digit integer"
    lines = [
        r"\text{2-digit integers }10\text{ to }99\Rightarrow 90",
        r"\textbf{(a)}\;\;\text{divisible by }3\Rightarrow 30:\;P=\frac{30}{90}=\frac{1}{3}",
        r"\textbf{(b)}\;\;\text{divisible by }5\Rightarrow 18:\;P=\frac{18}{90}=\frac{1}{5}",
        r"\textbf{(c)}\;\;\text{divisible by }15\Rightarrow 6:\;P=\frac{6}{90}=\frac{1}{15}",
    ]
    cm = cmap(["30", "18", "6"], ["90"])
    box_indices = (1, 2, 3)


class L10Q9(ProbSolution):
    title = r"L10 Q9 \quad A card from 52 playing cards"
    lines = [
        r"\text{Total} = 52 \text{ cards}",
        r"\textbf{(a)}\;\;\text{four J's}\Rightarrow P(\text{J})=\frac{4}{52}=\frac{1}{13}",
        r"\textbf{(b)}\;\;\text{one Ace of diamonds}",
        r"P=\frac{1}{52}",
    ]
    cm = cmap(["4", "1"], ["52"])
    box_indices = (1, 3)


class L10Q10(ProbSolution):
    title = r"L10 Q10 \quad A card from 52 playing cards"
    lines = [
        r"\text{Total} = 52 \text{ cards}",
        r"\textbf{(a)}\;\;\text{Ace or 8}=4+4=8:\;P=\frac{8}{52}=\frac{2}{13}",
        r"\textbf{(b)}\;\;\text{black face cards}=6:\;P=\frac{6}{52}=\frac{3}{26}",
        r"\textbf{(c)}\;\;\text{diamond or K}=13+4-1=16",
        r"P=\frac{16}{52}=\frac{4}{13}",
    ]
    cm = cmap(["8", "6", "16"], ["52"])
    box_indices = (1, 2, 4)


class L10Q11(ProbSolution):
    title = r"L10 Q11 \quad A card from 52 playing cards"
    lines = [
        r"\text{Total} = 52 \text{ cards}",
        r"\textbf{(a)}\;\;\text{Ace or face}=4+12=16:\;P=\frac{16}{52}=\frac{4}{13}",
        r"\textbf{(b)}\;\;\text{spade or K}=13+4-1=16",
        r"\text{not (spade or K)}=52-16=36",
        r"P=\frac{36}{52}=\frac{9}{13}",
    ]
    cm = cmap(["16", "36"], ["52"])
    box_indices = (1, 4)


class L10Q12(ProbSolution):
    title = r"L10 Q12 \quad Find the value of $k$"
    lines = [
        r"k \text{ green beans, } 8 \text{ red beans}",
        r"P(\text{red})=\frac{8}{k+8}=\frac{2}{7}",
        r"7\times 8 = 2(k+8)",
        r"56 = 2k+16",
        r"k = 20",
    ]
    cm = cmap(["8"], ["k+8"])
    box_indices = (4,)


class L10Q13(ProbSolution):
    title = r"L10 Q13 \quad Find the value of $n$"
    lines = [
        r"33 \text{ male, } n \text{ female staff}",
        r"P(\text{female})=\frac{n}{33+n}=\frac{6}{17}",
        r"17n = 6(33+n)",
        r"17n = 198 + 6n",
        r"11n = 198 \Rightarrow n = 18",
    ]
    box_indices = (4,)


class L10Q15(ProbSolution):
    title = r"L10 Q15 \quad Cartons of drinks"
    lines = [
        r"\text{apple}=a,\;\text{lemon}=a+20,\;\text{orange}=\tfrac{a+20}{2}",
        r"P(\text{orange})=\frac{(a+20)/2}{\,2a+20+(a+20)/2\,}=\frac{2}{9}",
        r"\frac{a+20}{5a+60}=\frac{2}{9}",
        r"9(a+20)=2(5a+60)",
        r"9a+180=10a+120 \Rightarrow a=60",
        r"\text{lemon tea}=a+20=80",
    ]
    box_indices = (5,)
    note = r"There are $80$ cartons of lemon tea."


# ════════════════════════════════ L11 — Probability II (tree & table) ════════════════════════════════

class L11Q1(ProbSolution):
    title = r"L11 Q1 \quad Toss a fair coin twice"
    lines = [
        r"\text{Outcomes: HH, HT, TH, TT}\Rightarrow 4",
        r"P(\text{two tails})=P(\text{TT})",
        r"=\frac{1}{4}",
    ]
    cm = cmap(["1"], ["4"])
    box_indices = (2,)


class L11Q2(ProbSolution):
    title = r"L11 Q2 \quad Two true-or-false questions"
    lines = [
        r"\text{Correct answers: F, T}",
        r"\text{4 equally likely guesses: TT, TF, FT, FF}",
        r"\text{exactly one correct: TT, FF}\Rightarrow 2",
        r"P=\frac{2}{4}=\frac{1}{2}",
    ]
    box_indices = (3,)


class L11Q3(ProbSolution):
    title = r"L11 Q3 \quad Two children"
    lines = [
        r"\text{Outcomes: BB, BG, GB, GG}\Rightarrow 4",
        r"\textbf{(i)}\;\; P(\text{two daughters})=P(\text{GG})=\frac{1}{4}",
        r"\textbf{(ii)}\;\; \text{one daughter: BG, GB}\Rightarrow 2",
        r"P=\frac{2}{4}=\frac{1}{2}",
    ]
    box_indices = (1, 3)


class L11Q4(ProbSolution):
    title = r"L11 Q4 \quad True/false + multiple choice"
    lines = [
        r"P(\text{T/F correct})=\tfrac12,\;\; P(\text{MC correct})=\tfrac14",
        r"\textbf{(i)}\;\; P(\text{both correct})=\tfrac12\times\tfrac14=\frac{1}{8}",
        r"\textbf{(ii)}\;\; P(\text{both wrong})=\tfrac12\times\tfrac34=\frac{3}{8}",
    ]
    box_indices = (1, 2)


class L11Q5(ProbSolution):
    title = r"L11 Q5 \quad A coin and a tetrahedral dice"
    lines = [
        r"\text{coin }(2)\times\text{dice }(4)=8\text{ outcomes}",
        r"\textbf{(i)}\;\; P(\text{H and }3)=\frac{1}{8}",
        r"\textbf{(ii)}\;\; \text{tail \& prime }(2,3)\Rightarrow 2",
        r"P=\frac{2}{8}=\frac{1}{4}",
    ]
    box_indices = (1, 3)


class L11Q6(ProbSolution):
    title = r"L11 Q6 \quad Two dice"
    lines = [
        r"\text{Two dice}\Rightarrow 6\times 6=36\text{ outcomes}",
        r"\textbf{(i)}\;\; \text{difference}=3\Rightarrow 6:\;P=\frac{6}{36}=\frac{1}{6}",
        r"\textbf{(ii)}\;\; \text{sum is a multiple of }3\Rightarrow 12",
        r"P=\frac{12}{36}=\frac{1}{3}",
    ]
    box_indices = (1, 3)


class L11Q7(ProbSolution):
    title = r"L11 Q7 \quad A 2-digit number from 1, 2, 4"
    lines = [
        r"\text{2-digit numbers (repeats allowed)}\Rightarrow 9",
        r"\textbf{(i)}\;\; \text{multiples of }3:\{12,21,24,42\}\Rightarrow 4",
        r"P=\frac{4}{9}",
        r"\textbf{(ii)}\;\; \text{divisible by }4:\{12,24,44\}\Rightarrow 3",
        r"P=\frac{3}{9}=\frac{1}{3}",
    ]
    box_indices = (2, 4)


class L11Q9(ProbSolution):
    title = r"L11 Q9 \quad Draw 2 socks (no replacement)"
    lines = [
        r"\text{2 white, 2 black, 2 red; draw 2 of 6}",
        r"\text{total pairs}=\binom{6}{2}=15",
        r"\textbf{(i)}\;\; \text{same colour}\Rightarrow 3:\;P=\frac{3}{15}=\frac{1}{5}",
        r"\textbf{(ii)}\;\; \text{no black}=\binom{4}{2}=6",
        r"P(\text{at least one black})=1-\frac{6}{15}=\frac{3}{5}",
    ]
    box_indices = (2, 4)


class L11Q10(ProbSolution):
    title = r"L11 Q10 \quad Draw 2 marbles"
    lines = [
        r"\text{1G, 1B, 2R; draw 2 successively}",
        r"\text{total}=4\times 3=12\text{ ordered outcomes}",
        r"\text{same colour: only RR}=2\times 1=2",
        r"\text{different colours}=12-2=10",
        r"P=\frac{10}{12}=\frac{5}{6}",
    ]
    box_indices = (4,)


class L11Q11(ProbSolution):
    title = r"L11 Q11 \quad Choose 2 from a tennis class"
    lines = [
        r"\text{3 men, 2 women; choose 2 of 5}",
        r"\text{total}=\binom{5}{2}=10",
        r"\textbf{(i)}\;\; \text{2 men}=\binom{3}{2}=3:\;P=\frac{3}{10}",
        r"\textbf{(ii)}\;\; \text{1 man \& 1 woman}=3\times 2=6",
        r"P=\frac{6}{10}=\frac{3}{5}",
    ]
    box_indices = (2, 4)


class L11Q12(ProbSolution):
    title = r"L11 Q12 \quad A 2-digit number from 3, 7, 8"
    lines = [
        r"\text{No repeat: }6\text{ numbers}",
        r"\text{odd}\Rightarrow\text{unit digit }3\text{ or }7",
        r"\{37,73,83,87\}\Rightarrow 4",
        r"P=\frac{4}{6}=\frac{2}{3}",
    ]
    box_indices = (3,)


class L11Q13(ProbSolution):
    title = r"L11 Q13 \quad Take out 2 notes"
    lines = [
        r"\text{Take 2 of }\$10,\$20,\$50,\$100:\;\binom{4}{2}=6",
        r"\text{sums}\ge\$70:\;\{70,110,120,150\}\Rightarrow 4",
        r"P=\frac{4}{6}=\frac{2}{3}",
    ]
    box_indices = (2,)


class L11Q14(ProbSolution):
    title = r"L11 Q14 \quad Four gateways"
    lines = [
        r"\text{Enter 1 of 4, leave a different one}:\;4\times 3=12",
        r"\text{not through D: enter}\in\{A,B,C\},\ \text{leave}\ne D",
        r"3\times 2=6",
        r"P=\frac{6}{12}=\frac{1}{2}",
    ]
    box_indices = (3,)


class L11Q15(ProbSolution):
    title = r"L11 Q15 \quad Arrange 6, 5, 1"
    lines = [
        r"\text{Arrange }6,5,1:\;3!=6\text{ numbers}",
        r"\text{multiple of 5}\Rightarrow\text{ends in }5:\{615,165\}\Rightarrow 2",
        r"P=\frac{2}{6}=\frac{1}{3}",
    ]
    box_indices = (2,)


class L11Q16(ProbSolution):
    title = r"L11 Q16 \quad A ball moved between bags"
    lines = [
        r"\text{Bag A: 1G, 2Y, 1R }(4);\quad\text{Bag B: 2G, 1Y }(3)",
        r"\textbf{(a)}\;\; P(X\text{ not yellow})=\frac{2}{4}=\frac{1}{2}",
        r"\textbf{(b)(i)}\;\; X\text{ yellow}\Rightarrow B\text{ has no red}:\;P(Y\text{ red})=0",
        r"\textbf{(b)(ii)}\;\; Y\text{ red needs }X=R",
        r"P=\frac{1}{4}\times\frac{1}{4}=\frac{1}{16}",
    ]
    box_indices = (1, 2, 4)


# ════════════════════════════════ L12 — Probability III (expected value) ════════════════════════════════

class L12Q1(ProbSolution):
    title = r"L12 Q1 \quad Expected value of a note"
    lines = [
        r"P(\$10)=\tfrac14,\;P(\$20)=\tfrac14,\;P(\$50)=\tfrac12",
        r"E=\sum x_i\,P(x_i)",
        r"=10(\tfrac14)+20(\tfrac14)+50(\tfrac12)",
        r"=2.5+5+25=\$32.5",
    ]
    box_indices = (3,)


class L12Q2(ProbSolution):
    title = r"L12 Q2 \quad Expected mark"
    lines = [
        r"P(10)=20\%,\;P(20)=35\%,\;P(30)=45\%",
        r"E=10(0.2)+20(0.35)+30(0.45)",
        r"=2+7+13.5=22.5",
    ]
    box_indices = (2,)


class L12Q3(ProbSolution):
    title = r"L12 Q3 \quad Expected mark"
    lines = [
        r"P(50)=80\%,\;P(100)=15\%,\;P(800)=5\%",
        r"E=50(0.8)+100(0.15)+800(0.05)",
        r"=40+15+40=95",
    ]
    box_indices = (2,)


class L12Q4(ProbSolution):
    title = r"L12 Q4 \quad Expected award"
    lines = [
        r"\$3000,\$1000,\$500\text{ with }0.1,0.2,0.3",
        r"E=3000(0.1)+1000(0.2)+500(0.3)",
        r"=300+200+150=\$650",
    ]
    box_indices = (2,)


class L12Q5(ProbSolution):
    title = r"L12 Q5 \quad Note drawn from a wallet"
    lines = [
        r"\text{2}\times\$10,\;5\times\$20,\;3\times\$100\;(10\text{ notes})",
        r"\textbf{(a)}\;\; P(\$10)=\frac{2}{10}=\frac{1}{5}",
        r"\textbf{(b)}\;\; E=10(\tfrac{2}{10})+20(\tfrac{5}{10})+100(\tfrac{3}{10})",
        r"=2+10+30=\$42",
    ]
    box_indices = (1, 3)


class L12Q6(ProbSolution):
    title = r"L12 Q6 \quad Expected points (marbles)"
    lines = [
        r"\text{Blue }+12,\;\text{Red }-18,\;\text{Green }+9\;(\text{each }\tfrac13)",
        r"E=\tfrac13(12)+\tfrac13(-18)+\tfrac13(9)",
        r"=\frac{12-18+9}{3}=\frac{3}{3}=1",
    ]
    box_indices = (2,)


class L12Q9(ProbSolution):
    title = r"L12 Q9 \quad Is the lucky draw worth it?"
    lines = [
        r"\text{Fee }\$200;\;P(\$50)=70\%,P(\$150)=20\%,P(\$1000)=10\%",
        r"E=50(0.7)+150(0.2)+1000(0.1)",
        r"=35+30+100=\$165",
        r"\$165<\$200\Rightarrow\text{not worth playing}",
    ]
    box_indices = (2,)
    note = r"Expected return \$165 is below the \$200 fee."


class L12Q10(ProbSolution):
    title = r"L12 Q10 \quad Buy travel insurance?"
    lines = [
        r"\text{Without insurance, expected medical loss}",
        r"=300(0.2)+1000(0.1)=60+100=\$160",
        r"\$160<\$200\text{ (insurance)}",
        r"\Rightarrow\text{she should NOT buy it}",
    ]
    box_indices = (1,)
    note = r"Expected loss \$160 $<$ \$200 premium."


class L12Q11(ProbSolution):
    title = r"L12 Q11 \quad Lucky-draw tickets"
    lines = [
        r"50000\text{ tickets};\;1(\$10^5),1(\$5\!\times\!10^4),3(\$10^4),5(\$10^3)",
        r"\textbf{(a)}\;\; E=\frac{100000+50000+30000+5000}{50000}",
        r"=\frac{185000}{50000}=\$3.7",
        r"\textbf{(b)}\;\; \$20>\$3.7\Rightarrow\text{a loss of }\$16.3\text{ on average}",
    ]
    box_indices = (2,)


class L12Q12(ProbSolution):
    title = r"L12 Q12 \quad Numbered-ball game"
    lines = [
        r"5\text{ winning numbers out of }50:\;P=\tfrac{5}{50}=0.1",
        r"\textbf{(a)}\;\; E=300\times 0.1=\$30",
        r"\textbf{(b)}\;\; \text{cost }\$40>\$30\Rightarrow\text{not favourable}",
    ]
    box_indices = (1,)
    note = r"Average gain \$30 $<$ \$40 cost."


class L12Q15(ProbSolution):
    title = r"L12 Q15 \quad Toss two coins (marks)"
    lines = [
        r"\text{+50 per tail, }-20\text{ per head}",
        r"E\text{ per coin}=50(\tfrac12)+(-20)(\tfrac12)=15",
        r"\text{two coins: }E=15\times 2=30",
    ]
    box_indices = (2,)


class L12Q16(ProbSolution):
    title = r"L12 Q16 \quad Draw 3 cards (0–9)"
    lines = [
        r"\text{Score}=\text{card value},\;\text{cards }0\text{–}9",
        r"E\text{ per draw}=\frac{0+1+\cdots+9}{10}=\frac{45}{10}=4.5",
        r"\text{three draws: }E=4.5\times 3=13.5",
    ]
    box_indices = (2,)


class L12Q17(ProbSolution):
    title = r"L12 Q17 \quad Faulty light bulbs"
    lines = [
        r"P(\text{faulty})=0.03,\;30\text{ bulbs per batch}",
        r"E\text{ per batch}=30\times 0.03=0.9",
        r"5\text{ batches}:\;E=0.9\times 5=4.5",
    ]
    box_indices = (2,)


class L12Q18(ProbSolution):
    title = r"L12 Q18 \quad Babies' weights"
    lines = [
        r"P(>8\text{ lb})=0.15\Rightarrow P(\le 8\text{ lb})=0.85",
        r"\text{4 babies: }E=4\times 0.85",
        r"=3.4",
    ]
    box_indices = (2,)


# ════════════════════════════ L10 — Geometric probability ════════════════════════════

class L10Q14(ProbSolution):
    title = r"L10 Q14 \quad Bar chart — events joined"
    lines = [
        r"\text{Bars: } x,\;x+3,\;19,\;6,\;4",
        r"\text{Total}=x+(x+3)+19+6+4=2x+32",
        r"\textbf{(a)}\;\;\frac{x+3}{2x+32}=\frac{6}{25}",
        r"25(x+3)=6(2x+32)\Rightarrow 13x=117",
        r"x=9",
        r"\textbf{(b)}\;\;\text{Total}=2(9)+32=50",
        r">2\text{ events}:6+4=10\Rightarrow P=\frac{10}{50}=\frac{1}{5}",
    ]
    box_indices = (4, 6)


class L10Q16(ProbSolution):
    title = r"L10 Q16 \quad Dartboard of 16 triangles"
    lines = [
        r"\text{16 identical triangles, } 9 \text{ are shaded}",
        r"P(\text{shaded})=\frac{9}{16}",
    ]
    cm = cmap(["9"], ["16"])
    box_indices = (1,)


class L10Q17(ProbSolution):
    title = r"L10 Q17 \quad Lucky wheel (regular octagon)"
    lines = [
        r"\text{8 equal parts; region I uses 2 parts}",
        r"\textbf{(a)}\;\;P(\text{I})=\frac{2}{8}=\frac{1}{4}",
        r"\textbf{(b)}\;\;\text{not II}=5\text{ parts}",
        r"P(\text{not II})=\frac{5}{8}",
    ]
    cm = cmap(["5"], ["8"])
    box_indices = (1, 3)


class L10Q18(ProbSolution):
    title = r"L10 Q18 \quad Pie chart — favourite sports"
    lines = [
        r"\text{swim }30^\circ,\;\text{volley }120^\circ,\;\text{other }90^\circ",
        r"\textbf{(a)}\;\;\text{swim or volley}=30^\circ+120^\circ=150^\circ",
        r"P=\frac{150^\circ}{360^\circ}=\frac{5}{12}",
        r"\textbf{(b)}\;\;\text{table tennis}=360^\circ-120^\circ-90^\circ-30^\circ=120^\circ",
        r"P=\frac{120^\circ}{360^\circ}=\frac{1}{3}",
    ]
    box_indices = (2, 4)


class L10Q19(ProbSolution):
    title = r"L10 Q19 \quad Circular dartboard (B:C:D=2:1:1)"
    lines = [
        r"\text{angle }A=90^\circ\Rightarrow B+C+D=270^\circ",
        r"\text{angle }C=270^\circ\times\frac{1}{2+1+1}=67.5^\circ",
        r"P(C)=\frac{67.5^\circ}{360^\circ}=\frac{3}{16}",
    ]
    box_indices = (2,)


class L10Q20(ProbSolution):
    title = r"L10 Q20 \quad Square dartboard"
    lines = [
        r"\text{Dartboard area}=(4+4)^2=64\text{ cm}^2",
        r"\text{Shaded area}=2^2\times 2=8\text{ cm}^2",
        r"P=\frac{8}{64}=\frac{1}{8}",
    ]
    box_indices = (2,)


class L10Q21(ProbSolution):
    title = r"L10 Q21 \quad Square dartboard (nested squares)"
    lines = [
        r"\text{Dartboard}=64\times(\text{area of square }A)",
        r"\text{Shaded}=(16+4+1)\times(\text{area of square }A)=21A",
        r"P=\frac{21}{64}",
    ]
    box_indices = (2,)


class L10Q22(ProbSolution):
    title = r"L10 Q22 \quad Two concentric circles"
    lines = [
        r"\text{Dartboard}=\pi\times 40^2=1600\pi\text{ cm}^2",
        r"\text{Shaded}=\pi(40^2-30^2)=700\pi\text{ cm}^2",
        r"P=\frac{700\pi}{1600\pi}=\frac{7}{16}",
    ]
    box_indices = (2,)


class L10Q23(ProbSolution):
    title = r"L10 Q23 \quad Pattern of three circles"
    lines = [
        r"A=\pi\left(\tfrac{4+2+4}{2}\right)^2=25\pi",
        r"B=\pi\left(\tfrac{4+2}{2}\right)^2=9\pi,\quad C=\pi(1)^2=\pi",
        r"P(\text{shaded})=\frac{25\pi-9\pi+\pi}{25\pi}=\frac{17}{25}",
    ]
    box_indices = (2,)


class L10Q24(ProbSolution):
    title = r"L10 Q24 \quad Square inscribed in a circle"
    lines = [
        r"\text{Dartboard}=\pi\left(\tfrac{40}{2}\right)^2=400\pi\text{ cm}^2",
        r"\text{Grey}=\tfrac12\times 40\times\left(\tfrac12\times 40\right)=400\text{ cm}^2",
        r"P=\frac{400}{400\pi}=\frac{1}{\pi}",
    ]
    box_indices = (2,)


class L10Q25(ProbSolution):
    title = r"L10 Q25 \quad Square inscribed in a circle"
    lines = [
        r"x^2+x^2=20^2\Rightarrow x^2=200",
        r"\text{Square}=200\text{ cm}^2,\quad\text{Dartboard}=\pi(10)^2=100\pi",
        r"P=\frac{200}{100\pi}=\frac{2}{\pi}",
    ]
    box_indices = (2,)


# ════════════════════════════ L11 — extra (tabulation) ════════════════════════════

class L11Q8(ProbSolution):
    title = r"L11 Q8 \quad Gift-wrapping cost"
    lines = [
        r"\text{Paper: R }\$10,\text{ Y }\$8,\text{ B }\$9",
        r"\text{Ribbon: G }\$8,\text{ R }\$12,\text{ Y }\$4",
        r"\text{Table} \Rightarrow 9 \text{ possible costs}",
        r"\text{more than }\$15:\{18,22,16,20,17,21\}\Rightarrow 6",
        r"P(>\$15)=\frac{6}{9}=\frac{2}{3}",
    ]
    cm = cmap(["6"], ["9"])
    box_indices = (4,)


# ════════════════════════════ L12 — extra (expected value) ════════════════════════════

class L12Q7(ProbSolution):
    title = r"L12 Q7 \quad Card points"
    lines = [
        r"A:+11\,(4),\;\;2\text{–}5:+5\,(16),\;\;6\text{–}9:-5\,(16),\;\;10\text{/J/Q/K}:+10\,(16)",
        r"E=11\cdot\tfrac{4}{52}+5\cdot\tfrac{16}{52}+(-5)\cdot\tfrac{16}{52}+10\cdot\tfrac{16}{52}",
        r"=\frac{44+80-80+160}{52}=\frac{204}{52}=\frac{51}{13}\approx 3.92",
    ]
    box_indices = (2,)


class L12Q8(ProbSolution):
    title = r"L12 Q8 \quad Lucky wheel (two semicircles)"
    lines = [
        r"\text{Left: 2 sectors }(\tfrac14\text{ each});\;\text{Right: 4 sectors }(\tfrac18\text{ each})",
        r"\text{Marks }0,1\;(\tfrac14);\quad 2,4,6,8\;(\tfrac18)",
        r"E=0(\tfrac14)+1(\tfrac14)+2(\tfrac18)+4(\tfrac18)+6(\tfrac18)+8(\tfrac18)",
        r"=2.75",
    ]
    box_indices = (3,)


class L12Q13(ProbSolution):
    title = r"L12 Q13 \quad Lucky wheel (regular pentagon)"
    lines = [
        r"\text{Points }1,2,5,8\text{ with }P=\tfrac15,\tfrac25,\tfrac15,\tfrac15",
        r"\textbf{(a)}\;\;P(5)=\tfrac15,\quad P(2)=\tfrac25",
        r"\textbf{(b)}\;\;E=1(\tfrac15)+2(\tfrac25)+5(\tfrac15)+8(\tfrac15)=\frac{18}{5}=3.6",
        r"\textbf{(c)}\;\;\text{has 8; needs }\ge 2\text{ more}\Rightarrow\{2,5,8\}",
        r"P(\text{special prize})=\frac{4}{5}",
    ]
    box_indices = (2, 4)


class L12Q14(ProbSolution):
    title = r"L12 Q14 \quad Draw two balls (with replacement)"
    lines = [
        r"9\text{ outcomes};\;P(1,1)=P(2,2)=\tfrac19,\;P(3,1\text{ or }3,2)=\tfrac29,\;P(3,3)=\tfrac19",
        r"E=12(\tfrac19)+12(\tfrac19)+30(\tfrac29)+(-30)(\tfrac19)",
        r"=\frac{12+12+60-30}{9}=\frac{54}{9}=\$6",
        r"\textbf{(c)}\;\;\$6<\$10\Rightarrow\text{not favourable}",
    ]
    box_indices = (2,)


class L12Q19(ProbSolution):
    title = r"L12 Q19 \quad Multiple-choice test (3 options)"
    lines = [
        r"\text{Table} \Rightarrow 3\times 3=9 \text{ outcomes}",
        r"\textbf{(b)(i)}\;\;P(\text{both correct})=\frac{1}{9}",
        r"\textbf{(b)(ii)}\;\;P(\text{only one correct})=\frac{4}{9}",
        r"\textbf{(c)}\;\;E=4(\tfrac19)+2(\tfrac49)=\frac{12}{9}=\frac{4}{3}\approx 1.33",
    ]
    box_indices = (1, 2, 3)


class L12Q20(ProbSolution):
    title = r"L12 Q20 \quad Square dartboard (Final Boss)"
    lines = [
        r"\text{Board}=42^2=1764;\quad\text{circle }r=14",
        r"A=2\left(\tfrac12\times14\times7\right)=98,\quad B=\tfrac{22}{7}(14^2)-98=518",
        r"C=1764-518-98=1148",
        r"P(A)=\tfrac{98}{1764}=\tfrac{1}{18},\;\;P(B)=\tfrac{518}{1764}=\tfrac{37}{126},\;\;P(C)=\tfrac{1148}{1764}=\tfrac{41}{63}",
        r"E=9\!\left(\tfrac{1}{18}\right)+3\!\left(\tfrac{37}{126}\right)-2\!\left(\tfrac{41}{63}\right)=\frac{5}{63}",
    ]
    box_indices = (4,)
