"""Build answerKeyDE.json and mainConfigDE.json from Dutch sources + narr_de.json."""
import copy
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent

KEY_MAP = {
    "Oogkleur": "Augenfarbe",
    "Haarvorm": "Haarform",
    "Kattenvacht": "Katzenfell",
    "Appelboom": "Apfelbaum",
    "Depressie": "Depression",
    "Huntington": "Huntington",
    "Kippensnavel": "Huhnschnabel",
    "Schisis": "Schisis",
    "Wolman syndroom": "Wolman-Syndrom",
    "Staartlengte": "Schwanzlänge",
    "Melk allergie": "Milchallergie",
    "Apert syndroom": "Apert-Syndrom",
    "Fruitvliegjes": "Fruchtfliegen",
    "P.R.A. ziekte": "PRA-Krankheit",
    "Bloemkleur": "Blütenfarbe",
    "Tong krullen": "Zungenrollen",
    "Albinisme": "Albinismus",
    "Mamma carcinoom": "Mammakarzinom",
}

NAME_MAP = {
    "Vader (P)": "Vater (P)",
    "Moeder (P)": "Mutter (P)",
    "Kind (F1)": "Kind (F1)",
    "Partner (F1)": "Partner (F1)",
    "Kleinkind (F2)": "Enkelkind (F2)",
    "Ouder 1 (P)": "Elternteil 1 (P)",
    "Ouder 2 (P)": "Elternteil 2 (P)",
    "Boom 1 (P)": "Baum 1 (P)",
    "Boom 2 (P)": "Baum 2 (P)",
    "Nakomeling (F1)": "Nachkomme (F1)",
    "Haan (P)": "Hahn (P)",
    "Kip (P)": "Henne (P)",
    "Kuiken (F1)": "Küken (F1)",
    "Chimp 1 (P)": "Schimpanse 1 (P)",
    "Chimp 2 (P)": "Schimpanse 2 (P)",
    "Vlieg 1 (P)": "Fliege 1 (P)",
    "Vlieg 2 (P)": "Fliege 2 (P)",
    "Hond 1 (P)": "Hund 1 (P)",
    "Hond 2 (P)": "Hund 2 (P)",
    "Pup (F1)": "Welpe (F1)",
    "Bloem 1 (P)": "Blume 1 (P)",
    "Bloem 2 (P)": "Blume 2 (P)",
    "Kat 1 (P)": "Katze 1 (P)",
    "Kat 2 (P)": "Katze 2 (P)",
}

STEP_MAP = {
    "Wat is het mogelijke genotype van de onbekende nakomeling?": (
        "Welcher Genotyp ist für den unbekannten Nachkommen möglich?"
    ),
    "Wat zijn de mogelijke genotypen van de onbekende nakomeling?": (
        "Welche Genotypen sind für den unbekannten Nachkommen möglich?"
    ),
    "Wat zijn de mogelijke genotypen van de onbekende ouder?": (
        "Welche Genotypen sind für das unbekannte Elternteil möglich?"
    ),
    "Wat zijn de mogelijke genotypen van het onbekende kind (F1)?": (
        "Welche Genotypen sind für das unbekannte Kind (F1) möglich?"
    ),
    "Wat zijn de mogelijke genotypen van de individuen in generatie F1?": (
        "Welche Genotypen haben die Individuen der Generation F1?"
    ),
    "Wat zijn de mogelijke genotypen voor het onbekende kind (F1) en de onbekende partner (F1)?": (
        "Welche Genotypen sind für das unbekannte Kind (F1) und den unbekannten Partner (F1) möglich?"
    ),
    "Wat zijn de mogelijke genotypen voor de onbekende nakomeling (F1) en de onbekende partner (F1)?": (
        "Welche Genotypen sind für den unbekannten Nachkommen (F1) und den unbekannten Partner (F1) möglich?"
    ),
}

