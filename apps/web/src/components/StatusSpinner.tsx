export type SpinnerState = "idle" | "checking" | "valid" | "invalid";

/**
 * Live field-validation indicator.
 * - idle:     hidden
 * - checking: amber, spinning circle (async availability check)
 * - valid:    green checkmark
 * - invalid:  red cross
 */
export function StatusSpinner({ state }: { state: SpinnerState }) {
  if (state === "idle") return null;

  if (state === "checking") {
    return (
      <span
        className="status-spinner status-spinner-checking"
        role="status"
        aria-label="checking"
      />
    );
  }

  if (state === "valid") {
    return (
      <span className="status-check" role="status" aria-label="valid">
        ✓
      </span>
    );
  }

  // invalid
  return (
    <span className="status-cross" role="status" aria-label="invalid">
      ✗
    </span>
  );
}
