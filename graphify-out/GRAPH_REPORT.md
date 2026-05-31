# Graph Report - liz-cabriales  (2026-05-30)

## Corpus Check
- 167 files · ~119,842 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 2002 nodes · 3724 edges · 82 communities detected
- Extraction: 91% EXTRACTED · 9% INFERRED · 0% AMBIGUOUS · INFERRED: 336 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `d439581b`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 18|Community 18]]
- [[_COMMUNITY_Community 19|Community 19]]
- [[_COMMUNITY_Community 20|Community 20]]
- [[_COMMUNITY_Community 21|Community 21]]
- [[_COMMUNITY_Community 22|Community 22]]
- [[_COMMUNITY_Community 23|Community 23]]
- [[_COMMUNITY_Community 24|Community 24]]
- [[_COMMUNITY_Community 25|Community 25]]
- [[_COMMUNITY_Community 26|Community 26]]
- [[_COMMUNITY_Community 27|Community 27]]
- [[_COMMUNITY_Community 28|Community 28]]
- [[_COMMUNITY_Community 29|Community 29]]
- [[_COMMUNITY_Community 30|Community 30]]
- [[_COMMUNITY_Community 31|Community 31]]
- [[_COMMUNITY_Community 32|Community 32]]
- [[_COMMUNITY_Community 33|Community 33]]
- [[_COMMUNITY_Community 34|Community 34]]
- [[_COMMUNITY_Community 35|Community 35]]
- [[_COMMUNITY_Community 36|Community 36]]
- [[_COMMUNITY_Community 37|Community 37]]
- [[_COMMUNITY_Community 38|Community 38]]
- [[_COMMUNITY_Community 39|Community 39]]
- [[_COMMUNITY_Community 40|Community 40]]
- [[_COMMUNITY_Community 41|Community 41]]
- [[_COMMUNITY_Community 42|Community 42]]
- [[_COMMUNITY_Community 43|Community 43]]
- [[_COMMUNITY_Community 44|Community 44]]
- [[_COMMUNITY_Community 45|Community 45]]
- [[_COMMUNITY_Community 46|Community 46]]
- [[_COMMUNITY_Community 47|Community 47]]
- [[_COMMUNITY_Community 48|Community 48]]
- [[_COMMUNITY_Community 49|Community 49]]
- [[_COMMUNITY_Community 50|Community 50]]
- [[_COMMUNITY_Community 51|Community 51]]
- [[_COMMUNITY_Community 52|Community 52]]
- [[_COMMUNITY_Community 53|Community 53]]
- [[_COMMUNITY_Community 54|Community 54]]
- [[_COMMUNITY_Community 55|Community 55]]
- [[_COMMUNITY_Community 57|Community 57]]
- [[_COMMUNITY_Community 58|Community 58]]
- [[_COMMUNITY_Community 59|Community 59]]
- [[_COMMUNITY_Community 62|Community 62]]
- [[_COMMUNITY_Community 64|Community 64]]
- [[_COMMUNITY_Community 66|Community 66]]
- [[_COMMUNITY_Community 67|Community 67]]
- [[_COMMUNITY_Community 68|Community 68]]
- [[_COMMUNITY_Community 69|Community 69]]
- [[_COMMUNITY_Community 70|Community 70]]
- [[_COMMUNITY_Community 73|Community 73]]
- [[_COMMUNITY_Community 74|Community 74]]
- [[_COMMUNITY_Community 75|Community 75]]
- [[_COMMUNITY_Community 76|Community 76]]
- [[_COMMUNITY_Community 78|Community 78]]
- [[_COMMUNITY_Community 82|Community 82]]
- [[_COMMUNITY_Community 83|Community 83]]
- [[_COMMUNITY_Community 84|Community 84]]
- [[_COMMUNITY_Community 85|Community 85]]
- [[_COMMUNITY_Community 86|Community 86]]
- [[_COMMUNITY_Community 92|Community 92]]
- [[_COMMUNITY_Community 93|Community 93]]
- [[_COMMUNITY_Community 95|Community 95]]
- [[_COMMUNITY_Community 97|Community 97]]
- [[_COMMUNITY_Community 98|Community 98]]
- [[_COMMUNITY_Community 99|Community 99]]

