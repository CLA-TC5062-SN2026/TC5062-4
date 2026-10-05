#!/usr/bin/env python3
"""Crea labels, issues y un GitHub Project a partir de backlog_completo.md.

Uso:
    python3 crear_backlog_github.py CLA-TC5062-SN2026/TC5062-4 --dry-run
    python3 crear_backlog_github.py CLA-TC5062-SN2026/TC5062-4

Requiere `gh` autenticado con los permisos repo y project
(gh auth refresh -s project).
"""
import argparse
import json
import re
import subprocess
import sys
from pathlib import Path

BACKLOG = Path(__file__).resolve().parent.parent / "backlog_completo.md"

LABELS = {
    "epica:E1": ("1f77b4", "Familia y círculo médico"),
    "epica:E2": ("2ca02c", "Conversaciones de salud"),
    "epica:E3": ("9467bd", "Contexto para el médico"),
    "epica:E4": ("8c564b", "Privacidad y confianza"),
    "prioridad:alta": ("d62728", "Prioridad alta"),
    "prioridad:media": ("ff7f0e", "Prioridad media"),
    "prioridad:baja": ("bcbd22", "Prioridad baja"),
}
for sp in (1, 2, 3, 5, 8, 13):
    LABELS[f"sp:{sp}"] = ("c5def5", f"{sp} story points")


def sin_negritas(texto):
    return texto.replace("**", "").strip()


def leer_historias():
    texto = BACKLOG.read_text(encoding="utf-8")

    # Orden de construcción desde la tabla resumen.
    orden = {}
    for fila in re.finditer(r"^\| (\d+) \| (HU-\d+) \|", texto, re.M):
        orden[fila.group(2)] = int(fila.group(1))

    historias = []
    epica = None
    for bloque in re.split(r"^(?=## Épica |### HU-)", texto, flags=re.M):
        m = re.match(r"## Épica (E\d)", bloque)
        if m:
            epica = m.group(1)
            continue
        m = re.match(r"### (HU-\d+): (.+)", bloque)
        if not m:
            continue
        hu_id, nombre = m.group(1), m.group(2).strip()
        historia = sin_negritas(re.search(r"^\*\*Como\*\*.+$", bloque, re.M).group(0))
        criterios = re.search(
            r"\*\*Criterios de aceptación\*\*\n\n(.+?)\n\n\*\*Story Points", bloque, re.S
        ).group(1)
        sp_linea = re.search(r"^\*\*Story Points:\*\* .+$", bloque, re.M).group(0)
        pr_linea = re.search(r"^\*\*Prioridad:\*\* .+$", bloque, re.M).group(0)
        sp = int(re.search(r"(\d+)", sp_linea).group(1))
        prioridad = re.search(r"\*\*Prioridad:\*\* (\w+)", pr_linea).group(1).lower()
        cuerpo = (
            f"**Historia de usuario ({hu_id}: {nombre})**\n\n{historia}\n\n"
            f"### Criterios de aceptación\n\n{criterios}\n\n"
            f"{sp_linea}\n{pr_linea}\n\n"
            f"Épica: {epica}. Fuente: `S03_A1/backlog_completo.md` y `SRS_equipo.md`."
        )
        historias.append({
            "id": hu_id,
            "titulo": f"{hu_id}: {historia}",
            "cuerpo": cuerpo,
            "labels": [f"epica:{epica}", f"prioridad:{prioridad}", f"sp:{sp}"],
            "orden": orden.get(hu_id, 99),
        })
    return sorted(historias, key=lambda h: h["orden"])


def gh(args, dry):
    print("$ gh " + " ".join(args[:4]) + (" ..." if len(args) > 4 else ""))
    if dry:
        return ""
    r = subprocess.run(["gh", *args], capture_output=True, text=True)
    if r.returncode != 0:
        sys.exit(r.stderr)
    return r.stdout.strip()


def main():
    p = argparse.ArgumentParser()
    p.add_argument("repo", help="owner/nombre, p. ej. CLA-TC5062-SN2026/TC5062-4")
    p.add_argument("--titulo-project", default="DAFI · Product Backlog")
    p.add_argument("--dry-run", action="store_true")
    p.add_argument("--solo-issues", action="store_true",
                   help="crea labels e issues sin tocar Projects")
    p.add_argument("--solo-project", action="store_true",
                   help="crea el Project y le agrega los issues HU-xx existentes")
    a = p.parse_args()
    owner = a.repo.split("/")[0]

    historias = leer_historias()
    print(f"{len(historias)} historias leídas de {BACKLOG.name}")

    urls = {}
    if not a.solo_project:
        for nombre, (color, desc) in LABELS.items():
            gh(["label", "create", nombre, "--repo", a.repo, "--color", color,
                "--description", desc, "--force"], a.dry_run)
        for h in historias:
            args = ["issue", "create", "--repo", a.repo, "--title", h["titulo"],
                    "--body", h["cuerpo"]]
            for lab in h["labels"]:
                args += ["--label", lab]
            urls[h["id"]] = gh(args, a.dry_run) or "URL"
            print(f"   {h['orden']:>2}. {h['id']} {h['labels']}")
    else:
        existentes = json.loads(gh(["issue", "list", "--repo", a.repo, "--state", "all",
                                    "--limit", "100", "--json", "title,url"], False))
        for i in existentes:
            m = re.match(r"(HU-\d+):", i["title"])
            if m:
                urls[m.group(1)] = i["url"]

    if a.solo_issues:
        return

    proyecto = gh(["project", "create", "--owner", owner, "--title",
                   a.titulo_project, "--format", "json"], a.dry_run)
    numero = json.loads(proyecto)["number"] if proyecto else "N"
    gh(["project", "link", str(numero), "--owner", owner, "--repo", a.repo], a.dry_run)
    for h in historias:
        if h["id"] in urls:
            gh(["project", "item-add", str(numero), "--owner", owner, "--url",
                urls[h["id"]]], a.dry_run)
    print(f"Project #{numero} con {len(urls)} issues")


if __name__ == "__main__":
    main()
