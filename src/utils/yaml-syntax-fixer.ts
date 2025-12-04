import * as yaml from 'js-yaml';

export interface FixResult {
    content: string;
    success: boolean;
    fixedCount: number;
    errors: string[];
    warnings: string[];
}

interface LineContext {
    index: number;
    original: string;
    trimmed: string;
    isListItem: boolean;
    isComment: boolean;
    isEmpty: boolean;
}

/**
 * Industry-Grade YAML Syntax Fixer
 * 
 * Architecture:
 * 1. Strategy A: Parse & Rebuild (Nuclear option, best results)
 * 2. Strategy B: Heuristic Line-by-Line Fix (Fallback)
 *    - Pass 1: Preprocessing (Global cleanup)
 *    - Pass 2: Syntax Fixing (Colons, quotes, spacing)
 *    - Pass 3: Indentation Reconstruction (Stack-based structural alignment)
 */
export class YAMLSyntaxFixer {

    /**
     * Main entry point for fixing YAML
     */
    public fix(content: string, indentSize: number = 2): FixResult {
        console.log('[YAML FIXER] Starting fix process...');

        // Strategy 1: Try to parse and rebuild first
        // This is the most robust method if the YAML is only slightly malformed
        const parseResult = this.tryParseAndRebuild(content, indentSize);
        if (parseResult.success) {
            return parseResult;
        }

        console.log('[YAML FIXER] Parse failed, falling back to heuristic fix...');

        // Strategy 2: Heuristic Line-by-Line Fix
        return this.heuristicFix(content, indentSize);
    }

    /**
     * Strategy 1: Parse and Rebuild using js-yaml
     */
    private tryParseAndRebuild(content: string, indentSize: number): FixResult {
        try {
            const parsed = yaml.load(content);
            if (parsed && typeof parsed === 'object') {
                const rebuilt = yaml.dump(parsed, {
                    indent: indentSize,
                    lineWidth: -1,
                    noRefs: true,
                    sortKeys: false,
                    quotingType: '"',
                    forceQuotes: false
                });

                console.log('[YAML FIXER] ✓ Successfully parsed and rebuilt');
                return {
                    content: rebuilt,
                    success: true,
                    fixedCount: 1, // Treated as one big fix
                    errors: [],
                    warnings: []
                };
            }
        } catch (e) {
            // Ignore error, proceed to fallback
        }
        return { content: '', success: false, fixedCount: 0, errors: [], warnings: [] };
    }

    /**
     * Strategy 2: Heuristic Fix
     * Pipeline: Preprocess -> Fix Syntax -> Reconstruct Indentation
     */
    private heuristicFix(content: string, indentSize: number): FixResult {
        // Step 1: Preprocessing (Global cleanup)
        const preprocessed = this.preprocess(content);

        // Step 2: Line-by-line processing
        const lines = preprocessed.split('\n');
        const fixedLines: string[] = [];
        let fixedCount = 0;

        // State for indentation reconstruction
        const indentStack: number[] = [0];

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const context = this.analyzeLine(line, i);

            // Skip empty lines (preserve them)
            if (context.isEmpty) {
                fixedLines.push('');
                continue;
            }

            // Comments: preserve but clean up
            if (context.isComment) {
                fixedLines.push(line);
                continue;
            }

            // Step 3: Fix Syntax (Colons, Spacing, Quotes)
            let fixedContent = this.fixLineSyntax(context.trimmed);

            // Step 4: Reconstruct Indentation
            const targetIndent = this.determineIndent(
                context,
                fixedContent,
                indentStack,
                fixedLines,
                indentSize
            );

            // Construct final line
            const finalLine = ' '.repeat(targetIndent) + fixedContent;
            fixedLines.push(finalLine);

            if (finalLine !== line) {
                fixedCount++;
                console.log(`[FIX] Line ${i + 1}: "${line}" → "${finalLine}"`);
            }

            // Update stack for next line
            this.updateStack(fixedContent, targetIndent, indentStack, indentSize);
        }

