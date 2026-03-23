#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Analyze Existing Project - Design Diagnostic Tool
Usage: python3 analyze_existing.py [project-path] [--json] [--verbose]

Scans a web project to extract current design patterns, detect style paradigms,
audit accessibility, and identify anti-patterns for improvement recommendations.

Dependencies: Python stdlib only (pathlib, json, re, glob)
"""

import argparse
import json
import re
import sys
from pathlib import Path
from collections import Counter


def detect_stack(project_path: Path) -> dict:
    """Detect the project's tech stack."""
    stack = {"framework": "unknown", "styling": "unknown", "ui_library": "unknown"}

    pkg_json = project_path / "package.json"
    if pkg_json.exists():
        try:
            pkg = json.loads(pkg_json.read_text(encoding="utf-8"))
            deps = {**pkg.get("dependencies", {}), **pkg.get("devDependencies", {})}

            if "next" in deps:
                stack["framework"] = f"nextjs@{deps['next']}"
            elif "react" in deps:
                stack["framework"] = f"react@{deps['react']}"
            elif "vue" in deps:
                stack["framework"] = f"vue@{deps['vue']}"
            elif "svelte" in deps:
                stack["framework"] = f"svelte@{deps['svelte']}"
            elif "astro" in deps:
                stack["framework"] = f"astro@{deps['astro']}"

            if "tailwindcss" in deps:
                stack["styling"] = f"tailwind@{deps['tailwindcss']}"
            elif "styled-components" in deps:
                stack["styling"] = "styled-components"
            elif "sass" in deps or "node-sass" in deps:
                stack["styling"] = "sass"

            if "@shadcn/ui" in deps or "class-variance-authority" in deps:
                stack["ui_library"] = "shadcn-ui"
            elif "@chakra-ui/react" in deps:
                stack["ui_library"] = "chakra-ui"
            elif "@mui/material" in deps:
                stack["ui_library"] = "material-ui"
            elif "@radix-ui/react-dialog" in deps or any(k.startswith("@radix-ui") for k in deps):
                stack["ui_library"] = "radix-ui"
        except (json.JSONDecodeError, KeyError):
            pass

    for config_name in ["tailwind.config.ts", "tailwind.config.js", "tailwind.config.mjs"]:
        if (project_path / config_name).exists():
            stack["styling"] = stack["styling"] if "tailwind" in stack["styling"] else "tailwind"
            break

    return stack


def extract_tailwind_config(project_path: Path) -> dict:
    """Extract colors and fonts from tailwind.config."""
    config = {"colors": {}, "fonts": {}, "raw_config_found": False}

    for config_name in ["tailwind.config.ts", "tailwind.config.js", "tailwind.config.mjs"]:
        config_file = project_path / config_name
        if config_file.exists():
            config["raw_config_found"] = True
            content = config_file.read_text(encoding="utf-8")

            # Extract color definitions
            color_patterns = re.findall(
                r"""['"]?([\w-]+)['"]?\s*:\s*['"]?(#[0-9a-fA-F]{3,8}|(?:rgb|hsl)a?\([^)]+\))['"]?""",
                content
            )
            for name, value in color_patterns:
                config["colors"][name] = value

            # Extract font family definitions
            font_patterns = re.findall(
                r"""fontFamily\s*:\s*\{([^}]+)\}""",
                content, re.DOTALL
            )
            for block in font_patterns:
                font_entries = re.findall(
                    r"""['"]?([\w-]+)['"]?\s*:\s*\[['"]([^'"]+)['"]""",
                    block
                )
                for name, value in font_entries:
                    config["fonts"][name] = value

            break

    return config


def extract_css_variables(project_path: Path) -> dict:
    """Extract CSS custom properties from globals.css or similar."""
    variables = {}

    css_candidates = [
        project_path / "src" / "app" / "globals.css",
        project_path / "app" / "globals.css",
        project_path / "src" / "styles" / "globals.css",
        project_path / "styles" / "globals.css",
        project_path / "src" / "index.css",
        project_path / "globals.css",
    ]

    for css_file in css_candidates:
        if css_file.exists():
            content = css_file.read_text(encoding="utf-8")
            var_patterns = re.findall(
                r"""--([\w-]+)\s*:\s*([^;]+);""",
                content
            )
            for name, value in var_patterns:
                variables[name] = value.strip()
            break

    return variables


