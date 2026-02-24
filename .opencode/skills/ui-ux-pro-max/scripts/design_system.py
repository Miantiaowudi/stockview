#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Design System Generator - Simplified version
"""

from core import search

class DesignSystemGenerator:
    def generate(self, query: str, project_name: str = None) -> dict:
        product_result = search(query, "product", 1)
        product_results = product_result.get("results", [])
        category = "General"
        if product_results:
            category = product_results[0].get("Product Type", "General")
        
        style_result = search(query, "style", 1)
        style_results = style_result.get("results", [])
        best_style = style_results[0] if style_results else {}
        
        color_result = search(query, "color", 1)
        color_results = color_result.get("results", [])
        best_color = color_results[0] if color_results else {}
        
        typography_result = search(query, "typography", 1)
        typography_results = typography_result.get("results", [])
        best_typography = typography_results[0] if typography_results else {}
        
        return {
            "project_name": project_name or query.upper(),
            "category": category,
            "style": {
                "name": best_style.get("Style Category", "Minimalism"),
                "keywords": best_style.get("Keywords", ""),
                "best_for": best_style.get("Best For", "")
            },
            "colors": {
                "primary": best_color.get("Primary (Hex)", "#2563EB"),
                "secondary": best_color.get("Secondary (Hex)", "#3B82F6"),
                "cta": best_color.get("CTA (Hex)", "#F97316"),
                "background": best_color.get("Background (Hex)", "#F8FAFC"),
                "text": best_color.get("Text (Hex)", "#1E293B")
            },
            "typography": {
                "heading": best_typography.get("Heading Font", "Inter"),
                "body": best_typography.get("Body Font", "Inter")
            }
        }

def format_ascii_box(design_system: dict) -> str:
    project = design_system.get("project_name", "PROJECT")
    style = design_system.get("style", {})
    colors = design_system.get("colors", {})
    typography = design_system.get("typography", {})
    
    lines = []
    lines.append("+" + "-" * 88 + "+")
    lines.append(f"|  TARGET: {project} - RECOMMENDED DESIGN SYSTEM".ljust(89) + "|")
    lines.append("+" + "-" * 88 + "+")
    lines.append("|" + " " * 89 + "|")
    lines.append(f"|  STYLE: {style.get('name', '')}".ljust(89) + "|")
    lines.append("|" + " " * 89 + "|")
    lines.append("|  COLORS:".ljust(89) + "|")
    lines.append(f"|     Primary:    {colors.get('primary', '')}".ljust(89) + "|")
    lines.append(f"|     Secondary:  {colors.get('secondary', '')}".ljust(89) + "|")
    lines.append(f"|     CTA:        {colors.get('cta', '')}".ljust(89) + "|")
    lines.append(f"|     Background: {colors.get('background', '')}".ljust(89) + "|")
    lines.append(f"|     Text:       {colors.get('text', '')}".ljust(89) + "|")
    lines.append("|" + " " * 89 + "|")
    lines.append(f"|  TYPOGRAPHY: {typography.get('heading', '')} / {typography.get('body', '')}".ljust(89) + "|")
    lines.append("|" + " " * 89 + "|")
    lines.append("|  PRE-DELIVERY CHECKLIST:".ljust(89) + "|")
    lines.append("|     [ ] No emojis as icons (use SVG: Heroicons/Lucide)".ljust(89) + "|")
    lines.append("|     [ ] cursor-pointer on all clickable elements".ljust(89) + "|")
    lines.append("|     [ ] Hover states with smooth transitions (150-300ms)".ljust(89) + "|")
    lines.append("|     [ ] Light mode: text contrast 4.5:1 minimum".ljust(89) + "|")
    lines.append("|     [ ] Focus states visible for keyboard nav".ljust(89) + "|")
    lines.append("|     [ ] prefers-reduced-motion respected".ljust(89) + "|")
    lines.append("|     [ ] Responsive: 375px, 768px, 1024px, 1440px".ljust(89) + "|")
    lines.append("|" + " " * 89 + "|")
    lines.append("+" + "-" * 88 + "+")
    
    return "\n".join(lines)

def generate_design_system(query: str, project_name: str = None, output_format: str = "ascii", 
                           persist: bool = False, page: str = None, output_dir: str = None) -> str:
    generator = DesignSystemGenerator()
    design_system = generator.generate(query, project_name)
    return format_ascii_box(design_system)

def persist_design_system(design_system: dict, page: str = None, output_dir: str = None, page_query: str = None) -> dict:
    return {"status": "success", "message": "Persistence not implemented in simplified version"}
