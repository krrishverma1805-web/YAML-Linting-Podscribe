import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
    Typography,
    IconButton,
    Button,
    Switch,
    Drawer,
    Chip,
    Badge,
    Snackbar,
    Alert,
    Box,
    useTheme,
    useMediaQuery,
    CircularProgress,
    Tooltip,
} from '@mui/material';
import {
    Brightness4 as DarkModeIcon,
    Brightness7 as LightModeIcon,
    MenuBook as DocumentationIcon,
    Terminal as ConsoleIcon,
    PlayArrow as ValidateIcon,
    ContentCopy as CopyIcon,
    Download as DownloadIcon,
    Clear as ClearIcon,
    Close as CloseIcon,
    CheckCircle as CheckIcon,
    CompareArrows as DiffIcon,
    UploadFile as UploadIcon,
    Policy as RegoIcon,
    ErrorOutline as ErrorIcon,
} from '@mui/icons-material';
import { Documentation } from './Documentation';
import { StatisticsPanel } from './StatisticsPanel';
import { CodeEditor } from './CodeEditor';
import {
    type FixChange,
    type ValidationError,
    type ValidationSummary,
    getConfidenceColor,
    formatConfidence
} from '../api/yaml-fixer-api';

interface ValidationResponse {
    success: boolean;
    originalValid: boolean;
    fixed: string;
    errors: ValidationError[];
    fixedCount: number;
    changes: FixChange[];
    isValid: boolean;
    structuralExplanation?: string;
    summary?: ValidationSummary;
    confidence?: number;
}

interface ToastNotification {
    id: number;
    message: string;
    type: 'success' | 'error' | 'info';
}