def scan_component_classes(project_path: Path) -> dict:
    """Scan component files for Tailwind class frequency and style detection."""
    class_counter = Counter()
    style_signals = {
        "glassmorphism": 0,
        "neumorphism": 0,
        "neobrutalism": 0,
        "bento_grid": 0,
        "gradient_mesh": 0,
    }
    files_scanned = 0

    extensions = ["*.tsx", "*.jsx", "*.vue", "*.svelte", "*.astro", "*.html"]
    search_dirs = [
        project_path / "src",
        project_path / "app",
        project_path / "components",
        project_path / "pages",
    ]

    for search_dir in search_dirs:
        if not search_dir.exists():
            continue
        for ext in extensions:
            for file in search_dir.rglob(ext):
                if "node_modules" in str(file) or ".next" in str(file):
                    continue
                try:
                    content = file.read_text(encoding="utf-8")
                    files_scanned += 1

                    # Extract Tailwind classes
                    class_matches = re.findall(
                        r"""(?:className|class)\s*=\s*[{'"}`]([^'"`}]+)""",
                        content
                    )
                    for match in class_matches:
                        classes = match.split()
                        for cls in classes:
                            clean = cls.strip("{}()[]`,")
                            if clean and not clean.startswith("$") and not clean.startswith("{"):
                                class_counter[clean] += 1

                    # Detect style signals
                    if "backdrop-blur" in content or "backdrop-filter" in content:
                        style_signals["glassmorphism"] += 1
                    if re.search(r"bg-white/\d|bg-black/\d|rgba.*0\.\d", content):
                        style_signals["glassmorphism"] += 1

                    if "shadow-inner" in content:
                        style_signals["neumorphism"] += 1
                    if re.search(r"box-shadow:.*inset", content):
                        style_signals["neumorphism"] += 1

                    if re.search(r"border-[2-4]|border-black", content):
                        style_signals["neobrutalism"] += 1
                    if re.search(r"shadow-\[?\d+px\s+\d+px\s+0", content):
                        style_signals["neobrutalism"] += 1

                    if re.search(r"grid-cols-[3-6]|col-span-[2-3]|row-span-[2-3]", content):
                        style_signals["bento_grid"] += 1

                    if re.search(r"bg-gradient|from-|via-|to-", content):
                        style_signals["gradient_mesh"] += 1
                    if re.search(r"blur-\[(?:6|8|10|12|15)\d*px\]", content):
                        style_signals["gradient_mesh"] += 1

                except (UnicodeDecodeError, PermissionError):
                    continue

    # Determine dominant style
    dominant_style = "minimal"
    if files_scanned > 0:
        max_signal = max(style_signals.values())
        if max_signal >= 3:
            dominant_style = max(style_signals, key=style_signals.get)
        elif max_signal >= 1:
            dominant_style = "mixed"

    return {
        "files_scanned": files_scanned,
        "top_classes": dict(class_counter.most_common(30)),
        "style_signals": style_signals,
        "detected_style": dominant_style,
    }


def audit_accessibility(project_path: Path) -> dict:
    """Audit accessibility patterns in the project."""
    audit = {
        "aria_count": 0,
        "role_count": 0,
        "sr_only_count": 0,
        "focus_visible_count": 0,
        "alt_tags": 0,
        "img_tags": 0,
        "alt_coverage": 0.0,
        "semantic_html": {"header": 0, "nav": 0, "main": 0, "footer": 0, "section": 0, "article": 0},
    }

    extensions = ["*.tsx", "*.jsx", "*.vue", "*.svelte", "*.html"]
    search_dirs = [project_path / "src", project_path / "app", project_path / "components", project_path / "pages"]

    for search_dir in search_dirs:
        if not search_dir.exists():
            continue
        for ext in extensions:
            for file in search_dir.rglob(ext):
                if "node_modules" in str(file) or ".next" in str(file):
                    continue
                try:
                    content = file.read_text(encoding="utf-8")

                    audit["aria_count"] += len(re.findall(r"aria-[\w-]+=", content))
                    audit["role_count"] += len(re.findall(r'role\s*=\s*["\']', content))
                    audit["sr_only_count"] += content.count("sr-only")
                    audit["focus_visible_count"] += len(re.findall(r"focus-visible|focus-within|focus:", content))

                    img_count = len(re.findall(r"<(?:img|Image)\b", content))
                    alt_count = len(re.findall(r"<(?:img|Image)\b[^>]*\balt\s*=", content))
                    audit["img_tags"] += img_count
                    audit["alt_tags"] += alt_count

                    for tag in audit["semantic_html"]:
                        audit["semantic_html"][tag] += len(re.findall(rf"<{tag}\b", content))

                except (UnicodeDecodeError, PermissionError):
                    continue

    if audit["img_tags"] > 0:
        audit["alt_coverage"] = round(audit["alt_tags"] / audit["img_tags"], 2)

    return audit


