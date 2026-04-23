'use client';

import { useMemo, useState } from 'react';
import { useLanguage } from '@/lib/i18n';

type KnowledgeChunkView = {
  id: string;
  content: string;
  keywords: string[];
};

type KnowledgeCollectionView = {
  id: string;
  name: string;
  description: string;
  orgId: string | null;
  teamId: string | null;
  chunkCount: number;
  chunks?: KnowledgeChunkView[];
};

type OrgOption = {
  id: string;
  name: string;
};

type TeamOption = {
  id: string;
  orgId: string;
  name: string;
};

const EMPTY_NEW_COLLECTION = { id: '', name: '', description: '', orgId: '', teamId: '' };
const EMPTY_NEW_CHUNK = { id: '', content: '', keywords: '' };

export function AdminKnowledgePartitioningControls({
  initialCollections,
  organizations,
  teams,
}: {
  initialCollections: KnowledgeCollectionView[];
  organizations: OrgOption[];
  teams: TeamOption[];
}) {
  const { language } = useLanguage();
  const vi = language === 'vi';
  const [collections, setCollections] = useState(initialCollections);
  const [savingCollectionId, setSavingCollectionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [showAddCollection, setShowAddCollection] = useState(false);
  const [newCollection, setNewCollection] = useState(EMPTY_NEW_COLLECTION);
  const [addingCollection, setAddingCollection] = useState(false);

  const [addChunkForId, setAddChunkForId] = useState<string | null>(null);
  const [newChunk, setNewChunk] = useState(EMPTY_NEW_CHUNK);
  const [addingChunk, setAddingChunk] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const addCollection = async () => {
    if (!newCollection.id.trim() || !newCollection.name.trim()) {
      setError(vi ? 'ID và tên là bắt buộc.' : 'Collection ID and name are required.');
      return;
    }
    setAddingCollection(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/knowledge/collections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: newCollection.id.trim(),
          name: newCollection.name.trim(),
          description: newCollection.description.trim(),
          orgId: newCollection.orgId.trim() || null,
          teamId: newCollection.teamId.trim() || null,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error ?? 'Failed to add collection.');
      setCollections(current => [...current, {
        id: newCollection.id.trim(),
        name: newCollection.name.trim(),
        description: newCollection.description.trim(),
        orgId: newCollection.orgId.trim() || null,
        teamId: newCollection.teamId.trim() || null,
        chunkCount: 0,
        chunks: [],
      }]);
      setNewCollection(EMPTY_NEW_COLLECTION);
      setShowAddCollection(false);
      setSuccess(vi ? 'Đã thêm bộ sưu tập.' : 'Collection added.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add collection.');
    } finally {
      setAddingCollection(false);
    }
  };

  const deleteCollection = async (collectionId: string) => {
    setDeletingId(collectionId);
    setError(null);
    try {
      const res = await fetch(`/api/admin/knowledge/collections/${encodeURIComponent(collectionId)}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error ?? 'Failed to delete collection.');
      setCollections(current => current.filter(c => c.id !== collectionId));
      setSuccess(vi ? 'Đã xóa bộ sưu tập.' : 'Collection deleted.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete collection.');
    } finally {
      setDeletingId(null);
    }
  };

  const addChunk = async (collectionId: string) => {
    if (!newChunk.id.trim() || !newChunk.content.trim()) {
      setError(vi ? 'ID và nội dung đoạn dữ liệu là bắt buộc.' : 'Chunk ID and content are required.');
      return;
    }
    setAddingChunk(true);
    setError(null);
    try {
      const keywords = newChunk.keywords.split(',').map(k => k.trim()).filter(Boolean);
      const res = await fetch(`/api/admin/knowledge/collections/${encodeURIComponent(collectionId)}/chunks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: newChunk.id.trim(), content: newChunk.content.trim(), keywords }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error ?? 'Failed to add chunk.');
      const chunk: KnowledgeChunkView = { id: newChunk.id.trim(), content: newChunk.content.trim(), keywords };
      setCollections(current => current.map(c => c.id === collectionId
        ? { ...c, chunkCount: c.chunkCount + 1, chunks: [...(c.chunks ?? []), chunk] }
        : c));
      setNewChunk(EMPTY_NEW_CHUNK);
      setAddChunkForId(null);
      setSuccess(vi ? 'Đã thêm đoạn dữ liệu.' : 'Chunk added.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add chunk.');
    } finally {
      setAddingChunk(false);
    }
  };

  const deleteChunk = async (collectionId: string, chunkId: string) => {
    setError(null);
    try {
      const res = await fetch(
        `/api/admin/knowledge/collections/${encodeURIComponent(collectionId)}/chunks/${encodeURIComponent(chunkId)}`,
        { method: 'DELETE' },
      );
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error ?? 'Failed to delete chunk.');
      setCollections(current => current.map(c => c.id === collectionId
        ? { ...c, chunkCount: Math.max(0, c.chunkCount - 1), chunks: (c.chunks ?? []).filter(ch => ch.id !== chunkId) }
        : c));
      setSuccess(vi ? 'Đã xóa đoạn dữ liệu.' : 'Chunk deleted.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete chunk.');
    }
  };

  const organizationsById = useMemo(
    () => new Map(organizations.map(org => [org.id, org])),
    [organizations],
  );
  const teamsById = useMemo(
    () => new Map(teams.map(team => [team.id, team])),
    [teams],
  );

  const updateCollection = (
    collectionId: string,
    patch: Partial<Pick<KnowledgeCollectionView, 'orgId' | 'teamId'>>,
  ) => {
    setCollections(current => current.map(collection => {
      if (collection.id !== collectionId) return collection;
      return { ...collection, ...patch };
    }));
    setError(null);
    setSuccess(null);
  };

  const saveScope = async (collectionId: string) => {
    const collection = collections.find(entry => entry.id === collectionId);
    if (!collection) return;

    setSavingCollectionId(collectionId);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/admin/tool-registry/knowledge-scope', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          collectionId: collection.id,
          orgId: collection.orgId,
          teamId: collection.teamId,
        }),
      });
      const payload = await response.json();

      if (!response.ok || !payload?.success) {
        throw new Error(payload?.error || (vi ? 'Không thể cập nhật phạm vi dữ liệu.' : 'Failed to update knowledge collection scope.'));
      }

      setCollections(current => current.map(entry => (
        entry.id === collectionId
          ? {
            ...entry,
            orgId: payload.data.orgId,
            teamId: payload.data.teamId,
          }
          : entry
      )));
      setSuccess(vi ? `Đã lưu phạm vi cho ${collection.name}.` : `Saved scope for ${collection.name}.`);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : (vi ? 'Không thể cập nhật phạm vi dữ liệu.' : 'Failed to update knowledge collection scope.'));
    } finally {
      setSavingCollectionId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-sky-200 bg-sky-50 p-5 text-sm text-sky-900 shadow-sm dark:border-sky-900/40 dark:bg-sky-950/30 dark:text-sky-100">
        <div className="font-semibold">
          {vi ? 'Phạm vi dữ liệu đang được áp dụng trực tiếp khi chạy AI' : 'Knowledge scope is enforced at runtime'}
        </div>
        <p className="mt-2">
          {vi
            ? 'Mỗi bộ sưu tập bên dưới quyết định tổ chức hoặc nhóm nào được phép đóng góp ngữ cảnh vào câu trả lời AI.'
            : 'Each collection below decides which organization or team may contribute context to AI responses.'}
        </p>
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => { setShowAddCollection(s => !s); setError(null); setSuccess(null); }}
          className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500"
        >
          {vi ? '+ Thêm bộ sưu tập' : '+ Add Collection'}
        </button>
      </div>

      {showAddCollection && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 dark:border-emerald-900/40 dark:bg-emerald-950/20">
          <h4 className="mb-3 text-sm font-semibold text-emerald-900 dark:text-emerald-100">
            {vi ? 'Bộ sưu tập mới' : 'New Collection'}
          </h4>
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              type="text" placeholder={vi ? 'ID (bắt buộc)' : 'ID (required)'}
              value={newCollection.id}
              onChange={e => setNewCollection(c => ({ ...c, id: e.target.value }))}
              className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-950"
            />
            <input
              type="text" placeholder={vi ? 'Tên (bắt buộc)' : 'Name (required)'}
              value={newCollection.name}
              onChange={e => setNewCollection(c => ({ ...c, name: e.target.value }))}
              className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-950"
            />
            <input
              type="text" placeholder={vi ? 'Mô tả' : 'Description'}
              value={newCollection.description}
              onChange={e => setNewCollection(c => ({ ...c, description: e.target.value }))}
              className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-950"
            />
            <input
              type="text" placeholder={vi ? 'orgId (tuỳ chọn)' : 'orgId (optional)'}
              value={newCollection.orgId}
              onChange={e => setNewCollection(c => ({ ...c, orgId: e.target.value }))}
              className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-950"
            />
            <input
              type="text" placeholder={vi ? 'teamId (tuỳ chọn)' : 'teamId (optional)'}
              value={newCollection.teamId}
              onChange={e => setNewCollection(c => ({ ...c, teamId: e.target.value }))}
              className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-950"
            />
          </div>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={addCollection}
              disabled={addingCollection}
              className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:opacity-60"
            >
              {addingCollection ? (vi ? 'Đang thêm...' : 'Adding...') : (vi ? 'Xác nhận' : 'Confirm')}
            </button>
            <button
              type="button"
              onClick={() => { setShowAddCollection(false); setNewCollection(EMPTY_NEW_COLLECTION); }}
              className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
            >
              {vi ? 'Hủy' : 'Cancel'}
            </button>
          </div>
        </div>
      )}

      <div className="grid gap-4 xl:grid-cols-2">
        {collections.map(collection => {
          const availableTeams = collection.orgId
            ? teams.filter(team => team.orgId === collection.orgId)
            : teams;

          return (
            <article
              key={collection.id}
              className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-900"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="text-sm text-gray-500">
                    {vi ? `Số đoạn dữ liệu: ${collection.chunkCount}` : `Chunks: ${collection.chunkCount}`}
                  </div>
                  <h3 className="mt-1 text-xl font-semibold text-gray-900 dark:text-white">{collection.name}</h3>
                </div>
                <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-700 dark:bg-sky-900/30 dark:text-sky-300">
                  {collection.teamId
                    ? (vi ? 'THEO NHÓM' : 'TEAM ONLY')
                    : collection.orgId
                      ? (vi ? 'THEO TỔ CHỨC' : 'ORG ONLY')
                      : (vi ? 'TOÀN CỤC' : 'GLOBAL')}
                </span>
              </div>

              <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">{collection.description}</p>

              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <label className="text-sm">
                  <span className="mb-2 block font-medium text-gray-700 dark:text-gray-200">
                    {vi ? 'Phạm vi tổ chức' : 'Organization scope'}
                  </span>
                  <select
                    value={collection.orgId ?? ''}
                    onChange={event => updateCollection(collection.id, {
                      orgId: event.target.value || null,
                      teamId: collection.teamId && teamsById.get(collection.teamId)?.orgId === event.target.value
                        ? collection.teamId
                        : null,
                    })}
                    className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-950"
                  >
                    <option value="">{vi ? 'Toàn cục (mọi tổ chức)' : 'Global (all orgs)'}</option>
                    {organizations.map(org => (
                      <option key={org.id} value={org.id}>{org.name}</option>
                    ))}
                  </select>
                </label>

                <label className="text-sm">
                  <span className="mb-2 block font-medium text-gray-700 dark:text-gray-200">
                    {vi ? 'Phạm vi nhóm' : 'Team scope'}
                  </span>
                  <select
                    value={collection.teamId ?? ''}
                    onChange={event => {
                      const nextTeamId = event.target.value || null;
                      const nextTeam = nextTeamId ? teamsById.get(nextTeamId) : null;
                      updateCollection(collection.id, {
                        teamId: nextTeamId,
                        orgId: nextTeam?.orgId ?? collection.orgId,
                      });
                    }}
                    className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-950"
                  >
                    <option value="">{vi ? 'Không giới hạn nhóm' : 'No team restriction'}</option>
                    {availableTeams.map(team => (
                      <option key={team.id} value={team.id}>{team.name}</option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="mt-4 rounded-xl bg-gray-50 px-4 py-3 text-sm dark:bg-gray-800">
                <div className="font-medium text-gray-900 dark:text-white">
                  {vi ? 'Phạm vi đang áp dụng' : 'Effective scope'}
                </div>
                <div className="mt-1 text-gray-600 dark:text-gray-300">
                  {collection.teamId
                    ? `${organizationsById.get(collection.orgId ?? '')?.name ?? collection.orgId} / ${teamsById.get(collection.teamId)?.name ?? collection.teamId}`
                    : collection.orgId
                      ? `${organizationsById.get(collection.orgId)?.name ?? collection.orgId} / ${vi ? 'mọi nhóm' : 'all teams'}`
                      : (vi ? 'Toàn cục — hiển thị cho mọi tổ chức và nhóm' : 'Global — visible to all orgs and teams')}
                </div>
              </div>

              <div className="mt-4 flex gap-2">
                <button
                  type="button"
                  onClick={() => saveScope(collection.id)}
                  disabled={savingCollectionId === collection.id}
                  className="flex-1 rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-500 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {savingCollectionId === collection.id ? (vi ? 'Đang lưu...' : 'Saving...') : (vi ? 'Lưu phạm vi' : 'Save scope')}
                </button>
                <button
                  type="button"
                  onClick={() => deleteCollection(collection.id)}
                  disabled={deletingId === collection.id}
                  className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-700 transition hover:bg-red-100 disabled:opacity-60 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300"
                >
                  {deletingId === collection.id ? (vi ? 'Đang xóa...' : 'Deleting...') : (vi ? 'Xóa' : 'Delete')}
                </button>
              </div>

              {(collection.chunks ?? []).length > 0 && (
                <div className="mt-4 space-y-1">
                  <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    {vi ? 'Đoạn dữ liệu' : 'Chunks'}
                  </div>
                  {(collection.chunks ?? []).map(chunk => (
                    <div key={chunk.id} className="flex items-start gap-2 rounded-xl bg-gray-50 px-3 py-2 text-sm dark:bg-gray-800">
                      <div className="flex-1 min-w-0">
                        <span className="font-mono text-xs text-gray-400">{chunk.id}</span>
                        <p className="mt-0.5 text-gray-700 dark:text-gray-200 line-clamp-2">{chunk.content}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => deleteChunk(collection.id, chunk.id)}
                        className="shrink-0 rounded-lg px-2 py-1 text-xs font-semibold text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40"
                      >
                        {vi ? 'Xóa' : 'Del'}
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {addChunkForId === collection.id ? (
                <div className="mt-3 space-y-2">
                  <input
                    type="text" placeholder={vi ? 'Chunk ID (bắt buộc)' : 'Chunk ID (required)'}
                    value={newChunk.id}
                    onChange={e => setNewChunk(c => ({ ...c, id: e.target.value }))}
                    className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-950"
                  />
                  <textarea
                    placeholder={vi ? 'Nội dung (bắt buộc)' : 'Content (required)'}
                    value={newChunk.content}
                    onChange={e => setNewChunk(c => ({ ...c, content: e.target.value }))}
                    rows={2}
                    className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-950"
                  />
                  <input
                    type="text" placeholder={vi ? 'Keywords (cách bởi dấu phẩy)' : 'Keywords (comma-separated)'}
                    value={newChunk.keywords}
                    onChange={e => setNewChunk(c => ({ ...c, keywords: e.target.value }))}
                    className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-950"
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => addChunk(collection.id)}
                      disabled={addingChunk}
                      className="rounded-xl bg-sky-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-sky-500 disabled:opacity-60"
                    >
                      {addingChunk ? (vi ? 'Đang thêm...' : 'Adding...') : (vi ? 'Thêm đoạn' : 'Add Chunk')}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setAddChunkForId(null); setNewChunk(EMPTY_NEW_CHUNK); }}
                      className="rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-600 transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900"
                    >
                      {vi ? 'Hủy' : 'Cancel'}
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => { setAddChunkForId(collection.id); setNewChunk(EMPTY_NEW_CHUNK); }}
                  className="mt-3 rounded-xl border border-dashed border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-500 transition hover:border-sky-400 hover:text-sky-600 dark:border-gray-600 dark:text-gray-400"
                >
                  {vi ? '+ Thêm đoạn dữ liệu' : '+ Add Chunk'}
                </button>
              )}
            </article>
          );
        })}
      </div>

      {(error || success) && (
        <div>
          {error && (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-200">
              {error}
            </div>
          )}
          {success && (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-200">
              {success}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
