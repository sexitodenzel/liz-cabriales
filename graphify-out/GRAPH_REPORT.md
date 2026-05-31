# Graph Report - liz-cabriales  (2026-05-30)

## Corpus Check
- 167 files · ~119,658 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 2000 nodes · 3722 edges · 82 communities detected
- Extraction: 91% EXTRACTED · 9% INFERRED · 0% AMBIGUOUS · INFERRED: 336 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `d0dc89df`
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
- [[_COMMUNITY_Community 65|Community 65]]
- [[_COMMUNITY_Community 66|Community 66]]
- [[_COMMUNITY_Community 67|Community 67]]
- [[_COMMUNITY_Community 68|Community 68]]
- [[_COMMUNITY_Community 71|Community 71]]
- [[_COMMUNITY_Community 72|Community 72]]
- [[_COMMUNITY_Community 73|Community 73]]
- [[_COMMUNITY_Community 74|Community 74]]
- [[_COMMUNITY_Community 75|Community 75]]
- [[_COMMUNITY_Community 76|Community 76]]
- [[_COMMUNITY_Community 78|Community 78]]
- [[_COMMUNITY_Community 79|Community 79]]
- [[_COMMUNITY_Community 80|Community 80]]
- [[_COMMUNITY_Community 84|Community 84]]
- [[_COMMUNITY_Community 85|Community 85]]
- [[_COMMUNITY_Community 87|Community 87]]
- [[_COMMUNITY_Community 88|Community 88]]
- [[_COMMUNITY_Community 93|Community 93]]
- [[_COMMUNITY_Community 95|Community 95]]
- [[_COMMUNITY_Community 98|Community 98]]
- [[_COMMUNITY_Community 99|Community 99]]
- [[_COMMUNITY_Community 100|Community 100]]

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

## Communities (215 total, 8 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.05
Nodes (71): errorResponse(), GET(), tomorrowInTampicoTz(), buildExternalRef(), errorResponse(), POST(), AdminAppointmentsPage(), assertAdminOrReceptionist() (+63 more)

### Community 1 - "Community 1"
Cohesion: 0.05
Nodes (88): open(), isToolDevAppName(), parsePortOption(), resolveElectronBinaryPath(), resolveRunApps(), resolveStartApps(), resolveStopApps(), resolveTargetApps() (+80 more)

### Community 2 - "Community 2"
Cohesion: 0.06
Nodes (71): inferLegacyManifest(), isPlainObject(), parsePersistedManifest(), sanitizeManifest(), validateArtifactManifestInput(), validateBoundedString(), validateSupportingPath(), chooseEntryFile() (+63 more)

### Community 3 - "Community 3"
Cohesion: 0.07
Nodes (52): buildEmailPayload(), sendOrderConfirmationEmail(), unwrap(), errorResponse(), POST(), verifyWebhookSignature(), claimNotification(), formatMxn() (+44 more)

### Community 4 - "Community 4"
Cohesion: 0.09
Nodes (57): collect(), exists(), main(), walk(), appendNsisLog(), buildWorkspaceArtifacts(), cleanupPackedWinNamespace(), cleanupWinRegistryResidues() (+49 more)

### Community 5 - "Community 5"
Cohesion: 0.09
Nodes (47): resolveElectronBuilderCliPath(), resolveElectronDistPath(), resolveElectronVersion(), resolveToolPackBuildOutput(), resolveToolPackConfig(), buildWorkspaceArtifacts(), cleanBuilderScratchMetadata(), cleanupPackedMacNamespace() (+39 more)

### Community 6 - "Community 6"
Cohesion: 0.06
Nodes (28): buildElementLifecycles(), captureSnapshots(), findLastBbox(), markCollisions(), rectOverlapArea(), seekTo(), annotateFrame(), buildOverlaySVG() (+20 more)

### Community 7 - "Community 7"
Cohesion: 0.08
Nodes (27): renderCategory(), matchesSurface(), surfaceOf(), isGerman(), localizeDesignSystemCategory(), localizeDesignSystemSummary(), localizePromptTemplateCategory(), localizePromptTemplateSummary() (+19 more)

### Community 8 - "Community 8"
Cohesion: 0.11
Nodes (34): buildDeployFileSet(), checkDeploymentUrl(), deployConfigPath(), DeployError, deploymentUrl(), deploymentUrlCandidates(), deployToVercel(), escapeHtmlAttribute() (+26 more)

