import styles from "@/app/login/auth.module.css";
export default function ApprovalWaiting({name,email,stopped=false}:{name:string;email:string;stopped?:boolean}){
  return <>
    <p className={styles.eyebrow}>MY HANDA</p>
    <h1>{name}님, 안녕하세요.</h1>
    <p className={styles.intro} style={{overflowWrap:"anywhere"}}>{email}</p>
    <section className={styles.box} aria-labelledby="approval-status-title">
      <h2 id="approval-status-title">{stopped?"이용 승인이 중지되었습니다":"이용 승인 요청 대기 중"}</h2>
      <p className={styles.intro}>{stopped?"현재 비즈니스 위키 열람과 글 작성이 제한되어 있습니다. 이용 재개를 원하시거나 궁금한 점이 있으시면 관리자에게 문의해 주세요.":"가입 신청이 접수되었습니다. 관리자가 확인한 뒤 이용을 승인해 드립니다."}</p>
      <p className={styles.intro}>{stopped?"공개된 소개와 정기모임 후기는 계속 볼 수 있습니다. 관리자가 다시 승인하면 회원 전용 기능을 이용할 수 있습니다.":"공개된 소개와 정기모임 후기는 계속 볼 수 있습니다. 비즈니스 위키는 이용 승인 후 이용할 수 있습니다."}</p>
    </section>
  </>;
}