# (trait_de, dominant phenotype, recessive phenotype) — same order as extract (sorted levels, fixed categories)
GEN_DE = [
    ("Augenfarbe", "braun", "blau"),
    ("Haarform", "lockig", "glatt"),
    ("Katzenfell", "Ringe", "Streifen"),
    ("Blütezeit", "kürzer", "länger"),
    ("Depression", "geringeres Risiko", "höheres Risiko"),
    ("Augenfarbe", "braun", "blau"),
    ("Haarform", "lockig", "glatt"),
    ("Huntington", "erkrankt", "gesund"),
    ("Schnabel", "schwach gekrümmt", "stark gekrümmt"),
    ("LKG-Spalte", "keine Hasenscharte", "Hasenscharte"),
    ("Augenfarbe", "braun", "blau"),
    ("Haarform", "lockig", "glatt"),
    ("Wolman", "gesund", "erkrankt"),
    ("Schwanzlänge", "lang", "kurz"),
    ("Milchallergie", "Allergie", "keine Allergie"),
    ("Augenfarbe", "braun", "blau"),
    ("Haarform", "lockig", "glatt"),
    ("Apert", "erkrankt", "gesund"),
    ("Flügel", "lang", "kurz"),
    ("PRA", "gesund", "erkrankt"),
    ("Augenfarbe", "braun", "blau"),
    ("Haarform", "lockig", "glatt"),
    ("Blütenfarbe", "rot", "blau"),
    ("Blütezeit", "kurz", "lang"),
    ("Zunge", "kann einrollen", "kann nicht einrollen"),
    ("Augenfarbe", "braun", "blau"),
    ("Haarform", "lockig", "glatt"),
    ("Huntington", "erkrankt", "gesund"),
    ("Albinismus", "kein Albino", "Albino"),
    ("Mammakarzinom", "mit erblicher Belastung", "ohne erbliche Belastung"),
    ("Augenfarbe", "braun", "blau"),
    ("Haarform", "lockig", "glatt"),
    ("Flügel", "lang", "kurz"),
    ("Schnabel", "schwach gekrümmt", "stark gekrümmt"),
    ("Wolman", "gesund", "erkrankt"),
    ("Augenfarbe", "braun", "blau"),
    ("Haarform", "lockig", "glatt"),
    ("Schwanzlänge", "lang", "kurz"),
    ("PRA", "gesund", "erkrankt"),
    ("Milchallergie", "Allergie", "keine Allergie"),
    ("Augenfarbe", "braun", "blau"),
    ("Haarform", "lockig", "glatt"),
    ("Zunge", "kann einrollen", "kann nicht einrollen"),
    ("Depression", "geringeres Risiko", "höheres Risiko"),
    ("Apert", "erkrankt", "gesund"),
    ("Augenfarbe", "braun", "blau"),
    ("Haarform", "lockig", "glatt"),
    ("Albinismus", "kein Albino", "Albino"),
    ("Katzenfell", "Ringe", "Streifen"),
    ("Depression", "geringeres Risiko", "höheres Risiko"),
    ("Augenfarbe", "braun", "blau"),
    ("Haarform", "lockig", "glatt"),
    ("Flügel", "lang", "kurz"),
    ("Blütenfarbe", "rot", "blau"),
    ("Zunge", "kann einrollen", "kann nicht einrollen"),
    ("Augenfarbe", "braun", "blau"),
    ("Haarform", "lockig", "glatt"),
    ("LKG-Spalte", "gesund", "Lippen-Kiefer-Gaumen-Spalte"),
    ("PRA", "gesund", "erkrankt"),
    ("Mammakarzinom", "mit erblicher Belastung", "ohne erbliche Belastung"),
    ("Augenfarbe", "braun", "blau"),
    ("Haarform", "lockig", "glatt"),
    ("Milchallergie", "Milchallergie", "keine Milchallergie"),
    ("Apert-Syndrom", "Apert-Syndrom", "kein Apert-Syndrom"),
    ("Huntington", "Huntington-Krankheit", "keine Huntington-Krankheit"),
    ("Augenfarbe", "braun", "blau"),
    ("Haarform", "lockig", "glatt"),
    ("Schwanzlänge", "längerer Schwanz", "kürzerer Schwanz"),
    ("Wolman-Syndrom", "kein Wolman-Syndrom", "Wolman-Syndrom"),
    ("Blütenfarbe", "rot", "blau"),
    ("Augenfarbe", "braun", "blau"),
    ("Haarform", "lockig", "glatt"),
    ("Apfelbaum-Blütezeit", "kürzere Blütezeit", "längere Blütezeit"),
    ("Fruchtfliegen", "längere Flügel", "kürzere Flügel"),
    ("Huhnschnabel", "schwache Krümmung", "starke Krümmung"),
]


def rename_answer_keys(obj):
    if isinstance(obj, dict):
        return {KEY_MAP.get(k, k): rename_answer_keys(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [rename_answer_keys(x) for x in obj]
    if isinstance(obj, str):
        if obj == "deductief":
            return "deduktiv"
        if obj == "inductief":
            return "induktiv"
        return obj
    return obj


def build_main_config_de(mc_nl: dict, narr_de: list) -> dict:
    assert len(narr_de) == 75
    assert len(GEN_DE) == 75
    out = {}
    i = 0
    for lvl in sorted(mc_nl.keys()):
        out[lvl] = {}
        for cat in ("veel_hulp", "enige_hulp", "alles_zelf"):
            out[lvl][cat] = {}
            for sk, ex in mc_nl[lvl][cat].items():
                new_sk = KEY_MAP.get(sk, sk)
                ex = copy.deepcopy(ex)
                ex["narrative"] = narr_de[i]
                t, dp, rp = GEN_DE[i]
                ex["gene"]["trait"] = t
                ex["gene"]["dominant"]["phenotype"] = dp
                ex["gene"]["recessive"]["phenotype"] = rp
                old_step = ex["steps"]["step5_prompt"]
                ex["steps"]["step5_prompt"] = STEP_MAP[old_step]
                for member in ex["family"].values():
                    member["name"] = NAME_MAP.get(member["name"], member["name"])
                out[lvl][cat][new_sk] = ex
                i += 1
    assert i == 75
    return out


def main():
    with open(ROOT / "answerKey.json", encoding="utf-8") as f:
        ak = json.load(f)
    ak_de = rename_answer_keys(ak)
    with open(ROOT / "answerKeyDE.json", "w", encoding="utf-8") as f:
        json.dump(ak_de, f, ensure_ascii=False, indent=2)
        f.write("\n")

    with open(ROOT / "mainConfig.json", encoding="utf-8") as f:
        mc = json.load(f)
    narr_de = json.load(open(ROOT / "narr_de.json", encoding="utf-8"))
    mc_de = build_main_config_de(mc, narr_de)
    with open(ROOT / "mainConfigDE.json", "w", encoding="utf-8") as f:
        json.dump(mc_de, f, ensure_ascii=False, indent=2)
        f.write("\n")

    print("Wrote answerKeyDE.json and mainConfigDE.json")


if __name__ == "__main__":
    main()
