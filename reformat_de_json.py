"""
Reformat answerKeyDE.json / mainConfigDE.json to match answerKey.json / mainConfig.json layout.
Content unchanged (round-trip through json.load).
"""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent
SEP = (", ", ": ")  # spaces like originals


def j(obj) -> str:
    return json.dumps(obj, ensure_ascii=False, separators=SEP)


def flat_obj_braced(d: dict) -> str:
    """Like original: { "k": "v", "k2": "v2" }"""
    inner = ", ".join(f'"{k}": {json.dumps(v, ensure_ascii=False)}' for k, v in d.items())
    return "{ " + inner + " }"


def format_step5_value(s5) -> str:
    """Original uses space after colon for arrays; level-5 object inline."""
    if isinstance(s5, list):
        return json.dumps(s5, ensure_ascii=False, separators=SEP)
    parts = []
    for k, v in s5.items():
        parts.append(f'"{k}": {json.dumps(v, ensure_ascii=False, separators=SEP)}')
    return "{ " + ", ".join(parts) + " }"


def format_answer_key(data: dict) -> str:
    lines = ["{"]
    level_keys = list(data.keys())
    for li, lvl in enumerate(level_keys):
        lines.append(f'  "{lvl}": {{')
        cat_keys = list(data[lvl].keys())
        for ci, cat in enumerate(cat_keys):
            lines.append(f'    "{cat}": {{')
            traits = list(data[lvl][cat].keys())
            for ti, trait in enumerate(traits):
                task = data[lvl][cat][trait]
                lines.append(f'      "{trait}": {{')
                lines.append(f'        "step1": {flat_obj_braced(task["step1"])},')
                lines.append(f'        "step2": {flat_obj_braced(task["step2"])},')
                s3 = task["step3"]
                # Match original: "reasoning":[  no space before [
                r_json = json.dumps(s3["reasoning"], ensure_ascii=False)
                lines.append(
                    f'        "step3": {{ "reasoning":{r_json}, "punnett_squares": {s3["punnett_squares"]} }},'
                )
                s4 = task["step4"]
                if len(s4) == 1:
                    lines.append(
                        f'        "step4":[ {flat_obj_braced(s4[0])} ],'
                    )
                else:
                    lines.append('        "step4":[')
                    for ri, row in enumerate(s4):
                        comma = "," if ri < len(s4) - 1 else ""
                        lines.append(f"          {flat_obj_braced(row)}{comma}")
                    lines.append("        ],")
                s5 = task["step5"]
                lines.append(f'        "step5": {format_step5_value(s5)}')
                close_trait = "      }" + ("," if ti < len(traits) - 1 else "")
                lines.append(close_trait)
            close_cat = "    }" + ("," if ci < len(cat_keys) - 1 else "")
            lines.append(close_cat)
        close_lvl = "  }" + ("," if li < len(level_keys) - 1 else "")
        lines.append(close_lvl)
    lines.append("}")
    lines.append("")
    return "\n".join(lines)


def spaced_json(obj) -> str:
    """Match mainConfig.json: objects as { "k": v, ... }, arrays compact [a, b]."""
    if obj is None:
        return "null"
    if isinstance(obj, bool):
        return "true" if obj else "false"
    if isinstance(obj, int):
        return str(obj)
    if isinstance(obj, float):
        return str(obj)
    if isinstance(obj, str):
        return json.dumps(obj, ensure_ascii=False)
    if isinstance(obj, list):
        return "[" + ", ".join(spaced_json(x) for x in obj) + "]"
    if isinstance(obj, dict):
        parts = [f'"{k}": {spaced_json(v)}' for k, v in obj.items()]
        return "{ " + ", ".join(parts) + " }"
    raise TypeError(type(obj))


def format_main_config_task_oneline(task: dict) -> str:
    return spaced_json(task)


def format_main_config_level5_task(name: str, task: dict) -> list:
    out = [f'      "{name}": {{']
    out.append(f'        "narrative": {json.dumps(task["narrative"], ensure_ascii=False)},')
    out.append(f'        "gene": {spaced_json(task["gene"])},')
    out.append(f'        "family": {spaced_json(task["family"])},')
    out.append(f'        "unknowns": {spaced_json(task["unknowns"])},')
    out.append(f'        "punnett_squares_needed": {task["punnett_squares_needed"]},')
    out.append(f'        "steps": {spaced_json(task["steps"])}')
    out.append("      }")
    return out


def format_main_config(data: dict) -> str:
    lines = ["{"]
    level_keys = list(data.keys())
    for li, lvl in enumerate(level_keys):
        lines.append(f'  "{lvl}": {{')
        cats = list(data[lvl].keys())
        for ci, cat in enumerate(cats):
            lines.append(f'    "{cat}": {{')
            traits = list(data[lvl][cat].keys())
            if lvl == "level5":
                for ti, trait in enumerate(traits):
                    task = data[lvl][cat][trait]
                    block = format_main_config_level5_task(trait, task)
                    if ti < len(traits) - 1:
                        block[-1] = block[-1] + ","
                    lines.extend(block)
            else:
                for ti, trait in enumerate(traits):
                    task = data[lvl][cat][trait]
                    line = f'      "{trait}": {format_main_config_task_oneline(task)}'
                    if ti < len(traits) - 1:
                        line += ","
                    lines.append(line)
            close_cat = "    }" + ("," if ci < len(cats) - 1 else "")
            lines.append(close_cat)
        close_lvl = "  }" + ("," if li < len(level_keys) - 1 else "")
        lines.append(close_lvl)
    lines.append("}")
    lines.append("")
    return "\n".join(lines)


def main():
    ak_path = ROOT / "answerKeyDE.json"
    mc_path = ROOT / "mainConfigDE.json"
    ak = json.loads(ak_path.read_text(encoding="utf-8"))
    mc = json.loads(mc_path.read_text(encoding="utf-8"))
    ak_path.write_text(format_answer_key(ak), encoding="utf-8")
    mc_path.write_text(format_main_config(mc), encoding="utf-8")
    # validate
    json.loads(ak_path.read_text(encoding="utf-8"))
    json.loads(mc_path.read_text(encoding="utf-8"))
    print("OK:", ak_path.name, mc_path.name)


if __name__ == "__main__":
    main()