### Community 9 - "Community 9"
Cohesion: 0.09
Nodes (36): closeDatabase(), deleteConversation(), deleteProject(), deleteTemplate(), getConversation(), getDeployment(), getDeploymentById(), getProject() (+28 more)

### Community 10 - "Community 10"
Cohesion: 0.06
Nodes (12): RootLayout(), CartProvider(), pick(), clearGuestCart(), computeItemCount(), computeSubtotal(), mergeCartItems(), readGuestCart() (+4 more)

### Community 11 - "Community 11"
Cohesion: 0.09
Nodes (19): listPromptTemplates(), readPromptTemplate(), validateTemplate(), createChatRunService(), appendTaskProgress(), assembleExample(), composeProjectDisplayStatus(), createCompatApiError() (+11 more)

### Community 12 - "Community 12"
Cohesion: 0.09
Nodes (18): formatFormAnswers(), parseAttrs(), splitOnQuestionForms(), tryParseForm(), streaming(), t(), handleSubmit(), missingRequired() (+10 more)

### Community 13 - "Community 13"
Cohesion: 0.07
Nodes (9): CenteredLoader(), Skeleton(), clear(), onChange(), onScroll(), pickTemplate(), updateTabScrollState(), findProvider() (+1 more)

### Community 14 - "Community 14"
Cohesion: 0.12
Nodes (26): commandArgs(), createCommandInvocation(), createLoggedStdio(), createProcessStampArgs(), errorCode(), errorMessage(), isProcessAlive(), jsonIpcError() (+18 more)

### Community 15 - "Community 15"
Cohesion: 0.14
Nodes (25): GET(), mapAuthStatus(), POST(), GET(), mapAuthStatus(), POST(), GET(), mapResultStatus() (+17 more)

### Community 16 - "Community 16"
Cohesion: 0.15
Nodes (23): resolveAppConfig(), resolveToolDevConfig(), assertMatchingEnv(), bootstrapSidecarRuntime(), createJsonIpcServer(), createSidecarLaunchEnv(), prepareIpcPath(), removeFile() (+15 more)

### Community 17 - "Community 17"
Cohesion: 0.12
Nodes (14): cancelEditing(), confirmDelete(), fetchBrands(), fetchCategories(), fetchProducts(), handleCreateBrand(), handleCreateCategory(), handleCreateProduct() (+6 more)

### Community 18 - "Community 18"
Cohesion: 0.2
Nodes (24): assertKnownKeys(), assertKnownStampKeys(), assertObject(), assertSidecarStamp(), isAppKey(), isSidecarMode(), isSidecarSource(), isWindowsNamedPipePath() (+16 more)

### Community 19 - "Community 19"
Cohesion: 0.23
Nodes (22): DELETE(), errorResponse(), GET(), loadCartSnapshot(), PATCH(), POST(), requireUser(), CheckoutPage() (+14 more)

### Community 20 - "Community 20"
Cohesion: 0.11
Nodes (15): deployToVercel(), handleSaveAsTemplate(), onKey(), openDeployModal(), openInNewTab(), postSlide(), presentNewTab(), retryDeploymentLink() (+7 more)

### Community 21 - "Community 21"
Cohesion: 0.11
Nodes (9): GET(), sanitizeNextPath(), formatDate(), formatPrice(), formatTimeLabel(), statusBadge(), getInstructors(), createClient() (+1 more)

### Community 22 - "Community 22"
Cohesion: 0.16
Nodes (20): entriesWithFile(), readDesignSystemCategories(), readDesignSystemIds(), readSkillIds(), sorted(), coerce(), parseFrontmatter(), parseYamlSubset() (+12 more)

### Community 23 - "Community 23"
Cohesion: 0.18
Nodes (15): createPackagedDesktopRootIdentity(), resolveCurrentMacAppPath(), writePackagedDesktopIdentity(), applyLaunchEnv(), createPackagedDesktopStamp(), main(), applyPackagedElectronPathOverrides(), ensurePackagedNamespacePaths() (+7 more)

### Community 24 - "Community 24"
Cohesion: 0.13
Nodes (13): artifactManifestNameFor(), createHtmlArtifactManifest(), exportsForKind(), inferKindFromEntry(), inferLegacyManifest(), normalizeExt(), parseArtifactManifest(), escapeHtml() (+5 more)

