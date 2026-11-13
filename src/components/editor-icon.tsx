type IconName = "left" | "center" | "right" | "justify" | "spacing" | "indent" | "outdent" | "bullet" | "numbered" | "clear" | "undo" | "redo" | "chevron";

export default function EditorIcon({ name }: { name: IconName }) {
  const lines = name === "center" ? [[4, 4, 20, 4], [7, 9, 17, 9], [4, 14, 20, 14], [7, 19, 17, 19]]
    : name === "right" ? [[4, 4, 20, 4], [9, 9, 20, 9], [4, 14, 20, 14], [9, 19, 20, 19]]
    : name === "justify" ? [[4, 4, 20, 4], [4, 9, 20, 9], [4, 14, 20, 14], [4, 19, 20, 19]]
    : name === "left" ? [[4, 4, 20, 4], [4, 9, 15, 9], [4, 14, 20, 14], [4, 19, 15, 19]] : [];
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {lines.map(([x1, y1, x2, y2], index) => <line key={index} x1={x1} y1={y1} x2={x2} y2={y2}/>)}
    {name === "spacing" && <><path d="M6 3v18m-3-3 3 3 3-3M3 6l3-3 3 3M13 5h8M13 12h8M13 19h8"/></>}
    {(name === "indent" || name === "outdent") && <><path d="M3 4h18M11 9h10M11 14h10M3 20h18"/><path d={name === "indent" ? "m3 8 4 4-4 4" : "m7 8-4 4 4 4"}/></>}
    {name === "bullet" && <><circle cx="4" cy="5" r="1" fill="currentColor"/><circle cx="4" cy="12" r="1" fill="currentColor"/><circle cx="4" cy="19" r="1" fill="currentColor"/><path d="M9 5h12M9 12h12M9 19h12"/></>}
    {name === "numbered" && <><path d="m3 4 2-1v6M3 9h4M3 15c0-3 4-3 4-1 0 2-4 3-4 6h4M11 5h10M11 12h10M11 19h10"/></>}
    {name === "clear" && <><path d="M5 4h13M12 4 8 18M3 21l18-18M15 18l5 5m0-5-5 5"/></>}
    {name === "undo" && <path d="M8 5 3 10l5 5M3 10h11a6 6 0 0 1 0 12"/>}
    {name === "redo" && <path d="m16 5 5 5-5 5m5-5H10a6 6 0 0 0 0 12"/>}
    {name === "chevron" && <path d="m8 10 4 4 4-4"/>}
  </svg>;
}
