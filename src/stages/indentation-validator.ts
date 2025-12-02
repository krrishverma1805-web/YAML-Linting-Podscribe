

export interface IndentOptions {
    style: '2' | '4' | 'auto';
    fixTrailingSpaces?: boolean;
    preserveComments?: boolean;
    mode?: 'all' | 'indentation' | 'syntax';
}

export interface ValidationError {
    line: number;
    column: number;
    message: string;
    severity: 'error' | 'warning';
    fixable: boolean;
    code: string;
}

export interface ValidationResult {
    valid: boolean;
    errors: ValidationError[];
    detectedStyle: number;
}

export interface FixResult {
    content: string;
    fixedCount: number;
    changes: { line: number; type: string; original: string; fixed: string }[];
}

export class IndentationValidator {
    /**
     * Detects the indentation style (2 or 4 spaces) of the content.
     * Defaults to 2 if ambiguous.
     */
    detectIndentationStyle(content: string): number {
        const lines = content.split('\n');
        const counts = { 2: 0, 4: 0 };

        for (const line of lines) {
            const match = line.match(/^(\s+)/);
            if (!match) continue;
            const spaces = match[1].length;
            if (spaces > 0) {
                if (spaces % 4 === 0) counts[4]++;
                if (spaces % 2 === 0) counts[2]++;
            }
        }

        // Prefer 2 spaces if it's a tie or ambiguous, as it's standard for K8s
        return counts[4] > counts[2] ? 4 : 2;
    }

    /**
     * Validates the indentation of the given YAML content.
     */
    validate(content: string, options: IndentOptions = { style: 'auto' }): ValidationResult {
        const errors: ValidationError[] = [];
        const lines = content.split('\n');
        const targetStyle = options.style === 'auto' ? this.detectIndentationStyle(content) : parseInt(options.style);

        let inMultilineString = false;
        let multilineIndent = 0;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const lineNumber = i + 1;

            // 1. Detect Tabs
            if (line.includes('\t')) {
                errors.push({
                    line: lineNumber,
                    column: line.indexOf('\t') + 1,
                    message: 'Tab character detected. YAML forbids tabs.',
                    severity: 'error',
                    fixable: true,
                    code: 'TAB_DETECTED'
                });
            }

            // 2. Detect Trailing Whitespace
            if (line.match(/\s+$/)) {
                errors.push({
                    line: lineNumber,
                    column: line.length,
                    message: 'Trailing whitespace detected.',
                    severity: 'warning',
                    fixable: true,
                    code: 'TRAILING_WHITESPACE'
                });
            }

            // Skip empty lines or comments for indentation check
            if (line.trim().length === 0 || line.trim().startsWith('#')) {
                continue;
            }

            // Handle Multiline Strings (Basic state machine)
            // This is a simplified check. A full parser is better but slower.
            // We assume standard YAML block scalars | or >
            if (line.trim().endsWith('|') || line.trim().endsWith('>')) {
                inMultilineString = true;
                const match = line.match(/^(\s*)/);
                multilineIndent = match ? match[1].length : 0;
                continue; // The header line itself is checked below
            }

            const match = line.match(/^(\s*)/);
            const indent = match ? match[1].length : 0;

            if (inMultilineString) {
                // If line is less indented than the block start, we might be out of the block
                // But we need to be careful about empty lines in blocks
                if (indent <= multilineIndent && line.trim().length > 0) {
                    inMultilineString = false;
                } else {
                    // Inside multiline string, indentation rules are relaxed relative to parent
                    // but we generally don't validate strict levels here to avoid breaking content
                    continue;
                }
            }

            // 3. Check Indentation Level
            if (indent % targetStyle !== 0) {
                errors.push({
                    line: lineNumber,
                    column: 1,
                    message: `Incorrect indentation level: ${indent} spaces. Expected multiple of ${targetStyle}.`,
                    severity: 'error',
                    fixable: true,
                    code: 'INVALID_INDENTATION'
                });
            }

            // 4. Check List Alignment
            // List items "- " should be aligned.
            // This is complex to check perfectly without AST, but we can catch obvious ones.
            if (line.trim().startsWith('-')) {
                // The dash itself counts as indentation in some styles, but usually
                // we expect the dash to be at the correct indent level.
                // Already covered by general indent check above.
            }

            // 5. Check Colon Spacing
            // "key:value" is invalid, needs "key: value"
            // Exclude URLs (http://) and strings containing colons
            // Regex: Start of line, key (no spaces/colons), colon, NO space, then content
            const colonMatch = line.match(/^(\s*[^\s:]+):(?!\s)(\S)/);
            if (colonMatch) {
                // Exclude URLs
                if (!colonMatch[1].trim().match(/^https?$/)) {
                    errors.push({
                        line: lineNumber,
                        column: colonMatch[0].length,
                        message: 'Missing space after colon.',
                        severity: 'error',
                        fixable: true,
                        code: 'MISSING_SPACE_AFTER_COLON'
                    });
                }
            }
        }

