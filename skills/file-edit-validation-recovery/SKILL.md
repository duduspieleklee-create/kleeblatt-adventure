---
name: "file-edit-validation-recovery"
description: "Recover from tool validation errors when editing files with malformed arguments"
---

# File Edit Validation Recovery

When editing files using the `edit` tool, encounter validation errors due to malformed arguments (e.g., "edits: must be array").

## When to Use
- When the `edit` tool returns validation errors related to argument formatting
- When attempting to modify files with incorrect JSON structure
- When receiving errors about required fields not being properly formatted

## Procedure
1. Identify the specific validation error message from the tool response
2. Examine the current arguments passed to the tool call
3. Correct the JSON structure to meet tool requirements:
   - Ensure "edits" is an array even when single edit
   - Verify all required fields are present with correct types
   - Maintain proper JSON formatting with correct escaping
4. Retry the tool call with corrected arguments
5. If multiple edits are needed, ensure each edit object contains both "oldText" and "newText" fields

## Pitfalls
- Not properly formatting "edits" as an array when it's a single edit
- Incorrect escaping of special characters in text content
- Omitting required fields in edit objects
- Using incorrect JSON syntax that violates tool expectations

## Verification
After correcting arguments, verify the edit worked by:
1. Confirming the tool returns success rather than validation error
2. Checking that the target file contains the expected modifications
3. Validating that the modified content matches intended changes
