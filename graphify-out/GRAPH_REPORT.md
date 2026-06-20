# Graph Report - liz-cabriales  (2026-06-20)

## Corpus Check
- 284 files · ~198,536 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 2484 nodes · 4603 edges · 98 communities detected
- Extraction: 89% EXTRACTED · 11% INFERRED · 0% AMBIGUOUS · INFERRED: 508 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `9a65e6d9`
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
- [[_COMMUNITY_Community 52|Community 52]]
- [[_COMMUNITY_Community 53|Community 53]]
- [[_COMMUNITY_Community 54|Community 54]]
- [[_COMMUNITY_Community 56|Community 56]]
- [[_COMMUNITY_Community 57|Community 57]]
- [[_COMMUNITY_Community 58|Community 58]]
- [[_COMMUNITY_Community 59|Community 59]]
- [[_COMMUNITY_Community 60|Community 60]]
- [[_COMMUNITY_Community 62|Community 62]]
- [[_COMMUNITY_Community 63|Community 63]]
- [[_COMMUNITY_Community 65|Community 65]]
- [[_COMMUNITY_Community 66|Community 66]]
- [[_COMMUNITY_Community 68|Community 68]]
- [[_COMMUNITY_Community 69|Community 69]]
- [[_COMMUNITY_Community 70|Community 70]]
- [[_COMMUNITY_Community 74|Community 74]]
- [[_COMMUNITY_Community 75|Community 75]]
- [[_COMMUNITY_Community 76|Community 76]]
- [[_COMMUNITY_Community 77|Community 77]]
- [[_COMMUNITY_Community 80|Community 80]]
- [[_COMMUNITY_Community 82|Community 82]]
- [[_COMMUNITY_Community 83|Community 83]]
- [[_COMMUNITY_Community 84|Community 84]]
- [[_COMMUNITY_Community 85|Community 85]]
- [[_COMMUNITY_Community 86|Community 86]]
- [[_COMMUNITY_Community 89|Community 89]]
- [[_COMMUNITY_Community 90|Community 90]]
- [[_COMMUNITY_Community 91|Community 91]]
- [[_COMMUNITY_Community 93|Community 93]]
- [[_COMMUNITY_Community 94|Community 94]]
- [[_COMMUNITY_Community 95|Community 95]]
- [[_COMMUNITY_Community 96|Community 96]]
- [[_COMMUNITY_Community 97|Community 97]]
- [[_COMMUNITY_Community 99|Community 99]]
- [[_COMMUNITY_Community 101|Community 101]]
- [[_COMMUNITY_Community 103|Community 103]]
- [[_COMMUNITY_Community 104|Community 104]]
- [[_COMMUNITY_Community 105|Community 105]]
- [[_COMMUNITY_Community 106|Community 106]]
- [[_COMMUNITY_Community 107|Community 107]]
- [[_COMMUNITY_Community 111|Community 111]]
- [[_COMMUNITY_Community 117|Community 117]]
- [[_COMMUNITY_Community 119|Community 119]]
- [[_COMMUNITY_Community 120|Community 120]]
- [[_COMMUNITY_Community 121|Community 121]]
- [[_COMMUNITY_Community 122|Community 122]]
- [[_COMMUNITY_Community 123|Community 123]]

## God Nodes (most connected - your core abstractions)
1. `createClient()` - 84 edges
2. `requireAdmin()` - 61 edges
3. `getResend()` - 37 edges
4. `shortId()` - 36 edges
5. `buildEmailShell()` - 35 edges
6. `POST()` - 32 edges
7. `DELETE()` - 22 edges
8. `formatPriceMXN()` - 22 edges
9. `requireAdminOrReceptionist()` - 21 edges
10. `renderDesignSystemShowcase()` - 21 edges

## Surprising Connections (you probably didn't know these)
- `AcademiaPage()` --calls--> `getPublishedCourses()`  [INFERRED]
  app/academia/page.tsx → lib/supabase/courses.ts
- `AdminPage()` --calls--> `getLowStockVariants()`  [INFERRED]
  app/admin/page.tsx → lib/supabase/adminProducts.ts
- `AdminCoursesPage()` --calls--> `getAdminCourses()`  [INFERRED]
  app/admin/courses/page.tsx → lib/supabase/courses.ts
