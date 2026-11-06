"use client";
import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";
import styles from "./nav-dropdown.module.css";

export default function NavDropdown({label,children,active=false}:{label:string;children:React.ReactNode;active?:boolean}) {
  const [open,setOpen]=useState(false);
  const [position,setPosition]=useState({top:0,left:0});
  const trigger=useRef<HTMLButtonElement>(null);const panel=useRef<HTMLDivElement>(null);
  const id=useId();const path=usePathname();
  // 경로가 바뀌면 이전 메뉴를 닫되 상단 내비바 자체는 유지합니다.
  const [openedAt,setOpenedAt]=useState(path);
  const visible=open && openedAt===path;
  function show(){
    const box=trigger.current!.getBoundingClientRect();
    setPosition({top:box.bottom+8,left:Math.max(12,Math.min(box.right-224,window.innerWidth-236))});
    setOpenedAt(path);setOpen(!visible);
  }
  useEffect(()=>{
    if(!visible)return;
    const outside=(event:PointerEvent)=>{if(!panel.current?.contains(event.target as Node)&&!trigger.current?.contains(event.target as Node))setOpen(false);};
    const escape=(event:KeyboardEvent)=>{if(event.key==="Escape"){setOpen(false);trigger.current?.focus();}};
    const close=()=>setOpen(false);
    const reposition=()=>{
      const box=trigger.current?.getBoundingClientRect();if(!box)return;
      const next={top:box.bottom+8,left:Math.max(12,Math.min(box.right-224,window.innerWidth-236))};
      setPosition(previous=>previous.top===next.top&&previous.left===next.left?previous:next);
    };
    const focusOutside=(event:FocusEvent)=>{if(!panel.current?.contains(event.target as Node)&&!trigger.current?.contains(event.target as Node))setOpen(false);};
    document.addEventListener("pointerdown",outside);document.addEventListener("keydown",escape);document.addEventListener("focusin",focusOutside);window.addEventListener("resize",close);window.addEventListener("scroll",reposition,true);
    return ()=>{document.removeEventListener("pointerdown",outside);document.removeEventListener("keydown",escape);document.removeEventListener("focusin",focusOutside);window.removeEventListener("resize",close);window.removeEventListener("scroll",reposition,true);};
  },[visible]);
  return <><button ref={trigger} type="button" className={`${styles.trigger} ${active?styles.active:""}`} aria-label={label} aria-expanded={visible} aria-controls={visible?id:undefined} onClick={show} onKeyDown={event=>{
    if(event.key==="ArrowDown"){event.preventDefault();if(!visible)show();requestAnimationFrame(()=>panel.current?.querySelector<HTMLElement>("a,button")?.focus());}
    if(event.key==="Tab"&&!event.shiftKey&&visible){event.preventDefault();panel.current?.querySelector<HTMLElement>("a,button")?.focus();}
  }}>{label}<span aria-hidden="true">▾</span></button>
  {visible && createPortal(<div id={id} ref={panel} className={styles.panel} style={position} onKeyDown={event=>{
    if(!["ArrowDown","ArrowUp","Home","End"].includes(event.key))return;
    const items=Array.from(panel.current!.querySelectorAll<HTMLElement>("a,button:not(:disabled)"));if(!items.length)return;
    event.preventDefault();const index=items.indexOf(document.activeElement as HTMLElement);const next=event.key==="Home"?0:event.key==="End"?items.length-1:(index+(event.key==="ArrowDown"?1:-1)+items.length)%items.length;items[next].focus();
  }} onClick={event=>{if((event.target as HTMLElement).closest("a"))setOpen(false);}}><nav aria-label={`${label} 하위 메뉴`}>{children}</nav></div>,document.body)}</>;
}
