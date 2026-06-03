export function downloadCSV(data: Record<string, any>[], filename: string): void {
  if (!data.length) return;
  const headers = Object.keys(data[0]);
  const rows = data.map(row =>
    headers.map(h => {
      const val = row[h] ?? "";
      const str = String(val).replace(/"/g, '""');
      return str.includes(",") || str.includes("\n") ? `"${str}"` : str;
    }).join(",")
  );
  const csv = [headers.join(","), ...rows].join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = `${filename}-${new Date().toISOString().split("T")[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function showExportMenu(
  data: Record<string, any>[],
  baseFilename: string,
  anchorEl: HTMLElement
): void {
  document.getElementById("gst-export-menu")?.remove();
  const menu = document.createElement("div");
  menu.id = "gst-export-menu";
  Object.assign(menu.style, {
    position: "absolute", background: "white", border: "1px solid #e5e7eb",
    borderRadius: "8px", boxShadow: "0 4px 12px rgba(0,0,0,.12)",
    zIndex: "9999", padding: "4px 0", minWidth: "180px", fontSize: "13px"
  });
  const rect = anchorEl.getBoundingClientRect();
  menu.style.top  = `${rect.bottom + window.scrollY + 4}px`;
  menu.style.left = `${rect.left  + window.scrollX}px`;

  const makeItem = (label: string, onClick: () => void) => {
    const item = document.createElement("div");
    item.textContent = label;
    Object.assign(item.style, { padding: "8px 16px", cursor: "pointer", color: "#374151" });
    item.onmouseenter = () => { item.style.background = "#f3f4f6"; };
    item.onmouseleave = () => { item.style.background = ""; };
    item.onclick = () => { onClick(); menu.remove(); };
    return item;
  };

  menu.appendChild(makeItem("⬇  Download as CSV",   () => downloadCSV(data, baseFilename)));
  menu.appendChild(makeItem("⬇  Download as Excel",  () => downloadCSV(data, `${baseFilename}-excel`)));
  document.body.appendChild(menu);
  const close = (e: MouseEvent) => {
    if (!menu.contains(e.target as Node)) { menu.remove(); document.removeEventListener("click", close); }
  };
  setTimeout(() => document.addEventListener("click", close), 10);
}
