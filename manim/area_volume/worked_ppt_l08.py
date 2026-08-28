r"""PPT-driven worked solutions — L08 (Area and Volume 2)."""

from __future__ import annotations



import sys

import pathlib



from manim import *

from manim_slides import Slide



sys.path.append(str(pathlib.Path(__file__).resolve().parent))

from av_solutions import boxed, title_tex  # noqa: E402

from av_styles import BG, INK, GREEN, AMBER, ORANGE, BLUE  # noqa: E402



C_VOL = ManimColor("#F48FB1")
C_BLUE = ManimColor("#64B5F6")
C_SA = AMBER
C_LARGE_R = ORANGE





class Qb7Solution(Slide):

    """Sphere basketball — radius and volume (PPT-accurate colours + LaTeX)."""



    title = r"B7 \quad Basketball: Radius \& Volume"



    def _let_line(self) -> Tex:

        line = Tex(

            r"\textit{Let } $r$ \textit{cm be the radius of the basketball}",

            font_size=38,

            color=INK,

        )

        line.set_color_by_tex("r", GREEN)

        return line



    def _use_sa(self) -> VGroup:

        parts = VGroup(

            Tex(r"Use ", font_size=36, color=INK),

            MathTex(r"A=4\pi r^2", font_size=38),

            Tex(r" to find the surface area", font_size=36, color=INK),

        )

        parts[1].set_color_by_tex("r", GREEN)

        parts.arrange(RIGHT, buff=0.08, aligned_edge=DOWN)

        return parts



    def _use_vol(self) -> VGroup:

        parts = VGroup(

            Tex(r"Use ", font_size=36, color=INK),

            MathTex(r"V=\tfrac43\pi r^3", font_size=38),

            Tex(r" to find the ", font_size=36, color=INK),

            Tex(r"volume", font_size=36, color=C_VOL),

        )

        parts[1].set_color_by_tex("r", GREEN)

        parts.arrange(RIGHT, buff=0.08, aligned_edge=DOWN)

        return parts



    def _vol_sub_line(self) -> MathTex:
        line = MathTex(r"\text{Volume}=\tfrac43\pi(12.1)^3\text{ cm}^3")
        line.set_color_by_tex("Volume", C_VOL)
        line.set_color_by_tex("12.1", GREEN)
        return line

    def construct(self):

        self.camera.background_color = BG

        head = title_tex(self.title)

        max_w = config.frame_width - 1.4



        vol_sub = self._vol_sub_line()

        raw_lines = [

            MathTex(r"\text{Surface area}=1850\text{ cm}^2"),

            self._let_line(),

            self._use_sa(),

            MathTex(r"4\pi r^2=1850\text{ cm}^2"),

            MathTex(r"r^2=\dfrac{925}{2\pi}"),

            MathTex(r"r=\sqrt{\dfrac{925}{2\pi}}=12.1\text{ cm}\ \text{(3 s.f.)}"),

            self._use_vol(),

            vol_sub,

            MathTex(r"\text{Volume}=7480\text{ cm}^3\ \text{(3 s.f.)}"),

        ]



        raw_lines[0].set_color_by_tex("1850", AMBER)

        raw_lines[3].set_color_by_tex("r", GREEN)

        raw_lines[3].set_color_by_tex("1850", AMBER)

        raw_lines[4].set_color_by_tex("r", GREEN)

        raw_lines[5].set_color_by_tex("r", GREEN)

        raw_lines[5].set_color_by_tex("12.1", GREEN)

        raw_lines[8].set_color_by_tex("Volume", C_VOL)

        raw_lines[8].set_color_by_tex("7480", C_VOL)



        mobs = []

        for mo in raw_lines:

            if mo.width > max_w:

                mo.scale(max_w / mo.width)

            mobs.append(mo)



        stack = VGroup(*mobs).arrange(DOWN, aligned_edge=LEFT, buff=0.42)

        avail_top = head.get_bottom()[1] - 0.4

        avail_bottom = -config.frame_height / 2 + 0.45

        avail_h = max(avail_top - avail_bottom, 0.1)

        sf = min(1.0, avail_h / stack.height, max_w / stack.width)

        if sf < 1.0:

            stack.scale(sf)

        stack.next_to(head, DOWN, buff=0.35)

        if stack.get_bottom()[1] < avail_bottom:

            stack.shift(UP * (avail_bottom - stack.get_bottom()[1]))



        box_at = {5, 8}

        indicate_at = {1: GREEN}



        self.play(Write(head[0]), GrowFromCenter(head[1]))

        for i, mo in enumerate(mobs):

            self.play(FadeIn(mo, shift=0.15 * UP))

            if i in indicate_at:

                if i == 1:

                    self.play(Indicate(mo.get_part_by_tex("r"), color=GREEN, scale_factor=1.35))

            if i in box_at:

                self.play(Create(boxed(mo, color=GREEN if i == 5 else C_VOL)))

            self.wait(0.1)

            self.next_slide()