        return {
            valid: errors.length === 0,
            errors,
            detectedStyle: targetStyle
        };
    }

    /**
     * Fixes indentation errors in the content.
     */
    fix(content: string, options: IndentOptions = { style: 'auto' }): FixResult {
        let lines = content.split('\n');
        const targetStyle = options.style === 'auto' ? this.detectIndentationStyle(content) : parseInt(options.style);
        const changes: { line: number; type: string; original: string; fixed: string }[] = [];
        let fixedCount = 0;
        const mode = options.mode || 'all';

        // Pass 1: Simple Line Fixes (Tabs, Trailing Spaces, Colons)
        for (let i = 0; i < lines.length; i++) {
            let line = lines[i];
            const originalLine = line;
            let modified = false;

            // Fix Tabs (Indentation Mode)
            if ((mode === 'all' || mode === 'indentation') && line.includes('\t')) {
                line = line.replace(/\t/g, ' '.repeat(targetStyle)); // Replace tab with target spaces
                modified = true;
            }

            // Fix Trailing Spaces (Syntax Mode)
            if ((mode === 'all' || mode === 'syntax') && options.fixTrailingSpaces !== false && line.match(/\s+$/)) {
                line = line.replace(/\s+$/, '');
                modified = true;
            }

            // Fix Colon Spacing (Syntax Mode)
            // Be careful not to break URLs or strings.
            // Safe fix: "key:value" -> "key: value" at start of line
            // We ensure the key doesn't contain http/https (basic URL check) and is a simple identifier
            if (mode === 'all' || mode === 'syntax') {
                // Regex explanation:
                // ^(\s*[^\s:]+):  -> Start of line, optional whitespace, key (anything but space/colon), colon
                // (?!\s)         -> Negative lookahead: NOT followed by whitespace (meaning it's missing)
                // (\S.*)         -> Capture the rest of the line (non-whitespace start)
                const colonMatch = line.match(/^(\s*[^\s:]+):(?!\s)(\S.*)/);

                // Extra safety: Don't touch if it looks like a URL schema (e.g. "https:...")
                // although the regex expects start of line key, so "https:" as a key is rare but possible in some contexts.
                // In K8s, keys are usually simple.

                if (colonMatch) {
                    const keyPart = colonMatch[1];
                    const valuePart = colonMatch[2];

                    // Double check we aren't breaking a URL that somehow matched (unlikely with ^ anchor but good practice)
                    if (!keyPart.trim().match(/^https?$/)) {
                        line = `${keyPart}: ${valuePart}`;
                        modified = true;
                    }
                }
            }

            if (modified) {
                changes.push({ line: i + 1, type: 'format', original: originalLine, fixed: line });
                lines[i] = line;
                fixedCount++;
            }
        }

        // Pass 2: Structural Re-indentation (Indentation Mode)
        if (mode === 'all' || mode === 'indentation') {
            for (let i = 0; i < lines.length; i++) {
                let line = lines[i];
                if (line.trim().length === 0) continue; // Skip empty

                const match = line.match(/^(\s+)(.*)/);
                if (!match) continue; // No indentation

                const currentIndent = match[1].length;
                const content = match[2];

                // Calculate nearest valid indentation level
                const levels = currentIndent / targetStyle;
                const nearestLevel = Math.round(levels);
                const newIndent = nearestLevel * targetStyle;

                if (newIndent !== currentIndent) {
                    const originalLine = line;
                    line = ' '.repeat(newIndent) + content;
                    lines[i] = line;
                    changes.push({ line: i + 1, type: 'indent', original: originalLine, fixed: line });
                    fixedCount++;
                }
            }
        }

        return {
            content: lines.join('\n'),
            fixedCount,
            changes
        };
    }
}