## God Nodes (most connected - your core abstractions)
1. `createClient()` - 59 edges
2. `requireAdmin()` - 32 edges
3. `POST()` - 25 edges
4. `renderDesignSystemShowcase()` - 21 edges
5. `generateMedia()` - 20 edges
6. `DELETE()` - 16 edges
7. `requireAdminOrReceptionist()` - 16 edges
8. `main()` - 15 edges
9. `getCourseById()` - 14 edges
10. `listSkills()` - 14 edges

## Surprising Connections (you probably didn't know these)
- `AcademiaPage()` --calls--> `getPublishedCourses()`  [INFERRED]
  app/academia/page.tsx → lib/supabase/courses.ts
- `AdminPage()` --calls--> `getLowStockVariants()`  [INFERRED]
  app/admin/page.tsx → lib/supabase/adminProducts.ts
- `AdminCoursesPage()` --calls--> `getAdminCourses()`  [INFERRED]
  app/admin/courses/page.tsx → lib/supabase/courses.ts
- `AdminCourseRegistrationsPage()` --calls--> `getCourseById()`  [INFERRED]
  app/admin/courses/[id]/registrations/page.tsx → lib/supabase/courses.ts
- `DELETE()` --calls--> `requireAdminOrReceptionist()`  [INFERRED]
  app/api/admin/products/[id]/route.ts → lib/supabase/admin.ts

## Communities (214 total, 11 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.05
Nodes (71): errorResponse(), GET(), tomorrowInTampicoTz(), buildExternalRef(), errorResponse(), POST(), AdminAppointmentsPage(), assertAdminOrReceptionist() (+63 more)

### Community 1 - "Community 1"
Cohesion: 0.06
Nodes (81): isToolDevAppName(), parsePortOption(), resolveRunApps(), resolveStartApps(), resolveStopApps(), resolveTargetApps(), unsupportedAppError(), appendStartupLogDiagnostics() (+73 more)

### Community 2 - "Community 2"
Cohesion: 0.06
Nodes (71): inferLegacyManifest(), isPlainObject(), parsePersistedManifest(), sanitizeManifest(), validateArtifactManifestInput(), validateBoundedString(), validateSupportingPath(), chooseEntryFile() (+63 more)

### Community 3 - "Community 3"
Cohesion: 0.08
Nodes (63): collect(), exists(), main(), walk(), resolveElectronBuilderCliPath(), resolveElectronDistPath(), resolveElectronVersion(), resolveToolPackBuildOutput() (+55 more)

### Community 4 - "Community 4"
Cohesion: 0.07
Nodes (52): buildEmailPayload(), sendOrderConfirmationEmail(), unwrap(), errorResponse(), POST(), verifyWebhookSignature(), claimNotification(), formatMxn() (+44 more)

### Community 5 - "Community 5"
Cohesion: 0.06
Nodes (28): buildElementLifecycles(), captureSnapshots(), findLastBbox(), markCollisions(), rectOverlapArea(), seekTo(), annotateFrame(), buildOverlaySVG() (+20 more)

### Community 6 - "Community 6"
Cohesion: 0.08
Nodes (27): renderCategory(), matchesSurface(), surfaceOf(), isGerman(), localizeDesignSystemCategory(), localizeDesignSystemSummary(), localizePromptTemplateCategory(), localizePromptTemplateSummary() (+19 more)

### Community 7 - "Community 7"
Cohesion: 0.1
Nodes (42): buildWorkspaceArtifacts(), cleanBuilderScratchMetadata(), cleanupPackedMacNamespace(), clearQuarantine(), collectWorkspaceTarballs(), commandMatchesDesktopMarker(), copyResourceTree(), desktopIdentityPath() (+34 more)

### Community 8 - "Community 8"
Cohesion: 0.08
Nodes (26): artifactManifestNameFor(), createHtmlArtifactManifest(), exportsForKind(), inferKindFromEntry(), inferLegacyManifest(), normalizeExt(), parseArtifactManifest(), escapeHtml() (+18 more)