class Qb11Solution(Slide):

    """Large sphere recast into 27 small spheres — radius and surface area (PPT-accurate)."""



    title = r"B11 \quad Sphere: Recasting"



    def _let_line(self) -> Tex:

        line = Tex(

            r"\textit{Let } $r$ \textit{cm be the radius of each small sphere}",

            font_size=38,

            color=INK,

        )

        line.set_color_by_tex("r", GREEN)

        return line



    def _vol_eq_stmt(self) -> VGroup:

        parts = VGroup(

            Tex(r"$\therefore$ Volume of the large sphere = Total volume of the ", font_size=34, color=INK),

            Tex(r"27", font_size=34, color=C_BLUE),

            Tex(r" small spheres", font_size=34, color=INK),

        )

        parts.arrange(RIGHT, buff=0.06, aligned_edge=DOWN)

        return parts



    def _sa_heading(self) -> Tex:

        return Tex(r"\textit{Surface area of each small sphere}", font_size=38, color=C_SA)



    def construct(self):

        self.camera.background_color = BG

        head = title_tex(self.title)

        max_w = config.frame_width - 1.4



        raw_lines = [

            self._let_line(),

            self._vol_eq_stmt(),

            MathTex(r"\therefore\ \tfrac43\pi(15)^3=27\times\tfrac43\pi r^3"),

            MathTex(r"r^3=125"),

            MathTex(r"r=5"),

            Tex(r"$\therefore$ The radius of each small sphere is $5$ cm", font_size=36, color=INK),

            self._sa_heading(),

            MathTex(r"=4\pi\times(5)^2\text{ cm}^2"),

            MathTex(r"=100\pi\text{ cm}^2"),

        ]



        raw_lines[2].set_color_by_tex("15", C_LARGE_R)

        raw_lines[2].set_color_by_tex("27", C_BLUE)

        raw_lines[2].set_color_by_tex("r", GREEN)

        raw_lines[3].set_color_by_tex("r", GREEN)

        raw_lines[4].set_color_by_tex("r", GREEN)

        raw_lines[4].set_color_by_tex("5", GREEN)

        raw_lines[5].set_color_by_tex("5", GREEN)

        raw_lines[7].set_color_by_tex("5", GREEN)

        raw_lines[8].set_color_by_tex("100", C_SA)

        raw_lines[8].set_color_by_tex(r"\pi", C_SA)



        mobs = []

        for mo in raw_lines:

            if mo.width > max_w:

                mo.scale(max_w / mo.width)

            mobs.append(mo)



        stack = VGroup(*mobs).arrange(DOWN, aligned_edge=LEFT, buff=0.42)

        avail_top = head.get_bottom()[1] - 0.4

        avail_bottom = -config.frame_height / 2 + 0.45

        avail_h = max(avail_top - avail_bottom, 0.1)

        sf = min(1.0, avail_h / stack.height, max_w / stack.width)

        if sf < 1.0:

            stack.scale(sf)

        stack.next_to(head, DOWN, buff=0.35)

        if stack.get_bottom()[1] < avail_bottom:

            stack.shift(UP * (avail_bottom - stack.get_bottom()[1]))



        box_at = {4, 8}

        indicate_at = {0: GREEN}



        self.play(Write(head[0]), GrowFromCenter(head[1]))

        for i, mo in enumerate(mobs):

            self.play(FadeIn(mo, shift=0.15 * UP))

            if i in indicate_at:

                if i == 0:

                    self.play(Indicate(mo.get_part_by_tex("r"), color=GREEN, scale_factor=1.35))

            if i in box_at:

                self.play(Create(boxed(mo, color=GREEN if i == 4 else C_SA)))

            self.wait(0.1)

            self.next_slide()


