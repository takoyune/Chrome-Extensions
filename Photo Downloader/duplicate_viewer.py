"""
duplicate_viewer.py — Side-by-side duplicate image comparison tool
Scans a folder for duplicate image pairs and lets you decide which to delete.

Usage:
    python duplicate_viewer.py
    python duplicate_viewer.py --folder "path/to/images"
"""

import os
import re
import sys
import argparse
import hashlib
import tkinter as tk
from tkinter import ttk, messagebox, font as tkfont
from pathlib import Path
from PIL import Image, ImageTk


# ─── Config ────────────────────────────────────────────────────────────
DEFAULT_FOLDER = Path(__file__).parent / "images"
PREVIEW_SIZE   = (480, 420)   # max display size per image panel
BG             = "#111116"
SURFACE        = "#1c1c23"
BORDER         = "#2a2a35"
TEXT           = "#f0f0f5"
TEXT_MUTED     = "#888899"
ACCENT         = "#e8386d"
GREEN          = "#22c55e"
YELLOW         = "#f59e0b"
BTN_RADIUS     = 8


# ─── Duplicate Finder ──────────────────────────────────────────────────
def find_duplicate_pairs(folder: Path) -> list[tuple[Path, Path]]:
    """
    Find pairs of files that share the same image key (Fanbox filename hash).
    Fanbox naming: fanbox_POSTID_NN_IMAGEKEY.jpeg
    Groups by IMAGEKEY, then pairs within the group by size (small vs large).
    Also finds exact hash duplicates with different full filenames.
    """
    files = sorted(folder.glob("*.jpeg")) + sorted(folder.glob("*.jpg")) + sorted(folder.glob("*.png"))

    # ── Group by image key (the random hash part of the Fanbox filename)
    key_groups: dict[str, list[Path]] = {}

    for f in files:
        m = re.match(r'^fanbox_\d+_\d+_(.+)$', f.name)
        if m:
            key = m.group(1)
        else:
            key = f.name  # ungrouped / loose file

        key_groups.setdefault(key, []).append(f)

    pairs: list[tuple[Path, Path]] = []
    seen: set[frozenset] = set()

    for key, group in key_groups.items():
        if len(group) < 2:
            continue
        # Sort by file size ascending — smaller first (likely thumbnail)
        group_sorted = sorted(group, key=lambda f: f.stat().st_size)
        # Pair them: (smallest, largest), (2nd smallest, 3rd smallest) etc.
        for i in range(0, len(group_sorted) - 1, 2):
            a, b = group_sorted[i], group_sorted[i + 1]
            key_pair = frozenset([a, b])
            if key_pair not in seen:
                seen.add(key_pair)
                pairs.append((a, b))
        # If odd count, pair last two regardless
        if len(group_sorted) % 2 == 1 and len(group_sorted) >= 3:
            a, b = group_sorted[-2], group_sorted[-1]
            key_pair = frozenset([a, b])
            if key_pair not in seen:
                seen.add(key_pair)
                pairs.append((a, b))

    # ── Also find exact hash duplicates (e.g. "(1)" copies)
    hash_groups: dict[str, list[Path]] = {}
    for f in files:
        h = hashlib.md5(f.read_bytes()).hexdigest()
        hash_groups.setdefault(h, []).append(f)

    for h, group in hash_groups.items():
        if len(group) < 2:
            continue
        for i in range(len(group) - 1):
            a, b = group[i], group[i + 1]
            key_pair = frozenset([a, b])
            if key_pair not in seen:
                seen.add(key_pair)
                pairs.append((a, b))

    return pairs


# ─── Helpers ────────────────────────────────────────────────────────────
def human_size(bytes_: int) -> str:
    for unit in ("B", "KB", "MB", "GB"):
        if bytes_ < 1024:
            return f"{bytes_:.1f} {unit}"
        bytes_ /= 1024
    return f"{bytes_:.1f} GB"


def load_thumbnail(path: Path, max_size: tuple[int, int]) -> ImageTk.PhotoImage:
    img = Image.open(path)
    img.thumbnail(max_size, Image.LANCZOS)
    return ImageTk.PhotoImage(img)


def get_image_dims(path: Path) -> str:
    try:
        with Image.open(path) as img:
            return f"{img.width} × {img.height} px"
    except Exception:
        return "? × ? px"


