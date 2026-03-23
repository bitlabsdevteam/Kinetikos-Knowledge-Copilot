#!/usr/bin/env python3
"""
Auto-ingest new/changed PDFs from project /pdf folder into Supabase.

Default watch folder:
  <repo-root>/pdf

State file:
  <this-folder>/.ingested_pdf_state.json

Run once:
  python auto_ingest_pdf_watcher.py --once

Run continuously:
  python auto_ingest_pdf_watcher.py --interval 30
"""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import subprocess
import time
from pathlib import Path
from typing import Dict


SCRIPT_DIR = Path(__file__).resolve().parent
REPO_ROOT = SCRIPT_DIR.parent.parent
DEFAULT_PDF_DIR = REPO_ROOT / "pdf"
STATE_PATH = SCRIPT_DIR / ".ingested_pdf_state.json"
INGEST_SCRIPT = SCRIPT_DIR / "ingest_pdf_to_supabase.py"


def sha1_file(path: Path) -> str:
    h = hashlib.sha1()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def load_state() -> Dict[str, str]:
    if not STATE_PATH.exists():
        return {}
    try:
        return json.loads(STATE_PATH.read_text())
    except Exception:
        return {}


def save_state(state: Dict[str, str]) -> None:
    STATE_PATH.write_text(json.dumps(state, indent=2, ensure_ascii=False))


def discover_pdfs(folder: Path):
    return sorted([p for p in folder.glob("*.pdf") if p.is_file()])


def run_ingest(pdf_path: Path, source_type: str) -> int:
    title = pdf_path.stem
    cmd = [
        "python",
        str(INGEST_SCRIPT),
        "--pdf",
        str(pdf_path),
        "--source-type",
        source_type,
        "--title",
        title,
    ]
    print(f"[ingest] {' '.join(cmd)}")
    proc = subprocess.run(cmd)
    return proc.returncode


def scan_and_ingest(pdf_dir: Path, source_type: str, state: Dict[str, str]) -> Dict[str, str]:
    pdfs = discover_pdfs(pdf_dir)
    if not pdfs:
        print(f"[scan] no PDFs found in: {pdf_dir}")
        return state

    for pdf in pdfs:
        digest = sha1_file(pdf)
        key = str(pdf.resolve())
        if state.get(key) == digest:
            continue

        print(f"[scan] new/updated PDF: {pdf.name}")
        code = run_ingest(pdf, source_type)
        if code == 0:
            state[key] = digest
            save_state(state)
            print(f"[ok] ingested: {pdf.name}")
        else:
            print(f"[error] failed: {pdf.name} (exit={code})")

    return state


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--pdf-dir", default=str(DEFAULT_PDF_DIR))
    parser.add_argument("--source-type", default="manual_pdf")
    parser.add_argument("--interval", type=int, default=30, help="seconds")
    parser.add_argument("--once", action="store_true")
    args = parser.parse_args()

    pdf_dir = Path(args.pdf_dir).resolve()
    if not pdf_dir.exists():
        raise FileNotFoundError(f"PDF folder not found: {pdf_dir}")

    os.chdir(SCRIPT_DIR)  # ensure .env in ingest folder is picked up

    state = load_state()
    state = scan_and_ingest(pdf_dir, args.source_type, state)

    if args.once:
        return

    print(f"[watch] watching {pdf_dir} every {args.interval}s")
    while True:
        time.sleep(max(5, args.interval))
        state = scan_and_ingest(pdf_dir, args.source_type, state)


if __name__ == "__main__":
    main()
