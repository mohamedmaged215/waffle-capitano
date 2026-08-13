from __future__ import annotations

import re
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont
from reportlab.graphics.barcode.qr import QrCodeWidget
from reportlab.lib.pagesizes import A5
from reportlab.pdfgen import canvas


ROOT = Path(__file__).resolve().parents[1]
OUTPUT_QR = ROOT / "output" / "qr"
OUTPUT_PDF = ROOT / "output" / "pdf"
LOGO_PATH = ROOT / "public" / "waffle-capitano-logo.jpeg"
FONT_REGULAR = Path(r"C:\Windows\Fonts\tahoma.ttf")
FONT_MEDIUM = Path(r"C:\Windows\Fonts\tahoma.ttf")
FONT_BOLD = Path(r"C:\Windows\Fonts\tahomabd.ttf")
MENU_URL = "https://waffle-capitano-fwd6.vercel.app/menu"

TEAL = "#008591"
TEAL_DARK = "#00616B"
GOLD = "#FFBD24"
BROWN = "#3B1B12"
CREAM = "#FFF8E8"
PAPER = "#FFFDF7"
GREEN = "#1FA855"


# Arabic presentation forms: isolated, final, initial, medial.
ARABIC_FORMS = {
    "ء": ("\ufe80", None, None, None),
    "آ": ("\ufe81", "\ufe82", None, None),
    "أ": ("\ufe83", "\ufe84", None, None),
    "ؤ": ("\ufe85", "\ufe86", None, None),
    "إ": ("\ufe87", "\ufe88", None, None),
    "ئ": ("\ufe89", "\ufe8a", "\ufe8b", "\ufe8c"),
    "ا": ("\ufe8d", "\ufe8e", None, None),
    "ب": ("\ufe8f", "\ufe90", "\ufe91", "\ufe92"),
    "ة": ("\ufe93", "\ufe94", None, None),
    "ت": ("\ufe95", "\ufe96", "\ufe97", "\ufe98"),
    "ث": ("\ufe99", "\ufe9a", "\ufe9b", "\ufe9c"),
    "ج": ("\ufe9d", "\ufe9e", "\ufe9f", "\ufea0"),
    "ح": ("\ufea1", "\ufea2", "\ufea3", "\ufea4"),
    "خ": ("\ufea5", "\ufea6", "\ufea7", "\ufea8"),
    "د": ("\ufea9", "\ufeaa", None, None),
    "ذ": ("\ufeab", "\ufeac", None, None),
    "ر": ("\ufead", "\ufeae", None, None),
    "ز": ("\ufeaf", "\ufeb0", None, None),
    "س": ("\ufeb1", "\ufeb2", "\ufeb3", "\ufeb4"),
    "ش": ("\ufeb5", "\ufeb6", "\ufeb7", "\ufeb8"),
    "ص": ("\ufeb9", "\ufeba", "\ufebb", "\ufebc"),
    "ض": ("\ufebd", "\ufebe", "\ufebf", "\ufec0"),
    "ط": ("\ufec1", "\ufec2", "\ufec3", "\ufec4"),
    "ظ": ("\ufec5", "\ufec6", "\ufec7", "\ufec8"),
    "ع": ("\ufec9", "\ufeca", "\ufecb", "\ufecc"),
    "غ": ("\ufecd", "\ufece", "\ufecf", "\ufed0"),
    "ف": ("\ufed1", "\ufed2", "\ufed3", "\ufed4"),
    "ق": ("\ufed5", "\ufed6", "\ufed7", "\ufed8"),
    "ك": ("\ufed9", "\ufeda", "\ufedb", "\ufedc"),
    "ل": ("\ufedd", "\ufede", "\ufedf", "\ufee0"),
    "م": ("\ufee1", "\ufee2", "\ufee3", "\ufee4"),
    "ن": ("\ufee5", "\ufee6", "\ufee7", "\ufee8"),
    "ه": ("\ufee9", "\ufeea", "\ufeeb", "\ufeec"),
    "و": ("\ufeed", "\ufeee", None, None),
    "ى": ("\ufeef", "\ufef0", None, None),
    "ي": ("\ufef1", "\ufef2", "\ufef3", "\ufef4"),
}