### Community 9 - "Community 9"
Cohesion: 0.11
Nodes (34): buildDeployFileSet(), checkDeploymentUrl(), deployConfigPath(), DeployError, deploymentUrl(), deploymentUrlCandidates(), deployToVercel(), escapeHtmlAttribute() (+26 more)

### Community 10 - "Community 10"
Cohesion: 0.09
Nodes (36): closeDatabase(), deleteConversation(), deleteProject(), deleteTemplate(), getConversation(), getDeployment(), getDeploymentById(), getProject() (+28 more)

### Community 11 - "Community 11"
Cohesion: 0.11
Nodes (31): resolveAppConfig(), resolveElectronBinaryPath(), resolveToolDevConfig(), resolveTsxCliPath(), allocateDynamicPort(), allocateForcedPort(), allocatePort(), assertMatchingEnv() (+23 more)

### Community 12 - "Community 12"
Cohesion: 0.09
Nodes (19): listPromptTemplates(), readPromptTemplate(), validateTemplate(), createChatRunService(), appendTaskProgress(), assembleExample(), composeProjectDisplayStatus(), createCompatApiError() (+11 more)

### Community 13 - "Community 13"
Cohesion: 0.09
Nodes (18): formatFormAnswers(), parseAttrs(), splitOnQuestionForms(), tryParseForm(), streaming(), t(), handleSubmit(), missingRequired() (+10 more)

### Community 14 - "Community 14"
Cohesion: 0.14
Nodes (25): GET(), mapAuthStatus(), POST(), GET(), mapAuthStatus(), POST(), GET(), mapResultStatus() (+17 more)

### Community 15 - "Community 15"
Cohesion: 0.12
Nodes (27): collectProcessTreePids(), commandArgs(), createCommandInvocation(), createLoggedStdio(), createProcessStampArgs(), errorCode(), errorMessage(), isProcessAlive() (+19 more)

### Community 16 - "Community 16"
Cohesion: 0.07
Nodes (9): CenteredLoader(), Skeleton(), clear(), onChange(), onScroll(), pickTemplate(), updateTabScrollState(), findProvider() (+1 more)

### Community 17 - "Community 17"
Cohesion: 0.14
Nodes (22): callPaymentEndpoint(), getCheckoutErrorMessage(), handleRetryPayment(), handleSubmit(), computeInvoiceSurchargeMxn(), roundMoney(), errorResponse(), GET() (+14 more)

### Community 18 - "Community 18"
Cohesion: 0.12
Nodes (14): cancelEditing(), confirmDelete(), fetchBrands(), fetchCategories(), fetchProducts(), handleCreateBrand(), handleCreateCategory(), handleCreateProduct() (+6 more)

### Community 19 - "Community 19"
Cohesion: 0.09
Nodes (8): GET(), sanitizeNextPath(), formatDate(), formatPrice(), formatTimeLabel(), statusBadge(), getInstructors(), createClient()

### Community 20 - "Community 20"
Cohesion: 0.2
Nodes (24): assertKnownKeys(), assertKnownStampKeys(), assertObject(), assertSidecarStamp(), isAppKey(), isSidecarMode(), isSidecarSource(), isWindowsNamedPipePath() (+16 more)

### Community 21 - "Community 21"
Cohesion: 0.1
Nodes (16): deployToVercel(), handleSaveAsTemplate(), onKey(), openDeployModal(), openInNewTab(), postSlide(), presentNewTab(), retryDeploymentLink() (+8 more)

### Community 22 - "Community 22"
Cohesion: 0.23
Nodes (22): DELETE(), errorResponse(), GET(), loadCartSnapshot(), PATCH(), POST(), requireUser(), CheckoutPage() (+14 more)

### Community 23 - "Community 23"
Cohesion: 0.11
Nodes (18): DesignSystemPreviewModal(), daemonIsLive(), fetchAgents(), fetchAppVersionInfo(), fetchDesignSystemPreview(), fetchDesignSystems(), fetchDesignSystemShowcase(), fetchPromptTemplates() (+10 more)

