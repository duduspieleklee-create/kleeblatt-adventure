---
name: "detect-redundant-diagnostic-repetition"
description: "Handle redundant diagnostic repetition to prevent message loops and ensure efficient processing."
---

# Detect and Handle Redundant Diagnostic Repetition

## When to Use
When analyzing system diagnostics where identical conclusions are repeatedly generated with no new information.

## Procedure
1. **Identify Repetitive Patterns**: Monitor for identical or near-identical outputs
2. **Check for New Information**: Verify each iteration adds meaningful insights
3. **Implement Early Termination**: Stop identical outputs once core findings established
4. **Summarize Key Findings**: Provide consolidated conclusion instead of repetition
5. **Flag for Human Review**: Alert if pattern exceeds expected repetition limits

## Evidenced Pitfalls
- Repeated identical message generation without new insights
- Uncontrolled loop creation during repetitive analysis
- Inefficient resource use
- System blocking from excessive repetition

## Verification Step
Confirm diagnostic conclusions are captured in single consolidated report rather than repeated iterations.