def detect_anti_patterns(project_path: Path, tailwind_config: dict, component_scan: dict) -> list:
    """Detect common design anti-patterns."""
    anti_patterns = []

    # Generic fonts
    generic_fonts = ["inter", "roboto", "arial", "helvetica", "system-ui"]
    for name, value in tailwind_config.get("fonts", {}).items():
        if any(gf in value.lower() for gf in generic_fonts):
            anti_patterns.append({
                "type": "generic-font",
                "detail": f"Font '{value}' detected as {name} — consider a more distinctive choice",
                "severity": "high",
            })

    # Hardcoded colors (too many inline hex in classes)
    top_classes = component_scan.get("top_classes", {})
    hex_in_classes = sum(1 for cls in top_classes if re.match(r".*\[#[0-9a-fA-F]+\]", cls))
    if hex_in_classes > 5:
        anti_patterns.append({
            "type": "hardcoded-colors",
            "detail": f"{hex_in_classes} hardcoded hex colors found in Tailwind classes — use CSS variables instead",
            "severity": "high",
        })

    # Missing cursor-pointer on interactive elements
    has_hover = any("hover:" in cls for cls in top_classes)
    has_cursor = any("cursor-pointer" in cls for cls in top_classes)
    if has_hover and not has_cursor:
        anti_patterns.append({
            "type": "missing-cursor-pointer",
            "detail": "Hover states detected but no cursor-pointer — clickable elements may not signal interactivity",
            "severity": "medium",
        })

    # Check for generic AI aesthetics
    generic_blue = any("#3B82F6" in v or "#3b82f6" in v for v in tailwind_config.get("colors", {}).values())
    if generic_blue:
        anti_patterns.append({
            "type": "generic-ai-blue",
            "detail": "Default Tailwind blue-500 (#3B82F6) used as a brand color — signals generic AI-generated design",
            "severity": "medium",
        })

    # No design system persistence
    master_file = project_path / "design-system" / "MASTER.md"
    if not master_file.exists():
        anti_patterns.append({
            "type": "no-design-system",
            "detail": "No design-system/MASTER.md found — no persisted design decisions",
            "severity": "low",
        })

    # Scan for emoji-as-icon pattern in component files
    extensions = ["*.tsx", "*.jsx", "*.vue"]
    search_dirs = [project_path / "src", project_path / "app", project_path / "components"]
    emoji_files = []
    for search_dir in search_dirs:
        if not search_dir.exists():
            continue
        for ext in extensions:
            for file in search_dir.rglob(ext):
                if "node_modules" in str(file):
                    continue
                try:
                    content = file.read_text(encoding="utf-8")
                    # Detect emoji characters used as UI icons (not in text content)
                    emoji_pattern = re.findall(r'[\U0001F300-\U0001F9FF]', content)
                    if len(emoji_pattern) > 3:
                        emoji_files.append(str(file.relative_to(project_path)))
                except (UnicodeDecodeError, PermissionError):
                    continue

    if emoji_files:
        anti_patterns.append({
            "type": "emoji-as-icon",
            "detail": f"Emojis used as UI icons in {len(emoji_files)} files — use proper icon library (Lucide, Heroicons)",
            "severity": "medium",
            "files": emoji_files[:5],
        })

    return anti_patterns