### Community 25 - "Community 25"
Cohesion: 0.21
Nodes (21): activityRow(), cleanTitle(), escapeHtml(), extractColors(), extractFonts(), extractSubtitle(), faq(), featureCard() (+13 more)

### Community 26 - "Community 26"
Cohesion: 0.18
Nodes (13): main(), attachParentMonitor(), closeHttpServer(), isDaemonProxyPathname(), isProcessAlive(), listen(), parsePort(), prepareNextApp() (+5 more)

### Community 27 - "Community 27"
Cohesion: 0.17
Nodes (14): createProject(), createProjectNameOnly(), expectArtifactVisible(), getCurrentProjectContext(), listProjectFilesFromApi(), runConversationDeleteRecoveryFlow(), runConversationPersistenceFlow(), runDeepLinkPreviewFlow() (+6 more)

### Community 28 - "Community 28"
Cohesion: 0.14
Nodes (7): attachAcpSession(), createJsonLineStream(), detectAcpModels(), attachPiRpcSession(), parsePiModels(), sendCommand(), simulateRpcSession()

### Community 29 - "Community 29"
Cohesion: 0.22
Nodes (17): assertPreviewInputSize(), assertSafeXml(), assertZipPreviewSize(), buildDocumentPreview(), decodeXml(), extractFirst(), extractParagraphs(), extractTextRuns() (+9 more)

### Community 30 - "Community 30"
Cohesion: 0.15
Nodes (15): fetchDesignSystem(), fetchProjectFiles(), fetchSkill(), createConversation(), createProject(), deleteConversation(), deleteProject(), getTemplate() (+7 more)

### Community 31 - "Community 31"
Cohesion: 0.14
Nodes (11): DesignFilesPanel(), DesignSystemPreviewModal(), deleteProjectFile(), fetchAppVersionInfo(), fetchDesignSystemPreview(), fetchDesignSystemShowcase(), fetchProjectFilePreview(), fetchProjectFileText() (+3 more)

### Community 32 - "Community 32"
Cohesion: 0.13
Nodes (15): daemonIsLive(), fetchAgents(), fetchDesignSystems(), fetchPromptTemplates(), fetchSkills(), buildPath(), navigate(), useRoute() (+7 more)

### Community 33 - "Community 33"
Cohesion: 0.21
Nodes (18): cleanTitle(), clearDir(), extractAuthor(), extractBlockquoteSummary(), extractDescription(), extractFirstImage(), extractSourceUrl(), extractVideoLink() (+10 more)

### Community 34 - "Community 34"
Cohesion: 0.18
Nodes (10): AcademiaPage(), AdminCoursesPage(), assertAdmin(), errorResponse(), GET(), POST(), CursosPage(), getAdminCourses() (+2 more)

### Community 35 - "Community 35"
Cohesion: 0.24
Nodes (12): assertAdmin(), DELETE(), errorResponse(), mapResultStatus(), mapResultToStatus(), PATCH(), POST(), deleteAdminCategory() (+4 more)

### Community 36 - "Community 36"
Cohesion: 0.18
Nodes (11): NuevosLanzamientos(), generateMetadata(), getBrands(), getCategories(), getFeaturedProducts(), getProductBySlug(), getProducts(), getRelatedProducts() (+3 more)

### Community 37 - "Community 37"
Cohesion: 0.24
Nodes (17): cleanTitle(), escapeHtml(), extractColors(), extractFonts(), extractSubtitle(), firstNonNeutral(), inline(), isTableSeparator() (+9 more)

### Community 38 - "Community 38"
Cohesion: 0.18
Nodes (13): activatePending(), closeTab(), handleFilePicked(), hasFiles(), isAllowedDropTarget(), onDragOver(), onDrop(), openFile() (+5 more)

### Community 39 - "Community 39"
Cohesion: 0.2
Nodes (12): buildCaseRow(), buildMarkdown(), compactError(), escapeCell(), formatDuration(), MarkdownReporter, normalizeStatus(), parseCaseTitle() (+4 more)

### Community 40 - "Community 40"
Cohesion: 0.15
Nodes (4): onKey(), onTouchEnd(), goNext(), goPrev()

### Community 41 - "Community 41"
Cohesion: 0.26
Nodes (11): buildExternalRef(), errorResponse(), POST(), AcademiaDetallePage(), CursoDetallePage(), isCoursePast(), getMinDeposit(), getCourseById() (+3 more)