### Community 24 - "Community 24"
Cohesion: 0.16
Nodes (20): entriesWithFile(), readDesignSystemCategories(), readDesignSystemIds(), readSkillIds(), sorted(), coerce(), parseFrontmatter(), parseYamlSubset() (+12 more)

### Community 25 - "Community 25"
Cohesion: 0.18
Nodes (15): createPackagedDesktopRootIdentity(), resolveCurrentMacAppPath(), writePackagedDesktopIdentity(), applyLaunchEnv(), createPackagedDesktopStamp(), main(), applyPackagedElectronPathOverrides(), ensurePackagedNamespacePaths() (+7 more)

### Community 26 - "Community 26"
Cohesion: 0.21
Nodes (21): activityRow(), cleanTitle(), escapeHtml(), extractColors(), extractFonts(), extractSubtitle(), faq(), featureCard() (+13 more)

### Community 27 - "Community 27"
Cohesion: 0.17
Nodes (14): createProject(), createProjectNameOnly(), expectArtifactVisible(), getCurrentProjectContext(), listProjectFilesFromApi(), runConversationDeleteRecoveryFlow(), runConversationPersistenceFlow(), runDeepLinkPreviewFlow() (+6 more)

### Community 28 - "Community 28"
Cohesion: 0.22
Nodes (17): assertPreviewInputSize(), assertSafeXml(), assertZipPreviewSize(), buildDocumentPreview(), decodeXml(), extractFirst(), extractParagraphs(), extractTextRuns() (+9 more)

### Community 29 - "Community 29"
Cohesion: 0.15
Nodes (6): attachAcpSession(), createJsonLineStream(), attachPiRpcSession(), parsePiModels(), sendCommand(), simulateRpcSession()

### Community 30 - "Community 30"
Cohesion: 0.21
Nodes (18): cleanTitle(), clearDir(), extractAuthor(), extractBlockquoteSummary(), extractDescription(), extractFirstImage(), extractSourceUrl(), extractVideoLink() (+10 more)

### Community 31 - "Community 31"
Cohesion: 0.18
Nodes (10): AcademiaPage(), AdminCoursesPage(), assertAdmin(), errorResponse(), GET(), POST(), CursosPage(), getAdminCourses() (+2 more)

### Community 32 - "Community 32"
Cohesion: 0.21
Nodes (13): assertAdmin(), DELETE(), errorResponse(), mapResultStatus(), mapResultToStatus(), PATCH(), categoryFromJoin(), deleteAdminBrand() (+5 more)

### Community 33 - "Community 33"
Cohesion: 0.18
Nodes (11): NuevosLanzamientos(), generateMetadata(), getBrands(), getCategories(), getFeaturedProducts(), getProductBySlug(), getProducts(), getRelatedProducts() (+3 more)

### Community 35 - "Community 35"
Cohesion: 0.24
Nodes (17): cleanTitle(), escapeHtml(), extractColors(), extractFonts(), extractSubtitle(), firstNonNeutral(), inline(), isTableSeparator() (+9 more)

### Community 36 - "Community 36"
Cohesion: 0.17
Nodes (14): fetchDesignSystem(), fetchProjectFiles(), fetchSkill(), createConversation(), deleteConversation(), getTemplate(), importClaudeDesignZip(), listConversations() (+6 more)

### Community 37 - "Community 37"
Cohesion: 0.18
Nodes (13): activatePending(), closeTab(), handleFilePicked(), hasFiles(), isAllowedDropTarget(), onDragOver(), onDrop(), openFile() (+5 more)

### Community 38 - "Community 38"
Cohesion: 0.2
Nodes (12): buildCaseRow(), buildMarkdown(), compactError(), escapeCell(), formatDuration(), MarkdownReporter, normalizeStatus(), parseCaseTitle() (+4 more)

### Community 39 - "Community 39"
Cohesion: 0.26
Nodes (11): buildExternalRef(), errorResponse(), POST(), AcademiaDetallePage(), CursoDetallePage(), isCoursePast(), getMinDeposit(), getCourseById() (+3 more)

