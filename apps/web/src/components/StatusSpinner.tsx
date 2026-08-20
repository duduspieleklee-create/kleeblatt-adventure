export type SpinnerState = "idle" | "checking" | "valid" | "invalid";

/**
 * Small rotating circle used for live field validation.
 * - idle:    hidden
 * - checking:amber, spinning
 * - valid:   green
 * - invalid: red
 */
export function StatusSpinner({ state }: { state: SpinnerState }) {
  if (state === "idle") return null;
  const cls =
    state === "valid"
      ? "status-spinner status-spinner-valid"
      : state === "invalid"
        ? "status-spinner status-spinner-invalid"
        : "status-spinner status-spinner-checking";
  return <span className={cls} role="status" aria-label={state} />;
}