### Community 42 - "Community 42"
Cohesion: 0.19
Nodes (5): renderDirectionFormBody(), renderDirectionSpecBlock(), composeSystemPrompt(), derivePreflight(), renderMetadataBlock()

### Community 43 - "Community 43"
Cohesion: 0.25
Nodes (12): computeInvoiceSurchargeMxn(), roundMoney(), cartEmptyError(), createOrderFromActiveCart(), getActiveCartRow(), getOrderDraftFromActiveCart(), getOrderDraftWithClient(), getOrderWithItemsForUser() (+4 more)

### Community 44 - "Community 44"
Cohesion: 0.22
Nodes (10): attachRecoverableRuns(), consumeDaemonRun(), fetchChatRunStatus(), isChatRunStatus(), listActiveChatRuns(), reattachDaemonRun(), streamViaDaemon(), translateAgentEvent() (+2 more)

### Community 45 - "Community 45"
Cohesion: 0.27
Nodes (12): errorResponse(), POST(), attachStats(), createCourse(), createRegistration(), findExistingActiveRegistration(), getRegistrationForUser(), getRegistrationWithDetails() (+4 more)

### Community 46 - "Community 46"
Cohesion: 0.23
Nodes (7): errorResponse(), GET(), mapErrorStatus(), POST(), requireAuthenticatedUser(), getAdminOrdersPaginated(), getUserOrdersSummaries()

### Community 47 - "Community 47"
Cohesion: 0.21
Nodes (10): detectAgents(), fetchModels(), getAgentDef(), isKnownModel(), probe(), rememberLiveModels(), resolveAgentBin(), resolveOnPath() (+2 more)

### Community 48 - "Community 48"
Cohesion: 0.22
Nodes (8): attachParentMonitor(), createWebDiscovery(), runDesktopMain(), createDesktopRuntime(), createPendingHtml(), installWindowChromeCssHook(), normalizeScreenshotPath(), showWindowButtons()

### Community 49 - "Community 49"
Cohesion: 0.26
Nodes (9): buildWhatsAppHref(), CalIcon(), CompassIcon(), formatPrice(), initials(), MailIcon(), parseDateFull(), PhoneIcon() (+1 more)

### Community 50 - "Community 50"
Cohesion: 0.22
Nodes (7): ensureProject(), handleDrop(), handlePaste(), reset(), submit(), uploadFiles(), uploadProjectFiles()

### Community 51 - "Community 51"
Cohesion: 0.27
Nodes (9): createJsonEventStreamHandler(), emitCursorTextDelta(), extractCursorText(), formatOpenCodeUsage(), handleCodexEvent(), handleCursorEvent(), handleOpenCodeEvent(), safeParseJson() (+1 more)

### Community 52 - "Community 52"
Cohesion: 0.23
Nodes (7): extractBetaVersion(), extractBetaVersionFromLatestMacYml(), extractStableVersion(), fail(), parseBetaParts(), parseStableVersion(), readPackagedVersion()

### Community 53 - "Community 53"
Cohesion: 0.33
Nodes (6): streamMessageAnthropicProxy(), makeClient(), streamMessage(), isOpenAICompatible(), streamMessageOpenAI(), parseSseFrame()

### Community 54 - "Community 54"
Cohesion: 0.38
Nodes (9): closeManagedChild(), createPackagedDaemonManagedPathEnv(), extractPort(), logPathFor(), resolvePackagedChildBaseEnv(), resolvePackagedPathEnv(), resolveSidecarEntry(), spawnSidecarChild() (+1 more)

### Community 55 - "Community 55"
Cohesion: 0.36
Nodes (7): collectSseEvents(), log(), logSseProgress(), parseSseEvent(), renderEvents(), runRuntime(), stringData()

### Community 57 - "Community 57"
Cohesion: 0.42
Nodes (7): AdminCourseRegistrationsPage(), assertAdmin(), errorResponse(), GET(), POST(), addManualRegistration(), getRegistrationsByCourse()

### Community 58 - "Community 58"
Cohesion: 0.36
Nodes (7): cleanTitle(), extractCategory(), extractSurface(), extractSwatches(), listDesignSystems(), readDesignSystem(), summarize()

