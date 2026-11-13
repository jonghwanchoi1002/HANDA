"use client";

import { useId, useState, type InputHTMLAttributes } from "react";
import styles from "@/app/login/auth.module.css";

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & { label: string; error?: string };

export default function PasswordInput({ label, error, id, ...inputProps }: Props) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const [visible, setVisible] = useState(false);
  const description = [inputProps["aria-describedby"], error ? `${inputId}-error` : undefined].filter(Boolean).join(" ") || undefined;
  return <div className={styles.passwordField}>
    <label htmlFor={inputId}>{label}</label>
    <div className={styles.passwordControl}>
      <input {...inputProps} id={inputId} type={visible ? "text" : "password"} aria-invalid={Boolean(error)} aria-describedby={description}/>
      <button type="button" className={styles.passwordToggle} disabled={inputProps.disabled} aria-label={`${label} ${visible ? "숨기기" : "보기"}`} aria-pressed={visible} onClick={() => setVisible(value => !value)}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>{visible && <path d="m3 3 18 18"/>}
        </svg>
      </button>
    </div>
    {error && <p className={styles.fieldError} id={`${inputId}-error`} role="alert">{error}</p>}
  </div>;
}
