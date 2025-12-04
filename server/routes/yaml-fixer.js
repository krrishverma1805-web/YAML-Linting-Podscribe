import express from 'express';
import { YAMLFixer } from '../../dist/core/yaml-fixer.js';

const router = express.Router();

/**
 * POST /api/yaml/fix
 * Fix broken YAML using the industry-grade YAMLFixer
 * 
 * Request body:
 * {
 *   content: string,
 *   options: {
 *     aggressive?: boolean,
 *     indentSize?: number
 *   }
 * }
 * 
 * Response:
 * {
 *   success: boolean,
 *   fixed: string,
 *   errors: ValidationError[],
 *   changes: FixChange[],
 *   fixedCount: number,
 *   phase: string
 * }
 */
router.post('/fix', (req, res) => {
    try {
        const { content, options = {} } = req.body;

        // Validate input
        if (!content || typeof content !== 'string') {
            return res.status(400).json({
                success: false,
                error: 'Invalid request: content must be a non-empty string',
                fixed: '',
                errors: [],
                changes: [],
                fixedCount: 0
            });
        }

        // Create fixer instance
        const fixer = new YAMLFixer(options.indentSize || 2);

        // Run the fixer
        const result = fixer.fix(content, {
            aggressive: options.aggressive || false,
            indentSize: options.indentSize || 2
        });

        // Determine which phase completed
        let phase = 'Phase 1: Syntax Normalization';
        if (result.errors.length === 0) {
            phase = 'Phase 3: Semantic Fixes';
        } else if (result.errors.some(e => e.code === 'YAML_PARSE_ERROR')) {
            phase = 'Phase 1: Syntax Normalization (Parsing Failed)';
        }

        // Return success response
        return res.json({
            success: true,
            fixed: result.content,
            errors: result.errors,
            changes: result.changes,
            fixedCount: result.fixedCount,
            phase
        });

    } catch (error) {
        console.error('YAML Fixer API Error:', error);
        return res.status(500).json({
            success: false,
            error: error.message || 'Internal server error',
            fixed: '',
            errors: [{
                line: 0,
                message: `Server error: ${error.message}`,
                severity: 'critical',
                code: 'SERVER_ERROR',
                fixable: false
            }],
            changes: [],
            fixedCount: 0
        });
    }
});

/**
 * POST /api/yaml/validate
 * Validate YAML without fixing
 */
router.post('/validate', (req, res) => {
    try {
        const { content } = req.body;

        if (!content || typeof content !== 'string') {
            return res.status(400).json({
                valid: false,
                error: 'Invalid request: content must be a non-empty string',
                errors: [],
                structuralIssues: []
            });
        }

        const fixer = new YAMLFixer();
        const result = fixer.validate(content);

        return res.json({
            valid: result.valid,
            errors: result.errors,
            structuralIssues: result.structuralIssues
        });

    } catch (error) {
        console.error('YAML Validator API Error:', error);
        return res.status(500).json({
            valid: false,
            error: error.message || 'Internal server error',
            errors: [{
                line: 0,
                message: `Server error: ${error.message}`,
                severity: 'critical',
                code: 'SERVER_ERROR',
                fixable: false
            }],
            structuralIssues: []
        });
    }
});

export default router;