### Community 59 - "Community 59"
Cohesion: 0.53
Nodes (7): parseFlags(), pollUntilDoneOrBudget(), printMediaHelp(), runMedia(), runMediaGenerate(), runMediaWait(), surfaceFetchError()

### Community 62 - "Community 62"
Cohesion: 0.39
Nodes (5): handleBrandsChange(), handleCategoryChange(), handleClearAll(), handleSearchChange(), updateUrl()

### Community 65 - "Community 65"
Cohesion: 0.32
Nodes (3): handlePointerDown(), handlePointerMove(), pointerPos()

### Community 66 - "Community 66"
Cohesion: 0.32
Nodes (4): extractStableVersion(), fail(), parseStableVersion(), readPackagedVersion()

### Community 71 - "Community 71"
Cohesion: 0.43
Nodes (4): GET(), getAdminOrderById(), unwrapUserEmail(), unwrapUserNames()

### Community 72 - "Community 72"
Cohesion: 0.43
Nodes (4): AdminPage(), GET(), getLowStockVariants(), unwrapProduct()

### Community 73 - "Community 73"
Cohesion: 0.52
Nodes (6): loadEnvLocal(), main(), seedCategories(), seedProducts(), toSku(), toSlug()

### Community 74 - "Community 74"
Cohesion: 0.62
Nodes (5): cleanString(), isPackagedRuntime(), readCurrentAppVersionInfo(), readPackageMetadata(), resolveAppVersionInfo()

### Community 76 - "Community 76"
Cohesion: 0.57
Nodes (6): pathExists(), readJsonIfExists(), readPackagedConfig(), readRawPackagedConfig(), resolveDefaultConfigPath(), resolveOptionalPath()

### Community 78 - "Community 78"
Cohesion: 0.67
Nodes (4): callPaymentEndpoint(), getCheckoutErrorMessage(), handleRetryPayment(), handleSubmit()

### Community 79 - "Community 79"
Cohesion: 0.47
Nodes (4): clip(), escapeRe(), lintArtifact(), renderFindingsForAgent()

### Community 80 - "Community 80"
Cohesion: 0.47
Nodes (6): allocateDynamicPort(), allocateForcedPort(), allocatePort(), closeServer(), listenOnPort(), parsePort()

### Community 87 - "Community 87"
Cohesion: 0.7
Nodes (4): collectResidualJavaScript(), isAllowedOutputPath(), isSkippedDirectoryName(), toRepositoryPath()

### Community 88 - "Community 88"
Cohesion: 0.7
Nodes (4): errorMessage(), main(), readManifest(), slugOf()

### Community 93 - "Community 93"
Cohesion: 0.83
Nodes (3): resolveDevTsconfigPath(), resolveDistDir(), toPosixPath()

### Community 95 - "Community 95"
Cohesion: 0.83
Nodes (3): createArtifactParser(), findOpenTag(), parseAttrs()

## Knowledge Gaps
- **8 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `createClient()` connect `Community 21` to `Community 0`, `Community 34`, `Community 35`, `Community 3`, `Community 36`, `Community 71`, `Community 72`, `Community 41`, `Community 10`, `Community 43`, `Community 45`, `Community 46`, `Community 15`, `Community 19`, `Community 57`?**
  _High betweenness centrality (0.269) - this node is a cross-community bridge._
- **Why does `createClient()` connect `Community 10` to `Community 17`?**
  _High betweenness centrality (0.266) - this node is a cross-community bridge._
- **Why does `extractSwatches()` connect `Community 58` to `Community 10`?**
  _High betweenness centrality (0.258) - this node is a cross-community bridge._
- **Are the 17 inferred relationships involving `requireAdmin()` (e.g. with `assertAdmin()` and `assertAdmin()`) actually correct?**
  _`requireAdmin()` has 17 INFERRED edges - model-reasoned connections that need verification._
- **Are the 21 inferred relationships involving `POST()` (e.g. with `getOrderForPayment()` and `createPayment()`) actually correct?**
  _`POST()` has 21 INFERRED edges - model-reasoned connections that need verification._
- **Are the 5 inferred relationships involving `generateMedia()` (e.g. with `resolveProviderConfig()` and `modelsForSurface()`) actually correct?**
  _`generateMedia()` has 5 INFERRED edges - model-reasoned connections that need verification._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.05 - nodes in this community are weakly interconnected._