def arabic_display(text: str) -> str:
    """Shape Arabic and reorder it for Pillow builds without libraqm."""
    chars = list(text)
    shaped: list[str] = []
    for index, char in enumerate(chars):
        forms = ARABIC_FORMS.get(char)
        if forms is None:
            shaped.append(char)
            continue

        previous = chars[index - 1] if index else ""
        following = chars[index + 1] if index + 1 < len(chars) else ""
        previous_forms = ARABIC_FORMS.get(previous)
        following_forms = ARABIC_FORMS.get(following)
        connects_previous = bool(previous_forms and previous_forms[2] and forms[1])
        connects_following = bool(forms[2] and following_forms and following_forms[1])

        if connects_previous and connects_following and forms[3]:
            shaped.append(forms[3])
        elif connects_previous and forms[1]:
            shaped.append(forms[1])
        elif connects_following and forms[2]:
            shaped.append(forms[2])
        else:
            shaped.append(forms[0])

    display = "".join(reversed(shaped))
    # Restore left-to-right runs such as phone numbers and URLs.
    return re.sub(r"[A-Za-z0-9:/.-]+", lambda match: match.group(0)[::-1], display)


def font(path: Path, size: int) -> ImageFont.FreeTypeFont:
    return ImageFont.truetype(str(path), size=size)


def qr_matrix() -> list[list[bool]]:
    widget = QrCodeWidget(MENU_URL, barLevel="H")
    widget.qr.make()
    return widget.qr.modules


