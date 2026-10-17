"""Gera os ícones PNG do PWA a partir de scripts/icon.svg (requer Playwright)."""
import asyncio
import pathlib

from playwright.async_api import async_playwright

ROOT = pathlib.Path(__file__).resolve().parent.parent
SVG = (ROOT / "scripts" / "icon.svg").read_text()

# (arquivo, tamanho, cantos arredondados). Maskable ocupa o quadro todo; o sistema recorta.
TARGETS = [
    ("icon-192.png", 192, True),
    ("icon-512.png", 512, True),
    ("icon-maskable-512.png", 512, False),
    ("apple-touch-icon.png", 180, False),
]


async def main() -> None:
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        for name, size, rounded in TARGETS:
            page = await browser.new_page(viewport={"width": size, "height": size})
            radius = f"{int(size * 0.22)}px" if rounded else "0"
            await page.set_content(
                f"<html><body style='margin:0;background:transparent'>"
                f"<div style='width:{size}px;height:{size}px;border-radius:{radius};overflow:hidden'>"
                f"{SVG.replace('<svg ', f'<svg width={size} height={size} ', 1)}</div></body></html>"
            )
            await page.screenshot(path=str(ROOT / "public" / name), omit_background=True)
            await page.close()
        await browser.close()


asyncio.run(main())