- `InstructorsPage()` --calls--> `getInstructors()`  [INFERRED]
  app/admin/instructors/page.tsx → lib/supabase/courses.ts
- `assertAdminOrReceptionist()` --calls--> `requireAdminOrReceptionist()`  [INFERRED]
  app/api/admin/appointments/route.ts → lib/supabase/admin.ts

## Communities (259 total, 16 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.05
Nodes (105): collect(), exists(), main(), walk(), resolveElectronBuilderCliPath(), resolveElectronDistPath(), resolveElectronVersion(), resolveToolPackBuildOutput() (+97 more)

### Community 1 - "Community 1"
Cohesion: 0.07
Nodes (81): errorResponse(), GET(), tomorrowInTampicoTz(), adminBadge(), send(), sendAdminAppointmentCancelledEmail(), sendAdminNewAppointmentEmail(), sendAdminNewCourseRegistrationEmail() (+73 more)

### Community 2 - "Community 2"
Cohesion: 0.05
Nodes (88): open(), isToolDevAppName(), parsePortOption(), resolveElectronBinaryPath(), resolveRunApps(), resolveStartApps(), resolveStopApps(), resolveTargetApps() (+80 more)

### Community 3 - "Community 3"
Cohesion: 0.06
Nodes (71): inferLegacyManifest(), isPlainObject(), parsePersistedManifest(), sanitizeManifest(), validateArtifactManifestInput(), validateBoundedString(), validateSupportingPath(), chooseEntryFile() (+63 more)

### Community 4 - "Community 4"
Cohesion: 0.05
Nodes (46): AcademiaPage(), errorResponse(), POST(), buildExternalRef(), errorResponse(), POST(), CursosPage(), EditCoursePage() (+38 more)

### Community 5 - "Community 5"
Cohesion: 0.06
Nodes (45): buildExternalRef(), errorResponse(), POST(), AdminAppointmentsPage(), assertAdminOrReceptionist(), errorResponse(), GET(), POST() (+37 more)

### Community 6 - "Community 6"
Cohesion: 0.05
Nodes (27): handleBrandsChange(), handleCategoryChange(), handleClearAll(), handleSearchChange(), updateUrl(), ProductListingSection(), useProductViewMode(), getSearchDestination() (+19 more)

### Community 7 - "Community 7"
Cohesion: 0.09
Nodes (40): claimNotification(), formatMxn(), getOrderForNotification(), sendAndLog(), sendNewOrderAlerts(), sendOrderDeliveredAlert(), sendOrderShippedAlert(), sendShippingPaidAlert() (+32 more)

### Community 8 - "Community 8"
Cohesion: 0.06
Nodes (28): buildElementLifecycles(), captureSnapshots(), findLastBbox(), markCollisions(), rectOverlapArea(), seekTo(), annotateFrame(), buildOverlaySVG() (+20 more)

### Community 9 - "Community 9"
Cohesion: 0.08
Nodes (26): cancelEditing(), confirmDelete(), fetchBrands(), fetchCategories(), fetchProducts(), handleCreateBrand(), handleCreateCategory(), handleCreateProduct() (+18 more)

### Community 10 - "Community 10"
Cohesion: 0.08
Nodes (27): renderCategory(), matchesSurface(), surfaceOf(), isGerman(), localizeDesignSystemCategory(), localizeDesignSystemSummary(), localizePromptTemplateCategory(), localizePromptTemplateSummary() (+19 more)

### Community 11 - "Community 11"
Cohesion: 0.11
Nodes (34): buildDeployFileSet(), checkDeploymentUrl(), deployConfigPath(), DeployError, deploymentUrl(), deploymentUrlCandidates(), deployToVercel(), escapeHtmlAttribute() (+26 more)

### Community 12 - "Community 12"
Cohesion: 0.09
Nodes (23): callPaymentEndpoint(), getCheckoutErrorMessage(), handleRetryPayment(), handleSubmit(), computeInvoiceSurchargeMxn(), roundMoney(), errorResponse(), GET() (+15 more)

### Community 13 - "Community 13"
Cohesion: 0.09
Nodes (36): closeDatabase(), deleteConversation(), deleteProject(), deleteTemplate(), getConversation(), getDeployment(), getDeploymentById(), getProject() (+28 more)