        return {
            content: fixedLines.join('\n'),
            success: true,
            fixedCount,
            errors: [],
            warnings: []
        };
    }

    /**
     * Helper: Preprocess content (Tabs, Trailing Whitespace)
     */
    private preprocess(content: string): string {
        // Convert tabs to 2 spaces
        let processed = content.replace(/\t/g, '  ');
        // Remove trailing whitespace from all lines
        processed = processed.replace(/[ \t]+$/gm, '');
        return processed;
    }

    /**
     * Helper: Analyze line to create context
     */
    private analyzeLine(line: string, index: number): LineContext {
        const trimmed = line.trim();
        return {
            index,
            original: line,
            trimmed,
            isListItem: trimmed.startsWith('-'),
            isComment: trimmed.startsWith('#'),
            isEmpty: trimmed.length === 0
        };
    }

    /**
     * Helper: Fix syntax errors within a line
     */
    private fixLineSyntax(content: string): string {
        let fixed = content;

        // 1. Add missing colons to known Kubernetes keys
        if (!fixed.includes(':') && !fixed.startsWith('-')) {
            const k8sKeys = [
                'apiVersion', 'kind', 'metadata', 'spec', 'status', 'data',
                'labels', 'annotations', 'selector', 'template', 'containers',
                'ports', 'env', 'volumes', 'meta', 'resources', 'limits',
                'requests', 'command', 'args', 'image', 'name', 'value', 'key'
            ];
            const keyPart = fixed.split(/\s+/)[0];
            // Check exact match or case-insensitive match
            if (k8sKeys.some(k => k.toLowerCase() === keyPart.toLowerCase())) {
                if (!fixed.endsWith(':')) {
                    fixed += ':';
                }
            }
        }

        // 2. Fix colon spacing (key:value -> key: value)
        // Look for colon followed by non-space, excluding URLs (http://)
        fixed = fixed.replace(/^([^:\s]+):(?!\s)(\S)/, '$1: $2');

        // 3. Fix list item spacing (-item -> - item)
        fixed = fixed.replace(/^-([^\s-])/, '- $1');

        // 4. Close unclosed quotes
        const dq = (fixed.match(/"/g) || []).length;
        const sq = (fixed.match(/'/g) || []).length;
        if (dq % 2 !== 0) fixed += '"';
        if (sq % 2 !== 0) fixed += "'";

        return fixed;
    }

    /**
     * Helper: Determine correct indentation based on context and stack
     */
    private determineIndent(
        ctx: LineContext,
        fixedContent: string,
        stack: number[],
        fixedLines: string[],
        indentSize: number
    ): number {
        // Current expected level
        let targetIndent = stack[stack.length - 1];

        // Calculate original indentation (from preprocessed line)
        const originalIndent = ctx.original.match(/^(\s*)/)?.[1].length || 0;

        // Check context from previous line
        let prevLineExpectsChildren = false;
        if (fixedLines.length > 0) {
            const lastFixed = fixedLines[fixedLines.length - 1].trim();
            // Check if last line ends with colon (ignoring comments)
            const cleanLast = lastFixed.replace(/#.*$/, '').trim();
            if (cleanLast.endsWith(':') && !cleanLast.startsWith('-')) {
                prevLineExpectsChildren = true;
            } else if (cleanLast.startsWith('-') && cleanLast.endsWith(':')) {
                prevLineExpectsChildren = true;
            }
        }

        // LOGIC 1: Handling Dedentation
        // If previous line does NOT expect children, we might need to dedent (pop stack)
        if (!prevLineExpectsChildren) {
            if (ctx.isListItem) {
                // For list items, snap to nearest valid stack level
                const bestMatch = this.findBestStackMatch(originalIndent, stack);
                if (bestMatch !== -1) {
                    // Pop stack until we reach the matching level
                    while (stack.length - 1 > bestMatch) {
                        stack.pop();
                    }
                    targetIndent = stack[stack.length - 1];
                } else {
                    // Fallback: standard dedent logic
                    while (stack.length > 1 && originalIndent <= stack[stack.length - 1] - indentSize) {
                        stack.pop();
                        targetIndent = stack[stack.length - 1];
                    }
                }
            } else {
                // For regular keys, standard dedent logic
                while (stack.length > 1 && originalIndent <= stack[stack.length - 1] - indentSize) {
                    stack.pop();
                    targetIndent = stack[stack.length - 1];
                }
            }
        } else {
            // LOGIC 2: Forced Indentation (Children)
            // If previous line expects children, we DO NOT pop stack.
            // We implicitly expect the current line to be at 'targetIndent' (which is parent + indentSize)
            // Note: The stack update from the *previous* iteration should have already pushed the new level.
        }

        // LOGIC 3: List Item Property Alignment
        // If this is a property inside a list, align it correctly
        if (!ctx.isListItem && fixedLines.length > 0) {
            const prevFixedLine = fixedLines[fixedLines.length - 1];
            const prevIndent = prevFixedLine.match(/^(\s*)/)?.[1].length || 0;
            const prevTrimmed = prevFixedLine.trim();

            // If current line is a key-value pair
            if (fixedContent.includes(':')) {
                // Case A: Previous was "- key: val" -> Align with "key" (indent + 2)
                if (prevTrimmed.startsWith('-')) {
                    targetIndent = prevIndent + indentSize;
                }
                // Case B: Previous was property inside list -> Match its indent
                else if (prevIndent > stack[stack.length - 1]) {
                    targetIndent = prevIndent;
                }
            }
        }

        return targetIndent;
    }

    /**
     * Helper: Find best matching indentation level in stack
     */
    private findBestStackMatch(indent: number, stack: number[]): number {
        for (let i = stack.length - 1; i >= 0; i--) {
            // Allow fuzzy match (±1 space)
            if (Math.abs(stack[i] - indent) <= 1) {
                return i;
            }
        }
        return -1;
    }

    /**
     * Helper: Update stack for next line
     */
    private updateStack(fixedContent: string, currentIndent: number, stack: number[], indentSize: number): void {
        // Check if this line expects children (ends with colon)
        const cleanContent = fixedContent.replace(/#.*$/, '').trim();

        if (cleanContent.endsWith(':') && !cleanContent.startsWith('-')) {
            // Push new level: current + indentSize
            stack.push(currentIndent + indentSize);
        }
        // Note: We don't push for "- key:", because the next line (sibling property) 
        // is handled by the "List Item Property Alignment" logic in determineIndent.
    }
}