### Community 40 - "Community 40"
Cohesion: 0.15
Nodes (4): onKey(), onTouchEnd(), goNext(), goPrev()

### Community 41 - "Community 41"
Cohesion: 0.19
Nodes (5): renderDirectionFormBody(), renderDirectionSpecBlock(), composeSystemPrompt(), derivePreflight(), renderMetadataBlock()

### Community 42 - "Community 42"
Cohesion: 0.2
Nodes (12): open(), requestJsonIpc(), closeManagedChild(), createPackagedDaemonManagedPathEnv(), extractPort(), logPathFor(), openLog(), resolvePackagedChildBaseEnv() (+4 more)

### Community 43 - "Community 43"
Cohesion: 0.19
Nodes (11): detectAcpModels(), detectAgents(), fetchModels(), getAgentDef(), isKnownModel(), probe(), rememberLiveModels(), resolveAgentBin() (+3 more)

### Community 44 - "Community 44"
Cohesion: 0.22
Nodes (10): attachRecoverableRuns(), consumeDaemonRun(), fetchChatRunStatus(), isChatRunStatus(), listActiveChatRuns(), reattachDaemonRun(), streamViaDaemon(), translateAgentEvent() (+2 more)

### Community 45 - "Community 45"
Cohesion: 0.27
Nodes (12): errorResponse(), POST(), attachStats(), createCourse(), createRegistration(), findExistingActiveRegistration(), getRegistrationForUser(), getRegistrationWithDetails() (+4 more)

### Community 46 - "Community 46"
Cohesion: 0.22
Nodes (8): attachParentMonitor(), createWebDiscovery(), runDesktopMain(), createDesktopRuntime(), createPendingHtml(), installWindowChromeCssHook(), normalizeScreenshotPath(), showWindowButtons()

### Community 47 - "Community 47"
Cohesion: 0.26
Nodes (9): buildWhatsAppHref(), CalIcon(), CompassIcon(), formatPrice(), initials(), MailIcon(), parseDateFull(), PhoneIcon() (+1 more)

### Community 48 - "Community 48"
Cohesion: 0.22
Nodes (7): ensureProject(), handleDrop(), handlePaste(), reset(), submit(), uploadFiles(), uploadProjectFiles()

### Community 49 - "Community 49"
Cohesion: 0.15
Nodes (5): DesignFilesPanel(), deleteProjectFile(), fetchProjectFileText(), projectFileUrl(), projectRawUrl()

### Community 50 - "Community 50"
Cohesion: 0.27
Nodes (9): createJsonEventStreamHandler(), emitCursorTextDelta(), extractCursorText(), formatOpenCodeUsage(), handleCodexEvent(), handleCursorEvent(), handleOpenCodeEvent(), safeParseJson() (+1 more)

### Community 51 - "Community 51"
Cohesion: 0.23
Nodes (7): extractBetaVersion(), extractBetaVersionFromLatestMacYml(), extractStableVersion(), fail(), parseBetaParts(), parseStableVersion(), readPackagedVersion()

### Community 52 - "Community 52"
Cohesion: 0.33
Nodes (6): streamMessageAnthropicProxy(), makeClient(), streamMessage(), isOpenAICompatible(), streamMessageOpenAI(), parseSseFrame()

### Community 53 - "Community 53"
Cohesion: 0.36
Nodes (7): collectSseEvents(), log(), logSseProgress(), parseSseEvent(), renderEvents(), runRuntime(), stringData()

### Community 54 - "Community 54"
Cohesion: 0.31
Nodes (5): GET(), getAdminOrderById(), getAdminOrdersPaginated(), unwrapUserEmail(), unwrapUserNames()

### Community 55 - "Community 55"
Cohesion: 0.42
Nodes (7): AdminCourseRegistrationsPage(), assertAdmin(), errorResponse(), GET(), POST(), addManualRegistration(), getRegistrationsByCourse()

### Community 57 - "Community 57"
Cohesion: 0.36
Nodes (6): clearGuestCart(), computeItemCount(), computeSubtotal(), mergeCartItems(), readGuestCart(), writeGuestCart()