### Community 14 - "Community 14"
Cohesion: 0.09
Nodes (19): listPromptTemplates(), readPromptTemplate(), validateTemplate(), createChatRunService(), appendTaskProgress(), assembleExample(), composeProjectDisplayStatus(), createCompatApiError() (+11 more)

### Community 15 - "Community 15"
Cohesion: 0.12
Nodes (30): resolveAppConfig(), resolveToolDevConfig(), allocateDynamicPort(), allocateForcedPort(), allocatePort(), assertMatchingEnv(), bootstrapSidecarRuntime(), closeServer() (+22 more)

### Community 16 - "Community 16"
Cohesion: 0.09
Nodes (18): formatFormAnswers(), parseAttrs(), splitOnQuestionForms(), tryParseForm(), streaming(), t(), handleSubmit(), missingRequired() (+10 more)

### Community 17 - "Community 17"
Cohesion: 0.07
Nodes (9): CenteredLoader(), Skeleton(), clear(), onChange(), onScroll(), pickTemplate(), updateTabScrollState(), findProvider() (+1 more)

### Community 18 - "Community 18"
Cohesion: 0.09
Nodes (10): AdminPage(), mapRow(), unwrap(), GET(), sanitizeNextPath(), GET(), getLowStockVariants(), unwrapProduct() (+2 more)

### Community 19 - "Community 19"
Cohesion: 0.2
Nodes (24): assertKnownKeys(), assertKnownStampKeys(), assertObject(), assertSidecarStamp(), isAppKey(), isSidecarMode(), isSidecarSource(), isWindowsNamedPipePath() (+16 more)

### Community 20 - "Community 20"
Cohesion: 0.22
Nodes (23): DELETE(), errorResponse(), GET(), loadCartSnapshot(), PATCH(), POST(), requireUser(), CheckoutPage() (+15 more)

### Community 21 - "Community 21"
Cohesion: 0.1
Nodes (13): DesignFilesPanel(), DesignSystemPreviewModal(), deleteProjectFile(), fetchAppVersionInfo(), fetchDesignSystem(), fetchDesignSystemPreview(), fetchDesignSystemShowcase(), fetchProjectFilePreview() (+5 more)

### Community 22 - "Community 22"
Cohesion: 0.17
Nodes (22): GET(), mapAuthStatus(), POST(), GET(), mapAuthStatus(), POST(), categoryFromJoin(), createAdminBrand() (+14 more)

### Community 23 - "Community 23"
Cohesion: 0.14
Nodes (18): assertAdmin(), GET(), PUT(), assertAdmin(), GET(), PUT(), assertAdmin(), GET() (+10 more)

### Community 24 - "Community 24"
Cohesion: 0.11
Nodes (15): deployToVercel(), handleSaveAsTemplate(), onKey(), openDeployModal(), openInNewTab(), postSlide(), presentNewTab(), retryDeploymentLink() (+7 more)

### Community 25 - "Community 25"
Cohesion: 0.16
Nodes (20): entriesWithFile(), readDesignSystemCategories(), readDesignSystemIds(), readSkillIds(), sorted(), coerce(), parseFrontmatter(), parseYamlSubset() (+12 more)

### Community 26 - "Community 26"
Cohesion: 0.15
Nodes (17): errorResponse(), POST(), errorResponse(), GET(), POST(), errorResponse(), PATCH(), escapeIlikePattern() (+9 more)

### Community 27 - "Community 27"
Cohesion: 0.18
Nodes (15): createPackagedDesktopRootIdentity(), resolveCurrentMacAppPath(), writePackagedDesktopIdentity(), applyLaunchEnv(), createPackagedDesktopStamp(), main(), applyPackagedElectronPathOverrides(), ensurePackagedNamespacePaths() (+7 more)

### Community 28 - "Community 28"
Cohesion: 0.16
Nodes (15): main(), attachParentMonitor(), closeHttpServer(), isDaemonProxyPathname(), isProcessAlive(), listen(), parsePort(), prepareNextApp() (+7 more)

### Community 29 - "Community 29"
Cohesion: 0.13
Nodes (13): artifactManifestNameFor(), createHtmlArtifactManifest(), exportsForKind(), inferKindFromEntry(), inferLegacyManifest(), normalizeExt(), parseArtifactManifest(), escapeHtml() (+5 more)

### Community 30 - "Community 30"
Cohesion: 0.12
Nodes (8): createFromCategory(), createFromProduct(), createManual(), load(), move(), submitCreate(), toggleCategoryChip(), toggleProductChip()

