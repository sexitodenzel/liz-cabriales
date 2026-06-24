export default function CurtainFooterSpacer() {
  return (
    <div
      id="footer-reveal-sentinel"
      className="curtain-footer-spacer shrink-0 bg-transparent"
      aria-hidden="true"
      style={{ height: "var(--footer-stage-h, 0px)" }}
    />
  )
}
