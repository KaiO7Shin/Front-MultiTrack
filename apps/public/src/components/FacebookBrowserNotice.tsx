import { useEffect, useRef, useState } from "react";
import {
  FACEBOOK_BROWSER_NOTICE_EVENT,
  facebookBrowserNoticeRequested,
} from "../lib/facebookBrowser";

export function FacebookBrowserNotice() {
  const [visible, setVisible] = useState(facebookBrowserNoticeRequested);
  const noticeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sync = () => setVisible(facebookBrowserNoticeRequested());
    window.addEventListener(FACEBOOK_BROWSER_NOTICE_EVENT, sync);
    return () => window.removeEventListener(FACEBOOK_BROWSER_NOTICE_EVENT, sync);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    const node = noticeRef.current;
    if (!visible || !node) {
      root.style.setProperty("--facebook-notice-offset", "0px");
      return;
    }

    const apply = () => {
      root.style.setProperty("--facebook-notice-offset", `${node.offsetHeight}px`);
    };
    apply();
    const observer = new ResizeObserver(apply);
    observer.observe(node);
    return () => {
      observer.disconnect();
      root.style.setProperty("--facebook-notice-offset", "0px");
    };
  }, [visible]);

  if (!visible) return null;

  return (
    <div className="facebook-browser-notice" role="status" ref={noticeRef}>
      <p className="site-shell">
        Le navigateur de Facebook ne peut pas terminer cette action.
        Touchez ⋯ en bas de l’écran, puis « Ouvrir dans le navigateur ».
      </p>
    </div>
  );
}