### Community 31 - "Community 31"
Cohesion: 0.21
Nodes (14): assertAdmin(), DELETE(), errorResponse(), getAuth(), mapResultStatus(), mapResultToStatus(), mapStatus(), PATCH() (+6 more)

### Community 32 - "Community 32"
Cohesion: 0.21
Nodes (21): activityRow(), cleanTitle(), escapeHtml(), extractColors(), extractFonts(), extractSubtitle(), faq(), featureCard() (+13 more)

### Community 33 - "Community 33"
Cohesion: 0.18
Nodes (17): commandArgs(), createCommandInvocation(), createLoggedStdio(), listPosixProcessSnapshots(), listProcessSnapshots(), listWindowsProcessSnapshots(), matchesProcessStamp(), matchesStampedProcess() (+9 more)

### Community 34 - "Community 34"
Cohesion: 0.17
Nodes (14): createProject(), createProjectNameOnly(), expectArtifactVisible(), getCurrentProjectContext(), listProjectFilesFromApi(), runConversationDeleteRecoveryFlow(), runConversationPersistenceFlow(), runDeepLinkPreviewFlow() (+6 more)

### Community 35 - "Community 35"
Cohesion: 0.14
Nodes (7): attachAcpSession(), createJsonLineStream(), detectAcpModels(), attachPiRpcSession(), parsePiModels(), sendCommand(), simulateRpcSession()

### Community 36 - "Community 36"
Cohesion: 0.22
Nodes (17): assertPreviewInputSize(), assertSafeXml(), assertZipPreviewSize(), buildDocumentPreview(), decodeXml(), extractFirst(), extractParagraphs(), extractTextRuns() (+9 more)

### Community 37 - "Community 37"
Cohesion: 0.13
Nodes (16): daemonIsLive(), fetchAgents(), fetchDesignSystems(), fetchPromptTemplates(), fetchSkills(), buildPath(), navigate(), useRoute() (+8 more)

### Community 39 - "Community 39"
Cohesion: 0.21
Nodes (18): cleanTitle(), clearDir(), extractAuthor(), extractBlockquoteSummary(), extractDescription(), extractFirstImage(), extractSourceUrl(), extractVideoLink() (+10 more)

### Community 40 - "Community 40"
Cohesion: 0.24
Nodes (17): cleanTitle(), escapeHtml(), extractColors(), extractFonts(), extractSubtitle(), firstNonNeutral(), inline(), isTableSeparator() (+9 more)

### Community 41 - "Community 41"
Cohesion: 0.17
Nodes (14): attachRecoverableRuns(), listActiveChatRuns(), fetchSkill(), createConversation(), deleteConversation(), deleteProject(), getTemplate(), listConversations() (+6 more)

### Community 42 - "Community 42"
Cohesion: 0.18
Nodes (13): activatePending(), closeTab(), handleFilePicked(), hasFiles(), isAllowedDropTarget(), onDragOver(), onDrop(), openFile() (+5 more)

### Community 43 - "Community 43"
Cohesion: 0.2
Nodes (12): buildCaseRow(), buildMarkdown(), compactError(), escapeCell(), formatDuration(), MarkdownReporter, normalizeStatus(), parseCaseTitle() (+4 more)

### Community 44 - "Community 44"
Cohesion: 0.16
Nodes (6): addImage(), addVideo(), isValidVideoUrl(), toLocalGalleryItems(), uid(), ytThumb()

### Community 45 - "Community 45"
Cohesion: 0.15
Nodes (4): onKey(), onTouchEnd(), goNext(), goPrev()

### Community 46 - "Community 46"
Cohesion: 0.19
Nodes (5): renderDirectionFormBody(), renderDirectionSpecBlock(), composeSystemPrompt(), derivePreflight(), renderMetadataBlock()

### Community 47 - "Community 47"
Cohesion: 0.26
Nodes (11): DELETE(), GET(), getAdminUser(), PATCH(), POST(), createNailArtPost(), deleteNailArtPost(), getAllNailArtPostsAdmin() (+3 more)

### Community 48 - "Community 48"
Cohesion: 0.21
Nodes (8): NuevosLanzamientos(), getBrands(), getCategories(), getFeaturedProducts(), getProducts(), firstString(), parsePrice(), StorePage()