### Community 58 - "Community 58"
Cohesion: 0.36
Nodes (7): cleanTitle(), extractCategory(), extractSurface(), extractSwatches(), listDesignSystems(), readDesignSystem(), summarize()

### Community 59 - "Community 59"
Cohesion: 0.53
Nodes (7): parseFlags(), pollUntilDoneOrBudget(), printMediaHelp(), runMedia(), runMediaGenerate(), runMediaWait(), surfaceFetchError()

### Community 62 - "Community 62"
Cohesion: 0.39
Nodes (5): handleBrandsChange(), handleCategoryChange(), handleClearAll(), handleSearchChange(), updateUrl()

### Community 64 - "Community 64"
Cohesion: 0.5
Nodes (6): pathExists(), readJsonIfExists(), readPackagedConfig(), readRawPackagedConfig(), resolveDefaultConfigPath(), resolveOptionalPath()

### Community 66 - "Community 66"
Cohesion: 0.32
Nodes (3): handlePointerDown(), handlePointerMove(), pointerPos()

### Community 67 - "Community 67"
Cohesion: 0.32
Nodes (4): extractStableVersion(), fail(), parseStableVersion(), readPackagedVersion()

### Community 70 - "Community 70"
Cohesion: 0.43
Nodes (4): AdminPage(), GET(), getLowStockVariants(), unwrapProduct()

### Community 74 - "Community 74"
Cohesion: 0.52
Nodes (6): loadEnvLocal(), main(), seedCategories(), seedProducts(), toSku(), toSlug()

### Community 76 - "Community 76"
Cohesion: 0.62
Nodes (5): cleanString(), isPackagedRuntime(), readCurrentAppVersionInfo(), readPackageMetadata(), resolveAppVersionInfo()

### Community 78 - "Community 78"
Cohesion: 0.47
Nodes (4): clip(), escapeRe(), lintArtifact(), renderFindingsForAgent()

### Community 84 - "Community 84"
Cohesion: 0.5
Nodes (3): buildPath(), navigate(), useRoute()

### Community 85 - "Community 85"
Cohesion: 0.7
Nodes (4): collectResidualJavaScript(), isAllowedOutputPath(), isSkippedDirectoryName(), toRepositoryPath()

### Community 86 - "Community 86"
Cohesion: 0.7
Nodes (4): errorMessage(), main(), readManifest(), slugOf()

### Community 93 - "Community 93"
Cohesion: 0.83
Nodes (3): resolveDevTsconfigPath(), resolveDistDir(), toPosixPath()

### Community 95 - "Community 95"
Cohesion: 0.83
Nodes (3): createArtifactParser(), findOpenTag(), parseAttrs()

## Knowledge Gaps
- **11 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `createClient()` connect `Community 34` to `Community 73`, `Community 18`, `Community 57`?**
  _High betweenness centrality (0.277) - this node is a cross-community bridge._
- **Why does `createClient()` connect `Community 19` to `Community 0`, `Community 32`, `Community 33`, `Community 4`, `Community 70`, `Community 39`, `Community 45`, `Community 14`, `Community 17`, `Community 54`, `Community 55`, `Community 22`, `Community 92`, `Community 31`?**
  _High betweenness centrality (0.276) - this node is a cross-community bridge._
- **Why does `extractSwatches()` connect `Community 58` to `Community 34`?**
  _High betweenness centrality (0.267) - this node is a cross-community bridge._
- **Are the 17 inferred relationships involving `requireAdmin()` (e.g. with `assertAdmin()` and `assertAdmin()`) actually correct?**
  _`requireAdmin()` has 17 INFERRED edges - model-reasoned connections that need verification._
- **Are the 21 inferred relationships involving `POST()` (e.g. with `getOrderForPayment()` and `createPayment()`) actually correct?**
  _`POST()` has 21 INFERRED edges - model-reasoned connections that need verification._
- **Are the 5 inferred relationships involving `generateMedia()` (e.g. with `resolveProviderConfig()` and `modelsForSurface()`) actually correct?**
  _`generateMedia()` has 5 INFERRED edges - model-reasoned connections that need verification._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.05 - nodes in this community are weakly interconnected._