def analyze_project(project_path: Path, verbose: bool = False) -> dict:
    """Run full project analysis and return structured report."""
    report = {
        "project_path": str(project_path),
        "stack": detect_stack(project_path),
        "current_design": {},
        "accessibility": {},
        "anti_patterns": [],
        "improvement_opportunities": [],
    }

    # Extract design data
    tailwind_config = extract_tailwind_config(project_path)
    css_variables = extract_css_variables(project_path)
    component_scan = scan_component_classes(project_path)

    report["current_design"] = {
        "colors_from_config": tailwind_config["colors"],
        "colors_from_css_vars": {k: v for k, v in css_variables.items() if "color" in k or "background" in k or "foreground" in k},
        "fonts": tailwind_config["fonts"],
        "detected_style": component_scan["detected_style"],
        "style_signals": component_scan["style_signals"],
        "has_design_system": (project_path / "design-system" / "MASTER.md").exists(),
        "has_tailwind_config": tailwind_config["raw_config_found"],
    }

    if verbose:
        report["current_design"]["top_tailwind_classes"] = component_scan["top_classes"]
        report["current_design"]["all_css_variables"] = css_variables

    report["accessibility"] = audit_accessibility(project_path)
    report["anti_patterns"] = detect_anti_patterns(project_path, tailwind_config, component_scan)

    # Generate improvement opportunities
    opportunities = []
    acc = report["accessibility"]

    if not tailwind_config["fonts"]:
        opportunities.append("No custom fonts defined — add distinctive typography via tailwind.config")
    if not tailwind_config["colors"]:
        opportunities.append("No custom colors defined — define a brand palette in tailwind.config")
    if acc["aria_count"] == 0:
        opportunities.append("Zero ARIA attributes found — add aria-label, aria-describedby to interactive elements")
    if acc["alt_coverage"] < 0.8 and acc["img_tags"] > 0:
        opportunities.append(f"Alt text coverage is {acc['alt_coverage']*100:.0f}% — aim for 100%")
    if acc["focus_visible_count"] == 0:
        opportunities.append("No focus-visible styles found — add keyboard navigation indicators")
    if acc["sr_only_count"] == 0:
        opportunities.append("No sr-only elements found — add screen reader labels where visual context is needed")
    if component_scan["detected_style"] == "mixed":
        opportunities.append("Mixed style paradigms detected — commit to a single design system")
    if component_scan["detected_style"] == "minimal" and component_scan["files_scanned"] > 5:
        opportunities.append("Minimal/default styling detected — consider applying a design system for visual distinction")

    report["improvement_opportunities"] = opportunities
    report["files_scanned"] = component_scan["files_scanned"]

    return report


def main():
    parser = argparse.ArgumentParser(
        description="Analyze existing web project for design diagnostic"
    )
    parser.add_argument(
        "path",
        nargs="?",
        default=".",
        help="Path to project root (default: current directory)"
    )
    parser.add_argument(
        "--json",
        action="store_true",
        help="Output raw JSON (default: formatted report)"
    )
    parser.add_argument(
        "--verbose",
        action="store_true",
        help="Include detailed class frequency and all CSS variables"
    )

    args = parser.parse_args()
    project_path = Path(args.path).resolve()

    if not project_path.exists():
        print(f"Error: Path '{project_path}' does not exist", file=sys.stderr)
        sys.exit(1)

    report = analyze_project(project_path, verbose=args.verbose)

    if args.json:
        print(json.dumps(report, indent=2, ensure_ascii=False))
    else:
        # Formatted output for Claude consumption
        print("## Design Diagnostic Report")
        print(f"**Project:** {report['project_path']}")
        print(f"**Files Scanned:** {report['files_scanned']}")
        print()

        print("### Stack")
        for k, v in report["stack"].items():
            print(f"- **{k}:** {v}")
        print()

        print("### Current Design")
        d = report["current_design"]
        print(f"- **Detected Style:** {d['detected_style']}")
        print(f"- **Has Tailwind Config:** {d['has_tailwind_config']}")
        print(f"- **Has Design System:** {d['has_design_system']}")
        if d["colors_from_config"]:
            print(f"- **Colors:** {', '.join(f'{k}: {v}' for k, v in list(d['colors_from_config'].items())[:8])}")
        if d["fonts"]:
            print(f"- **Fonts:** {', '.join(f'{k}: {v}' for k, v in d['fonts'].items())}")
        print(f"- **Style Signals:** {', '.join(f'{k}: {v}' for k, v in d['style_signals'].items() if v > 0)}")
        print()

        print("### Accessibility Audit")
        a = report["accessibility"]
        print(f"- **ARIA attributes:** {a['aria_count']}")
        print(f"- **Role attributes:** {a['role_count']}")
        print(f"- **SR-only elements:** {a['sr_only_count']}")
        print(f"- **Focus styles:** {a['focus_visible_count']}")
        print(f"- **Alt coverage:** {a['alt_coverage']*100:.0f}% ({a['alt_tags']}/{a['img_tags']} images)")
        print(f"- **Semantic HTML:** {', '.join(f'{k}: {v}' for k, v in a['semantic_html'].items() if v > 0)}")
        print()

        if report["anti_patterns"]:
            print("### Anti-Patterns Detected")
            for ap in report["anti_patterns"]:
                icon = {"high": "!!!", "medium": "!!", "low": "!"}.get(ap["severity"], "!")
                print(f"- [{ap['severity'].upper()}] {ap['detail']}")
            print()

        if report["improvement_opportunities"]:
            print("### Improvement Opportunities")
            for opp in report["improvement_opportunities"]:
                print(f"- {opp}")


if __name__ == "__main__":
    main()