### Community 49 - "Community 49"
Cohesion: 0.22
Nodes (14): isProcessAlive(), waitForHttpOk(), waitForProcessExit(), sleep(), closeManagedChild(), createPackagedDaemonManagedPathEnv(), extractPort(), logPathFor() (+6 more)

### Community 50 - "Community 50"
Cohesion: 0.23
Nodes (9): buildPostAuthRedirect(), handleGoogleLogin(), handleLogin(), handleRegister(), normalizeEmail(), validateEmail(), validatePassword(), validateRequiredText() (+1 more)

### Community 52 - "Community 52"
Cohesion: 0.21
Nodes (10): detectAgents(), fetchModels(), getAgentDef(), isKnownModel(), probe(), rememberLiveModels(), resolveAgentBin(), resolveOnPath() (+2 more)

### Community 53 - "Community 53"
Cohesion: 0.22
Nodes (8): attachParentMonitor(), createWebDiscovery(), runDesktopMain(), createDesktopRuntime(), createPendingHtml(), installWindowChromeCssHook(), normalizeScreenshotPath(), showWindowButtons()

### Community 54 - "Community 54"
Cohesion: 0.26
Nodes (9): buildWhatsAppHref(), CalIcon(), CompassIcon(), formatPrice(), initials(), MailIcon(), parseDateFull(), PhoneIcon() (+1 more)

### Community 56 - "Community 56"
Cohesion: 0.26
Nodes (9): Home(), GET(), PATCH(), POST(), createHeroSlide(), getAllLandingSlots(), getHeroSlides(), getLandingSlots() (+1 more)

### Community 57 - "Community 57"
Cohesion: 0.24
Nodes (8): consumeDaemonRun(), fetchChatRunStatus(), isChatRunStatus(), reattachDaemonRun(), streamViaDaemon(), translateAgentEvent(), createDaemonHandlers(), createStreamHandlers()

### Community 58 - "Community 58"
Cohesion: 0.22
Nodes (7): ensureProject(), handleDrop(), handlePaste(), reset(), submit(), uploadFiles(), uploadProjectFiles()

### Community 59 - "Community 59"
Cohesion: 0.27
Nodes (9): createJsonEventStreamHandler(), emitCursorTextDelta(), extractCursorText(), formatOpenCodeUsage(), handleCodexEvent(), handleCursorEvent(), handleOpenCodeEvent(), safeParseJson() (+1 more)

### Community 60 - "Community 60"
Cohesion: 0.23
Nodes (7): extractBetaVersion(), extractBetaVersionFromLatestMacYml(), extractStableVersion(), fail(), parseBetaParts(), parseStableVersion(), readPackagedVersion()

### Community 63 - "Community 63"
Cohesion: 0.33
Nodes (8): createTopSearch(), getAllTopSearches(), mapRow(), resolveTopSearchHref(), updateTopSearch(), GET(), mapStatus(), POST()

### Community 65 - "Community 65"
Cohesion: 0.33
Nodes (6): streamMessageAnthropicProxy(), makeClient(), streamMessage(), isOpenAICompatible(), streamMessageOpenAI(), parseSseFrame()

### Community 66 - "Community 66"
Cohesion: 0.27
Nodes (4): toEmbedUrl(), videoThumb(), vimeoId(), ytId()

### Community 68 - "Community 68"
Cohesion: 0.24
Nodes (3): handleLinkTypeChange(), loadCourses(), loadProducts()

### Community 69 - "Community 69"
Cohesion: 0.36
Nodes (7): collectSseEvents(), log(), logSseProgress(), parseSseEvent(), renderEvents(), runRuntime(), stringData()

### Community 70 - "Community 70"
Cohesion: 0.36
Nodes (6): clearGuestCart(), computeItemCount(), computeSubtotal(), mergeCartItems(), readGuestCart(), writeGuestCart()

### Community 74 - "Community 74"
Cohesion: 0.28
Nodes (5): NailArtCard(), pickPlaceholder(), NailArtCard(), pickPlaceholder(), getNailArtPosts()

### Community 75 - "Community 75"
Cohesion: 0.36
Nodes (7): cleanTitle(), extractCategory(), extractSurface(), extractSwatches(), listDesignSystems(), readDesignSystem(), summarize()

