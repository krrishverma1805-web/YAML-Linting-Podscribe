import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    IconButton,
    InputBase,
    Divider,
    Paper,
    List,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Grid,
    Chip,
    useTheme,
    alpha,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow
} from '@mui/material';
import {
    MenuBook as OverviewIcon,
    RocketLaunch as QuickStartIcon,
    Loop as PipelineIcon,
    Build as FixerIcon,
    Psychology as SemanticIcon,
    LibraryBooks as KnowledgeIcon,
    Analytics as ConfidenceIcon,
    Terminal as CliIcon,
    Api as ApiIcon,
    AccountTree as ArchitectureIcon,
    Help as FaqIcon,
    Search as SearchIcon,
    Close as CloseIcon,
    Speed as SpeedIcon,
    Security as SecurityIcon,
    AutoFixHigh as AutoFixIcon,
    CheckCircle as CheckIcon,
    Storage as StorageIcon,
    TouchApp as InterfaceIcon,
    Settings as BackendIcon,
    UploadFile as UploadIcon,
    Policy as RegoIcon,
    PlayArrow as ValidateIcon,
    Terminal as ConsoleIcon,
    Code as CodeIcon,
    Palette as DesignIcon,
    BugReport as TestIcon,
    Tune as ConfigIcon,
    DataObject as ExamplesIcon
} from '@mui/icons-material';

interface DocumentationProps {
    onClose?: () => void;
}

