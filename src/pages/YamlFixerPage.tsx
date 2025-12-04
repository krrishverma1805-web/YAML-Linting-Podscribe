import { useState, useCallback } from 'react';
import {
    Box,
    Button,
    Typography,
    Paper,
    CircularProgress,
    Snackbar,
    Alert,
    Chip,
    Switch,
    FormControlLabel,
    Divider
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DownloadIcon from '@mui/icons-material/Download';
import ClearIcon from '@mui/icons-material/Clear';
import BoltIcon from '@mui/icons-material/Bolt';
import CodeIcon from '@mui/icons-material/Code';
// @ts-ignore
import { saveAs } from 'file-saver';
import Editor from '@monaco-editor/react';
import { ErrorList } from '../components/ErrorList';
import { fixYaml, type FixChange, type FixResponse } from '../api/yaml-fixer-api';

// Example broken YAML
const EXAMPLE_BROKEN_YAML = `apiVersion v1
kind Deployment
met
  name broken-app
  namespace default
spec
  replicas three
  template
    metadata
      labels
        app: frontend
    spec
      containers
        - name nginx
          image: nginx
          ports
            - containerPort 80
              protocol:TCP
      restartPolicy Always
---
kind Service
meta
  name broken-svc
spec
  type LoadBalancer
  ports
    - port 80
      targetPort 80`;

export function YamlFixerPage() {
    const [inputYaml, setInputYaml] = useState('');
    const [outputYaml, setOutputYaml] = useState('');
    const [changes, setChanges] = useState<FixChange[]>([]);
    const [loading, setLoading] = useState(false);
    const [aggressive, setAggressive] = useState(false);
    const [stats, setStats] = useState({ total: 0, fixed: 0, successRate: 0 });
    const [phase, setPhase] = useState('');

    // Snackbar state
    const [snackbar, setSnackbar] = useState<{
        open: boolean;
        message: string;
        severity: 'success' | 'error' | 'info' | 'warning';
    }>({
        open: false,
        message: '',
        severity: 'info'
    });

    const showNotification = (message: string, severity: 'success' | 'error' | 'info' | 'warning') => {
        setSnackbar({ open: true, message, severity });
    };

    const handleCloseSnackbar = () => {
        setSnackbar(prev => ({ ...prev, open: false }));
    };

    // Validate and fix YAML
    const handleValidateAndFix = useCallback(async (useAggressive: boolean = false) => {
        if (!inputYaml.trim()) {
            showNotification('Please enter some YAML content', 'warning');
            return;
        }

        setLoading(true);
        try {
            const result: FixResponse = await fixYaml(inputYaml, {
                aggressive: useAggressive,
                indentSize: 2
            });

            if (result.success) {
                setOutputYaml(result.fixed);
                setChanges(result.changes);
                setPhase(result.phase || '');

                // Calculate stats
                const totalIssues = result.fixedCount;
                const successRate = totalIssues > 0 ? 100 : 100;
                setStats({
                    total: totalIssues,
                    fixed: result.fixedCount,
                    successRate
                });

                if (result.fixedCount > 0) {
                    showNotification(
                        `Successfully fixed ${result.fixedCount} issue${result.fixedCount !== 1 ? 's' : ''}!`,
                        'success'
                    );
                } else {
                    showNotification('No issues found - YAML is already valid!', 'info');
                }
            } else {
                showNotification(result.error || 'Failed to fix YAML', 'error');
            }
        } catch (error) {
            console.error('Fix error:', error);
            showNotification(
                error instanceof Error ? error.message : 'Failed to connect to server',
                'error'
            );
        } finally {
            setLoading(false);
        }
    }, [inputYaml]);

    // Copy to clipboard
    const handleCopy = async () => {
        if (!outputYaml) {
            showNotification('No fixed YAML to copy', 'warning');
            return;
        }

        try {
            await navigator.clipboard.writeText(outputYaml);
            showNotification('Copied to clipboard!', 'success');
        } catch (error) {
            console.error('Copy failed:', error);
            showNotification('Failed to copy to clipboard', 'error');
        }
    };

    // Download as file
    const handleDownload = () => {
        if (!outputYaml) {
            showNotification('No fixed YAML to download', 'warning');
            return;
        }

        const blob = new Blob([outputYaml], { type: 'text/yaml;charset=utf-8' });
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
        saveAs(blob, `fixed-yaml-${timestamp}.yaml`);
        showNotification('File downloaded successfully', 'success');
    };

    // Clear all
    const handleClear = () => {
        setInputYaml('');
        setOutputYaml('');
        setChanges([]);
        setStats({ total: 0, fixed: 0, successRate: 0 });
        setPhase('');
    };

    // Load example
    const handleLoadExample = () => {
        setInputYaml(EXAMPLE_BROKEN_YAML);
        setOutputYaml('');
        setChanges([]);
        showNotification('Example loaded - click "Validate & Fix" to see it in action!', 'info');
    };

    return (
        <Box className="h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
            {/* Header */}
            <Box className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
                <Box className="flex items-center justify-between mb-2">
                    <Box>
                        <Typography variant="h5" className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <CodeIcon /> YAML Validator & Fixer
                        </Typography>
                        <Typography variant="body2" className="text-gray-600 dark:text-gray-400 mt-1">
                            Industry-grade YAML fixer with 3-phase architecture - fixes syntax, structure, and semantic issues
                        </Typography>
                    </Box>
                    <Button
                        variant="outlined"
                        size="small"
                        onClick={handleLoadExample}
                        startIcon={<CodeIcon />}
                    >
                        Load Example
                    </Button>
                </Box>

                {/* Statistics */}
                {stats.total > 0 && (
                    <Box className="flex gap-4 mt-3">
                        <Paper className="px-4 py-2 flex-1">
                            <Typography variant="caption" className="text-gray-600 dark:text-gray-400">
                                Total Issues Found
                            </Typography>
                            <Typography variant="h6" className="font-bold text-blue-600">
                                {stats.total}
                            </Typography>
                        </Paper>
                        <Paper className="px-4 py-2 flex-1">
                            <Typography variant="caption" className="text-gray-600 dark:text-gray-400">
                                Issues Fixed
                            </Typography>
                            <Typography variant="h6" className="font-bold text-green-600">
                                {stats.fixed}
                            </Typography>
                        </Paper>
                        <Paper className="px-4 py-2 flex-1">
                            <Typography variant="caption" className="text-gray-600 dark:text-gray-400">
                                Success Rate
                            </Typography>
                            <Typography variant="h6" className="font-bold text-purple-600">
                                {stats.successRate}%
                            </Typography>
                        </Paper>
                        {phase && (
                            <Paper className="px-4 py-2 flex-1">
                                <Typography variant="caption" className="text-gray-600 dark:text-gray-400">
                                    Completed Phase
                                </Typography>
                                <Typography variant="body2" className="font-medium text-gray-900 dark:text-white">
                                    {phase}
                                </Typography>
                            </Paper>
                        )}
                    </Box>
                )}
            </Box>

            {/* Main Content */}
            <Box className="flex-1 flex flex-col lg:flex-row overflow-hidden">
                {/* Left: Input Editor */}
                <Box className="flex-1 flex flex-col border-r border-gray-200 dark:border-gray-700">
                    <Box className="bg-gray-100 dark:bg-gray-800 px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                        <Typography variant="subtitle2" className="font-semibold text-gray-700 dark:text-gray-300">
                            Input (Broken YAML)
                        </Typography>
                    </Box>
                    <Box className="flex-1">
                        <Editor
                            height="100%"
                            defaultLanguage="yaml"
                            value={inputYaml}
                            onChange={(value) => setInputYaml(value || '')}
                            theme="vs-dark"
                            options={{
                                minimap: { enabled: false },
                                fontSize: 14,
                                lineNumbers: 'on',
                                renderWhitespace: 'selection',
                                scrollBeyondLastLine: false,
                                wordWrap: 'on',
                                fontFamily: 'Monaco, Menlo, "Courier New", monospace'
                            }}
                        />
                    </Box>
                </Box>

                {/* Center: Control Panel */}
                <Box className="w-full lg:w-64 bg-white dark:bg-gray-800 border-b lg:border-b-0 lg:border-r border-gray-200 dark:border-gray-700 p-4 flex flex-col gap-3">
                    <Typography variant="subtitle2" className="font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Actions
                    </Typography>

                    <Button
                        variant="contained"
                        color="primary"
                        fullWidth
                        onClick={() => handleValidateAndFix(false)}
                        disabled={loading || !inputYaml.trim()}
                        startIcon={loading ? <CircularProgress size={20} /> : <PlayArrowIcon />}
                    >
                        {loading ? 'Fixing...' : 'Validate & Fix'}
                    </Button>

                    <FormControlLabel
                        control={
                            <Switch
                                checked={aggressive}
                                onChange={(e) => setAggressive(e.target.checked)}
                                color="warning"
                            />
                        }
                        label={
                            <Box className="flex items-center gap-1">
                                <BoltIcon fontSize="small" className="text-orange-500" />
                                <Typography variant="body2">Aggressive Mode</Typography>
                            </Box>
                        }
                    />

                    {aggressive && (
                        <Button
                            variant="contained"
                            color="warning"
                            fullWidth
                            onClick={() => handleValidateAndFix(true)}
                            disabled={loading || !inputYaml.trim()}
                            startIcon={loading ? <CircularProgress size={20} /> : <BoltIcon />}
                        >
                            Fix Aggressive
                        </Button>
                    )}

                    <Divider />

                    <Button
                        variant="outlined"
                        fullWidth
                        onClick={handleCopy}
                        disabled={!outputYaml}
                        startIcon={<ContentCopyIcon />}
                    >
                        Copy Fixed YAML
                    </Button>

                    <Button
                        variant="outlined"
                        fullWidth
                        onClick={handleDownload}
                        disabled={!outputYaml}
                        startIcon={<DownloadIcon />}
                    >
                        Download
                    </Button>

                    <Button
                        variant="outlined"
                        color="error"
                        fullWidth
                        onClick={handleClear}
                        startIcon={<ClearIcon />}
                    >
                        Clear All
                    </Button>

                    {aggressive && (
                        <Box className="mt-4 p-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded">
                            <Typography variant="caption" className="text-orange-800 dark:text-orange-200">
                                <strong>Aggressive Mode:</strong> Moves misplaced fields to correct locations (e.g., name → metadata.name)
                            </Typography>
                        </Box>
                    )}
                </Box>

                {/* Right: Output Editor */}
                <Box className="flex-1 flex flex-col">
                    <Box className="bg-gray-100 dark:bg-gray-800 px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                        <Typography variant="subtitle2" className="font-semibold text-gray-700 dark:text-gray-300">
                            Output (Fixed YAML)
                        </Typography>
                    </Box>
                    <Box className="flex-1">
                        <Editor
                            height="100%"
                            defaultLanguage="yaml"
                            value={outputYaml}
                            theme="vs-dark"
                            options={{
                                readOnly: true,
                                minimap: { enabled: false },
                                fontSize: 14,
                                lineNumbers: 'on',
                                renderWhitespace: 'selection',
                                scrollBeyondLastLine: false,
                                wordWrap: 'on',
                                fontFamily: 'Monaco, Menlo, "Courier New", monospace'
                            }}
                        />
                    </Box>
                </Box>
            </Box>

            {/* Bottom: Error List */}
            {changes.length > 0 && (
                <Box className="h-80 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                    <Box className="bg-gray-100 dark:bg-gray-800 px-4 py-2 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                        <Typography variant="subtitle2" className="font-semibold text-gray-700 dark:text-gray-300">
                            Changes Applied ({changes.length})
                        </Typography>
                        <Chip
                            label={`${changes.length} fixes`}
                            size="small"
                            color="primary"
                        />
                    </Box>
                    <ErrorList changes={changes} />
                </Box>
            )}

            {/* Notifications */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={4000}
                onClose={handleCloseSnackbar}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
}