export const UnifiedValidator: React.FC = () => {
    const theme = useTheme();
    useMediaQuery(theme.breakpoints.down('md')); // Pre-compute for responsive use

    // State
    const [inputYaml, setInputYaml] = useState('');
    const [outputYaml, setOutputYaml] = useState('');
    const [errors, setErrors] = useState<ValidationError[]>([]);
    const [changes, setChanges] = useState<FixChange[]>([]);
    const [isValidating, setIsValidating] = useState(false);
    const [summary, setSummary] = useState<ValidationSummary | undefined>(undefined);
    const [overallConfidence, setOverallConfidence] = useState(0);
    const [processingTime, setProcessingTime] = useState(0);

    const [isValid, setIsValid] = useState(false);
    const [fixEnabled, setFixEnabled] = useState(true);
    const [darkMode, setDarkMode] = useState(true);
    const [showDocumentation, setShowDocumentation] = useState(false);
    const [showConsole, setShowConsole] = useState(false);
    const [consoleTab, setConsoleTab] = useState<'fixes' | 'errors'>('fixes');
    const [toasts, setToasts] = useState<ToastNotification[]>([]);

    // New Feature States
    const [showDiff, setShowDiff] = useState(false);
    const [confidenceFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');

    // File input refs
    const yamlFileInputRef = useRef<HTMLInputElement>(null);
    const regoFileInputRef = useRef<HTMLInputElement>(null);

    // Refs
    const toastIdRef = useRef(0);

    // Toast notifications
    const addToast = useCallback((message: string, type: 'success' | 'error' | 'info') => {
        const id = toastIdRef.current++;
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 3000);
    }, []);

    // File upload handlers
    const handleYamlUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const content = e.target?.result as string;
                setInputYaml(content);
                addToast(`Loaded ${file.name}`, 'success');
            };
            reader.readAsText(file);
        }
        // Reset input
        if (yamlFileInputRef.current) {
            yamlFileInputRef.current.value = '';
        }
    };

    const handleRegoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            addToast(`Rego policy ${file.name} added`, 'info');
            // TODO: Handle Rego file logic
        }
        // Reset input
        if (regoFileInputRef.current) {
            regoFileInputRef.current.value = '';
        }
    };

    // Validation handler
    const handleValidate = useCallback(async () => {
        if (!inputYaml.trim()) {
            addToast('Please enter YAML content', 'error');
            return;
        }

        setIsValidating(true);
        const startTime = performance.now();

        try {
            const apiBase = typeof window !== 'undefined' && window.location.hostname !== 'localhost'
                ? ''
                : 'http://localhost:3001';

            const response = await fetch(`${apiBase}/api/yaml/validate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    content: inputYaml,
                    options: { aggressive: false, indentSize: 2 },
                }),
            });

            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

            const data: ValidationResponse = await response.json();
            const endTime = performance.now();
            setProcessingTime(Math.round(endTime - startTime));

            if (fixEnabled) {
                setOutputYaml(data.fixed);
            } else {
                setOutputYaml('');
            }

            setErrors(data.errors || []);
            setChanges(data.changes || []);
            setIsValid(data.isValid);
            setSummary(data.summary);
            setOverallConfidence(data.confidence || 0);

            setShowConsole(true);

            if (fixEnabled && data.fixedCount > 0) {
                setConsoleTab('fixes');
            } else if (data.errors.length > 0) {
                setConsoleTab('errors');
            }

            if (data.isValid && data.fixedCount === 0) {
                addToast('YAML is perfect! No issues found.', 'success');
            } else if (fixEnabled && data.isValid && data.fixedCount > 0) {
                addToast(`Fixed ${data.fixedCount} issue${data.fixedCount > 1 ? 's' : ''}`, 'success');
            } else if (!fixEnabled && data.errors.length > 0) {
                addToast(`Found ${data.errors.length} error${data.errors.length > 1 ? 's' : ''}`, 'info');
            }
        } catch (error) {
            console.error('Validation error:', error);
            addToast('Failed to connect to validation server', 'error');
        } finally {
            setIsValidating(false);
        }
    }, [inputYaml, fixEnabled, addToast]);

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                e.preventDefault();
                handleValidate();
            } else if ((e.metaKey || e.ctrlKey) && e.key === 's') {
                e.preventDefault();
                handleDownload();
            } else if ((e.metaKey || e.ctrlKey) && e.key === 'l') {
                e.preventDefault();
                handleClear();
            } else if (e.key === 'Escape') {
                setShowDocumentation(false);
                setShowConsole(false);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleValidate]);

    // Utility functions
    const handleCopy = () => {
        if (outputYaml) {
            navigator.clipboard.writeText(outputYaml);
            addToast('Copied to clipboard', 'success');
        }
    };

    const handleDownload = () => {
        if (outputYaml) {
            const blob = new Blob([outputYaml], { type: 'text/yaml' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'fixed-manifest.yaml';
            a.click();
            URL.revokeObjectURL(url);
            addToast('Downloaded successfully', 'success');
        }
    };

    const handleClear = () => {
        setInputYaml('');
        setOutputYaml('');
        setErrors([]);
        setChanges([]);
        setShowConsole(false);
    };

    // Group errors by severity
    const groupedErrors = useMemo(() => errors.reduce((acc, error) => {
        const severity = error.severity;
        if (!acc[severity]) acc[severity] = [];
        acc[severity].push(error);
        return acc;
    }, {} as Record<string, ValidationError[]>), [errors]);

    // Group changes by category
    const groupedChanges = useMemo(() => {
        const filtered = changes.filter(change => {
            if (confidenceFilter === 'all') return true;
            if (confidenceFilter === 'high') return change.confidence >= 0.9;
            if (confidenceFilter === 'medium') return change.confidence >= 0.7 && change.confidence < 0.9;
            if (confidenceFilter === 'low') return change.confidence < 0.7;
            return true;
        });

        return filtered.reduce((acc, change) => {
            let category = 'Semantic';
            const type = change.type.toLowerCase();
            if (type.includes('syntax') || type.includes('colon') || type.includes('quote') || type.includes('indent')) {
                category = 'Syntax';
            } else if (type.includes('structure') || type.includes('nest') || type.includes('relocate')) {
                category = 'Structure';
            } else if (type.includes('type') || type.includes('convert') || type.includes('duplicate')) {
                category = 'Semantic';
            }

            if (!acc[category]) acc[category] = [];
            acc[category].push(change);
            return acc;
        }, {} as Record<string, FixChange[]>);
    }, [changes, confidenceFilter]);

    // Calculate stats
    const stats = useMemo(() => {
        if (summary) return summary;
        return {
            totalIssues: errors.length + changes.length,
            fixedCount: changes.length,
            parsingSuccess: true,
            bySeverity: { critical: 0, error: 0, warning: 0, info: 0 },
            byCategory: { syntax: 0, structure: 0, semantic: 0, type: 0 },
            byConfidence: { high: 0, medium: 0, low: 0 },
            remainingIssues: errors.length,
            overallConfidence: overallConfidence,
            processingTimeMs: processingTime
        };
    }, [summary, errors, changes, overallConfidence, processingTime]);

    // Colors are defined inline where needed

    return (
        <Box
            sx={{
                height: '100vh',
                display: 'flex',
                flexDirection: 'column',
                bgcolor: darkMode ? '#0f0f0f' : '#FAFAFA',
                overflow: 'hidden',
            }}
        >
            {/* Hidden file inputs */}
            <input
                type="file"
                ref={yamlFileInputRef}
                onChange={handleYamlUpload}
                accept=".yaml,.yml"
                style={{ display: 'none' }}
            />
            <input
                type="file"
                ref={regoFileInputRef}
                onChange={handleRegoUpload}
                accept=".rego"
                style={{ display: 'none' }}
            />

            {/* Header - Refined MD3 + Liquid Glassmorphism */}
            <Box
                component="header"
                sx={{
                    position: 'relative',
                    zIndex: 100,
                    // Enhanced glassmorphism
                    background: darkMode
                        ? 'linear-gradient(180deg, rgba(28, 28, 30, 0.92) 0%, rgba(20, 20, 22, 0.96) 100%)'
                        : 'linear-gradient(180deg, rgba(255, 255, 255, 0.92) 0%, rgba(250, 250, 252, 0.96) 100%)',
                    backdropFilter: 'blur(24px) saturate(200%)',
                    WebkitBackdropFilter: 'blur(24px) saturate(200%)',
                    borderBottom: darkMode
                        ? '1px solid rgba(255, 255, 255, 0.08)'
                        : '1px solid rgba(0, 0, 0, 0.06)',
                    boxShadow: darkMode
                        ? '0 1px 0 rgba(255, 255, 255, 0.03) inset, 0 4px 20px rgba(0, 0, 0, 0.25)'
                        : '0 1px 0 rgba(255, 255, 255, 0.9) inset, 0 4px 20px rgba(0, 0, 0, 0.04)',
                }}
            >
                <Box
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        px: { xs: 2, sm: 2.5, md: 3 },
                        py: 1.5,
                        minHeight: 60,
                        gap: { xs: 1.5, md: 3 },
                    }}
                >
                    {/* Left Section - File Actions */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, md: 1.5 } }}>
                        {/* Upload YAML */}
                        <Tooltip title="Upload YAML File" arrow placement="bottom">
                            <IconButton
                                onClick={() => yamlFileInputRef.current?.click()}
                                sx={{
                                    width: 42,
                                    height: 42,
                                    borderRadius: '12px',
                                    color: darkMode ? '#8AB4F8' : '#1A73E8',
                                    bgcolor: darkMode ? 'rgba(138, 180, 248, 0.1)' : 'rgba(26, 115, 232, 0.08)',
                                    transition: 'all 0.2s ease',
                                    border: darkMode ? '1px solid rgba(138, 180, 248, 0.2)' : '1px solid rgba(26, 115, 232, 0.15)',
                                    '&:hover': {
                                        bgcolor: darkMode ? 'rgba(138, 180, 248, 0.18)' : 'rgba(26, 115, 232, 0.14)',
                                        transform: 'translateY(-1px)',
                                    },
                                }}
                            >
                                <UploadIcon sx={{ fontSize: 22 }} />
                            </IconButton>
                        </Tooltip>

                        {/* Add Rego Policy */}
                        <Tooltip title="Add Rego Policy" arrow placement="bottom">
                            <IconButton
                                onClick={() => regoFileInputRef.current?.click()}
                                sx={{
                                    width: 42,
                                    height: 42,
                                    borderRadius: '12px',
                                    color: darkMode ? '#C474FB' : '#9333EA',
                                    bgcolor: darkMode ? 'rgba(196, 116, 251, 0.1)' : 'rgba(147, 51, 234, 0.08)',
                                    transition: 'all 0.2s ease',
                                    border: darkMode ? '1px solid rgba(196, 116, 251, 0.2)' : '1px solid rgba(147, 51, 234, 0.15)',
                                    '&:hover': {
                                        bgcolor: darkMode ? 'rgba(196, 116, 251, 0.18)' : 'rgba(147, 51, 234, 0.14)',
                                        transform: 'translateY(-1px)',
                                    },
                                }}
                            >
                                <RegoIcon sx={{ fontSize: 22 }} />
                            </IconButton>
                        </Tooltip>
                    </Box>

                    {/* Center Section - Validate Button & Auto-Fix (Desktop) */}
                    <Box
                        sx={{
                            display: { xs: 'none', md: 'flex' },
                            alignItems: 'center',
                            gap: 2,
                            // Glassmorphic container
                            background: darkMode
                                ? 'rgba(255, 255, 255, 0.04)'
                                : 'rgba(0, 0, 0, 0.02)',
                            borderRadius: '16px',
                            padding: '6px 8px 6px 6px',
                            border: darkMode
                                ? '1px solid rgba(255, 255, 255, 0.06)'
                                : '1px solid rgba(0, 0, 0, 0.04)',
                        }}
                    >
                        <Button
                            variant="contained"
                            startIcon={isValidating ? <CircularProgress size={16} color="inherit" /> : <ValidateIcon sx={{ fontSize: '18px !important' }} />}
                            onClick={handleValidate}
                            disabled={isValidating || !inputYaml.trim()}
                            sx={{
                                background: isValidating
                                    ? (darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)')
                                    : 'linear-gradient(145deg, #32D74B 0%, #30B84A 100%)',
                                color: isValidating ? (darkMode ? '#888' : '#999') : '#FFFFFF',
                                borderRadius: '12px',
                                textTransform: 'none',
                                fontSize: '14px',
                                fontWeight: 600,
                                px: 3,
                                py: 1,
                                minHeight: 40,
                                letterSpacing: '-0.01em',
                                boxShadow: isValidating ? 'none' : '0 2px 8px rgba(48, 209, 88, 0.3)',
                                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                '&:hover': {
                                    background: 'linear-gradient(145deg, #3AE254 0%, #32D74B 100%)',
                                    boxShadow: '0 4px 14px rgba(48, 209, 88, 0.4)',
                                },
                                '&:disabled': {
                                    background: darkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
                                    color: darkMode ? '#555' : '#AAA',
                                    boxShadow: 'none',
                                },
                            }}
                        >
                            {isValidating ? 'Validating...' : 'Validate'}
                        </Button>

                        {/* Auto-Fix Toggle */}
                        <Box
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 0.75,
                            }}
                        >
                            <Typography
                                sx={{
                                    fontSize: '12px',
                                    color: darkMode ? 'rgba(255, 255, 255, 0.55)' : 'rgba(0, 0, 0, 0.5)',
                                    fontWeight: 500,
                                    letterSpacing: '-0.01em',
                                }}
                            >
                                Auto-Fix
                            </Typography>
                            <Switch
                                checked={fixEnabled}
                                onChange={(e) => setFixEnabled(e.target.checked)}
                                size="small"
                                sx={{
                                    '& .MuiSwitch-switchBase.Mui-checked': {
                                        color: '#32D74B',
                                    },
                                    '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                                        backgroundColor: '#32D74B',
                                    },
                                }}
                            />
                        </Box>
                    </Box>

                    {/* Right Section - Tools */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                        {/* Console */}
                        <Tooltip title="Console" arrow placement="bottom">
                            <Badge
                                badgeContent={changes.length + errors.length}
                                max={99}
                                invisible={changes.length + errors.length === 0}
                                sx={{
                                    '& .MuiBadge-badge': {
                                        fontSize: '10px',
                                        minWidth: 18,
                                        height: 18,
                                        bgcolor: '#1A73E8',
                                        color: '#FFF',
                                        fontWeight: 600,
                                        border: darkMode ? '2px solid #1c1c1e' : '2px solid #FFF',
                                    },
                                }}
                            >
                                <IconButton
                                    onClick={() => setShowConsole(!showConsole)}
                                    sx={{
                                        width: 42,
                                        height: 42,
                                        borderRadius: '12px',
                                        color: showConsole
                                            ? (darkMode ? '#8AB4F8' : '#1A73E8')
                                            : (darkMode ? 'rgba(255, 255, 255, 0.65)' : 'rgba(0, 0, 0, 0.55)'),
                                        bgcolor: showConsole
                                            ? (darkMode ? 'rgba(208, 188, 255, 0.15)' : 'rgba(103, 80, 164, 0.1)')
                                            : 'transparent',
                                        transition: 'all 0.15s ease',
                                        '&:hover': {
                                            bgcolor: darkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
                                        },
                                    }}
                                >
                                    <ConsoleIcon sx={{ fontSize: 22 }} />
                                </IconButton>
                            </Badge>
                        </Tooltip>

                        {/* Documentation */}
                        <Tooltip title="Documentation" arrow placement="bottom">
                            <IconButton
                                onClick={() => setShowDocumentation(true)}
                                sx={{
                                    width: 42,
                                    height: 42,
                                    borderRadius: '12px',
                                    color: darkMode ? 'rgba(255, 255, 255, 0.65)' : 'rgba(0, 0, 0, 0.55)',
                                    transition: 'all 0.15s ease',
                                    '&:hover': {
                                        bgcolor: darkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
                                    },
                                }}
                            >
                                <DocumentationIcon sx={{ fontSize: 22 }} />
                            </IconButton>
                        </Tooltip>

                        {/* Divider */}
                        <Box
                            sx={{
                                width: 1,
                                height: 28,
                                bgcolor: darkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
                                mx: 0.5,
                                borderRadius: 1,
                            }}
                        />

                        {/* Theme Toggle */}
                        <Tooltip title={darkMode ? 'Light Mode' : 'Dark Mode'} arrow placement="bottom">
                            <IconButton
                                onClick={() => setDarkMode(!darkMode)}
                                sx={{
                                    width: 42,
                                    height: 42,
                                    borderRadius: '12px',
                                    color: darkMode ? '#FFD60A' : '#FF9F0A',
                                    bgcolor: darkMode ? 'rgba(255, 214, 10, 0.1)' : 'rgba(255, 159, 10, 0.08)',
                                    transition: 'all 0.2s ease',
                                    '&:hover': {
                                        bgcolor: darkMode ? 'rgba(255, 214, 10, 0.18)' : 'rgba(255, 159, 10, 0.14)',
                                        transform: 'rotate(15deg)',
                                    },
                                }}
                            >
                                {darkMode ? <LightModeIcon sx={{ fontSize: 22 }} /> : <DarkModeIcon sx={{ fontSize: 22 }} />}
                            </IconButton>
                        </Tooltip>
                    </Box>
                </Box>
            </Box>

            {/* Main Editor Area */}
            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                {/* Editors Container - Side by Side */}
                <Box
                    sx={{
                        flex: 1,
                        display: 'flex',
                        flexDirection: { xs: 'column', md: 'row' },
                        overflow: 'hidden',
                        gap: { xs: 0, md: 1 },
                        p: { xs: 0, md: 1 },
                        bgcolor: darkMode ? '#0a0a0a' : '#F0F0F3',
                    }}
                >
                    {/* Input Panel - Glassmorphism Card */}
                    <Box
                        sx={{
                            flex: 1,
                            display: 'flex',
                            flexDirection: 'column',
                            overflow: 'hidden',
                            borderRadius: { xs: 0, md: '16px' },
                            // Glassmorphism effect
                            background: darkMode
                                ? 'linear-gradient(180deg, rgba(28, 28, 30, 0.95) 0%, rgba(20, 20, 22, 0.98) 100%)'
                                : 'linear-gradient(180deg, rgba(255, 255, 255, 0.98) 0%, rgba(250, 250, 252, 1) 100%)',
                            backdropFilter: 'blur(20px) saturate(180%)',
                            WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                            border: darkMode
                                ? '1px solid rgba(255, 255, 255, 0.08)'
                                : '1px solid rgba(0, 0, 0, 0.06)',
                            boxShadow: darkMode
                                ? '0 4px 24px rgba(0, 0, 0, 0.3), 0 1px 0 rgba(255, 255, 255, 0.03) inset'
                                : '0 4px 24px rgba(0, 0, 0, 0.06), 0 1px 0 rgba(255, 255, 255, 0.9) inset',
                        }}
                    >
                        {/* Panel Header */}
                        <Box
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                px: 2.5,
                                py: 1.5,
                                borderBottom: darkMode
                                    ? '1px solid rgba(255, 255, 255, 0.06)'
                                    : '1px solid rgba(0, 0, 0, 0.05)',
                                background: darkMode
                                    ? 'linear-gradient(180deg, rgba(255, 255, 255, 0.03) 0%, transparent 100%)'
                                    : 'linear-gradient(180deg, rgba(255, 255, 255, 0.8) 0%, transparent 100%)',
                            }}
                        >
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                <Box
                                    sx={{
                                        width: 10,
                                        height: 10,
                                        borderRadius: '50%',
                                        bgcolor: inputYaml
                                            ? (darkMode ? '#8AB4F8' : '#1A73E8')
                                            : (darkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.15)'),
                                        boxShadow: inputYaml
                                            ? `0 0 8px ${darkMode ? 'rgba(208, 188, 255, 0.5)' : 'rgba(103, 80, 164, 0.4)'}`
                                            : 'none',
                                        transition: 'all 0.3s ease',
                                    }}
                                />
                                <Typography
                                    sx={{
                                        fontWeight: 600,
                                        color: darkMode ? '#FFFFFF' : '#1C1B1F',
                                        fontSize: '14px',
                                        letterSpacing: '-0.01em',
                                    }}
                                >
                                    Input YAML
                                </Typography>
                                {inputYaml && (
                                    <Chip
                                        label={`${inputYaml.split('\n').length} lines`}
                                        size="small"
                                        sx={{
                                            height: 20,
                                            fontSize: '10px',
                                            fontWeight: 500,
                                            bgcolor: darkMode ? 'rgba(208, 188, 255, 0.15)' : 'rgba(103, 80, 164, 0.1)',
                                            color: darkMode ? '#8AB4F8' : '#1A73E8',
                                        }}
                                    />
                                )}
                            </Box>
                            {inputYaml && (
                                <Button
                                    size="small"
                                    onClick={handleClear}
                                    startIcon={<ClearIcon sx={{ fontSize: 14 }} />}
                                    sx={{
                                        color: darkMode ? '#F2B8B5' : '#BA1A1A',
                                        fontSize: '12px',
                                        fontWeight: 500,
                                        minWidth: 'auto',
                                        px: 1.5,
                                        py: 0.5,
                                        borderRadius: '8px',
                                        transition: 'all 0.15s ease',
                                        '&:hover': {
                                            bgcolor: darkMode ? 'rgba(242, 184, 181, 0.1)' : 'rgba(186, 26, 26, 0.08)',
                                        },
                                    }}
                                >
                                    Clear
                                </Button>
                            )}
                        </Box>

                        {/* Editor */}
                        <Box sx={{ flex: 1, minHeight: 0 }}>
                            <CodeEditor
                                value={inputYaml}
                                onChange={(value) => setInputYaml(value || '')}
                                theme={darkMode ? 'dark' : 'light'}
                            />
                        </Box>
                    </Box>

                    {/* Output Panel - Glassmorphism Card */}
                    <Box
                        sx={{
                            flex: 1,
                            display: 'flex',
                            flexDirection: 'column',
                            overflow: 'hidden',
                            borderRadius: { xs: 0, md: '16px' },
                            // Glassmorphism effect
                            background: darkMode
                                ? 'linear-gradient(180deg, rgba(28, 28, 30, 0.95) 0%, rgba(20, 20, 22, 0.98) 100%)'
                                : 'linear-gradient(180deg, rgba(255, 255, 255, 0.98) 0%, rgba(250, 250, 252, 1) 100%)',
                            backdropFilter: 'blur(20px) saturate(180%)',
                            WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                            border: darkMode
                                ? '1px solid rgba(255, 255, 255, 0.08)'
                                : '1px solid rgba(0, 0, 0, 0.06)',
                            boxShadow: darkMode
                                ? '0 4px 24px rgba(0, 0, 0, 0.3), 0 1px 0 rgba(255, 255, 255, 0.03) inset'
                                : '0 4px 24px rgba(0, 0, 0, 0.06), 0 1px 0 rgba(255, 255, 255, 0.9) inset',
                        }}
                    >
                        {/* Panel Header */}
                        <Box
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                px: 2.5,
                                py: 1.5,
                                borderBottom: darkMode
                                    ? '1px solid rgba(255, 255, 255, 0.06)'
                                    : '1px solid rgba(0, 0, 0, 0.05)',
                                background: darkMode
                                    ? 'linear-gradient(180deg, rgba(255, 255, 255, 0.03) 0%, transparent 100%)'
                                    : 'linear-gradient(180deg, rgba(255, 255, 255, 0.8) 0%, transparent 100%)',
                            }}
                        >
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                <Box
                                    sx={{
                                        width: 10,
                                        height: 10,
                                        borderRadius: '50%',
                                        bgcolor: outputYaml
                                            ? (isValid ? '#32D74B' : '#FF9F0A')
                                            : (darkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.15)'),
                                        boxShadow: outputYaml
                                            ? `0 0 8px ${isValid ? 'rgba(50, 215, 75, 0.5)' : 'rgba(255, 159, 10, 0.5)'}`
                                            : 'none',
                                        transition: 'all 0.3s ease',
                                    }}
                                />
                                <Typography
                                    sx={{
                                        fontWeight: 600,
                                        color: darkMode ? '#FFFFFF' : '#1C1B1F',
                                        fontSize: '14px',
                                        letterSpacing: '-0.01em',
                                    }}
                                >
                                    {fixEnabled ? 'Fixed Output' : 'Validation Result'}
                                </Typography>
                                {outputYaml && (
                                    <Chip
                                        label={isValid ? 'Valid' : `${errors.length} issues`}
                                        size="small"
                                        sx={{
                                            height: 20,
                                            fontSize: '10px',
                                            fontWeight: 500,
                                            bgcolor: isValid
                                                ? (darkMode ? 'rgba(50, 215, 75, 0.15)' : 'rgba(52, 199, 89, 0.1)')
                                                : (darkMode ? 'rgba(255, 159, 10, 0.15)' : 'rgba(255, 149, 0, 0.1)'),
                                            color: isValid
                                                ? (darkMode ? '#32D74B' : '#34C759')
                                                : (darkMode ? '#FF9F0A' : '#FF9500'),
                                        }}
                                    />
                                )}
                            </Box>

                            <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
                                {outputYaml && (
                                    <>
                                        <Tooltip title="Copy" arrow>
                                            <IconButton
                                                size="small"
                                                onClick={handleCopy}
                                                sx={{
                                                    color: darkMode ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.5)',
                                                    borderRadius: '8px',
                                                    '&:hover': {
                                                        bgcolor: darkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
                                                    },
                                                }}
                                            >
                                                <CopyIcon sx={{ fontSize: 18 }} />
                                            </IconButton>
                                        </Tooltip>
                                        <Tooltip title="Download" arrow>
                                            <IconButton
                                                size="small"
                                                onClick={handleDownload}
                                                sx={{
                                                    color: darkMode ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.5)',
                                                    borderRadius: '8px',
                                                    '&:hover': {
                                                        bgcolor: darkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
                                                    },
                                                }}
                                            >
                                                <DownloadIcon sx={{ fontSize: 18 }} />
                                            </IconButton>
                                        </Tooltip>
                                        <Button
                                            size="small"
                                            variant={showDiff ? 'contained' : 'text'}
                                            onClick={() => setShowDiff(!showDiff)}
                                            startIcon={<DiffIcon sx={{ fontSize: 14 }} />}
                                            sx={{
                                                color: showDiff ? '#FFF' : (darkMode ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.5)'),
                                                bgcolor: showDiff ? (darkMode ? '#1A73E8' : '#1A73E8') : 'transparent',
                                                borderRadius: '8px',
                                                fontSize: '11px',
                                                fontWeight: 500,
                                                minWidth: 'auto',
                                                px: 1.5,
                                                '&:hover': {
                                                    bgcolor: showDiff
                                                        ? '#5195F4'
                                                        : (darkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)'),
                                                },
                                            }}
                                        >
                                            Diff
                                        </Button>
                                    </>
                                )}
                            </Box>
                        </Box>

                        {/* Editor */}
                        <Box sx={{ flex: 1, minHeight: 0, position: 'relative' }}>
                            {!outputYaml && (
                                <Box
                                    sx={{
                                        position: 'absolute',
                                        inset: 0,
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: darkMode ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.25)',
                                        zIndex: 10,
                                        pointerEvents: 'none',
                                    }}
                                >
                                    <CheckIcon sx={{ fontSize: 56, opacity: 0.5, mb: 1.5 }} />
                                    <Typography sx={{ fontWeight: 600, fontSize: '15px', mb: 0.5 }}>
                                        Ready to validate
                                    </Typography>
                                    <Typography sx={{ fontSize: '13px', opacity: 0.7 }}>
                                        Paste YAML and click Validate
                                    </Typography>
                                </Box>
                            )}
                            <CodeEditor
                                value={outputYaml}
                                theme={darkMode ? 'dark' : 'light'}
                                readOnly={true}
                                diffMode={showDiff}
                                originalValue={inputYaml}
                                modifiedValue={outputYaml}
                            />
                        </Box>
                    </Box>
                </Box>

                {/* Footer - Server Status Bar */}
                <Box
                    component="footer"
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        px: { xs: 2, md: 3 },
                        py: 1,
                        minHeight: 36,
                        background: darkMode
                            ? 'linear-gradient(180deg, rgba(18, 18, 20, 0.95) 0%, rgba(12, 12, 14, 0.98) 100%)'
                            : 'linear-gradient(180deg, rgba(250, 250, 252, 0.98) 0%, rgba(245, 245, 247, 1) 100%)',
                        borderTop: darkMode
                            ? '1px solid rgba(255, 255, 255, 0.06)'
                            : '1px solid rgba(0, 0, 0, 0.06)',
                        backdropFilter: 'blur(12px)',
                        WebkitBackdropFilter: 'blur(12px)',
                    }}
                >
                    {/* Left - Server Status */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Box
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 0.75,
                                px: 1,
                                py: 0.25,
                                borderRadius: '6px',
                                bgcolor: darkMode ? 'rgba(50, 215, 75, 0.1)' : 'rgba(52, 199, 89, 0.08)',
                            }}
                        >
                            <Box
                                sx={{
                                    width: 6,
                                    height: 6,
                                    borderRadius: '50%',
                                    bgcolor: '#32D74B',
                                    boxShadow: '0 0 6px rgba(50, 215, 75, 0.6)',
                                    animation: 'pulse 2s ease-in-out infinite',
                                    '@keyframes pulse': {
                                        '0%, 100%': { opacity: 1 },
                                        '50%': { opacity: 0.5 },
                                    },
                                }}
                            />
                            <Typography
                                sx={{
                                    fontSize: '11px',
                                    fontWeight: 500,
                                    color: darkMode ? '#32D74B' : '#34C759',
                                    letterSpacing: '-0.01em',
                                }}
                            >
                                Server Connected
                            </Typography>
                        </Box>
                        <Typography
                            sx={{
                                fontSize: '11px',
                                color: darkMode ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.35)',
                            }}
                        >
                            localhost:3001
                        </Typography>
                    </Box>

                    {/* Center - Stats */}
                    <Box sx={{ display: { xs: 'none', sm: 'flex' }, alignItems: 'center', gap: 2 }}>
                        {processingTime > 0 && (
                            <Typography
                                sx={{
                                    fontSize: '11px',
                                    color: darkMode ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.35)',
                                }}
                            >
                                Last validation: {processingTime}ms
                            </Typography>
                        )}
                        {changes.length > 0 && (
                            <Typography
                                sx={{
                                    fontSize: '11px',
                                    color: darkMode ? '#8AB4F8' : '#1A73E8',
                                    fontWeight: 500,
                                }}
                            >
                                {changes.length} fixes applied
                            </Typography>
                        )}
                    </Box>

                    {/* Right - Version */}
                    <Typography
                        sx={{
                            fontSize: '11px',
                            color: darkMode ? 'rgba(255, 255, 255, 0.35)' : 'rgba(0, 0, 0, 0.3)',
                        }}
                    >
                        v1.0.0
                    </Typography>
                </Box>
            </Box>

            {/* Console Drawer - Clean Google MD3 Design */}
            <Drawer
                anchor="right"
                open={showConsole}
                onClose={() => setShowConsole(false)}
                variant="temporary"
                sx={{
                    '& .MuiBackdrop-root': {
                        bgcolor: darkMode ? 'rgba(0, 0, 0, 0.5)' : 'rgba(0, 0, 0, 0.25)',
                        backdropFilter: 'blur(2px)',
                    },
                    '& .MuiDrawer-paper': {
                        width: { xs: '100%', md: 450 },
                        boxSizing: 'border-box',
                        bgcolor: darkMode ? '#050505' : '#FFFFFF', // Darker background
                        borderLeft: darkMode ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(0, 0, 0, 0.06)',
                        background: darkMode
                            ? '#050505'
                            : '#FFFFFF',
                        backdropFilter: 'none',
                    },
                }}
            >
                <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                    {/* Clean Header - No Icon */}
                    <Box
                        sx={{
                            px: 2.5,
                            py: 2,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            borderBottom: darkMode
                                ? '1px solid rgba(255, 255, 255, 0.06)'
                                : '1px solid rgba(0, 0, 0, 0.06)',
                        }}
                    >
                        <Box>
                            <Typography
                                sx={{
                                    fontWeight: 500,
                                    fontSize: '18px',
                                    color: darkMode ? '#E3E3E3' : '#202124',
                                    letterSpacing: '-0.01em',
                                }}
                            >
                                Console
                            </Typography>
                            <Typography
                                sx={{
                                    fontSize: '12px',
                                    color: darkMode ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)',
                                    mt: 0.25,
                                }}
                            >
                                {changes.length + errors.length === 0
                                    ? 'No results yet'
                                    : `${changes.length} fixes, ${errors.length} errors`}
                            </Typography>
                        </Box>
                        <IconButton
                            onClick={() => setShowConsole(false)}
                            size="small"
                            sx={{
                                color: darkMode ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.5)',
                                '&:hover': {
                                    bgcolor: darkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
                                },
                            }}
                        >
                            <CloseIcon sx={{ fontSize: 20 }} />
                        </IconButton>
                    </Box>

                    {/* Google-style Pill Tabs */}
                    <Box
                        sx={{
                            px: 2.5,
                            py: 1.5,
                            display: 'flex',
                            gap: 1,
                            borderBottom: darkMode
                                ? '1px solid rgba(255, 255, 255, 0.06)'
                                : '1px solid rgba(0, 0, 0, 0.06)',
                        }}
                    >
                        <Button
                            size="small"
                            onClick={() => setConsoleTab('fixes')}
                            startIcon={<CheckIcon sx={{ fontSize: 16 }} />}
                            sx={{
                                borderRadius: '20px',
                                px: 2,
                                py: 0.75,
                                fontSize: '13px',
                                fontWeight: 500,
                                textTransform: 'none',
                                minWidth: 'auto',
                                bgcolor: consoleTab === 'fixes'
                                    ? (darkMode ? 'rgba(129, 201, 149, 0.15)' : 'rgba(30, 142, 62, 0.1)')
                                    : 'transparent',
                                color: consoleTab === 'fixes'
                                    ? (darkMode ? '#81C995' : '#1E8E3E')
                                    : (darkMode ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)'),
                                border: consoleTab === 'fixes'
                                    ? (darkMode ? '1px solid rgba(129, 201, 149, 0.3)' : '1px solid rgba(30, 142, 62, 0.2)')
                                    : '1px solid transparent',
                                '&:hover': {
                                    bgcolor: consoleTab === 'fixes'
                                        ? (darkMode ? 'rgba(129, 201, 149, 0.2)' : 'rgba(30, 142, 62, 0.15)')
                                        : (darkMode ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)'),
                                },
                            }}
                        >
                            Fixes{changes.length > 0 && ` (${changes.length})`}
                        </Button>
                        <Button
                            size="small"
                            onClick={() => setConsoleTab('errors')}
                            startIcon={<ErrorIcon sx={{ fontSize: 16 }} />}
                            sx={{
                                borderRadius: '20px',
                                px: 2,
                                py: 0.75,
                                fontSize: '13px',
                                fontWeight: 500,
                                textTransform: 'none',
                                minWidth: 'auto',
                                bgcolor: consoleTab === 'errors'
                                    ? (darkMode ? 'rgba(242, 139, 130, 0.15)' : 'rgba(217, 48, 37, 0.1)')
                                    : 'transparent',
                                color: consoleTab === 'errors'
                                    ? (darkMode ? '#F28B82' : '#D93025')
                                    : (darkMode ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)'),
                                border: consoleTab === 'errors'
                                    ? (darkMode ? '1px solid rgba(242, 139, 130, 0.3)' : '1px solid rgba(217, 48, 37, 0.2)')
                                    : '1px solid transparent',
                                '&:hover': {
                                    bgcolor: consoleTab === 'errors'
                                        ? (darkMode ? 'rgba(242, 139, 130, 0.2)' : 'rgba(217, 48, 37, 0.15)')
                                        : (darkMode ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)'),
                                },
                            }}
                        >
                            Errors{errors.length > 0 && ` (${errors.length})`}
                        </Button>
                    </Box>

                    {/* Content Area */}
                    <Box
                        sx={{
                            flex: 1,
                            overflow: 'auto',
                            px: 2.5,
                            py: 2,
                            '&::-webkit-scrollbar': {
                                width: 4,
                            },
                            '&::-webkit-scrollbar-thumb': {
                                bgcolor: darkMode ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.1)',
                                borderRadius: 2,
                            },
                        }}
                    >
                        {/* Statistics Panel */}
                        {(changes.length > 0 || errors.length > 0) && (
                            <Box
                                sx={{
                                    p: 2,
                                    mb: 2,
                                    borderRadius: '12px',
                                    bgcolor: darkMode ? 'rgba(138, 180, 248, 0.08)' : 'rgba(26, 115, 232, 0.05)',
                                    border: darkMode
                                        ? '1px solid rgba(138, 180, 248, 0.12)'
                                        : '1px solid rgba(26, 115, 232, 0.1)',
                                }}
                            >
                                <StatisticsPanel
                                    totalIssues={stats.totalIssues}
                                    fixedCount={stats.fixedCount}
                                    processingTimeMs={stats.processingTimeMs}
                                    confidence={stats.overallConfidence}
                                />
                            </Box>
                        )}

                        {/* Fixes Tab */}
                        {consoleTab === 'fixes' ? (
                            changes.length > 0 ? (
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                    {Object.entries(groupedChanges).map(([category, categoryChanges]) => (
                                        <Box key={category}>
                                            <Typography
                                                sx={{
                                                    fontSize: '12px',
                                                    fontWeight: 500,
                                                    color: darkMode ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)',
                                                    mb: 1.5,
                                                    textTransform: 'capitalize',
                                                }}
                                            >
                                                {category} ({categoryChanges.length})
                                            </Typography>
                                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                                                {categoryChanges.map((change, idx) => (
                                                    <Box
                                                        key={idx}
                                                        sx={{
                                                            p: 2,
                                                            borderRadius: '12px',
                                                            bgcolor: darkMode ? '#1E1E1E' : '#FFFFFF',
                                                            border: darkMode
                                                                ? '1px solid rgba(255, 255, 255, 0.06)'
                                                                : '1px solid rgba(0, 0, 0, 0.04)',
                                                        }}
                                                    >
                                                        <Box sx={{ display: 'flex', gap: 1, mb: 1.5, flexWrap: 'wrap' }}>
                                                            <Chip
                                                                label={change.type}
                                                                size="small"
                                                                sx={{
                                                                    height: 22,
                                                                    fontSize: '11px',
                                                                    fontWeight: 500,
                                                                    bgcolor: darkMode ? 'rgba(138, 180, 248, 0.12)' : 'rgba(26, 115, 232, 0.08)',
                                                                    color: darkMode ? '#8AB4F8' : '#1A73E8',
                                                                }}
                                                            />
                                                            <Chip
                                                                label={formatConfidence(change.confidence)}
                                                                size="small"
                                                                sx={{
                                                                    height: 22,
                                                                    fontSize: '11px',
                                                                    fontWeight: 500,
                                                                    bgcolor: `${getConfidenceColor(change.confidence)}15`,
                                                                    color: getConfidenceColor(change.confidence),
                                                                }}
                                                            />
                                                        </Box>
                                                        <Typography
                                                            sx={{
                                                                fontSize: '13px',
                                                                color: darkMode ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.75)',
                                                                mb: 1.5,
                                                                lineHeight: 1.5,
                                                            }}
                                                        >
                                                            {change.reason}
                                                        </Typography>
                                                        <Box
                                                            sx={{
                                                                p: 1.5,
                                                                borderRadius: '8px',
                                                                bgcolor: darkMode ? 'rgba(0, 0, 0, 0.25)' : '#FFFFFF',
                                                                fontFamily: '"Roboto Mono", monospace',
                                                                fontSize: '12px',
                                                                lineHeight: 1.5,
                                                                border: darkMode
                                                                    ? '1px solid rgba(255, 255, 255, 0.05)'
                                                                    : '1px solid rgba(0, 0, 0, 0.06)',
                                                            }}
                                                        >
                                                            <Box
                                                                sx={{
                                                                    color: darkMode ? '#F28B82' : '#D93025',
                                                                    textDecoration: 'line-through',
                                                                    opacity: 0.7,
                                                                    mb: 0.5,
                                                                    wordBreak: 'break-word',
                                                                }}
                                                            >
                                                                − {change.original}
                                                            </Box>
                                                            <Box
                                                                sx={{
                                                                    color: darkMode ? '#81C995' : '#1E8E3E',
                                                                    wordBreak: 'break-word',
                                                                }}
                                                            >
                                                                + {change.fixed}
                                                            </Box>
                                                        </Box>
                                                    </Box>
                                                ))}
                                            </Box>
                                        </Box>
                                    ))}
                                </Box>
                            ) : (
                                <Box
                                    sx={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        py: 6,
                                        textAlign: 'center',
                                    }}
                                >
                                    <CheckIcon
                                        sx={{
                                            fontSize: 48,
                                            color: darkMode ? 'rgba(129, 201, 149, 0.3)' : 'rgba(30, 142, 62, 0.2)',
                                            mb: 2,
                                        }}
                                    />
                                    <Typography
                                        sx={{
                                            fontSize: '14px',
                                            fontWeight: 500,
                                            color: darkMode ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)',
                                            mb: 0.5,
                                        }}
                                    >
                                        No fixes yet
                                    </Typography>
                                    <Typography
                                        sx={{
                                            fontSize: '13px',
                                            color: darkMode ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.4)',
                                        }}
                                    >
                                        Validate YAML to see fixes
                                    </Typography>
                                </Box>
                            )
                        ) : (
                            /* Errors Tab */
                            errors.length > 0 ? (
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                    {Object.entries(groupedErrors).map(([severity, severityErrors]) => (
                                        <Box key={severity}>
                                            <Typography
                                                sx={{
                                                    fontSize: '12px',
                                                    fontWeight: 500,
                                                    color: severity === 'error'
                                                        ? (darkMode ? '#F28B82' : '#D93025')
                                                        : severity === 'warning'
                                                            ? (darkMode ? '#FDD663' : '#F29900')
                                                            : (darkMode ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)'),
                                                    mb: 1.5,
                                                    textTransform: 'capitalize',
                                                }}
                                            >
                                                {severity} ({severityErrors.length})
                                            </Typography>
                                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                                                {severityErrors.map((error, idx) => (
                                                    <Box
                                                        key={idx}
                                                        sx={{
                                                            p: 2,
                                                            borderRadius: '12px',
                                                            bgcolor: darkMode ? '#1E1E1E' : '#FFFFFF',
                                                            border: darkMode ? '1px solid rgba(255, 255, 255, 0.06)' : '1px solid rgba(0, 0, 0, 0.04)',
                                                            borderLeft: '3px solid',
                                                            borderLeftColor: severity === 'error'
                                                                ? (darkMode ? '#F28B82' : '#D93025')
                                                                : severity === 'warning'
                                                                    ? (darkMode ? '#FDD663' : '#F29900')
                                                                    : (darkMode ? '#8AB4F8' : '#1A73E8'),
                                                        }}
                                                    >
                                                        <Box sx={{ display: 'flex', gap: 1, mb: 1, flexWrap: 'wrap' }}>
                                                            <Chip
                                                                label={`Line ${error.line}`}
                                                                size="small"
                                                                sx={{
                                                                    height: 22,
                                                                    fontSize: '11px',
                                                                    fontWeight: 500,
                                                                    bgcolor: darkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
                                                                    color: darkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)',
                                                                }}
                                                            />
                                                            {error.code && (
                                                                <Chip
                                                                    label={error.code}
                                                                    size="small"
                                                                    variant="outlined"
                                                                    sx={{
                                                                        height: 22,
                                                                        fontSize: '11px',
                                                                        fontWeight: 500,
                                                                        borderColor: darkMode ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.12)',
                                                                        color: darkMode ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.45)',
                                                                    }}
                                                                />
                                                            )}
                                                        </Box>
                                                        <Typography
                                                            sx={{
                                                                fontSize: '13px',
                                                                color: darkMode ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.75)',
                                                                lineHeight: 1.5,
                                                            }}
                                                        >
                                                            {error.message}
                                                        </Typography>
                                                    </Box>
                                                ))}
                                            </Box>
                                        </Box>
                                    ))}
                                </Box>
                            ) : (
                                <Box
                                    sx={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        py: 6,
                                        textAlign: 'center',
                                    }}
                                >
                                    <CheckIcon
                                        sx={{
                                            fontSize: 48,
                                            color: darkMode ? 'rgba(129, 201, 149, 0.3)' : 'rgba(30, 142, 62, 0.2)',
                                            mb: 2,
                                        }}
                                    />
                                    <Typography
                                        sx={{
                                            fontSize: '14px',
                                            fontWeight: 500,
                                            color: darkMode ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)',
                                            mb: 0.5,
                                        }}
                                    >
                                        No errors
                                    </Typography>
                                    <Typography
                                        sx={{
                                            fontSize: '13px',
                                            color: darkMode ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.4)',
                                        }}
                                    >
                                        YAML is valid
                                    </Typography>
                                </Box>
                            )
                        )}
                    </Box>
                </Box>
            </Drawer>

            {/* Documentation Modal */}
            {showDocumentation && (
                <Documentation onClose={() => setShowDocumentation(false)} darkMode={darkMode} />
            )}

            {/* Snackbar Toasts */}
            {toasts.map(toast => (
                <Snackbar
                    key={toast.id}
                    open={true}
                    autoHideDuration={3000}
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                >
                    <Alert
                        severity={toast.type === 'success' ? 'success' : toast.type === 'error' ? 'error' : 'info'}
                        variant="filled"
                        sx={{ borderRadius: '10px' }}
                    >
                        {toast.message}
                    </Alert>
                </Snackbar>
            ))}
        </Box>
    );
};
