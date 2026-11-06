import styles from "@/app/login/auth.module.css";
export default function ApprovalWaiting({name,email}:{name:string;email:string}){
  return <><p className={styles.eyebrow}>MY HANDA</p><h1>{name}님, 안녕하세요.</h1><p className={styles.intro} style={{overflowWrap:"anywhere"}}>{email}</p><section className={styles.box} aria-labelledby="approval-waiting-title"><h2 id="approval-waiting-title">이용 승인 요청 대기 중</h2><p className={styles.intro}>가입 신청이 접수되었습니다. 관리자가 확인한 뒤 이용을 승인해 드립니다.</p><p className={styles.intro}>공개된 소개와 정기모임 후기는 계속 볼 수 있습니다. 비즈니스 위키는 이용 승인 후 이용할 수 있습니다.</p></section></>;
}
