import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import type {
  AgentMessage,
  Bookmark,
  ChromeExtensionStatus,
  ImportStatus,
  SidebarScope,
  WritebackStatus,
} from './lib/types';
import {
  INITIAL_AGENT_MESSAGES,
  INITIAL_BOOKMARKS,
  INITIAL_FOLDERS,
  SIMULATED_CHROME_IMPORT_BATCH,
} from './lib/seedData';
import {
  collectAllTags,
  computePendingChanges,
  filterBookmarks,
  nowStamp,
  simulateAgentTurn,
  timeShort,
} from './lib/bookmarkStore';
import { TopToolbar } from './components/TopToolbar';
import { SidebarTree } from './components/SidebarTree';
import { BookmarkList } from './components/BookmarkList';
import { BookmarkDetailPanel } from './components/BookmarkDetailPanel';
import { NewBookmarkModal } from './components/NewBookmarkModal';
import { WritebackModal } from './components/WritebackModal';
import { PiAgentPanel } from './components/PiAgentPanel';
import { ExtensionPopupModal } from './components/ExtensionPopupModal';

export default function App() {
  const [folders] = useState(INITIAL_FOLDERS);
  const [baselineBookmarks, setBaselineBookmarks] = useState<Bookmark[]>(INITIAL_BOOKMARKS);
  const [localBookmarks, setLocalBookmarks] = useState<Bookmark[]>(INITIAL_BOOKMARKS);

  const [scope, setScope] = useState<SidebarScope>({ kind: 'all' });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(INITIAL_BOOKMARKS[0]?.id ?? null);
  const [justSavedId, setJustSavedId] = useState<string | null>(null);

  const [chromeStatus, setChromeStatus] = useState<ChromeExtensionStatus>('connected');
  const [importStatus, setImportStatus] = useState<ImportStatus>('idle');
  const [importedCount, setImportedCount] = useState(0);

  const [writebackOpen, setWritebackOpen] = useState(false);
  const [writebackStatus, setWritebackStatus] = useState<WritebackStatus>('idle');
  const [simulateWritebackFail, setSimulateWritebackFail] = useState(false);

  const [newBookmarkOpen, setNewBookmarkOpen] = useState(false);
  const [extensionPreviewOpen, setExtensionPreviewOpen] = useState(false);

  const [agentOpen, setAgentOpen] = useState(false);
  const [agentMessages, setAgentMessages] = useState<AgentMessage[]>(INITIAL_AGENT_MESSAGES);
  const [agentLastMatchedIds, setAgentLastMatchedIds] = useState<string[]>([]);

  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [mobileDetailOpen, setMobileDetailOpen] = useState(false);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const importTimerRef = useRef<number | null>(null);
  const writebackTimerRef = useRef<number | null>(null);

  const pendingChanges = useMemo(
    () => computePendingChanges(baselineBookmarks, localBookmarks, folders),
    [baselineBookmarks, localBookmarks, folders],
  );

  const pendingChangesMap = useMemo(
    () => new Map(pendingChanges.map((c) => [c.bookmarkId, c])),
    [pendingChanges],
  );

  const pendingIds = useMemo(
    () => new Set(pendingChanges.map((c) => c.bookmarkId)),
    [pendingChanges],
  );

  const deletedPendingList = useMemo(
    () => pendingChanges.filter((c) => c.type === 'deleted'),
    [pendingChanges],
  );

  const allTags = useMemo(() => collectAllTags(localBookmarks), [localBookmarks]);

  const filteredBookmarks = useMemo(
    () => filterBookmarks(localBookmarks, folders, scope, searchQuery, pendingIds),
    [localBookmarks, folders, scope, searchQuery, pendingIds],
  );

  const selectedBookmark = useMemo(
    () => localBookmarks.find((b) => b.id === selectedId) ?? null,
    [localBookmarks, selectedId],
  );

  // Clean up simulated async timers on unmount
  useEffect(() => {
    return () => {
      if (importTimerRef.current) window.clearTimeout(importTimerRef.current);
      if (writebackTimerRef.current) window.clearTimeout(writebackTimerRef.current);
    };
  }, []);

  // Global keyboard shortcuts: '/' focuses search, 'Escape' closes active modals/drawers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isInput =
        target?.tagName === 'INPUT' ||
        target?.tagName === 'TEXTAREA' ||
        target?.tagName === 'SELECT';

      if (e.key === '/' && !isInput) {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (e.key === 'Escape') {
        if (newBookmarkOpen) setNewBookmarkOpen(false);
        else if (writebackOpen) setWritebackOpen(false);
        else if (extensionPreviewOpen) setExtensionPreviewOpen(false);
        else if (agentOpen) setAgentOpen(false);
        else if (mobileDetailOpen) setMobileDetailOpen(false);
        else if (mobileSidebarOpen) setMobileSidebarOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    newBookmarkOpen,
    writebackOpen,
    extensionPreviewOpen,
    agentOpen,
    mobileDetailOpen,
    mobileSidebarOpen,
  ]);

  const handleSelectBookmark = useCallback((id: string) => {
    setSelectedId(id);
    setJustSavedId(null);
    setMobileDetailOpen(true);
  }, []);

  const handleSaveBookmark = (updated: {
    id: string;
    title: string;
    url: string;
    folderId: string;
    tags: string[];
    notes: string;
  }) => {
    const stamp = nowStamp();
    setLocalBookmarks((prev) =>
      prev.map((bm) =>
        bm.id === updated.id
          ? {
              ...bm,
              title: updated.title,
              url: updated.url,
              folderId: updated.folderId,
              tags: updated.tags,
              notes: updated.notes,
              updatedAt: stamp,
            }
          : bm,
      ),
    );
    setJustSavedId(updated.id);
    if (writebackStatus === 'success') {
      setWritebackStatus('idle');
    }
  };

  const handleRevertBookmark = (id: string) => {
    const base = baselineBookmarks.find((b) => b.id === id);
    if (!base) return;
    setLocalBookmarks((prev) => prev.map((b) => (b.id === id ? base : b)));
    setJustSavedId(null);
  };

  const handleDeleteBookmark = (id: string) => {
    setLocalBookmarks((prev) => {
      const next = prev.filter((b) => b.id !== id);
      if (selectedId === id) {
        setSelectedId(next[0]?.id ?? null);
      }
      return next;
    });
    setJustSavedId(null);
    setMobileDetailOpen(false);
    if (writebackStatus === 'success') {
      setWritebackStatus('idle');
    }
  };

  const handleRestoreDeleted = (bookmarkId: string) => {
    const base = baselineBookmarks.find((b) => b.id === bookmarkId);
    if (!base) return;
    setLocalBookmarks((prev) => {
      if (prev.some((b) => b.id === bookmarkId)) return prev;
      return [base, ...prev];
    });
    setSelectedId(bookmarkId);
  };

  const handleCreateBookmark = (data: {
    title: string;
    url: string;
    folderId: string;
    tags: string[];
    notes: string;
  }) => {
    const stamp = nowStamp();
    const newItem: Bookmark = {
      id: `bm-local-${Date.now()}`,
      title: data.title,
      url: data.url,
      folderId: data.folderId,
      tags: data.tags,
      notes: data.notes,
      createdAt: stamp,
      updatedAt: stamp,
    };
    setLocalBookmarks((prev) => [newItem, ...prev]);
    setSelectedId(newItem.id);
    setJustSavedId(newItem.id);
    setNewBookmarkOpen(false);
    setMobileDetailOpen(true);
    if (writebackStatus === 'success') {
      setWritebackStatus('idle');
    }
  };

  const handleStartImport = () => {
    if (importStatus === 'importing') return;
    setImportStatus('importing');

    if (importTimerRef.current) window.clearTimeout(importTimerRef.current);
    importTimerRef.current = window.setTimeout(() => {
      const stamp = nowStamp();
      setLocalBookmarks((prevLocal) => {
        const existingUrls = new Set(prevLocal.map((b) => b.url));
        const toAdd: Bookmark[] = [];

        // If first-use empty library, import initial Chrome baseline + batch
        const sourcePool =
          prevLocal.length === 0 && baselineBookmarks.length === 0
            ? [
                ...INITIAL_BOOKMARKS,
                ...SIMULATED_CHROME_IMPORT_BATCH.map((item) => ({
                  ...item,
                  createdAt: stamp,
                  updatedAt: stamp,
                })),
              ]
            : SIMULATED_CHROME_IMPORT_BATCH.map((item) => ({
                ...item,
                createdAt: stamp,
                updatedAt: stamp,
              }));

        for (const candidate of sourcePool) {
          if (!existingUrls.has(candidate.url)) {
            existingUrls.add(candidate.url);
            toAdd.push(candidate);
          }
        }

        setImportedCount(toAdd.length);
        if (toAdd.length > 0) {
          setBaselineBookmarks((prevBase) => [...toAdd, ...prevBase]);
          if (!selectedId) {
            setSelectedId(toAdd[0].id);
          }
          return [...toAdd, ...prevLocal];
        }
        return prevLocal;
      });
      setImportStatus('success');
    }, 900);
  };

  const handleOpenWriteback = () => {
    if (writebackStatus === 'success') {
      setWritebackStatus('idle');
    }
    setWritebackOpen(true);
  };

  const handleConfirmWriteback = () => {
    if (chromeStatus !== 'connected') return;
    setWritebackStatus('writing');

    if (writebackTimerRef.current) window.clearTimeout(writebackTimerRef.current);
    writebackTimerRef.current = window.setTimeout(() => {
      if (simulateWritebackFail) {
        setWritebackStatus('failed');
      } else {
        setBaselineBookmarks(localBookmarks);
        setWritebackStatus('success');
      }
    }, 700);
  };

  const handleSendAgentPrompt = (prompt: string, simulateFailure = false) => {
    const userMsg: AgentMessage = {
      id: `msg-user-${Date.now()}`,
      role: 'user',
      content: prompt,
      timestamp: timeShort(),
    };

    const result = simulateAgentTurn({
      prompt,
      bookmarks: localBookmarks,
      folders,
      lastMatchedIds: agentLastMatchedIds,
      simulateFailure,
    });

    setAgentMessages((prev) => [...prev, userMsg, result.assistantMessage]);
    setAgentLastMatchedIds(result.lastMatchedIds);
    if (result.nextBookmarks !== localBookmarks) {
      setLocalBookmarks(result.nextBookmarks);
      if (writebackStatus === 'success') {
        setWritebackStatus('idle');
      }
    }
  };

  const handleApplyDemoScenario = (
    scenario:
      | 'default'
      | 'first_use'
      | 'ext_connected'
      | 'ext_disconnected'
      | 'ext_error'
      | 'writeback_fail_preset',
  ) => {
    if (scenario === 'default') {
      setBaselineBookmarks(INITIAL_BOOKMARKS);
      setLocalBookmarks(INITIAL_BOOKMARKS);
      setScope({ kind: 'all' });
      setSearchQuery('');
      setSelectedId(INITIAL_BOOKMARKS[0]?.id ?? null);
      setJustSavedId(null);
      setChromeStatus('connected');
      setImportStatus('idle');
      setWritebackStatus('idle');
      setSimulateWritebackFail(false);
      setAgentMessages(INITIAL_AGENT_MESSAGES);
      setAgentLastMatchedIds([]);
    } else if (scenario === 'first_use') {
      setBaselineBookmarks([]);
      setLocalBookmarks([]);
      setScope({ kind: 'all' });
      setSearchQuery('');
      setSelectedId(null);
      setJustSavedId(null);
      setImportStatus('idle');
      setWritebackStatus('idle');
    } else if (scenario === 'ext_connected') {
      setChromeStatus('connected');
    } else if (scenario === 'ext_disconnected') {
      setChromeStatus('disconnected');
    } else if (scenario === 'ext_error') {
      setChromeStatus('error');
    } else if (scenario === 'writeback_fail_preset') {
      setExtensionPreviewOpen(true);
    }
  };

  const defaultNewFolderId =
    scope.kind === 'folder' ? scope.folderId : folders[0]?.id ?? 'f-bar';

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col bg-white text-[#202124]">
      <TopToolbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchInputRef={searchInputRef}
        onOpenNewBookmark={() => setNewBookmarkOpen(true)}
        onStartImport={handleStartImport}
        importStatus={importStatus}
        pendingCount={pendingChanges.length}
        writebackStatus={writebackStatus}
        onOpenWriteback={handleOpenWriteback}
        chromeStatus={chromeStatus}
        onOpenExtensionPreview={() => setExtensionPreviewOpen(true)}
        isAgentOpen={agentOpen}
        onToggleAgent={() => setAgentOpen((v) => !v)}
        onToggleSidebar={() => setMobileSidebarOpen((v) => !v)}
        onApplyDemoScenario={handleApplyDemoScenario}
      />

      <div className="flex-1 min-h-0 flex relative overflow-hidden">
        {/* Desktop Sidebar */}
        <div className="hidden md:flex h-full">
          <SidebarTree
            folders={folders}
            bookmarks={localBookmarks}
            allTags={allTags}
            scope={scope}
            onSelectScope={(next) => {
              setScope(next);
              setMobileSidebarOpen(false);
            }}
            pendingCount={pendingChanges.length}
            onOpenExtensionPreview={() => setExtensionPreviewOpen(true)}
          />
        </div>

        {/* Mobile/Narrow Sidebar Drawer */}
        {mobileSidebarOpen && (
          <div className="md:hidden fixed inset-0 top-[54px] z-30 flex">
            <div className="h-full shadow-xl">
              <SidebarTree
                folders={folders}
                bookmarks={localBookmarks}
                allTags={allTags}
                scope={scope}
                onSelectScope={(next) => {
                  setScope(next);
                  setMobileSidebarOpen(false);
                }}
                pendingCount={pendingChanges.length}
                onOpenExtensionPreview={() => {
                  setMobileSidebarOpen(false);
                  setExtensionPreviewOpen(true);
                }}
              />
            </div>
            <button
              type="button"
              aria-label="关闭侧栏"
              onClick={() => setMobileSidebarOpen(false)}
              className="flex-1 bg-black/25"
            />
          </div>
        )}

        {/* Center Compact Bookmark List */}
        <BookmarkList
          totalBookmarkCount={localBookmarks.length}
          bookmarks={filteredBookmarks}
          folders={folders}
          scope={scope}
          searchQuery={searchQuery}
          selectedId={selectedId}
          onSelectBookmark={handleSelectBookmark}
          pendingChangesMap={pendingChangesMap}
          deletedPendingList={deletedPendingList}
          onRestoreDeleted={handleRestoreDeleted}
          onClearFilters={() => {
            setScope({ kind: 'all' });
            setSearchQuery('');
          }}
          onOpenNewBookmark={() => setNewBookmarkOpen(true)}
          onStartImport={handleStartImport}
          onOpenAgent={() => setAgentOpen(true)}
          importStatus={importStatus}
          importedCount={importedCount}
          onDismissImportNotice={() => setImportStatus('idle')}
          chromeStatus={chromeStatus}
          onOpenExtensionPreview={() => setExtensionPreviewOpen(true)}
          onOpenWriteback={handleOpenWriteback}
        />

        {/* Desktop Right Detail Inspector */}
        <div className="hidden md:flex h-full">
          <BookmarkDetailPanel
            bookmark={selectedBookmark}
            folders={folders}
            pendingChange={selectedBookmark ? pendingChangesMap.get(selectedBookmark.id) : undefined}
            justSavedId={justSavedId}
            onSaveBookmark={handleSaveBookmark}
            onRevertBookmark={handleRevertBookmark}
            onDeleteBookmark={handleDeleteBookmark}
          />
        </div>

        {/* Mobile/Narrow Detail Drawer */}
        {mobileDetailOpen && selectedBookmark && (
          <div className="md:hidden fixed inset-0 top-[54px] z-30 bg-white flex">
            <BookmarkDetailPanel
              bookmark={selectedBookmark}
              folders={folders}
              pendingChange={pendingChangesMap.get(selectedBookmark.id)}
              justSavedId={justSavedId}
              onSaveBookmark={handleSaveBookmark}
              onRevertBookmark={handleRevertBookmark}
              onDeleteBookmark={handleDeleteBookmark}
              onCloseMobile={() => setMobileDetailOpen(false)}
            />
          </div>
        )}
      </div>

      {/* Pi Agent Drawer */}
      <PiAgentPanel
        isOpen={agentOpen}
        onClose={() => setAgentOpen(false)}
        messages={agentMessages}
        bookmarks={localBookmarks}
        folders={folders}
        onSendPrompt={handleSendAgentPrompt}
        onSelectBookmark={(id) => {
          setSelectedId(id);
          setMobileDetailOpen(true);
        }}
        pendingCount={pendingChanges.length}
        onOpenWriteback={handleOpenWriteback}
      />

      {/* Modals */}
      {newBookmarkOpen && (
        <NewBookmarkModal
          folders={folders}
          defaultFolderId={defaultNewFolderId}
          onClose={() => setNewBookmarkOpen(false)}
          onCreate={handleCreateBookmark}
        />
      )}

      {writebackOpen && (
        <WritebackModal
          pendingChanges={pendingChanges}
          folders={folders}
          chromeStatus={chromeStatus}
          writebackStatus={writebackStatus}
          simulateFailure={simulateWritebackFail}
          onToggleSimulateFailure={setSimulateWritebackFail}
          onConfirmWriteback={handleConfirmWriteback}
          onOpenExtensionPreview={() => setExtensionPreviewOpen(true)}
          onClose={() => setWritebackOpen(false)}
        />
      )}

      {extensionPreviewOpen && (
        <ExtensionPopupModal
          status={chromeStatus}
          onChangeStatus={setChromeStatus}
          pendingCount={pendingChanges.length}
          onClose={() => setExtensionPreviewOpen(false)}
        />
      )}
    </div>
  );
}