def make_qr(size: int, dark: str = BROWN) -> Image.Image:
    matrix = qr_matrix()
    quiet_zone = 4
    module_count = len(matrix) + quiet_zone * 2
    cell = max(1, size // module_count)
    actual = cell * module_count
    qr_image = Image.new("RGB", (actual, actual), "white")
    draw = ImageDraw.Draw(qr_image)
    for row, modules in enumerate(matrix):
        for column, enabled in enumerate(modules):
            if enabled:
                x0 = (column + quiet_zone) * cell
                y0 = (row + quiet_zone) * cell
                draw.rectangle((x0, y0, x0 + cell - 1, y0 + cell - 1), fill=dark)
    if actual == size:
        return qr_image
    canvas_image = Image.new("RGB", (size, size), "white")
    offset = (size - actual) // 2
    canvas_image.paste(qr_image, (offset, offset))
    return canvas_image


def rounded_panel(draw: ImageDraw.ImageDraw, box: tuple[int, int, int, int], radius: int, fill: str, outline: str | None = None, width: int = 1) -> None:
    draw.rounded_rectangle(box, radius=radius, fill=fill, outline=outline, width=width)


def circular_logo(size: int) -> Image.Image:
    source = Image.open(LOGO_PATH).convert("RGB")
    side = min(source.size)
    left = (source.width - side) // 2
    top = (source.height - side) // 2
    source = source.crop((left, top, left + side, top + side)).resize((size, size), Image.Resampling.LANCZOS)
    mask = Image.new("L", (size, size), 0)
    ImageDraw.Draw(mask).ellipse((0, 0, size - 1, size - 1), fill=255)
    result = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    result.paste(source, (0, 0), mask)
    return result


def center_arabic(draw: ImageDraw.ImageDraw, text: str, y: int, selected_font: ImageFont.FreeTypeFont, fill: str, canvas_width: int) -> None:
    shaped = arabic_display(text)
    box = draw.textbbox((0, 0), shaped, font=selected_font)
    draw.text(((canvas_width - (box[2] - box[0])) // 2, y), shaped, font=selected_font, fill=fill)


def add_background(draw: ImageDraw.ImageDraw, width: int, height: int) -> None:
    draw.rectangle((0, 0, width, height), fill=PAPER)
    draw.ellipse((-420, -350, 680, 750), fill="#FFF1C8")
    draw.ellipse((width - 540, height - 580, width + 220, height + 180), fill="#EAF8F7")
    draw.arc((55, 55, width - 55, height - 55), 205, 310, fill=GOLD, width=max(8, width // 135))
    draw.arc((70, 70, width - 70, height - 70), 24, 112, fill=TEAL, width=max(4, width // 270))


def build_print_poster() -> Image.Image:
    width, height = 1748, 2480  # A5 at 300 DPI.
    image = Image.new("RGB", (width, height), PAPER)
    draw = ImageDraw.Draw(image)
    add_background(draw, width, height)

    logo_size = 335
    logo = circular_logo(logo_size)
    logo_x = (width - logo_size) // 2
    draw.ellipse((logo_x - 14, 66, logo_x + logo_size + 14, 66 + logo_size + 28), fill=GOLD)
    image.paste(logo, (logo_x, 80), logo)

    center_arabic(draw, "وافل كابيتانو", 440, font(FONT_BOLD, 54), TEAL_DARK, width)
    center_arabic(draw, "الحلو × مكانه", 505, font(FONT_BOLD, 38), BROWN, width)
    center_arabic(draw, "اسكان وشوف المنيو", 610, font(FONT_BOLD, 104), BROWN, width)
    center_arabic(draw, "اختار طلبك وكمل على واتساب", 735, font(FONT_MEDIUM, 48), "#75574C", width)

    panel = (334, 850, 1414, 1930)
    rounded_panel(draw, panel, 70, "white", "#E9D8B8", 5)
    qr = make_qr(900)
    image.paste(qr, ((width - qr.width) // 2, 940))

    center_arabic(draw, "افتح الكاميرا وصور الكود", 1985, font(FONT_BOLD, 50), TEAL_DARK, width)
    center_arabic(draw, "من غير تحميل أي تطبيق", 2050, font(FONT_REGULAR, 36), "#7B6258", width)

    badge = (186, 2145, width - 186, 2270)
    rounded_panel(draw, badge, 62, BROWN)
    center_arabic(draw, "#آسفين للي بسببنا تخنانين", 2160, font(FONT_BOLD, 46), "white", width)

    url_font = font(FONT_MEDIUM, 30)
    url_box = draw.textbbox((0, 0), MENU_URL.replace("https://", ""), font=url_font)
    draw.text(((width - (url_box[2] - url_box[0])) // 2, 2315), MENU_URL.replace("https://", ""), font=url_font, fill=TEAL_DARK)
    return image


def build_share_card() -> Image.Image:
    width, height = 1080, 1350
    image = Image.new("RGB", (width, height), PAPER)
    draw = ImageDraw.Draw(image)
    add_background(draw, width, height)

    logo_size = 205
    logo = circular_logo(logo_size)
    logo_x = (width - logo_size) // 2
    draw.ellipse((logo_x - 9, 45, logo_x + logo_size + 9, 45 + logo_size + 18), fill=GOLD)
    image.paste(logo, (logo_x, 54), logo)

    center_arabic(draw, "اسكان وشوف المنيو", 285, font(FONT_BOLD, 68), BROWN, width)
    center_arabic(draw, "اختار طلبك وكمل على واتساب", 370, font(FONT_MEDIUM, 32), "#75574C", width)

    panel = (188, 445, 892, 1149)
    rounded_panel(draw, panel, 48, "white", "#E9D8B8", 4)
    qr = make_qr(600)
    image.paste(qr, ((width - qr.width) // 2, 497))

    center_arabic(draw, "افتح الكاميرا وصور الكود", 1177, font(FONT_BOLD, 34), TEAL_DARK, width)
    badge = (165, 1240, width - 165, 1324)
    rounded_panel(draw, badge, 42, BROWN)
    center_arabic(draw, "#آسفين للي بسببنا تخنانين", 1252, font(FONT_BOLD, 29), "white", width)
    return image


def make_qr_svg(path: Path) -> None:
    matrix = qr_matrix()
    quiet = 4
    count = len(matrix) + quiet * 2
    paths: list[str] = []
    for row, modules in enumerate(matrix):
        for column, enabled in enumerate(modules):
            if enabled:
                paths.append(f"M{column + quiet},{row + quiet}h1v1h-1z")
    path.write_text(
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {count} {count}" shape-rendering="crispEdges">'
        f'<rect width="100%" height="100%" fill="white"/><path d="{"".join(paths)}" fill="{BROWN}"/></svg>',
        encoding="utf-8",
    )


def make_pdf(poster_path: Path, pdf_path: Path) -> None:
    pdf = canvas.Canvas(str(pdf_path), pagesize=A5)
    pdf.setTitle("وافل كابيتانو - QR المنيو")
    pdf.setAuthor("وافل كابيتانو")
    pdf.setSubject("كود QR جاهز للطباعة ويفتح منيو وافل كابيتانو")
    width, height = A5
    pdf.drawImage(str(poster_path), 0, 0, width=width, height=height, preserveAspectRatio=False, mask="auto")
    pdf.showPage()
    pdf.save()


def main() -> None:
    OUTPUT_QR.mkdir(parents=True, exist_ok=True)
    OUTPUT_PDF.mkdir(parents=True, exist_ok=True)

    standalone_qr = make_qr(1800, dark="#000000")
    standalone_qr.save(OUTPUT_QR / "waffle-capitano-menu-qr.png", dpi=(300, 300), optimize=True)
    make_qr_svg(OUTPUT_QR / "waffle-capitano-menu-qr.svg")

    poster = build_print_poster()
    poster_path = OUTPUT_QR / "waffle-capitano-menu-poster-A5.png"
    poster.save(poster_path, dpi=(300, 300), optimize=True)

    share = build_share_card()
    share.save(OUTPUT_QR / "waffle-capitano-menu-share.png", optimize=True)

    make_pdf(poster_path, OUTPUT_PDF / "waffle-capitano-menu-qr-A5.pdf")


if __name__ == "__main__":
    main()