### Community 76 - "Community 76"
Cohesion: 0.53
Nodes (7): parseFlags(), pollUntilDoneOrBudget(), printMediaHelp(), runMedia(), runMediaGenerate(), runMediaWait(), surfaceFetchError()

### Community 77 - "Community 77"
Cohesion: 0.46
Nodes (6): AdminCoursesPage(), assertAdmin(), errorResponse(), GET(), POST(), getAdminCourses()

### Community 80 - "Community 80"
Cohesion: 0.5
Nodes (6): pathExists(), readJsonIfExists(), readPackagedConfig(), readRawPackagedConfig(), resolveDefaultConfigPath(), resolveOptionalPath()

### Community 82 - "Community 82"
Cohesion: 0.32
Nodes (3): handlePointerDown(), handlePointerMove(), pointerPos()

### Community 83 - "Community 83"
Cohesion: 0.32
Nodes (4): extractStableVersion(), fail(), parseStableVersion(), readPackagedVersion()

### Community 89 - "Community 89"
Cohesion: 0.52
Nodes (6): loadEnvLocal(), main(), seedCategories(), seedProducts(), toSku(), toSlug()

### Community 90 - "Community 90"
Cohesion: 0.62
Nodes (5): cleanString(), isPackagedRuntime(), readCurrentAppVersionInfo(), readPackageMetadata(), resolveAppVersionInfo()

### Community 93 - "Community 93"
Cohesion: 0.33
Nodes (3): RootLayout(), CartProvider(), WishlistProvider()

### Community 95 - "Community 95"
Cohesion: 0.6
Nodes (5): deleteAdminProductVariant(), updateAdminProductVariant(), DELETE(), mapCode(), PATCH()

### Community 96 - "Community 96"
Cohesion: 0.6
Nodes (5): createAdminProductVariant(), getAdminProductVariants(), GET(), mapCode(), POST()

### Community 99 - "Community 99"
Cohesion: 0.47
Nodes (4): clip(), escapeRe(), lintArtifact(), renderFindingsForAgent()

### Community 106 - "Community 106"
Cohesion: 0.7
Nodes (4): collectResidualJavaScript(), isAllowedOutputPath(), isSkippedDirectoryName(), toRepositoryPath()

### Community 107 - "Community 107"
Cohesion: 0.7
Nodes (4): errorMessage(), main(), readManifest(), slugOf()

### Community 111 - "Community 111"
Cohesion: 0.83
Nodes (3): GET(), hoursAgo(), isAuthorized()

### Community 117 - "Community 117"
Cohesion: 0.83
Nodes (3): resolveDevTsconfigPath(), resolveDistDir(), toPosixPath()

### Community 119 - "Community 119"
Cohesion: 0.83
Nodes (3): createArtifactParser(), findOpenTag(), parseAttrs()

## Knowledge Gaps
- **16 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `createClient()` connect `Community 38` to `Community 67`, `Community 68`, `Community 101`, `Community 70`, `Community 9`, `Community 12`, `Community 50`, `Community 120`?**
  _High betweenness centrality (0.298) - this node is a cross-community bridge._
- **Why does `extractSwatches()` connect `Community 75` to `Community 101`?**
  _High betweenness centrality (0.275) - this node is a cross-community bridge._
- **Why does `pick()` connect `Community 101` to `Community 75`?**
  _High betweenness centrality (0.275) - this node is a cross-community bridge._
- **Are the 34 inferred relationships involving `requireAdmin()` (e.g. with `assertAdmin()` and `assertAdmin()`) actually correct?**
  _`requireAdmin()` has 34 INFERRED edges - model-reasoned connections that need verification._
- **Are the 19 inferred relationships involving `getResend()` (e.g. with `send()` and `sendOrderConfirmationEmail()`) actually correct?**
  _`getResend()` has 19 INFERRED edges - model-reasoned connections that need verification._
- **Are the 21 inferred relationships involving `shortId()` (e.g. with `sendAdminNewOrderEmail()` and `sendAdminNewAppointmentEmail()`) actually correct?**
  _`shortId()` has 21 INFERRED edges - model-reasoned connections that need verification._
- **Are the 19 inferred relationships involving `buildEmailShell()` (e.g. with `sendAdminNewOrderEmail()` and `sendAdminNewAppointmentEmail()`) actually correct?**
  _`buildEmailShell()` has 19 INFERRED edges - model-reasoned connections that need verification._