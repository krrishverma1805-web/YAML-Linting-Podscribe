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
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow
} from '@mui/material';
import {
    MenuBook as OverviewIcon,
    Loop as PipelineIcon,
    Build as FixerIcon,
    Psychology as SemanticIcon,
    LibraryBooks as KnowledgeIcon,
    Terminal as CliIcon,
    Api as ApiIcon,
    AccountTree as ArchitectureIcon,
    Search as SearchIcon,
    Close as CloseIcon,
    Speed as SpeedIcon,
    CheckCircle as CheckIcon,
    TouchApp as InterfaceIcon,
    Tune as ConfigIcon,
    DataObject as ExamplesIcon,
    FolderOpen as ProjectIcon,
    Brush as StyleIcon
} from '@mui/icons-material';

interface DocumentationProps {
    onClose?: () => void;
    darkMode: boolean;
}

export const Documentation: React.FC<DocumentationProps> = ({ onClose, darkMode: isDarkMode }) => {
    const [activeSection, setActiveSection] = useState('overview');
    const [searchQuery, setSearchQuery] = useState('');

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
        { id: 'project-structure', title: 'Project Structure', icon: <ProjectIcon fontSize="small" /> },
        { id: 'design-system', title: 'Design System', icon: <StyleIcon fontSize="small" /> },
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

    const paragraphStyle = {
        color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'text.secondary',
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
        color: isDarkMode ? '#fff' : 'inherit'
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
            <Divider sx={{ mt: 6, opacity: 0.5, borderColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }} />
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
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Typography variant="h6" fontWeight={800} sx={{ background: 'linear-gradient(45deg, #1A73E8, #8AB4F8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                            Podscribe
                        </Typography>
                        {onClose && (
                            <IconButton onClick={onClose} size="small" sx={{ color: isDarkMode ? '#fff' : 'inherit' }}>
                                <CloseIcon fontSize="small" />
                            </IconButton>
                        )}
                    </Box>
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
                            sx={{ pl: 5, pr: 2, py: 0.5, width: '100%', fontSize: '14px', color: isDarkMode ? '#fff' : 'inherit' }}
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
                                primaryTypographyProps={{ fontSize: '13px', fontWeight: 500, color: isDarkMode ? '#e0e0e0' : 'inherit' }}
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
                                <Grid size={{ xs: 12, md: 6 }} key={idx}>
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
                                                <TableCell sx={{ fontWeight: 700, color: isDarkMode ? '#e0e0e0' : 'inherit' }}>{row.id}</TableCell>
                                                <TableCell sx={{ color: isDarkMode ? '#e0e0e0' : 'inherit' }}>{row.name}</TableCell>
                                                <TableCell color="text.secondary">{row.purpose}</TableCell>
                                                <TableCell sx={{ fontFamily: 'monospace', fontSize: 12, color: isDarkMode ? '#8AB4F8' : 'inherit' }}>{row.file}</TableCell>
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
                        <List>
                            {['5-Pass Repair Pipeline', 'Context-Aware Key Detection', 'Fuzzy Field Name Matching', 'Type Awareness & Coercion'].map((text, i) => (
                                <React.Fragment key={i}>
                                    <ListItemButton>
                                        <ListItemText
                                            primary={`✅ ${text}`}
                                            primaryTypographyProps={{ color: isDarkMode ? '#e0e0e0' : 'inherit' }}
                                        />
                                    </ListItemButton>
                                    <Divider component="li" sx={{ opacity: 0.1 }} />
                                </React.Fragment>
                            ))}
                        </List>
                    </SectionWrapper>

                    {/* FIXER ARCHITECTURE */}
                    <SectionWrapper id="fixer-architecture">
                        <Typography variant="h4" sx={headingStyle}>
                            <FixerIcon sx={{ color: '#1A73E8' }} /> 5-Pass Fixer Architecture
                        </Typography>
                        <Grid container spacing={2} sx={{ mt: 2 }}>
                            {[
                                { pass: 'Pass 1', name: 'Syntax Normalization', desc: 'Fix missing colons, add spaces, normalize quotes and indentation.' },
                                { pass: 'Pass 2', name: 'AST Reconstruction', desc: 'Parse YAML to AST, identify structure, relocate misplaced nodes.' },
                                { pass: 'Pass 3', name: 'Semantic Analysis', desc: 'Context-aware fixes, field name typo correction, list structure fixes.' },
                                { pass: 'Pass 4', name: 'Type Coercion', desc: 'Word-to-number conversion, boolean string normalization, type validation.' },
                                { pass: 'Pass 5', name: 'Final Validation', desc: 'Parse check, calculate overall confidence, generate statistics.' },
                            ].map((pass) => (
                                <Grid size={12} key={pass.pass}>
                                    <Paper elevation={0} sx={{
                                        p: 2,
                                        borderRadius: '12px',
                                        bgcolor: isDarkMode ? 'rgba(255,255,255,0.03)' : '#f5f5f5',
                                        borderLeft: '4px solid #1A73E8'
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
                        <Box sx={codeBlockStyle}>
                            {`// Numeric Fields
replicas: integer, min: 0, default: 1
port: integer, min: 1, max: 65535

// Boolean Fields
privileged: default false
hostNetwork: default false

// String Enums
imagePullPolicy: ['Always', 'Never', 'IfNotPresent']`}
                        </Box>
                    </SectionWrapper>

                    {/* CLI TOOL */}
                    <SectionWrapper id="cli-tool">
                        <Typography variant="h4" sx={headingStyle}>
                            <CliIcon sx={{ color: '#1A73E8' }} /> CLI Tool
                        </Typography>
                        <Box sx={codeBlockStyle}>
                            {`k8s-lint scan <path> [options]
--k8s-version <version>
--output <format>`}
                        </Box>
                    </SectionWrapper>

                    {/* ARCHITECTURE */}
                    <SectionWrapper id="architecture">
                        <Typography variant="h4" sx={headingStyle}>
                            <ArchitectureIcon sx={{ color: '#1A73E8' }} /> Architecture
                        </Typography>
                        <Grid container spacing={2}>
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <Paper elevation={0} sx={cardStyle}>
                                    <Typography variant="h6" gutterBottom>Frontend Stack</Typography>
                                    <List dense>
                                        {['React 18', 'Monaco Editor', 'TypeScript 5.6', 'Vite'].map(i => (
                                            <ListItemText key={i} primary={i} primaryTypographyProps={{ color: isDarkMode ? '#e0e0e0' : 'inherit' }} />
                                        ))}
                                    </List>
                                </Paper>
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <Paper elevation={0} sx={cardStyle}>
                                    <Typography variant="h6" gutterBottom>Backend Stack</Typography>
                                    <List dense>
                                        {['Express ^5.1.0', 'js-yaml ^4.1.1', 'Note: 818 Lines of Backend Code'].map(i => (
                                            <ListItemText key={i} primary={i} primaryTypographyProps={{ color: isDarkMode ? '#e0e0e0' : 'inherit' }} />
                                        ))}
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
                        <Paper elevation={0} sx={cardStyle}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                                <Chip label="POST" color="primary" size="small" />
                                <Typography fontWeight={700}>/api/validate</Typography>
                            </Box>
                            <Typography variant="body2" sx={{ mb: 2 }}>Rule-Based Validator.</Typography>
                        </Paper>
                    </SectionWrapper>

                    {/* PROJECT STRUCTURE */}
                    <SectionWrapper id="project-structure">
                        <Typography variant="h4" sx={headingStyle}>
                            <ProjectIcon sx={{ color: '#1A73E8' }} /> Project Structure
                        </Typography>
                        <Typography sx={paragraphStyle}>
                            Total: 78 files, 20,997 lines of code.
                        </Typography>
                        <Box sx={codeBlockStyle}>
                            {`k8s-yaml-lint/
├── src/                     # 17,574 LOC (83.7%)
│   ├── components/          # React components
│   │   ├── UnifiedValidator.tsx
│   │   ├── Documentation.tsx
│   ├── semantic/            # Intelligent validator
│   │   ├── intelligent-fixer.ts
│   │   ├── semantic-parser.ts
│   ├── fixers/              # Specialized fixers
│   ├── knowledge/           # K8s knowledge base
│   ├── stages/              # 10-stage pipeline
│   ├── api/                 # API client
│   └── main.tsx             # Entry point
├── server/                  # 818 LOC (3.9%)
│   ├── index.js             # Express server
│   └── routes/
└── tests/                   # Test files`}
                        </Box>
                        <Paper elevation={0} sx={{ ...cardStyle, mt: 3, p: 2 }}>
                            <Typography variant="subtitle2" sx={{ mb: 1 }}>Metrics</Typography>
                            <Grid container spacing={2}>
                                <Grid size={4}><Typography variant="body2">Frontend: 83.7%</Typography></Grid>
                                <Grid size={4}><Typography variant="body2">Backend: 3.9%</Typography></Grid>
                                <Grid size={4}><Typography variant="body2">Config: 12.4%</Typography></Grid>
                            </Grid>
                        </Paper>
                    </SectionWrapper>

                    {/* DESIGN SYSTEM */}
                    <SectionWrapper id="design-system">
                        <Typography variant="h4" sx={headingStyle}>
                            <StyleIcon sx={{ color: '#1A73E8' }} /> Design System
                        </Typography>
                        <Grid container spacing={2}>
                            <Grid size={{ xs: 12, md: 4 }}>
                                <Paper elevation={0} sx={cardStyle}>
                                    <Typography variant="h6" gutterBottom>Colors</Typography>
                                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><Box sx={{ width: 16, height: 16, borderRadius: '50%', bgcolor: '#007AFF' }} /> Primary Blue</Box>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><Box sx={{ width: 16, height: 16, borderRadius: '50%', bgcolor: '#34C759' }} /> Success Green</Box>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><Box sx={{ width: 16, height: 16, borderRadius: '50%', bgcolor: '#FF3B30' }} /> Error Red</Box>
                                    </Box>
                                </Paper>
                            </Grid>
                            <Grid size={{ xs: 12, md: 4 }}>
                                <Paper elevation={0} sx={cardStyle}>
                                    <Typography variant="h6" gutterBottom>Typography</Typography>
                                    <Typography variant="body2">Font: SF Pro Display</Typography>
                                    <Typography variant="body2">Mono: JetBrains Mono</Typography>
                                </Paper>
                            </Grid>
                            <Grid size={{ xs: 12, md: 4 }}>
                                <Paper elevation={0} sx={cardStyle}>
                                    <Typography variant="h6" gutterBottom>Glassmorphism</Typography>
                                    <Typography variant="body2">Blur: 40px (2xl)</Typography>
                                    <Typography variant="body2">Opacity: 40-70%</Typography>
                                </Paper>
                            </Grid>
                        </Grid>
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
                                <Grid size={3} key={idx}>
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