# ─── Main App ────────────────────────────────────────────────────────────
class DuplicateViewer(tk.Tk):
    def __init__(self, folder: Path):
        super().__init__()
        self.folder = folder
        self.pairs: list[tuple[Path, Path]] = []
        self.index = 0
        self.deleted: list[str] = []
        self.skipped = 0
        self._photo_left  = None   # keep reference to prevent GC
        self._photo_right = None

        self.title("Duplicate Image Viewer")
        self.configure(bg=BG)
        self.resizable(True, True)
        self._build_ui()
        self._load_pairs()

    # ── UI Builder ────────────────────────────────────────────────────
    def _build_ui(self):
        self.columnconfigure(0, weight=1)
        self.rowconfigure(2, weight=1)

        # ── Top bar (title + progress label)
        top = tk.Frame(self, bg=BG)
        top.grid(row=0, column=0, sticky="ew", padx=20, pady=(14, 0))
        top.columnconfigure(1, weight=1)

        tk.Label(top, text="Duplicate Viewer", bg=BG, fg=TEXT,
                 font=("Segoe UI", 15, "bold")).grid(row=0, column=0, sticky="w")

        self.lbl_progress = tk.Label(top, text="", bg=BG, fg=TEXT_MUTED,
                                      font=("Segoe UI", 10))
        self.lbl_progress.grid(row=0, column=1, sticky="e")

        # ── Settings row
        settings_row = tk.Frame(self, bg=SURFACE)
        settings_row.grid(row=1, column=0, sticky="ew", padx=0, pady=(6, 0))
        settings_row.columnconfigure(1, weight=1)

        tk.Label(settings_row, text="  ⚙  Settings:", bg=SURFACE, fg=TEXT_MUTED,
                 font=("Segoe UI", 9, "bold"), padx=6, pady=5).grid(row=0, column=0, sticky="w")

        # "Ask confirmation" checkbox
        self.confirm_var = tk.BooleanVar(value=True)
        chk = tk.Checkbutton(
            settings_row,
            text="Ask confirmation before delete",
            variable=self.confirm_var,
            bg=SURFACE, fg=TEXT, activebackground=SURFACE, activeforeground=TEXT,
            selectcolor=BG,
            font=("Segoe UI", 9),
            cursor="hand2",
        )
        chk.grid(row=0, column=1, sticky="w", padx=(4, 0))

        # ── Progress bar
        style = ttk.Style(self)
        style.theme_use("clam")
        style.configure("Pink.Horizontal.TProgressbar",
                        troughcolor=BORDER, background=ACCENT,
                        bordercolor=BORDER, lightcolor=ACCENT, darkcolor=ACCENT)
        self.progressbar = ttk.Progressbar(self, style="Pink.Horizontal.TProgressbar",
                                            orient="horizontal", mode="determinate")
        self.progressbar.grid(row=2, column=0, sticky="ew", padx=20, pady=(6, 0))

        # ── Image panels container
        panels = tk.Frame(self, bg=BG)
        panels.grid(row=3, column=0, sticky="nsew", padx=20, pady=12)
        panels.columnconfigure(0, weight=1)
        panels.columnconfigure(1, weight=1)
        self.rowconfigure(3, weight=1)

        self.left_panel  = self._make_panel(panels, 0)
        self.right_panel = self._make_panel(panels, 1)

        # ── Divider
        tk.Frame(panels, bg=BORDER, width=2).grid(row=0, column=2, sticky="ns", padx=6)

        # ── Action buttons
        btn_row = tk.Frame(self, bg=BG)
        btn_row.grid(row=4, column=0, sticky="ew", padx=20, pady=(0, 8))
        btn_row.columnconfigure((0, 1, 2, 3), weight=1)

        self.btn_del_left = self._make_btn(btn_row, "🗑  Delete LEFT\n(keep right)",
                                            ACCENT, self._delete_left, 0)
        self.btn_keep     = self._make_btn(btn_row, "✓  Keep BOTH\n(skip pair)",
                                            "#2a4a2e", self._keep_both, 1)
        self.btn_del_right= self._make_btn(btn_row, "🗑  Delete RIGHT\n(keep left)",
                                            ACCENT, self._delete_right, 2)
        self.btn_undo     = self._make_btn(btn_row, "↩  Undo last\ndelete",
                                            "#3a2a1a", self._undo, 3)

        # ── Status bar
        self.lbl_status = tk.Label(self, text="", bg=SURFACE, fg=TEXT_MUTED,
                                    font=("Segoe UI", 9), anchor="w", padx=12, pady=4)
        self.lbl_status.grid(row=5, column=0, sticky="ew")

        self.minsize(1050, 680)

    def _make_panel(self, parent, col) -> dict:
        frame = tk.Frame(parent, bg=SURFACE, bd=0, relief="flat",
                         highlightbackground=BORDER, highlightthickness=1)
        frame.grid(row=0, column=col, sticky="nsew", padx=(0 if col == 2 else 4))
        frame.columnconfigure(0, weight=1)
        frame.rowconfigure(1, weight=1)

        side = "LEFT" if col == 0 else "RIGHT"
        lbl_side = tk.Label(frame, text=side, bg=SURFACE, fg=ACCENT,
                             font=("Segoe UI", 8, "bold"), anchor="w", padx=10, pady=4)
        lbl_side.grid(row=0, column=0, sticky="ew")

        img_label = tk.Label(frame, bg=SURFACE, cursor="hand2")
        img_label.grid(row=1, column=0, sticky="nsew", padx=8, pady=4)

        info_frame = tk.Frame(frame, bg=SURFACE)
        info_frame.grid(row=2, column=0, sticky="ew", padx=8, pady=(0, 8))
        info_frame.columnconfigure(0, weight=1)

        lbl_name = tk.Label(info_frame, text="", bg=SURFACE, fg=TEXT,
                             font=("Segoe UI", 9, "bold"), wraplength=440,
                             justify="left", anchor="w")
        lbl_name.grid(row=0, column=0, sticky="ew")

        lbl_meta = tk.Label(info_frame, text="", bg=SURFACE, fg=TEXT_MUTED,
                             font=("Segoe UI", 8), justify="left", anchor="w")
        lbl_meta.grid(row=1, column=0, sticky="ew")

        return {"frame": frame, "img": img_label, "name": lbl_name, "meta": lbl_meta}

    def _make_btn(self, parent, text, color, cmd, col) -> tk.Button:
        btn = tk.Button(parent, text=text, command=cmd,
                        bg=color, fg=TEXT, activebackground=ACCENT, activeforeground=TEXT,
                        relief="flat", bd=0, cursor="hand2",
                        font=("Segoe UI", 10, "bold"),
                        padx=14, pady=10, wraplength=180)
        btn.grid(row=0, column=col, sticky="ew", padx=4, pady=6)
        btn.bind("<Enter>", lambda e, b=btn, c=color: b.configure(bg=self._lighten(c)))
        btn.bind("<Leave>", lambda e, b=btn, c=color: b.configure(bg=c))
        return btn

    @staticmethod
    def _lighten(hex_color: str) -> str:
        """Make a hex color slightly lighter for hover."""
        try:
            r = int(hex_color[1:3], 16)
            g = int(hex_color[3:5], 16)
            b = int(hex_color[5:7], 16)
            r = min(255, r + 30)
            g = min(255, g + 30)
            b = min(255, b + 30)
            return f"#{r:02x}{g:02x}{b:02x}"
        except Exception:
            return hex_color

    # ── Data Loading ──────────────────────────────────────────────────
    def _load_pairs(self):
        self.lbl_status.configure(text="Scanning for duplicates…")
        self.update()
        self.pairs = find_duplicate_pairs(self.folder)

        if not self.pairs:
            messagebox.showinfo("No Duplicates", "No duplicate images found in the folder! 🎉")
            self.quit()
            return

        self.progressbar.configure(maximum=len(self.pairs))
        self._show_pair()

    def _show_pair(self):
        if self.index >= len(self.pairs):
            self._show_done()
            return

        left_path, right_path = self.pairs[self.index]
        total = len(self.pairs)

        # Progress
        self.lbl_progress.configure(
            text=f"Pair {self.index + 1} of {total}  •  {total - self.index - 1} remaining  •  {len(self.deleted)} deleted")
        self.progressbar["value"] = self.index

        # Load images
        try:
            self._photo_left  = load_thumbnail(left_path,  PREVIEW_SIZE)
            self._photo_right = load_thumbnail(right_path, PREVIEW_SIZE)
        except Exception as e:
            self.lbl_status.configure(text=f"Error loading: {e}")
            self._advance()
            return

        self._update_panel(self.left_panel,  left_path,  self._photo_left)
        self._update_panel(self.right_panel, right_path, self._photo_right)

        # Highlight the smaller (likely preview/duplicate) panel
        left_size  = left_path.stat().st_size
        right_size = right_path.stat().st_size
        if left_size < right_size:
            self.left_panel["frame"].configure(highlightbackground=YELLOW, highlightthickness=2)
            self.right_panel["frame"].configure(highlightbackground=GREEN,  highlightthickness=2)
            hint = "⚠ LEFT is smaller (likely the preview thumbnail)"
        elif right_size < left_size:
            self.left_panel["frame"].configure(highlightbackground=GREEN,  highlightthickness=2)
            self.right_panel["frame"].configure(highlightbackground=YELLOW, highlightthickness=2)
            hint = "⚠ RIGHT is smaller (likely the preview thumbnail)"
        else:
            self.left_panel["frame"].configure(highlightbackground=BORDER, highlightthickness=1)
            self.right_panel["frame"].configure(highlightbackground=BORDER, highlightthickness=1)
            hint = "Both files are identical in size"

        self.lbl_status.configure(text=f"  {hint}   |   Deleted so far: {len(self.deleted)} files   |   Skipped: {self.skipped}")

    def _update_panel(self, panel: dict, path: Path, photo: ImageTk.PhotoImage):
        panel["img"].configure(image=photo)
        panel["name"].configure(text=path.name)
        size_str = human_size(path.stat().st_size)
        dims_str = get_image_dims(path)
        panel["meta"].configure(text=f"{size_str}   ·   {dims_str}   ·   {path.parent.name}/")

    # ── Actions ───────────────────────────────────────────────────────
    def _delete_left(self):
        path = self.pairs[self.index][0]
        if self._confirm_delete(path):
            path.unlink()
            self.deleted.append(str(path))
            self._advance()

    def _delete_right(self):
        path = self.pairs[self.index][1]
        if self._confirm_delete(path):
            path.unlink()
            self.deleted.append(str(path))
            self._advance()

    def _keep_both(self):
        self.skipped += 1
        self._advance()

    def _confirm_delete(self, path: Path) -> bool:
        """Return True if we should proceed with deletion.
        If 'confirm_var' is False, skip the dialog entirely."""
        if not self.confirm_var.get():
            return True   # no confirmation needed — delete immediately
        return messagebox.askyesno(
            "Confirm Delete",
            f"Delete this file?\n\n{path.name}\n({human_size(path.stat().st_size)})",
            icon="warning"
        )

    def _undo(self):
        if not self.deleted:
            messagebox.showinfo("Nothing to Undo", "No files have been deleted yet.")
            return
        last = Path(self.deleted[-1])
        messagebox.showinfo("Cannot Undo",
                            f"File has already been deleted:\n{last.name}\n\n"
                            "Undo is not supported for permanent deletes.\n"
                            "Check your Recycle Bin if you need to recover it.")

    def _advance(self):
        self.index += 1
        self._show_pair()

    # ── Done Screen ───────────────────────────────────────────────────
    def _show_done(self):
        for widget in self.winfo_children():
            widget.destroy()

        self.configure(bg=BG)
        frame = tk.Frame(self, bg=BG)
        frame.place(relx=0.5, rely=0.5, anchor="center")

        tk.Label(frame, text="✓", bg=BG, fg=GREEN,
                 font=("Segoe UI", 64)).pack()
        tk.Label(frame, text="All pairs reviewed!", bg=BG, fg=TEXT,
                 font=("Segoe UI", 20, "bold")).pack(pady=(0, 8))
        tk.Label(frame, text=f"Deleted:  {len(self.deleted)} file(s)\nSkipped:  {self.skipped} pair(s)",
                 bg=BG, fg=TEXT_MUTED, font=("Segoe UI", 12), justify="center").pack()

        if self.deleted:
            tk.Label(frame, text="\nDeleted files:", bg=BG, fg=TEXT_MUTED,
                     font=("Segoe UI", 10, "bold")).pack(anchor="w", padx=20)
            listbox = tk.Listbox(frame, bg=SURFACE, fg=TEXT_MUTED, relief="flat",
                                  font=("Consolas", 8), height=min(10, len(self.deleted)),
                                  width=80, selectbackground=ACCENT)
            listbox.pack(padx=20, pady=4)
            for name in self.deleted:
                listbox.insert(tk.END, Path(name).name)

        tk.Button(frame, text="Close", command=self.quit,
                  bg=ACCENT, fg=TEXT, relief="flat", font=("Segoe UI", 11, "bold"),
                  padx=24, pady=8, cursor="hand2").pack(pady=16)


# ─── Entry Point ────────────────────────────────────────────────────────
def main():
    parser = argparse.ArgumentParser(description="Duplicate image comparison viewer")
    parser.add_argument("--folder", type=Path, default=DEFAULT_FOLDER,
                        help="Folder to scan for duplicate images")
    args = parser.parse_args()

    folder = args.folder.resolve()
    if not folder.exists():
        print(f"Error: folder not found: {folder}")
        sys.exit(1)

    app = DuplicateViewer(folder)
    app.mainloop()


if __name__ == "__main__":
    main()