export const Documentation: React.FC<DocumentationProps> = ({ onClose }) => {
    const theme = useTheme();
    const [activeSection, setActiveSection] = useState('overview');
    const [searchQuery, setSearchQuery] = useState('');
    const isDarkMode = theme.palette.mode === 'dark';

    const sections = [
        { id: 'overview', title: 'Overview', icon: <OverviewIcon fontSize="small" /> },
        { id: 'features', title: 'Key Features', icon: <CheckIcon fontSize="small" /> },
        { id: 'validation-pipeline', title: '10-Stage Pipeline', icon: <PipelineIcon fontSize="small" /> },
        { id: 'semantic-validator', title: 'Semantic Validator', icon: <SemanticIcon fontSize="small" /> },
        { id: 'fixer-architecture', title: '5-Pass Fixer', icon: <FixerIcon fontSize="small" /> },
        { id: 'type-registry', title: 'Type Registry', icon: <KnowledgeIcon fontSize="small" /> },
        { id: 'cli-tool', title: 'CLI Tool', icon: <CliIcon fontSize="small" /> },
        { id: 'architecture', title: 'Architecture', icon: <ArchitectureIcon fontSize="small" /> },
        { id: 'api-reference', title: 'API Endpoints', icon: <ApiIcon fontSize="small" /> },
        { id: 'usage', title: 'Usage Guide', icon: <InterfaceIcon fontSize="small" /> },
        { id: 'configuration', title: 'Configuration', icon: <ConfigIcon fontSize="small" /> },
        { id: 'examples', title: 'Real-World Examples', icon: <ExamplesIcon fontSize="small" /> },
        { id: 'performance', title: 'Performance', icon: <SpeedIcon fontSize="small" /> },
        { id: 'project-structure', title: 'Project Structure', icon: <CodeIcon fontSize="small" /> },
        { id: 'design-system', title: 'Design System', icon: <DesignIcon fontSize="small" /> },
    ];

    const scrollToSection = (id: string) => {
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
            setActiveSection(id);
        }
    };

    useEffect(() => {
        const handleScroll = () => {
            const contentDiv = document.getElementById('docs-content');
            if (!contentDiv) return;
            const scrollPosition = contentDiv.scrollTop;
            let currentSection = sections[0].id;
            for (const section of sections) {
                const element = document.getElementById(section.id);
                if (element && scrollPosition >= element.offsetTop - 120) {
                    currentSection = section.id;
                }
            }
            setActiveSection(currentSection);
        };
        const contentDiv = document.getElementById('docs-content');
        if (contentDiv) {
            contentDiv.addEventListener('scroll', handleScroll);
            handleScroll();
        }
        return () => contentDiv?.removeEventListener('scroll', handleScroll);
    }, []);

    const filteredSections = sections.filter(s =>
        s.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Styles
    const headingStyle = {
        fontWeight: 700,
        color: isDarkMode ? '#FFFFFF' : '#202124',
        mb: 2,
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
    };

    const subHeadingStyle = {
        fontWeight: 600,
        color: isDarkMode ? '#e0e0e0' : '#333',
        mb: 1.5,
        mt: 3
    };

    const paragraphStyle = {
        color: 'text.secondary',
        mb: 2,
        lineHeight: 1.6,
        fontSize: '15px'
    };

    const cardStyle = {
        p: 3,
        borderRadius: '16px',
        bgcolor: isDarkMode ? 'rgba(255, 255, 255, 0.03)' : '#FFFFFF',
        border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)'}`,
        height: '100%',
    };

    const codeBlockStyle = {
        p: 2,
        borderRadius: '8px',
        bgcolor: isDarkMode ? '#0d0d0d' : '#f5f7f9',
        color: isDarkMode ? '#e6edf3' : '#24292f',
        fontFamily: 'JetBrains Mono, "Fira Code", monospace',
        fontSize: '13px',
        overflowX: 'auto',
        border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0,0,0,0.05)'}`,
        whiteSpace: 'pre',
        mb: 2
    };

    const SectionWrapper = ({ id, children }: { id: string, children: React.ReactNode }) => (
        <Box id={id} sx={{ scrollMarginTop: 100, mb: 8 }}>
            {children}
            <Divider sx={{ mt: 6, opacity: 0.5 }} />
        </Box>
    );

    return (
        <Box sx={{
            display: 'flex',
            width: '100%',
            height: '100%',
            bgcolor: isDarkMode ? '#121212' : '#F9FAFB',
            overflow: 'hidden',
        }}>
            {/* Sidebar */}
            <Paper
                elevation={0}
                sx={{
                    width: 280,
                    flexShrink: 0,
                    borderRight: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
                    bgcolor: isDarkMode ? '#1E1E1E' : '#FFFFFF',
                    display: 'flex',
                    flexDirection: 'column',
                    zIndex: 2,
                }}
            >
                <Box sx={{ p: 3, borderBottom: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}` }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="h6" fontWeight={800} sx={{ background: 'linear-gradient(45deg, #1A73E8, #8AB4F8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                            Podscribe
                        </Typography>
                        {onClose && (
                            <IconButton onClick={onClose} size="small">
                                <CloseIcon fontSize="small" />
                            </IconButton>
                        )}
                    </Box>
                    <Typography variant="caption" color="text.secondary">Documentation v2.0</Typography>
                </Box>

                <Box sx={{ p: 2 }}>
                    <Box sx={{
                        position: 'relative',
                        borderRadius: '8px',
                        bgcolor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
                        '&:hover': { bgcolor: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)' },
                    }}>
                        <Box sx={{ position: 'absolute', left: 10, top: 9, color: 'text.secondary' }}>
                            <SearchIcon sx={{ fontSize: 18 }} />
                        </Box>
                        <InputBase
                            placeholder="Search docs..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            sx={{ pl: 5, pr: 2, py: 0.5, width: '100%', fontSize: '14px' }}
                        />
                    </Box>
                </Box>

                <List sx={{ flex: 1, overflowY: 'auto', px: 2, pb: 2 }}>
                    {filteredSections.map((section) => (
                        <ListItemButton
                            key={section.id}
                            onClick={() => scrollToSection(section.id)}
                            selected={activeSection === section.id}
                            sx={{
                                borderRadius: '8px',
                                mb: 0.5,
                                '&.Mui-selected': {
                                    bgcolor: isDarkMode ? 'rgba(138, 180, 248, 0.15)' : 'rgba(26, 115, 232, 0.1)',
                                    color: isDarkMode ? '#8AB4F8' : '#1A73E8',
                                    '& .MuiListItemIcon-root': { color: isDarkMode ? '#8AB4F8' : '#1A73E8' },
                                },
                            }}
                        >
                            <ListItemIcon sx={{ minWidth: 32, color: 'text.secondary' }}>
                                {section.icon}
                            </ListItemIcon>
                            <ListItemText
                                primary={section.title}
                                primaryTypographyProps={{ fontSize: '13px', fontWeight: 500 }}
                            />
                        </ListItemButton>
                    ))}
                </List>
            </Paper>

            {/* Main Content */}
            <Box
                id="docs-content"
                sx={{
                    flex: 1,
                    overflowY: 'auto',
                    scrollBehavior: 'smooth',
                    height: '100%',
                }}
            >
                <Box sx={{ maxWidth: 960, mx: 'auto', px: 6, py: 8 }}>

                    {/* OVERVIEW */}
                    <SectionWrapper id="overview">
                        <Typography variant="h3" sx={headingStyle}>
                            <OverviewIcon sx={{ color: '#1A73E8', fontSize: 36 }} /> Overview
                        </Typography>
                        <Typography variant="body1" sx={{ fontSize: '18px', mb: 3, lineHeight: 1.6, color: 'text.secondary' }}>
                            Podscribe is a powerful, intelligent web application for validating and automatically fixing Kubernetes YAML manifests with semantic understanding.
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, mb: 4 }}>
                            <Chip label="v1.0.0" size="small" color="primary" />
                            <Chip label="MIT License" size="small" color="success" />
                            <Chip label="TypeScript 5.6" size="small" color="info" />
                            <Chip label="React 18" size="small" color="info" />
                        </Box>
                    </SectionWrapper>

                    {/* FEATURES */}
                    <SectionWrapper id="features">
                        <Typography variant="h4" sx={headingStyle}>
                            <CheckIcon sx={{ color: '#1A73E8' }} /> Key Features
                        </Typography>
                        <Grid container spacing={3}>
                            {[
                                { title: '10-Stage Pipeline', desc: 'Production-grade validation system processes YAML through 10 comprehensive stages.' },
                                { title: 'Semantic Intelligence', desc: 'Understands Kubernetes YAML structure semantically, not just through pattern matching.' },
                                { title: '5-Pass Repair', desc: 'Multi-pass fixing with 95%+ accuracy for complex structural issues.' },
                                { title: 'Context-Aware', desc: 'Intelligently detects missing colons using 150+ known K8s fields.' },
                                { title: 'Fuzzy Matching', desc: 'Auto-corrects 80+ common typos like "contaienrs" or "metdata".' },
                                { title: 'Type Coercion', desc: 'Converts words to numbers ("three" -> 3) and handles boolean strings.' },
                            ].map((item, idx) => (
                                <Grid item xs={12} md={6} key={idx}>
                                    <Paper elevation={0} sx={cardStyle}>
                                        <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1 }}>{item.title}</Typography>
                                        <Typography variant="body2" color="text.secondary">{item.desc}</Typography>
                                    </Paper>
                                </Grid>
                            ))}
                        </Grid>
                    </SectionWrapper>

                    {/* VALIDATION PIPELINE */}
                    <SectionWrapper id="validation-pipeline">
                        <Typography variant="h4" sx={headingStyle}>
                            <PipelineIcon sx={{ color: '#1A73E8' }} /> 10-Stage Validation Pipeline
                        </Typography>
                        <Typography sx={paragraphStyle}>Our production-grade validation system processes YAML through 10 comprehensive stages:</Typography>

                        <Paper elevation={0} sx={{ ...cardStyle, p: 0, overflow: 'hidden', mb: 3 }}>
                            <TableContainer>
                                <Table size="small">
                                    <TableHead sx={{ bgcolor: isDarkMode ? 'rgba(255,255,255,0.05)' : '#f5f5f5' }}>
                                        <TableRow>
                                            <TableCell sx={{ color: 'text.secondary', fontWeight: 700 }}>Stage</TableCell>
                                            <TableCell sx={{ color: 'text.secondary', fontWeight: 700 }}>Name</TableCell>
                                            <TableCell sx={{ color: 'text.secondary', fontWeight: 700 }}>Purpose</TableCell>
                                            <TableCell sx={{ color: 'text.secondary', fontWeight: 700 }}>File</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {[
                                            { id: 0, name: 'Context', purpose: 'Load config, gather files', file: 'stage0-context.ts' },
                                            { id: 1, name: 'Render', purpose: 'Template rendering (Helm/Kustomize)', file: 'stage1-render.ts' },
                                            { id: 2, name: 'Parse', purpose: 'Parse YAML to AST, syntax checks', file: 'stage2-parse.ts' },
                                            { id: 3, name: 'Schema', purpose: 'Validate against K8s schemas', file: 'stage3-schema.ts' },
                                            { id: 4, name: 'Graph', purpose: 'Build dependency graph', file: 'stage4-graph.ts' },
                                            { id: 5, name: 'Checks', purpose: 'Static security & best practices', file: 'stage5-checks.ts' },
                                            { id: 6, name: 'Admission', purpose: 'Simulate admission webhooks', file: 'stage6-admission.ts' },
                                            { id: 7, name: 'Policy', purpose: 'OPA/Rego policy enforcement', file: 'stage7-policy.ts' },
                                            { id: 8, name: 'Server', purpose: 'Dry-run against K8s API server', file: 'stage8-server.ts' },
                                            { id: 9, name: 'Indent', purpose: 'Dedicated indentation validator', file: 'indentation-validator.ts' },
                                        ].map((row) => (
                                            <TableRow key={row.id}>
                                                <TableCell sx={{ fontWeight: 700 }}>{row.id}</TableCell>
                                                <TableCell>{row.name}</TableCell>
                                                <TableCell color="text.secondary">{row.purpose}</TableCell>
                                                <TableCell sx={{ fontFamily: 'monospace', fontSize: 12 }}>{row.file}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </Paper>
                    </SectionWrapper>

                    {/* SEMANTIC VALIDATOR */}
                    <SectionWrapper id="semantic-validator">
                        <Typography variant="h4" sx={headingStyle}>
                            <SemanticIcon sx={{ color: '#1A73E8' }} /> Intelligent Semantic Validator
                        </Typography>
                        <Typography sx={paragraphStyle}>
                            Our next-generation validator understands Kubernetes YAML structure semantically, not just through pattern matching.
                        </Typography>
                        <List>
                            <ListItemButton><ListItemText primary="✅ 5-Pass Repair Pipeline" secondary="Multi-pass fixing with 95%+ accuracy" /></ListItemButton>
                            <Divider component="li" />
                            <ListItemButton><ListItemText primary="✅ Context-Aware Key Detection" secondary="Detects missing colons based on 150+ known K8s fields" /></ListItemButton>
                            <Divider component="li" />
                            <ListItemButton><ListItemText primary="✅ Fuzzy Field Name Matching" secondary="Auto-corrects 80+ common typos using Levenshtein distance" /></ListItemButton>
                            <Divider component="li" />
                            <ListItemButton><ListItemText primary="✅ Type Awareness & Coercion" secondary="Converts values to expected types with 100+ field definitions" /></ListItemButton>
                        </List>
                    </SectionWrapper>

                    {/* FIXER ARCHITECTURE */}
                    <SectionWrapper id="fixer-architecture">
                        <Typography variant="h4" sx={headingStyle}>
                            <FixerIcon sx={{ color: '#1A73E8' }} /> 5-Pass Fixer Architecture
                        </Typography>
                        <Typography sx={paragraphStyle}>
                            Core Logic: <code>intelligent-fixer.ts</code> (3,334 lines, 73 functions)
                        </Typography>

                        <Grid container spacing={2} sx={{ mt: 2 }}>
                            {[
                                { pass: 'Pass 1', name: 'Syntax Normalization', desc: 'Fix missing colons, add spaces, normalize quotes and indentation.' },
                                { pass: 'Pass 2', name: 'AST Reconstruction', desc: 'Parse YAML to AST, identify structure, relocate misplaced nodes.' },
                                { pass: 'Pass 3', name: 'Semantic Analysis', desc: 'Context-aware fixes, field name typo correction, list structure fixes.' },
                                { pass: 'Pass 4', name: 'Type Coercion', desc: 'Word-to-number conversion, boolean string normalization, type validation.' },
                                { pass: 'Pass 5', name: 'Final Validation', desc: 'Parse check, calculate overall confidence, generate statistics.' },
                            ].map((pass) => (
                                <Grid item xs={12} key={pass.pass}>
                                    <Paper elevation={0} sx={{
                                        p: 2,
                                        borderRadius: '12px',
                                        bgcolor: isDarkMode ? 'rgba(255,255,255,0.03)' : '#f5f5f5',
                                        borderLeft: `4px solid ${theme.palette.primary.main}`
                                    }}>
                                        <Typography variant="subtitle2" fontWeight={700} color="primary">{pass.pass}: {pass.name}</Typography>
                                        <Typography variant="body2" color="text.secondary">{pass.desc}</Typography>
                                    </Paper>
                                </Grid>
                            ))}
                        </Grid>
                    </SectionWrapper>

                    {/* TYPE REGISTRY */}
                    <SectionWrapper id="type-registry">
                        <Typography variant="h4" sx={headingStyle}>
                            <KnowledgeIcon sx={{ color: '#1A73E8' }} /> Comprehensive Type Registry
                        </Typography>
                        <Typography sx={paragraphStyle}>
                            Located in <code>type-registry.ts</code>. Defines 100+ K8s fields with strict type constraints.
                        </Typography>

                        <Typography variant="h6" sx={subHeadingStyle}>Examples</Typography>
                        <Box sx={codeBlockStyle}>
                            {`// Numeric Fields
replicas: integer, min: 0, default: 1
port: integer, min: 1, max: 65535
initialDelaySeconds: integer, min: 0, default: 0

// Boolean Fields
privileged: default false
hostNetwork: default false
allowPrivilegeEscalation: default true

// String Enums
imagePullPolicy: ['Always', 'Never', 'IfNotPresent']
restartPolicy: ['Always', 'OnFailure', 'Never']`}
                        </Box>
                    </SectionWrapper>

                    {/* CLI TOOL */}
                    <SectionWrapper id="cli-tool">
                        <Typography variant="h4" sx={headingStyle}>
                            <CliIcon sx={{ color: '#1A73E8' }} /> CLI Tool
                        </Typography>
                        <Typography sx={paragraphStyle}>
                            Podscribe includes a robust CLI for CI/CD pipelines.
                        </Typography>

                        <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700 }}>Scan Command</Typography>
                        <Box sx={codeBlockStyle}>
                            {`k8s-lint scan <path> [options]

Options:
  --k8s-version <version>    Kubernetes version to validate against
  --policy-dir <dir>         Directory containing policy files
  --output <format>          Output format (text/json/sarif)
  --severity-threshold       Minimum severity (warning/error)`}
                        </Box>

                        <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700 }}>Fix Command</Typography>
                        <Box sx={codeBlockStyle}>
                            {`k8s-lint yaml fix <path> [options]

Options:
  --aggressive               Apply aggressive structural fixes
  --dry-run                  Preview changes without modifying
  --diff                     Show detailed diff of changes`}
                        </Box>
                    </SectionWrapper>

                    {/* ARCHITECTURE */}
                    <SectionWrapper id="architecture">
                        <Typography variant="h4" sx={headingStyle}>
                            <ArchitectureIcon sx={{ color: '#1A73E8' }} /> Architecture
                        </Typography>
                        <Typography sx={paragraphStyle}>A dual-engine architecture combining rule-based validation with semantic analysis.</Typography>

                        <Grid container spacing={2}>
                            <Grid item xs={12} sm={6}>
                                <Paper elevation={0} sx={cardStyle}>
                                    <Typography variant="h6" gutterBottom>Frontend Stack</Typography>
                                    <List dense>
                                        <ListItemText primary="React 18" secondary="UI framework with hooks" />
                                        <ListItemText primary="Monaco Editor" secondary="VS Code engine" />
                                        <ListItemText primary="TypeScript 5.6" secondary="Type safety" />
                                        <ListItemText primary="Vite" secondary="Build tool" />
                                    </List>
                                </Paper>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <Paper elevation={0} sx={cardStyle}>
                                    <Typography variant="h6" gutterBottom>Backend Stack</Typography>
                                    <List dense>
                                        <ListItemText primary="Express ^5.1.0" secondary="Web server" />
                                        <ListItemText primary="js-yaml ^4.1.1" secondary="YAML parsing" />
                                        <ListItemText primary="Parser/Fixer logic" secondary="Custom TS engines" />
                                    </List>
                                </Paper>
                            </Grid>
                        </Grid>
                    </SectionWrapper>

                    {/* API REFERENCE */}
                    <SectionWrapper id="api-reference">
                        <Typography variant="h4" sx={headingStyle}>
                            <ApiIcon sx={{ color: '#1A73E8' }} /> API Endpoints
                        </Typography>

                        <Paper elevation={0} sx={{ ...cardStyle, mb: 3 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                                <Chip label="POST" color="primary" size="small" />
                                <Typography fontWeight={700}>/api/validate</Typography>
                            </Box>
                            <Typography variant="body2" sx={{ mb: 2 }}>Rule-Based Validator for security and best practices.</Typography>
                            <Box sx={codeBlockStyle}>
                                {`// Request
{
  "yaml": "apiVersion: v1..."
}

// Response
{
  "valid": false,
  "errors": [{...}],
  "warnings": [{...}]
}`}
                            </Box>
                        </Paper>

                        <Paper elevation={0} sx={cardStyle}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                                <Chip label="POST" color="secondary" size="small" />
                                <Typography fontWeight={700}>/api/yaml/validate</Typography>
                            </Box>
                            <Typography variant="body2" sx={{ mb: 2 }}>Intelligent Auto-Fixer with semantic repair.</Typography>
                            <Box sx={codeBlockStyle}>
                                {`// Request
{
  "content": "apiVersion: v1...",
  "options": { "autoFix": true }
}

// Response
{
  "success": true,
  "fixed": "...",
  "changes": [{ "type": "syntax", "message": "..." }],
  "isValid": true
}`}
                            </Box>
                        </Paper>
                    </SectionWrapper>

                    {/* USAGE GUIDE */}
                    <SectionWrapper id="usage">
                        <Typography variant="h4" sx={headingStyle}>
                            <InterfaceIcon sx={{ color: '#1A73E8' }} /> Usage Guide
                        </Typography>
                        <List>
                            <ListItemButton><ListItemText primary="1. Enter YAML" secondary="Paste broken YAML in the left editor panel." /></ListItemButton>
                            <ListItemButton><ListItemText primary="2. Enable Auto-Fix" secondary="Toggle the switch in the header (enabled by default)." /></ListItemButton>
                            <ListItemButton><ListItemText primary="3. Validate" secondary="Click 'Validate' or wait for auto-debounce." /></ListItemButton>
                            <ListItemButton><ListItemText primary="4. Console" secondary="Review fixes and errors in the side console." /></ListItemButton>
                        </List>
                    </SectionWrapper>

                    {/* CONFIGURATION */}
                    <SectionWrapper id="configuration">
                        <Typography variant="h4" sx={headingStyle}>
                            <ConfigIcon sx={{ color: '#1A73E8' }} /> Configuration
                        </Typography>
                        <Box sx={codeBlockStyle}>
                            {`// intelligent-fixer.ts options
{
  confidenceThreshold: 0.7, // Default. Aggressive: 0.6
  aggressive: false,        // True for more risky fixes
  maxIterations: 3,         // Self-correction loops
  indentSize: 2,            // 2 or 4 spaces
  autoFix: true
}`}
                        </Box>
                    </SectionWrapper>

                    {/* EXAMPLES */}
                    <SectionWrapper id="examples">
                        <Typography variant="h4" sx={headingStyle}>
                            <ExamplesIcon sx={{ color: '#1A73E8' }} /> Real-World Examples
                        </Typography>

                        <Typography variant="h6" sx={subHeadingStyle}>1. Typo Correction</Typography>
                        <Grid container spacing={2}>
                            <Grid item xs={6}>
                                <Typography variant="caption" display="block" color="error">Input</Typography>
                                <Box sx={codeBlockStyle}>
                                    {`metdata:
  name test
sepc:
  contaienrs:
    - name nginx`}
                                </Box>
                            </Grid>
                            <Grid item xs={6}>
                                <Typography variant="caption" display="block" color="success">Fixed Output</Typography>
                                <Box sx={codeBlockStyle}>
                                    {`metadata:
  name: test
spec:
  containers:
    - name: nginx`}
                                </Box>
                            </Grid>
                        </Grid>

                        <Typography variant="h6" sx={subHeadingStyle}>2. Type Coercion</Typography>
                        <Box sx={codeBlockStyle}>
                            {`// Input
replicas three
port eighty
hostNetwork yes

// Fixed
replicas: 3
port: 80
hostNetwork: true`}
                        </Box>
                    </SectionWrapper>

                    {/* PERFORMANCE */}
                    <SectionWrapper id="performance">
                        <Typography variant="h4" sx={headingStyle}>
                            <SpeedIcon sx={{ color: '#1A73E8' }} /> Performance
                        </Typography>
                        <Grid container spacing={2}>
                            {[
                                { label: 'Validation Speed', val: '< 100ms' },
                                { label: 'Fix Accuracy', val: '90%+' },
                                { label: 'Bundle Size', val: '~500KB' },
                                { label: 'First Load', val: '< 2s' },
                            ].map((stat, idx) => (
                                <Grid item xs={3} key={idx}>
                                    <Paper sx={{ textAlign: 'center', p: 2, bgcolor: isDarkMode ? '#1E1E1E' : '#FFF' }}>
                                        <Typography variant="h5" color="primary" fontWeight={700}>{stat.val}</Typography>
                                        <Typography variant="caption" color="text.secondary">{stat.label}</Typography>
                                    </Paper>
                                </Grid>
                            ))}
                        </Grid>
                    </SectionWrapper>

                </Box>

                {/* Footer */}
                <Box sx={{ py: 6, textAlign: 'center', borderTop: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`, mt: 10 }}>
                    <Typography variant="body2" color="text.secondary">Podscribe v1.0.0 • Built with ❤️ for the Kubernetes community</Typography>
                </Box>
            </Box>
        </Box>
    );
};
