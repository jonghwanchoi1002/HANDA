"use client";
import { useEffect, useId, useRef, useState } from "react";
import { normalizeLineHeight } from "@/lib/content/rich-text";
import common from "@/app/login/auth.module.css";
import styles from "./leave-dialog.module.css";
import editorStyles from "./rich-text-editor.module.css";

export type ParagraphSpacing = { lineHeight: string; spaceBefore: number; spaceAfter: number };
export default function ParagraphSpacingDialog({ initial, onApply, onCancel }: { initial: ParagraphSpacing | null; onApply: (values: ParagraphSpacing) => void; onCancel: () => void }) {
  const id = useId();
  const ref = useRef<HTMLDialogElement>(null);
  const first = useRef<HTMLInputElement>(null);
  const [line, setLine] = useState("1.8");
  const [before, setBefore] = useState("0");
  const [after, setAfter] = useState("12");
  useEffect(() => {
    const dialog = ref.current!;
    if (initial) {
      setLine(initial.lineHeight); setBefore(String(initial.spaceBefore)); setAfter(String(initial.spaceAfter));
      if (!dialog.open) dialog.showModal();
      requestAnimationFrame(() => first.current?.focus());
    } else if (dialog.open) dialog.close();
  }, [initial]);
  function apply() {
    const inputs = Array.from(ref.current?.querySelectorAll("input") ?? []);
    if (inputs.some(input => !input.reportValidity())) return;
    const lineHeight = normalizeLineHeight(String(Number(line)));
    if (!lineHeight) return;
    onApply({ lineHeight, spaceBefore: Number(before), spaceAfter: Number(after) });
  }
  return <dialog ref={ref} className={styles.dialog} aria-labelledby={`${id}-title`} onCancel={event => { event.preventDefault(); onCancel(); }} onKeyDown={event => { if (event.key === "Enter" && event.target instanceof HTMLInputElement) { event.preventDefault(); apply(); } }}>
    <h2 id={`${id}-title`}>맞춤 간격</h2>
    <fieldset className={editorStyles.spacingFields} disabled={!initial}>
      <div><label>줄 간격<input aria-describedby={`${id}-hint`} ref={first} type="number" min="0.5" max="5" step="0.01" required value={line} onChange={event => setLine(event.target.value)}/></label><span id={`${id}-hint`}>0.5~5배</span></div>
      <label>단락 앞 간격 (px)<input type="number" min="0" max="120" step="1" required value={before} onChange={event => setBefore(event.target.value)}/></label>
      <label>단락 뒤 간격 (px)<input type="number" min="0" max="120" step="1" required value={after} onChange={event => setAfter(event.target.value)}/></label>
    </fieldset>
    <div className={styles.controls}><button type="button" className={common.button} onClick={onCancel}>취소</button><button type="button" className={`${common.button} ${common.primary}`} onClick={apply}>적용</button></div>
  </dialog>;
}
